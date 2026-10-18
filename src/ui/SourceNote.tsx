import { MARKET_DATE } from "../data/market";
import { t } from "../i18n";
import { useApp } from "../state";

/** Diz de onde vêm os preços. Só lista fontes que realmente estão nos dados. */
export function SourceNote() {
  const { observations } = useApp();
  const sources = [...new Set(observations.filter((o) => o.source !== "eu").map((o) => o.source))];
  const mine = observations.filter((o) => o.source === "eu").length;
  return (
    <p className="note" role="note">
      {t("source.note", {
        sources: sources.join(", "),
        date: MARKET_DATE,
        mine: mine > 0 ? t("source.mine", { n: mine }) : "",
      })}
    </p>
  );
}
