import nodemailer from "nodemailer";

// Make sure to set these environment variables in your .env file:
// SMTP_HOST=mail.privateemail.com
// SMTP_PORT=465
// SMTP_USER=your_full_email@yourdomain.com
// SMTP_PASS=your_email_password
// SMTP_SECURE=true

async function main() {
  const to = "alexander.hm404@gmail.com";
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mail.privateemail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== "false", // true for port 465 (SSL)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: "Test Email from Info Board (Namecheap Private Email)",
      text: "This is a test email sent using Namecheap Private Email SMTP.",
      html: "<b>This is a test email sent using Namecheap Private Email SMTP.</b>",
    });
    console.log("Test email sent to:", to);
  } catch (err) {
    console.error("Failed to send email:", err);
    process.exit(1);
  }
}

main();
