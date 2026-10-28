export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INBOX = 'info@arcturusdc.com';
const MAX_BODY_BYTES = 4096;
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const reply = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
});

export async function POST(req) {
  // Browser submissions use this site's origin. No authentication or cookies are needed.
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) {
    return reply({ ok: false, error: 'origin' }, 403);
  }
  if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return reply({ ok: false, error: 'content_type' }, 415);
  }

  let payload;
  try {
    const reader = req.body?.getReader();
    if (!reader) return reply({ ok: false, error: 'invalid' }, 400);
    const chunks = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        return reply({ ok: false, error: 'too_large' }, 413);
      }
      chunks.push(value);
    }
    payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return reply({ ok: false, error: 'invalid' }, 400);
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)
      || Object.keys(payload).some((key) => !['uid', 'website'].includes(key))
      || (payload.website !== undefined && payload.website !== '')
      || typeof payload.uid !== 'string' || !UID.test(payload.uid.trim())) {
    return reply({ ok: false, error: 'invalid' }, 400);
  }
  const uid = payload.uid.trim();
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  const port = Number(SMTP_PORT);
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !Number.isInteger(port) || port < 1 || port > 65535) {
    return reply({ ok: false, error: 'unavailable' }, 503);
  }

  let transporter;
  try {
    const { default: nodemailer } = await import('nodemailer');
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: String(SMTP_SECURE || '').toLowerCase() === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    const result = await transporter.sendMail({
      from: `"Mandrake deletion requests" <${SMTP_USER}>`,
      to: INBOX,
      subject: '[Mandrake] Data deletion request',
      text: `A UID-only cloud data deletion request was submitted on arcturusdc.com.\n\nUID: ${uid}\n\nReview and process through the existing manual deletion procedure. No name or email address was requested. This form does not perform deletion.`,
    });
    if (!result.accepted?.some((address) => String(address).toLowerCase() === INBOX)) {
      return reply({ ok: false, error: 'unavailable' }, 503);
    }
    return reply({ ok: true });
  } catch {
    // SMTP errors can contain the message body. Never log the UID or credentials.
    return reply({ ok: false, error: 'unavailable' }, 503);
  } finally {
    transporter?.close();
  }
}
