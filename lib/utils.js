const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

/**
 * Get the last Thursday of a given month/year
 */
function getLastThursday(year, month) {
  // month is 1-indexed
  const lastDay = new Date(year, month, 0); // last day of month
  const dayOfWeek = lastDay.getDay(); // 0=Sun, 4=Thu
  const diff = (dayOfWeek >= 4) ? dayOfWeek - 4 : dayOfWeek + 3;
  const lastThursday = new Date(lastDay);
  lastThursday.setDate(lastDay.getDate() - diff);
  return lastThursday;
}

/**
 * Returns true if today is the last Thursday of the current month
 */
function isLastThursday() {
  const now = new Date();
  const lastThu = getLastThursday(now.getFullYear(), now.getMonth() + 1);
  return (
    now.getDate() === lastThu.getDate() &&
    now.getMonth() === lastThu.getMonth()
  );
}

/**
 * Returns true if today is the Wednesday before the last Thursday
 */
function isWednesdayBeforeLastThursday() {
  const now = new Date();
  const lastThu = getLastThursday(now.getFullYear(), now.getMonth() + 1);
  const wednesday = new Date(lastThu);
  wednesday.setDate(lastThu.getDate() - 1);
  return (
    now.getDate() === wednesday.getDate() &&
    now.getMonth() === wednesday.getMonth()
  );
}

/**
 * Format tasks as a clean HTML list for the email
 */
function formatTasksHtml(tasks, monthName) {
  if (!tasks || tasks.length === 0) {
    return `<p style="color:#666;">No special tasks for ${monthName} — just the standard EOM report!</p>`;
  }
  const items = tasks
    .map(t => {
      // If task contains a URL, make it a link
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const linked = t.replace(urlRegex, '<a href="$1" style="color:#4A90D9;">$1</a>');
      return `<li style="margin-bottom:8px;">${linked}</li>`;
    })
    .join('');
  return `<ul style="padding-left:20px;line-height:1.7;">${items}</ul>`;
}

/**
 * Format tasks as plain text for the reminder email
 */
function formatTasksText(tasks) {
  if (!tasks || tasks.length === 0) return "  (no special tasks this month)";
  return tasks.map((t, i) => `  ${i + 1}. ${t}`).join('\n');
}

module.exports = {
  MONTH_NAMES,
  getLastThursday,
  isLastThursday,
  isWednesdayBeforeLastThursday,
  formatTasksHtml,
  formatTasksText
};
