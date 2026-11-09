const nodemailer = require("nodemailer");

// =========================================================
// SEND CONTACT MESSAGE
// =========================================================
const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // =======================================================
    // VALIDATION
    // =======================================================
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // =======================================================
    // CREATE EMAIL TRANSPORTER
    // =======================================================
    const transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // =======================================================
    // EMAIL TO FIXNEAR ADMIN
    // =======================================================
    const mailOptions = {
      from: process.env.EMAIL_USER,

      to: process.env.CONTACT_RECEIVER_EMAIL,

      replyTo: email,

      subject: `FIXNEAR Contact Request: ${subject}`,

      text: `
FIXNEAR CONTACT REQUEST
=======================

Name:
${name}

Email:
${email}

Subject:
${subject}

Message:
${message}

=======================
This message was submitted through the FIXNEAR Contact Us form.
      `,

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 700px;
          margin: 0 auto;
          padding: 30px;
          background: #f8fafc;
        ">

          <div style="
            background: #0f172a;
            padding: 25px;
            border-radius: 12px 12px 0 0;
            color: white;
          ">
            <h1 style="
              margin: 0;
              font-size: 28px;
            ">
              FIXNEAR
            </h1>

            <p style="
              margin: 8px 0 0;
              color: #cbd5e1;
            ">
              New Contact Request
            </p>
          </div>

          <div style="
            background: white;
            padding: 30px;
            border: 1px solid #e2e8f0;
            border-top: none;
            border-radius: 0 0 12px 12px;
          ">

            <h2 style="
              color: #0f172a;
              margin-top: 0;
            ">
              Contact Details
            </h2>

            <div style="
              margin-bottom: 18px;
            ">
              <strong>Name:</strong>
              <p style="margin: 5px 0; color: #475569;">
                ${name}
              </p>
            </div>

            <div style="
              margin-bottom: 18px;
            ">
              <strong>Email:</strong>
              <p style="margin: 5px 0; color: #475569;">
                ${email}
              </p>
            </div>

            <div style="
              margin-bottom: 18px;
            ">
              <strong>Subject:</strong>
              <p style="margin: 5px 0; color: #475569;">
                ${subject}
              </p>
            </div>

            <div style="
              margin-bottom: 18px;
            ">
              <strong>Message:</strong>

              <div style="
                margin-top: 8px;
                padding: 15px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                color: #475569;
                line-height: 1.6;
                white-space: pre-wrap;
              ">
                ${message}
              </div>
            </div>

            <hr style="
              border: none;
              border-top: 1px solid #e2e8f0;
              margin: 25px 0;
            " />

            <p style="
              font-size: 13px;
              color: #94a3b8;
              margin: 0;
            ">
              This message was submitted through the FIXNEAR
              Contact Us form.
            </p>

          </div>

        </div>
      `,
    };

    // =======================================================
    // SEND EMAIL
    // =======================================================
    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully.",
    });
  } catch (error) {
    console.error("Contact email error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send your message. Please try again later.",
    });
  }
};

module.exports = {
  sendContactMessage,
};
