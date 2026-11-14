'use client'
// Bouton micro : enregistre la voix du producteur dans le navigateur.
// TODO (front-end) :
//  1. navigator.mediaDevices.getUserMedia({ audio: true }) puis new MediaRecorder(flux).
//  2. Appui = démarrer, second appui = arrêter ; assembler les morceaux en un Blob (audio/webm).
//  3. Appeler onEnregistrement(blob). Le serveur transcrit avec Whisper (Groq), qui accepte le webm.
//  4. Gérer le refus du micro (message clair) et afficher un indicateur « enregistrement… ».

type Props = { onEnregistrement: (audio: Blob) => void }

export default function BoutonMicro({ onEnregistrement }: Props) {
  void onEnregistrement // à utiliser quand l'enregistrement sera codé
  return (
    <button type="button" className="rounded border px-3" aria-label="Parler à l'agent" title="Bientôt disponible">
      🎤
    </button>
  )
}
