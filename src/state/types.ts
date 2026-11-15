// Contrato compartido entre los 4 frentes. Cambiarlo requiere avisar al equipo
// y hacerlo en un pull request propio, porque todos dependen de estos tipos.

export type ModuleId =
  | 'invernadero'
  | 'pasillo'
  | 'energia'
  | 'refugio'
  | 'comunicaciones'
  | 'enfermeria';

export type CrewId = 'comandante' | 'ingeniero' | 'medico' | 'cientifico';

// Fases de una partida, en orden:
// - 'preparacion': el jugador reparte energía; la tormenta aún no llega.
// - 'refugio': alerta temprana (solo si Comunicaciones tiene energía). Todos deben
//   correr al refugio; todavía no hay radiación extra.
// - 'tormenta': radiación activa. Quien no esté en el refugio recibe la dosis completa.
//   Si no hubo alerta, se pasa directo de 'preparacion' a 'tormenta'.
// - 'reporte': fin de la partida (ver motivoFin).
// La escena debe llevar a la tripulación al refugio cuando la fase sea 'refugio' o 'tormenta'.
export type Phase = 'aviso' | 'preparacion' | 'tormenta' | 'refugio' | 'reporte';

export type MotivoFin = 'tormentaSuperada' | 'sinSoporteVital';

export interface Resources {
  energia: number; // unidades sin asignar (el total por sol está en balance.json)
  soporteVital: number; // 0-100: oxígeno y comida
  blindaje: number; // 0-100: protección del refugio
}

export interface Forecast {
  // Horas de juego hasta la llegada pronosticada y su margen (± horas).
  horasPronosticadas: number;
  margenHoras: number;
  // Llegada real según el evento (la conoce el juego, no el jugador).
  horasReales: number;
}

export interface CrewMember {
  id: CrewId;
  modulo: ModuleId;
  dosis: number; // microgray acumulados
}

export interface GameState {
  sol: number;
  hora: number; // horas transcurridas en la partida
  fase: Phase;
  recursos: Resources;
  energiaAsignada: Partial<Record<ModuleId, number>>;
  pronostico: Forecast | null;
  eventoId: string | null; // id del evento real en src/data/events.json
  tripulacion: Record<CrewId, CrewMember>;
  peticionActiva: { de: CrewId; textoId: string } | null;
  pausado: boolean; // el reloj no avanza (también se detiene solo si hay petición activa)
  horaInicioTormenta: number | null; // hora en que empezó la radiación
  motivoFin: MotivoFin | null; // por qué terminó la partida (solo en fase 'reporte')
}

export type Action =
  | { type: 'INICIAR_PARTIDA'; eventoId: string; pronostico: Forecast }
  | { type: 'AVANZAR_HORAS'; horas: number }
  | { type: 'ASIGNAR_ENERGIA'; modulo: ModuleId; unidades: number }
  | { type: 'MOVER_TRIPULANTE'; quien: CrewId; modulo: ModuleId }
  | { type: 'MOSTRAR_PETICION'; de: CrewId; textoId: string }
  | { type: 'RESOLVER_PETICION'; aceptada: boolean }
  | { type: 'IR_AL_REFUGIO' }
  | { type: 'PAUSAR'; pausado: boolean }
  | { type: 'TERMINAR_PARTIDA'; motivo: MotivoFin }
  | { type: 'ABANDONAR_PARTIDA' };
