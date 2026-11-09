import { fetchDailyTable, addDays } from "../src/dmi.mjs";
import { assessDate, describe, THRESHOLDS } from "../src/score.mjs";
import { SITES, siteByKey } from "../src/sites.mjs";

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
  try {
    await checkSite(site);
  } catch (error) {
    failures++;
    console.error(`${site.name}: ${error.message}`);
  }
}
process.exit(failures ? 1 : 0);

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

  if (dryRun) {
    console.log("Dry run, notification not sent.");
    return;
  }
  await notify({ title, body, priority: alert.kind === "likely" ? "high" : "default", tags: alert.kind === "likely" ? "mushroom" : "seedling" });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function notify({ title, body, priority, tags }) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) throw new Error("NTFY_TOPIC is not set");
  const server = process.env.NTFY_SERVER || "https://ntfy.sh";
  const headers = { Title: title, Priority: priority, Tags: tags };
  if (process.env.NTFY_TOKEN) headers.Authorization = `Bearer ${process.env.NTFY_TOKEN}`;
  const response = await fetch(`${server}/${topic}`, { method: "POST", headers, body });
  if (!response.ok) throw new Error(`ntfy: HTTP ${response.status}`);
  console.log("Notification sent.");
}
