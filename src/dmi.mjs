const BASE = "https://opendataapi.dmi.dk/v2/climateData/collections/municipalityValue/items";

export const ROSKILDE = "0265";

export const addDays = (date, n) => new Date(Date.parse(date) + n * 86400000).toISOString().slice(0, 10);
export const DAILY_PARAMETERS = ["mean_temp", "min_temp", "max_temp_w_date", "acc_precip", "temp_soil_10", "mean_relative_hum", "bright_sunshine"];

export async function fetchDailyValues({ municipalityId = ROSKILDE, parameterId, from, to }) {
  const url = new URL(BASE);
  url.searchParams.set("municipalityId", municipalityId);
  url.searchParams.set("parameterId", parameterId);
  url.searchParams.set("timeResolution", "day");
  // Days start at local midnight, so bound the range at noon UTC the day before `from` and at noon UTC on `to`.
  url.searchParams.set("datetime", `${addDays(from, -1)}T12:00:00Z/${to}T12:00:00Z`);
  url.searchParams.set("limit", "300000");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`DMI ${parameterId}: HTTP ${response.status}`);
  const body = await response.json();
  return body.features.map(f => ({ date: f.properties.from.slice(0, 10), value: f.properties.value }));
}

/** Returns one row per date, sorted ascending, with a property per parameter (null when missing). */
export async function fetchDailyTable({ municipalityId = ROSKILDE, parameters = DAILY_PARAMETERS, from, to }) {
  const byDate = new Map();
  for (const parameterId of parameters) {
    for (const { date, value } of await fetchDailyValues({ municipalityId, parameterId, from, to })) {
      if (!byDate.has(date)) byDate.set(date, { date });
      byDate.get(date)[parameterId] = value;
    }
  }
  return [...byDate.keys()].sort().map(date => {
    const row = byDate.get(date);
    for (const p of parameters) row[p] ??= null;
    return row;
  });
}

export function toCsv(rows, columns) {
  return [columns.join(","), ...rows.map(r => columns.map(c => r[c] ?? "").join(","))].join("\n") + "\n";
}

export function fromCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const columns = lines[0].split(",");
  return lines.slice(1).map(line => {
    const cells = line.split(",");
    const row = {};
    columns.forEach((c, i) => (row[c] = i === 0 ? cells[i] : cells[i] === "" || cells[i] === undefined ? null : Number(cells[i])));
    return row;
  });
}
