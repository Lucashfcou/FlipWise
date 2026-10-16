import { useEffect, useRef } from "react";
import { animate } from "motion";
import type { PriceEstimate } from "../domain/types";
import { money, pct } from "../format";

const CONF_LABEL = { alta: "confiança alta", media: "confiança média", baixa: "confiança baixa" } as const;

type Light = "go" | "maybe" | "stop";

export function decide(price: PriceEstimate, asked: number | null): { light: Light; title: string; text: string } | null {
  if (asked === null || !Number.isFinite(asked) || asked <= 0 || price.count === 0) return null;
  if (asked <= price.maxBuy) {
    return { light: "go", title: "Comprar", text: `Fica ${money(price.maxBuy - asked)} abaixo do teu máximo para a margem alvo.` };
  }
  if (price.safeBuy !== undefined && asked <= price.safeBuy) {
    return {
      light: "maybe",
      title: "Margem curta",
      text: `Se tudo correr mal, a loja paga ${money(price.floor ?? 0)} e ainda ganhas. Mas fica abaixo da tua margem alvo.`,
    };
  }
  if (asked <= price.typical) {
    return {
      light: "maybe",
      title: "Negociar",
      text: `Propõe ${money(price.safeBuy ?? price.maxBuy)}.${price.safeBuy !== undefined ? " Acima disso dependes de revender entre pessoas." : ""}`,
    };
  }
  return {
    light: "stop",
    title: "Deixar",
    text: `${money(asked - price.typical)} acima da revenda estimada entre pessoas.`,
  };
}

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.textContent = money(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = money(Math.round(v));
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);
  return <span ref={ref} className="num">{money(value)}</span>;
}

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
        <p>Sem dados para {productLabel} neste estado. Regista preços que vires para o app aprender.</p>
      </div>
    );
  }
  const d = decide(price, asked);
  const hasAsked = asked !== null && Number.isFinite(asked) && asked > 0;
  const headline = price.safeBuy ?? price.maxBuy;
  const headlineLabel = price.safeBuy !== undefined ? "Compra segura até" : "Paga no máximo";
  const resaleLabel = price.derived ? "Revenda entre pessoas (estimativa)" : "Preço típico entre pessoas";

  const values = [
    price.low, price.high, price.maxBuy, price.typical,
    ...(price.floor !== undefined ? [price.floor] : []),
    ...(price.safeBuy !== undefined ? [price.safeBuy] : []),
    ...(hasAsked ? [asked as number] : []),
  ];
  const lo = Math.min(...values) * 0.9;
  const hi = Math.max(...values) * 1.06;
  const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100))}%`;

  return (
    <div className={`verdict ${d?.light ?? ""}`} aria-live="polite">
      <div className="ticket-head">
        <span className="label">{headlineLabel}</span>
        <span className={`conf ${price.confidence}`}>{CONF_LABEL[price.confidence]}</span>
      </div>

      <div className="typical">
        <CountUp value={headline} />
        {price.floor !== undefined && <span className="sub">a loja paga {money(price.floor)}</span>}
      </div>

      {d && (
        <div className="decision">
          <strong>{d.title}</strong>
          <span>{d.text}</span>
        </div>
      )}

      <div
        className="scale"
        role="img"
        aria-label={`Revenda estimada ${money(price.low)} a ${money(price.high)}, compra segura ${money(headline)}`}
      >
        <div className="track" />
        <div className="band" style={{ left: pos(price.low), width: `calc(${pos(price.high)} - ${pos(price.low)})` }} />
        <div className="tick" style={{ left: pos(price.typical) }} />
        {hasAsked && <div className="mark asked" style={{ left: pos(asked as number) }}>{money(asked as number)}</div>}
        <div className="mark max" style={{ left: pos(headline) }}>seguro {money(headline)}</div>
      </div>

      <details className="more">
        <summary>Ver os números</summary>
        <dl className="numbers">
          <div>
            <dt>{resaleLabel}<small>a faixa azul na régua</small></dt>
            <dd className="mono">{money(price.low)} – {money(price.high)}</dd>
          </div>
          <div>
            <dt>Paga até, para {pct(margin)} de margem<small>já desconta envio e destaque</small></dt>
            <dd className="mono">{money(price.maxBuy)}</dd>
          </div>
          {price.floor !== undefined && (
            <div>
              <dt>A loja paga (piso)<small>o que a loja dá por ele hoje</small></dt>
              <dd className="mono">{money(price.floor)}</dd>
            </div>
          )}
          {price.ceiling !== undefined && (
            <div>
              <dt>A loja vende (teto)<small>o que a loja pede hoje</small></dt>
              <dd className="mono">{money(price.ceiling)}</dd>
            </div>
          )}
          <div>
            <dt>Dados usados<small>{CONF_LABEL[price.confidence]}</small></dt>
            <dd className="mono">{price.count} obs.</dd>
          </div>
        </dl>
        <p className="hint">
          {price.derived
            ? "A revenda entre pessoas é uma estimativa a partir da loja: ainda não há vendas reais para a confirmar."
            : price.firm
              ? "Estimativa a partir de anúncios e vendas registados."
              : "Poucos dados: usa como pista, não como regra."}
        </p>
      </details>
    </div>
  );
}
