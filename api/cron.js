// api/cron.js
// Vercel Cron Job — runs daily at 5:00 AM Eastern (10:00 AM UTC)
// Sends email to Dr. Katie on the last Thursday of each month

import { Redis } from '@upstash/redis';
import { MONTHLY_TASKS } from '../lib/tasks.js';
import { MONTH_NAMES, isLastThursday } from '../lib/utils.js';

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const FORM_FILL_LINK = "https://docs.google.com/forms/d/e/1FAIpQLScz82pRo4kOxpVGio_QArXJV2VPWBLuxz15ev4WGbuQZwDjIQ/viewform";
const DR_KATIE_EMAIL = "drkatie@serenitydentalga.com";
const GMAIL_MCP_URL = "https://gmail.mcp.claude.com/mcp";

export default async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!isLastThursday()) {
    return res.status(200).json({ message: 'No email to send today' });
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const monthName = MONTH_NAMES[month - 1];

  let tasks;
  try {
    const kvTasks = await kv.get(`tasks:${month}`);
    tasks = kvTasks !== null ? kvTasks : (MONTHLY_TASKS[month] || []);
  } catch {
    tasks = MONTHLY_TASKS[month] || [];
  }

  const tasksSection = tasks.length > 0
    ? `This month's special tasks that should've been completed:\n\n${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    : `This month's special tasks that should've been completed:\n\n(No special tasks this month)`;

  const emailBody = `Hi Alex,\n\nIt's that time of the month! Please complete the End-of-Month Report by the 5th of next month.\n\nFill Out the EOM Report Here:\n${FORM_FILL_LINK}\n\n${tasksSection}\n\nThank you!`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      mcp_servers: [{ type: "url", url: GMAIL_MCP_URL, name: "gmail-mcp" }],
      messages: [{
        role: "user",
        content: `Please send an email using Gmail with exactly these details:\nTo: ${DR_KATIE_EMAIL}\nSubject: End-of-Month Report\nBody: ${emailBody}\n\nSend it now.`
      }]
    })
  });

  const data = await response.json();
  return res.status(200).json({ sent: true, month: monthName, to: DR_KATIE_EMAIL });
}
