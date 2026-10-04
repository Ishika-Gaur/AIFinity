import nodemailer from "nodemailer";
import AdminSettings from "../models/AdminSettings.js";
import User from "../models/User.js";

/**
 * Creates and returns a nodemailer transport instance if SMTP environment
 * variables are configured, or null otherwise.
 */
export const createMailTransport = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
};

/**
 * Resolves the target admin email to receive notifications.
 */
export async function getAdminNotificationEmail() {
  if (process.env.ADMIN_EMAIL) {
    return process.env.ADMIN_EMAIL;
  }

  try {
    const adminSettings = await AdminSettings.findOne();
    if (adminSettings?.general?.supportEmail) {
      return adminSettings.general.supportEmail;
    }

    const adminUser = await User.findOne({ role: "admin" }).select("email");
    if (adminUser?.email) {
      return adminUser.email;
    }
  } catch (err) {
    console.error("[EmailService] Error retrieving admin email:", err.message);
  }

  return "admin@aifinity.ai";
}

/**
 * Sends an email notification to the administrator when a new course request is submitted.
 *
 * NOTE: As per requirements, email failure MUST NOT break course request creation.
 * Any errors are caught and logged appropriately.
 */
export async function sendCourseRequestAdminNotification({ courseRequest, user }) {
  try {
    const adminEmail = await getAdminNotificationEmail();
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    const adminCourseRequestsUrl = `${clientUrl}/admin/course-requests`;

    const courseName = courseRequest.courseName || "Untitled Course";
    const userName = user?.name || "Anonymous Learner";
    const userEmail = user?.email || "Unknown Email";
    const provider = courseRequest.provider || "Not specified";
    const referenceUrl = courseRequest.referenceUrl || "None provided";
    const reason = courseRequest.reason || "No reason provided";
    const additionalDetails = courseRequest.additionalDetails || "None provided";

    const subject = `New Course Request - ${courseName}`;

    const textContent = `
A new course request has been submitted on AIFinity:

Course Name: ${courseName}
Requested By: ${userName}
User Email: ${userEmail}
Provider / Instructor: ${provider}
Reference URL: ${referenceUrl}

Why do you want this course?
${reason}

Additional Details:
${additionalDetails}

Manage requests in the Admin Panel:
${adminCourseRequestsUrl}
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1B332C; background-color: #FBF8F0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #2E4F4226; overflow: hidden; }
    .header { background: #1B332C; color: #ffffff; padding: 24px; text-align: center; }
    .header h2 { margin: 0; color: #E8C547; font-size: 20px; }
    .header p { margin: 4px 0 0; font-size: 13px; color: #EDE6D3; }
    .content { padding: 24px; }
    .field-group { margin-bottom: 16px; border-bottom: 1px solid #f0eee6; padding-bottom: 12px; }
    .field-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #C4952A; letter-spacing: 0.05em; margin-bottom: 4px; }
    .field-value { font-size: 14px; color: #1B332C; word-break: break-word; }
    .cta-container { text-align: center; margin-top: 24px; }
    .button { display: inline-block; background-color: #1B332C; color: #E8C547; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 24px; border-radius: 10px; }
    .footer { background: #F1EDE1; padding: 16px; text-align: center; font-size: 12px; color: #5B6B5F; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Course Request Received</h2>
      <p>A learner has requested a new course track on AIFinity</p>
    </div>
    <div class="content">
      <div class="field-group">
        <div class="field-label">Course Name</div>
        <div class="field-value" style="font-size: 16px; font-weight: 700;">${escapeHtml(courseName)}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Requested By</div>
        <div class="field-value">${escapeHtml(userName)} &lt;${escapeHtml(userEmail)}&gt;</div>
      </div>
      <div class="field-group">
        <div class="field-label">Provider / Instructor</div>
        <div class="field-value">${escapeHtml(provider)}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Reference URL</div>
        <div class="field-value">
          ${courseRequest.referenceUrl ? `<a href="${escapeHtml(courseRequest.referenceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(courseRequest.referenceUrl)}</a>` : "None"}
        </div>
      </div>
      <div class="field-group">
        <div class="field-label">Why do you want this course?</div>
        <div class="field-value" style="white-space: pre-wrap;">${escapeHtml(reason)}</div>
      </div>
      <div class="field-group" style="border-bottom: none;">
        <div class="field-label">Additional Details</div>
        <div class="field-value" style="white-space: pre-wrap;">${escapeHtml(additionalDetails)}</div>
      </div>

      <div class="cta-container">
        <a href="${adminCourseRequestsUrl}" class="button" target="_blank">Review in Admin Panel &rarr;</a>
      </div>
    </div>
    <div class="footer">
      AIFinity Intelligent Learning Platform &bull; Automated Admin Notification
    </div>
  </div>
</body>
</html>
`.trim();

    const transport = createMailTransport();

    if (!transport) {
      console.log(`\n======================================================`);
      console.log(`[AIFINITY EMAIL SIMULATION] New Course Request Notification`);
      console.log(`To Admin: ${adminEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Course: ${courseName} | By: ${userName} (${userEmail})`);
      console.log(`Reason: ${reason}`);
      console.log(`Admin Link: ${adminCourseRequestsUrl}`);
      console.log(`======================================================\n`);
      return { success: true, simulated: true };
    }

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER || "AIFinity <no-reply@aifinity.ai>",
      to: adminEmail,
      subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`[EmailService] Admin notification sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    // Non-blocking: log the error and allow caller to proceed
    console.error("[EmailService] Failed to send course request admin notification:", err.message);
    return { success: false, error: err.message };
  }
}

function escapeHtml(string) {
  if (!string) return "";
  return String(string)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
