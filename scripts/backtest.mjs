import { readFileSync } from "node:fs";
import { fromCsv } from "../src/dmi.mjs";
import { alertFor, scoreDay } from "../src/score.mjs";

const [weatherPath = "data/dmi/roskilde-daily.csv", observationsPath = "Observations.csv"] = process.argv.slice(2);
const days = fromCsv(readFileSync(weatherPath, "utf8"));

const findingDates = [...new Set(
  readFileSync(observationsPath, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean).map(line => {
    const [d, m, y] = line.split(";")[2].split("/");
    return `${y}-${m}-${d}`;
  }),
)].sort();

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const years = [...new Set(days.map(d => d.date.slice(0, 4)))];

let alertsTotal = 0, likelyTotal = 0, hits = 0;
const perYear = [];
for (const year of years) {
  const alerts = [];
  const likelyDays = [];
  days.forEach((day, i) => {
    if (!day.date.startsWith(year) || i < 14) return;
    const alert = alertFor(days, i);
    if (alert) alerts.push(`${day.date.slice(5)} ${alert.kind === "likely" ? alert.score.level : "open"}`);
    if (scoreDay(days, i).rank >= 2) likelyDays.push(day.date);
  });
  const findings = findingDates.filter(d => d.startsWith(year));
  const covered = findings.filter(f => alerts.some(a => { const date = `${year}-${a.slice(0, 5)}`; const gap = daysBetween(date, f); return gap >= 0 && gap <= 7; }));
  alertsTotal += alerts.length; likelyTotal += likelyDays.length; hits += covered.length;
  perYear.push({ year, findings: findings.length, covered: covered.length, likelyDays: likelyDays.length, alerts });
}

console.log("year | findings | covered by alert ≤7 d | likely days | alerts");
for (const y of perYear) console.log(`${y.year} | ${y.findings} | ${y.covered} | ${y.likelyDays} | ${y.alerts.join(", ")}`);
console.log(`\n${alertsTotal} alerts over ${years.length} seasons (${(alertsTotal / years.length).toFixed(1)} per season), ${likelyTotal} likely days.`);
console.log(`${hits} of ${findingDates.length} finding dates fall within 7 days after an alert.`);

const scoresOnFindingDays = findingDates.map(f => scoreDay(days, days.findIndex(d => d.date === f)));
const counts = scoresOnFindingDays.reduce((acc, s) => ((acc[s.level] = (acc[s.level] ?? 0) + 1), acc), {});
console.log(`Level on finding days: ${JSON.stringify(counts)}`);

const n = x => (x == null ? "n/a" : Math.round(x * 10) / 10);
const closed = scoresOnFindingDays.filter(s => !s.gateOpen);
if (closed.length) {
  console.log("\nFinding days with the gate closed (date, soil7, air7, air14):");
  for (const s of closed) console.log(`  ${s.date}  soil ${n(s.soil7)}  air7 ${n(s.air7)}  air14 ${n(s.air14)}`);
}
