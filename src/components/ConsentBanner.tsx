// src/components/ConsentBanner.tsx
import { useConsent } from "../hooks/useConsent";
import { ui } from "../ui-strings";

/**
 * Bannière minimale, affichée seulement si le site a un identifiant de suivi
 * et qu'aucun choix n'est mémorisé. Refuser est aussi simple et aussi visible
 * qu'accepter : deux pastilles identiques.
 */
export function ConsentBanner() {
  const { needsDecision, grant, deny } = useConsent();
  if (!needsDecision) return null;

  return (
    <div
      role="dialog"
      className="fixed inset-x-3 bottom-3 z-50 flex flex-col gap-4 rounded-[20px] bg-ink p-5 text-paper md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md"
    >
      <p className="text-[15px] leading-snug">{ui.consent.text}</p>
      <div className="flex gap-2">
        <button type="button" onClick={deny} className="pill bg-paper">
          {ui.consent.refuse}
        </button>
        <button type="button" onClick={grant} className="pill bg-paper">
          {ui.consent.accept}
        </button>
      </div>
    </div>
  );
}
