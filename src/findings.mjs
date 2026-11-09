import { readFileSync } from "node:fs";

/**
 * Loads morel finding records from a Danmarks Svampeatlas export. Two formats are recognised:
 * the quoted comma-separated export with an `observationDate` column, and the semicolon list
 * with the date as dd/mm/yyyy in the third column. Returns { date, species, observer, id } sorted by date.
 */
export function loadFindings(path) {
  const text = readFileSync(path, "utf8").replace(/^﻿/, "");
  const findings = text.includes("observationDate") ? parseQuotedExport(text) : parseSemicolonList(text);
  return findings.sort((a, b) => a.date.localeCompare(b.date));
}

export const distinctDates = findings => [...new Set(findings.map(f => f.date))].sort();

function parseSemicolonList(text) {
  return text.split(/\r?\n/).filter(Boolean).map(line => {
    const cols = line.split(";");
    const [d, m, y] = cols[2].split("/");
    return { date: `${y}-${m}-${d}`, species: cols[3].trim(), observer: cols[6], id: cols[7] };
  });
}

function parseQuotedExport(text) {
  const [header, ...rows] = parseCsv(text).filter(r => r.length > 1);
  const column = name => header.indexOf(name);
  return rows.map(r => ({
    date: r[column("observationDate")].slice(0, 10),
    species: r[column("taxonFullName")].trim(),
    observer: r[column("reportedBy")],
    id: r[column("_id")],
    locality: r[column("locality")],
  }));
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
