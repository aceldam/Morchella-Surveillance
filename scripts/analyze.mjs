import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [observationsPath, weatherPath, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

// ---------- load ----------
const findings = readFileSync(observationsPath, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean).map(line => {
  const cols = line.split(";");
  const [d, m, y] = cols[2].split("/");
  return { date: `${y}-${m}-${d}`, species: cols[3].trim(), observer: cols[6], id: cols[7] };
});

const weatherLines = readFileSync(weatherPath, "utf8").trim().split(/\r?\n/);
const header = weatherLines[0].split(",");
const days = weatherLines.slice(1).map(line => {
  const cols = line.split(",");
  const row = {};
  header.forEach((h, i) => (row[h] = i === 0 ? cols[i] : cols[i] === "" ? null : Number(cols[i])));
  return row;
});
const indexByDate = new Map(days.map((d, i) => [d.date, i]));

// ---------- helpers ----------
const mean = xs => { const v = xs.filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const sum = xs => { const v = xs.filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) : null; };
const min = xs => { const v = xs.filter(x => x != null); return v.length ? Math.min(...v) : null; };
const r1 = x => (x == null ? "" : Math.round(x * 10) / 10);
const median = xs => { const v = xs.filter(x => x != null).sort((a, b) => a - b); if (!v.length) return null; const m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
const percentile = (xs, p) => { const v = xs.filter(x => x != null).sort((a, b) => a - b); return v.length ? v[Math.min(v.length - 1, Math.floor(p * v.length))] : null; };

function window(dateIndex, lengthDays, endOffset = -1) {
  // the `lengthDays` days ending at dateIndex + endOffset (default: the day before)
  const end = dateIndex + endOffset;
  return days.slice(Math.max(0, end - lengthDays + 1), end + 1);
}
const col = (rows, key) => rows.map(r => r[key]);

function daysSinceRain(dateIndex, thresholdMm = 1) {
  for (let k = dateIndex - 1, n = 0; k >= 0; k--, n++) if ((days[k].acc_precip ?? 0) >= thresholdMm) return n;
  return null;
}

function weatherAround(dateIndex) {
  const day = days[dateIndex];
  return {
    temp_day: day.mean_temp,
    temp_prior7: mean(col(window(dateIndex, 7), "mean_temp")),
    temp_prior14: mean(col(window(dateIndex, 14), "mean_temp")),
    temp_prior30: mean(col(window(dateIndex, 30), "mean_temp")),
    tmin_prior7: min(col(window(dateIndex, 7), "min_temp")),
    soil10_prior7: mean(col(window(dateIndex, 7), "temp_soil_10")),
    precip_prior7: sum(col(window(dateIndex, 7), "acc_precip")),
    precip_prior14: sum(col(window(dateIndex, 14), "acc_precip")),
    precip_prior30: sum(col(window(dateIndex, 30), "acc_precip")),
    hum_prior7: mean(col(window(dateIndex, 7), "mean_relative_hum")),
    days_since_rain_1mm: daysSinceRain(dateIndex),
  };
}

function spearman(xs, ys) {
  const pairs = xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => x != null && y != null);
  const rank = vals => { const sorted = [...vals].map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]); const r = new Array(vals.length); sorted.forEach(([, i], k) => (r[i] = k + 1)); return r; };
  const rx = rank(pairs.map(p => p[0])), ry = rank(pairs.map(p => p[1]));
  const n = pairs.length, mx = mean(rx), my = mean(ry);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { num += (rx[i] - mx) * (ry[i] - my); dx += (rx[i] - mx) ** 2; dy += (ry[i] - my) ** 2; }
  return { rho: num / Math.sqrt(dx * dy), n };
}

const dayOfYear = date => Math.round((Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) - Date.UTC(+date.slice(0, 4), 0, 1)) / 86400000) + 1;
const weekday = date => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(date + "T12:00:00Z").getUTCDay()];

