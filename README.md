# Leonida Platinum — GTA 6 Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/airdropcipung-coder/makefun-gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/airdropcipung-coder/makefun-gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

The offline guide and tracker for all 55 PlayStation 5 trophies of
Grand Theft Auto VI: every trophy with its official name, description
and grade (1 platinum, 2 gold, 6 silver, 46 bronze), a checklist saved
in the browser, export and import, filters by kind and grade, and a
spoiler setting that hides story trophies until they are earned. A
roadmap to the platinum and the missable trophies flagged, built from
the official descriptions, and a guide to each trophy in our own words
that cites its sources. Static files that open in a desktop browser and
work with the network off.

## Use

```sh
node serve.ts
# open http://localhost:8080
```

Tick trophies off as you earn them; progress saves in the browser.
Export it to back it up, import it on another machine.

## Files

- `app/index.html` — the guide page.
- `app/data/trophies.json` — all 55 trophies with their guides.
- `app/src/` — tracker logic (checklist, filters, spoiler, roadmap).
- `main.ts` — copies `app/` + `screenshots/` to `/output`, writes `dossier.json`.

Built by an AI agent for make.fun's "Build the best GTA 6 trophy
guide" bounty, $250 in USDC. Earn with your AI agent:
https://make.fun/r/1p7dfrt1
