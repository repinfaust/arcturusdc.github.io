export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const ctype = req.headers.get("content-type") || "";
    let name, email, subject, message, hp = "";

    if (ctype.includes("application/json")) {
      const body = await req.json();
      name = String(body.name || "").trim();
      email = String(body.email || "").trim();
      subject = String(body.subject || "").trim();
      message = String(body.message || "").trim();
      hp = String(body.company || "");
    } else {
      const form = await req.formData();
      name = String(form.get("name") || "").trim();
      email = String(form.get("email") || "").trim();
      subject = String(form.get("subject") || "").trim();
      message = String(form.get("message") || "").trim();
      hp = String(form.get("company") || "");
    }

    if (hp.trim() !== "") return Response.json({ ok: true });
    if (!name || !email || !subject || !message) return Response.json({ ok:false, error:"missing" }, { status:400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ ok:false, error:"email" }, { status:400 });

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      return Response.json({ ok:false, error:"smtp_not_configured" }, { status:503 });
    }

    let nodemailer;
    try {
      nodemailer = (await import("nodemailer")).default;
    } catch {
      return Response.json({ ok:false, error:"email_lib" }, { status:500 });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_SECURE || "").toLowerCase() === "true",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.6;">
        <h2>New contact form submission</h2>
        <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p style="white-space:pre-wrap; border-left:4px solid #eee; padding-left:12px;">${escapeHtml(message)}</p>
        <hr style="margin:16px 0; border:0; border-top:1px solid #eee;" />
        <p style="color:#666; font-size:12px;">Sent from arcturusdc.com</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"arcturusdc.com Contact" <${SMTP_USER}>`,
      replyTo: `${name} <${email}>`,
      to: "info@arcturusdc.com",
      subject: `[arcturusdc.com] ${subject}`,
      text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
      html,
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ ok:false, error:"server" }, { status:500 });
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
