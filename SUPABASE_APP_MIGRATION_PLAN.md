# Plan de migración App → Supabase (Modo A)

Contexto

- Stack: Vite + React + `@supabase/supabase-js`.
- Auth: login ya probado.
- DB: schema aplicado según `SUPABASE_SCHEMA.md` (incluye RLS y triggers `updated_at`).
- Decisiones:
  - Modo A: Supabase es la fuente de verdad.
  - Arranque limpio: no se migra data desde `localStorage`.
  - Normalización de valores: usar `Break Even` (no `BE`).

---

## Estado actual (progreso)

Hecho

- Sprint 1.1: Repository de Trading implementado en `src/app/data/tradingRepo.ts`.
- Sprint 1.2: Bootstrap automático (Quarter + Months) funcionando vía `getTradingQuarterBundle(year, quarter)`.
- Sprint 1.3: `skillx-quarters` removido de `localStorage` (la UI del journal ahora carga desde Supabase).
- Fix RLS: `trading_quarters` ahora inserta con `user_id` para cumplir `with check (user_id = auth.uid())`.
- Sprint 1.4: Wiring CRUD de Trading Journal completado en UI (`MonthSection.tsx` persiste trades + `notas_mes` + `completado` en Supabase, con debounce en updates).
- Normalización: `Break Even` aplicado en UI.

- Sprint 2 (Growth Accounts): repo + wiring completado. `skillx-growth-accounts` removido de `localStorage`.
  - Repo: `src/app/data/growthRepo.ts`.
  - UI: `GrowthAccountView.tsx` carga/persiste a Supabase.

- Sprint 3 (Notes/Diary): repo + wiring completado. `skillx-notes` removido de `localStorage`.
  - Repo: `src/app/data/diaryRepo.ts`.
  - UI: `NotesView.tsx` carga desde Supabase y `MonthNotesSection.tsx` hace CRUD real.
  - `QuarterReflectionCard` persiste reflexión vía `upsertQuarterReflection`.

- Reportes (Opción A1): `ReportsView.tsx` carga Q1–Q4 (o un quarter) directamente desde Supabase para métricas completas por año/quarter.

Pendiente inmediato

Validado

- Validación end-to-end (manual) realizada con éxito:
  - Trading Journal: CRUD de trades + notas/completado por mes persiste y recarga.
  - Growth Accounts: CRUD persiste y recarga.
  - Notes/Diary: CRUD notes + quarter reflection persiste y recarga.
  - Reports: cambiar año/quarter y validar métricas con data completa.
- Confirmado: `localStorage` se usa solo para:
  - `skillx-onboarding-completed` (flag)
  - preferencias (si aplica)

---

## Objetivo general

Reemplazar progresivamente las lecturas/escrituras actuales del front (estado en memoria + `localStorage`) por queries a Supabase, manteniendo la UI y minimizando cambios por iteración.

Cada sprint debe terminar con:

- Funcionalidad usable end-to-end.
- RLS respetado (no “workarounds” en front).
- Manejo de estados `loading` / `error` en UI.

---

## Sprint 1 — Trading Journal (Q → Mes → Trades) end-to-end

### 1.1 Capa de acceso a datos (Repository)

Crear una capa de funciones para encapsular el acceso a Supabase. Objetivo: que los componentes NO conozcan tablas SQL.

Ubicación sugerida:

- `src/app/data/tradingRepo.ts` (o `src/app/utils/tradingRepo.ts`)

Funciones mínimas:

- `ensureTradingQuarter(year, quarter) -> { quarterId }`
  - Busca `trading_quarters` por `(year, quarter)`.
  - Si no existe, la crea.
- `ensureTradingMonths(quarterId, year, quarter) -> MonthRow[]`
  - Garantiza que existan los 3 meses del quarter en `trading_months`.
- `getTradingQuarterBundle(year, quarter) -> QuarterData`
  - Devuelve un `QuarterData` compatible con `src/app/types.ts`.
  - Incluye:
    - `trading_months`
    - `trades` por cada `month_id`.
- `createTrade(monthId) -> Trade`
  - Crea un trade con `trade_number` incremental dentro del mes.
- `updateTrade(tradeId, patch) -> Trade`
- `deleteTrade(tradeId) -> void`
- `updateTradingMonth(monthId, patch) -> void`
  - Para `notas_mes`, `completado`.

