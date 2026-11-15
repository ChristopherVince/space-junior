"""Descarga y resume mediciones históricas de Curiosity desde NASA RadLab."""

import csv
import io
import json
import math
import os
import pathlib
import sys
import tempfile
from datetime import datetime, timedelta
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

URL = ('https://visualization.osdr.nasa.gov/radlab/api/?instrument_id=MSL-RAD-Surface'
       '&timestamp%3E=2024-05-15&timestamp%3C2024-05-25'
       '&spacecraft&absorbed_dose_rate&format=csv')
SALIDA = pathlib.Path(__file__).resolve().parent.parent / 'src/data/curiosity_mayo2024.json'
INICIO = datetime(2024, 5, 20, 5, 38, 56)
FIN = datetime(2024, 5, 21, 13, 4, 44)
MAX_HUECO = 30 * 60


def descargar():
    try:
        with urlopen(Request(URL, headers={'User-Agent': 'SpaceJunior/1.0', 'Accept': 'text/csv'}), timeout=60) as respuesta:
            return respuesta.read().decode('utf-8-sig')
    except HTTPError as exc:
        raise ValueError(f'RadLab respondió HTTP {exc.code}') from None
    except (URLError, TimeoutError, OSError, UnicodeError):
        raise ValueError('No se pudo descargar o leer la respuesta de RadLab') from None


def leer_csv(contenido):
    lector = csv.DictReader(io.StringIO(contenido, newline=''))
    requeridas = {'timestamp', 'instrument_id', 'absorbed_dose_rate', 'spacecraft'}
    if not lector.fieldnames or not requeridas.issubset(lector.fieldnames):
        raise ValueError('Respuesta CSV sin las columnas esperadas')
    muestras = []
    for fila in lector:
        if fila['instrument_id'] != 'MSL-RAD-Surface' or fila['spacecraft'] != 'Curiosity':
            raise ValueError('La respuesta contiene otro instrumento o vehículo')
        try:
            fecha = datetime.fromisoformat(fila['timestamp'])
            tasa = float(fila['absorbed_dose_rate'])
            if fecha.tzinfo is not None or not math.isfinite(tasa) or tasa < 0:
                raise ValueError()
        except (TypeError, ValueError):
            raise ValueError('Fecha o tasa inválida en RadLab') from None
        muestras.append((fecha, tasa))
    muestras.sort()
    if len(muestras) < 2 or any(a[0] >= b[0] for a, b in zip(muestras, muestras[1:])):
        raise ValueError('Serie vacía o con marcas de tiempo duplicadas')
    return muestras


def integrar(muestras, desde, hasta):
    """Integral trapezoidal sin interpolar huecos superiores a 30 minutos."""
    area = segundos = 0.0
    for (t0, v0), (t1, v1) in zip(muestras, muestras[1:]):
        duracion = (t1 - t0).total_seconds()
        if duracion > MAX_HUECO or t1 <= desde or t0 >= hasta:
            continue
        izquierda, derecha = max(t0, desde), min(t1, hasta)
        vl = v0 + (v1 - v0) * (izquierda - t0).total_seconds() / duracion
        vr = v0 + (v1 - v0) * (derecha - t0).total_seconds() / duracion
        tramo = (derecha - izquierda).total_seconds()
        area += (vl + vr) * tramo / 7200
        segundos += tramo
    return area, segundos


def generar(muestras):
    fondo_inicio, fondo_fin = datetime(2024, 5, 15), datetime(2024, 5, 20)
    fondo_dosis, cobertura = integrar(muestras, fondo_inicio, fondo_fin)
    if cobertura < (fondo_fin - fondo_inicio).total_seconds() * 0.9:
        raise ValueError('Cobertura insuficiente para estimar el fondo')
    total, cubierto = integrar(muestras, INICIO, FIN)
    duracion = (FIN - INICIO).total_seconds()
    if cubierto < duracion - 1:
        raise ValueError('La ventana del evento tiene huecos o límites sin mediciones')
    ventana = [(t, v) for t, v in muestras if INICIO <= t <= FIN]
    if not ventana or ventana[0][0] != INICIO or ventana[-1][0] != FIN:
        raise ValueError('No se encontraron los límites analíticos esperados')
    pico_fecha, pico = max(ventana, key=lambda item: item[1])
    serie = []
    for hora in range(96):
        inicio = datetime(2024, 5, 19) + timedelta(hours=hora)
        area, segundos = integrar(muestras, inicio, inicio + timedelta(hours=1))
        serie.append({'hora': inicio.isoformat() + 'Z', 'tasaMicrograyPorHora': round(area / (segundos / 3600), 3) if segundos >= 3599 else None,
                      'coberturaSegundos': round(segundos)})
    return {
        'instrumento': 'MSL-RAD-Surface', 'fuente': URL,
        'documentacion': 'https://visualization.osdr.nasa.gov/radlab/gui/knowledgebase/MSL-RAD-Surface',
        'unidadTasa': 'µGy/h', 'unidadDosis': 'µGy',
        'metodo': 'Integración trapezoidal entre muestras; no se interpolan huecos mayores de 30 minutos. Marcas de tiempo de RadLab interpretadas como UTC.',
        'ventanaNota': 'Ventana de análisis elegida para comparar con la solicitud; sus límites no son una determinación oficial de inicio ni de fin de la tormenta.',
        'fondo': {'inicio': fondo_inicio.isoformat() + 'Z', 'finExclusivo': fondo_fin.isoformat() + 'Z', 'promedioMicrograyPorHora': round(fondo_dosis / (cobertura / 3600), 3), 'coberturaHoras': round(cobertura / 3600, 3)},
        'evento': {'inicioVentana': INICIO.isoformat() + 'Z', 'finVentana': FIN.isoformat() + 'Z', 'duracionHoras': round(duracion / 3600, 3),
                   'pico': {'fecha': pico_fecha.isoformat() + 'Z', 'tasaMicrograyPorHora': round(pico, 3)},
                   'dosisTotalMicrogray': round(total, 3), 'muestras': len(ventana)},
        'curvaHoraria': serie,
    }


def main():
    datos = generar(leer_csv(descargar()))
    temporal = None
    try:
        with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=SALIDA.parent, delete=False, suffix='.tmp') as archivo:
            temporal = pathlib.Path(archivo.name)
            json.dump(datos, archivo, ensure_ascii=False, indent=2, allow_nan=False)
            archivo.write('\n')
        os.replace(temporal, SALIDA)
    finally:
        if temporal and temporal.exists():
            temporal.unlink()
    print(f"Fondo: {datos['fondo']['promedioMicrograyPorHora']} µGy/h; dosis ventana: {datos['evento']['dosisTotalMicrogray']} µGy; pico: {datos['evento']['pico']}")


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError) as exc:
        print(f'Error: {exc}', file=sys.stderr)
        sys.exit(1)
