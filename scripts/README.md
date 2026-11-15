# Datos históricos de CME

`events.json` contiene pronósticos y llegadas históricas **cerca de la Tierra (L1)**, utilizados como datos de partida; no son pronósticos ni llegadas observadas en Marte. Las asociaciones entre algunas CME y las llegadas pueden ser provisionales; véase la nota y la fuente de cada registro. No se asigna a estos eventos la dosis observada por Curiosity en Marte, que corresponde a otro episodio.

Para actualizar el archivo se necesita Python 3.9 o posterior, acceso a internet y, opcionalmente, una clave de [NASA Open APIs](https://api.nasa.gov/). En PowerShell:

```powershell
$env:NASA_API_KEY = 'TU_CLAVE'
python scripts/fetch_events.py
```

Sin variable se utiliza `DEMO_KEY`, sujeta a límites de consulta; una clave personal se obtiene en el formulario de NASA Open APIs. No guardes la clave en el repositorio. En macOS o Linux usa `export NASA_API_KEY='TU_CLAVE'` y `python3 scripts/fetch_events.py`.

El script consulta DONKI y el [Earth CME Scoreboard](https://ccmc.gsfc.nasa.gov/scoreboards/cme/earth/), cruza por identificador CME y selecciona por evento el primer pronóstico publicado antes de ambas llegadas, con incertidumbre simétrica numérica publicada. Los pronósticos sin margen o con márgenes asimétricos se descartan porque el contrato actual solo representa ± un número. `fechaAviso` es la fecha de envío al Scoreboard; las dos duraciones se calculan respecto a ella. La fuente generada es la respuesta de la API para esa CME; `metodo` y las fechas identifican el pronóstico. Las fechas están en UTC. El archivo se reemplaza de forma atómica solo si hay resultados completos; los errores dejan intacto el anterior.

Los registros inicialmente incluidos fueron comprobados en páginas individuales del Scoreboard. La revisión del catálogo y la presentación de la procedencia en el juego siguen siendo necesarias antes de presentar estos datos como el escenario marciano: la interfaz y las reglas de otros frentes aún están incompletas.

## Radiación de Curiosity en RadLab

`python scripts/fetch_radlab.py` descarga exclusivamente `MSL-RAD-Surface` del 15 al 24 de mayo de 2024 y genera `src/data/curiosity_mayo2024.json`, sin requerir una clave. Se comprueban instrumento, vehículo, tasas, fechas, cobertura y límites antes de reemplazar el archivo.

El fondo es la media ponderada por tiempo entre el 15 y el 19 de mayo, utilizando solo intervalos con lecturas separadas por hasta 30 minutos. La dosis es la integral trapezoidal de la tasa entre las muestras del 20 de mayo 05:38:56 y el 21 de mayo 13:04:44. Es una **ventana analítica elegida**, no una identificación oficial de la duración de la tormenta, e incluye el fondo. Las horas incompletas del 19 al 22 se guardan como `null` y se muestran como huecos. Se interpretan las marcas temporales de RadLab como UTC; la documentación consultada no especifica su zona horaria.

El juego aproxima el fondo y el exceso medio de esa ventana con tasas constantes. Su reloj avanza en horas enteras, por lo que una duración de 31,43 horas se completa en el paso de la hora 32. Estas cifras son un modelo de juego y no una reconstrucción de la dosis individual ni de un pronóstico para Marte. La [nota de prensa de NASA](https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/) da una estimación distinta; no se ha establecido la razón de la diferencia y no se combina con la integral de RadLab.
