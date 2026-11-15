---
name: team-branch-workflow
description: >-
  Use this skill when creating branches, syncing with main, resolving merge
  conflicts, or preparing Pull Requests in a multi-developer repository to
  prevent branch collisions and broken integrations.
---

# Team Branch Workflow & Conflict Prevention

## 1. Antes de crear una rama
1. Sincroniza `main` sin mezclar trabajo previo:
   `git fetch origin && git checkout main && git merge --ff-only origin/main`
2. Crea una rama corta por frente/tema (`frente<N>/<tema>`, `fix/<tema>`, `docs/<tema>`).
3. Si necesitas trabajar en dos tareas simultáneas sin cambiar de directorio ni arrastrar cambios, usa un worktree aislado (`git worktree add ../nasa-<tema> -b <rama> main`).

## 2. Reglas para evitar conflictos en equipo
- **Aislamiento por archivo/frente:** Edita solo los archivos de tu frente. Si necesitas cambiar un contrato compartido (`src/state/types.ts`, `package.json`), hazlo en su **propio PR pequeño** y avisa al equipo antes de continuar.
- **No acumular cambios no relacionados:** Mantén cada rama enfocada en 1 issue o grupo cohesivo de issues.
- **Sincronización frecuente:** Antes de pedir revisión, actualiza contra `origin/main`:
  `git fetch origin && git rebase origin/main` (o `git merge origin/main` si ya hay revisión compartida).

## 3. Resolución de conflictos preservando intención
1. Identifica los archivos en conflicto con `git status`.
2. Lee **ambas versiones** (`<<<<<<<` vs `>>>>>>>`) entendiendo qué quería lograr cada compañero; nunca uses `--ours` o `--theirs` a ciegas.
3. Combina imports, claves i18n (`es.json`/`en.json`), estilos (`@media`) y lógica sin borrar aportes del compañero.
4. Ejecuta la verificación completa antes de continuar/subir:
   `npm test && npm run build`
5. Si hiciste `rebase`, sube con `git push --force-with-lease`.

## 4. Checklist previo al Pull Request
- [ ] `git status` sin archivos temporales ni cambios fuera de alcance.
- [ ] Commits atómicos sin trailers de IA ni co-autores automáticos.
- [ ] `npm test` y `npm run build` pasando tras el último commit.
- [ ] Si se modificó `src/state/types.ts`, aviso explícito en el PR.
- [ ] Al hacer merge, eliminar la rama local (`git branch -d <rama>`).

