import test from "node:test";
import assert from "node:assert/strict";
import { observationsUrl, toFinding, describeFindings, MOREL_TAXON_IDS, VALIDATED_DETERMINATION } from "../src/svampeatlas.mjs";

const observation = {
  _id: 10596250,
  observationDate: "2026-05-22T00:00:00.000Z",
  DeterminationView: { Taxon_id: 45107, Taxon_FullName: "Morchella vulgaris ", Taxon_vernacularname_dk: "almindelig morkel", Determination_score: 86 },
  Locality: { _id: 16423, name: "Skærven, Løsning" },
};

test("observations url filters on the date range, validated determinations and every morel taxon", () => {
  const url = observationsUrl({ from: "2026-04-20", to: "2026-04-23" });
  assert.equal(url.origin + url.pathname, "https://svampe.databasen.org/api/observations");
  assert.deepEqual(JSON.parse(url.searchParams.get("where")), { observationDate: { $gte: "2026-04-20", $lte: "2026-04-23" } });
  const [determination] = JSON.parse(url.searchParams.get("include")).map(part => JSON.parse(part));
  assert.deepEqual(determination.where.$and, VALIDATED_DETERMINATION);
  const paths = determination.where.$or.map(clause => clause.Taxon_path.like);
  assert.equal(paths.length, MOREL_TAXON_IDS.length);
  for (const id of MOREL_TAXON_IDS) assert.ok(paths.some(p => p.endsWith(`, ${id}%`)), `taxon ${id}`);
});

test("observation maps to a finding with date, species and link", () => {
  assert.deepEqual(toFinding(observation), {
    id: 10596250,
    date: "2026-05-22",
    species: "Morchella vulgaris",
    vernacularName: "almindelig morkel",
    locality: "Skærven, Løsning",
    url: "https://svampe.databasen.org/observations/10596250",
  });
});

test("observation without determination or locality still maps", () => {
  const finding = toFinding({ _id: 1, observationDate: "2026-04-01T00:00:00.000Z" });
  assert.equal(finding.species, "");
  assert.equal(finding.locality, "");
});

test("findings are described one per line", () => {
  const second = { ...observation, _id: 2, observationDate: "2026-05-21T00:00:00.000Z", Locality: { name: "Boserup Skov" } };
  assert.equal(
    describeFindings([observation, second].map(toFinding)),
    "2026-05-22 Morchella vulgaris (almindelig morkel), Skærven, Løsning\n2026-05-21 Morchella vulgaris (almindelig morkel), Boserup Skov",
  );
});
