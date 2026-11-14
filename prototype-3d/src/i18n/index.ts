import en from './en.json';
import es from './es.json';

export type Idioma = 'es' | 'en';

const textos: Record<Idioma, Record<string, string>> = { es, en };

export function idiomaInicial(): Idioma {
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function t(idioma: Idioma, clave: string, vars: Record<string, string | number> = {}): string {
  const base = textos[idioma][clave] ?? textos.es[clave] ?? clave;
  return base.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
