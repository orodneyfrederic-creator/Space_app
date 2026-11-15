// L'ancienne page « Assistant » de la maquette est fusionnée avec /discuter.
import { redirect } from "next/navigation";

export default function Assistant() {
  redirect("/discuter");
}
