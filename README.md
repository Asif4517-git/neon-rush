# NEON RUSH

A complete, playable 3D arcade racing game for the browser. Built with React, TypeScript, Three.js and the Web Audio API. Everything — cars, circuits, city, lighting, particles and soundtrack — is generated procedurally at runtime. No external 3D models or audio files are required.

![NEON RUSH main menu](screenshots/01-main-menu.png)

## Developer

**NEON RUSH** was created and developed by **Asif**.

- Portfolio: <https://asif4517-git.github.io/>
- Instagram: [@asif_xrk](https://instagram.com/asif_xrk)
- Email: [asifsrk4517@gmail.com](mailto:asifsrk4517@gmail.com)

Attribution appears on the home page and on the dedicated **About** page, which is linked from the main navigation (including mobile) and from the **About** tab in Settings. The website metadata (`author`, `creator`, `developer`, `copyright` and `rel="author"`) also credits Asif. Only the details supplied above are listed.

## Deploy to GitHub Pages

The project ships with a GitHub Actions workflow that builds and publishes the game automatically. Full instructions, including how to keep the existing `asif4517-git.github.io` portfolio intact, are in **[GITHUB_PAGES.md](GITHUB_PAGES.md)**.

Short version:

```bash
git init
git add .
git commit -m "NEON RUSH — 3D arcade racing game"
git branch -M main
git remote add origin https://github.com/asif4517-git/neon-rush.git
git push -u origin main
```

Then set **Settings → Pages → Source** to **GitHub Actions**. The game goes live at
**https://asif4517-git.github.io/neon-rush/** (or at the root if you name the repository
`asif4517-git.github.io`). The workflow uses Node 22, needs no secrets and skips Puppeteer's
browser download to keep builds fast. A manual `gh-pages` fallback is documented in the guide.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build (single self-contained HTML file):

```bash
npm run build
npm run preview    # http://localhost:4173
# or open dist/index.html directly
```

The build inlines all JS, CSS and textures into `dist/index.html` (~2.5 MB, ~1.4 MB gzipped).
Chrome, Edge, Firefox or Safari with WebGL2 is recommended. Google Fonts load from the network; local fallback fonts are declared.

## Controls

| Action | Key |
| --- | --- |
| Accelerate | `W` / `↑` |
| Brake / reverse | `S` / `↓` |
| Steer | `A` `D` / `←` `→` |
| Handbrake / drift | `Space` |
| Nitro boost | `Shift` |
| Pause | `Esc` |
| Change camera | `C` |
| Recover to track | `R` |

Touch controls appear automatically on coarse-pointer devices (steer, gas, brake, drift, nitro). All audio starts only after the first user interaction, as required by browser autoplay policies.

## Game content

### Circuits (3)

| Circuit | Character | Laps | Length |
| --- | --- | --- | --- |
| **Neon Mirage** | Downtown street circuit, flow to technical chicane | 3 | 1.12 km |
| **Midnight Skyway** | Elevated, huge radius sweepers, high speed | 2 | 1.48 km |
| **Chrome Docks** | Narrow, 17 turns, low grip — drift territory | 3 | 0.96 km |

Each circuit is generated from a closed Catmull-Rom spline with elevation, then textured with road wear, lane markings, kerbs, barriers, neon rails, support columns, start gantry, two checkpoint gates and apex markers. Track boundaries are arc-length sampled for physics, lap progress, checkpoint validation and the minimap.

### Cars (3)

| Car | Drivetrain | Balance |
| --- | --- | --- |
| **Vanta GT** | AWD | Balanced all-rounder |
| **Spectre X** | RWD | Highest top speed and nitro output |
| **Ronin Evo** | AWD | Best launch and cornering grip |

Cars are procedurally modelled from layered bodywork, a hand-built tapered glass canopy, carbon aero, spoilers, diffusers, mirrors, rim spokes, brake calipers and emissive light bars. Wheels spin with road speed and the front axle visibly steers. Brake lights brighten under braking, nitro flames scale with boost, and each car projects a coloured underglow.

## Features

