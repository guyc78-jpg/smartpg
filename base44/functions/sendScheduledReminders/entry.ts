import { createClientFromRequest } from 'npm:@base44/sdk';
import webpush from 'npm:web-push@3.6.7';
import { normalizeAllowedPushEndpoint } from './pushEndpointSecurity.js';

const DEFAULT_WEEKDAY = {
  1: ['08:15', '09:05'], 2: ['09:05', '09:50'], 3: ['10:15', '11:00'], 4: ['11:00', '11:45'],
  5: ['12:05', '12:50'], 6: ['12:50', '13:35'], 7: ['13:45', '14:30'], 8: ['14:35', '15:20'],
  9: ['15:25', '16:10'], 10: ['16:10', '16:55'], 11: ['16:55', '17:40'], 12: ['17:40', '18:25'],
};
const DEFAULT_FRIDAY = {
  1: ['08:15', '09:05'], 2: ['09:05', '09:50'], 3: ['10:15', '11:00'], 4: ['11:00', '11:45'],
  5: ['11:50', '12:35'], 6: ['12:35', '13:20'], 7: ['13:25', '14:10'],
};
const WEEKDAY_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function toMinutes(value: unknown) {
  const [hours, minutes] = String(value).split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
}

function ownerKey(value: unknown) {
  return String(value || '').trim().toLowerCase().slice(0, 160);
}

async function listAll(entity: any, sort = '-created_date') {
  const rows = [];
  const pageSize = 1000;
  for (let skip = 0; skip < 50000; skip += pageSize) {
    const page = await entity.list(sort, pageSize, skip);
    rows.push(...(page || []));
    if (!page || page.length < pageSize) break;
  }
  return rows;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (caller.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!publicKey || !privateKey) {
      return Response.json({ error: 'Push notifications are unavailable' }, { status: 503 });
    }

    // Entity RLS deliberately limits this automation to the account that
    // created it. A service-role client would still be an admin identity and
    // must never be treated as a cross-tenant bypass.
    const db = base44.entities;
    const callerOwner = ownerKey(caller.email);
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((part) => part.type === type)?.value;
    const localDate = `${get('year')}-${get('month')}-${get('day')}`;
    const nowMinutes = Number(get('hour')) * 60 + Number(get('minute'));
    const day = WEEKDAY_MAP[get('weekday')];

    const subscriptions = (await listAll(db.PushSubscription))
      .filter((subscription) => ownerKey(subscription.created_by) === callerOwner);
    const subscriptionsByOwner = new Map<string, any[]>();
    for (const subscription of subscriptions) {
      const owner = ownerKey(subscription.created_by);
      if (!owner) continue;
      if (!subscriptionsByOwner.has(owner)) subscriptionsByOwner.set(owner, []);
      subscriptionsByOwner.get(owner).push(subscription);
    }
    if (subscriptionsByOwner.size === 0) {
      return Response.json({ lessonReminders: 0, testReminders: 0, reason: 'no_owned_subscriptions' });
    }

    webpush.setVapidDetails('mailto:notifications@smartpejournal.app', publicKey, privateKey);

    const sendToOwner = async (owner: string, title: unknown, body: unknown, url: string) => {
      let sent = 0;
      for (const subscription of subscriptionsByOwner.get(owner) || []) {
        let endpoint;
        try {
          endpoint = normalizeAllowedPushEndpoint(subscription.endpoint);
        } catch {
          continue;
        }
        try {
          await webpush.sendNotification(
            { endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
            JSON.stringify({ title: String(title).slice(0, 100), body: String(body).slice(0, 300), url }),
          );
          sent += 1;
        } catch (error: any) {
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await db.PushSubscription.delete(subscription.id);
          }
        }
      }
      return sent;
    };

    const alreadySent = async (key: string) => {
      const rows = await db.SentReminder.filter({ key }, '-created_date', 1);
      return rows.length > 0;
    };

    let lessonReminders = 0;
    let testReminders = 0;

    for (const owner of subscriptionsByOwner.keys()) {
      if (day !== 6) {
        const settingsRows = await db.TeacherSettings.filter({ created_by: owner }, '-created_date', 1);
        const bell = settingsRows?.[0]?.bell_schedule || null;
        const times = day === 5
          ? { ...DEFAULT_FRIDAY, ...(bell?.friday || {}) }
          : { ...DEFAULT_WEEKDAY, ...(bell?.weekday || {}) };
        const lessons = await db.TeacherSchedule.filter({ day_of_week: day, created_by: owner });

        for (const lesson of lessons || []) {
          const periodTimes = times[lesson.period];
          if (!periodTimes) continue;
          const start = toMinutes(periodTimes[0]);
          if (start === null) continue;
          const lead = start - nowMinutes;
          if (lead < 1 || lead >= 6) continue;

          const key = `lesson_${localDate}_${lesson.id}`.slice(0, 240);
          if (await alreadySent(key)) continue;
          const sent = await sendToOwner(
            owner,
            `⏰ השיעור מתחיל עוד רגע (${periodTimes[0]})`,
            `כיתה ${lesson.class_name || 'שיעור'} | שעה ${lesson.period} במערכת`,
            '/schedule',
          );
          if (sent > 0) {
            await db.SentReminder.create({ key, date: localDate });
            lessonReminders += 1;
          }
        }
      }

      if (Number(get('hour')) === 19) {
        const [year, month, date] = localDate.split('-').map(Number);
        const tomorrow = new Date(Date.UTC(year, month - 1, date) + 86400000).toISOString().slice(0, 10);
        const tests = await db.TestDefinition.filter({ test_date: tomorrow, created_by: owner });
        for (const test of tests || []) {
          const key = `test_${test.id}_${tomorrow}`.slice(0, 240);
          if (await alreadySent(key)) continue;
          const suffix = test.grade_level ? ` (שכבה ${test.grade_level})` : '';
          const sent = await sendToOwner(owner, '📋 תזכורת: מבדק מחר', `${test.name}${suffix} מתוכנן למחר`, '/manage-tests');
          if (sent > 0) {
            await db.SentReminder.create({ key, date: localDate });
            testReminders += 1;
          }
        }
      }
    }

    return Response.json({ lessonReminders, testReminders, scope: 'automation_owner_only' });
  } catch {
    return Response.json({ error: 'Scheduled reminder processing failed' }, { status: 500 });
  }
});
