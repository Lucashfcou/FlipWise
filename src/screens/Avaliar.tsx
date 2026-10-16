import { useMemo, useState } from "react";
import { CATEGORY_LABEL, CONDITIONS, PRODUCTS, findProduct } from "../domain/catalog";
import type { Category, Condition } from "../domain/types";
import { money, today } from "../format";
import { useApp } from "../state";
import { SourceNote } from "../ui/SourceNote";
import { Verdict } from "../ui/Verdict";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

export function Avaliar({ goStock }: { goStock: () => void }) {
  const { priceFor, settings, contribute, addStock } = useApp();
  const [category, setCategory] = useState<Category>("console");
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState<string>(PRODUCTS.find((p) => p.category === "console")!.id);
  const [condition, setCondition] = useState<Condition>("B");
  const [asked, setAsked] = useState("");
  const [saved, setSaved] = useState(false);

  const list = useMemo(
    () =>
      PRODUCTS.filter(
        (p) => p.category === category && `${p.name} ${p.variant}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [category, query],
  );

  const product = findProduct(productId)!;
  const conditions = CONDITIONS[product.category];
  const price = priceFor(productId, condition);
  const askedNum = asked === "" ? null : Number(asked.replace(",", "."));

  function pickCategory(c: Category) {
    setCategory(c);
    setQuery("");
    const first = PRODUCTS.find((p) => p.category === c)!;
    setProductId(first.id);
    setCondition(CONDITIONS[c][Math.min(1, CONDITIONS[c].length - 1)].id);
    setSaved(false);
  }

  function pickProduct(id: string) {
    setProductId(id);
    setSaved(false);
  }

  function saveObservation() {
    if (askedNum === null || !Number.isFinite(askedNum) || askedNum <= 0) return;
    contribute({ productId, condition, value: askedNum, kind: "ask", source: "eu", date: today() });
    setSaved(true);
  }

  function bought() {
    if (askedNum === null || !Number.isFinite(askedNum) || askedNum <= 0) return;
    addStock({
      productId,
      condition,
      cost: askedNum,
      extraCosts: 0,
      boughtAt: "",
      boughtDate: today(),
      estimate: price.count ? price.typical : undefined,
    });
    goStock();
  }

  return (
    <section>
      <h1>Vale a pena comprar?</h1>
      <SourceNote />

      <div className="chips" role="tablist" aria-label="Categoria">
        {CATEGORIES.map((c) => (
          <button key={c} role="tab" aria-selected={c === category} className={c === category ? "chip on" : "chip"} onClick={() => pickCategory(c)}>
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <input
        className="field"
        type="search"
        placeholder={`Procurar em ${CATEGORY_LABEL[category].toLowerCase()}`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Procurar produto"
      />

      <ul className="picklist">
        {list.map((p) => (
          <li key={p.id}>
            <button className={p.id === productId ? "pick on" : "pick"} onClick={() => pickProduct(p.id)}>
              <span>{p.name}</span>
              <small>{p.variant}</small>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="empty">Nada encontrado neste catálogo inicial.</li>}
      </ul>

      <h2>Estado</h2>
      <div className="chips">
        {conditions.map((c) => (
          <button key={c.id} className={c.id === condition ? "chip on" : "chip"} onClick={() => { setCondition(c.id); setSaved(false); }} title={c.hint}>
            {c.label}
          </button>
        ))}
      </div>
      <p className="hint">{conditions.find((c) => c.id === condition)?.hint}</p>

      <label className="label" htmlFor="asked">Preço do anúncio (€)</label>
      <input
        id="asked"
        className="field mono"
        inputMode="decimal"
        placeholder="ex.: 140"
        value={asked}
        onChange={(e) => { setAsked(e.target.value); setSaved(false); }}
      />

      <Verdict price={price} asked={askedNum} productLabel={`${product.name} ${product.variant}`} margin={settings.targetMargin} />

      {askedNum !== null && Number.isFinite(askedNum) && askedNum > 0 && (
        <div className="actions">
          <button className="btn primary" onClick={bought}>Comprei por {money(askedNum)}</button>
          <button className="btn ghost" onClick={saveObservation} disabled={saved}>
            {saved ? "Guardado" : "Guardar este preço"}
          </button>
        </div>
      )}
    </section>
  );
}
