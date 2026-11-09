const nodemailer = require("nodemailer");

// Escape dynamic values before inserting them into HTML
const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });

const sendProviderHelpMessage = async (req, res) => {
  try {
    const { category, email, message } = req.body;

    // Validate fields
    if (
      !category ||
      !email ||
      !message ||
      !String(category).trim() ||
      !String(email).trim() ||
      !String(message).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    const cleanCategory = String(category).trim();
    const cleanEmail = String(email).trim();
    const cleanMessage = String(message).trim();

    if (
      cleanEmail.length > 254 ||
      cleanMessage.length > 5000 ||
      cleanCategory.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more fields exceed the allowed length.",
      });
    }

    // Check email configuration
    const { EMAIL_USER, EMAIL_PASS, ADMIN_EMAIL } = process.env;

    if (!EMAIL_USER || !EMAIL_PASS || !ADMIN_EMAIL) {
      console.error("Provider help email settings are missing:", {
        EMAIL_USER: Boolean(EMAIL_USER),
        EMAIL_PASS: Boolean(EMAIL_PASS),
        ADMIN_EMAIL: Boolean(ADMIN_EMAIL),
      });

      return res.status(500).json({
        success: false,
        message: "Email service is not configured.",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    // Provider information from the authenticated user
    const providerName =
      req.user?.name || req.user?.businessName || "Registered Provider";

    const providerEmail = req.user?.email || cleanEmail;

    const safeName = escapeHtml(providerName);
    const safeProviderEmail = escapeHtml(providerEmail);
    const safeContactEmail = escapeHtml(cleanEmail);
    const safeCategory = escapeHtml(cleanCategory);

    // Convert message newlines into HTML line breaks safely
    const safeMessage = escapeHtml(cleanMessage).replace(/\r?\n/g, "<br>");

    const submittedAt = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });

    const subject = `FixNear Provider Help: ${cleanCategory}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FixNear Provider Help</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#172554;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
    style="background:#f1f5f9;padding:28px 12px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
          style="max-width:680px;background:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Branded header -->
          <tr>
            <td style="background:#eef2ff;padding:28px 32px;border-bottom:1px solid #e0e7ff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size:29px;font-weight:800;letter-spacing:-1px;color:#4338ca;">
                      FixNear
                    </div>
                    <div style="font-size:12px;color:#64748b;margin-top:5px;">
                      Trusted Service. Better Living.
                    </div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;background:#ffffff;color:#4338ca;
                      border:1px solid #c7d2fe;border-radius:20px;padding:9px 12px;
                      font-size:12px;font-weight:700;">
                      PROVIDER SUPPORT
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main introduction -->
          <tr>
            <td style="padding:32px 32px 16px;">
              <div style="font-size:24px;font-weight:700;color:#0f172a;">
                Hello Admin,
              </div>

              <p style="margin:12px 0 0;font-size:15px;line-height:1.8;color:#64748b;">
                A provider has submitted a help request through FixNear.
                Review the request details below and reply to the provider when ready.
              </p>
            </td>
          </tr>

          <!-- Request details -->
          <tr>
            <td style="padding:12px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                style="border:1px solid #e2e8f0;border-radius:12px;">

                <tr>
                  <td colspan="2" style="padding:20px 20px 16px;border-bottom:1px solid #e2e8f0;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:#6366f1;">
                      NEW HELP REQUEST
                    </div>
                    <div style="font-size:20px;font-weight:700;color:#0f172a;margin-top:7px;">
                      Provider Support Request
                    </div>
                    <div style="margin-top:12px;">
                      <span style="display:inline-block;background:#eef2ff;color:#4338ca;
                        padding:7px 11px;border-radius:7px;font-size:12px;font-weight:700;">
                        ${safeCategory}
                      </span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px 20px 8px;width:50%;vertical-align:top;">
                    <div style="font-size:12px;color:#64748b;">Provider name</div>
                    <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:6px;">
                      ${safeName}
                    </div>
                  </td>
                  <td style="padding:18px 20px 8px;width:50%;vertical-align:top;">
                    <div style="font-size:12px;color:#64748b;">Submitted at (IST)</div>
                    <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:6px;">
                      ${escapeHtml(submittedAt)}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td colspan="2" style="padding:12px 20px 20px;">
                    <div style="font-size:12px;color:#64748b;">Provider account email</div>
                    <div style="font-size:14px;color:#334155;margin-top:6px;word-break:break-word;">
                      ${safeProviderEmail}
                    </div>

                    <div style="font-size:12px;color:#64748b;margin-top:16px;">
                      Contact email
                    </div>
                    <div style="font-size:14px;margin-top:6px;word-break:break-word;">
                      <a href="mailto:${escapeHtml(cleanEmail)}"
                        style="color:#4f46e5;text-decoration:none;font-weight:600;">
                        ${safeContactEmail}
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Provider message -->
          <tr>
            <td style="padding:12px 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                style="background:#f8faff;border:1px solid #e0e7ff;border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <div style="font-size:16px;font-weight:700;color:#3730a3;margin-bottom:12px;">
                      Provider's message
                    </div>

                    <div style="font-size:14px;line-height:1.9;color:#334155;overflow-wrap:anywhere;">
                      ${safeMessage}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Reply action -->
          <tr>
            <td align="center" style="padding:0 32px 32px;">
              <a href="mailto:${escapeHtml(cleanEmail)}?subject=${encodeURIComponent(
                `Re: ${subject}`,
              )}"
                style="display:inline-block;background:#4f46e5;color:#ffffff;
                text-decoration:none;font-size:14px;font-weight:700;
                padding:14px 24px;border-radius:9px;">
                Reply to Provider &rarr;
              </a>

              <p style="font-size:12px;color:#64748b;line-height:1.7;margin:16px 0 0;">
                This button opens your email app to reply directly to the provider.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:22px 32px;">
              <div style="font-size:18px;font-weight:800;color:#4338ca;">
                FixNear
              </div>

              <p style="font-size:12px;line-height:1.8;color:#64748b;margin:8px 0;">
                Connecting skilled providers with happier customers.
              </p>

              <p style="font-size:11px;line-height:1.7;color:#94a3b8;margin:14px 0 0;">
                This is an automated notification from FixNear.
                Please do not reply directly to this notification email.
                Use the provider's contact email above instead.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

    // Plain-text fallback for email clients that do not display HTML
    const text = `
FIXNEAR — PROVIDER SUPPORT REQUEST

Hello Admin,

A provider has submitted a help request through FixNear.

Provider: ${providerName}
Provider account email: ${providerEmail}
Contact email: ${cleanEmail}
Issue category: ${cleanCategory}
Submitted at (IST): ${submittedAt}

MESSAGE
${cleanMessage}

Reply directly to the provider at: ${cleanEmail}

FixNear Support Team
Trusted Service. Better Living.
    `.trim();

    await transporter.sendMail({
      from: `"FixNear Support" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      replyTo: cleanEmail,
      subject,
      text,
      html,
    });

    return res.status(200).json({
      success: true,
      message: "Your message has been sent to the admin successfully.",
    });
  } catch (error) {
    console.error("Provider help email error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to send your message right now. Please try again later.",
    });
  }
};

module.exports = { sendProviderHelpMessage };
