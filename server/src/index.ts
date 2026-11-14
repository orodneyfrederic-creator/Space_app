import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { demarrerBot } from './bot/telegram.js'
import { api } from './gateways/api.js'

const app = new Hono()

// Seul le front-end S'STACK peut appeler l'API depuis un navigateur
app.use('/api/*', cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }))

app.get('/', (c) => c.text("S'STACK : le serveur fonctionne !"))
app.route('/api', api)

app.notFound((c) => c.json({ erreur: 'Adresse introuvable.' }, 404))

// Erreurs : toujours { erreur } en JSON, jamais la pile d'erreur côté client
app.onError((erreur, c) => {
  if (erreur instanceof HTTPException) return c.json({ erreur: erreur.message }, erreur.status)
  console.error('[serveur]', erreur)
  return c.json({ erreur: 'Une erreur est survenue sur le serveur. Réessayez dans un instant.' }, 500)
})

const port = Number(process.env.PORT) || 3001
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Serveur S'STACK sur http://localhost:${info.port}`)
})

// Bot Telegram (long polling en développement) : s'il ne démarre pas, le serveur web continue
demarrerBot()