// ---------- A. per finding ----------
const findingRows = findings.map(f => {
  const i = indexByDate.get(f.date);
  return { ...f, weekday: weekday(f.date), ...weatherAround(i) };
});
const findingKeys = ["date", "weekday", "species", "observer", "temp_day", "temp_prior7", "temp_prior14", "temp_prior30", "tmin_prior7", "soil10_prior7", "precip_prior7", "precip_prior14", "precip_prior30", "hum_prior7", "days_since_rain_1mm"];
writeFileSync(join(outDir, "findings-weather.csv"), [findingKeys.join(","), ...findingRows.map(r => findingKeys.map(k => (typeof r[k] === "number" ? r1(r[k]) : r[k] ?? "")).join(","))].join("\n") + "\n");

// ---------- B. baseline: every day in the season window, all years ----------
const years = [...new Set(days.map(d => +d.date.slice(0, 4)))].filter(y => y >= 2009 && y <= 2026);
const seasonStart = "04-10", seasonEnd = "06-01";
const seasonDays = days.filter(d => d.date.slice(5) >= seasonStart && d.date.slice(5) <= seasonEnd).map(d => weatherAround(indexByDate.get(d.date)));
const distinctFindingDates = [...new Set(findings.map(f => f.date))];
const findingDayStats = distinctFindingDates.map(d => weatherAround(indexByDate.get(d)));
const metrics = ["temp_day", "temp_prior7", "temp_prior14", "tmin_prior7", "soil10_prior7", "precip_prior7", "precip_prior14", "precip_prior30", "hum_prior7", "days_since_rain_1mm"];
const comparison = metrics.map(m => ({
  metric: m,
  finding_median: median(findingDayStats.map(s => s[m])),
  finding_p10: percentile(findingDayStats.map(s => s[m]), 0.1),
  finding_p90: percentile(findingDayStats.map(s => s[m]), 0.9),
  season_median: median(seasonDays.map(s => s[m])),
  season_p10: percentile(seasonDays.map(s => s[m]), 0.1),
  season_p90: percentile(seasonDays.map(s => s[m]), 0.9),
}));

// ---------- C. per year ----------
function dateRange(year, fromMd, toMd) { return days.filter(d => d.date >= `${year}-${fromMd}` && d.date <= `${year}-${toMd}`); }
function firstDateWhere(year, predicate) { for (const d of dateRange(year, "02-01", "06-30")) if (predicate(d)) return d.date; return null; }
function gddFromMarch1(date, base) { const y = date.slice(0, 4); return sum(dateRange(y, "03-01", date.slice(5)).map(d => Math.max(0, (d.mean_temp ?? 0) - base))); }

const perYear = years.map(year => {
  const yearFindings = findings.filter(f => f.date.startsWith(String(year))).sort((a, b) => a.date.localeCompare(b.date));
  const first = yearFindings[0]?.date ?? null;
  const firstIdx = first ? indexByDate.get(first) : null;
  const mar = dateRange(year, "03-01", "03-31"), apr = dateRange(year, "04-01", "04-30"), may = dateRange(year, "05-01", "05-31");
  return {
    year,
    findings: yearFindings.length,
    first_finding: first,
    last_finding: yearFindings.at(-1)?.date ?? null,
    first_doy: first ? dayOfYear(first) : null,
    march_temp: mean(col(mar, "mean_temp")),
    april_temp: mean(col(apr, "mean_temp")),
    may_temp: mean(col(may, "mean_temp")),
    march_precip: sum(col(mar, "acc_precip")),
    april_precip: sum(col(apr, "acc_precip")),
    may_precip: sum(col(may, "acc_precip")),
    mar_apr_precip: sum(col([...mar, ...apr], "acc_precip")),
    gdd5_mar1_to_apr30: sum([...mar, ...apr].map(d => Math.max(0, (d.mean_temp ?? 0) - 5))),
    first_day_14d_mean_ge_8: firstDateWhere(year, d => mean(col(window(indexByDate.get(d.date), 14, 0), "mean_temp")) >= 8),
    first_day_soil10_7d_ge_8: firstDateWhere(year, d => { const s = mean(col(window(indexByDate.get(d.date), 7, 0), "temp_soil_10")); return s != null && s >= 8; }),
    gdd5_at_first_finding: first ? gddFromMarch1(first, 5) : null,
    gdd0_at_first_finding: first ? gddFromMarch1(first, 0) : null,
    temp_prior14_at_first: firstIdx != null ? mean(col(window(firstIdx, 14), "mean_temp")) : null,
    precip_prior30_at_first: firstIdx != null ? sum(col(window(firstIdx, 30), "acc_precip")) : null,
  };
});
const yearKeys = Object.keys(perYear[0]);
writeFileSync(join(outDir, "season-summary.csv"), [yearKeys.join(","), ...perYear.map(r => yearKeys.map(k => (typeof r[k] === "number" ? r1(r[k]) : r[k] ?? "")).join(","))].join("\n") + "\n");

