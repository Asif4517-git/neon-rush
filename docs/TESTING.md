# NEON RUSH — Testing Report

This report covers testing that was actually performed on the delivered build. The environment had no pre-installed browser or Blender. A headless Chromium (Chrome for Testing 148, SwiftShader WebGL2) was installed locally purely for QA, with the required shared libraries extracted into a user-space path. Tests drove the real application through Puppeteer; nothing below is simulated by mocking the game.

## Build & static checks

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | Pass, 0 errors (strict mode, `noUnusedLocals`) |
| `npm run build` | Pass — single-file `dist/index.html`, ~2.53 MB / ~1.40 MB gzip |
| Runtime dependencies | Three.js only (plus React) |
| Dev QA dependencies | `puppeteer` |

## Test inventory (all executed)

| # | Area | Method | Result |
| --- | --- | --- | --- |
| 1 | Menu render / assets | Headless screenshot + DOM audit | 12 buttons, 0 horizontal overflow, fonts `loaded` |
| 2 | Race boot | Start race, inspect engine state | Canvas 1600×900, engine instantiated, HUD present, 11 scene groups |
| 3 | Full race — Neon Mirage | Autopilot simulation of the real engine | 3 laps, 3 checkpoints, finish P1, best lap 30.07 s, results screen |
| 4 | Full race — Midnight Skyway (Spectre X) | Autopilot run | 2 laps, finish P1, 01:10.30, best lap 29.73 s, record persisted |
| 5 | Full race — Chrome Docks (Ronin Evo) | Autopilot run | 3 laps, finish P6, 02:54.53, no crash; AI competitive |
| 6 | Start line / lap semantics | Frame-by-frame lap trace | First crossing opens “LAP 01 OF 3” (no false invalid lap); sectors 1+2 clear; next lap is classified |
| 7 | Drift physics | Deterministic 60 Hz simulation | 41 drift frames, lateral slip peak 24.06 m/s, 100 style points, nitro recharge |
| 8 | Nitro | Simulation + live keyboard | 80 → 62 nitro in 0.75 s of boost, flame scale 1.15, FOV kick, 1.24× speed cap |
| 9 | Braking | Simulation | 50 m/s → 0.3 m/s in one second of braking |
| 10 | Wall collision | Forced outward impact | Car contained at offset 6.72 (half-width 7.75), camera shake 0.53, no tunnelling |
| 11 | Car collision | Circle proximity resolve | Separation and speed transfer observed during autopilot races |
| 12 | Camera modes | Programmatic mode cycling | chase 8.61 m / far 13.26 m / bumper 1.28 m follow distance, FOV 62→67 |
| 13 | Real-time clock | Live browser test | Game clock advanced and countdown completed with fixed-step simulation; acceleration reached 97 km/h under live `W` input |
| 14 | Pause / resume | Real `Escape` key + menu buttons | `.pause-scrim` visible, `paused = true`, resume sets false; options panel opens |
| 15 | Live quality | Click low/medium/high in pause | low: bloom off + shadows off; medium & high: bloom on; persisted to localStorage |
| 16 | Touch controls | Mobile viewport pointer events | GAS press added `KeyW`, release removed it; `.touch-controls` displayed flex |
| 17 | Mobile layout | 390×844, DPR 2 audit | No horizontal overflow; zero HUD panel overlaps (5 visible panels); canvas present |
| 18 | Audio | Inspect AudioContext after gesture | Context `running`, 3 engine oscillators active, music sequencer running |
| 19 | Persistence | Read localStorage after finish | `bestTimes.skyway`, `wins`, `races` written; settings saved |
| 20 | Console health | Error and pageerror listeners | 0 errors in final menu, race, results, quality, mobile and full-race runs |

## Bugs found by testing and fixed

1. **Velocity was rotated with the chassis** — lateral slip could never build, so drifting was impossible. Fixed by conserving world velocity and rotating the chassis around it. Drift now verified.
2. **Simulation bound to render rate** — under slow software rendering the countdown barely advanced. Fixed with a fixed 60 Hz accumulator; game time now tracks real time and handling is deterministic.
3. **Unbound resize handler** — `clientWidth` of undefined raised a runtime error on resize. Converted to a bound arrow.
4. **False “lap invalid” on race start** — the grid sits behind the start line. Added a `crossedLine` state so the first crossing opens lap one, with the progress update preserved to prevent a duplicate trigger.
5. **Visible headlight cone geometry** — translucent cone volumes washed out the view. Removed in favour of a real spotlight.
6. **Oversized kerbs / overexposure** — narrowed kerbs, darkened tarmac, reduced environment intensity and bloom, tuned exposure.
7. **Start camera inside the gantry** — re-framed the countdown orbit and added portrait aspect compensation.
8. **Results side panel clipped** in one capture — removed the delayed entrance animation from the two-column layout and re-verified (panel 567×554 px with all 6 rows).

## Visual evidence

All captures are from the delivered build in headless Chromium (`artifacts/`):

- `01-main-menu.png` — storefront
- `02-garage.png` — car selection
- `03-circuits.png` — circuit selection
- `04-countdown.png` — race start framing / start lights
- `05-race-boost.png` — nitro, HUD, standings and minimap
- `06-race-drift.png` — drift state
- `07-pause.png` — pause / options
- `08-results.png` — classification and telemetry
- `09-mobile-menu.png` — responsive menu
- `10-mobile-race.png` / `mobile-hud-final.png` — mobile HUD and touch controls

## Reproducing the tests

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173

# in another terminal, with a Chrome/Chromium available to Puppeteer:
node scripts/test-game.mjs      # end-to-end race + results
node scripts/lap-test.mjs       # lap semantics + mobile layout
node scripts/live-test.mjs      # real keyboard clock/input/audio
node scripts/dynamics-test.mjs  # boost, drift, braking, collisions
node scripts/final-qa.mjs       # tracks, quality, touch, persistence
```

In this environment Chromium needed user-space shared libraries; they were extracted into `/tmp/chromelibs` and `LD_LIBRARY_PATH` was set before running. On a normal desktop with Chrome installed, no such workaround is required.

## Limitations of this testing

- The browser ran software WebGL. Frame rate numbers are therefore not meaningful as desktop hardware benchmarks; visuals (especially bloom and shadows) may differ on real GPUs.
- Automated driving used a deterministic autopilot rather than human feel testing. Handling parameters were tuned from physics assertions and visual inspection, not large-scale playtests.
- No Safari/Firefox or physical touch-device test was possible in this environment; responsive layout and pointer events were verified in Chromium emulation.
- No online services are used, so network failure modes are limited to the Google Fonts request (fallbacks declared).
