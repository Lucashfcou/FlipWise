import type { PriceEstimate } from "../domain/types";
import { money, pct } from "../format";

const CONF_LABEL = { alta: "confiança alta", media: "confiança média", baixa: "confiança baixa" } as const;

function light(price: PriceEstimate, asked: number | null): "go" | "maybe" | "stop" | null {
  if (asked === null || !Number.isFinite(asked) || asked <= 0 || price.count === 0) return null;
  if (asked <= price.maxBuy) return "go";
  if (asked <= price.typical) return "maybe";
  return "stop";
}

const LIGHT_TEXT = {
  go: "Bom negócio: abaixo do teu preço máximo.",
  maybe: "Margem apertada: só compensa se negociares.",
  stop: "Caro: acima do preço típico de mercado.",
} as const;

export function Verdict({
  price,
  asked,
  productLabel,
  margin,
}: {
  price: PriceEstimate;
  asked: number | null;
  productLabel: string;
  margin: number;
}) {
  if (price.count === 0) {
    return (
      <div className="verdict empty" aria-live="polite">
        <p>Sem dados para {productLabel} neste estado. Regista preços que vires para ajudar o app a aprender.</p>
      </div>
    );
  }
  const l = light(price, asked);
  return (
    <div className={`verdict ${l ?? ""}`} aria-live="polite">
      <div className="ticket-head">
        <span className="label">Faixa de mercado</span>
        <span className={`conf ${price.confidence}`}>{CONF_LABEL[price.confidence]} · {price.count} obs.</span>
      </div>
      <div className="led" aria-label={`Típico ${money(price.typical)}`}>
        <span className="led-main">{money(price.typical)}</span>
        <span className="led-range">{money(price.low)} – {money(price.high)}</span>
      </div>
      <div className="perforation" aria-hidden="true" />
      <div className="max">
        <span className="label">Paga no máximo{price.firm ? "" : " (estimativa fraca)"}</span>
        <span className="mono big">{money(price.maxBuy)}</span>
        <span className="hint">para {pct(margin)} de margem, já com envio e destaque</span>
      </div>
      {l && <p className="light-text">{LIGHT_TEXT[l]}</p>}
      {!price.firm && <p className="hint">Poucos dados: trata o número como pista, não como regra.</p>}
    </div>
  );
}
