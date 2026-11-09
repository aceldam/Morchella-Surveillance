import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fetchDailyTable, toCsv, DAILY_PARAMETERS } from "../src/dmi.mjs";

const outDir = process.argv[2] ?? "data/dmi";
const from = process.argv[3] ?? "2009-01-01";
const to = process.argv[4] ?? new Date().toISOString().slice(0, 10);
mkdirSync(outDir, { recursive: true });

const rows = await fetchDailyTable({ from, to });
for (const p of DAILY_PARAMETERS) {
  const present = rows.filter(r => r[p] != null);
  console.log(`${p}: ${present.length} days (${present[0]?.date} .. ${present.at(-1)?.date})`);
}
const target = join(outDir, "roskilde-daily.csv");
writeFileSync(target, toCsv(rows, ["date", ...DAILY_PARAMETERS]));
console.log(`wrote ${rows.length} rows to ${target}`);
