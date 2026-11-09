import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fetchDailyTable, toCsv, DAILY_PARAMETERS } from "../src/dmi.mjs";
import { SITES, siteByKey, weatherFile } from "../src/sites.mjs";

const [siteArg = "all", from = "2009-01-01", to = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const sites = siteArg === "all" ? SITES : [siteByKey(siteArg)];

for (const site of sites) {
  console.log(`${site.name} (${site.municipalityName}, ${site.municipalityId})`);
  const rows = await fetchDailyTable({ municipalityId: site.municipalityId, from, to });
  for (const p of DAILY_PARAMETERS) {
    const present = rows.filter(r => r[p] != null);
    console.log(`  ${p}: ${present.length} days (${present[0]?.date} .. ${present.at(-1)?.date})`);
  }
  const target = weatherFile(site);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, toCsv(rows, ["date", ...DAILY_PARAMETERS]));
  console.log(`  wrote ${rows.length} rows to ${target}`);
}
