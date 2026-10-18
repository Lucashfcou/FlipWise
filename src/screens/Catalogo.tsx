import { useRef, useState } from "react";
import { CATEGORY_LABEL, CONDITIONS, PRODUCTS, productLabel } from "../domain/catalog";
import type { Category } from "../domain/types";
import { stagger, useFx } from "../fx";
import { t } from "../i18n";
import { money } from "../format";
import { useApp } from "../state";
import { SourceNote } from "../ui/SourceNote";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

export function Catalogo() {
  const { priceFor } = useApp();
  const [category, setCategory] = useState<Category>("console");
  const [open, setOpen] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useFx(listRef, (root) => stagger([...root.children].slice(0, 14), 8, 22), [category]);

  return (
    <section>
      <h1>{t("catalog.title")}</h1>
      <SourceNote />
      <div className="chips">
        {CATEGORIES.map((c) => (
          <button key={c} className={c === category ? "chip on" : "chip"} onClick={() => { setCategory(c); setOpen(null); }}>
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>
      <ul className="cards" ref={listRef}>
        {PRODUCTS.filter((p) => p.category === category).map((p) => {
          const conds = CONDITIONS[p.category];
          const main = conds[Math.min(1, conds.length - 1)];
          const best = priceFor(p.id, main.id);
          const isOpen = open === p.id;
          return (
            <li key={p.id} className="stockcard">
              <button className="rowbtn" onClick={() => setOpen(isOpen ? null : p.id)} aria-expanded={isOpen}>
                <strong>{productLabel(p)}</strong>
                <span className="mono">{best.count ? money(best.typical) : t("catalog.none")}</span>
              </button>
              {isOpen && (
                <ul className="plain">
                  {conds.map((c) => {
                    const e = priceFor(p.id, c.id);
                    return (
                      <li key={c.id} className="row">
                        <span>{c.label}</span>
                        <span className="mono">{e.count ? `${money(e.low)} – ${money(e.high)}` : t("catalog.none")}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
