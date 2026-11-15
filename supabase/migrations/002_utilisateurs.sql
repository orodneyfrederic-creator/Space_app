-- S'STACK : comptes des producteurs (inscription et connexion par numéro de téléphone + mot de passe).
-- À exécuter une fois dans le SQL Editor de Supabase, APRÈS 001_schema.sql.
create table if not exists public.utilisateurs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nom text not null,
  -- Format unique : +241 suivi de 9 chiffres (ex. +241077123456), calculé par le serveur
  telephone text not null unique check (telephone ~ '^\+2410[1-7][0-9]{7}$'),
  site_id text,
  -- Empreinte scrypt du mot de passe (jamais le mot de passe lui-même)
  mot_de_passe text not null,
  -- Compte Telegram relié (après « Partager mon numéro » dans le bot)
  telegram_id bigint unique
);
alter table public.utilisateurs enable row level security;
-- Aucune politique publique : seul le serveur (clé service_role) lit et écrit.

-- Chaque conseil appartient au producteur qui l'a demandé
alter table public.conseils
  add column if not exists utilisateur_id uuid references public.utilisateurs (id) on delete cascade;
create index if not exists conseils_utilisateur_idx on public.conseils (utilisateur_id, created_at desc);
