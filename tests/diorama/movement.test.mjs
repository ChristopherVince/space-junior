import assert from 'node:assert/strict';
import test from 'node:test';
import * as collision from '../../src/scenes/diorama/collision.ts';
import * as rutas from '../../src/scenes/rutas.ts';

test('expone un resolvedor compartido para cualquier fuente de movimiento', () => {
  assert.equal(typeof collision.resolverMovimientoConMuros, 'function');
});

test('todas las posiciones libres tienen rutas seguras a cada módulo', () => {
  const destinos = ['refugio', 'invernadero', 'pasillo', 'energia', 'comunicaciones', 'enfermeria'];
  for (let x = -9.39; x <= 9.39; x += 0.19) {
    for (let z = -4.39; z <= 4.39; z += 0.19) {
      if (collision.colisionaConMuros(x, z, 0.26)) continue;
      for (const destino of destinos) {
        const ruta = rutas.calcularRutaFija(x, z, destino);
        assert.ok(ruta.length, `sin ruta desde ${x},${z}`);
        let anterior = { x, z };
        for (const punto of ruta) {
          assert.ok(collision.segmentoTransitable(anterior, punto), `segmento bloqueado ${JSON.stringify({ anterior, punto, destino })}`);
          anterior = punto;
        }
      }
    }
  }
});

test('bloquea el avance frontal contra un muro', () => {
  assert.deepEqual(
    collision.resolverMovimientoConMuros(-8.1, -0.5, 0, 0.3, 0.26),
    { x: -8.1, z: -0.5 },
  );
});

test('un desplazamiento grande no salta paredes', () => {
  const p = collision.resolverMovimientoConMuros(-8.1, -0.7, 0, 2, 0.26);
  assert.ok(p.z < -0.3);
  assert.equal(collision.colisionaConMuros(p.x, p.z, 0.26), false);
});

test('el movimiento por ejes completa las rutas al refugio desde todo el mapa', () => {
  for (let x = -9.3; x < 9.3; x += 0.6) {
    for (let z = -4.3; z < 4.3; z += 0.6) {
      if (collision.colisionaConMuros(x, z, 0.26)) continue;
      let pos = { x, z };
      for (const destino of rutas.calcularRutaAlRefugio('comandante', x, z)) {
        let pasos = 0;
        while (Math.hypot(destino.x - pos.x, destino.z - pos.z) > 0.0001 && pasos++ < 1000) {
          const dx = destino.x - pos.x, dz = destino.z - pos.z;
          const distancia = Math.hypot(dx, dz), paso = Math.min(0.07, distancia);
          pos = collision.resolverMovimientoConMuros(pos.x, pos.z, dx / distancia * paso, dz / distancia * paso, 0.26);
          assert.equal(collision.colisionaConMuros(pos.x, pos.z, 0.26), false);
        }
        assert.ok(pasos < 1000, `atasco desde ${x},${z} hacia ${JSON.stringify(destino)}`);
      }
      assert.ok(Math.hypot(pos.x + 8.7, pos.z + 0.7) < 0.001);
    }
  }
});

test('permite deslizarse por el eje libre al chocar en diagonal', () => {
  assert.deepEqual(
    collision.resolverMovimientoConMuros(-2, -1.5, -0.3, -0.2, 0.26),
    { x: -2, z: -1.7 },
  );
});

test('impide salir de los limites del mapa', () => {
  assert.deepEqual(
    collision.resolverMovimientoConMuros(9.3, 0, 0.2, 0, 0.26),
    { x: 9.3, z: 0 },
  );
});

function assertRutaTransitable(origen, destino, final) {
  const puntos = [origen, ...rutas.calcularRutaFija(origen.x, origen.z, destino), final];
  for (let i = 1; i < puntos.length; i += 1) {
    const desde = puntos[i - 1];
    const hasta = puntos[i];
    const distancia = Math.hypot(hasta.x - desde.x, hasta.z - desde.z);
    const pasos = Math.max(1, Math.ceil(distancia / 0.01));
    for (let paso = 1; paso <= pasos; paso += 1) {
      const t = paso / pasos;
      const x = desde.x + (hasta.x - desde.x) * t;
      const z = desde.z + (hasta.z - desde.z) * t;
      assert.equal(
        collision.colisionaConMuros(x, z, 0.26),
        false,
        `segmento ${i - 1} de ${JSON.stringify(origen)} choca en (${x.toFixed(2)}, ${z.toFixed(2)})`,
      );
    }
  }
}

test('las rutas de los cuatro tripulantes al refugio no cruzan muros', () => {
  assertRutaTransitable({ x: 0.1, z: 0 }, 'refugio', { x: -8.7, z: -0.7 });
  assertRutaTransitable({ x: 3.6, z: 3.2 }, 'refugio', { x: -8.7, z: -1.8 });
  assertRutaTransitable({ x: 7.6, z: 3.2 }, 'refugio', { x: -7.7, z: -1.8 });
  assertRutaTransitable({ x: -5.5, z: 0 }, 'refugio', { x: -7.7, z: -0.7 });
});

test('crea una ruta al puesto seguro asignado a cada tripulante', () => {
  assert.equal(typeof rutas.calcularRutaAlRefugio, 'function');
  assert.deepEqual(rutas.calcularRutaAlRefugio('comandante', 0.1, 0).at(-1), { x: -8.7, z: -0.7 });
  assert.deepEqual(rutas.calcularRutaAlRefugio('ingeniero', 3.6, 3.2).at(-1), { x: -8.7, z: -1.8 });
  assert.deepEqual(rutas.calcularRutaAlRefugio('medico', 7.6, 3.2).at(-1), { x: -7.7, z: -1.8 });
  assert.deepEqual(rutas.calcularRutaAlRefugio('cientifico', -5.5, 0).at(-1), { x: -7.7, z: -0.7 });
});

test('las rutas tactiles entre modulos representativos permanecen dentro de los pasillos', () => {
  const origenes = [
    { x: -8.7, z: -0.7 },
    { x: -5.5, z: 0 },
    { x: 0.1, z: 0 },
    { x: 3.6, z: 3.2 },
    { x: 4, z: 0.1 },
    { x: 7.6, z: 3.2 },
  ];
  const destinos = ['refugio', 'invernadero', 'pasillo', 'energia', 'comunicaciones', 'enfermeria'];

  for (const origen of origenes) {
    for (const destino of destinos) {
      const rutaCalculada = rutas.calcularRutaFija(origen.x, origen.z, destino);
      assert.ok(rutaCalculada.length > 0);
      const final = rutaCalculada.at(-1);
      assertRutaTransitable(origen, destino, final);
    }
  }
});

test('la fase de tormenta no reinicia una ruta de refugio ya activa', () => {
  assert.equal(typeof rutas.resolverTransicionRefugio, 'function');
  assert.equal(rutas.resolverTransicionRefugio('refugio', false), 'iniciar');
  assert.equal(rutas.resolverTransicionRefugio('tormenta', true), 'continuar');
  assert.equal(rutas.resolverTransicionRefugio('reporte', true), 'liberar');
  assert.equal(rutas.resolverTransicionRefugio('preparacion', false), 'inactivo');
});
