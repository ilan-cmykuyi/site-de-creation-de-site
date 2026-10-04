// src/sections/Services.tsx
//
// Section « services » de site.schema.json : eyebrow, manifesto (la grande
// phrase, en très grand) et items[title, text], trois ou quatre prestations
// posées chacune sur un filet noir.
import { Section } from "../components/Section";
import { useSection } from "../hooks/site-content-context";
import { BODY } from "../lib/layout";

type Services = { eyebrow?: string; manifesto?: string; items?: { title?: string; text?: string }[] };

// Colonnes selon le nombre de prestations, pour une rangée toujours pleine.
const COLUMNS: Record<number, string> = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" };

export function Services() {
  const { eyebrow, manifesto, items } = useSection<Services>("services");
  const list = (items ?? []).filter((item) => item.title?.trim());
  if (!manifesto && list.length === 0) return null;

  return (
    <Section eyebrow={eyebrow}>
      {manifesto && (
        <h2 className="reveal mt-10 max-w-[30ch] text-[34px] leading-[1.06] font-medium tracking-[-0.03em] text-balance whitespace-pre-line md:mt-16 md:text-[56px] lg:text-[80px] lg:leading-[1.02]">
          {manifesto}
        </h2>
      )}
      {list.length > 0 && (
        <ul className={`mt-16 grid gap-x-6 gap-y-10 md:mt-24 lg:gap-x-8 ${COLUMNS[list.length] ?? "md:grid-cols-2"}`}>
          {list.map((item, i) => (
            // Prestations sans identifiant stable (liste du schéma) : l'index.
            <li key={i} className="reveal border-t border-ink pt-5">
              <h3 className="text-[20px] leading-snug font-medium tracking-[-0.01em] text-balance md:text-[22px]">{item.title}</h3>
              {item.text && <p className={`mt-3 max-w-[42ch] text-muted ${BODY}`}>{item.text}</p>}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
