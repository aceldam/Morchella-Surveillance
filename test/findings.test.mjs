import test from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadFindings, distinctDates } from "../src/findings.mjs";

const dir = mkdtempSync(join(tmpdir(), "findings-"));

test("semicolon list with dd/mm/yyyy dates", () => {
  const file = join(dir, "list.csv");
  writeFileSync(file, "﻿;;16/05/2026;Morchella esculenta;Spiselig morkel;Boserup Skov;jmi;DMS-1;\n;;21/04/2025;Morchella vulgaris ;Almindelig morkel;Boserup Skov;petra;DMS-2;\n");
  const findings = loadFindings(file);
  assert.deepEqual(findings.map(f => f.date), ["2025-04-21", "2026-05-16"]);
  assert.equal(findings[0].species, "Morchella vulgaris");
  assert.equal(findings[1].observer, "jmi");
});

test("quoted Svampeatlas export with ISO dates and embedded commas", () => {
  const file = join(dir, "export.csv");
  writeFileSync(file, [
    '"_id","observationDate","taxonFullName","locality","reportedBy","notes"',
    '"DMS-9","2021-05-13T00:00:00.000Z","Morchella semilibera","Vestvolden, Roskildevej","A. Person","Found under ""a"" tree, nice"',
    '"DMS-8","2021-05-13T00:00:00.000Z","Morchella semilibera","Vestvolden","B. Person",""',
    '"DMS-7","2019-04-07T00:00:00.000Z","Morchella semilibera","Vestvolden","C. Person","multi',
    'line note"',
  ].join("\n"));
  const findings = loadFindings(file);
  assert.equal(findings.length, 3);
  assert.deepEqual(distinctDates(findings), ["2019-04-07", "2021-05-13"]);
  assert.equal(findings[0].observer, "C. Person");
  assert.equal(findings.find(f => f.id === "DMS-9").locality, "Vestvolden, Roskildevej");
  assert.equal(findings.find(f => f.id === "DMS-9").observer, "A. Person");
});
