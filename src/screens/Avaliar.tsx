import { useMemo, useState } from "react";
import { CATEGORY_LABEL, CONDITIONS, PRODUCTS, findProduct } from "../domain/catalog";
import type { Category, Condition } from "../domain/types";
import { money, today } from "../format";
import { useApp } from "../state";
import { Lote } from "./Lote";
import { SourceNote } from "../ui/SourceNote";
import { Verdict } from "../ui/Verdict";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

export function Avaliar({ goStock }: { goStock: () => void }) {
  const { priceFor, settings, contribute, addStock } = useApp();
  const [mode, setMode] = useState<"item" | "lote">("item");
  const [category, setCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [condition, setCondition] = useState<Condition>("B");
  const [asked, setAsked] = useState("");
  const [saved, setSaved] = useState(false);

  const searching = query.trim().length > 0;
  const list = useMemo(() => {
    if (searching) {
      const q = query.toLowerCase();
      return PRODUCTS.filter((p) => `${p.name} ${p.variant}`.toLowerCase().includes(q));
    }
    return category ? PRODUCTS.filter((p) => p.category === category) : [];
  }, [category, query, searching]);

  const product = productId ? findProduct(productId)! : null;
  const askedNum = asked === "" ? null : Number(asked.replace(",", "."));
  const validAsked = askedNum !== null && Number.isFinite(askedNum) && askedNum > 0;
  const price = product ? priceFor(product.id, condition) : null;

  function pick(id: string) {
    const p = findProduct(id)!;
    setProductId(id);
    const conds = CONDITIONS[p.category];
    setCondition(conds[Math.min(1, conds.length - 1)].id);
    setQuery("");
    setSaved(false);
  }

  function reset() {
    setProductId(null);
    setAsked("");
    setSaved(false);
  }

  function saveObservation() {
    if (!product || !validAsked) return;
    contribute({ productId: product.id, condition, value: askedNum as number, kind: "ask", source: "eu", date: today() });
    setSaved(true);
  }

  function bought() {
    if (!product || !price || !validAsked) return;
    addStock({
      productId: product.id,
      condition,
      cost: askedNum as number,
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
      <div className="chips" role="tablist" aria-label="Tipo de avaliação">
        <button role="tab" aria-selected={mode === "item"} className={mode === "item" ? "chip on" : "chip"} onClick={() => setMode("item")}>Um item</button>
        <button role="tab" aria-selected={mode === "lote"} className={mode === "lote" ? "chip on" : "chip"} onClick={() => setMode("lote")}>Lote</button>
      </div>

      {mode === "lote" ? (
        <Lote goStock={goStock} />
      ) : !product ? (
        <>
          <input
            className="field"
            type="search"
            placeholder="Procurar produto (ex.: PS4 Slim, DualSense)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Procurar produto"
          />

          {!searching && (
            <div className="tiles" role="tablist" aria-label="Categoria">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  role="tab"
                  aria-selected={c === category}
                  className={c === category ? "tile on" : "tile"}
                  onClick={() => setCategory(c === category ? null : c)}
                >
                  <strong>{CATEGORY_LABEL[c]}</strong>
                  <small>{PRODUCTS.filter((p) => p.category === c).length} produtos</small>
                </button>
              ))}
            </div>
          )}

          {(searching || category) && (
            <ul className="picklist">
              {list.map((p) => (
                <li key={p.id}>
                  <button className="pick" onClick={() => pick(p.id)}>
                    <span>{p.name}</span>
                    <small>{p.variant}</small>
                  </button>
                </li>
              ))}
              {list.length === 0 && <li className="empty">Nada encontrado neste catálogo inicial.</li>}
            </ul>
          )}
          {!searching && !category && <p className="hint">Escolhe uma categoria ou procura pelo nome.</p>}
        </>
      ) : (
        <>
          <div className="chosen">
            <div>
              <small>Produto</small>
              <strong>{product.name} {product.variant}</strong>
            </div>
            <button className="btn ghost" onClick={reset}>Trocar</button>
          </div>

          <span className="label">Estado</span>
          <div className="chips">
            {CONDITIONS[product.category].map((c) => (
              <button
                key={c.id}
                className={c.id === condition ? "chip on" : "chip"}
                onClick={() => { setCondition(c.id); setSaved(false); }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="hint">{CONDITIONS[product.category].find((c) => c.id === condition)?.hint}</p>

          <label className="label" htmlFor="asked">Preço do anúncio (€)</label>
          <input
            id="asked"
            className="field mono"
            inputMode="decimal"
            placeholder="ex.: 140"
            value={asked}
            onChange={(e) => { setAsked(e.target.value); setSaved(false); }}
          />

          {price && (
            <Verdict
              price={price}
              asked={validAsked ? askedNum : null}
              productLabel={`${product.name} ${product.variant}`}
              margin={settings.targetMargin}
            />
          )}

          {validAsked && (
            <div className="actions">
              <button className="btn primary" onClick={bought}>Comprei por {money(askedNum as number)}</button>
              <button className="btn ghost" onClick={saveObservation} disabled={saved}>
                {saved ? "Guardado" : "Guardar este preço"}
              </button>
            </div>
          )}
          <SourceNote />
        </>
      )}
    </section>
  );
}
