-- MODULE 06 — Assistant intelligent (/assistant)
-- Tables de l'agent : conversations, messages, appels d'outils, recommandations,
-- journal des actions, sources de connaissances et permissions des outils.
--
-- Principe de sécurité : le BACKEND (server/, clé service_role) est la couche d'autorisation.
--   • Il est le seul à écrire dans ces tables (pas de politique INSERT/UPDATE pour le navigateur).
--   • Un utilisateur connecté peut seulement LIRE ses propres conversations, messages et actions.
--   • Toute écriture métier proposée par l'agent passe par ai_action_logs (statut « proposee »)
--     et n'est exécutée qu'après confirmation explicite de l'utilisateur.
--   • Les diagnostics sur image sont enregistrés avec est_hypothese = true.
-- ⚠️ À faire relire par le back-end avant de l'appliquer (supabase db push).

create extension if not exists pgcrypto;

-- ─── Agents et outils ───────────────────────────────────────────────────────

create table if not exists ai_agents (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,              -- ex. 'assistant'
  nom            text not null,
  description    text,
  modele         text,                              -- ex. modèle Groq / Gemini
  prompt_systeme text,
  actif          boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Liste blanche des outils qu'un agent a le droit d'appeler
create table if not exists ai_agent_permissions (
  id                    uuid primary key default gen_random_uuid(),
  agent_id              uuid not null references ai_agents(id) on delete cascade,
  outil                 text not null,              -- ex. 'consulter_parcelle'
  portee                text not null check (portee in ('lecture', 'ecriture')),
  confirmation_requise  boolean not null default false,
  actif                 boolean not null default true,
  unique (agent_id, outil),
  -- une écriture exige toujours une confirmation
  check (portee = 'lecture' or confirmation_requise)
);

-- Fiches, jeux de données et documents que l'agent peut citer
create table if not exists ai_knowledge_sources (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid references ai_agents(id) on delete set null,  -- null = commun à tous les agents
  titre       text not null,
  type        text not null check (type in ('fiche', 'jeu_de_donnees', 'document', 'api')),
  uri         text not null,                        -- ex. knowledge/fiches/calendrier-cultures.md
  metadonnees jsonb not null default '{}'::jsonb,
  mis_a_jour  timestamptz not null default now()
);

-- ─── Conversations ──────────────────────────────────────────────────────────

create table if not exists ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,  -- null pour un utilisateur Telegram non lié
  agent_id    uuid references ai_agents(id) on delete set null,
  parcelle_id text,                                 -- identifiant de parcelle (ex. 'tchibanga'), facultatif
  canal       text not null default 'web' check (canal in ('web', 'telegram')),
  titre       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists ai_conversations_user_idx on ai_conversations (user_id, updated_at desc);

create table if not exists ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'tool', 'system')),
  contenu         text not null default '',
  parcelle_id     text,
  -- pièce jointe : chemin dans le bucket privé 'ai-pieces-jointes' (jamais d'URL publique)
  piece_jointe    jsonb,                            -- { chemin, nom, type, taille }
  created_at      timestamptz not null default now()
);
create index if not exists ai_messages_conversation_idx on ai_messages (conversation_id, created_at);

create table if not exists ai_tool_calls (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  message_id      uuid references ai_messages(id) on delete cascade,
  outil           text not null,
  arguments       jsonb not null default '{}'::jsonb,
  resultat        jsonb,
  statut          text not null check (statut in ('ok', 'erreur', 'refuse')),
  duree_ms        integer,
  created_at      timestamptz not null default now()
);
create index if not exists ai_tool_calls_conversation_idx on ai_tool_calls (conversation_id);

create table if not exists ai_recommendations (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  message_id      uuid references ai_messages(id) on delete cascade,
  parcelle_id     text,
  type            text not null check (type in ('conseil', 'diagnostic')),
  contenu         text not null,
  est_hypothese   boolean not null default false,
  confiance       numeric(3, 2) check (confiance between 0 and 1),
  sources         jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  -- un diagnostic (ex. sur photo) reste toujours une hypothèse
  check (type <> 'diagnostic' or est_hypothese)
);

