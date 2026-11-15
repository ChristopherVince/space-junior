import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { build } from 'esbuild';

async function cargar() {
  const entry = `
    export { store } from './src/state/store.ts';
    export { revisarBots, reiniciarBots, suscribirAvisos, MAX_PETICIONES, HORAS_ENTRE_PETICIONES } from './src/bots/bots.ts';
    export { analizarPartida } from './src/state/resultado.ts';
  `;
  const result = await build({
    stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}#${Math.random()}`);
}

function jugar(app, { horasReales, reparto, acepta, alRefugio }) {
  app.reiniciarBots();
  app.store.dispatch({
    type: 'INICIAR_PARTIDA',
    eventoId: 'prueba',
    pronostico: { horasPronosticadas: horasReales, margenHoras: 7, horasReales },
  });
  for (const [modulo, unidades] of Object.entries(reparto)) {
    app.store.dispatch({ type: 'ASIGNAR_ENERGIA', modulo, unidades });
  }
  const peticiones = [];
  for (let paso = 0; paso < 400 && app.store.getState().fase !== 'reporte'; paso++) {
    const e = app.store.getState();
    if (e.peticionActiva) {
      app.store.dispatch({ type: 'RESOLVER_PETICION', aceptada: acepta });
      continue;
    }
    if (alRefugio && (e.fase === 'refugio' || e.fase === 'tormenta')) {
      for (const quien of ['comandante', 'ingeniero', 'medico', 'cientifico']) {
        if (e.tripulacion[quien].modulo !== 'refugio') app.store.dispatch({ type: 'MOVER_TRIPULANTE', quien, modulo: 'refugio' });
      }
    }
    app.store.dispatch({ type: 'AVANZAR_HORAS', horas: 1 });
    app.revisarBots();
    const p = app.store.getState().peticionActiva;
    if (p) peticiones.push({ ...p, hora: app.store.getState().hora });
  }
  return { peticiones, final: app.store.getState() };
}

test('las peticiones no repiten frase, respetan la espera y el tope por partida', async () => {
  const app = await cargar();
  for (const horasReales of [24, 45, 75]) {
    for (const acepta of [true, false]) {
      const { peticiones } = jugar(app, { horasReales, reparto: {}, acepta, alRefugio: true });
      assert.ok(peticiones.length <= app.MAX_PETICIONES, `demasiadas peticiones: ${peticiones.length}`);
      const frases = peticiones.map((p) => p.textoId);
      assert.equal(new Set(frases).size, frases.length, `frase repetida: ${frases.join(', ')}`);
      for (let i = 1; i < peticiones.length; i++) {
        assert.ok(peticiones[i].hora - peticiones[i - 1].hora >= app.HORAS_ENTRE_PETICIONES, 'peticiones demasiado seguidas');
      }
    }
  }
});

test('cada petición lleva a un módulo que sí tiene efecto y aceptarla le da energía', async () => {
  const app = await cargar();
  const { peticiones } = jugar(app, { horasReales: 45, reparto: {}, acepta: false, alRefugio: true });
  assert.ok(peticiones.length > 0, 'con todo sin energía debe haber al menos una petición');
  for (const p of peticiones) assert.ok(['invernadero', 'energia', 'comunicaciones'].includes(p.modulo), `módulo sin efecto: ${p.modulo}`);

  app.reiniciarBots();
  app.store.dispatch({ type: 'INICIAR_PARTIDA', eventoId: 'prueba', pronostico: { horasPronosticadas: 45, margenHoras: 7, horasReales: 45 } });
  app.store.dispatch({ type: 'AVANZAR_HORAS', horas: 1 });
  app.revisarBots();
  const p = app.store.getState().peticionActiva;
  assert.equal(p?.modulo, 'invernadero');
  app.store.dispatch({ type: 'RESOLVER_PETICION', aceptada: true });
  assert.equal(app.store.getState().energiaAsignada.invernadero, 1);
});

test('con un reparto equilibrado la tripulación casi no interrumpe', async () => {
  const app = await cargar();
  const { peticiones } = jugar(app, {
    horasReales: 60,
    reparto: { invernadero: 4, energia: 5, comunicaciones: 1 },
    acepta: false,
    alRefugio: true,
  });
  assert.ok(peticiones.length <= 2, `se esperaban 2 o menos, hubo ${peticiones.length}`);
});

test('los avisos de la tripulación salen en la alerta y en la tormenta, sin detener el juego', async () => {
  const app = await cargar();
  const avisos = [];
  const quitar = app.suscribirAvisos((a) => avisos.push(a.textoId));
  jugar(app, { horasReales: 30, reparto: { invernadero: 4, energia: 5, comunicaciones: 1 }, acepta: false, alRefugio: true });
  assert.ok(avisos.includes('bot.medico.alerta'), `sin aviso de alerta: ${avisos}`);
  assert.ok(avisos.includes('bot.medico.enRefugio'), `sin aviso en refugio: ${avisos}`);

  avisos.length = 0;
  jugar(app, { horasReales: 30, reparto: { invernadero: 4, energia: 6 }, acepta: false, alRefugio: false });
  assert.ok(avisos.includes('bot.ingeniero.sinAlerta'), `sin aviso de tormenta sin alerta: ${avisos}`);
  assert.ok(avisos.includes('bot.medico.fueraRefugio'), `sin aviso de fuera del refugio: ${avisos}`);
  quitar();
});

test('el resultado final da estrellas y consejos según lo que hizo el jugador', async () => {
  const app = await cargar();
  const bueno = jugar(app, { horasReales: 70, reparto: { invernadero: 4, energia: 5, comunicaciones: 1 }, acepta: false, alRefugio: true }).final;
  const r1 = app.analizarPartida(bueno);
  assert.equal(r1.estrellas, 3, `protección ${r1.proteccionMedia}, soporte ${bueno.recursos.soporteVital}`);
  assert.equal(r1.consejos[0].clave, 'reporte.consejo.excelente');

  const fuera = jugar(app, { horasReales: 30, reparto: { invernadero: 4, energia: 6 }, acepta: false, alRefugio: false }).final;
  const r2 = app.analizarPartida(fuera);
  assert.equal(r2.estrellas, 1);
  assert.ok(r2.consejos.some((c) => c.clave === 'reporte.consejo.comunicaciones'));
  assert.ok(r2.dosisSinRefugio > 0);

  const sinAire = jugar(app, { horasReales: 75, reparto: { energia: 10 }, acepta: false, alRefugio: true }).final;
  const r3 = app.analizarPartida(sinAire);
  assert.equal(sinAire.motivoFin, 'sinSoporteVital');
  assert.equal(r3.estrellas, 1);
  assert.equal(r3.tituloClave, 'reporte.resultado.sinSoporte');
  assert.ok(r3.consejos.some((c) => c.clave === 'reporte.consejo.soporte'));
});

test('todos los textos nuevos existen en español e inglés', () => {
  const es = JSON.parse(fs.readFileSync('src/i18n/es.json', 'utf8'));
  const en = JSON.parse(fs.readFileSync('src/i18n/en.json', 'utf8'));
  const fuentes = ['src/bots/bots.ts', 'src/state/resultado.ts', 'src/ui/reporte.ts'].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const claves = new Set([...fuentes.matchAll(/'((?:bot|reporte)\.[a-zA-Z0-9.]+)'/g)].map((m) => m[1]));
  for (const n of [1, 2, 3]) claves.add(`reporte.resultado.${n}`);
  for (const clave of claves) {
    if (clave.endsWith('.')) continue;
    assert.ok(clave in es, `falta en es.json: ${clave}`);
    assert.ok(clave in en, `falta en en.json: ${clave}`);
  }
});
