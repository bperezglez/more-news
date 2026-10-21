import { permanentRedirect } from "next/navigation";

/** La portada editorial es la página principal desde / */
export default function PortadasRedirectPage() {
  permanentRedirect("/");
}
