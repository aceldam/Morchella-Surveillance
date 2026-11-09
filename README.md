# Morchella Surveillance

Daily morel (Morchella) alerts for two sites, driven by DMI's open climate data. A GitHub Actions job runs every morning from March through mid June, scores the latest weather for each site and sends a push notification when conditions turn favourable.

| Site | Species | Weather source (DMI municipality) | Findings |
|---|---|---|---|
| Boserup Skov | spiselig morkel (M. esculenta), almindelig morkel (M. vulgaris) | Roskilde, 0265 | `Observations.csv` |
| Vestvolden ved Roskildevej | hætte-morkel (M. semilibera) | Rødovre, 0175 | `svampeatlasdata.csv` |

Sites are declared in `src/sites.mjs`. Adding one means adding an entry there and a findings export.

## How the score works

The rule comes from comparing finding dates with daily weather for the matching municipality (`output/<site>/report.md` has the analysis for each site). Temperature sets the season, rain sets the timing.

Gate (all must hold, otherwise the level is `closed`):

- Date between 1 March and 1 June.
- Soil temperature at 10 cm, 7-day mean, at least 7.5 °C.
- Air temperature, 14-day mean, between 5 and 12.5 °C.

Moisture points while the gate is open:

- 2 points for at least 8 mm of rain in the last 7 days, or 1 point for at least 15 mm in the last 14 days.
- 1 point when the last day with 1 mm or more of rain is at most two days ago.

Levels: 0 points `possible`, 2 points `likely`, 3 points `very likely`.

Notifications are sent per site when the level first reaches `likely` after being lower the day before, and once when the gate opens for the season. The rule is stateless, so it needs no database between runs. A site can override any threshold in `src/sites.mjs`; both sites currently share the defaults, since a sweep over the thresholds showed no combination that was clearly better for either.

Backtest over 2009-2026 (`npm run backtest`): about 3.5 alerts per site per season. For Boserup Skov 29 of 42 finding dates fall within a week after an alert; for Vestvolden 18 of 32. Hætte-morkel at Vestvolden also fruits after dry spells when the preceding month was wet, which the rain trigger does not catch, so treat a `possible` level there as worth a look if the 30-day total was high.

## Repository layout

- `Observations.csv`, `svampeatlasdata.csv` - finding records exported from Danmarks Svampeatlas.
- `src/sites.mjs` - the sites, their municipalities and threshold overrides.
- `src/dmi.mjs` - client for the DMI climate data API.
- `src/findings.mjs` - loader for both Svampeatlas export formats.
- `src/score.mjs` - features, thresholds, scoring and the alert decision.
- `scripts/check.mjs` - the daily job: fetches the last 45 days per site, scores the newest day and notifies via ntfy.
- `scripts/backtest.mjs` - replays the rule over every season and compares with the finding dates.
- `scripts/fetch-dmi.mjs` - downloads the full daily series per site into `data/dmi/<site>.csv`.
- `scripts/analyze.mjs` - the weather-versus-findings investigation; writes `output/<site>/`.
- `.github/workflows/daily-check.yml` - the scheduled job.

## Running locally

Requires Node 22 or newer. No dependencies to install.

```
npm test                       # unit tests
npm run fetch                  # refresh data/dmi/*.csv from DMI for all sites
npm run backtest               # replay the rule over 2009-2026 for all sites
npm run analyze                # regenerate output/<site>/report.md
npm run check:dry              # score the latest weather, print, do not notify
node scripts/check.mjs --dry-run --date=2024-04-13 --site=vestvolden   # one site, another day
node scripts/backtest.mjs boserup
```

## Notifications

Alerts go to [ntfy](https://ntfy.sh). Install the ntfy app, subscribe to a topic name of your choosing (treat it like a password, anyone who knows it can read and post), and configure the repository:

| Where | Name | Value |
|---|---|---|
| Settings, Secrets and variables, Actions, Secrets | `NTFY_TOPIC` | your topic name |
| Secrets (optional) | `NTFY_TOKEN` | access token, only for a protected topic |
| Variables (optional) | `NTFY_SERVER` | self-hosted server URL, default `https://ntfy.sh` |

Both sites post to the same topic; the notification title names the site and species. To test end to end, run the workflow manually from the Actions tab with dry run off and a date such as `2024-04-24`.

## Data

The DMI API at `https://opendataapi.dmi.dk/v2/climateData` needs no API key and allows 500 requests per 5 seconds. Daily municipality values are available for mean temperature and precipitation from 2009, min and max temperature and humidity from 2011, and soil temperature from 2014. Values for a day are published the following day. Finding records older than 2009 are kept in the exports but skipped by the analysis and backtest.
