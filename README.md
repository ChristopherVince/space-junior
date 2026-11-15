# Space Junior — Mars Mission Simulator

> *"NASA's forecast was wrong by 17 hours. Would you have kept your crew safe?"*

**Space Junior** is a browser-based 3D educational game built for the **[Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)** challenge at the **2026 NASA Space Apps Challenge**.

Designed for children aged **7 to 12**, players step into the role of **Mission Commander** of a hypothetical Mars habitat modeled after NASA's 3D-printed **Mars Dune Alpha** (**CHAPEA** analog mission). Together with three specialist crewmates, the Commander must manage scarce daily power and decide when to seal the crew inside the radiation shelter as a **real historical solar storm** approaches—complete with the forecast uncertainty faced by real space-weather forecasters.

---

## Table of Contents

1. [Educational Purpose & Scientific Honesty](#1-educational-purpose--scientific-honesty)
2. [Gameplay Mechanics & Mission Loop](#2-gameplay-mechanics--mission-loop)
3. [Crew Roles & Habitat Modules](#3-crew-roles--habitat-modules)
4. [Official NASA Data & Scientific Sources](#4-official-nasa-data--scientific-sources)
5. [Technical Architecture & Project Structure](#5-technical-architecture--project-structure)
6. [Getting Started, Scripts & Automated Tests](#6-getting-started-scripts--automated-tests)
7. [Workflow & Related Documentation](#7-workflow--related-documentation)

---

## 1. Educational Purpose & Scientific Honesty

Space Junior bridges authentic NASA space-weather data with intuitive decision-making for young learners:

- **The storm is real; the crew is hypothetical**: The game clearly distinguishes between historical measurements captured by NASA instruments and the fictional crew simulation (since no humans live on Mars yet).
- **Space-weather forecast uncertainty**: Coronal Mass Ejection (CME) arrival forecasts carry an inherent margin of error. Players experience firsthand why delaying shield charging or leaving the communications array unpowered can leave a habitat unprepared when a solar storm arrives hours earlier than predicted.
- **Learning without punishment**: Losing or absorbing a high radiation dose never punishes the player; instead, the post-mission report explains what went wrong in each module, compares the crew's absorbed dose against the real May 2024 *Curiosity* rover measurements, and provides actionable tips for the next mission.

---

## 2. Gameplay Mechanics & Mission Loop

Each playthrough selects a real historical solar storm from the local catalog (`src/data/events.json`) and progresses through four phases:

1. **Mission Briefing & Forecast (`aviso` → `preparacion`)**:
   - Upon clicking **Play**, a kid-friendly mission briefing introduces the Commander's role, the three crewmates, and the core objectives.
   - The top-right HUD displays the estimated countdown to the solar storm along with its uncertainty window in hours.
2. **Power Allocation & Crew Dilemmas (`preparacion`)**:
   - The habitat generates **10 power units per sol** (one Martian day, ~24 h 39 min)—never enough to run every module at full capacity simultaneously.
   - The player walks through the 3D habitat and distributes power across:
     - **Greenhouse**: Sustains **Life Support** ($\text{O}_2$ and food production).
     - **Power (Solar Array)**: Gradually charges the **Shelter Shielding**.
     - **Comms**: Monitors solar activity to trigger an **Early Warning** hours before impact.
   - Autonomous crewmates walk up to the Commander with competing requests whenever their assigned systems are neglected.
3. **Early Warning & Solar Storm Impact (`refugio` → `tormenta`)**:
   - The storm may arrive randomly within the early-arrival window (up to 7 hours before the forecast counter reaches `0`) or right as the countdown hits `0`.
   - During the storm, the greenhouse and solar panels shut down, the crew rushes to the **Shelter**, and floating diagnostic badges appear directly over the affected modules on the 3D map to highlight specific oversights (missing early warning in Comms, low shielding in the Shelter/Power bay, critical life support in the Greenhouse, or crew members left exposed outside the shelter).
4. **Post-Mission Scientific Report (`reporte`)**:
   - Awards **1 to 3 stars**, breaks down each crew member's absorbed radiation dose in micrograys ($\mu\text{Gy}$) alongside an intuitive comparison in "normal Martian days," and plots the real hourly radiation curve recorded by *Curiosity*'s **RAD** instrument between May 19 and May 22, 2024.

### Controls

| Action | Desktop (Keyboard & Mouse) | Mobile / Touch Devices |
| --- | --- | --- |
| **Move Commander** | `WASD` or Arrow keys (camera-relative) or click any module | Tap any module or its floating 3D label |
| **Switch Camera View** | Keys `1`, `2`, `3` or drag/zoom with mouse (`OrbitControls`) | Touch drag to orbit and pinch to zoom |
| **Assign / Remove Power** | `+` and `−` buttons on the module panel when inside a module | `+` and `−` buttons on the module panel |
| **Side Panels & Pause** | `Modules`, `Crew`, `Log`, and `Menu` (`Esc`) buttons | Touch buttons on the HUD |

---

## 3. Crew Roles & Habitat Modules

The 3D diorama replicates the floor plan of **Mars Dune Alpha** (NASA's 3D-printed Mars surface habitat at Johnson Space Center used for the CHAPEA analog missions):

### Crew Roster (Deterministic Rule-Based Bots)

| Character | CHAPEA-Inspired Role | Area of Responsibility |
| --- | --- | --- |
| **Player** | Mission Commander | Final power allocation decisions and shelter evacuation timing |
| **Valeria** (Bot 1) | Flight Engineer | Solar array, power reserves, and charging the shelter's radiation shield |
| **Dr. Mateo** (Bot 2) | Medical Officer | Med Bay, radiation exposure warnings, and shelter protection checks |
| **Dr. Sofia** (Bot 3) | Science Officer | Greenhouse ($\text{O}_2$ & crops) and early-warning Communications dish |

> In accordance with challenge guidelines, all crewmate names are fictional.

### Habitat Modules

- **🛡️ Shelter (`refugio`)**: Heavily shielded quarters where the crew takes cover during solar storms. Its radiation reduction scales with the shielding percentage charged prior to impact.
- **🌱 Greenhouse (`invernadero`)**: Produces oxygen and food. Requires ~4 power units to keep Life Support stable.
- **⚡ Power (`energia`)**: Interfaces with the exterior solar array to charge the shelter's radiation shielding before the storm hits.
- **📡 Comms (`comunicaciones`)**: When powered with at least 1 unit, tracks solar eruptions and issues an early warning before the storm strikes.
- **➕ Med Bay (`enfermeria`)**: Tracks crew health and cumulative absorbed radiation doses.
- **🧭 Central Corridor (`pasillo`)**: Main hub connecting all modules of Mars Dune Alpha.

---

## 4. Official NASA Data & Scientific Sources

All scientific datasets are pre-fetched and served from local JSON files (`src/data/`) to guarantee offline reliability, reproducibility, and scientific integrity (historical records are never presented as live telemetry):

| Scientific Component | Reference Values Used in Game | Official Source |
| --- | --- | --- |
| **Radiation on Mars (May 2024)** | Mean background rate of **$4.115\ \mu\text{Gy/h}$** (May 15–19, 2024 samples); **$1,645\ \mu\text{Gy}$** integrated over the selected analysis window from May 20 (`05:38:56 UTC`) to May 21 (`13:04:44 UTC`); hourly peak of **~$304\ \mu\text{Gy/h}$**. | [NASA RadLab — Curiosity RAD](https://www.nasa.gov/solar-system/planets/mars/nasa-watches-mars-light-up-during-epic-solar-storm) |
| **Coronal Mass Ejection Catalog** | Historical space-weather events stored locally in `src/data/events.json`. | [NASA DONKI](https://kauai.ccmc.gsfc.nasa.gov/DONKI/) |
| **Forecast vs. Actual Arrival** | Comparison between predicted arrival times and observed arrivals near Earth (real forecast errors ranging from 17 to 43 hours). | [NASA CCMC — CME Scoreboard](https://webtools.ccmc.gsfc.nasa.gov/CMEscoreboard/) |
| **Habitat Layout & Crew Roles** | *Mars Dune Alpha* floor plan and 4-specialist analog crew structure. | [NASA CHAPEA Mission](https://www.nasa.gov/humans-in-space/chapea/) |
| **Martian Sol Duration** | $1\text{ sol} \approx 24\text{ h } 39\text{ min}$ (approximated in simulation rules as $24.65\text{ h}$). | NASA Mars Fact Sheet |

---

## 5. Technical Architecture & Project Structure

### Tech Stack

- **3D Rendering**: [Three.js](https://threejs.org/), [React Three Fiber](https://r3f.docs.pmnd.rs/), and [@react-three/drei](https://github.com/pmndrs/drei) featuring dynamic storm lighting, solar particle effects (`SolarStormVFX`, `StormEffects`), and $X/Z$-plane AABB collision detection.
- **State & Domain Logic**: [TypeScript](https://www.typescriptlang.org/) powered by a **single immutable reducer-style store** (`src/state/store.ts`), cleanly decoupled from the rendering layer.
- **HTML/CSS HUD & Internationalization**: Modular UI overlays (`#interfaz`) with full **English / Spanish** localization (`src/i18n/en.json` and `src/i18n/es.json`) and zero hardcoded user-facing strings.
- **Build & CI/CD**: [Vite](https://vite.dev/) with automated deployment to **GitHub Pages** via GitHub Actions (`.github/workflows/deploy.yml`).

### Repository Structure by Workstream

```text
space-junior/
├── src/
│   ├── scenes/diorama/   # Workstream 1 · Mars Dune Alpha 3D diorama, cameras, astronauts, routes & AABB collisions
│   ├── state/            # Workstream 2 · Immutable store (store.ts), shared contract (types.ts), match & scoring logic
│   ├── bots/             # Workstream 3 · Deterministic rule engine for crew requests and alerts (bots.ts)
│   ├── ui/               # Workstream 3 · Start screen, mission briefing, HUD, side panels, glossary & final report
│   ├── i18n/             # Workstream 3 · Bilingual dictionaries (es.json, en.json) verified for key parity
│   ├── data/             # Workstream 4 · Local NASA datasets (curiosity_mayo2024.json, events.json) & balance.json
│   ├── main.tsx          # Application entry point
│   └── style.css         # Global styles, responsive HUD layout, and animations
├── scripts/              # Workstream 4 · Data fetching and preprocessing utilities
├── tests/diorama/        # Automated unit & integration test suite (Node Test Runner + esbuild)
├── AGENTS.md             # Architecture guide, domain rules, and engineering conventions
└── CONTRIBUTING.md       # Branching workflow, commit standards, and Pull Request guidelines
```

---

## 6. Getting Started, Scripts & Automated Tests

### Prerequisites

- **Node.js** `>= 20.x` and **npm**.

### Core Commands

```bash
# 1. Install dependencies
npm install

# 2. Start the development server with Hot Module Replacement (HMR)
npm run dev

# 3. Run the full automated test suite (28 tests)
npm test

# 4. Type-check with TypeScript and build the production bundle in dist/
npm run build

# 5. Preview the production build locally
npm run preview
```

### Automated Test Suite (`npm test`)

The project includes **28 automated tests** under `tests/diorama/*.test.mjs` covering:
- **RadLab Scientific Balance**: Full-game simulations across all 16 historical solar storm events verifying resource trade-offs and exact alignment with `curiosity_mayo2024.json`.
- **3D Collisions & Navigation**: AABB wall and furniture collision resolution, anti-tunneling checks, and pathfinding verification across all touch routes and shelter evacuation paths.
- **Crew Bot Rules**: Request cooldowns, per-match request caps, non-repeating dialogue lines, and early-warning/storm alerts.
- **Pause, Reset & i18n Parity**: Complete state and bot cleanup when abandoning or restarting a mission, chronological mission log tracking, and 100% key parity between `src/i18n/es.json` and `src/i18n/en.json`.

---

## 7. Workflow & Related Documentation

- **Architecture & Domain Guide**: See [`AGENTS.md`](AGENTS.md) for detailed workstream boundaries, the shared state contract (`src/state/types.ts`), and domain rules.
- **Contribution Guidelines**: Review [`CONTRIBUTING.md`](CONTRIBUTING.md) for branching conventions (`frente<N>/<topic>`), atomic commit rules, and Pull Request verification (`npm test && npm run build`).
