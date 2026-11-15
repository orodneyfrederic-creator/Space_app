// Mots de passe : empreinte scrypt (module crypto de Node, aucune dépendance).
// Format stocké : scrypt$N$r$p$sel(base64)$empreinte(base64)
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'

const N = 16384
const R = 8
const P = 1
const LONGUEUR = 64

function deriver(motDePasse: string, sel: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resoudre, rejeter) => {
    scrypt(motDePasse.normalize('NFKC'), sel, LONGUEUR, options, (erreur, cle) => (erreur ? rejeter(erreur) : resoudre(cle)))
  })
}

export async function hacherMotDePasse(motDePasse: string): Promise<string> {
  const sel = randomBytes(16)
  const empreinte = await deriver(motDePasse, sel, { N, r: R, p: P })
  return ['scrypt', N, R, P, sel.toString('base64'), empreinte.toString('base64')].join('$')
}

/** Vrai si le mot de passe correspond à l'empreinte (comparaison en temps constant). */
export async function verifierMotDePasse(motDePasse: string, stocke: string): Promise<boolean> {
  const [algo, n, r, p, sel, empreinte] = stocke.split('$')
  if (algo !== 'scrypt' || !n || !r || !p || !sel || !empreinte) return false
  const attendue = Buffer.from(empreinte, 'base64')
  const calculee = await deriver(motDePasse, Buffer.from(sel, 'base64'), { N: Number(n), r: Number(r), p: Number(p) })
  return calculee.length === attendue.length && timingSafeEqual(calculee, attendue)
}

// Empreinte factice : vérifiée quand le numéro est inconnu, pour que la réponse prenne le même temps
let empreinteFactice: Promise<string> | undefined
export function empreinteLeurre(): Promise<string> {
  empreinteFactice ??= hacherMotDePasse(randomBytes(12).toString('hex'))
  return empreinteFactice
}
