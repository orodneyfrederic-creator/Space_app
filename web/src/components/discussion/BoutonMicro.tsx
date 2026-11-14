'use client'
// Bouton micro : un appui démarre l'enregistrement, un second l'arrête et envoie l'audio (webm).
import { useEffect, useRef, useState } from 'react'
import { MicIcon } from '../icons'

type Props = {
  onEnregistrement: (audio: Blob) => void
  onErreur: (message: string) => void
  desactive?: boolean
}

export default function BoutonMicro({ onEnregistrement, onErreur, desactive = false }: Props) {
  const [enregistre, setEnregistre] = useState(false)
  const enregistreur = useRef<MediaRecorder | null>(null)
  const morceaux = useRef<Blob[]>([])

  // Libère le micro si le composant disparaît pendant un enregistrement
  useEffect(() => () => enregistreur.current?.stream.getTracks().forEach((t) => t.stop()), [])

  async function demarrer() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onErreur('Votre navigateur ne permet pas d\'enregistrer la voix. Écrivez votre question.')
      return
    }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true })
      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find((t) => MediaRecorder.isTypeSupported(t))
      const rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined)
      morceaux.current = []
      rec.ondataavailable = (e) => e.data.size > 0 && morceaux.current.push(e.data)
      rec.onstop = () => {
        flux.getTracks().forEach((t) => t.stop())
        const audio = new Blob(morceaux.current, { type: rec.mimeType || 'audio/webm' })
        if (audio.size > 0) onEnregistrement(audio)
      }
      rec.start()
      enregistreur.current = rec
      setEnregistre(true)
    } catch {
      onErreur('Accès au micro refusé. Autorisez le micro dans votre navigateur, ou écrivez votre question.')
    }
  }

  function arreter() {
    enregistreur.current?.stop()
    enregistreur.current = null
    setEnregistre(false)
  }

  return (
    <button
      type="button"
      onClick={enregistre ? arreter : demarrer}
      disabled={desactive && !enregistre}
      aria-pressed={enregistre}
      aria-label={enregistre ? 'Arrêter l\'enregistrement et envoyer' : 'Parler à l\'agent'}
      title={enregistre ? 'Arrêter et envoyer' : 'Parler'}
      className={`flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:opacity-50 ${
        enregistre ? 'animate-pulse border-risk bg-risk text-white' : 'border-line bg-paper text-accent hover:border-accent'
      }`}
    >
      <MicIcon />
    </button>
  )
}
