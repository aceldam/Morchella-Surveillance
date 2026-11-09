// Each site pairs a set of finding records with the DMI municipality whose weather represents it.
// `thresholds` overrides entries of THRESHOLDS in score.mjs for that site only.
export const SITES = [
  {
    key: "boserup",
    name: "Boserup Skov",
    species: "spiselig og almindelig morkel",
    municipalityId: "0265",
    municipalityName: "Roskilde",
    findingsFile: "Observations.csv",
    thresholds: {},
  },
  {
    key: "vestvolden",
    name: "Vestvolden ved Roskildevej",
    species: "hætte-morkel",
    municipalityId: "0175",
    municipalityName: "Rødovre",
    findingsFile: "svampeatlasdata.csv",
    thresholds: {},
  },
];

export function siteByKey(key) {
  const site = SITES.find(s => s.key === key);
  if (!site) throw new Error(`Unknown site "${key}". Known sites: ${SITES.map(s => s.key).join(", ")}`);
  return site;
}

export const weatherFile = site => `data/dmi/${site.key}.csv`;
