import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import webpush from 'npm:web-push@3.6.7';

// Default bell schedule (mirrors src/lib/periodTimes.js)
const DEFAULT_WEEKDAY = {
  1: ['08:15', '09:05'], 2: ['09:05', '09:50'], 3: ['10:15', '11:00'], 4: ['11:00', '11:45'],
  5: ['12:05', '12:50'], 6: ['12:50', '13:35'], 7: ['13:45', '14:30'], 8: ['14:35', '15:20'],
  9: ['15:25', '16:10'], 10: ['16:10', '16:55'], 11: ['16:55', '17:40'], 12: ['17:40', '18:25'],
};
const DEFAULT_FRIDAY = {
  1: ['08:15', '09:05'], 2: ['09:05', '09:50'], 3: ['10:15', '11:00'], 4: ['11:00', '11:45'],
  5: ['11:50', '12:35'], 6: ['12:35', '13:20'], 7: ['13:25', '14:10'],
};

const WEEKDAY_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function toMinutes(t) {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + m;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;

    // Israel local time
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
    }).formatToParts(new Date());
    const get = (type) => parts.find(p => p.type === type)?.value;
    const localDate = `${get('year')}-${get('month')}-${get('day')}`;
    const nowMinutes = Number(get('hour')) * 60 + Number(get('minute'));
    const day = WEEKDAY_MAP[get('weekday')];

    const subs = await db.PushSubscription.list('-created_date', 100);
    if (!subs || subs.length === 0) return Response.json({ sent: 0, reason: 'no_subscriptions' });

    webpush.setVapidDetails(
      'mailto:notifications@smartpejournal.app',
      Deno.env.get('VAPID_PUBLIC_KEY'),
      Deno.env.get('VAPID_PRIVATE_KEY')
    );

    const sendToAll = async (title, body, url) => {
      const payload = JSON.stringify({ title, body, url: url || '/' });
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await db.PushSubscription.delete(sub.id);
          }
        }
      }
    };

    const alreadySent = async (key) => {
      const rows = await db.SentReminder.filter({ key });
      return rows.length > 0;
    };

    let lessonReminders = 0;
    let testReminders = 0;

    // --- Lesson reminders (~10 minutes before start), Sun-Fri ---
    if (day !== 6) {
      const settingsRows = await db.TeacherSettings.list('-created_date', 10);
      const bell = settingsRows?.[0]?.bell_schedule || null;
      const times = day === 5
        ? { ...DEFAULT_FRIDAY, ...(bell?.friday || {}) }
        : { ...DEFAULT_WEEKDAY, ...(bell?.weekday || {}) };

      const lessons = await db.TeacherSchedule.filter({ day_of_week: day });
      for (const lesson of lessons || []) {
        const t = times[lesson.period];
        if (!t) continue;
        const start = toMinutes(t[0]);
        const lead = start - nowMinutes;
        if (lead < 5 || lead >= 15) continue;

        const key = `lesson_${localDate}_${lesson.period}_${lesson.id}`;
        if (await alreadySent(key)) continue;
        await db.SentReminder.create({ key, date: localDate });

        const who = lesson.class_name || 'שיעור';
        const subject = lesson.subject ? `${lesson.subject} — ` : '';
        await sendToAll(
          `⏰ בעוד כ־${lead} דקות`,
          `${subject}${who} | שעה ${lesson.period} (${t[0]})`,
          '/schedule'
        );
        lessonReminders++;
      }
    }

    // --- Test reminders: evening before (19:00-19:59 local) ---
    if (Number(get('hour')) === 19) {
      const [y, m, d] = localDate.split('-').map(Number);
      const tomorrow = new Date(Date.UTC(y, m - 1, d) + 86400000).toISOString().slice(0, 10);
      const tests = await db.TestDefinition.filter({ test_date: tomorrow });
      for (const test of tests || []) {
        const key = `test_${test.id}_${tomorrow}`;
        if (await alreadySent(key)) continue;
        await db.SentReminder.create({ key, date: localDate });

        const extra = test.grade_level ? ` (שכבה ${test.grade_level})` : '';
        await sendToAll('📋 תזכורת: מבדק מחר', `${test.name}${extra} מתוכנן למחר`, '/manage-tests');
        testReminders++;
      }
    }

    return Response.json({ lessonReminders, testReminders, localDate, nowMinutes, day });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});