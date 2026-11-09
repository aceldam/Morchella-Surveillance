# Vestvolden ved Roskildevej (hætte-morkel) vs. Rødovre weather (DMI climate data, municipality 0175)

Findings: 38 records on 32 distinct dates, 2009-2026 (23 older records skipped, no weather data before 2009-01-01). Weekend share of records: 24 %.
Weather: daily municipality values from DMI (mean_temp, acc_precip from 2009; min_temp, humidity from 2011; soil temp 10 cm from 2014).
"prior N" = the N days ending the day before the record date.

## Finding days vs. all season days (10 Apr - 1 Jun, all years)

| metric | finding_median | finding_p10 | finding_p90 | season_median | season_p10 | season_p90 |
|---|---|---|---|---|---|---|
| temp_day | 10.1 | 4.6 | 13.8 | 11 | 6.8 | 16.2 |
| temp_prior7 | 9.8 | 6.2 | 12.5 | 10.5 | 6.8 | 14.7 |
| temp_prior14 | 9.3 | 7 | 11.8 | 10 | 6.7 | 13.6 |
| tmin_prior7 | 3.3 | -0.7 | 6.1 | 3.1 | -0.2 | 7.4 |
| soil10_prior7 | 9.4 | 7.1 | 10.3 | 10.2 | 7.3 | 13.8 |
| precip_prior7 | 8.6 | 0 | 28 | 6.1 | 0 | 20.4 |
| precip_prior14 | 17 | 2.1 | 44 | 14.3 | 1.9 | 34.8 |
| precip_prior30 | 47.3 | 26.4 | 71.6 | 30.6 | 12.2 | 59.6 |
| hum_prior7 | 70.3 | 59.2 | 78.5 | 69.6 | 58.3 | 77.5 |
| days_since_rain_1mm | 2 | 0 | 12 | 3 | 0 | 13 |

## Per year

| year | findings | first_finding | last_finding | march_temp | april_temp | april_precip | may_precip | mar_apr_precip | gdd5_mar1_to_apr30 | first_day_14d_mean_ge_8 | first_day_soil10_7d_ge_8 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2009 | 0 |  |  | 4 | 10.1 | 9.1 | 54 | 49.8 | 163.9 | 2009-04-11 |  |
| 2010 | 3 | 2010-04-23 | 2010-05-21 | 3.2 | 7.7 | 25.2 | 57.2 | 62.2 | 111.1 | 2010-04-29 |  |
| 2011 | 2 | 2011-05-06 | 2011-05-18 | 3.3 | 10.7 | 21.4 | 63.4 | 53.4 | 185.3 | 2011-04-09 |  |
| 2012 | 1 | 2012-05-03 | 2012-05-03 | 6.2 | 6.9 | 49.8 | 14 | 62.2 | 129.7 | 2012-04-27 |  |
| 2013 | 3 | 2013-05-16 | 2013-05-23 | -0.3 | 6.7 | 20 | 72.4 | 27.7 | 74.9 | 2013-04-23 |  |
| 2014 | 6 | 2014-04-26 | 2014-04-29 | 6.4 | 9.5 | 26.4 | 68.9 | 51.7 | 187.6 | 2014-04-17 | 2014-04-12 |
| 2015 | 0 |  |  | 5 | 8 | 28.1 | 61.5 | 78 | 115.4 | 2015-04-19 | 2015-04-21 |
| 2016 | 2 | 2016-04-27 | 2016-05-04 | 4.2 | 7.3 | 47.8 | 23.8 | 92.6 | 86.5 | 2016-05-07 | 2016-05-03 |
| 2017 | 5 | 2017-04-19 | 2017-05-11 | 5.2 | 7 | 71.9 | 20.8 | 121.1 | 102.2 | 2017-04-05 | 2017-04-05 |
| 2018 | 1 | 2018-05-02 | 2018-05-02 | 0.4 | 9.4 | 29.7 | 19.5 | 90.4 | 138.9 | 2018-04-16 | 2018-04-19 |
| 2019 | 5 | 2019-03-31 | 2019-05-03 | 5.7 | 8.9 | 11.7 | 52.9 | 111.1 | 162.3 | 2019-04-07 | 2019-04-24 |
| 2020 | 0 |  |  | 5 | 8.5 | 21 | 34.6 | 36.8 | 128 | 2020-04-15 | 2020-04-18 |
| 2021 | 5 | 2021-05-12 | 2021-05-16 | 4.5 | 6.5 | 23.5 | 64.2 | 61.4 | 82.2 | 2021-05-10 | 2021-05-03 |
| 2022 | 1 | 2022-05-04 | 2022-05-04 | 4.3 | 7.3 | 33.9 | 71.8 | 36.3 | 98.6 | 2022-04-22 | 2022-04-22 |
| 2023 | 1 | 2023-05-03 | 2023-05-03 | 4 | 7.6 | 30.3 | 9 | 102.6 | 115.3 | 2023-04-20 | 2023-04-17 |
| 2024 | 3 | 2024-04-12 | 2024-04-21 | 5.3 | 8.2 | 66.6 | 33.3 | 92.3 | 144.1 | 2024-04-09 | 2024-04-07 |
| 2025 | 0 |  |  | 6 | 10 | 11.7 | 40.7 | 24.3 | 198.6 | 2025-04-08 | 2025-04-04 |
| 2026 | 0 |  |  | 5.7 | 8 | 6.5 | 32.5 | 34 | 119.1 | 2026-04-24 | 2026-04-20 |