**Driving & racing**
- Real-momentum arcade physics: the chassis rotates while world velocity is conserved, producing genuine slip and recoverable handbrake drifts.
- Speed-sensitive steering, grip/slip simulation, lateral tyre scrub, counter-steer stabilisation and elevation forces.
- Nitro with drain, recharge and drift-recharge; scale animation, flame particles, camera FOV kick and speed lines.
- Curb-hopping and wall collisions with impact-normal response, spark particles, camera shake and collision audio.
- 5 AI opponents following look-ahead racing lines with curvature-aware cornering, lane stagger, avoidance and gentle rubber-banding.
- Grid start, live position calculation, two validated sector checkpoints, lap counter, lap/best-lap timing, race timer and finish classification.
- Start-light countdown, pause, resume, restart, recovery reset, finish slow-down and cinematic results camera.
- Win, podium and defeat results with a full classification table, gaps, telemetry, best-lap record detection and persistent local records.

**Presentation**
- Three chase cameras (chase, wide, bumper), aspect-aware portrait framing, smooth damping and camera containment inside the circuit.
- HDR tone mapping, physically based car paint, environment reflections via a procedural PMREM environment map, bloom post-processing, fog, soft shadows (quality dependent).
- Procedurally generated neon skyline: instanced towers with emissive window maps, rooftop trims, corner light strips, street-light arrays, animated holograms, billboards, orbital traffic, stars, haze, moon and a shader sky gradient.
- GPU particle pools for nitro, tyre smoke and sparks; speed-sensitive effects.
- Fully synthesized audio: RPM-reactive triple-oscillator engine, road noise, drift squeal, gear shifts, nitro whoosh, impacts, countdown, UI cues and a four-chord synthwave sequencer. Separate master / music / SFX buses.
- Quality presets (Performance, Balanced, Cinematic) applied live, including bloom, shadow resolution and pixel ratio.
- Responsive storefront: main menu, garage, circuits, settings, driver briefing, HUD, pause menu and results. Persistent settings and records in `localStorage`.

## Project structure

```
src/
  App.tsx                    # screen state machine, persistence, race config
  components/
    Menu.tsx  Garage.tsx  Circuits.tsx  Settings.tsx  HowTo.tsx
    About.tsx                # full-page developer attribution and contact links
    RaceScreen.tsx           # engine lifecycle, pause UI, live quality/audio
    Hud.tsx                  # hUD, minimap, standings, speedo, nitro, touch
    Results.tsx              # classification, telemetry, records
    Icons.tsx  ui.tsx        # SVG icons and shared UI primitives
  game/
    GameEngine.ts            # simulation, AI, laps, collisions, camera, post FX
    carModel.ts              # procedural car modelling, wheels, lights, nitro FX
    track.ts                 # spline track, road ribbons, barriers, gates
    environment.ts           # city, sky, lights, billboards, holograms
    particles.ts             # GPU particle pools
    audio.ts                 # synthesized engine, SFX and music
    textures.ts              # canvas-generated textures
    credits.ts               # developer attribution (single source of truth)
    data.ts  types.ts  trackPreview.ts
  assets/                    # hero art and garage renders (AI-generated)
artifacts/                   # raw headless-browser captures and QA reports
screenshots/                 # curated delivery screenshots
scripts/                     # Puppeteer test harnesses used for QA
docs/TESTING.md              # feature matrix, test evidence, limitations
```

## Testing summary

The game was tested in headless Chromium (SwiftShader WebGL2) using real browser interactions, screenshots, console/error collection and a deterministic simulation harness. Full results are in [`docs/TESTING.md`](docs/TESTING.md). Highlights:

- Production build passes with zero TypeScript errors.
- All three circuits complete 2/3-lap races, including checkpoints, AI and finish classification.
- Drift, nitro, braking and wall-collision assertions pass.
- Start line, both sector gates, lap counting and record persistence verified.
- Quality switching, pause/resume, mobile viewport and touch input verified.
- No console errors in the final test runs.

## Known limitations

- Opponents are AI, not online players. There is no ghost replay or network multiplayer.
- Cars and scenery are procedural Three.js models; Blender was not available in the build environment, so there are no GLTF assets.
- Collisions use sampled track-boundary and circle-based car collision — arcade-accurate, not rigid-body physics.
- Reflection detail relies on environment maps, not screen-space reflections.
- Headless rendering used software WebGL, so measured visual output is representative but frame rate on real GPU hardware was not directly benchmarked. The fixed-step simulation loop keeps game time correct on slower machines.
- Records are stored per browser profile only.
- Fonts are fetched from Google Fonts; offline playback uses fallback typography.

## Assets

- Hero and garage imagery: generated for this project with an AI image model.
- All other textures, models, particle effects and audio: procedurally generated in code.
- [Three.js](https://threejs.org) (MIT) is the only runtime rendering dependency.
