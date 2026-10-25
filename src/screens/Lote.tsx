import { useMemo, useState } from "react";
import { CONDITIONS, PRODUCTS, conditionShort, findProduct, productLabel } from "../domain/catalog";
import { allocateCost, evaluateBundle } from "../domain/bundle";
import type { BundleLine } from "../domain/bundle";
import type { Condition } from "../domain/types";
import { t } from "../i18n";
import { money, today } from "../format";
import { useApp } from "../state";

/** Lote vindo do print: linhas já lidas, preço total pedido e os artigos que ficaram sem preço. */
export interface LotSeed {
  lines: BundleLine[];
  asked: number | null;
  skipped: string[];
  /** Unidades lidas do print que ficaram sem preço (não entram na soma). */
  skippedUnits: number;
}

export function Lote({ goStock, seed }: { goStock: () => void; seed?: LotSeed }) {
  const { priceFor, settings, addStockMany } = useApp();
  const [lines, setLines] = useState<BundleLine[]>(seed?.lines ?? []);
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [condition, setCondition] = useState<Condition>("B");
  const [qty, setQty] = useState("1");
  const [asked, setAsked] = useState(seed?.asked ? String(seed.asked) : "");

  const product = findProduct(productId)!;
  const askedNum = asked === "" ? null : Number(asked.replace(",", "."));
  const validAsked = askedNum !== null && Number.isFinite(askedNum) && askedNum > 0;
  const r = useMemo(() => evaluateBundle(lines, priceFor, settings, validAsked ? askedNum : null, seed?.skippedUnits ?? 0), [lines, priceFor, settings, askedNum, validAsked, seed]);

  function add() {
    const q = Math.max(1, Math.min(50, Math.round(Number(qty) || 1)));
    setLines((prev) => [...prev, { productId, condition, qty: q }]);
    setQty("1");
  }

  function bought() {
    if (!validAsked) return;
    const costs = allocateCost(lines, r.items, askedNum as number);
    const items: Parameters<typeof addStockMany>[0] = [];
    let n = 0;
    r.items.forEach((it, idx) => {
      const q = Math.max(1, Math.round(lines[idx].qty));
      for (let k = 0; k < q; k++) {
        // Artigo fora do catálogo não entra no stock (ainda): a conta do custo já o conta, só não é guardado.
        if (lines[idx].custom) { n++; continue; }
        items.push({
          productId: lines[idx].productId,
          condition: lines[idx].condition,
          cost: costs[n++],
          extraCosts: 0,
          boughtAt: "lote",
          boughtDate: today(),
          estimate: it.found ? it.price.typical : undefined,
        });
      }
    });
    addStockMany(items);
    goStock();
  }

  return (
    <div>
      {seed ? <p className="note">{t("lot.fromPrint")}</p> : <p className="hint">{t("lot.intro")}</p>}
      {seed && seed.skipped.length > 0 && <p className="hint">{t("lot.skipped", { list: seed.skipped.join(", ") })}</p>}

      <details className="panel" open={!seed}>
        <summary>{t("lot.addPiece")}</summary>
        <label className="label" htmlFor="lp">{t("lot.piece")}</label>
        <select
          id="lp"
          className="field"
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            setCondition(CONDITIONS[findProduct(e.target.value)!.category][0].id);
          }}
        >
          {PRODUCTS.map((p) => (
            <option key={p.id} value={p.id}>{productLabel(p)}</option>
          ))}
        </select>
        <div className="two">
          <div>
            <label className="label" htmlFor="lc">{t("lot.condition")}</label>
            <select id="lc" className="field" value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
              {CONDITIONS[product.category].map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lq">{t("lot.qty")}</label>
            <input id="lq" className="field mono" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
        </div>
        <div className="actions">
          <button className="btn accent" onClick={add}>{t("lot.add")}</button>
        </div>
      </details>

      {lines.length === 0 ? (
        <p className="empty">{t("lot.empty")}</p>
      ) : (
        <ul className="plain">
          {r.items.map((it, idx) => (
            <li key={idx} className="row">
              <span>
                {lines[idx].qty}× {it.label}{!lines[idx].custom && findProduct(lines[idx].productId) && <small> ({conditionShort(findProduct(lines[idx].productId)!.category, lines[idx].condition)})</small>}
                {!it.found && <small> · {t("lot.noPrice")}</small>}
              </span>
              <span className="mono">
                {it.found ? money(it.price.typical * lines[idx].qty) : "–"}
                <button className="chip" aria-label={t("lot.remove")} onClick={() => setLines((p) => p.filter((_, i) => i !== idx))}>×</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <label className="label" htmlFor="la">{t("lot.ask")}</label>
      <input id="la" className="field mono" inputMode="decimal" placeholder={t("lot.askPh")} value={asked} onChange={(e) => setAsked(e.target.value)} />

      {r.pricedUnits > 0 && (
        <div className={`verdict ${r.decision?.light ?? ""}`} aria-live="polite">
          <div className="ticket-head">
            <span className="label">{t("lot.payMax")}</span>
            <span className="conf media">{t("lot.priced", { n: r.pricedUnits, total: r.totalUnits + (seed?.skippedUnits ?? 0) })}</span>
          </div>
          <div className="typical">
            <span className="num">{money(r.maxBuy)}</span>
            <span className="sub">{t("lot.resale", { price: money(r.sumTypical) })}</span>
          </div>
          {r.decision && (
            <div className="decision">
              <strong>{r.decision.title}</strong>
              <span>{r.decision.text}</span>
            </div>
          )}
          <div className="facts">
            <div>
              <span className="label">{t("lot.separate", { n: r.separate.sales })}</span>
              <span className="mono">{t("lot.net", { price: money(r.separate.net) })}</span>
            </div>
            <div>
              <span className="label">{t("lot.together")}</span>
              <span className="mono">{t("lot.net", { price: money(r.together.net) })}</span>
            </div>
          </div>
          <p className="hint">
            {t("lot.best", { how: r.best === "junto" ? t("lot.bestTogether") : t("lot.bestSeparate") })}
            {t("lot.assumption")}
            {r.missingUnits > 0 && t("lot.missing", { n: r.missingUnits })}
          </p>
        </div>
      )}

      {validAsked && lines.length > 0 && (
        <div className="actions">
          <button className="btn primary" onClick={bought}>{t("lot.bought", { price: money(askedNum as number) })}</button>
        </div>
      )}
      {validAsked && lines.length > 0 && <p className="hint">{t("lot.split")}</p>}
    </div>
  );
}
