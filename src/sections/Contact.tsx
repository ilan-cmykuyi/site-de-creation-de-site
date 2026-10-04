// src/sections/Contact.tsx
//
// Section « contact » de site.schema.json : eyebrow, title et text, posés à
// gauche du formulaire de contact (src/components/ContactForm.tsx), qui garde
// toute sa logique d'envoi et se masque, introduction comprise, quand le
// formulaire est désactivé. Les libellés des champs restent dans
// src/ui-strings.ts.
import { ContactForm } from "../components/ContactForm";
import { useSection } from "../hooks/site-content-context";
import { BODY, TITLE } from "../lib/layout";
import { ui } from "../ui-strings";

type Contact = { eyebrow?: string; title?: string; text?: string };

export function Contact() {
  const { eyebrow, title, text } = useSection<Contact>("contact");

  return (
    <ContactForm
      eyebrow={eyebrow}
      intro={
        <>
          <h2 className={`reveal max-w-[16ch] ${TITLE}`}>{title || ui.form.title}</h2>
          {text && <p className={`mt-6 max-w-[44ch] whitespace-pre-line text-muted ${BODY} md:text-[18px]`}>{text}</p>}
        </>
      }
    />
  );
}
