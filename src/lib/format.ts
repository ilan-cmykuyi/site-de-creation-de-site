// src/lib/format.ts
import { ui } from "../ui-strings";

/**
 * Date ISO de l'API → date lisible dans la locale et le fuseau du site
 * (ui.locale, ui.timeZone), ou null si absente/invalide. Le fuseau est fixé :
 * sinon le jour dépendrait de la machine, et la page prérendue au build (en
 * UTC) et son hydratation dans le navigateur (à Paris) n'afficheraient pas la
 * même date pour un article publié entre minuit et 2 h.
 */
export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat(ui.locale, { dateStyle: "long", timeZone: ui.timeZone }).format(date);
}
