import { MARKET_DATE } from "../data/market";
import { useApp } from "../state";

/** Diz de onde vêm os preços. Só lista fontes que realmente estão nos dados. */
export function SourceNote() {
  const { observations } = useApp();
  const sources = [...new Set(observations.filter((o) => o.source !== "eu").map((o) => o.source))];
  const mine = observations.filter((o) => o.source === "eu").length;
  return (
    <p className="note" role="note">
      Preços baseados em <strong>{sources.join(", ")}</strong> (recolhidos a {MARKET_DATE})
      {mine > 0 ? ` e em ${mine} registos teus` : ""}. Sem vendas reais, o preço típico é uma estimativa entre o que a
      loja paga e o que vende.
    </p>
  );
}
