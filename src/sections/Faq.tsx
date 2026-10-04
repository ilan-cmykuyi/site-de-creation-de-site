// src/sections/Faq.tsx
//
// Section « faq » de site.schema.json : eyebrow, title et
// items[question, answer]. Chaque question est un <details> natif : les
// réponses s'ouvrent au clic ou au clavier, sans JavaScript, et restent dans
// le HTML prérendu (lisibles par Google).
import { PlusIcon } from "../components/Icons";
import { Section, SectionTitle } from "../components/Section";
import { useSection } from "../hooks/site-content-context";
import { BODY } from "../lib/layout";

type Faq = { eyebrow?: string; title?: string; items?: { question?: string; answer?: string }[] };

export function Faq() {
  const { eyebrow, title, items } = useSection<Faq>("faq");
  const list = (items ?? []).filter((item) => item.question?.trim() && item.answer?.trim());
  if (list.length === 0) return null;

  return (
    <Section eyebrow={eyebrow}>
      <div className="grid gap-x-8 lg:grid-cols-12">
        <SectionTitle className="lg:col-span-5">{title}</SectionTitle>
        <ul className="reveal mt-12 border-b border-rule md:mt-16 lg:col-span-7">
          {list.map((item, i) => (
            // Questions sans identifiant stable (liste du schéma) : l'index.
            <li key={i} className="border-t border-rule">
              <details className="faq group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[19px] leading-snug font-medium tracking-[-0.01em] md:py-6 md:text-[22px] [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <PlusIcon className="mt-1 size-5 shrink-0 motion-safe:transition-transform motion-safe:duration-300 group-open:rotate-45" />
                </summary>
                <p className={`max-w-[60ch] pb-6 whitespace-pre-line text-muted md:pb-8 ${BODY}`}>{item.answer}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