Implementación actual

- Archivo: `src/app/data/tradingRepo.ts`.
- Nota RLS: `ensureTradingQuarter` debe insertar con `user_id` (ya aplicado).

Notas de mapeo DB ↔ UI:

- DB `trades.fecha` es `date` y UI usa string.
  - Definir una conversión estable (ej: guardar en DB como `YYYY-MM-DD`; mostrar en UI como `DD/MM/YYYY` si aplica, o unificar UI a `YYYY-MM-DD`).
- DB `riesgo_porcentaje` es `numeric(6,2)` y UI lo maneja como `string`.
  - Convertir al guardar: `"1" -> 1.00`.
  - Convertir al leer: `1 -> "1"` o `"1.00"`.
- DB `resultado` debe ser `Win | Loss | Break Even`.
  - Asegurar que UI no emita `BE`.

### 1.2 Bootstrap automático (Quarter + Months)

La UI hoy crea quarters/meses si no existen. En Modo A lo hacemos en DB:

- Al entrar a un `year + quarter`:
  - `ensureTradingQuarter`.
  - `ensureTradingMonths`.
  - `getTradingQuarterBundle`.

Esto elimina la necesidad de seeds manuales.

Implementación actual

- `TradingJournal.tsx` ejecuta `getTradingQuarterBundle(selectedYear, selectedQuarter)` al cambiar año/quarter y actualiza el state.

### 1.3 Integración con UI (mínimo cambio)

Objetivo: mantener el shape actual (`QuarterData[]`) pero con data proveniente de Supabase.

Cambios sugeridos:

- `App.tsx`
  - Dejar de cargar `skillx-quarters` desde `localStorage`.
  - Dejar de persistir `quarterData` a `localStorage`.
  - Cargar el quarter actual desde Supabase cuando exista sesión.

Implementación actual

- `App.tsx`: eliminado read/write de `skillx-quarters`.
- `TradingJournal.tsx`: removida creación en memoria; se carga desde Supabase.

- `TradingJournal.tsx`
  - Reemplazar la creación en memoria (`if (!currentQuarterData) { ... }`) por:
    - llamada a bootstrap en DB (ensure quarter/months)
    - fetch del bundle
    - actualización del state

- `MonthSection.tsx`
  - `Agregar Trade` debe crear en DB y reflejar en UI.
  - Update/Delete deben mutar DB y refrescar el estado.

Pendiente (implementación)

- Completado:
  - `MonthSection.tsx` conectado a `createTrade(monthId)`, `updateTrade(tradeId, patch)`, `deleteTrade(tradeId)` y `updateTradingMonth(...)`.
  - Decisión aplicada: no renumerar `trade_number` en DB al borrar.

Decisión sobre renumeración de trades:

- Recomendado para avanzar rápido: no renumerar `trade_number` en DB al borrar.
  - La UI puede mostrar el índice visual si quieres consecutividad.

### 1.4 Criterio de aceptación (Sprint 1)

- Al loguearte, ves Q actual con sus 3 meses.
- Puedes:
  - agregar trade
  - editar campos
  - borrar trade
  - escribir `Notas del Mes`
  - marcar mes completo
- Recargando la página, los datos persisten desde Supabase.

---

## Carga de imágenes en Trades (Supabase Storage)

Objetivo

- Permitir adjuntar una imagen por trade (ej: screenshot), guardándola en Supabase Storage y persistiendo la referencia en la tabla `trades`.

Estado

- Implementado y validado.

### Cambios requeridos en Supabase

1) Crear bucket

- Bucket: `trade-images`.
- Bucket privado.

2) Políticas (Storage RLS)

- Permitir `insert`/`update`/`select`/`delete` solo al owner.
- Estructura recomendada de paths:
  - `userId/trades/<tradeId>/<filename>`
  - Esto facilita políticas simples por prefijo `auth.uid()`.

Implementación actual

- Policies aplicadas para restringir acceso por prefijo `auth.uid()`.

3) Acceso desde frontend

- Para bucket privado:
  - Usar `createSignedUrl`/`createSignedUrls` o `getPublicUrl` solo si decides hacerlo público.

Implementación actual

- Se usa signed URL para previsualización.

### Cambios requeridos en la app (frontend)

