-- S'STACK : historique des conseils donnés (web et Telegram).
-- À exécuter une fois dans le SQL Editor de Supabase.
create table if not exists public.conseils (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  canal text not null check (canal in ('web', 'telegram')),
  nom_lieu text,
  lat double precision not null,
  lon double precision not null,
  culture text,
  question text not null,
  reponse text not null,
  fournisseur text not null,
  modele text not null,
  fiche jsonb not null
);
alter table public.conseils enable row level security;
-- Aucune politique publique : seul le serveur (clé service_role) lit et écrit.
create index if not exists conseils_created_at_idx on public.conseils (created_at desc);
