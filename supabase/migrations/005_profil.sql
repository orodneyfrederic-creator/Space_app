-- S'STACK : profil professionnel du compte (producteur, conseiller, organisation).
-- Le tableau de bord et le menu s'adaptent au profil. À exécuter une fois dans le SQL Editor de Supabase, APRÈS 002.
-- Tant que cette migration n'est pas exécutée, le serveur considère tous les comptes comme « producteur ».
alter table public.utilisateurs
  add column if not exists profil text not null default 'producteur'
  check (profil in ('producteur', 'conseiller', 'organisation'));
