# Morchella Surveillance

Daily morel (Morchella) alert for Boserup Skov, driven by DMI's open climate data for Roskilde municipality. A GitHub Actions job runs every morning from March through mid June, scores the latest weather and sends a push notification when conditions turn favourable.

## How the score works

The rule comes from comparing 42 finding dates in Boserup Skov (2009-2026) with daily weather for Roskilde (`output/report.md` has the analysis). Temperature sets the season, rain sets the timing.

Gate (all must hold, otherwise the level is `closed`):

- Date between 1 March and 1 June.
- Soil temperature at 10 cm, 7-day mean, at least 7.5 °C.
- Air temperature, 14-day mean, between 5 and 12.5 °C.

Moisture points while the gate is open:

- 2 points for at least 8 mm of rain in the last 7 days, or 1 point for at least 15 mm in the last 14 days.
- 1 point when the last day with 1 mm or more of rain is at most two days ago.

Levels: 0 points `possible`, 2 points `likely`, 3 points `very likely`.

Notifications are sent when the level first reaches `likely` after being lower the day before, and once when the gate opens for the season. The rule is stateless, so it needs no database between runs.

## Repository layout

- `Observations.csv` - morel records from Danmarks Svampeatlas (semicolon separated, date as dd/mm/yyyy).
- `src/dmi.mjs` - client for the DMI climate data API (municipality 0265, Roskilde).
- `src/score.mjs` - features, thresholds, scoring and the alert decision.
- `scripts/check.mjs` - the daily job: fetches the last 45 days, scores the newest day and notifies via ntfy.
- `scripts/backtest.mjs` - replays the rule over every season in `data/dmi/roskilde-daily.csv` and compares with the finding dates.
- `scripts/fetch-dmi.mjs` - downloads the full daily series for analysis and backtesting.
- `scripts/analyze.mjs` - the original investigation; writes `output/`.
- `.github/workflows/daily-check.yml` - the scheduled job.

## Running locally

Requires Node 22 or newer. No dependencies to install.

```
npm test                       # unit tests for the scoring rule
npm run fetch                  # refresh data/dmi/roskilde-daily.csv from DMI
npm run backtest               # replay the rule over 2009-2026
npm run check:dry              # score the latest weather, print, do not notify
node scripts/check.mjs --dry-run --date=2024-05-01   # pretend it is another day
```

## Notifications

Alerts go to [ntfy](https://ntfy.sh). Install the ntfy app, subscribe to a topic name of your choosing (treat it like a password, anyone who knows it can read and post), and configure the repository:

| Where | Name | Value |
|---|---|---|
| Settings, Secrets and variables, Actions, Secrets | `NTFY_TOPIC` | your topic name |
| Secrets (optional) | `NTFY_TOKEN` | access token, only for a protected topic |
| Variables (optional) | `NTFY_SERVER` | self-hosted server URL, default `https://ntfy.sh` |

To test end to end, run the workflow manually from the Actions tab with dry run off and a date such as `2024-04-24`.

## Data

The DMI API at `https://opendataapi.dmi.dk/v2/climateData` needs no API key and allows 500 requests per 5 seconds. Daily municipality values for Roskilde are available for mean temperature and precipitation from 2009, min and max temperature and humidity from 2011, and soil temperature from 2014. Values for a day are published the following day.
