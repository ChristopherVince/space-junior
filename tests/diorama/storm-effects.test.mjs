import assert from 'node:assert/strict';
import test from 'node:test';
import es from '../../src/i18n/es.json' with { type: 'json' };
import en from '../../src/i18n/en.json' with { type: 'json' };

test('las etiquetas del control de alarma existen en ambos idiomas', () => {
  for (const textos of [es, en]) {
    assert.equal(typeof textos['controles.audioActivar'], 'string');
    assert.ok(textos['controles.audioActivar'].length > 0);
    assert.equal(typeof textos['controles.audioSilenciar'], 'string');
    assert.ok(textos['controles.audioSilenciar'].length > 0);
  }
});
