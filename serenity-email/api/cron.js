// api/cron.js
// Vercel Cron Job — runs daily at 8:00 AM Eastern
// Configured in vercel.json

const { MONTHLY_TASKS } = require('../lib/tasks');
const {
  MONTH_NAMES,
  isLastThursday,
  isWednesdayBeforeLastThursday,
  formatTasksHtml,
  formatTasksText
} = require('../lib/utils');

const FORM_FILL_LINK = "https://docs.google.com/forms/d/e/1FAIpQLScz82pRo4kOxpVGio_QArXJV2VPWBLuxz15ev4WGbuQZwDjIQ/viewform";
const OFFICE_MANAGER_EMAIL = "alex@serenitydentalga.com";
const DR_KATIE_EMAIL = "drkatie@serenitydentalga.com";
const GMAIL_MCP_URL = "https://gmail.mcp.claude.com/mcp";

async function sendEmail({ to, subject, htmlBody }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      mcp_servers: [{ type: "url", url: GMAIL_MCP_URL, name: "gmail-mcp" }],
      messages: [{
        role: "user",
        content: `Send an email using Gmail with these exact details:
To: ${to}
Subject: ${subject}
Body (HTML): ${htmlBody}

Please send it now.`
      }]
    })
  });
  const data = await response.json();
  return data;
}

export default async function handler(req, res) {
  // Verify this is called by Vercel cron (or manually triggered)
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  const monthName = MONTH_NAMES[month - 1];
  const tasks = MONTHLY_TASKS[month] || [];

  // --- WEDNESDAY: Send reminder to Dr. Katie ---
  if (isWednesdayBeforeLastThursday()) {
    const tasksText = formatTasksText(tasks);
    const subject = `[Action Needed] Tomorrow's EOM Email to Alex — Review Task List`;
    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <div style="background:#2C5F8A;padding:20px 30px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;">🗓️ EOM Email Sends Tomorrow</h2>
          <p style="color:#cce0f5;margin:6px 0 0;">Serenity Dental — Monthly Reminder</p>
        </div>
        <div style="background:#f9f9f9;padding:24px 30px;border-radius:0 0 8px 8px;border:1px solid #e0e0e0;border-top:none;">
          <p>Hi Dr. Katie,</p>
          <p>Tomorrow morning (last Thursday of ${monthName}), the automated email will go out to <strong>Alex</strong> with the end-of-month report link and the task list below.</p>

          <h3 style="color:#2C5F8A;border-bottom:2px solid #e0e0e0;padding-bottom:8px;">📋 ${monthName} Task List</h3>
          ${formatTasksHtml(tasks, monthName)}

          <div style="background:#fff8e1;border-left:4px solid #FFC107;padding:14px 18px;margin:20px 0;border-radius:4px;">
            <strong>Need to make changes?</strong><br/>
            Visit your task manager to add, remove, or edit tasks before tomorrow's send:<br/>
            <a href="${process.env.APP_URL}/manage" style="color:#2C5F8A;font-weight:bold;">${process.env.APP_URL}/manage</a>
          </div>

          <p style="color:#888;font-size:13px;">If no changes are needed, no action required — the email will send automatically tomorrow morning.</p>
        </div>
      </div>
    `;
    await sendEmail({ to: DR_KATIE_EMAIL, subject, htmlBody });
    return res.status(200).json({ sent: 'wednesday-reminder', month: monthName });
  }

  // --- THURSDAY: Send EOM email to Alex ---
  if (isLastThursday()) {
    const subject = `📋 ${monthName} End-of-Month Report — Action Required`;
    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <div style="background:#2C5F8A;padding:20px 30px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;">Serenity Dental</h2>
          <p style="color:#cce0f5;margin:6px 0 0;">${monthName} End-of-Month Report</p>
        </div>
        <div style="background:#f9f9f9;padding:24px 30px;border-radius:0 0 8px 8px;border:1px solid #e0e0e0;border-top:none;">
          <p>Hi Alex,</p>
          <p>It's that time of the month! Please complete the <strong>${monthName} End-of-Month Report</strong> at your earliest convenience.</p>

          <div style="text-align:center;margin:24px 0;">
            <a href="${FORM_FILL_LINK}"
               style="background:#2C5F8A;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">
              📝 Fill Out ${monthName} EOM Report
            </a>
          </div>

          ${tasks.length > 0 ? `
          <h3 style="color:#2C5F8A;border-bottom:2px solid #e0e0e0;padding-bottom:8px;">⭐ ${monthName} Special Tasks</h3>
          <p>In addition to the standard report, please make sure the following items are completed this month:</p>
          ${formatTasksHtml(tasks, monthName)}
          ` : `
          <p style="color:#666;font-style:italic;">No special tasks this month beyond the standard report. Thank you!</p>
          `}

          <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;"/>
          <p style="color:#888;font-size:13px;">This is an automated monthly reminder from Serenity Dental. Please reach out to Dr. Katie if you have any questions.</p>
        </div>
      </div>
    `;
    await sendEmail({ to: OFFICE_MANAGER_EMAIL, subject, htmlBody });
    return res.status(200).json({ sent: 'thursday-eom-email', month: monthName });
  }

  return res.status(200).json({ message: 'No email to send today', date: now.toDateString() });
}
