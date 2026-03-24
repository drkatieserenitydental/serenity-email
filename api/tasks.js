// api/tasks.js
// GET: returns current tasks for a given month
// POST: updates tasks for a given month (persisted via Upstash Redis)

import { Redis } from '@upstash/redis';
import { MONTHLY_TASKS } from '../lib/tasks';
import { MONTH_NAMES } from '../lib/utils';

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const month = parseInt(req.query.month || (new Date().getMonth() + 1));

  if (req.method === 'GET') {
    // Try KV first (user-edited), fall back to hardcoded defaults
    try {
      const kvTasks = await kv.get(`tasks:${month}`);
      const tasks = kvTasks !== null ? kvTasks : (MONTHLY_TASKS[month] || []);
      return res.status(200).json({
        month,
        monthName: MONTH_NAMES[month - 1],
        tasks
      });
    } catch (e) {
      return res.status(200).json({
        month,
        monthName: MONTH_NAMES[month - 1],
        tasks: MONTHLY_TASKS[month] || []
      });
    }
  }

  if (req.method === 'POST') {
    const { tasks } = req.body;
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'tasks must be an array' });
    }
    await kv.set(`tasks:${month}`, tasks);
    return res.status(200).json({ success: true, month, tasks });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