## Weather at the first finding of each year

| year | first_finding | first_doy | gdd5_at_first_finding | gdd0_at_first_finding | temp_prior14_at_first | precip_prior30_at_first |
|---|---|---|---|---|---|---|
| 2010 | 2010-04-23 | 113 | 70.4 | 268 | 7.2 | 42.2 |
| 2011 | 2011-05-06 | 126 | 201.9 | 473.7 | 11 | 28.9 |
| 2012 | 2012-05-03 | 124 | 153.3 | 439.9 | 10 | 48.7 |
| 2013 | 2013-05-16 | 136 | 191.2 | 421.4 | 12.2 | 27.4 |
| 2014 | 2014-04-26 | 116 | 154.6 | 429.7 | 9.9 | 26.4 |
| 2016 | 2016-04-27 | 118 | 78.1 | 325.4 | 7 | 46.8 |
| 2017 | 2017-04-19 | 109 | 87.7 | 306.1 | 7.1 | 51.7 |
| 2018 | 2018-05-02 | 122 | 147.5 | 334.2 | 11.4 | 31.5 |
| 2019 | 2019-03-31 | 90 | 37 | 176.4 | 7 | 99.4 |
| 2021 | 2021-05-12 | 132 | 139 | 450 | 9.1 | 50.5 |
| 2022 | 2022-05-04 | 124 | 120.3 | 394 | 9.7 | 33.4 |
| 2023 | 2023-05-03 | 123 | 128.9 | 385.5 | 9.2 | 30.3 |
| 2024 | 2024-04-12 | 103 | 91.4 | 273.7 | 8.7 | 60.2 |

## Spearman rank correlations (n = 18 years)

Number of findings per year vs:
- march_temp: rho = 0.06
- april_temp: rho = -0.30
- may_temp: rho = 0.15
- march_precip: rho = 0.10
- april_precip: rho = 0.29
- may_precip: rho = 0.24
- mar_apr_precip: rho = 0.37
- gdd5_mar1_to_apr30: rho = -0.21

Day-of-year of first finding vs:
- march_temp: rho = -0.45 (n = 13)
- april_temp: rho = -0.43 (n = 13)
- gdd5_mar1_to_apr30: rho = -0.46 (n = 13)
- mar_apr_precip: rho = -0.69 (n = 13)

## Every record

