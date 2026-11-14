// TODO(Frente 3: bots y diálogos): reglas simples, sin IA. Cada bot revisa su
// sistema y, si está en riesgo, pide energía al comandante con un diálogo de i18n.
import { store } from '../state/store';
import type { CrewId, GameState } from '../state/types';

interface ReglaBot {
  quien: Exclude<CrewId, 'comandante'>;
  enRiesgo: (e: GameState) => boolean;
  textoId: string;
}

export const REGLAS: ReglaBot[] = [
  {
    quien: 'cientifico',
    enRiesgo: (e) => (e.energiaAsignada.invernadero ?? 0) === 0,
    textoId: 'bot.cientifico.invernadero',
  },
  {
    quien: 'ingeniero',
    enRiesgo: (e) => e.recursos.blindaje < 50,
    textoId: 'bot.ingeniero.blindaje',
  },
  {
    quien: 'medico',
    enRiesgo: (e) => e.tripulacion.comandante.dosis > 700,
    textoId: 'bot.medico.dosis',
  },
];

export function revisarBots() {
  const e = store.getState();
  if (e.peticionActiva) return;
  const regla = REGLAS.find((r) => r.enRiesgo(e));
  if (regla) store.dispatch({ type: 'MOSTRAR_PETICION', de: regla.quien, textoId: regla.textoId });
}
