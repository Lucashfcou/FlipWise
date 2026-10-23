import { useMemo, useRef, useState } from "react";
import { findProduct, productLabel } from "../domain/catalog";
import { accuracy, daysHeld, itemProfit, monthlySummary } from "../domain/profit";
import { salesCsv, taxSummary, THRESHOLDS } from "../domain/tax";
import { stagger, useFx } from "../fx";
import { t } from "../i18n";
import type { Key } from "../i18n";
import { money, pct } from "../format";
import { useApp } from "../state";

const STATUS_KEY = { ok: "tax.ok", perto: "tax.near", acima: "tax.over" } as const satisfies Record<string, Key>;

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
      a.download = `flipfind-sales-${year}.csv`;
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
      <h2>{t("tax.title", { year })}</h2>
      <div className="panel">
        <div className="two">
          <div><span className="label">{t("tax.revenue")}</span><span className="mono big">{money(s.revenue)}</span></div>
          <div><span className="label">{t("tax.profit")}</span><span className={`mono big ${s.profit >= 0 ? "gain" : "loss"}`}>{money(s.profit)}</span></div>
        </div>
        <p className="hint">{t("tax.salesYear", { n: s.sales, price: money(s.invested) })}</p>
        {s.platforms.length > 0 && (
          <ul className="plain">
            {s.platforms.map((p) => (
              <li key={p.platform} className="row">
                <span>{p.platform}</span>
                <span className="mono">
                  {t("tax.row", { count: p.count, limitCount: THRESHOLDS.count, rev: money(p.revenue), limitRev: money(THRESHOLDS.revenue) })}
                  <span className={`chip ${p.status === "ok" ? "" : "on"}`}>{t(STATUS_KEY[p.status])}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="hint">{t("tax.note")}</p>
        <div className="actions">
          <button className="btn primary" onClick={save} disabled={s.sales === 0}>{t("tax.export")}</button>
          <button className="btn ghost" onClick={copy} disabled={s.sales === 0}>{copied ? t("tax.copied") : t("tax.copy")}</button>
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
  const listRef = useRef<HTMLUListElement>(null);
  useFx(listRef, (root) => stagger([...root.children], 10, 40), [month, sold.length]);

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
      <h1>{t("profit.title")}</h1>
      <select className="field" value={month} onChange={(e) => setMonth(e.target.value)} aria-label={t("profit.month")}>
        {months.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <div className="kpis">
        <div className="kpi"><span className="label">{t("profit.profit")}</span><span className={`mono big ${summary.profit >= 0 ? "gain" : "loss"}`}>{money(summary.profit)}</span></div>
        <div className="kpi"><span className="label">{t("profit.sold")}</span><span className="mono big">{summary.sold}</span></div>
        <div className="kpi"><span className="label">{t("profit.revenue")}</span><span className="mono big">{money(summary.revenue)}</span></div>
        <div className="kpi"><span className="label">{t("profit.days")}</span><span className="mono big">{summary.avgDays}</span></div>
      </div>

      <div className="panel proof">
        <span className="label">{t("profit.right")}</span>
        {acc.total === 0 ? (
          <p className="hint">{t("profit.rightNone")}</p>
        ) : (
          <>
            <span className="big mono">{t("profit.rightCount", { hits: acc.hits, total: acc.total })}</span>
            <p className="hint">{t("profit.rightText")}</p>
          </>
        )}
      </div>

      {byPlatform.length > 0 && (
        <>
          <h2>{t("profit.byPlatform")}</h2>
          <ul className="plain">
            {byPlatform.map(([name, v]) => (
              <li key={name} className="row"><span>{name}</span><span className="mono">{t("profit.platformRow", { n: v.n, price: money(v.profit) })}</span></li>
            ))}
          </ul>
        </>
      )}

      <Fiscal year={month.slice(0, 4)} />

      <h2>{t("profit.monthSales")}</h2>
      {sold.length === 0 && <p className="empty">{t("profit.noSales")}</p>}
      <ul className="cards" ref={listRef}>
        {sold.map((i) => {
          const r = itemProfit(i)!;
          const p = findProduct(i.productId);
          return (
            <li key={i.id} className="stockcard">
              <div className="row">
                <strong>{p ? productLabel(p) : i.productId}</strong>
                <span className={`mono ${r.profit >= 0 ? "gain" : "loss"}`}>{r.profit >= 0 ? "+" : ""}{money(r.profit)}</span>
              </div>
              <div className="stats mono">
                <span>{i.sale!.platform}</span>
                <span>{t("profit.margin", { pct: pct(r.margin) })}</span>
                <span>{t("profit.daysShort", { n: daysHeld(i) })}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