| date | weekday | species | temp_day | temp_prior7 | temp_prior14 | tmin_prior7 | soil10_prior7 | precip_prior7 | precip_prior14 | precip_prior30 | days_since_rain_1mm |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2010-04-23 | Fri | Morchella semilibera | 6.1 | 6.5 | 7.2 |  |  | 8.4 | 8.4 | 42.2 | 1 |
| 2010-05-09 | Sun | Morchella semilibera | 7.4 | 7.5 | 9.4 |  |  | 4.6 | 10.4 | 18.9 | 1 |
| 2010-05-21 | Fri | Morchella semilibera | 16.4 | 11.9 | 9.6 |  |  | 16.9 | 42.4 | 55.6 | 5 |
| 2011-05-06 | Fri | Morchella semilibera | 11.6 | 8.3 | 11 | 0.3 |  | 14.3 | 14.3 | 28.9 | 0 |
| 2011-05-18 | Wed | Morchella semilibera | 12.8 | 12.5 | 12.2 | 5.4 |  | 14.3 | 16.4 | 28.6 | 0 |
| 2012-05-03 | Thu | Morchella semilibera | 13.8 | 11.6 | 10 | 6 |  | 3.2 | 30.5 | 48.7 | 6 |
| 2013-05-16 | Thu | Morchella semilibera | 17.1 | 12.6 | 12.2 | 6.1 |  | 2.9 | 17.3 | 27.4 | 6 |
| 2013-05-16 | Thu | Morchella semilibera | 17.1 | 12.6 | 12.2 | 6.1 |  | 2.9 | 17.3 | 27.4 | 6 |
| 2013-05-23 | Thu | Morchella semilibera | 9.6 | 15.6 | 14.1 | 7.9 |  | 38.5 | 41.4 | 62.3 | 0 |
| 2014-04-26 | Sat | Morchella semilibera | 12.5 | 11.6 | 9.9 | 3.7 | 9.8 | 4.1 | 16.6 | 26.4 | 1 |
| 2014-04-26 | Sat | Morchella semilibera | 12.5 | 11.6 | 9.9 | 3.7 | 9.8 | 4.1 | 16.6 | 26.4 | 1 |
| 2014-04-27 | Sun | Morchella semilibera | 13.3 | 11.8 | 10.2 | 5.1 | 10 | 4.1 | 15.1 | 26.4 | 2 |
| 2014-04-28 | Mon | Morchella semilibera | 12.6 | 11.8 | 10.5 | 5.1 | 10.2 | 4.1 | 14.3 | 26.4 | 3 |
| 2014-04-28 | Mon | Morchella semilibera | 12.6 | 11.8 | 10.5 | 5.1 | 10.2 | 4.1 | 14.3 | 26.4 | 3 |
| 2014-04-29 | Tue | Morchella semilibera | 13.9 | 11.8 | 10.9 | 5.1 | 10.3 | 4.1 | 9.4 | 26.4 | 4 |
| 2016-04-27 | Wed | Morchella semilibera | 4.7 | 6.2 | 7 | 0 | 7.6 | 26 | 30 | 46.8 | 0 |
| 2016-05-04 | Wed | Morchella semilibera | 10 | 8.4 | 7.3 | 0.9 | 8.2 | 8.8 | 34.8 | 47.8 | 6 |
| 2017-04-19 | Wed | Morchella semilibera | 3.4 | 5.4 | 7.1 | -0.4 | 7.9 | 28 | 31.2 | 51.7 | 3 |
| 2017-04-25 | Tue | Morchella semilibera | 4.2 | 5.8 | 5.9 | -2.1 | 7.2 | 7.1 | 37.8 | 45.8 | 0 |
| 2017-05-03 | Wed | Morchella semilibera | 10.7 | 6.7 | 6.3 | 0.3 | 7.6 | 32.4 | 40.4 | 71.6 | 3 |
| 2017-05-08 | Mon | Morchella semilibera | 8.1 | 10.2 | 7.9 | 4.1 | 9 | 2.5 | 40.3 | 73.7 | 0 |
| 2017-05-11 | Thu | Morchella semilibera | 7.6 | 9 | 8.3 | 1.2 | 9.6 | 11.1 | 38.2 | 82.2 | 0 |
| 2018-05-02 | Wed | Morchella semilibera | 9.9 | 10 | 11.4 | 5.6 | 10 | 21.9 | 22.5 | 31.5 | 0 |
| 2019-03-31 | Sun | Morchella semilibera | 5.7 | 7.5 | 7 | 1.7 | 6.5 | 2.1 | 5.1 | 99.4 | 5 |
| 2019-04-07 | Sun | Morchella semilibera | 10.2 | 8 | 7.7 | -3 | 7.1 | 0 | 2.1 | 56 | 12 |
| 2019-04-09 | Tue | Morchella semilibera | 4 | 9.2 | 8.2 | 2.9 | 7.5 | 0 | 0.4 | 50.9 | 14 |
| 2019-04-17 | Wed | Morchella semilibera | 8.9 | 4.2 | 6.5 | -0.7 | 6.4 | 0.3 | 0.3 | 3.2 | 22 |
| 2019-05-03 | Fri | Morchella semilibera | 6.1 | 11.8 | 11.8 | 4.7 | 10.8 | 10.9 | 12.1 | 12.4 | 5 |
| 2021-05-12 | Wed | Morchella semilibera | 13.4 | 10.3 | 9.1 | 3.3 | 9.6 | 28.4 | 49.4 | 50.5 | 0 |
| 2021-05-13 | Thu | Morchella semilibera | 12.7 | 11.2 | 9.5 | 3.3 | 10.1 | 13.2 | 49.5 | 50.6 | 1 |
| 2021-05-13 | Thu | Morchella semilibera | 12.7 | 11.2 | 9.5 | 3.3 | 10.1 | 13.2 | 49.5 | 50.6 | 1 |
| 2021-05-13 | Thu | Morchella semilibera | 12.7 | 11.2 | 9.5 | 3.3 | 10.1 | 13.2 | 49.5 | 50.6 | 1 |
| 2021-05-16 | Sun | Morchella semilibera | 11.2 | 13.3 | 10.3 | 7 | 11.7 | 12.2 | 44 | 52.9 | 2 |
| 2022-05-04 | Wed | Morchella semilibera | 10.4 | 9.6 | 9.7 | 1.8 | 9.5 | 0 | 0.4 | 33.4 | 26 |
| 2023-05-03 | Wed | Morchella semilibera | 8.8 | 8.1 | 9.2 | -0.4 | 9 | 0 | 7.1 | 30.3 | 8 |
| 2024-04-12 | Fri | Morchella semilibera | 11.4 | 11.5 | 8.7 | 6.1 | 10.3 | 13.7 | 46.2 | 60.2 | 0 |
| 2024-04-21 | Sun | Morchella semilibera | 4.6 | 6.6 | 9.3 | -0.1 | 9.4 | 9.4 | 15.8 | 64.3 | 1 |
| 2024-04-21 | Sun | Morchella semilibera | 4.6 | 6.6 | 9.3 | -0.1 | 9.4 | 9.4 | 15.8 | 64.3 | 1 |