1) Modelo de datos

- Usar el campo existente `imagenURL` en UI y mapearlo a un string en DB (recomendado: guardar el `storage_path`, no un URL absoluto).

2) Repo

- Agregar helpers en `tradingRepo.ts`:
  - `uploadTradeImage(tradeId, file) -> { path }`
  - `getTradeImageSignedUrl(path) -> { signedUrl }` (si bucket privado)
  - (opcional) `deleteTradeImage(path)`

Implementación actual

- Helpers implementados en `src/app/data/tradingRepo.ts`.

3) UI

- En `TradeRow.tsx` (o donde esté el campo de imagen):
  - Selector de archivo (`input type=file`) + botón "Subir".
  - Al subir:
    - `uploadTradeImage(tradeId, file)`
    - `updateTrade(tradeId, { imagenURL: path })`
  - Para visualizar:
    - Si el bucket es privado: obtener signed URL y renderizar `img`.

Implementación actual

- UI integrada en `src/app/components/TradeRow.tsx`.

4) Limpieza

- (Opcional) Al borrar un trade:
  - Si tiene `imagenURL`, llamar `deleteTradeImage(imagenURL)`.
- (Opcional) Manejar reemplazo de imagen (borrar la anterior).

Pendiente (opcional)

- Al reemplazar una imagen, borrar la anterior para evitar archivos huérfanos.

---

## Sprint 2 — Growth Accounts

### 2.1 Repo de Growth Accounts

Crear `src/app/data/growthRepo.ts` con:

- `listGrowthAccountsByQuarter(year, quarter) -> GrowthAccountData[]`
- `upsertGrowthAccount(payload) -> GrowthAccountData`
- `deleteGrowthAccount(id) -> void`

### 2.2 UI

- Reemplazar `localStorage` (`skillx-growth-accounts`) por Supabase.

Criterio:

- CRUD funcional y persistente.

Implementación actual

- Repo: `src/app/data/growthRepo.ts`.
- UI: `GrowthAccountView.tsx` consume el repo.
- `App.tsx`: eliminado read/write de `skillx-growth-accounts`.

---

## Sprint 3 — Notes (Diary)

### 3.1 Bootstrap y Repo

- `ensureDiaryQuarter(year, quarter)`
- `listDiaryNotes(diaryQuarterId, monthName)`
- `createDiaryNote(...)`
- `updateDiaryNote(id, patch)`
- `deleteDiaryNote(id)`
- `getOrCreateQuarterReflection(diaryQuarterId)`
- `updateQuarterReflection(id, patch)`

### 3.2 UI

- Conectar `NotesView` a Supabase.

Implementación actual

- Repo: `src/app/data/diaryRepo.ts`.
- UI: `NotesView.tsx` bootstrapea + carga desde Supabase.
- CRUD notes: `MonthNotesSection.tsx` usa `createDiaryNote` / `updateDiaryNote` / `deleteDiaryNote`.
- Reflexión: `QuarterReflectionCard` persiste vía `upsertQuarterReflection`.

---

## Agregados / Métricas (dinámicos, sin triggers)

Objetivo: evitar tablas “agregadas” mantenidas manualmente. Calcular con queries.

Consultas sugeridas:

- Métricas por mes (`month_id`):
  - `count(*) total_trades`
  - `sum(riesgo_porcentaje) riesgo_total`
  - `sum(case when resultado='Win' then 1 else 0 end) wins`
  - `sum(case when resultado='Loss' then 1 else 0 end) losses`

- Métricas por quarter (`quarter_id`):
  - join `trading_months` + `trades` y `group by`.

Integración:

- `MetricsSummary` puede usar métricas del mes actual.
- `ReportsView` puede usar métricas por quarter y por mes.

Estado actual

- Implementado Opción A1: `ReportsView` calcula métricas en frontend, pero ahora carga los quarters necesarios desde Supabase para evitar data incompleta.
- Pendiente (opcional): mover métricas a queries agregadas (views o `group by`) para no traer todos los trades.

---

## Limpieza final (cuando todo esté en Supabase)

- Mantener `localStorage` solo para:
  - `skillx-onboarding-completed` (flag)
  - preferencias (ej: `darkMode` si aplica)
- Eliminar dependencias de datos de negocio en `localStorage`.

