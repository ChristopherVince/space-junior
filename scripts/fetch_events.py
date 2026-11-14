"""Actualiza eventos históricos cruzando DONKI con Earth CME Scoreboard.

Solo se importan pronósticos anteriores a la llegada con incertidumbre simétrica
publicada: el contrato actual del juego solo admite un margen ± numérico.
"""

import json
import math
import os
import pathlib
import sys
import tempfile
from datetime import datetime
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = pathlib.Path(__file__).resolve().parent.parent
SALIDA = ROOT / "src" / "data" / "events.json"
DONKI = "https://api.nasa.gov/DONKI/CME"
SCOREBOARD = "https://ccmc.gsfc.nasa.gov/CMESB-Earth/WS/get/predictions"
INICIO, FIN = "2024-05-01", "2024-05-31"


def descargar(base, parametros):
    url = base + "?" + urlencode(parametros)
    try:
        with urlopen(Request(url, headers={"Accept": "application/json", "User-Agent": "SpaceJunior/1.0"}), timeout=30) as respuesta:
            datos = json.load(respuesta)
    except HTTPError as exc:
        mensaje = "límite de peticiones o clave rechazada" if exc.code in (403, 429) else "error del servidor"
        raise ValueError(f"{base}: HTTP {exc.code} ({mensaje})") from None
    except (URLError, TimeoutError, OSError):
        raise ValueError(f"No se pudo conectar con {base}") from None
    except (ValueError, UnicodeError):
        raise ValueError(f"Respuesta JSON inválida de {base}") from None
    if not isinstance(datos, list) or any(not isinstance(item, dict) for item in datos):
        raise ValueError(f"Formato inesperado de {base}")
    return datos


def instante(valor):
    if not isinstance(valor, str) or not valor.endswith("Z"):
        raise ValueError("fecha UTC ausente o inválida")
    return datetime.fromisoformat(valor[:-1] + "+00:00")


def construir(donki, scoreboard):
    ids = {item.get("activityID") for item in donki if isinstance(item.get("activityID"), str)}
    resultado = []
    for cme in scoreboard:
        ident = cme.get("cmeID")
        if ident not in ids or not isinstance(ident, str) or not ident.startswith("2024-05-") or cme.get("noArrivalObserved") is True:
            continue
        try:
            llegada = instante(cme.get("arrivalTime"))
        except ValueError:
            continue
        candidatos = []
        predicciones = cme.get("predictions")
        if not isinstance(predicciones, list):
            continue
        for pred in predicciones:
            if not isinstance(pred, dict):
                continue
            try:
                aviso = instante(pred.get("submissionTime"))
                estimada = instante(pred.get("predictedArrivalTime"))
                menos, mas = pred.get("uncertaintyMinusInHrs"), pred.get("uncertaintyPlusInHrs")
                if any(isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x) or x < 0 for x in (menos, mas)) or menos != mas:
                    continue
                if aviso >= llegada or aviso >= estimada:
                    continue
            except (ValueError, TypeError, OverflowError):
                continue
            candidatos.append((aviso, estimada, menos, pred))
        if not candidatos:
            continue
        aviso, estimada, margen, pred = min(candidatos, key=lambda p: (p[0], p[1], str(p[3].get("predictedMethodName"))))
        fuente = SCOREBOARD + "?" + urlencode({"CMEID": ident})
        resultado.append({
            "id": ident, "esEjemplo": False, "fecha": ident[:10],
            "horasPronosticadas": (estimada - aviso).total_seconds() / 3600,
            "margenHoras": margen, "horasReales": (llegada - aviso).total_seconds() / 3600,
            "fechaAviso": pred["submissionTime"], "fechaLlegadaPronosticada": pred["predictedArrivalTime"],
            "fechaLlegadaObservada": cme["arrivalTime"], "destino": "Tierra (L1)",
            "metodo": pred.get("predictedMethodName"), "nota": cme.get("cmeNote"), "fuente": fuente,
        })
    return sorted(resultado, key=lambda e: e["id"])


def main():
    clave = os.environ.get("NASA_API_KEY") or "DEMO_KEY"
    donki = descargar(DONKI, {"startDate": INICIO, "endDate": FIN, "api_key": clave})
    scoreboard = descargar(SCOREBOARD, {"CMEtimeStart": INICIO, "CMEtimeEnd": FIN})
    eventos = construir(donki, scoreboard)
    if not eventos:
        raise ValueError("No hay eventos completos coincidentes; se conserva el archivo existente")
    documento = {"_nota": "Datos históricos del Earth CME Scoreboard; tiempos desde la publicación del pronóstico. Las llegadas son cerca de la Tierra, no mediciones en Marte.", "eventos": eventos}
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    temporal = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=SALIDA.parent, delete=False, suffix=".tmp") as archivo:
            temporal = pathlib.Path(archivo.name)
            json.dump(documento, archivo, ensure_ascii=False, indent=2, allow_nan=False)
            archivo.write("\n")
        os.replace(temporal, SALIDA)
    finally:
        if temporal and temporal.exists():
            temporal.unlink()
    print(f"DONKI: {len(donki)} CME; eventos completos: {len(eventos)}. Guardado: {SALIDA}")
    if len(eventos) < 3:
        print("Aviso: se encontraron menos de tres eventos completos.", file=sys.stderr)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError) as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)
