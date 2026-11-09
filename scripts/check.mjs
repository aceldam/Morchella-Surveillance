import { fetchDailyTable, addDays } from "../src/dmi.mjs";
import { assessDate, describe, THRESHOLDS } from "../src/score.mjs";
import { SITES, siteByKey } from "../src/sites.mjs";
import { fetchRecentMorelFindings, describeFindings, RECENT_DAYS } from "../src/svampeatlas.mjs";

const dryRun = process.argv.includes("--dry-run");
const forcedDate = process.argv.find(a => a.startsWith("--date="))?.slice(7);
const siteArg = process.argv.find(a => a.startsWith("--site="))?.slice(7) ?? "all";

const today = forcedDate ?? new Date().toISOString().slice(0, 10);
const monthDay = today.slice(5);
if (!forcedDate && (monthDay < THRESHOLDS.seasonStart || monthDay > "06-15")) {
  console.log(`${today} is outside the morel season window, nothing to do.`);
  process.exit(0);
}

let failures = 0;
for (const site of siteArg === "all" ? SITES : [siteByKey(siteArg)]) {
  await attempt(site.name, () => checkSite(site));
}
await attempt("Svampeatlas", checkRecentFindings);
process.exit(failures ? 1 : 0);

async function attempt(name, step) {
  try {
    await step();
  } catch (error) {
    failures++;
    console.error(`${name}: ${error.message}`);
  }
}

async function checkSite(site) {
  const thresholds = { ...THRESHOLDS, ...site.thresholds };
  const days = await fetchDailyTable({ municipalityId: site.municipalityId, from: addDays(today, -45), to: addDays(today, -1) });
  if (days.length < 15) throw new Error(`only ${days.length} days of weather returned from DMI`);

  const { score, alert, weatherThrough } = assessDate(days, today, thresholds);
  console.log(`\n${site.name} (${site.species}), ${today} scored from ${site.municipalityName} weather through ${weatherThrough}\n${describe(score)}`);

  if (!alert) {
    console.log("No alert today.");
    return;
  }

  const title = alert.kind === "likely" ? `${capitalize(site.species)} ${score.level}: ${site.name}` : `Morel season is opening: ${site.name}`;
  const body = `${describe(score)}\nBased on ${site.municipalityName} weather through ${weatherThrough}.`;
  console.log(`ALERT (${alert.kind}): ${title}`);
  await send({ title, body, priority: alert.kind === "likely" ? "high" : "default", tags: alert.kind === "likely" ? "mushroom" : "seedling" });
}

async function checkRecentFindings() {
  const findings = await fetchRecentMorelFindings(today);
  console.log(`\nValidated morel findings in Denmark in the last ${RECENT_DAYS} days up to ${today}: ${findings.length}`);
  if (findings.length === 0) return;
  console.log(describeFindings(findings));

  const title = `${findings.length} validated morel finding${findings.length === 1 ? "" : "s"} in Denmark`;
  const body = `${describeFindings(findings)}\nFrom Danmarks Svampeatlas, last ${RECENT_DAYS} days.`;
  console.log(`ALERT (findings): ${title}`);
  await send({ title, body, priority: "default", tags: "eyes", click: findings[0].url });
}

async function send(notification) {
  if (dryRun) {
    console.log("Dry run, notification not sent.");
    return;
  }
  await notify(notification);
}

// HTTP headers are ASCII only; ntfy decodes RFC 2047 encoded words, which keeps æ, ø and å intact.
function headerSafe(text) {
  return /^[\x20-\x7e]*$/.test(text) ? text : `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function notify({ title, body, priority, tags, click }) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) throw new Error("NTFY_TOPIC is not set");
  const server = process.env.NTFY_SERVER || "https://ntfy.sh";
  const headers = { Title: headerSafe(title), Priority: priority, Tags: tags };
  if (click) headers.Click = click;
  if (process.env.NTFY_TOKEN) headers.Authorization = `Bearer ${process.env.NTFY_TOKEN}`;
  const response = await fetch(`${server}/${topic}`, { method: "POST", headers, body });
  if (!response.ok) throw new Error(`ntfy: HTTP ${response.status}`);
  console.log("Notification sent.");
}
