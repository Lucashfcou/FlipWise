import { useRef, useState } from "react";
import { CONDITIONS, PRODUCTS, conditionShort, findProduct, productLabel } from "../domain/catalog";
import { buildListing } from "../domain/listing";
import { daysHeld } from "../domain/profit";
import { parkedCapital, staleAdvice } from "../domain/stale";
import type { Condition, StockItem } from "../domain/types";
import { stagger, useFx } from "../fx";
import { t } from "../i18n";
import { money, today } from "../format";
import { useApp } from "../state";

const PLATFORMS: { value: string; label: () => string }[] = [
  { value: "Vinted", label: () => "Vinted" },
  { value: "OLX", label: () => "OLX" },
  { value: "Wallapop", label: () => "Wallapop" },
  { value: "Facebook", label: () => "Facebook" },
  { value: "Presencial", label: () => t("platform.inPerson") },
  { value: "Outra", label: () => t("platform.other") },
];

function AddForm({ onDone }: { onDone: () => void }) {
  const { addStock } = useApp();
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const product = findProduct(productId)!;
  const [condition, setCondition] = useState<Condition>("B");
  const [cost, setCost] = useState("");
  const [extra, setExtra] = useState("");
  const [where, setWhere] = useState(t("stock.whereDefault"));

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
      <label className="label" htmlFor="p">{t("stock.product")}</label>
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
          <option key={p.id} value={p.id}>{productLabel(p)}</option>
        ))}
      </select>
      <label className="label" htmlFor="c">{t("stock.condition")}</label>
      <select id="c" className="field" value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
        {CONDITIONS[product.category].map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </select>
      <div className="two">
        <div>
          <label className="label" htmlFor="cost">{t("stock.cost")}</label>
          <input id="cost" className="field mono" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="extra">{t("stock.extras")}</label>
          <input id="extra" className="field mono" inputMode="decimal" placeholder={t("stock.extrasPh")} value={extra} onChange={(e) => setExtra(e.target.value)} />
        </div>
      </div>
      <label className="label" htmlFor="w">{t("stock.where")}</label>
      <input id="w" className="field" value={where} onChange={(e) => setWhere(e.target.value)} />
      <div className="actions">
        <button className="btn primary" type="submit" disabled={!ok}>{t("stock.addBtn")}</button>
        <button className="btn ghost" type="button" onClick={onDone}>{t("stock.cancel")}</button>
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
          <label className="label" htmlFor={`sp-${item.id}`}>{t("stock.soldPrice")}</label>
          <input id={`sp-${item.id}`} className="field mono" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label" htmlFor={`ss-${item.id}`}>{t("stock.shipPaid")}</label>
          <input id={`ss-${item.id}`} className="field mono" inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value)} />
        </div>
      </div>
      <label className="label" htmlFor={`sl-${item.id}`}>{t("stock.platform")}</label>
      <select id={`sl-${item.id}`} className="field" value={platform} onChange={(e) => setPlatform(e.target.value)}>
        {PLATFORMS.map((p) => (
          <option key={p.value} value={p.value}>{p.label()}</option>
        ))}
      </select>
      <div className="actions">
        <button className="btn primary" type="submit" disabled={!ok}>{t("stock.markSold")}</button>
        <button className="btn ghost" type="button" onClick={onDone}>{t("stock.cancel")}</button>
      </div>
    </form>
  );
}

