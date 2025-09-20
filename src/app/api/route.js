export const dynamic = 'force-dynamic'; // ensure no caching

import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const form = await req.formData();

    // Honeypot check
    const hp = String(form.get("company") || "");
    if (hp.trim() !== "") {
      // Silently accept but drop
      return Response.json({ ok: true });
    }

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const subject = String(form.get("subject") || "").trim();
    const message = String(form.get("message") || "").trim();

    if (!name || !email || !subject || !message) {
      return Response.json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }

    // Basic email sanity check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ ok: false, error: "Invalid email address." }, { status: 400 });
    }

    // Grab SMTP config from env
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      console.warn("SMTP not configured. Falling back to mailto redirect.");
      return Response.redirect(
        `mailto:info@arcturusdc.com?subject=${encodeURIComponent(
          `[Website] ${subject}`
        )}&body=${encodeURIComponent(
          `Name: ${name}\nEmail: ${email}\n\n${message}`
        )}`
      );
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_SECURE || "").toLowerCase() === "true",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const toAddress = "info@arcturusdc.com";

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.6; color:#111;">
        <h2>New contact form submission</h2>
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p style="white-space:pre-wrap; border-left:4px solid #eee; padding-left:12px;">${escapeHtml(message)}</p>
        <hr style="margin:16px 0; border:0; border-top:1px solid #eee;" />
        <p style="color:#666; font-size:12px;">Sent from arcturusdc.com</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Website Contact" <${SMTP_USER}>`,
      replyTo: `${name} <${email}>`,
      to: toAddress,
      subject: `[Website] ${subject}`,
      text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
      html,
    });

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: "Server error" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}

// Helper: escape HTML
function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
