import nodemailer from 'nodemailer';

/**
 * Send email using SMTP configuration from environment variables
 */
export async function sendEmail({ to, subject, html, text }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"STEa" <${SMTP_USER}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

/**
 * Send workspace claim email
 */
export async function sendClaimEmail({ to, workspaceName, claimToken, claimUrl }) {
  const subject = 'Complete your STEa workspace setup';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete your STEa setup</title>
      </head>
      <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #8b5cf6 50%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to STEa!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Thanks for subscribing! Your workspace <strong>${escapeHtml(workspaceName)}</strong> is ready to be set up.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Click the button below to complete your setup and start using STEa:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${claimUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #8b5cf6 50%, #10b981 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Complete Setup
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            Or copy and paste this link into your browser:<br>
            <a href="${claimUrl}" style="color: #8b5cf6; word-break: break-all;">${claimUrl}</a>
          </p>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This link will expire in 7 days. If you didn't sign up for STEa, please ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to STEa!

Thanks for subscribing! Your workspace "${workspaceName}" is ready to be set up.

Complete your setup by visiting:
${claimUrl}

This link will expire in 7 days. If you didn't sign up for STEa, please ignore this email.
  `;

  return sendEmail({ to, subject, html, text });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

