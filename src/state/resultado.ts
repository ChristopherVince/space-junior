// Análisis del final de la partida: estrellas, protección de cada tripulante
// y consejos según lo que hizo el jugador. Sin interfaz, para poder probarlo.
import balance from '../data/balance.json';
import type { CrewId, GameState } from './types';

export const TRIPULACION: readonly CrewId[] = ['comandante', 'ingeniero', 'medico', 'cientifico'];

export interface ResultadoTripulante {
  id: CrewId;
  dosis: number;
  /** 0 a 1: cuánta radiación de la tormenta evitó (null si no hubo tormenta). */
  proteccion: number | null;
  /** La dosis expresada en "días normales en Marte" (fondo medido por Curiosity). */
  diasNormales: number;
}

export interface Consejo {
  clave: string;
  vars?: Record<string, string | number>;
}

export interface Resultado {
  estrellas: 1 | 2 | 3;
  tituloClave: string;
  horasTormenta: number;
  /** Lo que habría recibido alguien sin refugio: fondo + tormenta completa. */
  dosisSinRefugio: number;
  tripulacion: ResultadoTripulante[];
  proteccionMedia: number | null;
  consejos: Consejo[];
}

/** Radiación de un sol normal en Marte según el fondo medido por Curiosity (RadLab). */
export const DOSIS_DIA_NORMAL = balance.dosisBasePorHora * balance.horasPorSol;

export function analizarPartida(e: GameState): Resultado {
  const horasTormenta = e.horaInicioTormenta === null ? 0 : Math.max(0, e.hora - e.horaInicioTormenta);
  const dosisFondo = balance.dosisBasePorHora * e.hora;
  const dosisTormentaCompleta = balance.dosisFueraPorHora * horasTormenta;

  const tripulacion = TRIPULACION.map((id): ResultadoTripulante => {
    const dosis = Math.max(0, e.tripulacion[id]?.dosis ?? 0);
    const exceso = Math.max(0, dosis - dosisFondo);
    const proteccion = dosisTormentaCompleta > 0
      ? Math.min(1, Math.max(0, 1 - exceso / dosisTormentaCompleta))
      : null;
    return { id, dosis, proteccion, diasNormales: dosis / DOSIS_DIA_NORMAL };
  });

  const conProteccion = tripulacion.filter((t) => t.proteccion !== null);
  const proteccionMedia = conProteccion.length
    ? conProteccion.reduce((s, t) => s + (t.proteccion ?? 0), 0) / conProteccion.length
    : null;

  const sinSoporte = e.motivoFin === 'sinSoporteVital';
  let estrellas: 1 | 2 | 3 = 1;
  if (!sinSoporte && proteccionMedia !== null) {
    if (proteccionMedia >= 0.6 && e.recursos.soporteVital >= 30) estrellas = 3;
    else if (proteccionMedia >= 0.3) estrellas = 2;
  }

  const tituloClave = sinSoporte ? 'reporte.resultado.sinSoporte' : `reporte.resultado.${estrellas}`;

  const consejos: Consejo[] = [];
  if (estrellas === 3) consejos.push({ clave: 'reporte.consejo.excelente' });
  if (sinSoporte) consejos.push({ clave: 'reporte.consejo.soporte' });
  if (e.recursos.blindaje < 50) {
    consejos.push({ clave: 'reporte.consejo.blindaje', vars: { pct: Math.round(e.recursos.blindaje) } });
  }
  const comandante = tripulacion[0];
  if (comandante.proteccion !== null && comandante.proteccion < 0.3 && e.recursos.blindaje >= 50) {
    consejos.push({ clave: 'reporte.consejo.fueraRefugio' });
  }
  if ((e.energiaAsignada.comunicaciones ?? 0) === 0) consejos.push({ clave: 'reporte.consejo.comunicaciones' });
  if (consejos.length === 0) consejos.push({ clave: 'reporte.consejo.mejorar' });

  return {
    estrellas,
    tituloClave,
    horasTormenta,
    dosisSinRefugio: dosisFondo + dosisTormentaCompleta,
    tripulacion,
    proteccionMedia,
    consejos: consejos.slice(0, 3),
  };
}
