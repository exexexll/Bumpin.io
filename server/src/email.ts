import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@bumpin.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('[Email] SendGrid configured');
} else {
  console.warn('[Email] SendGrid not configured');
}

export async function sendVerificationEmail(
  email: string,
  code: string,
  userName: string
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.error('[Email] SendGrid not configured');
    return false;
  }

  try {
    await sgMail.send({
      to: email,
      from: FROM_EMAIL,
      subject: 'Verify your BUMPIn account',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1 style="color:#ff9b6b;text-align:center;">Verify Your Email</h1>
          <p>Hi ${userName},</p>
          <p>Your verification code is:</p>
          <div style="background:#f5f5f5;padding:30px;text-align:center;margin:20px 0;border-radius:10px;">
            <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#333;">${code}</div>
          </div>
          <p>Expires in <strong>10 minutes</strong>.</p>
          <p style="color:#666;font-size:14px;">Ignore if you didn't request this.</p>
        </div>
      `,
    });
    
    console.log('[Email] Sent to:', email);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed:', error.message);
    return false;
  }
}

