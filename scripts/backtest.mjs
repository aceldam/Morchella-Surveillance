import { readFileSync } from "node:fs";
import { fromCsv } from "../src/dmi.mjs";
import { loadFindings, distinctDates } from "../src/findings.mjs";
import { alertFor, scoreDay, THRESHOLDS } from "../src/score.mjs";
import { SITES, siteByKey, weatherFile } from "../src/sites.mjs";

const [siteArg = "all"] = process.argv.slice(2);
for (const site of siteArg === "all" ? SITES : [siteByKey(siteArg)]) backtestSite(site);

function backtestSite(site) {
  const thresholds = { ...THRESHOLDS, ...site.thresholds };
  const days = fromCsv(readFileSync(weatherFile(site), "utf8"));
  const indexByDate = new Map(days.map((d, i) => [d.date, i]));
  const findingDates = distinctDates(loadFindings(site.findingsFile)).filter(d => indexByDate.has(d));
  const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
  const years = [...new Set(days.map(d => d.date.slice(0, 4)))];

  console.log(`\n=== ${site.name} (${site.species}), weather from ${site.municipalityName} ===\n`);
  let alertsTotal = 0, likelyTotal = 0, hits = 0;
  console.log("year | findings | covered by alert ≤7 d | likely days | alerts");
  for (const year of years) {
    const alerts = [];
    let likelyDays = 0;
    days.forEach((day, i) => {
      if (!day.date.startsWith(year) || i < 14) return;
      const alert = alertFor(days, i, thresholds);
      if (alert) alerts.push({ date: day.date, label: `${day.date.slice(5)} ${alert.kind === "likely" ? alert.score.level : "open"}` });
      if (scoreDay(days, i, thresholds).rank >= 2) likelyDays++;
    });
    const findings = findingDates.filter(d => d.startsWith(year));
    const covered = findings.filter(f => alerts.some(a => { const gap = daysBetween(a.date, f); return gap >= 0 && gap <= 7; }));
    alertsTotal += alerts.length; likelyTotal += likelyDays; hits += covered.length;
    console.log(`${year} | ${findings.length} | ${covered.length} | ${likelyDays} | ${alerts.map(a => a.label).join(", ")}`);
  }
  console.log(`\n${alertsTotal} alerts over ${years.length} seasons (${(alertsTotal / years.length).toFixed(1)} per season), ${likelyTotal} likely days.`);
  console.log(`${hits} of ${findingDates.length} finding dates fall within 7 days after an alert.`);

  const scoresOnFindingDays = findingDates.map(f => scoreDay(days, indexByDate.get(f), thresholds));
  const counts = scoresOnFindingDays.reduce((acc, s) => ((acc[s.level] = (acc[s.level] ?? 0) + 1), acc), {});
  console.log(`Level on finding days: ${JSON.stringify(counts)}`);

  const n = x => (x == null ? "n/a" : Math.round(x * 10) / 10);
  const closed = scoresOnFindingDays.filter(s => !s.gateOpen);
  if (closed.length) {
    console.log("\nFinding days with the gate closed (date, soil7, air7, air14):");
    for (const s of closed) console.log(`  ${s.date}  soil ${n(s.soil7)}  air7 ${n(s.air7)}  air14 ${n(s.air14)}`);
  }
}
