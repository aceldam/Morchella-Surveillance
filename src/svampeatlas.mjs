import { addDays } from "./dmi.mjs";

const BASE = "https://svampe.databasen.org/api/observations";
const OBSERVATION_PAGE = "https://svampe.databasen.org/observations";
const MORCHELLA_GENUS_PATH = "66576, 60212, 60043, 66091, 66117, 60425, 60424, 60360, 62678";

/** Taxon ids in Danmarks Svampeatlas: M. esculenta, M. vulgaris, M. semilibera and M. conica sensu lato. */
export const MOREL_TAXON_IDS = [17154, 45107, 17156, 68975];

/** The site's own definition of a validated determination: approved by a validator or by the system, or community-scored at least 80 and not rejected. */
export const VALIDATED_DETERMINATION = {
  $or: [
    { Determination_validation: "Godkendt", Determination_validator_id: { $ne: null } },
    { Determination_score: { $gte: 80 }, Determination_validation: { $notIn: ["Afvist", "Godkendt"] } },
    { Determination_validation: "Godkendt", Determination_validator_id: { $eq: null } },
  ],
};

/** Validated morel findings anywhere in Denmark observed on the day before `today`; the job runs each morning. */
export function fetchMorelFindingsObservedYesterday(today) {
  const yesterday = addDays(today, -1);
  return fetchMorelFindings({ from: yesterday, to: yesterday });
}

/** Validated morel findings anywhere in Denmark with an observation date from `from` to `to` inclusive, newest first. */
export async function fetchMorelFindings({ from, to }) {
  const response = await fetch(observationsUrl({ from, to }));
  if (!response.ok) throw new Error(`Svampeatlas: HTTP ${response.status}`);
  const observations = await response.json();
  return observations.map(toFinding).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

export function observationsUrl({ from, to, limit = 100 }) {
  const url = new URL(BASE);
  url.searchParams.set("_order", JSON.stringify([["observationDate", "DESC"], ["_id", "DESC"]]));
  url.searchParams.set("include", JSON.stringify(INCLUDE.map(part => JSON.stringify(part))));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", "0");
  url.searchParams.set("where", JSON.stringify({ observationDate: { $gte: from, $lte: to } }));
  return url;
}

// The API takes each include as a JSON string inside a JSON array, mirroring the site's own search.
const INCLUDE = [
  {
    model: "DeterminationView",
    as: "DeterminationView",
    attributes: ["Taxon_id", "Taxon_FullName", "Taxon_vernacularname_dk", "Determination_validation", "Determination_score"],
    where: {
      $and: VALIDATED_DETERMINATION,
      $or: MOREL_TAXON_IDS.map(id => ({ Taxon_path: { like: `${MORCHELLA_GENUS_PATH}, ${id}%` } })),
    },
  },
  { model: "Locality", as: "Locality", attributes: ["_id", "name"], where: {}, required: true },
];

export function toFinding(observation) {
  const determination = observation.DeterminationView ?? {};
  return {
    id: observation._id,
    date: observation.observationDate.slice(0, 10),
    species: (determination.Taxon_FullName ?? "").trim(),
    vernacularName: determination.Taxon_vernacularname_dk ?? "",
    locality: observation.Locality?.name ?? "",
    url: `${OBSERVATION_PAGE}/${observation._id}`,
  };
}

export function describeFindings(findings) {
  return findings.map(f => `${f.date} ${f.species} (${f.vernacularName}), ${f.locality}`).join("\n");
}
