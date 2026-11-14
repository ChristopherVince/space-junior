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

export type Phase = 'aviso' | 'preparacion' | 'tormenta' | 'refugio' | 'reporte';

export interface Resources {
  energia: number; // unidades disponibles en el sol actual
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
}

export type Action =
  | { type: 'INICIAR_PARTIDA'; eventoId: string; pronostico: Forecast }
  | { type: 'AVANZAR_HORAS'; horas: number }
  | { type: 'ASIGNAR_ENERGIA'; modulo: ModuleId; unidades: number }
  | { type: 'MOVER_TRIPULANTE'; quien: CrewId; modulo: ModuleId }
  | { type: 'MOSTRAR_PETICION'; de: CrewId; textoId: string }
  | { type: 'RESOLVER_PETICION'; aceptada: boolean }
  | { type: 'IR_AL_REFUGIO' }
  | { type: 'TERMINAR_PARTIDA' };
