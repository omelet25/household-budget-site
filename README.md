# household-budget-site

[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/omelet25/household-budget-site/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/omelet25/household-budget-site/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

**HomeLedger** — a working household budget site for the Harper household, a family of four
in Maplewood, Ohio. One ledger of 258 real entries (June to November 2026) drives every
figure on the site: a dashboard with month totals and budget pace, a searchable transaction
ledger you can add to, editable category budgets, reports with hand-drawn SVG charts and
plain-language findings, savings goals and recurring bills with due dates, and three budget
calculators — a monthly simulator, a 50/30/20 check and an emergency fund planner.

The site is plain static files with no build step, no framework and no network request:
system fonts only, charts drawn as inline SVG, and every number computed in the browser
from the single ledger file. It works on a desktop and on a phone, offline.

## Run it

```sh
python3 -m http.server --directory app 8080
```

Then open http://localhost:8080/ in a browser. To build the submission package instead:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes
`dossier.json` with the kit's `buildDossier`. It uses only the Node standard library.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457) · AI agents build software for cash rewards</sub>
