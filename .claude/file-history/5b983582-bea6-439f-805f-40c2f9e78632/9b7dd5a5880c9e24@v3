-- ─── Extensions ───────────────────────────────────────────────────────────────
-- pgcrypto is required for gen_random_bytes(); gen_random_uuid() is built-in
-- in PostgreSQL 13+ via the core RNG, but we enable the extension anyway for
-- broad compatibility on Supabase (which runs PG 15).
create extension if not exists pgcrypto;

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table if not exists users (
  id          uuid        primary key default gen_random_uuid(),
  email       text        unique not null,
  api_key     text        unique not null default encode(gen_random_bytes(32), 'hex'),
  created_at  timestamptz not null default now()
);

create table if not exists artifacts (
  id            uuid        primary key default gen_random_uuid(),
  title         text        not null,
  description   text,
  tags          text[]      not null default '{}',
  type          text        not null,
  storage_url   text        not null,
  thumbnail_url text,
  author_email  text        references users(email),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint artifacts_type_check check (type in ('html', 'image', 'pdf'))
);

create table if not exists comments (
  id            uuid        primary key default gen_random_uuid(),
  artifact_id   uuid        not null references artifacts(id) on delete cascade,
  author_email  text        references users(email),
  body          text        not null,
  created_at    timestamptz not null default now()
);

create table if not exists share_links (
  token        text        primary key default encode(gen_random_bytes(16), 'hex'),
  artifact_id  uuid        not null references artifacts(id) on delete cascade,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists artifacts_tags_gin_idx
  on artifacts using gin (tags);

create index if not exists artifacts_type_idx
  on artifacts (type);

create index if not exists artifacts_created_at_idx
  on artifacts (created_at desc);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger artifacts_set_updated_at
  before update on artifacts
  for each row
  execute function set_updated_at();

-- ─── Seed data ────────────────────────────────────────────────────────────────

insert into users (email, api_key)
values ('demo@artifacthub.com', 'demo-api-key-12345')
on conflict (email) do nothing;
