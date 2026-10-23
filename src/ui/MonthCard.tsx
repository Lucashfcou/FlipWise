import { daysHeld } from "../domain/profit";
import { monthlySummary } from "../domain/profit";
import { money, today } from "../format";
import { t } from "../i18n";
import { useApp } from "../state";

/** Resumo do mês no topo do início. Só aparece quando já há itens guardados; sem eles o início fica só com a ação e as categorias. */
export function MonthCard({ goProfit }: { goProfit: () => void }) {
  const { stock, settings } = useApp();
  if (stock.length === 0) return null;
  const m = monthlySummary(stock, today().slice(0, 7));
  const parked = stock.filter((i) => !i.sale && daysHeld(i) >= settings.staleDays).length;
  const month = new Date().toLocaleString(settings.lang === "pt" ? "pt-PT" : "en-GB", { month: "long" });
  return (
    <div className="monthcard">
      <div className="row">
        <span className="label">{t("home.month", { month })}</span>
        <button className="linkbtn" onClick={goProfit}>{t("home.seeProfit")}</button>
      </div>
      <div className="monthprofit">
        <span className={`mono ${m.profit >= 0 ? "gain" : "loss"}`}>{m.profit > 0 ? "+" : ""}{money(m.profit)}</span>
        <small>{t("home.profit")}</small>
      </div>
      <div className="monthstats">
        <span><b>{m.sold}</b> {t("home.sold")}</span>
        <span><b>{m.unsold}</b> {t("home.inStock")}</span>
        {parked > 0 && <span className="warnText"><b>{parked}</b> {t("home.parked")}</span>}
      </div>
    </div>
  );
}
