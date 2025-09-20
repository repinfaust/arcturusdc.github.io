export const dynamic = 'force-dynamic'; // no caching

export async function POST(req) {
  try {
    const form = await req.formData();

    // Honeypot
    const hp = String(form.get("company") || "");
    if (hp.trim() !== "") {
      return Response.json({ ok: true });
    }

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const subject = String(form.get("subject") || "").trim();
    const message = String(form.get("message") || "").trim();

    if (!name || !email || !subject || !message) {
      return Response.json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ ok: false, error: "Invalid email address." }, { status: 400 });
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

    // If SMTP not set, or nodemailer not present, fall back gracefully
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      return Response.redirect(
        `mailto:info@arcturusdc.com?subject=${encodeURIComponent(
          `[Website] ${subject}`
        )}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`
      );
    }

    // Try dynamic import so build doesn't choke if package is absent
    let nodemailer;
    try {
      nodemailer = (await import("nodemailer")).default;
    } catch (e) {
      console.warn("nodemailer not installed; falling back to mailto redirect.");
      return Response.redirect(
        `mailto:info@arcturusdc.com?subject=${encodeURIComponent(
          `[Website] ${subject}`
        )}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`
      );
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_SECURE || "").toLowerCase() === "true",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.6; color:#111;">
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

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
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
