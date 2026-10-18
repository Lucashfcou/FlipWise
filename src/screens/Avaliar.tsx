import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_LABEL, CONDITIONS, PRODUCTS, findProduct, productLabel } from "../domain/catalog";
import type { Category, Condition } from "../domain/types";
import { pop, stagger, useFx } from "../fx";
import { t } from "../i18n";
import { money, today } from "../format";
import { useApp } from "../state";
import { Lote } from "./Lote";
import { Print } from "./Print";
import type { PrintPick } from "./Print";
import { SourceNote } from "../ui/SourceNote";
import { Verdict, decide } from "../ui/Verdict";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

export function Avaliar({ goStock }: { goStock: () => void }) {
  const { priceFor, settings, contribute, addStock, recent, pushRecent } = useApp();
  const [mode, setMode] = useState<"item" | "lote">("item");
  const [category, setCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [condition, setCondition] = useState<Condition>("B");
  const [asked, setAsked] = useState("");
  const [saved, setSaved] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const chosenRef = useRef<HTMLDivElement>(null);
  const verdictRef = useRef<HTMLDivElement>(null);

  const searching = query.trim().length > 0;
  const list = useMemo(() => {
    if (searching) {
      const q = query.toLowerCase();
      return PRODUCTS.filter((p) => `${p.name} ${p.variant} ${productLabel(p)}`.toLowerCase().includes(q));
    }
    return category ? PRODUCTS.filter((p) => p.category === category) : [];
  }, [category, query, searching]);

  // A lista abre em onda; o produto escolhido salta ao entrar.
  useFx(listRef, (root) => stagger([...root.children], 8, 22), [category, query]);
  useFx(chosenRef, (el) => pop(el, 1.02), [productId]);

  const product = productId ? findProduct(productId)! : null;
  const askedNum = asked === "" ? null : Number(asked.replace(",", "."));
  const validAsked = askedNum !== null && Number.isFinite(askedNum) && askedNum > 0;
  const price = product ? priceFor(product.id, condition) : null;
  const decision = price ? decide(price, validAsked ? askedNum : null) : null;

  // Com o teclado aberto o resultado ficava fora do ecrã: traz-o para a vista quando o preço passa a ser válido.
  useEffect(() => {
    if (validAsked) verdictRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [validAsked]);

  function pick(id: string) {
    const p = findProduct(id)!;
    pushRecent(id);
    setProductId(id);
    const conds = CONDITIONS[p.category];
    setCondition(conds[Math.min(1, conds.length - 1)].id);
    setQuery("");
    setSaved(false);
  }

  function usePrint(p: PrintPick) {
    pushRecent(p.productId);
    setProductId(p.productId);
    setCondition(p.condition);
    setAsked(p.price ? String(p.price) : "");
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
      <h1>{t("eval.title")}</h1>
      <div className="seg" role="group" aria-label={t("eval.modeAria")}>
        <button aria-pressed={mode === "item"} onClick={() => setMode("item")}>{t("eval.one")}</button>
        <button aria-pressed={mode === "lote"} onClick={() => setMode("lote")}>{t("eval.lot")}</button>
      </div>

      {mode === "lote" ? (
        <Lote goStock={goStock} />
      ) : !product ? (
        <>
          <input
            className="field"
            type="search"
            placeholder={t("eval.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t("eval.searchAria")}
          />

          {!searching && recent.length > 0 && (
            <div className="recent">
              <span className="label">{t("eval.recent")}</span>
              <div className="chips">
                {recent.map((id) => {
                  const rp = findProduct(id);
                  return rp ? (
                    <button key={id} className="chip" onClick={() => pick(id)}>{productLabel(rp)}</button>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {!searching && (
            <div className="tiles" role="group" aria-label={t("eval.categoryAria")}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  aria-pressed={c === category}
                  className={c === category ? "tile on" : "tile"}
                  onClick={() => setCategory(c === category ? null : c)}
                >
                  <strong>{CATEGORY_LABEL[c]}</strong>
                  <small>{t("eval.products", { n: PRODUCTS.filter((p) => p.category === c).length })}</small>
                </button>
              ))}
            </div>
          )}

          {(searching || category) && (
            <ul className="picklist" ref={listRef}>
              {list.map((p) => (
                <li key={p.id}>
                  <button className="pick" onClick={() => pick(p.id)}>
                    <span>{p.name}</span>
                    <small>{productLabel({ name: "", variant: p.variant }).trim()}</small>
                  </button>
                </li>
              ))}
              {list.length === 0 && <li className="empty">{t("eval.none")}</li>}
            </ul>
          )}
          {!searching && !category && <p className="hint">{t("eval.pick")}</p>}
          {!searching && <Print onUse={usePrint} />}
        </>
      ) : (
        <>
          <div className="chosen" ref={chosenRef}>
            <div>
              <small>{t("eval.product")}</small>
              <strong>{productLabel(product)}</strong>
            </div>
            <button className="btn ghost" onClick={reset}>{t("eval.change")}</button>
          </div>

          <span className="label">{t("eval.condition")}</span>
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

          <label className="label" htmlFor="asked">{t("eval.price")}</label>
          <input
            id="asked"
            className="field mono"
            inputMode="decimal"
            placeholder={t("eval.pricePh")}
            value={asked}
            onChange={(e) => { setAsked(e.target.value); setSaved(false); }}
          />

          {price && (
            <div ref={verdictRef}>
            <Verdict
              price={price}
              asked={validAsked ? askedNum : null}
              productLabel={productLabel(product)}
              margin={settings.targetMargin}
            />
            </div>
          )}

          {validAsked && (
            <div className="actions">
              <button className={decision && decision.light !== "go" ? "btn ghost" : "btn primary"} onClick={bought}>{t("eval.bought", { price: money(askedNum as number) })}</button>
              <button className="btn ghost" onClick={saveObservation} disabled={saved}>
                {saved ? t("eval.saved") : t("eval.save")}
              </button>
            </div>
          )}
          <SourceNote />
        </>
      )}
    </section>
  );
}
