// Ouvre l'agent flottant depuis n'importe quel bouton de l'application, avec une question facultative.
export const EVENEMENT_OUVRIR_AGENT = 'sstack:ouvrir-agent'

export type DetailOuverture = { question?: string }

export function ouvrirAgent(question?: string) {
  window.dispatchEvent(new CustomEvent<DetailOuverture>(EVENEMENT_OUVRIR_AGENT, { detail: { question } }))
}