function ListingPanel({ item }: { item: StockItem }) {
  const { priceFor } = useApp();
  const price = priceFor(item.productId, item.condition);
  const quick = price.count ? Math.round(price.typical * 0.95) : Math.round(item.cost * 1.3);
  const best = price.count ? Math.round(price.high) : Math.round(item.cost * 1.6);
  const [chosen, setChosen] = useState(price.count ? Math.round(price.typical) : quick);
  const [copied, setCopied] = useState(false);
  const l = buildListing(item.productId, item.condition, chosen);
  const text = `${l.title}\n\n${l.body}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="sell">
      <span className="label">{t("stock.listPrice")}</span>
      <div className="chips">
        <button className={chosen === quick ? "chip on" : "chip"} onClick={() => setChosen(quick)}>{t("stock.quick", { price: money(quick) })}</button>
        <button className={chosen === Math.round(price.typical) ? "chip on" : "chip"} onClick={() => setChosen(Math.round(price.typical))} disabled={!price.count}>{t("stock.typical", { price: money(price.typical) })}</button>
        <button className={chosen === best ? "chip on" : "chip"} onClick={() => setChosen(best)}>{t("stock.max", { price: money(best) })}</button>
      </div>
      <label className="label" htmlFor={`lt-${item.id}`}>{t("stock.listText")}</label>
      <textarea id={`lt-${item.id}`} className="field" rows={7} readOnly value={text} onFocus={(e) => e.currentTarget.select()} />
      <div className="actions">
        <button className="btn primary" onClick={copy}>{copied ? t("stock.copied") : t("stock.copy")}</button>
      </div>
    </div>
  );
}

export function Stock() {
  const { stock, removeStock, priceFor, settings } = useApp();
  const [adding, setAdding] = useState(false);
  const [selling, setSelling] = useState<string | null>(null);
  const [listing, setListing] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const open = stock.filter((i) => !i.sale);
  const parked = parkedCapital(stock);
  const staleCount = open.filter((i) => staleAdvice(i, priceFor(i.productId, i.condition), settings).stale).length;

  useFx(listRef, (root) => stagger([...root.children], 10, 40, 120), [open.length]);

  return (
    <section>
      <h1>{t("stock.title")}</h1>
      {adding ? (
        <AddForm onDone={() => setAdding(false)} />
      ) : (
        <button className="btn primary wide" onClick={() => setAdding(true)}>{t("stock.add")}</button>
      )}

      {open.length > 0 && (
        <div className="kpis">
          <div className="kpi"><span className="label">{t("stock.parked")}</span><span className="big mono">{money(parked.capital)}</span></div>
          <div className="kpi"><span className="label">{t("stock.stale", { days: settings.staleDays })}</span><span className={`big mono ${staleCount ? "loss" : ""}`}>{t("stock.ofTotal", { n: staleCount, total: parked.count })}</span></div>
        </div>
      )}

      {open.length === 0 && !adding && <p className="empty">{t("stock.empty")}</p>}

      <ul className="cards" ref={listRef}>
        {open.map((i) => {
          const p = findProduct(i.productId);
          const price = priceFor(i.productId, i.condition);
          const days = daysHeld(i);
          const potential = price.count ? price.typical - i.cost - i.extraCosts : null;
          const advice = staleAdvice(i, price, settings);
          return (
            <li key={i.id} className="stockcard">
              <div className="row">
                <strong>{p ? productLabel(p) : i.productId}</strong>
                <span className="chip">{p ? conditionShort(p.category, i.condition) : i.condition}</span>
              </div>
              <div className="stats mono">
                <span>{t("stock.costLine", { price: money(i.cost + i.extraCosts) })}</span>
                <span>{days === 1 ? t("stock.day") : t("stock.days", { n: days })}</span>
                {potential !== null && (
                  <span className={potential >= 0 ? "gain" : "loss"}>
                    {t("stock.potential", { sign: potential >= 0 ? "+" : "", price: money(potential) })}
                  </span>
                )}
              </div>
              {advice.stale && (
                <p className="stale">
                  {advice.atBreakEven
                    ? t("stock.adviceBreak", { days: advice.days, price: money(advice.suggested) })
                    : t("stock.advice", { days: advice.days, price: money(advice.suggested), profit: money(advice.profit) })}
                </p>
              )}
              {listing === i.id && <ListingPanel item={i} />}
              {selling === i.id ? (
                <SellForm item={i} onDone={() => setSelling(null)} />
              ) : (
                <div className="actions">
                  <button className="btn accent" onClick={() => setSelling(i.id)}>{t("stock.sold")}</button>
                  <button className="btn ghost" onClick={() => setListing(listing === i.id ? null : i.id)}>
                    {listing === i.id ? t("stock.closeList") : t("stock.list")}
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => {
                      if (confirm(t("stock.removeConfirm"))) removeStock(i.id);
                    }}
                  >
                    {t("stock.remove")}
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
