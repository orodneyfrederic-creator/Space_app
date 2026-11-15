-- S'STACK : MODULE 06 — Assistant intelligent (/assistant).
-- Tables de l'agent : conversations, messages, appels d'outils, recommandations, journal des actions,
-- sources de connaissances et permissions des outils. Bucket privé pour les pièces jointes.
-- À exécuter une fois dans le SQL Editor de Supabase, APRÈS 002_utilisateurs.sql.
--
-- Sécurité (même règle que conseils et utilisateurs) : RLS activé, AUCUNE politique publique.
-- Seul le serveur (clé service_role) lit et écrit ; il est la couche d'autorisation :
--   • il ne donne à l'agent que les outils listés dans ai_agent_permissions ;
--   • une écriture proposée par l'agent est rangée dans ai_action_logs (statut 'proposee')
--     et n'est exécutée qu'après la confirmation du producteur ;
--   • un diagnostic (photo ou description de symptômes) est toujours une hypothèse.
--
-- État : le site (web/src/lib/assistant.ts) garde pour l'instant le journal des actions dans le navigateur.
-- Ces tables sont prêtes pour les futures routes /api/assistant/* du serveur.

-- ── Agents et outils ──
create table if not exists public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  code text not null unique,            -- ex. 'assistant'
  nom text not null,
  description text,
  actif boolean not null default true
);

-- Liste blanche des outils qu'un agent a le droit d'appeler
create table if not exists public.ai_agent_permissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.ai_agents (id) on delete cascade,
  outil text not null,                  -- ex. 'consulter_fiche'
  portee text not null check (portee in ('lecture', 'ecriture')),
  confirmation_requise boolean not null default false,
  actif boolean not null default true,
  unique (agent_id, outil),
  check (portee = 'lecture' or confirmation_requise) -- une écriture exige toujours une confirmation
);

-- Fiches, jeux de données et API que l'agent peut citer
create table if not exists public.ai_knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.ai_agents (id) on delete set null, -- null : commune à tous les agents
  titre text not null,
  type text not null check (type in ('fiche', 'jeu_de_donnees', 'document', 'api')),
  uri text not null unique,             -- ex. knowledge/fiches/calendrier-cultures.md
  mis_a_jour timestamptz not null default now()
);

-- ── Conversations ──
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  agent_id uuid references public.ai_agents (id) on delete set null,
  site_id text,                         -- site S'STACK concerné (ex. 'tchibanga'), facultatif
  canal text not null default 'web' check (canal in ('web', 'telegram')),
  titre text
);
create index if not exists ai_conversations_utilisateur_idx on public.ai_conversations (utilisateur_id, updated_at desc);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('producteur', 'agent', 'outil')),
  contenu text not null default '',
  -- Pièce jointe : chemin dans le bucket privé 'ai-pieces-jointes' (jamais d'URL publique)
  piece_jointe jsonb,                   -- { chemin, nom, type, taille }
  conseil_id uuid references public.conseils (id) on delete set null -- lien avec l'historique existant
);
create index if not exists ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);

create table if not exists public.ai_tool_calls (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  message_id uuid references public.ai_messages (id) on delete cascade,
  outil text not null,
  arguments jsonb not null default '{}'::jsonb,
  resultat jsonb,
  statut text not null check (statut in ('ok', 'erreur', 'refuse')),
  duree_ms integer
);
create index if not exists ai_tool_calls_conversation_idx on public.ai_tool_calls (conversation_id);

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  message_id uuid references public.ai_messages (id) on delete cascade,
  site_id text,
  type text not null check (type in ('conseil', 'diagnostic')),
  contenu text not null,
  est_hypothese boolean not null default false,
  sources jsonb not null default '[]'::jsonb,
  check (type <> 'diagnostic' or est_hypothese) -- un diagnostic reste toujours une hypothèse
);

-- Journal des écritures proposées par l'agent, puis confirmées ou annulées par le producteur
create table if not exists public.ai_action_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  message_id uuid references public.ai_messages (id) on delete set null,
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  site_id text,
  type text not null,                   -- ex. 'rappel_semis', 'reverifier'
  titre text not null,
  apercu jsonb not null default '[]'::jsonb, -- [{ label, valeur }] montré avant confirmation
  statut text not null default 'proposee' check (statut in ('proposee', 'enregistree', 'annulee', 'echec')),
  decide_le timestamptz,
  erreur text,
  check (statut <> 'enregistree' or decide_le is not null) -- pas d'enregistrement sans décision
);
create index if not exists ai_action_logs_utilisateur_idx on public.ai_action_logs (utilisateur_id, created_at desc);

-- ── Sécurité : RLS sans politique publique (serveur uniquement) ──
alter table public.ai_agents enable row level security;
alter table public.ai_agent_permissions enable row level security;
alter table public.ai_knowledge_sources enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_tool_calls enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.ai_action_logs enable row level security;

-- ── Pièces jointes : bucket privé, 10 Mo, photos et PDF ──
-- Le serveur y dépose les fichiers sous <utilisateur_id>/<conversation_id>/… et sert des URL signées courtes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ai-pieces-jointes', 'ai-pieces-jointes', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- ── Données de départ : l'agent, ses outils et ses sources ──
insert into public.ai_agents (code, nom, description)
values ('assistant', 'Assistant S''STACK', 'Répond à partir de la fiche du site (NASA POWER, SoilGrids) et propose des actions à confirmer.')
on conflict (code) do nothing;

insert into public.ai_agent_permissions (agent_id, outil, portee, confirmation_requise)
select a.id, o.outil, o.portee, o.confirmation
from public.ai_agents a
cross join (values
  ('lister_sites', 'lecture', false),
  ('consulter_fiche', 'lecture', false),
  ('lire_historique', 'lecture', false),
  ('rechercher_connaissances', 'lecture', false),
  ('analyser_photo', 'lecture', false),
  ('creer_rappel', 'ecriture', true)
) as o (outil, portee, confirmation)
where a.code = 'assistant'
on conflict (agent_id, outil) do nothing;

insert into public.ai_knowledge_sources (titre, type, uri)
values
  ('Compétence climat de l''agent', 'fiche', 'knowledge/skills/climat/SKILL.md'),
  ('Calendrier des cultures', 'fiche', 'knowledge/fiches/calendrier-cultures.md'),
  ('Rotations', 'fiche', 'knowledge/fiches/rotations.md'),
  ('Seuils agro-climatiques', 'fiche', 'knowledge/fiches/seuils.md'),
  ('Sols du Gabon', 'fiche', 'knowledge/fiches/sols-gabon.md'),
  ('SoilGrids : sites S''STACK', 'jeu_de_donnees', 'knowledge/data/soilgrids-sites.json'),
  ('NASA POWER (quotidien)', 'api', 'https://power.larc.nasa.gov/api/temporal/daily/point')
on conflict (uri) do nothing;
