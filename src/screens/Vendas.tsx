import { useMemo, useState } from "react";
import { findProduct } from "../domain/catalog";
import { accuracy, daysHeld, itemProfit, monthlySummary } from "../domain/profit";
import { money, pct } from "../format";
import { salesCsv, taxSummary, THRESHOLDS } from "../domain/tax";
import { useApp } from "../state";

const STATUS_TEXT = { ok: "dentro do limite", perto: "perto do limite", acima: "acima do limite" } as const;

function Fiscal({ year }: { year: string }) {
  const { stock } = useApp();
  const s = taxSummary(stock, year);
  const [copied, setCopied] = useState(false);
  const csv = salesCsv(stock, year);

  function save() {
    try {
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `garimpo-vendas-${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* sem permissão para guardar ficheiros: usa Copiar */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <h2>Fiscal {year}</h2>
      <div className="panel">
        <div className="two">
          <div><span className="label">Faturado</span><span className="mono big">{money(s.revenue)}</span></div>
          <div><span className="label">Lucro</span><span className={`mono big ${s.profit >= 0 ? "gain" : "loss"}`}>{money(s.profit)}</span></div>
        </div>
        <p className="hint">{s.sales} vendas no ano. Investido nas peças vendidas: {money(s.invested)}.</p>
        {s.platforms.length > 0 && (
          <ul className="plain">
            {s.platforms.map((p) => (
              <li key={p.platform} className="row">
                <span>{p.platform}</span>
                <span className="mono">
                  {p.count}/{THRESHOLDS.count} vendas · {money(p.revenue)}/{money(THRESHOLDS.revenue)}
                  <span className={`chip ${p.status === "ok" ? "" : "on"}`}>{STATUS_TEXT[p.status]}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="hint">
          Referência informativa: na UE, as plataformas comunicam ao fisco quem faz 30 ou mais vendas, ou 2000 € ou mais, num ano
          (regra DAC7). Confirma os limites atuais e o que se aplica a ti com um contabilista. Isto não é aconselhamento fiscal.
        </p>
        <div className="actions">
          <button className="btn primary" onClick={save} disabled={s.sales === 0}>Exportar CSV</button>
          <button className="btn ghost" onClick={copy} disabled={s.sales === 0}>{copied ? "Copiado" : "Copiar CSV"}</button>
        </div>
      </div>
    </>
  );
}

export function Vendas() {
  const { stock } = useApp();
  const months = useMemo(() => {
    const set = new Set<string>([new Date().toISOString().slice(0, 7)]);
    stock.forEach((i) => i.sale && set.add(i.sale.date.slice(0, 7)));
    return [...set].sort().reverse();
  }, [stock]);
  const [month, setMonth] = useState(months[0]);
  const summary = monthlySummary(stock, month);
  const acc = accuracy(stock);
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

      <div className="panel proof">
        <span className="label">O app acertou?</span>
        {acc.total === 0 ? (
          <p className="hint">Aparece depois da primeira venda de um artigo comprado pela aba Avaliar.</p>
        ) : (
          <>
            <span className="big mono">{acc.hits} de {acc.total}</span>
            <p className="hint">vendas ficaram a menos de 15% do preço típico indicado na compra. Meta: 7 em cada 10.</p>
          </>
        )}
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

      <Fiscal year={month.slice(0, 4)} />

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