-- Journal des écritures proposées par l'agent, puis confirmées ou annulées
create table if not exists ai_action_logs (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  message_id      uuid references ai_messages(id) on delete set null,
  user_id         uuid references auth.users(id) on delete set null,
  parcelle_id     text,
  outil           text not null,                    -- ex. 'planifier_activite'
  titre           text not null,
  apercu          jsonb not null default '[]'::jsonb,  -- [{ label, valeur }] montré avant confirmation
  statut          text not null default 'proposee'
                  check (statut in ('proposee', 'confirmee', 'annulee', 'executee', 'echec')),
  confirme_le     timestamptz,
  execute_le      timestamptz,
  erreur          text,
  created_at      timestamptz not null default now(),
  -- pas d'exécution sans confirmation
  check (statut not in ('confirmee', 'executee') or confirme_le is not null)
);
create index if not exists ai_action_logs_user_idx on ai_action_logs (user_id, created_at desc);

-- ─── Sécurité (RLS) : lecture de ses propres données uniquement ─────────────

alter table ai_agents            enable row level security;
alter table ai_agent_permissions enable row level security;
alter table ai_knowledge_sources enable row level security;
alter table ai_conversations     enable row level security;
alter table ai_messages          enable row level security;
alter table ai_tool_calls        enable row level security;
alter table ai_recommendations   enable row level security;
alter table ai_action_logs       enable row level security;
-- ai_agents, ai_agent_permissions, ai_knowledge_sources : aucune politique → accès serveur uniquement.

create policy "lire ses conversations" on ai_conversations
  for select to authenticated using (user_id = auth.uid());

create policy "lire ses messages" on ai_messages
  for select to authenticated using (
    exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

create policy "lire ses appels d'outils" on ai_tool_calls
  for select to authenticated using (
    exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

create policy "lire ses recommandations" on ai_recommendations
  for select to authenticated using (
    exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

create policy "lire ses actions" on ai_action_logs
  for select to authenticated using (user_id = auth.uid());

-- ─── Stockage privé des pièces jointes ──────────────────────────────────────
-- Bucket non public, 10 Mo max, photos et PDF. Le serveur dépose les fichiers sous
-- <user_id>/<conversation_id>/… et fournit des URL signées de courte durée.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ai-pieces-jointes', 'ai-pieces-jointes', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "lire ses pièces jointes" on storage.objects
  for select to authenticated using (
    bucket_id = 'ai-pieces-jointes' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Données de départ : l'agent et ses outils ──────────────────────────────

insert into ai_agents (code, nom, description)
values ('assistant', 'Assistant S''STACK',
        'Agent conversationnel qui connaît les parcelles, lit les indicateurs NASA POWER / SoilGrids et propose des actions à confirmer.')
on conflict (code) do nothing;

insert into ai_agent_permissions (agent_id, outil, portee, confirmation_requise)
select a.id, o.outil, o.portee, o.confirmation
from ai_agents a
cross join (values
  ('lister_parcelles',         'lecture',  false),
  ('consulter_parcelle',       'lecture',  false),
  ('lire_indicateurs',         'lecture',  false),
  ('rechercher_connaissances', 'lecture',  false),
  ('analyser_photo',           'lecture',  false),
  ('planifier_activite',       'ecriture', true)
) as o(outil, portee, confirmation)
where a.code = 'assistant'
on conflict (agent_id, outil) do nothing;

insert into ai_knowledge_sources (titre, type, uri)
select v.titre, v.type, v.uri
from (values
  ('Calendrier des cultures', 'fiche',          'knowledge/fiches/calendrier-cultures.md'),
  ('Rotations',               'fiche',          'knowledge/fiches/rotations.md'),
  ('Seuils agro-climatiques', 'fiche',          'knowledge/fiches/seuils.md'),
  ('Sols du Gabon',           'fiche',          'knowledge/fiches/sols-gabon.md'),
  ('SoilGrids — sites',       'jeu_de_donnees', 'knowledge/data/soilgrids-sites.json'),
  ('NASA POWER',              'api',            'https://power.larc.nasa.gov/api/temporal/daily/point')
) as v(titre, type, uri)
where not exists (select 1 from ai_knowledge_sources s where s.uri = v.uri);
