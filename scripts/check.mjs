import { fetchDailyTable, addDays } from "../src/dmi.mjs";
import { alertFor, scoreDay, describe, THRESHOLDS } from "../src/score.mjs";

const dryRun = process.argv.includes("--dry-run");
const forcedDate = process.argv.find(a => a.startsWith("--date="))?.slice(7);

const today = forcedDate ?? new Date().toISOString().slice(0, 10);
const monthDay = today.slice(5);
if (!forcedDate && (monthDay < THRESHOLDS.seasonStart || monthDay > "06-15")) {
  console.log(`${today} is outside the morel season window, nothing to do.`);
  process.exit(0);
}

const days = await fetchDailyTable({ from: addDays(today, -45), to: addDays(today, -1) });
if (days.length < 15) throw new Error(`Only ${days.length} days of weather returned from DMI`);

// The newest complete day DMI has published, normally yesterday.
const latestIndex = days.length - 1;
const score = scoreDay(days, latestIndex);
console.log(`Weather through ${days[latestIndex].date}\n${describe(score)}`);

const alert = alertFor(days, latestIndex);
if (!alert) {
  console.log("No alert today.");
  process.exit(0);
}

const title = alert.kind === "likely" ? `Morels ${score.level} in Boserup Skov` : "Morel season is opening in Boserup Skov";
const body = `${describe(score)}\nBased on Roskilde weather through ${score.date}.`;
console.log(`ALERT (${alert.kind}): ${title}`);

if (dryRun) {
  console.log("Dry run, notification not sent.");
  process.exit(0);
}
await notify({ title, body, priority: alert.kind === "likely" ? "high" : "default", tags: alert.kind === "likely" ? "mushroom" : "seedling" });

async function notify({ title, body, priority, tags }) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) throw new Error("NTFY_TOPIC is not set");
  const server = process.env.NTFY_SERVER ?? "https://ntfy.sh";
  const headers = { Title: title, Priority: priority, Tags: tags };
  if (process.env.NTFY_TOKEN) headers.Authorization = `Bearer ${process.env.NTFY_TOKEN}`;
  const response = await fetch(`${server}/${topic}`, { method: "POST", headers, body });
  if (!response.ok) throw new Error(`ntfy: HTTP ${response.status}`);
  console.log("Notification sent.");
}
