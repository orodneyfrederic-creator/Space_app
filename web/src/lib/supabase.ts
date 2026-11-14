// Client Supabase côté navigateur : clé PUBLIQUE uniquement.
// ⛔ Ne jamais mettre la clé secrète (service_role / sb_secret) dans web/ : elle donne tous les droits sur la base.
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const clePublique = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** null tant que web/.env.local n'est pas rempli : les pages doivent alors utiliser les données de démo. */
export const supabase = url && clePublique ? createClient(url, clePublique) : null
