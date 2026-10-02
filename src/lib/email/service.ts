import nodemailer from 'nodemailer';

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendResetEmail(to: string, resetToken: string) {
  // In a real environment, you'd use your actual domain
  const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Dashy by TNH" <${SMTP_USER}>`,
    to,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset</h2>
      <p>You requested to reset your admin password.</p>
      <p>Click the link below to set a new password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Reset email sent: %s', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error sending reset email:', error);
    return { error: 'Failed to send reset email' };
  }
}
