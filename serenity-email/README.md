# 🦷 Serenity Dental — EOM Email Automation

Automated end-of-month email system that:
- Emails **Dr. Katie** every Wednesday before the last Thursday (task review reminder)
- Emails **Alex** every last Thursday morning (EOM report link + monthly task list)

---

## 📋 Setup Instructions

### Step 1 — Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2 — Create a Vercel KV Store
1. Go to [vercel.com](https://vercel.com) → your project → **Storage** tab
2. Click **Create Database** → choose **KV**
3. Follow the prompts — Vercel will auto-add the KV environment variables

### Step 3 — Set Environment Variables in Vercel
In your Vercel project dashboard → **Settings** → **Environment Variables**, add:

| Variable | Value |
|---|---|
| `CRON_SECRET` | Any random string (e.g. `abc123xyz`) — keeps cron endpoint secure |
| `APP_URL` | Your deployed Vercel URL (e.g. `https://serenity-eom.vercel.app`) |

### Step 4 — Deploy
```bash
cd serenity-email
npm install
vercel --prod
```

### Step 5 — Connect Gmail MCP
Make sure your Anthropic Claude account has Gmail connected at:
https://claude.ai → Settings → Integrations → Gmail

The API calls in this app use your connected Gmail to send emails automatically.

---

## 🕐 Schedule
The cron job runs daily at **8:00 AM UTC (4:00 AM Eastern)**. 

> **Note:** If you want it to run at a different Eastern time, update the cron schedule in `vercel.json`.
> - 8 AM Eastern = `0 13 * * *` (UTC)
> - 9 AM Eastern = `0 14 * * *` (UTC)

---

## 📁 File Structure
```
serenity-email/
├── api/
│   ├── cron.js          # Daily cron — sends Wednesday & Thursday emails
│   ├── tasks.js         # GET/POST tasks per month (stored in Vercel KV)
│   └── send-test.js     # Manual test sends
├── lib/
│   ├── tasks.js         # Default task list (fallback if KV is empty)
│   └── utils.js         # Date helpers, email formatters
├── public/
│   └── index.html       # Task manager web UI
├── vercel.json          # Cron config + env vars
└── package.json
```

---

## ✏️ Updating Tasks
Visit your deployed app URL to edit tasks for any month.
Changes are saved to Vercel KV and used in the next scheduled email.

---

## 📧 Email Recipients
- **Dr. Katie (reminder):** drkatie@serenitydentalga.com
- **Alex (EOM report):** alex@serenitydentalga.com
- **Form link:** https://docs.google.com/forms/d/e/1FAIpQLScz82pRo4kOxpVGio_QArXJV2VPWBLuxz15ev4WGbuQZwDjIQ/viewform