// ---------- report ----------
const corr = key => spearman(perYear.map(y => y[key]), perYear.map(y => y.findings));
const withFirst = perYear.filter(y => y.first_doy);
const corrFirst = key => spearman(withFirst.map(y => y[key]), withFirst.map(y => y.first_doy));
const table = (rows, keys) => ["| " + keys.join(" | ") + " |", "|" + keys.map(() => "---").join("|") + "|", ...rows.map(r => "| " + keys.map(k => (typeof r[k] === "number" ? r1(r[k]) : r[k] ?? "")).join(" | ") + " |")].join("\n");

const weekendShare = findings.filter(f => ["Sat", "Sun"].includes(weekday(f.date))).length / findings.length;

const report = `# Morels in Boserup Skov vs. Roskilde weather (DMI climate data, municipality 0265)

Findings: ${findings.length} records on ${distinctFindingDates.length} distinct dates, ${years[0]}-${years.at(-1)}. Weekend share of records: ${Math.round(weekendShare * 100)} %.
Weather: daily municipality values for Roskilde from DMI (mean_temp, acc_precip from 2009; min_temp, humidity from 2011; soil temp 10 cm from 2014).
"prior N" = the N days ending the day before the record date.

## Finding days vs. all season days (10 Apr - 1 Jun, all years)

${table(comparison, ["metric", "finding_median", "finding_p10", "finding_p90", "season_median", "season_p10", "season_p90"])}

## Per year

${table(perYear, ["year", "findings", "first_finding", "last_finding", "march_temp", "april_temp", "april_precip", "may_precip", "mar_apr_precip", "gdd5_mar1_to_apr30", "first_day_14d_mean_ge_8", "first_day_soil10_7d_ge_8"])}

## Weather at the first finding of each year

${table(withFirst, ["year", "first_finding", "first_doy", "gdd5_at_first_finding", "gdd0_at_first_finding", "temp_prior14_at_first", "precip_prior30_at_first"])}

## Spearman rank correlations (n = ${perYear.length} years)

Number of findings per year vs:
${["march_temp", "april_temp", "may_temp", "march_precip", "april_precip", "may_precip", "mar_apr_precip", "gdd5_mar1_to_apr30"].map(k => `- ${k}: rho = ${corr(k).rho.toFixed(2)}`).join("\n")}

Day-of-year of first finding vs:
${["march_temp", "april_temp", "gdd5_mar1_to_apr30", "mar_apr_precip"].map(k => `- ${k}: rho = ${corrFirst(k).rho.toFixed(2)} (n = ${corrFirst(k).n})`).join("\n")}

## Every record

${table(findingRows, ["date", "weekday", "species", "temp_day", "temp_prior7", "temp_prior14", "tmin_prior7", "soil10_prior7", "precip_prior7", "precip_prior14", "precip_prior30", "days_since_rain_1mm"])}
`;
writeFileSync(join(outDir, "report.md"), report);
console.log(report);
