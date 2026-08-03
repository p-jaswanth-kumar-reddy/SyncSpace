const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// Ensure environment variables are loaded
dotenv.config({ quiet: true });

const sendEmail = async (to, subject, text) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.error("❌ EMAIL_USER or EMAIL_PASS environment variable is missing!");
    console.error(`EMAIL_USER: ${emailUser ? "LOADED" : "MISSING"}`);
    console.error(`EMAIL_PASS: ${emailPass ? "LOADED" : "MISSING"}`);
    throw new Error("Email service is missing required credentials (EMAIL_USER or EMAIL_PASS).");
  }

  console.log(`📧 Attempting to send email to: ${to} | Subject: "${subject}"`);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"SyncSpace Team" <${emailUser}>`,
      to,
      subject,
      text,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; max-w: 600px; margin: auto;">
          <h2 style="color: #6366f1; margin-top: 0;">SyncSpace</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #e2e8f0;">${text}</p>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">If you did not request this email, please ignore this message.</p>
        </div>
      `,
    });

    console.log(`✅ Email sent successfully to ${to} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    console.error("Full Nodemailer error stack trace:", error);
    throw error;
  }
};

module.exports = sendEmail;