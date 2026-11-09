// Thresholds derived from 42 finding dates in Boserup Skov 2009-2026 compared with
// Roskilde municipality weather: findings cluster at a 7-day soil temperature of 7.5 °C
// or more, a 14-day air mean of 5-12.5 °C, and within two days of rain.
export const THRESHOLDS = {
  soilMinC: 7.5,
  airFallbackMinC: 7,
  airMinC: 5,
  airMaxC: 12.5,
  rain7MinMm: 8,
  rain14MinMm: 15,
  maxDaysSinceRain: 2,
  seasonStart: "03-01",
  seasonEnd: "06-01",
};

export const LEVELS = ["closed", "possible", "likely", "very likely"];

const mean = xs => { const v = xs.filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const sum = xs => { const v = xs.filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) : null; };

function priorWindow(days, index, length) {
  const end = index - 1;
  return days.slice(Math.max(0, end - length + 1), end + 1);
}

function daysSinceRain(days, index, thresholdMm = 1) {
  for (let k = index - 1, n = 0; k >= 0; k--, n++) if ((days[k].acc_precip ?? 0) >= thresholdMm) return n;
  return null;
}

/** Weather features for the day at `index`, built from the days before it. Needs at least 14 prior days. */
export function featuresFor(days, index) {
  const w7 = priorWindow(days, index, 7), w14 = priorWindow(days, index, 14);
  return {
    date: days[index].date,
    air14: mean(w14.map(d => d.mean_temp)),
    air7: mean(w7.map(d => d.mean_temp)),
    soil7: mean(w7.map(d => d.temp_soil_10)),
    rain7: sum(w7.map(d => d.acc_precip)),
    rain14: sum(w14.map(d => d.acc_precip)),
    daysSinceRain: daysSinceRain(days, index),
    rainYesterday: days[index - 1]?.acc_precip ?? null,
  };
}

export function scoreFeatures(f, t = THRESHOLDS) {
  const monthDay = f.date.slice(5);
  const inSeason = monthDay >= t.seasonStart && monthDay <= t.seasonEnd;
  const soilWarm = f.soil7 != null ? f.soil7 >= t.soilMinC : f.air7 != null && f.air7 >= t.airFallbackMinC;
  const airInBand = f.air14 != null && f.air14 >= t.airMinC && f.air14 <= t.airMaxC;
  const gateOpen = inSeason && soilWarm && airInBand;

  let moisture = 0;
  if (f.rain7 != null && f.rain7 >= t.rain7MinMm) moisture += 2;
  else if (f.rain14 != null && f.rain14 >= t.rain14MinMm) moisture += 1;
  if (f.daysSinceRain != null && f.daysSinceRain <= t.maxDaysSinceRain) moisture += 1;

  const level = !gateOpen ? "closed" : moisture >= 3 ? "very likely" : moisture >= 2 ? "likely" : "possible";
  return { ...f, inSeason, soilWarm, airInBand, gateOpen, moisture, level, rank: LEVELS.indexOf(level) };
}

export function scoreDay(days, index, t = THRESHOLDS) {
  return scoreFeatures(featuresFor(days, index), t);
}

/**
 * Decides whether the day at `index` warrants a notification, using only the scored days before it.
 * Returns null, or { kind: "season-open" | "likely", score }.
 */
export function alertFor(days, index, t = THRESHOLDS) {
  const today = scoreDay(days, index, t);
  const yesterday = index > 0 ? scoreDay(days, index - 1, t) : null;
  if (today.rank >= LEVELS.indexOf("likely") && (!yesterday || yesterday.rank < LEVELS.indexOf("likely"))) {
    return { kind: "likely", score: today };
  }
  if (today.gateOpen && yesterday && !yesterday.gateOpen) {
    const recentlyOpen = days.slice(Math.max(0, index - 10), index - 1).some((_, i) => scoreDay(days, Math.max(0, index - 10) + i, t).gateOpen);
    if (!recentlyOpen) return { kind: "season-open", score: today };
  }
  return null;
}

export function describe(score) {
  const n = x => (x == null ? "n/a" : (Math.round(x * 10) / 10).toString());
  return [
    `Level: ${score.level}`,
    `Soil 10 cm, 7-day mean: ${n(score.soil7)} °C`,
    `Air, 14-day mean: ${n(score.air14)} °C`,
    `Rain last 7 / 14 days: ${n(score.rain7)} / ${n(score.rain14)} mm`,
    `Days since 1 mm rain: ${score.daysSinceRain ?? "n/a"}`,
  ].join("\n");
}
