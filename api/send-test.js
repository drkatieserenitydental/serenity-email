// api/send-test.js
// Manually trigger a test send — useful for previewing emails
// POST body: { type: "reminder" | "eom", month: 1-12 }

import { Redis } from '@upstash/redis';
const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
import { MONTHLY_TASKS } from '../lib/tasks';
import { MONTH_NAMES, formatTasksHtml } from '../lib/utils';

const FORM_FILL_LINK = "https://docs.google.com/forms/d/e/1FAIpQLScz82pRo4kOxpVGio_QArXJV2VPWBLuxz15ev4WGbuQZwDjIQ/viewform";
const OFFICE_MANAGER_EMAIL = "alex@serenitydentalga.com";
const DR_KATIE_EMAIL = "drkatie@serenitydentalga.com";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { type, month: monthParam } = req.body;
  const month = parseInt(monthParam || (new Date().getMonth() + 1));
  const monthName = MONTH_NAMES[month - 1];

  // Get tasks from KV or fallback to defaults
  let tasks;
  try {
    const kvTasks = await kv.get(`tasks:${month}`);
    tasks = kvTasks !== null ? kvTasks : (MONTHLY_TASKS[month] || []);
  } catch {
    tasks = MONTHLY_TASKS[month] || [];
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      mcp_servers: [{ type: "url", url: "https://gmail.mcp.claude.com/mcp", name: "gmail-mcp" }],
      messages: [{
        role: "user",
        content: type === 'reminder'
          ? `Send an email using Gmail:
To: ${DR_KATIE_EMAIL}
Subject: [TEST] ${monthName} EOM Reminder — Review Task List
Body (HTML): <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
<div style="background:#2C5F8A;padding:20px 30px;border-radius:8px 8px 0 0;"><h2 style="color:white;margin:0;">🗓️ [TEST] EOM Email Preview</h2></div>
<div style="background:#f9f9f9;padding:24px 30px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">
<p>Hi Dr. Katie, this is a <strong>test preview</strong> of the Wednesday reminder for ${monthName}.</p>
<h3 style="color:#2C5F8A;">📋 ${monthName} Task List</h3>
${formatTasksHtml(tasks, monthName)}
<p style="color:#888;font-size:13px;">This was a test send from your task manager app.</p>
</div></div>`
          : `Send an email using Gmail:
To: ${OFFICE_MANAGER_EMAIL}
Subject: [TEST] ${monthName} End-of-Month Report — Action Required
Body (HTML): <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
<div style="background:#2C5F8A;padding:20px 30px;border-radius:8px 8px 0 0;"><h2 style="color:white;margin:0;">Serenity Dental</h2><p style="color:#cce0f5;margin:6px 0 0;">[TEST] ${monthName} End-of-Month Report</p></div>
<div style="background:#f9f9f9;padding:24px 30px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">
<p>Hi Alex, this is a <strong>test email</strong>.</p>
<div style="text-align:center;margin:24px 0;"><a href="${FORM_FILL_LINK}" style="background:#2C5F8A;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;">📝 Fill Out ${monthName} EOM Report</a></div>
${tasks.length > 0 ? `<h3 style="color:#2C5F8A;">⭐ ${monthName} Special Tasks</h3>${formatTasksHtml(tasks, monthName)}` : '<p style="color:#666;font-style:italic;">No special tasks this month.</p>'}
<p style="color:#888;font-size:13px;">This was a test send from your task manager app.</p>
</div></div>`
      }]
    })
  });

  const data = await response.json();
  return res.status(200).json({ success: true, type, month, monthName });
}
