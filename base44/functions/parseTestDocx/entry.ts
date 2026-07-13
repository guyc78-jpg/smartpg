import { createClientFromRequest } from 'npm:@base44/sdk';
import mammoth from 'npm:mammoth@1.8.0';
import { Buffer } from 'node:buffer';

const MAX_DOCX_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15000;

class RequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function isApprovedFileHost(hostname: string) {
  const host = hostname.toLowerCase();
  const configured = (Deno.env.get('BASE44_ALLOWED_FILE_HOSTS') || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return host === 'media.base44.com'
    || host === 'base44.app'
    || host.endsWith('.base44.app')
    || host.endsWith('.base44.com')
    || configured.includes(host);
}

async function fetchApprovedDocx(fileUrl: unknown) {
  let parsed: URL;
  try {
    parsed = new URL(String(fileUrl || ''));
  } catch {
    throw new RequestError('Invalid file URL');
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || (parsed.port && parsed.port !== '443')) {
    throw new RequestError('File URL must use HTTPS');
  }
  if (!isApprovedFileHost(parsed.hostname)) throw new RequestError('File host is not approved', 403);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(parsed, { signal: controller.signal, redirect: 'error' });
  } catch {
    throw new RequestError('Unable to fetch file');
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new RequestError('Unable to fetch file');

  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > MAX_DOCX_BYTES) throw new RequestError('File is too large', 413);
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (contentType && !contentType.includes('wordprocessingml') && !contentType.includes('zip') && !contentType.includes('octet-stream')) {
    throw new RequestError('Unsupported file type', 415);
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = response.body?.getReader();
  if (!reader) throw new RequestError('Empty file');
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_DOCX_BYTES) {
      await reader.cancel();
      throw new RequestError('File is too large', 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new RequestError('File is not a valid DOCX document', 415);
  }
  return bytes.buffer;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, raw_only } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });

    const arrayBuffer = await fetchApprovedDocx(file_url);

    const { value: html } = await mammoth.convertToHtml({ buffer: Buffer.from(arrayBuffer) });

    // Convert HTML tables to readable text: rows separated by newlines, cells by |
    const text = html
      .replace(/<\/tr>/g, '\n')
      .replace(/<\/(td|th)>/g, ' | ')
      .replace(/<\/(p|h1|h2|h3|table)>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (raw_only === true) return Response.json({ text: text.slice(0, 30000) });

    const parseVal = (v) => {
      const s = String(v).trim();
      if (s.includes(':')) {
        const [m, sec] = s.split(':');
        return Number(m) * 60 + Number(sec);
      }
      return Number(s);
    };

    // --- Fast deterministic table parsing (skips the LLM when the structure is standard) ---
    const cleanCell = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
    const htmlTables = [...html.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) =>
      [...m[0].matchAll(/<tr[\s\S]*?<\/tr>/g)].map((r) =>
        [...r[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => cleanCell(c[1]))
      )
    );

    const detTests = [];
    for (const table of htmlTables) {
      if (table.length < 4) continue;
      const header = table[0];
      const gradeCol = header.findIndex((h) => h.includes('ציון'));
      if (gradeCol === -1) continue;
      const dataRows = table.slice(1).filter((r) => {
        const g = Number(String(r[gradeCol] || '').trim());
        return Number.isFinite(g) && g > 0 && g <= 100;
      });
      if (dataRows.length < 3) continue;
      for (let col = 0; col < header.length; col++) {
        if (col === gradeCol) continue;
        const name = (header[col] || '').trim();
        if (!name) continue;
        const thresholds = [];
        for (const r of dataRows) {
          const raw = String(r[col] || '').trim();
          if (!raw) continue;
          if (!Number.isFinite(parseVal(raw))) continue;
          thresholds.push({ result: raw, grade: Number(String(r[gradeCol]).trim()) });
        }
        if (thresholds.length < 3) continue;
        const byGrade = [...thresholds].sort((a, b) => a.grade - b.grade);
        const lowerIsBetter = parseVal(byGrade[byGrade.length - 1].result) < parseVal(byGrade[0].result);
        const isTime = thresholds.some((t) => String(t.result).includes(':'));
        detTests.push({ test_name: name, unit: isTime ? 'דקות' : '', lower_is_better: lowerIsBetter, thresholds });
      }
    }

    let result;
    if (detTests.length > 0) {
      result = {
        grade_level: (text.match(/שכבה\s*(יב|יא|[זחטי])/) || [])[1] || '',
        gender: text.includes('בנות') ? 'בנות' : text.includes('בנים') ? 'בנים' : '',
        tests: detTests,
      };
    } else {
      result = await base44.integrations.Core.InvokeLLM({
        prompt: `לפניך תוכן של גיליון מבחני חינוך גופני (אות הכושר) שחולץ מקובץ Word. הטבלאות מוצגות כשורות שבהן תאים מופרדים ב-"|".

מבנה הטבלה: העמודה הראשונה היא "ציון", וכל עמודה נוספת היא מבדק. כל שורה מציינת: כדי לקבל את הציון שבעמודה הראשונה, נדרשת התוצאה שבתא של אותו מבדק.

חלץ עבור כל מבדק את רשימת הספים (תוצאה -> ציון).
כללים:
- שם המבדק הוא שם התרגיל כפי שמופיע בכותרת העמודה (למשל "ריצת 1000 מטרים", "כפיפות בטן בדקה", "קפיצה לרוחק"). "ציון" אינו שם מבדק.
- תוצאות זמן החזר בדיוק כפי שמופיעות, בפורמט דק:שנ (למשל 4:15) או מספר שניות עשרוני (למשל 9.30). תוצאות מספריות (פעמים/מטרים) החזר כמספר.
- דלג על תאים ריקים — כלול רק ספים שיש להם ערך.
- lower_is_better: true אם תוצאה נמוכה יותר טובה (מבדקי זמן/ריצה/זריזות), false אם גבוהה יותר טובה (פעמים, מטרים, מתח).
- unit: יחידת המדידה מהכותרת (שניות/דקות/פעמים/מטרים).

תוכן המסמך:
${text.slice(0, 30000)}`,
        response_json_schema: {
          type: 'object',
          properties: {
            grade_level: { type: 'string', description: 'שכבת הגיל במסמך, למשל ז / ח / ט / י / יא / יב (בלי גרש)' },
            gender: { type: 'string', description: 'בנים או בנות' },
            tests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  test_name: { type: 'string' },
                  unit: { type: 'string' },
                  lower_is_better: { type: 'boolean' },
                  thresholds: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        result: { type: 'string' },
                        grade: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    const formatVal = (num, isTime) => {
      if (!isTime) return num;
      const m = Math.floor(num / 60);
      const s = Math.round(num % 60);
      return `${m}:${String(s).padStart(2, '0')}`;
    };

    const rows = [];
    for (const t of result.tests || []) {
      const thresholds = (t.thresholds || [])
        .filter((th) => th.result != null && String(th.result).trim() !== '' && Number.isFinite(th.grade))
        .map((th) => ({ value: parseVal(th.result), grade: th.grade, isTime: String(th.result).includes(':') }))
        .filter((th) => Number.isFinite(th.value));
      if (thresholds.length === 0) continue;

      const lower = !!t.lower_is_better;
      // sort so ranges are contiguous: by value ascending
      thresholds.sort((a, b) => a.value - b.value);

      for (let i = 0; i < thresholds.length; i++) {
        const th = thresholds[i];
        let min, max;
        if (lower) {
          // lower result = better: range is (prev value, this value]
          min = i === 0 ? 0 : thresholds[i - 1].value + 0.01;
          max = th.value;
        } else {
          // higher result = better: range is [this value, next value)
          min = th.value;
          max = i === thresholds.length - 1 ? th.value * 10 : thresholds[i + 1].value - 0.01;
        }
        rows.push({
          test_name: t.test_name,
          unit: t.unit || '',
          min_result: formatVal(Math.round(min * 100) / 100, th.isTime),
          max_result: formatVal(Math.round(max * 100) / 100, th.isTime),
          grade: th.grade,
        });
      }
    }

    return Response.json({ grade_level: result.grade_level || '', gender: result.gender || '', rows });
  } catch (error) {
    if (error instanceof RequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: 'Document parsing failed' }, { status: 500 });
  }
});
