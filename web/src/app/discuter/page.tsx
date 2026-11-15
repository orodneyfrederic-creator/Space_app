// L'ancienne page « Discuter » est remplacée par l'assistant intelligent (module 06).
import { redirect } from 'next/navigation'

export default function PageDiscuter() {
  redirect('/assistant')
}
