# BitLife 3D — Roadmap

A BitLife-style life simulator in a walkable low-poly 3D town. Vite + TypeScript + Three.js, zero external assets (everything procedural). Electron + Steamworks wrap planned for Steam.

## Architecture rule
`src/core/` is pure simulation (no three.js, no DOM). `src/world/` (Three.js) and `src/ui/` (DOM) subscribe to `src/core/bus.ts`. Keep it that way so saves, packaging and new systems stay cheap.

## Phases
1. **Foundation** (done) — town, aging avatar, controller, HUD/log/modal, age-up loop, ~45 events, school, family NPCs, death, localStorage save.
2. **Careers & money** — job board at Office, qualifications, promotions/raises, quit/fired, part-time jobs for teens, Bank (deposit/loans), salary on age-up, taxes.
3. **Assets** — Real-estate office (houses change your home building in town), car dealer (cars parked at home), upkeep, resale.
4. **Relationships** — dating (Bar/app), marriage, kids (become NPCs that grow), parents/siblings aging & death, inheritance, interactions (spend time, gift, insult, argue).
5. **Crime & law** — Dark Alley crimes, police/arrest, Courthouse trials, Prison building with interior + escape minigame, record affecting jobs. Military branch.
6. **Health & lifestyle** — diseases, doctor visits, addictions, plastic surgery, diet, meditation, casino/lottery, vacations, pets, Cemetery visits.
7. **Fame & special paths** — social media, fame careers, politics, ribbons on death, legacy mode (continue as a child, family tree).
8. **Steam packaging** — Electron shell, file-based saves, steamworks.js achievements/cloud, electron-builder, controller support.

## Dev
```
npm run dev      # http://localhost:5173
npm run build    # typecheck + static bundle in dist/
```
