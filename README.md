# Space Junior — Simulador de Misión en Marte

> *"NASA's forecast was wrong by 17 hours. Would you have kept your crew safe?"*

**Space Junior** es un videojuego educativo en 3D para navegador desarrollado para el reto **[Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)** del **NASA Space Apps Challenge 2026**.

Diseñado para niñas y niños de **7 a 12 años**, el jugador asume el rol de **comandante** de una base hipotética en Marte inspirada en el hábitat impreso en 3D **Mars Dune Alpha** (misión **CHAPEA** de la NASA). Junto a tres compañeros de tripulación, debe administrar recursos críticos y decidir el momento oportuno para activar el refugio ante la llegada de una **tormenta solar real** cuyo pronóstico tiene margen de error, tal como ocurre en la meteorología espacial real.

---

## Tabla de Contenidos

1. [Propósito Educativo y Honestidad Científica](#1-propósito-educativo-y-honestidad-científica)
2. [Mecánicas de Juego y Ciclo de Partida](#2-mecánicas-de-juego-y-ciclo-de-partida)
3. [Tripulación y Módulos del Hábitat](#3-tripulación-y-módulos-del-hábitat)
4. [Fuentes Oficiales y Datos de la NASA](#4-fuentes-oficiales-y-datos-de-la-nasa)
5. [Arquitectura Técnica y Estructura del Proyecto](#5-arquitectura-técnica-y-estructura-del-proyecto)
6. [Instalación, Desarrollo y Pruebas](#6-instalación-desarrollo-y-pruebas)
7. [Flujo de Trabajo y Documentación Relacionada](#7-flujo-de-trabajo-y-documentación-relacionada)

---

## 1. Propósito Educativo y Honestidad Científica

El proyecto combina divulgación científica rigurosa con mecánicas accesibles para primaria y secundaria temprana:

- **La tormenta es real; la tripulación es hipotética**: El juego distingue explícitamente entre los datos históricos medidos por instrumentos de la NASA y la simulación de juego (todavía ningún ser humano vive en Marte).
- **Incertidumbre en los pronósticos espaciales**: Los pronósticos de eyecciones de masa coronal (CME) no son exactos. El jugador experimenta por qué postergar la carga del blindaje o apagar la antena de comunicaciones puede dejar a la base sin margen de reacción si la tormenta se adelanta.
- **Aprender sin castigar**: Perder o recibir una dosis elevada no bloquea al jugador; el reporte final explica qué ocurrió en cada módulo, compara los resultados con las mediciones reales del rover *Curiosity* en mayo de 2024 y ofrece recomendaciones concretas para la siguiente misión.

---

## 2. Mecánicas de Juego y Ciclo de Partida

Cada partida utiliza un evento histórico del catálogo local (`src/data/events.json`) y transcurre a lo largo de cuatro fases:

1. **Contextualización y Aviso (`aviso` → `preparacion`)**:
   - Al iniciar, una ventana de bienvenida presenta al comandante su misión y a sus 3 compañeros.
   - El HUD muestra la cuenta regresiva estimada hacia la tormenta solar junto con su margen de incertidumbre en horas.
2. **Administración de Energía y Dilemas (`preparacion`)**:
   - La base dispone de **10 unidades de energía por sol** (día marciano de ~24 h 39 min), insuficientes para operar todos los módulos al máximo simultáneamente.
   - El jugador recorre el diorama 3D y reparte energía entre:
     - **Invernadero**: Mantiene el **Soporte Vital** ($\text{O}_2$ y alimentos).
     - **Energía (Paneles solares)**: Carga progresivamente el **Blindaje** del refugio.
     - **Comunicaciones**: Permite detectar la llegada inminente de la tormenta y activar la alerta temprana.
   - Los compañeros de tripulación se acercan al comandante cuando detectan descuidos en sus sistemas para solicitar energía.
3. **Alerta Temprana e Impacto (`refugio` → `tormenta`)**:
   - La tormenta puede adelantarse aleatoriamente dentro de la ventana de incertidumbre (hasta 7 horas antes de que el reloj pronosticado llegue a `0`) o impactar al cumplirse el tiempo estimado.
   - Durante la tormenta, el invernadero y los paneles solares se detienen por seguridad, la tripulación corre al **Refugio** y sobre cada módulo del mapa 3D aparecen indicadores visuales de diagnóstico señalando qué áreas sufrieron fallas o descuidos (falta de alerta temprana, bajo blindaje, soporte vital crítico o astronautas expuestos fuera del refugio).
4. **Reporte Científico Post-Misión (`reporte`)**:
   - Calificación de **1 a 3 estrellas**, dosis absorbida por cada tripulante en micrograys ($\mu\text{Gy}$) y su equivalencia en días normales en Marte.
   - Gráfica interactiva de la curva horaria real medida por el instrumento **RAD** del rover *Curiosity* entre el 19 y el 22 de mayo de 2024, con enlaces verificables a las fuentes de la NASA.

### Controles

| Acción | PC (Teclado y Ratón) | Dispositivos Móviles / Táctiles |
| --- | --- | --- |
| **Mover al comandante** | `WASD` o Flechas (relativo a la cámara) o clic en cualquier módulo | Tocar cualquier módulo o su etiqueta flotante |
| **Cambiar ángulo de cámara** | Teclas `1`, `2`, `3` o arrastrar/zoom con el ratón (`OrbitControls`) | Gestos táctiles de rotación y pellizco para zoom |
| **Asignar / quitar energía** | Botones `+` y `−` en el panel del módulo al entrar en él | Botones `+` y `−` en el panel del módulo |
| **Paneles y pausa** | Botones `Módulos`, `Tripulación`, `Registro` y `Menú` (`Esc`) | Botones táctiles en el HUD |

---

## 3. Tripulación y Módulos del Hábitat

La planta arquitectónica en 3D reproduce la distribución de **Mars Dune Alpha** (el hábitat impreso en 3D en el Johnson Space Center de la NASA para la misión analógica CHAPEA):

### Tripulación (Bots deterministas basados en reglas)

| Personaje | Rol inspirado en CHAPEA | Responsabilidad en la base |
| --- | --- | --- |
| **Jugador/a** | Comandante de misión | Decisiones finales de asignación energética y evacuación al refugio |
| **Valeria** (Bot 1) | Ingeniera de vuelo | Paneles solares, reserva energética y carga del blindaje del refugio |
| **Dr. Mateo** (Bot 2) | Oficial médico | Enfermería, avisos de alerta de radiación y protección en el refugio |
| **Dra. Sofía** (Bot 3) | Oficial científica | Invernadero ($\text{O}_2$ y cosechas) y antena de Comunicaciones |

> Por respeto a la privacidad y lineamientos del reto, todos los nombres de los bots son ficticios.

### Módulos Operativos

- **🛡️ Refugio**: Zona blindada donde la tripulación se resguarda durante la tormenta solar. Su nivel de protección depende del porcentaje de blindaje cargado previamente.
- **🌱 Invernadero**: Produce oxígeno y alimentos. Requiere ~4 unidades constantes de energía para evitar la caída del soporte vital.
- **⚡ Energía**: Conecta con el arreglo solar exterior para cargar el escudo antirradiación del refugio antes de que impacte la tormenta.
- **📡 Comunicaciones**: Con al menos 1 unidad de energía, vigila el clima espacial y emite la alerta temprana horas antes del impacto real.
- **➕ Enfermería**: Monitorea el estado de salud y la dosis acumulada de radiación de los cuatro tripulantes.
- **🧭 Pasillo central**: Eje de conexión e intersección de rutas entre todos los sectores del hábitat.

---

## 4. Fuentes Oficiales y Datos de la NASA

Todos los datos científicos se sirven desde archivos JSON locales preprocesados (`src/data/`) para garantizar disponibilidad offline, reproducibilidad y honestidad científica (nunca se presentan datos históricos como telemetría en vivo):

| Componente Científico | Valores de Referencia en el Proyecto | Fuente Oficial |
| --- | --- | --- |
| **Radiación en Marte (Mayo 2024)** | Fondo medio de **$4,115\ \mu\text{Gy/h}$** (muestras del 15 al 19 de mayo de 2024); **$1.645\ \mu\text{Gy}$** integrados en la ventana analítica del 20 de mayo (`05:38:56 UTC`) al 21 de mayo (`13:04:44 UTC`); pico horario de **~$304\ \mu\text{Gy/h}$**. | [NASA RadLab — Curiosity RAD](https://www.nasa.gov/solar-system/planets/mars/nasa-watches-mars-light-up-during-epic-solar-storm) |
| **Catálogo de Eyecciones (CME)** | Eventos históricos reales de clima espacial almacenados en `src/data/events.json`. | [NASA DONKI](https://kauai.ccmc.gsfc.nasa.gov/DONKI/) |
| **Incertidumbre de Pronósticos** | Comparativa entre tiempos pronosticados y llegadas observadas cerca de la Tierra (desviaciones reales de 17 a 43 horas). | [NASA CCMC — CME Scoreboard](https://webtools.ccmc.gsfc.nasa.gov/CMEscoreboard/) |
| **Hábitat y Roles Analógicos** | Distribución de *Mars Dune Alpha* y estructura de tripulación de 4 especialistas. | [NASA CHAPEA Mission](https://www.nasa.gov/humans-in-space/chapea/) |
| **Duración del Sol Marciano** | $1\text{ sol} \approx 24\text{ h } 39\text{ min}$ (aproximado en reglas de simulación a $24.65\text{ h}$). | NASA Mars Fact Sheet |

---

## 5. Arquitectura Técnica y Estructura del Proyecto

### Stack Tecnológico

- **Renderizado 3D**: [Three.js](https://threejs.org/), [React Three Fiber](https://r3f.docs.pmnd.rs/) y [@react-three/drei](https://github.com/pmndrs/drei) con iluminación dinámica, efectos de partículas de tormenta solar (`SolarStormVFX`, `StormEffects`) y colisiones AABB en plano $X/Z$.
- **Estado y Lógica de Dominio**: [TypeScript](https://www.typescriptlang.org/) con arquitectura de **estado único e inmutable estilo reducer** (`src/state/store.ts`), desacoplado de la vista.
- **Interfaz Superpuesta (HUD) e Internacionalización**: Componentes modulares en TypeScript y HTML/CSS (`#interfaz`) con soporte bilingüe completo (**Español / Inglés**) sin textos hardcodeados (`src/i18n/es.json` y `src/i18n/en.json`).
- **Empaquetado y CI/CD**: [Vite](https://vite.dev/) + despliegue automatizado a **GitHub Pages** mediante GitHub Actions (`.github/workflows/deploy.yml`).

### Organización por Frentes de Trabajo

```text
space-junior/
├── src/
│   ├── scenes/diorama/   # Frente 1 · Escenario 3D Mars Dune Alpha, cámaras, astronautas, rutas y colisiones AABB
│   ├── state/            # Frente 2 · Store inmutable (store.ts), contrato de tipos (types.ts), partida y evaluación
│   ├── bots/             # Frente 3 · Motor determinista de peticiones y avisos de la tripulación (bots.ts)
│   ├── ui/               # Frente 3 · Portada, contexto de misión, HUD, paneles laterales, glosario y reporte final
│   ├── i18n/             # Frente 3 · Diccionarios localizados ES/EN (es.json, en.json) con paridad verificada por tests
│   ├── data/             # Frente 4 · Datos históricos de NASA (curiosity_mayo2024.json, events.json) y balance.json
│   ├── main.tsx          # Punto de entrada principal de la aplicación
│   └── style.css         # Estilos globales, layout responsivo y animaciones del HUD
├── scripts/              # Frente 4 · Scripts de descarga y procesamiento de datos de NASA
├── tests/diorama/        # Suite automatizada de pruebas unitarias y de integración (Node Test Runner + esbuild)
├── AGENTS.md             # Guía de arquitectura, reglas de dominio y convenciones para desarrollo
└── CONTRIBUTING.md       # Flujo de ramas, estándares de commits y revisión de Pull Requests
```

---

## 6. Instalación, Desarrollo y Pruebas

### Requisitos Previos

- **Node.js** `>= 20.x` y **npm**.

### Comandos Principales

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor de desarrollo con recarga en caliente (HMR)
npm run dev

# 3. Ejecutar la suite completa de pruebas automatizadas (28 tests)
npm test

# 4. Verificar tipado con TypeScript y generar el build de producción en dist/
npm run build

# 5. Previsualizar localmente el build de producción
npm run preview
```

### Suite de Pruebas Automatizadas (`npm test`)

El repositorio cuenta con **28 pruebas automatizadas** en `tests/diorama/*.test.mjs` que validan:
- **Balance científico RadLab**: Simulaciones sobre los 16 eventos históricos verificando que ningún reparto trivial rompa el dilema de juego y que las cifras coincidan con `curiosity_mayo2024.json`.
- **Colisiones y navegación 3D**: Resolución de colisiones AABB contra muros e interiores, ausencia de túneles ante desplazamientos grandes y validez de todas las rutas táctiles y de evacuación al refugio.
- **Comportamiento de bots**: Límites de peticiones por partida, tiempos de espera, ausencia de frases repetidas y activación de avisos en alerta temprana y tormenta.
- **Pausa, reinicio e i18n**: Limpieza completa del estado al abandonar o reiniciar partida, registro cronológico de eventos y paridad estricta de claves entre `src/i18n/es.json` y `src/i18n/en.json`.

---

## 7. Flujo de Trabajo y Documentación Relacionada

- **Guía de Arquitectura y Dominio**: Consulta [`AGENTS.md`](AGENTS.md) para conocer a fondo las reglas de cada frente, el contrato compartido (`src/state/types.ts`) y las restricciones de diseño.
- **Guía de Contribución**: Revisa [`CONTRIBUTING.md`](CONTRIBUTING.md) antes de crear una rama o abrir un Pull Request. Recuerda ejecutar siempre `npm test && npm run build` antes de subir cambios.
