// src/components/ContactForm.tsx
import { useState, type FormEvent } from "react";
import { useSiteMeta } from "../hooks/site-content-context";
import { hasPublicToken, publicApiUrl } from "../lib/api";
import { ui } from "../ui-strings";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success" }
  | { kind: "missing_contact" }
  | { kind: "rate_limited"; retryAfterSec: number | null }
  | { kind: "disabled" }
  | { kind: "error" };

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30";

/**
 * Formulaire de contact → POST /forms → prospect dans Lea CRM. Corps accepté :
 * { name, email, phone, message, company, pageUrl, website }. name et message
 * obligatoires, au moins un de email ou phone. Le serveur revalide tout
 * (400 sinon), retire le HTML des champs texte, limite à 5 envois/min/IP et
 * 50/jour/site (429 avec Retry-After, exposé en CORS).
 *
 * Masqué quand le formulaire est désactivé dans Réglages
 * (settings.contactForm.enabled === false) ou quand l'API répond 404
 * (formulaire désactivé entre deux builds, ou site inconnu : indiscernables).
 */
export function ContactForm() {
  const { site } = useSiteMeta();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  if (site.settings.contactForm?.enabled === false || status.kind === "disabled") return null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // currentTarget n'est plus disponible après un await : on le garde ici.
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    // Pot de miel : un visiteur ne remplit jamais ce champ, caché en CSS.
    // Vérification côté client par confort ; la vraie barrière est côté
    // serveur (200 sans rien créer), y compris pour un appel direct à l'API.
    if (form.get("website")) {
      setStatus({ kind: "success" });
      return;
    }

    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    if (!email && !phone) {
      setStatus({ kind: "missing_contact" });
      return;
    }
    if (!hasPublicToken()) {
      setStatus({ kind: "error" });
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const res = await fetch(publicApiUrl("forms", null), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: email || undefined,
          phone: phone || undefined,
          message: form.get("message"),
          company: form.get("company") || undefined,
          pageUrl: window.location.href,
          website: form.get("website"),
        }),
      });
      if (res.status === 200) {
        setStatus({ kind: "success" });
        formEl.reset();
        return;
      }
      if (res.status === 429) {
        const retryAfterSec = Number(res.headers.get("Retry-After"));
        setStatus({ kind: "rate_limited", retryAfterSec: Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec : null });
        return;
      }
      if (res.status === 404) {
        setStatus({ kind: "disabled" });
        return;
      }
      setStatus({ kind: "error" }); // 400 invalid_json / invalid_body, ou toute autre réponse inattendue
    } catch {
      setStatus({ kind: "error" }); // réseau coupé, ou origine refusée par CORS (localhost vers la production)
    }
  }

  const sending = status.kind === "sending";

  return (
    <section id="contact" className="mx-auto max-w-2xl px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{ui.form.title}</h2>
      <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            {ui.form.name}
          </label>
          <input id="name" name="name" required maxLength={120} autoComplete="name" className={inputClass} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              {ui.form.email}
            </label>
            <input id="email" name="email" type="email" maxLength={200} autoComplete="email" className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
              {ui.form.phone}
            </label>
            <input id="phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-slate-700">
            {ui.form.company}
          </label>
          <input id="company" name="company" maxLength={200} autoComplete="organization" className={inputClass} />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-700">
            {ui.form.message}
          </label>
          <textarea id="message" name="message" required maxLength={5000} rows={5} className={inputClass} />
        </div>

        {/* Pot de miel : invisible pour un visiteur, à la portée d'un robot qui remplit tous les champs. */}
        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
          <label htmlFor="website">{ui.form.honeypot}</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center rounded-md bg-blue-700 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-800 disabled:opacity-60"
          >
            {sending ? ui.form.sending : ui.form.send}
          </button>
        </div>

        {status.kind === "success" && (
          <p role="status" className="text-sm text-green-700">
            {ui.form.success}
          </p>
        )}
        {status.kind === "missing_contact" && (
          <p role="alert" className="text-sm text-red-700">
            {ui.form.missingContact}
          </p>
        )}
        {status.kind === "rate_limited" && (
          <p role="alert" className="text-sm text-red-700">
            {ui.form.rateLimited(status.retryAfterSec)}
          </p>
        )}
        {status.kind === "error" && (
          <p role="alert" className="text-sm text-red-700">
            {ui.form.error}
          </p>
        )}
      </form>
    </section>
  );
}
