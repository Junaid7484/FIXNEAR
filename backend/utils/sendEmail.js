const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

    if (!emailUser || !emailPassword) {
      throw new Error(
        "Email configuration is missing. Set EMAIL_USER and EMAIL_PASSWORD (or EMAIL_PASS).",
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    const mailOptions = {
      from: `"FIXNEAR" <${emailUser}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent:", info.messageId);

    return info;
  } catch (error) {
    console.error("Email Sending Error:", error.message);
    throw error;
  }
};

module.exports = sendEmail;
