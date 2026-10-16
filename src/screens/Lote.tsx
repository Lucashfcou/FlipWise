import { useMemo, useState } from "react";
import { CONDITIONS, PRODUCTS, findProduct } from "../domain/catalog";
import { allocateCost, evaluateBundle } from "../domain/bundle";
import type { BundleLine } from "../domain/bundle";
import type { Condition } from "../domain/types";
import { money, today } from "../format";
import { useApp } from "../state";

export function Lote({ goStock }: { goStock: () => void }) {
  const { priceFor, settings, addStockMany } = useApp();
  const [lines, setLines] = useState<BundleLine[]>([]);
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [condition, setCondition] = useState<Condition>("B");
  const [qty, setQty] = useState("1");
  const [asked, setAsked] = useState("");

  const product = findProduct(productId)!;
  const askedNum = asked === "" ? null : Number(asked.replace(",", "."));
  const validAsked = askedNum !== null && Number.isFinite(askedNum) && askedNum > 0;
  const r = useMemo(() => evaluateBundle(lines, priceFor, settings, validAsked ? askedNum : null), [lines, priceFor, settings, askedNum, validAsked]);

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
      <p className="hint">Junta as peças do lote e o preço pedido. O app soma o que cada uma vale e diz se compensa vender junto ou separado.</p>

      <div className="panel">
        <label className="label" htmlFor="lp">Peça</label>
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
            <option key={p.id} value={p.id}>{p.name} {p.variant}</option>
          ))}
        </select>
        <div className="two">
          <div>
            <label className="label" htmlFor="lc">Estado</label>
            <select id="lc" className="field" value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
              {CONDITIONS[product.category].map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lq">Quantidade</label>
            <input id="lq" className="field mono" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
        </div>
        <div className="actions">
          <button className="btn accent" onClick={add}>Adicionar ao lote</button>
        </div>
      </div>

      {lines.length === 0 ? (
        <p className="empty">Ainda sem peças. Adiciona a primeira acima.</p>
      ) : (
        <ul className="plain">
          {r.items.map((it, idx) => (
            <li key={idx} className="row">
              <span>
                {lines[idx].qty}× {it.label} <small>({lines[idx].condition})</small>
                {!it.found && <small> · sem preço</small>}
              </span>
              <span className="mono">
                {it.found ? money(it.price.typical * lines[idx].qty) : "–"}
                <button className="chip" aria-label="Remover" onClick={() => setLines((p) => p.filter((_, i) => i !== idx))}>×</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <label className="label" htmlFor="la">Preço pedido pelo lote (€)</label>
      <input id="la" className="field mono" inputMode="decimal" placeholder="ex.: 180" value={asked} onChange={(e) => setAsked(e.target.value)} />

      {r.pricedUnits > 0 && (
        <div className={`verdict ${r.decision?.light ?? ""}`} aria-live="polite">
          <div className="ticket-head">
            <span className="label">Lote: paga no máximo</span>
            <span className="conf media">{r.pricedUnits} de {r.totalUnits} peças com preço</span>
          </div>
          <div className="typical">
            <span className="num">{money(r.maxBuy)}</span>
            <span className="sub">revenda estimada das peças {money(r.sumTypical)}</span>
          </div>
          {r.decision && (
            <div className="decision">
              <strong>{r.decision.title}</strong>
              <span>{r.decision.text}</span>
            </div>
          )}
          <div className="facts">
            <div>
              <span className="label">Vender separado ({r.separate.sales} vendas)</span>
              <span className="mono">líquido {money(r.separate.net)}</span>
            </div>
            <div>
              <span className="label">Vender junto (1 venda)</span>
              <span className="mono">líquido {money(r.together.net)}</span>
            </div>
          </div>
          <p className="hint">
            Melhor: {r.best === "junto" ? "tudo junto" : "peça a peça"}. Vender junto assume 10% de desconto sobre a soma, hipótese
            ainda por confirmar com as tuas vendas. O líquido já desconta envio e destaque por venda.
            {r.missingUnits > 0 && ` ${r.missingUnits} peça(s) sem preço no catálogo ficaram fora da soma: o valor real pode ser maior.`}
          </p>
        </div>
      )}

      {validAsked && lines.length > 0 && (
        <div className="actions">
          <button className="btn primary" onClick={bought}>Comprei o lote por {money(askedNum as number)}</button>
        </div>
      )}
      {validAsked && lines.length > 0 && <p className="hint">O custo é repartido pelas peças, em proporção ao valor de cada uma.</p>}
    </div>
  );
}
