# Space Junior — Guía para Agentes y Desarrollo (AGENTS.md)

Responde en español. Sé crítico y realista: no le des la razón al usuario si no la tiene; señala riesgos técnicos o de diseño y recomienda lo mejor para el proyecto.

## 1. Qué es el proyecto
Juego educativo para el reto **"Build a Junior Astronaut Mission Trainer"** del NASA Space Apps Challenge 2026 (evento: 14 y 15 de noviembre de 2026). Público: niños de 7 a 12 años.

## 2. Arquitectura y Frentes de Trabajo
Este es el repositorio oficial de la entrega, creado el 14 de noviembre de 2026 (inicio del evento). No copiar código de repositorios de práctica previos.

| Carpeta | Frente | Responsabilidad |
|---|---|---|
| `src/scenes/` | 1 · Base y movimiento | Escenas de Phaser, mapa Tiled, movimiento del jugador y cámara |
| `src/state/` | 2 · Estado y reglas | Estado centralizado (`store.ts`) y contrato compartido (`types.ts`) |
| `src/bots/`, `src/ui/`, `src/i18n/` | 3 · Bots, diálogos e interfaz | Reglas de tripulación, HUD en HTML/CSS y textos ES/EN |
| `src/data/`, `scripts/`, `.github/` | 4 · Datos, reporte y publicación | Datos de NASA (DONKI/CCMC), balance en JSON y CI/CD |

### Reglas de arquitectura e ingeniería
- **Estado único e inmutable (estilo reducer)**: Todo el estado del juego vive en un solo objeto (`src/state/store.ts`); cada decisión es una acción tipada que lo modifica. Esto mantiene la lógica predecible y permite auditar o extender a multijugador sin acoplar la vista.
- **Contrato compartido**: `src/state/types.ts` es el contrato entre todos los frentes. Cualquier cambio a este archivo requiere su propio Pull Request y aviso previo al equipo.
- **Aislamiento por frente**: Modifica únicamente las carpetas de tu frente asignado. Si necesitas cambios en otro frente, coordínalo mediante un issue o PR dedicado.
- **Internacionalización obligatoria**: Ningún texto visible para el jugador debe ir hardcodeado en el código fuente. Todo texto va en `src/i18n/es.json` y `src/i18n/en.json`.
- **Integridad de datos científicos**: Datos reales de NASA (DONKI, CME Scoreboard) se descargan con script y se sirven desde JSON local; nunca consultar APIs en vivo durante la demo ni presentar datos históricos como "en vivo". Todo dato de ejemplo lleva `"esEjemplo": true`.

## 3. Buenas Prácticas de Git y Repositorio

### Flujo de ramas (Branching)
- `main` está siempre estable y publicable. Cada push o merge a `main` despliega automáticamente a GitHub Pages.
- **Prohibido hacer push directo a `main`** durante el desarrollo normal: todo cambio entra por Pull Request con al menos una revisión.
- Nomenclatura de ramas: `frente<N>/<tema-corto>` o `<tipo>/<tema-corto>` (ej. `frente1/mapa-tiled`, `fix/colision-refugio`, `docs/guia-instalacion`).

### Commits limpios y atómicos
- Haz commits pequeños, atómicos y enfocados en un solo cambio lógico.
- Usa mensajes descriptivos en español o siguiendo formato convencional (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- **Sin etiquetas de IA ni co-autores automáticos**: No incluyas trailers `Co-Authored-By:` de asistentes de IA ni menciones de herramientas generativas en los mensajes de commit.
- **Verificación previa**: Ejecuta siempre `npm run build` (`tsc && vite build`) antes de hacer commit o push. Si el tipado o el build fallan, no se sube.

### Higiene del repositorio
- Nunca subas `node_modules/`, `dist/`, archivos `.env*`, logs ni configuraciones locales de editores.
- Mantén `package.json` con dependencias mínimas y justificadas.

## 4. Concepto del Juego y Reglas de Dominio
- El jugador es el **comandante** de una base hipotética en Marte, con una tripulación de 4 (inspirada en la misión CHAPEA de NASA).
- Llega una **tormenta solar real** (mayo de 2024; Curiosity midió ~8,100 microgray en la superficie, equivalente a ~30 radiografías de tórax; un día normal ronda 700 µGy).
- El aviso de la tormenta trae **margen de error real** (CME Scoreboard de CCMC: pronósticos que se desviaron por 17 y 43 horas). El dilema central es cuándo activar el blindaje y refugiar a la tripulación.
- Frase de pitch: *"NASA's forecast was wrong by 17 hours. Would you have kept your crew safe?"*
- Honestidad científica: la tormenta es real, la tripulación es hipotética.

### Tripulación (bots basados en reglas, no IA)
| Personaje | Rol real en que se basa | Responde por |
|---|---|---|
| Jugador | Comandante | Decisiones finales |
| Bot 1 | Ingeniero/a de vuelo | Energía, paneles, blindaje |
| Bot 2 | Oficial médico | Enfermería, dosis de radiación |
| Bot 3 | Oficial científico/a | Invernadero, comunicaciones, ciencia |

Los bots siguen reglas deterministas con diálogos escritos: caminan a su módulo por caminos fijos y, cuando su sistema está en riesgo, se acercan al jugador a pedir energía. Sus peticiones compiten por recursos a propósito. Usa siempre nombres ficticios (nunca los nombres reales de la tripulación de CHAPEA).

### Jugabilidad y Ciclo de Partida
- Base 2D vista desde arriba, 5–6 módulos unidos por pasillos: Invernadero, Pasillo central, Energía, Refugio, Comunicaciones, Enfermería.
- 3 recursos: **energía, soporte vital ($\text{O}_2$ y comida), blindaje**. ~10 unidades de energía por sol; nunca alcanzan para todo al máximo.
- Ciclo:
  1. Aviso con margen de error.
  2. Caminar y repartir energía entre módulos.
  3. Llega la tormenta (antes, a tiempo o tarde según el evento real).
  4. Todos corren al refugio; mientras tanto nadie atiende invernadero ni paneles.
  5. Reporte final: dosis recibida comparada con la medida por Curiosity y la fecha histórica real.
- Rejugable: cada partida usa un evento real distinto. Perder no castiga; enseña.
- Controles: teclado en PC; en móvil, tocar un módulo hace que el astronauta camine por un camino fijo (sin pathfinding complejo).

## 5. Stack y Alcance
- **Stack**: Phaser 3 + Vite + TypeScript + interfaz HTML/CSS superpuesta, publicado en GitHub Pages / Vercel.
- **Arte**: Mapa con tiles de Kenney (CC0) armado en Tiled. Personajes propios (sin imitar el estilo de Among Us). Prohibido usar el logotipo oficial de NASA.
- **Mínimo viable (MVP)**: Base con movimiento, comandante + 3 bots, 3 recursos, 1 tormenta con pronóstico incierto, refugio, reporte final con fuentes, enlace publicado.
- **Fuera de alcance**: Impostor/saboteador, motor de física complejo, 3D, consola de hardware físico, LLMs en tiempo de ejecución para los bots.

## 6. Fuentes Oficiales
- Reto: https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/
- FAQ: https://www.spaceappschallenge.org/resources/participant-faqs/
- Tormenta en Marte 2024: https://www.nasa.gov/solar-system/planets/mars/nasa-watches-mars-light-up-during-epic-solar-storm
- CME Scoreboard: https://webtools.ccmc.gsfc.nasa.gov/CMEscoreboard/
- CHAPEA: https://www.nbcnews.com/science/space/nasa-completes-first-mission-simulating-astronaut-life-mars-rcna160987
