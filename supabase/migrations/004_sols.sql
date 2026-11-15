-- S'STACK : Intelligence des sols (page /soil, routes /api/sols/...).
-- Analyses de sol saisies par le producteur, mesures, amendements, observations d'humidité, types de sol,
-- et bucket privé pour les rapports de laboratoire.
-- À exécuter une fois dans le SQL Editor de Supabase, APRÈS 002_utilisateurs.sql.
--
-- Sécurité : RLS activé, AUCUNE politique publique. Seul le serveur (clé service_role) lit et écrit,
-- toujours filtré par utilisateur_id (server/src/db/sols.ts).
-- Règle métier : les propriétés chimiques viennent UNIQUEMENT d'analyses (laboratoire ou kit),
-- jamais d'une image satellite.
--
-- PostGIS : les parcelles n'ont pas encore de contour (la page « Mes parcelles » est à venir).
-- On rattache donc les analyses à un site S'STACK (site_id) + un nom de parcelle libre.
-- Quand les parcelles auront une géométrie : `create extension if not exists postgis with schema extensions;`
-- puis une colonne parcelle_id vers la future table des parcelles.

-- ── Types de sol (référentiel) ──
create table if not exists public.soil_types (
  code text primary key,
  libelle text not null,
  description text not null
);
alter table public.soil_types enable row level security;

insert into public.soil_types (code, libelle, description) values
  ('sableux', 'Sableux', 'Léger, sèche vite, retient peu l''eau et les éléments nutritifs.'),
  ('sablo_argileux', 'Sablo-argileux', 'Surtout du sable avec un peu d''argile : facile à travailler.'),
  ('argilo_sableux', 'Argilo-sableux', 'Surtout de l''argile avec du sable : garde bien l''eau.'),
  ('argileux', 'Argileux', 'Lourd, colle quand il est mouillé, garde l''eau et les éléments nutritifs.'),
  ('limoneux', 'Limoneux', 'Doux au toucher, fertile, mais forme une croûte après les fortes pluies.'),
  ('lateritique', 'Latéritique', 'Rouge, riche en fer, souvent acide et pauvre.'),
  ('hydromorphe', 'Hydromorphe (bas-fond)', 'Gorgé d''eau une partie de l''année.'),
  ('autre', 'Autre / je ne sais pas', 'Type non précisé.')
on conflict (code) do nothing;

-- ── Analyses et mesures ──
create table if not exists public.soil_analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  site_id text not null,
  parcelle text check (char_length(parcelle) <= 80),
  date_analyse date not null check (date_analyse >= '1990-01-01'),
  methode text not null check (methode in ('laboratoire', 'kit_terrain', 'autre')),
  laboratoire text check (char_length(laboratoire) <= 100),
  type_sol text references public.soil_types (code),
  -- Rapport de laboratoire : chemin dans le bucket privé « sols-documents » (jamais d'URL publique)
  document_chemin text,
  document_nom text
);
alter table public.soil_analyses enable row level security;
create index if not exists soil_analyses_utilisateur_idx on public.soil_analyses (utilisateur_id, site_id, date_analyse desc);

-- Une ligne par propriété mesurée : on n'enregistre que ce qui a été mesuré
create table if not exists public.soil_properties (
  id uuid primary key default gen_random_uuid(),
  analyse_id uuid not null references public.soil_analyses (id) on delete cascade,
  propriete text not null check (propriete in ('ph', 'matiere_organique', 'azote', 'phosphore', 'potassium')),
  valeur numeric not null check (valeur >= 0),
  unite text not null check (unite in ('pH', '%', 'g/kg', 'mg/kg', 'ppm', 'cmol/kg')),
  unique (analyse_id, propriete),
  check (propriete <> 'ph' or (unite = 'pH' and valeur <= 14))
);
alter table public.soil_properties enable row level security;

-- ── Amendements apportés ──
create table if not exists public.soil_amendments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  site_id text not null,
  parcelle text check (char_length(parcelle) <= 80),
  date_application date not null,
  type text not null check (type in ('chaux', 'compost', 'fumier', 'engrais_mineral', 'cendres', 'paillage', 'autre')),
  produit text check (char_length(produit) <= 100),
  quantite numeric check (quantite >= 0),
  unite text check (char_length(unite) <= 30),
  notes text check (char_length(notes) <= 500)
);
alter table public.soil_amendments enable row level security;
create index if not exists soil_amendments_utilisateur_idx on public.soil_amendments (utilisateur_id, site_id, date_application desc);

-- ── Observations d'humidité ──
-- Prête pour : un cache des séries NASA (POWER aujourd'hui, SMAP plus tard) et les observations de terrain.
-- Aujourd'hui, /api/sols/humidite lit NASA POWER directement (cache de 6 h en mémoire).
create table if not exists public.soil_moisture_observations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  site_id text not null,
  utilisateur_id uuid references public.utilisateurs (id) on delete cascade, -- null pour une donnée satellite
  date_observation date not null,
  source text not null check (source in ('nasa_power', 'nasa_smap', 'terrain')),
  couche text not null check (couche in ('surface', 'racines')),
  valeur numeric not null,
  unite text not null check (unite in ('indice_0_1', 'm3/m3', 'appreciation')),
  unique (site_id, date_observation, source, couche, utilisateur_id)
);
alter table public.soil_moisture_observations enable row level security;

-- ── Rapports de laboratoire : bucket privé, 10 Mo, PDF / JPEG / PNG ──
-- Chemin : <utilisateur_id>/<analyse_id>/<fichier> ; le serveur sert des liens signés valables 1 h.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sols-documents', 'sols-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
