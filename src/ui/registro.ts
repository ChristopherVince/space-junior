// Frente 3 · Historial de eventos en UI (#45) sin modificar el contrato src/state/types.ts.
import { t } from '../i18n';
import { store } from '../state/store';
import type { CrewId, GameState, ModuleId } from '../state/types';

export interface EntradaRegistro {
  sol: number;
  hora: number;
  clave: string;
  params?: Record<string, string | number>;
}

const MODULO_DE_BOT: Record<Exclude<CrewId, 'comandante'>, ModuleId> = {
  ingeniero: 'energia',
  medico: 'enfermeria',
  cientifico: 'invernadero',
};

let entradas: EntradaRegistro[] = [];
let anterior: GameState = store.getState();
let suscrito = false;

export function evaluarTransicionRegistro(prev: GameState, curr: GameState, lista: EntradaRegistro[]): EntradaRegistro[] {
  if (curr.fase === 'aviso') {
    return [];
  }

  let siguiente = lista;
  const agregar = (entrada: EntradaRegistro) => {
    siguiente = [...siguiente, entrada];
  };

  // Inicio de una nueva partida
  if (prev.fase === 'aviso' && curr.fase === 'preparacion') {
    siguiente = [];
    agregar({
      sol: curr.sol,
      hora: curr.hora,
      clave: 'panelLateral.registro.inicio',
      params: {
        horas: curr.pronostico ? Math.round(curr.pronostico.horasPronosticadas) : 0,
        margen: curr.pronostico ? Math.round(curr.pronostico.margenHoras) : 0,
      },
    });
  }

  // Resolución de petición de un bot
  if (prev.peticionActiva && !curr.peticionActiva && prev.peticionActiva.de !== 'comandante') {
    const bot = prev.peticionActiva.de;
    const mod = MODULO_DE_BOT[bot];
    const energiaAntes = prev.energiaAsignada[mod] ?? 0;
    const energiaDespues = curr.energiaAsignada[mod] ?? 0;
    const aceptada = energiaDespues > energiaAntes;
    agregar({
      sol: curr.sol,
      hora: curr.hora,
      clave: aceptada
        ? 'panelLateral.registro.peticionAceptada'
        : 'panelLateral.registro.peticionRechazada',
      params: {
        quien: `reporte.rol.${bot}`,
        modulo: `modulo.${mod}`,
      },
    });
  }

  // Cambio de fase a refugio
  if (prev.fase !== 'refugio' && curr.fase === 'refugio') {
    agregar({
      sol: curr.sol,
      hora: curr.hora,
      clave: 'panelLateral.registro.alertaRefugio',
    });
  }

  // Llegada de la tormenta
  if (prev.fase !== 'tormenta' && curr.fase === 'tormenta') {
    agregar({
      sol: curr.sol,
      hora: curr.hora,
      clave: 'panelLateral.registro.tormentaActiva',
    });
  }

  // Fin de la partida
  if (prev.fase !== 'reporte' && curr.fase === 'reporte') {
    agregar({
      sol: curr.sol,
      hora: curr.hora,
      clave:
        curr.motivoFin === 'sinSoporteVital'
          ? 'panelLateral.registro.finSinSoporte'
          : 'panelLateral.registro.finSuperada',
    });
  }

  return siguiente;
}

export function iniciarSeguimientoRegistro() {
  if (suscrito) return;
  suscrito = true;
  anterior = store.getState();
  store.subscribe((actual) => {
    entradas = evaluarTransicionRegistro(anterior, actual, entradas);
    anterior = actual;
  });
}

export function obtenerEntradasRegistro(): readonly EntradaRegistro[] {
  return entradas;
}

export function formatearEntradaRegistro(item: EntradaRegistro): string {
  const paramsTraducidos: Record<string, string | number> = {};
  if (item.params) {
    for (const [k, v] of Object.entries(item.params)) {
      paramsTraducidos[k] = typeof v === 'string' && (v.startsWith('reporte.rol.') || v.startsWith('modulo.')) ? t(v) : v;
    }
  }
  return t(item.clave, paramsTraducidos);
}

