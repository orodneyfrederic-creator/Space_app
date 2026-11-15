// Repères par culture et questions prêtes à poser à l'agent.
// Source : fiches de connaissances de l'équipe (knowledge/fiches), encore à faire valider.
// Partagé entre la page /cultures et la landing.

export type Culture = {
  id: 'manioc' | 'plantain' | 'arachide' | 'mais'
  nom: string
  repere: string
  questions: readonly string[]
}

export const CULTURES: readonly Culture[] = [
  {
    id: 'manioc',
    nom: 'Manioc',
    repere: 'Se plante par boutures quand les premières pluies sont installées ; les boutures craignent une période sèche juste après la plantation.',
    questions: ['Est-ce que je peux planter mon manioc cette semaine ?', 'Après mon manioc, que planter pour reposer la terre ?'],
  },
  {
    id: 'plantain',
    nom: 'Banane plantain',
    repere: 'Se plante par rejets, de préférence en début de saison des pluies ; besoin d’eau régulier.',
    questions: ['Mon sol est-il bon pour la banane plantain ?', 'Est-ce le bon moment pour planter mes rejets de plantain ?'],
  },
  {
    id: 'arachide',
    nom: 'Arachide',
    repere: 'Cycle court (environ 3 à 4 mois) ; légumineuse qui enrichit le sol en azote.',
    questions: ['Puis-je semer l’arachide maintenant ?', 'L’arachide est-elle une bonne rotation après le manioc ?'],
  },
  {
    id: 'mais',
    nom: 'Maïs',
    repere: 'Cycle d’environ 3 à 4 mois ; sensible au manque d’eau au moment de la floraison.',
    questions: ['Est-ce le bon moment pour semer le maïs ?', 'Donne-moi trois rotations possibles avec le maïs.'],
  },
]

/** Lien vers la page de discussion, avec la question déjà remplie. */
export const lienQuestion = (question: string) => `/discuter?question=${encodeURIComponent(question)}`
