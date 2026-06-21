import { EmailClient, EmailMessage } from "@azure/communication-email";

const FROM_ADDRESS = process.env.AZURE_COMMUNICATION_FROM_EMAIL!;
const APP_NAME = "LankaLearn";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

function getClient(): EmailClient | null {
  if (!process.env.AZURE_COMMUNICATION_CONNECTION_STRING) {
    console.warn("[EMAIL] AZURE_COMMUNICATION_CONNECTION_STRING is not set — emails will be skipped.");
    return null;
  }
  return new EmailClient(process.env.AZURE_COMMUNICATION_CONNECTION_STRING);
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const client = getClient();
  if (!client) {
    console.log("[EMAIL] Skipped (ACS not configured) →", subject, "→", to);
    return;
  }
  if (!FROM_ADDRESS) {
    console.error("[EMAIL_ERROR] AZURE_COMMUNICATION_FROM_EMAIL is not set in .env");
    return;
  }

  try {
    const message: EmailMessage = {
      senderAddress: FROM_ADDRESS,
      recipients: { to: [{ address: to }] },
      content: { subject, html },
    };
    const poller = await client.beginSend(message);
    const result = await poller.pollUntilDone();
    console.log("[EMAIL] Sent successfully:", subject, "→", to, "| status:", result.status);
  } catch (err) {
    console.error("[EMAIL_ERROR] Failed to send:", subject, "→", to);
    console.error(err);
  }
}

// ─── Course approved/rejected email (for instructors) ─────────────────────
export async function sendCourseStatusEmail(params: {
  instructorName: string;
  instructorEmail: string;
  courseTitle: string;
  courseId: string;
  status: "PUBLISHED" | "REJECTED";
  rejectionReason?: string;
}): Promise<void> {
  const { instructorName, instructorEmail, courseTitle, courseId, status, rejectionReason } = params;
  const approved = status === "PUBLISHED";

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
  <body style="margin:0;padding:0;background:#f0f4ff;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 16px;">
      <tr><td align="center">
        <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(29,78,216,0.1);">
          <tr><td style="background:${approved ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "linear-gradient(135deg,#dc2626,#ef4444)"};padding:32px 36px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">${approved ? "✅" : "❌"}</div>
            <h1 style="color:#fff;font-size:20px;margin:0;font-weight:800;">
              Course ${approved ? "Approved!" : "Needs Changes"}
            </h1>
            <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:6px 0 0;">${APP_NAME} Review Team</p>
          </td></tr>
          <tr><td style="padding:32px 36px;">
            <p style="color:#1e293b;font-size:15px;margin:0 0 16px;">Hi <strong>${instructorName}</strong>,</p>
            ${approved ? `
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
              Great news! Your course has been reviewed and <strong style="color:#059669;">approved</strong>. 
              It is now live on the platform and available to students.
            </p>
            ` : `
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
              Your course has been reviewed and requires some changes before it can be published.
            </p>
            ${rejectionReason ? `
            <div style="background:#fff5f5;border:1.5px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:20px;">
              <p style="color:#374151;font-size:13px;font-weight:700;margin:0 0 6px;">Reason:</p>
              <p style="color:#dc2626;font-size:13px;margin:0;line-height:1.6;">${rejectionReason}</p>
            </div>
            ` : ""}
            `}
            <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:24px;">
              <p style="color:#374151;font-size:14px;font-weight:700;margin:0;">📚 &nbsp;${courseTitle}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${APP_URL}/instructor/courses/${courseId}/edit"
                   style="display:inline-block;background:${approved ? "#1d4ed8" : "#dc2626"};color:#fff;font-size:14px;font-weight:700;padding:13px 28px;border-radius:10px;text-decoration:none;">
                  ${approved ? "View Live Course →" : "Edit & Resubmit →"}
                </a>
              </td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:20px 36px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} ${APP_NAME} · Sri Lanka's Digital Learning Platform
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;

  await sendEmail(
    instructorEmail,
    `Your course "${courseTitle}" has been ${approved ? "approved 🎉" : "reviewed"} — ${APP_NAME}`,
    html
  );
}

// ─── Welcome email after registration ─────────────────────────────────────
export async function sendWelcomeEmail(params: { name: string; email: string; role: string }): Promise<void> {
  const { name, email, role } = params;
  const isInstructor = role === "INSTRUCTOR";
  const html = `
  <!DOCTYPE html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#f0f4ff;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 16px;">
      <tr><td align="center">
        <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(29,78,216,0.1);">
          <tr><td style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:32px 36px;text-align:center;">
            <h1 style="color:#fff;font-size:22px;margin:0;font-weight:800;">${APP_NAME}</h1>
          </td></tr>
          <tr><td style="padding:32px 36px;">
            <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Welcome, ${name}! 🎉</h2>
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
              Your account has been created as a <strong>${isInstructor ? "Course Instructor" : "Student"}</strong>.
            </p>
            <table width="100%"><tr><td align="center">
              <a href="${APP_URL}${isInstructor ? "/instructor" : "/courses"}" style="display:inline-block;background:#1d4ed8;color:#fff;font-size:14px;font-weight:700;padding:13px 28px;border-radius:10px;text-decoration:none;">
                ${isInstructor ? "Go to Dashboard →" : "Browse Courses →"}
              </a>
            </td></tr></table>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
  await sendEmail(email, `Welcome to ${APP_NAME}, ${name}!`, html);
}

// ─── Enrollment confirmation email ────────────────────────────────────────
export async function sendEnrollmentEmail(params: {
  name: string; email: string; courseTitle: string; courseId: string; amountPaid: number;
}): Promise<void> {
  const { name, email, courseTitle, courseId, amountPaid } = params;
  const isFree = amountPaid === 0;
  const html = `
  <!DOCTYPE html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#f0f4ff;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 16px;">
      <tr><td align="center">
        <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;">
          <tr><td style="background:linear-gradient(135deg,#059669,#10b981);padding:32px 36px;text-align:center;">
            <h1 style="color:#fff;font-size:20px;margin:0;">Enrollment Confirmed!</h1>
          </td></tr>
          <tr><td style="padding:32px 36px;">
            <p style="color:#1e293b;font-size:15px;margin:0 0 20px;">Hi <strong>${name}</strong>, you're enrolled in:</p>
            <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="color:#374151;font-size:15px;font-weight:700;margin:0;">${courseTitle}</p>
              <p style="color:#64748b;font-size:13px;margin:8px 0 0;">Paid: ${isFree ? "FREE" : `$${amountPaid.toFixed(2)}`}</p>
            </div>
            <table width="100%"><tr><td align="center">
              <a href="${APP_URL}/courses/${courseId}/learn" style="display:inline-block;background:#059669;color:#fff;font-size:14px;font-weight:700;padding:13px 28px;border-radius:10px;text-decoration:none;">
                Start Learning →
              </a>
            </td></tr></table>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
  await sendEmail(email, `You're enrolled in "${courseTitle}" — ${APP_NAME}`, html);
}