# Cómo trabajamos

1. Toma un issue del tablero y muévelo a **En curso**.
2. Crea una rama desde `main`: `git switch -c frente1/mapa-tiled` (frente + tema corto).
3. Haz commits pequeños. Antes de subir, corre `npm run build`: si falla, no se sube.
4. Abre un pull request hacia `main` que diga `Closes #<número>` y pide revisión a una persona.
5. Nadie hace push directo a `main`: cada push a `main` publica el juego.

Reglas:

- `src/state/types.ts` es el contrato de todos. Cambiarlo = pull request propio y avisar en el chat del equipo.
- Toca solo las carpetas de tu frente; si necesitas algo de otro, pídelo en su issue.
- Textos para el jugador siempre en `src/i18n/es.json` y `en.json`, nunca escritos en el código.
- Datos reales siempre con su fuente. Un dato de ejemplo lleva `"esEjemplo": true`.
