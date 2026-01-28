# Supabase DB Schema (Trading Journal)

Este documento describe la estructura de tablas recomendada para replicar el estado actual del proyecto (datos que hoy se guardan en `localStorage`) en Supabase Postgres.

- Alcance: **Trading Journal (Q→Mes→Trades)**, **Growth Accounts**, **Diario/Notas (por trimestre y por mes)**.
- Multi-usuario: todas las tablas están modeladas con `user_id` (`auth.users.id`).
- Recomendación: ejecutar el SQL en **Supabase → SQL Editor**.

---

## Convenciones

- **PK**: `id uuid` con `gen_random_uuid()`.
- **Timestamps**: `created_at`, `updated_at`.
- **Owner**: `user_id uuid` referencia a `auth.users(id)`.

> Nota: para `gen_random_uuid()` asegúrate de tener disponible `pgcrypto`. Supabase normalmente lo trae, pero el SQL incluye `create extension if not exists pgcrypto;`.

---

## Tablas

### 1) `public.profiles` (opcional pero recomendado)
Almacena datos de perfil (p. ej. nombre a mostrar). No es estrictamente requerido por la UI actual, pero es estándar.

**Campos**
- `user_id` uuid (PK, FK → `auth.users.id`)
- `display_name` text
- `created_at` timestamptz
- `updated_at` timestamptz

---

### 2) `public.trading_quarters`
Equivalente a `QuarterData`.

**Campos**
- `id` uuid (PK)
- `user_id` uuid (FK)
- `year` int
- `quarter` smallint (1..4)
- `completado` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

**Constraints/Índices**
- Unique: `(user_id, year, quarter)`

---

### 3) `public.trading_months`
Equivalente a `MonthData` dentro del quarter.

**Campos**
- `id` uuid (PK)
- `quarter_id` uuid (FK → `trading_quarters.id`)
- `month_name` text ("Enero", "Febrero", etc.)
- `year` int
- `notas_mes` text
- `completado` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

**Constraints/Índices**
- Unique: `(quarter_id, month_name)`

---

### 4) `public.trades`
Equivalente a `Trade`.

**Campos**
- `id` uuid (PK)
- `month_id` uuid (FK → `trading_months.id`)
- `trade_number` int (equivalente a `tradeNumber`)
- `fecha` date
- `par` text
- `buy_sell` text ("Buy" | "Sell")
- `sesion` text ("London" | "New York" | "Asian" | "Sydney")
- `riesgo_porcentaje` numeric(6,2) (en el front hoy es string; aquí lo guardamos numérico)
- `resultado` text ("Win" | "Loss" | "Break Even")
- `riesgo_beneficio_final` text (ej: "1:2")
- `tiempo_duracion` text
- `confluencias` text
- `notas` text
- `imagen_url` text
- `link_tradingview_antes` text
- `link_tradingview_despues` text
- `created_at` timestamptz
- `updated_at` timestamptz

**Constraints/Índices**
- Unique: `(month_id, trade_number)`
- Index: `(month_id)`

---

### 5) `public.growth_accounts`
Equivalente a `GrowthAccountData`.

**Campos**
- `id` uuid (PK)
- `user_id` uuid (FK)
- `year` int
- `quarter` smallint (1..4)
- `mes` text ("Enero", "Febrero", etc.)
- `account_name` text
- `initial_capital` numeric(14,2)
- `broker_propfirm` text
- `proposito` text ("Práctica" | "Evaluación" | "Fondeada" | "Real")
- `ganancia_mensual` numeric(14,2)
- `monthly_target` numeric(14,2)
- `ciclo` text nullable ("Fase 1" | "Fase 2" | "Fase 3")
- `promedio_mes` numeric(6,2)
- `estado` text ("En progreso" | "Completado" | "En observación" | "Fallido")
- `created_at` timestamptz
- `updated_at` timestamptz

**Constraints/Índices**
- Unique: `(user_id, year, quarter, mes)`  
  (La UI actual impone 1 registro por mes en cada quarter)

---

### 6) `public.diary_quarters`
Equivalente al contenedor de `NotesData` por `year` + `quarter`.

**Campos**
- `id` uuid (PK)
- `user_id` uuid (FK)
- `year` int
- `quarter` smallint (1..4)
- `created_at` timestamptz
- `updated_at` timestamptz

