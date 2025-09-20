export const dynamic = 'force-dynamic'; // no caching

export async function POST(req) {
  try {
    const form = await req.formData();

    // Honeypot (bots fill this)
    const hp = String(form.get("company") || "");
    if (hp.trim() !== "") {
      return Response.redirect(new URL("/contact?sent=1", req.url), 303);
    }

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const subject = String(form.get("subject") || "").trim();
    const message = String(form.get("message") || "").trim();

    if (!name || !email || !subject || !message) {
      return Response.redirect(new URL("/contact?error=missing", req.url), 303);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.redirect(new URL("/contact?error=email", req.url), 303);
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

    // If SMTP not configured, fall back to mailto (opens user’s mail client)
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      return Response.redirect(
        `mailto:info@arcturusdc.com?subject=${encodeURIComponent(
          `[Website] ${subject}`
        )}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`,
        302
      );
    }

    // Dynamic import so builds don’t fail if dep is temporarily missing
    let nodemailer;
    try {
      nodemailer = (await import("nodemailer")).default;
    } catch {
      return Response.redirect(new URL("/contact?error=email-lib", req.url), 303);
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
      from: `"Website Contact" <${SMTP_USER}>`,
      replyTo: `${name} <${email}>`,
      to: "info@arcturusdc.com",
      subject: `[Website] ${subject}`,
      text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
      html,
    });

    // ✅ Back to the form with a success flag
    return Response.redirect(new URL("/contact?sent=1", req.url), 303);
  } catch (err) {
    console.error(err);
    return Response.redirect(new URL("/contact?error=server", req.url), 303);
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
