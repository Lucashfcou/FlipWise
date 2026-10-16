import { useMemo, useState } from "react";
import { findProduct } from "../domain/catalog";
import { daysHeld, itemProfit, monthlySummary } from "../domain/profit";
import { money, pct } from "../format";
import { useApp } from "../state";

export function Vendas() {
  const { stock } = useApp();
  const months = useMemo(() => {
    const set = new Set<string>([new Date().toISOString().slice(0, 7)]);
    stock.forEach((i) => i.sale && set.add(i.sale.date.slice(0, 7)));
    return [...set].sort().reverse();
  }, [stock]);
  const [month, setMonth] = useState(months[0]);
  const summary = monthlySummary(stock, month);
  const sold = stock.filter((i) => i.sale && i.sale.date.startsWith(month));

  const byPlatform = useMemo(() => {
    const m = new Map<string, { n: number; profit: number }>();
    sold.forEach((i) => {
      const k = i.sale!.platform;
      const cur = m.get(k) ?? { n: 0, profit: 0 };
      m.set(k, { n: cur.n + 1, profit: cur.profit + (itemProfit(i)?.profit ?? 0) });
    });
    return [...m.entries()].sort((a, b) => b[1].profit - a[1].profit);
  }, [sold]);

  return (
    <section>
      <h1>Vendas e lucro</h1>
      <select className="field" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Mês">
        {months.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <div className="kpis">
        <div className="kpi"><span className="label">Lucro</span><span className={`mono big ${summary.profit >= 0 ? "gain" : "loss"}`}>{money(summary.profit)}</span></div>
        <div className="kpi"><span className="label">Vendidos</span><span className="mono big">{summary.sold}</span></div>
        <div className="kpi"><span className="label">Faturado</span><span className="mono big">{money(summary.revenue)}</span></div>
        <div className="kpi"><span className="label">Dias até vender</span><span className="mono big">{summary.avgDays}</span></div>
      </div>

      {byPlatform.length > 0 && (
        <>
          <h2>Por plataforma</h2>
          <ul className="plain">
            {byPlatform.map(([name, v]) => (
              <li key={name} className="row"><span>{name}</span><span className="mono">{v.n}× · {money(v.profit)}</span></li>
            ))}
          </ul>
        </>
      )}

      <h2>Vendas do mês</h2>
      {sold.length === 0 && <p className="empty">Ainda sem vendas neste mês.</p>}
      <ul className="cards">
        {sold.map((i) => {
          const r = itemProfit(i)!;
          const p = findProduct(i.productId);
          return (
            <li key={i.id} className="stockcard">
              <div className="row">
                <strong>{p?.name} <small>{p?.variant}</small></strong>
                <span className={`mono ${r.profit >= 0 ? "gain" : "loss"}`}>{r.profit >= 0 ? "+" : ""}{money(r.profit)}</span>
              </div>
              <div className="stats mono">
                <span>{i.sale!.platform}</span>
                <span>margem {pct(r.margin)}</span>
                <span>{daysHeld(i)} dias</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
