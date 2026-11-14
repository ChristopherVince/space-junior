# Space Junior

Juego en navegador para el reto **Build a Junior Astronaut Mission Trainer** (NASA Space Apps Challenge 2026). Niños de 7 a 12 años son el comandante de una base hipotética en Marte que debe proteger a su tripulación de una tormenta solar real, con pronósticos que fallan igual que fallaron en la realidad.

- Guía de arquitectura y agentes: [`AGENTS.md`](AGENTS.md)
- Reglas de contribución: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Tablero de tareas: GitHub Projects del repositorio

## Empezar

```bash
npm install
npm run dev
```

Abre la dirección que muestra la terminal. `npm run build` genera la versión publicable en `dist/`. Cada push a `main` se publica solo en GitHub Pages.

## Estructura y responsables

| Carpeta | Frente |
| --- | --- |
| `src/state/` | 2 · Estado y reglas (`types.ts` es el contrato compartido) |
| `src/scenes/` | 1 · Base y movimiento |
| `src/bots/`, `src/ui/`, `src/i18n/` | 3 · Bots, diálogos e interfaz |
| `src/data/`, `scripts/`, `.github/` | 4 · Datos, reporte y publicación |

## Datos de NASA

| Dato | Fuente |
| --- | --- |
| Tormentas solares | DONKI (NASA) |
| Pronóstico contra llegada real | CME Scoreboard (CCMC, NASA) |
| Dosis en Marte, mayo de 2024 | [NASA: Curiosity durante la tormenta solar](https://www.nasa.gov/solar-system/planets/mars/nasa-watches-mars-light-up-during-epic-solar-storm) |
| Hábitat y roles de la tripulación | Misión CHAPEA de NASA |

La tormenta es real; la tripulación es hipotética. Los datos son históricos y se muestran como tales.
