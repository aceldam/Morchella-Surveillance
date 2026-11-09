import test from "node:test";
import assert from "node:assert/strict";
import { scoreFeatures, alertFor, assessDate, scoreDay } from "../src/score.mjs";

const base = { date: "2026-05-01", air14: 9, air7: 9.5, soil7: 9, rain7: 10, rain14: 20, daysSinceRain: 1, rainYesterday: 4 };

test("warm soil, mild air and fresh rain is very likely", () => {
  assert.equal(scoreFeatures(base).level, "very likely");
});

test("rain in the fortnight but a dry week is only possible", () => {
  assert.equal(scoreFeatures({ ...base, rain7: 2, rain14: 18, daysSinceRain: 5 }).level, "possible");
});

test("cold soil closes the gate regardless of rain", () => {
  assert.equal(scoreFeatures({ ...base, soil7: 6 }).level, "closed");
});

test("air above the band closes the gate", () => {
  assert.equal(scoreFeatures({ ...base, air14: 13 }).level, "closed");
});

test("outside the season window the gate is closed", () => {
  assert.equal(scoreFeatures({ ...base, date: "2026-07-01" }).level, "closed");
});

test("missing soil temperature falls back to the 7-day air mean", () => {
  assert.equal(scoreFeatures({ ...base, soil7: null, air7: 6 }).level, "closed");
  assert.equal(scoreFeatures({ ...base, soil7: null, air7: 9 }).level, "very likely");
});

function syntheticDays({ length, mean_temp, temp_soil_10, rainOnLastDays = 0, rainMm = 6 }) {
  return Array.from({ length }, (_, i) => ({
    date: new Date(Date.UTC(2026, 3, 1 + i)).toISOString().slice(0, 10),
    mean_temp,
    temp_soil_10,
    acc_precip: i >= length - rainOnLastDays ? rainMm : 0,
  }));
}

test("alert fires once when the level crosses into likely", () => {
  // Rain on the last four days: the 7-day sum passes 8 mm on the third rainy day.
  const days = syntheticDays({ length: 31, mean_temp: 9, temp_soil_10: 9, rainOnLastDays: 4 });
  const last = days.length - 1;
  assert.equal(alertFor(days, last - 2), null);
  assert.equal(alertFor(days, last - 1)?.kind, "likely");
  assert.equal(alertFor(days, last), null);
});

test("assessing a date uses the whole series before it, matching the backtest", () => {
  const days = syntheticDays({ length: 31, mean_temp: 9, temp_soil_10: 9, rainOnLastDays: 3 });
  const yesterday = days.pop();
  const assessed = assessDate(days, yesterday.date);
  assert.equal(assessed.weatherThrough, days.at(-1).date);
  assert.equal(assessed.score.rain7, 2 * 6);
  assert.deepEqual(assessed.score, scoreDay([...days, { date: yesterday.date }], days.length));
  assert.equal(assessed.alert?.kind, "likely");
});

test("no alert while soil stays cold", () => {
  const days = syntheticDays({ length: 30, mean_temp: 9, temp_soil_10: 5, rainOnLastDays: 3 });
  assert.equal(alertFor(days, days.length - 1), null);
});
