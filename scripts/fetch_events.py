"""Descarga eventos reales de clima espacial y genera src/data/events.json.

TODO(Frente 4: datos): completar.
- DONKI (CME): https://api.nasa.gov/DONKI/CME?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=TU_CLAVE
- CME Scoreboard (pronóstico contra llegada real): https://webtools.ccmc.gsfc.nasa.gov/CMEscoreboard/
- Dosis de referencia en Marte (mayo 2024, Curiosity RAD): nota de NASA citada en el README.

Uso:  python scripts/fetch_events.py
La clave va en la variable de entorno NASA_API_KEY (nunca en el repositorio).
"""

import json
import os
import pathlib
import urllib.request

API_KEY = os.environ.get("NASA_API_KEY", "DEMO_KEY")
SALIDA = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "events.json"


def cmes(desde: str, hasta: str) -> list[dict]:
    url = (
        "https://api.nasa.gov/DONKI/CME"
        f"?startDate={desde}&endDate={hasta}&api_key={API_KEY}"
    )
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def main() -> None:
    datos = cmes("2024-05-01", "2024-05-31")
    print(f"{len(datos)} CMEs descargadas de DONKI")
    # TODO: cruzar con CME Scoreboard, calcular horasPronosticadas, margenHoras y
    # horasReales, y escribir SALIDA con el mismo formato que el ejemplo actual
    # (cada evento con su "fuente" y "esEjemplo": false).


if __name__ == "__main__":
    main()