**Constraints/Índices**
- Unique: `(user_id, year, quarter)`

---

### 7) `public.diary_notes`
Equivalente a `Note` dentro de un trimestre y un mes.

**Campos**
- `id` uuid (PK)
- `diary_quarter_id` uuid (FK → `diary_quarters.id`)
- `month_name` text ("Enero", "Febrero", etc.)
- `date` timestamptz (fecha de creación)
- `emoji` text nullable (uno de: 😟 😐 😌 😤 💪)
- `tags` text[] ("Pensamiento", "Emoción", "Error", "Acierto", "Aprendizaje", "Libre")
- `content` text
- `created_at` timestamptz
- `updated_at` timestamptz

**Índices**
- Index: `(diary_quarter_id, month_name)`

---

### 8) `public.quarter_reflections`
Equivalente a `QuarterReflection`.

**Campos**
- `id` uuid (PK)
- `diary_quarter_id` uuid (FK → `diary_quarters.id`, UNIQUE)
- `emoji` text nullable
- `content` text
- `created_at` timestamptz
- `is_locked` boolean

---

## SQL recomendado (crear todo)

> Puedes copiar/pegar este bloque completo en Supabase SQL Editor.

```sql
-- Extensions
create extension if not exists pgcrypto;

-- Helper: updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- 2) trading_quarters
create table if not exists public.trading_quarters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  quarter smallint not null check (quarter between 1 and 4),
  completado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, quarter)
);

create index if not exists idx_trading_quarters_user on public.trading_quarters(user_id);

create trigger set_trading_quarters_updated_at
before update on public.trading_quarters
for each row execute function public.set_updated_at();

-- 3) trading_months
create table if not exists public.trading_months (
  id uuid primary key default gen_random_uuid(),
  quarter_id uuid not null references public.trading_quarters(id) on delete cascade,
  month_name text not null,
  year int not null,
  notas_mes text not null default '',
  completado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quarter_id, month_name)
);

create index if not exists idx_trading_months_quarter on public.trading_months(quarter_id);

create trigger set_trading_months_updated_at
before update on public.trading_months
for each row execute function public.set_updated_at();

-- 4) trades
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.trading_months(id) on delete cascade,
  trade_number int not null,
  fecha date,
  par text not null default '',
  buy_sell text not null default 'Buy' check (buy_sell in ('Buy','Sell')),
  sesion text not null default 'London' check (sesion in ('London','New York','Asian','Sydney')),
  riesgo_porcentaje numeric(6,2),
  resultado text not null default 'Win' check (resultado in ('Win','Loss','Break Even')),
  riesgo_beneficio_final text not null default '',
  tiempo_duracion text not null default '',
  confluencias text not null default '',
  notas text not null default '',
  imagen_url text not null default '',
  link_tradingview_antes text not null default '',
  link_tradingview_despues text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (month_id, trade_number)
);

create index if not exists idx_trades_month on public.trades(month_id);

create trigger set_trades_updated_at
before update on public.trades
for each row execute function public.set_updated_at();

-- 5) growth_accounts
create table if not exists public.growth_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  quarter smallint not null check (quarter between 1 and 4),
  mes text not null,
  account_name text not null,
  initial_capital numeric(14,2) not null default 0,
  broker_propfirm text not null default '',
  proposito text not null check (proposito in ('Práctica','Evaluación','Fondeada','Real')),
  ganancia_mensual numeric(14,2) not null default 0,
  monthly_target numeric(14,2) not null default 0,
  ciclo text null check (ciclo is null or ciclo in ('Fase 1','Fase 2','Fase 3')),
  promedio_mes numeric(6,2) not null default 0,
  estado text not null check (estado in ('En progreso','Completado','En observación','Fallido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, quarter, mes)
);

create index if not exists idx_growth_accounts_user on public.growth_accounts(user_id);

create trigger set_growth_accounts_updated_at
before update on public.growth_accounts
for each row execute function public.set_updated_at();

-- 6) diary_quarters
create table if not exists public.diary_quarters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  quarter smallint not null check (quarter between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, quarter)
);

create index if not exists idx_diary_quarters_user on public.diary_quarters(user_id);

create trigger set_diary_quarters_updated_at
before update on public.diary_quarters
for each row execute function public.set_updated_at();

-- 7) diary_notes
create table if not exists public.diary_notes (
  id uuid primary key default gen_random_uuid(),
  diary_quarter_id uuid not null references public.diary_quarters(id) on delete cascade,
  month_name text not null,
  date timestamptz not null default now(),
  emoji text null,
  tags text[] not null default '{}',
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_diary_notes_quarter_month on public.diary_notes(diary_quarter_id, month_name);

create trigger set_diary_notes_updated_at
before update on public.diary_notes
for each row execute function public.set_updated_at();

-- 8) quarter_reflections
create table if not exists public.quarter_reflections (
  id uuid primary key default gen_random_uuid(),
  diary_quarter_id uuid not null unique references public.diary_quarters(id) on delete cascade,
  emoji text null,
  content text not null,
  created_at timestamptz not null default now(),
  is_locked boolean not null default false
);


-- =========================
-- RLS (Row Level Security)
-- =========================

alter table public.profiles enable row level security;
alter table public.trading_quarters enable row level security;
alter table public.trading_months enable row level security;
alter table public.trades enable row level security;
alter table public.growth_accounts enable row level security;
alter table public.diary_quarters enable row level security;
alter table public.diary_notes enable row level security;
alter table public.quarter_reflections enable row level security;

-- profiles
create policy "profiles_select_own"
on public.profiles for select
using (user_id = auth.uid());

create policy "profiles_insert_own"
on public.profiles for insert
with check (user_id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- trading_quarters
create policy "trading_quarters_crud_own"
on public.trading_quarters
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- trading_months (hereda ownership desde trading_quarters)
create policy "trading_months_crud_own"
on public.trading_months
for all
using (
  exists (
    select 1
    from public.trading_quarters q
    where q.id = trading_months.quarter_id
      and q.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trading_quarters q
    where q.id = trading_months.quarter_id
      and q.user_id = auth.uid()
  )
);

-- trades (hereda ownership desde trading_months -> trading_quarters)
create policy "trades_crud_own"
on public.trades
for all
using (
  exists (
    select 1
    from public.trading_months m
    join public.trading_quarters q on q.id = m.quarter_id
    where m.id = trades.month_id
      and q.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trading_months m
    join public.trading_quarters q on q.id = m.quarter_id
    where m.id = trades.month_id
      and q.user_id = auth.uid()
  )
);

-- growth_accounts
create policy "growth_accounts_crud_own"
on public.growth_accounts
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- diary_quarters
create policy "diary_quarters_crud_own"
on public.diary_quarters
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- diary_notes (hereda ownership desde diary_quarters)
create policy "diary_notes_crud_own"
on public.diary_notes
for all
using (
  exists (
    select 1
    from public.diary_quarters dq
    where dq.id = diary_notes.diary_quarter_id
      and dq.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.diary_quarters dq
    where dq.id = diary_notes.diary_quarter_id
      and dq.user_id = auth.uid()
  )
);

-- quarter_reflections (hereda ownership desde diary_quarters)
create policy "quarter_reflections_crud_own"
on public.quarter_reflections
for all
using (
  exists (
    select 1
    from public.diary_quarters dq
    where dq.id = quarter_reflections.diary_quarter_id
      and dq.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.diary_quarters dq
    where dq.id = quarter_reflections.diary_quarter_id
      and dq.user_id = auth.uid()
  )
);
```

---

## Notas importantes

### A) Sobre imágenes de trades
Hoy el modelo tiene `imagenURL` como string. En DB lo dejamos como `imagen_url text`.

- Si planeas subir imágenes: se recomienda Supabase **Storage** + guardar aquí la URL pública o path.

### B) Sobre `riesgoPorcentaje`
En front es `string` por el select predefinido. En DB lo guardamos como `numeric(6,2)`.

- En integración, al guardar: parsear `"1"` → `1.00`.

### C) Diferencias de UI vs DB
- La UI genera `id` como `Date.now().toString()`. En DB usamos `uuid`.
- `tradeNumber` en UI se recalcula al borrar. En DB se mantiene `trade_number` con unique por mes.

---

## Próximo paso

Cuando ya tengas estas tablas en Supabase, el siguiente paso será:

- Reemplazar lecturas/escrituras de `localStorage` por queries a estas tablas.
- Implementar un "bootstrap" para crear quarters/months por defecto cuando no existan.

