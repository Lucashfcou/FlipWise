import { useState } from "react";
import { CONDITIONS, PRODUCTS, findProduct } from "../domain/catalog";
import { daysHeld } from "../domain/profit";
import type { Condition, StockItem } from "../domain/types";
import { money, today } from "../format";
import { useApp } from "../state";

function AddForm({ onDone }: { onDone: () => void }) {
  const { addStock } = useApp();
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const product = findProduct(productId)!;
  const [condition, setCondition] = useState<Condition>("B");
  const [cost, setCost] = useState("");
  const [extra, setExtra] = useState("");
  const [where, setWhere] = useState("Feira");

  const costNum = Number(cost.replace(",", "."));
  const ok = Number.isFinite(costNum) && costNum > 0;

  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        addStock({
          productId,
          condition,
          cost: costNum,
          extraCosts: Number(extra.replace(",", ".")) || 0,
          boughtAt: where,
          boughtDate: today(),
        });
        onDone();
      }}
    >
      <label className="label" htmlFor="p">Produto</label>
      <select
        id="p"
        className="field"
        value={productId}
        onChange={(e) => {
          setProductId(e.target.value);
          const p = findProduct(e.target.value)!;
          setCondition(CONDITIONS[p.category][0].id);
        }}
      >
        {PRODUCTS.map((p) => (
          <option key={p.id} value={p.id}>{p.name} {p.variant}</option>
        ))}
      </select>
      <label className="label" htmlFor="c">Estado</label>
      <select id="c" className="field" value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
        {CONDITIONS[product.category].map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </select>
      <div className="two">
        <div>
          <label className="label" htmlFor="cost">Custo (€)</label>
          <input id="cost" className="field mono" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="extra">Extras (€)</label>
          <input id="extra" className="field mono" inputMode="decimal" placeholder="reparo, envio de compra" value={extra} onChange={(e) => setExtra(e.target.value)} />
        </div>
      </div>
      <label className="label" htmlFor="w">Onde compraste</label>
      <input id="w" className="field" value={where} onChange={(e) => setWhere(e.target.value)} />
      <div className="actions">
        <button className="btn primary" type="submit" disabled={!ok}>Adicionar ao stock</button>
        <button className="btn ghost" type="button" onClick={onDone}>Cancelar</button>
      </div>
    </form>
  );
}

function SellForm({ item, onDone }: { item: StockItem; onDone: () => void }) {
  const { sellStock, settings } = useApp();
  const [price, setPrice] = useState("");
  const [platform, setPlatform] = useState("Vinted");
  const [shipping, setShipping] = useState(String(settings.shipping));
  const priceNum = Number(price.replace(",", "."));
  const ok = Number.isFinite(priceNum) && priceNum > 0;
  return (
    <form
      className="sell"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        sellStock(item.id, { price: priceNum, platform, shipping: Number(shipping.replace(",", ".")) || 0, date: today() });
        onDone();
      }}
    >
      <div className="two">
        <div>
          <label className="label" htmlFor={`sp-${item.id}`}>Vendido por (€)</label>
          <input id={`sp-${item.id}`} className="field mono" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label" htmlFor={`ss-${item.id}`}>Envio pago (€)</label>
          <input id={`ss-${item.id}`} className="field mono" inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value)} />
        </div>
      </div>
      <label className="label" htmlFor={`sl-${item.id}`}>Plataforma</label>
      <select id={`sl-${item.id}`} className="field" value={platform} onChange={(e) => setPlatform(e.target.value)}>
        {["Vinted", "OLX", "Wallapop", "Facebook", "Presencial", "Outra"].map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      <div className="actions">
        <button className="btn primary" type="submit" disabled={!ok}>Marcar vendido</button>
        <button className="btn ghost" type="button" onClick={onDone}>Cancelar</button>
      </div>
    </form>
  );
}

export function Stock() {
  const { stock, removeStock, priceFor } = useApp();
  const [adding, setAdding] = useState(false);
  const [selling, setSelling] = useState<string | null>(null);
  const open = stock.filter((i) => !i.sale);

  return (
    <section>
      <h1>Stock</h1>
      {adding ? (
        <AddForm onDone={() => setAdding(false)} />
      ) : (
        <button className="btn primary wide" onClick={() => setAdding(true)}>+ Adicionar item</button>
      )}

      {open.length === 0 && !adding && <p className="empty">Nada em stock. Avalia um artigo e toca em “Comprei”.</p>}

      <ul className="cards">
        {open.map((i) => {
          const p = findProduct(i.productId);
          const price = priceFor(i.productId, i.condition);
          const days = daysHeld(i);
          const potential = price.count ? price.typical - i.cost - i.extraCosts : null;
          return (
            <li key={i.id} className="stockcard">
              <div className="row">
                <strong>{p?.name} <small>{p?.variant}</small></strong>
                <span className="chip">{i.condition}</span>
              </div>
              <div className="stats mono">
                <span>custo {money(i.cost + i.extraCosts)}</span>
                <span>{days} {days === 1 ? "dia" : "dias"}</span>
                {potential !== null && (
                  <span className={potential >= 0 ? "gain" : "loss"}>
                    potencial {potential >= 0 ? "+" : ""}{money(potential)}
                  </span>
                )}
              </div>
              {selling === i.id ? (
                <SellForm item={i} onDone={() => setSelling(null)} />
              ) : (
                <div className="actions">
                  <button className="btn accent" onClick={() => setSelling(i.id)}>Vendi</button>
                  <button
                    className="btn ghost"
                    onClick={() => {
                      if (confirm("Remover este item do stock?")) removeStock(i.id);
                    }}
                  >
                    Remover
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
