// src/components/ContactForm.tsx
import { useState, type FormEvent, type ReactNode } from "react";
import { useSiteMeta } from "../hooks/site-content-context";
import { hasPublicToken, publicApiUrl } from "../lib/api";
import { SECTION_SPACE, TITLE, WRAP } from "../lib/layout";
import { ui } from "../ui-strings";
import { ArrowIcon } from "./Icons";
import { Eyebrow } from "./Section";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success" }
  | { kind: "missing_contact" }
  | { kind: "rate_limited"; retryAfterSec: number | null }
  | { kind: "disabled" }
  | { kind: "error" };

const labelClass = "caps mb-2 block text-muted";
const inputClass =
  "block w-full rounded-[14px] border border-transparent bg-mist px-4 py-3.5 text-[16px] text-ink transition-colors duration-150 focus:border-ink focus:bg-paper focus:outline-none";

type ContactFormProps = {
  /** Étiquette de la section, posée sur le filet (contenu de Lea CRM). */
  eyebrow?: string;
  /** Titre et texte d'introduction, à gauche du formulaire sur grand écran ; à défaut, ui.form.title. */
  intro?: ReactNode;
};

/**
 * Formulaire de contact → POST /forms → prospect dans Lea CRM. Corps accepté :
 * { name, email, phone, message, company, pageUrl, website }. name et message
 * obligatoires, au moins un de email ou phone. Le serveur revalide tout
 * (400 sinon), retire le HTML des champs texte, limite à 5 envois/min/IP et
 * 50/jour/site (429 avec Retry-After, exposé en CORS).
 *
 * Masqué, introduction comprise, quand le formulaire est désactivé dans
 * Réglages (settings.contactForm.enabled === false) ou quand l'API répond 404
 * (formulaire désactivé entre deux builds, ou site inconnu : indiscernables).
 */
export function ContactForm({ eyebrow, intro }: ContactFormProps) {
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
    <section id="contact" className={`${WRAP} ${SECTION_SPACE} pb-24 md:pb-36`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="mt-10 grid gap-x-8 gap-y-12 md:mt-16 lg:grid-cols-12">
        <div className="lg:col-span-5">{intro ?? <h2 className={TITLE}>{ui.form.title}</h2>}</div>
        <form onSubmit={onSubmit} noValidate className="grid gap-5 lg:col-span-6 lg:col-start-7">
          <div>
            <label htmlFor="name" className={labelClass}>
              {ui.form.name}
            </label>
            <input id="name" name="name" required maxLength={120} autoComplete="name" className={inputClass} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className={labelClass}>
                {ui.form.email}
              </label>
              <input id="email" name="email" type="email" maxLength={200} autoComplete="email" className={inputClass} />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                {ui.form.phone}
              </label>
              <input id="phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="company" className={labelClass}>
              {ui.form.company}
            </label>
            <input id="company" name="company" maxLength={200} autoComplete="organization" className={inputClass} />
          </div>
          <div>
            <label htmlFor="message" className={labelClass}>
              {ui.form.message}
            </label>
            <textarea id="message" name="message" required maxLength={5000} rows={5} className={`${inputClass} resize-y`} />
          </div>

          {/* Pot de miel : invisible pour un visiteur, à la portée d'un robot qui remplit tous les champs. */}
          <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
            <label htmlFor="website">{ui.form.honeypot}</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={sending} className="button disabled:opacity-60">
              {sending ? ui.form.sending : ui.form.send}
              <ArrowIcon />
            </button>
          </div>

          {status.kind === "success" && (
            <p role="status" className="rounded-[14px] bg-jaune px-4 py-3 text-[15px] font-medium">
              {ui.form.success}
            </p>
          )}
          {status.kind === "missing_contact" && (
            <p role="alert" className="text-[15px] text-error">
              {ui.form.missingContact}
            </p>
          )}
          {status.kind === "rate_limited" && (
            <p role="alert" className="text-[15px] text-error">
              {ui.form.rateLimited(status.retryAfterSec)}
            </p>
          )}
          {status.kind === "error" && (
            <p role="alert" className="text-[15px] text-error">
              {ui.form.error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
