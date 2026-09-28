// src/components/ConsentBanner.tsx
import { useConsent } from "../hooks/useConsent";
import { ui } from "../ui-strings";

/** Bannière minimale, affichée seulement si le site a un identifiant de suivi et qu'aucun choix n'est mémorisé. */
export function ConsentBanner() {
  const { needsDecision, grant, deny } = useConsent();
  if (!needsDecision) return null;

  return (
    <div role="dialog" className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-700 bg-slate-900 px-4 py-4 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">{ui.consent.text}</p>
        <div className="flex gap-2">
          <button type="button" onClick={deny} className="rounded-md border border-slate-500 px-4 py-2 text-sm hover:bg-slate-800">
            {ui.consent.refuse}
          </button>
          <button type="button" onClick={grant} className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
            {ui.consent.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
