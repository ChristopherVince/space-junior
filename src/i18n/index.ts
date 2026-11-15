import es from './es.json';
import en from './en.json';

type Idioma = 'es' | 'en';
const textos: Record<Idioma, Record<string, string>> = { es, en };

let idioma: Idioma = navigator.language.startsWith('es') ? 'es' : 'en';

export function setIdioma(nuevo: Idioma) {
  idioma = nuevo;
}

export function getIdioma(): Idioma {
  return idioma;
}

export function t(clave: string, vars: Record<string, string | number> = {}): string {
  const base = textos[idioma][clave] ?? textos.es[clave] ?? clave;
  return base.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
