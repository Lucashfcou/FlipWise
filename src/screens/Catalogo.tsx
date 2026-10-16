import { useState } from "react";
import { CATEGORY_LABEL, CONDITIONS, PRODUCTS } from "../domain/catalog";
import type { Category } from "../domain/types";
import { money } from "../format";
import { useApp } from "../state";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

export function Catalogo() {
  const { priceFor, usingExamples } = useApp();
  const [category, setCategory] = useState<Category>("console");
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section>
      <h1>Catálogo</h1>
      {usingExamples && <p className="note">Valores de exemplo, não preços reais.</p>}
      <div className="chips">
        {CATEGORIES.map((c) => (
          <button key={c} className={c === category ? "chip on" : "chip"} onClick={() => { setCategory(c); setOpen(null); }}>
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>
      <ul className="cards">
        {PRODUCTS.filter((p) => p.category === category).map((p) => {
          const conds = CONDITIONS[p.category];
          const best = priceFor(p.id, conds[0].id);
          const isOpen = open === p.id;
          return (
            <li key={p.id} className="stockcard">
              <button className="rowbtn" onClick={() => setOpen(isOpen ? null : p.id)} aria-expanded={isOpen}>
                <strong>{p.name} <small>{p.variant}</small></strong>
                <span className="mono">{best.count ? money(best.typical) : "–"}</span>
              </button>
              {isOpen && (
                <ul className="plain">
                  {conds.map((c) => {
                    const e = priceFor(p.id, c.id);
                    return (
                      <li key={c.id} className="row">
                        <span>{c.label}</span>
                        <span className="mono">{e.count ? `${money(e.low)} – ${money(e.high)}` : "–"}</span>
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
