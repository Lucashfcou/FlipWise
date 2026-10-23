import { useEffect, useRef } from "react";
import { pop, roll } from "../fx";
import { t } from "../i18n";
import type { Key } from "../i18n";
import type { PriceEstimate } from "../domain/types";
import { money, pct } from "../format";

type Light = "go" | "maybe" | "stop";

/** A partir desta fração do limite de revenda, comprar já deixa pouca folga de lucro. */
export const TIGHT_FROM = 0.85;

/**
 * Quatro zonas pelo preço pedido, do mais barato ao mais caro:
 *  - até 85% do limite: comprar, há lucro;
 *  - até o limite (ou até o que a loja paga): compra segura, mas o lucro é curto ou nulo depois de fretes e custos;
 *  - até o preço de revenda: bom para ficar com ele, não para revender;
 *  - acima: deixar.
 */
export function decide(price: PriceEstimate, asked: number | null): { light: Light; title: string; text: string } | null {
  if (asked === null || !Number.isFinite(asked) || asked <= 0 || price.count === 0) return null;
  if (asked <= price.maxBuy * TIGHT_FROM) {
    return { light: "go", title: t("decide.buy"), text: t("decide.buyText", { amount: money(price.maxBuy - asked) }) };
  }
  if (asked <= price.maxBuy || (price.safeBuy !== undefined && asked <= price.safeBuy)) {
    return { light: "go", title: t("decide.tight"), text: t("decide.tightText") };
  }
  if (asked <= price.typical) {
    return { light: "maybe", title: t("decide.own"), text: t("decide.ownText", { max: money(price.maxBuy) }) };
  }
  return { light: "stop", title: t("decide.pass"), text: t("decide.passText", { amount: money(asked - price.typical) }) };
}

/** Preço grande com dígitos que rolam (animação do jogo do PAS). O leitor de ecrã recebe o valor em texto normal. */
function RollingPrice({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const text = money(value);
  useEffect(() => {
    roll(ref.current, text);
  }, [text]);
  return (
    <>
      <span ref={ref} className="num" aria-hidden="true" />
      <span className="sr-only">{text}</span>
    </>
  );
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
  const decisionRef = useRef<HTMLDivElement>(null);
  const d = decide(price, asked);
  const decisionKey = d ? `${d.light}:${d.title}` : "";
  useEffect(() => {
    if (decisionKey) pop(decisionRef.current, 1.02);
  }, [decisionKey]);

  if (price.count === 0) {
    return (
      <div className="verdict empty">
        <p>{t("verdict.noData", { product: productLabel })}</p>
      </div>
    );
  }
  const hasAsked = asked !== null && Number.isFinite(asked) && asked > 0;
  const headline = price.maxBuy;
  const headlineLabel = d ? t("verdict.offerUpTo") : t("verdict.payAtMost");
  const resaleLabel = price.derived ? t("verdict.resaleEst") : t("verdict.typical");
  const conf = t(`conf.${price.confidence}` as Key);

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
    <div className={`verdict ${d?.light ?? ""}`}>
      {d && (
        <div className="decision hero" ref={decisionRef} aria-live="polite">
          <strong>{d.title}</strong>
          <span>{d.text}</span>
        </div>
      )}

      <div className="ticket-head">
        <span className="label">{headlineLabel}</span>
        <span className={`conf ${price.confidence}`}>{conf}</span>
      </div>

      <div className="typical">
        <RollingPrice value={headline} />
        {price.floor !== undefined && <span className="sub">{t("verdict.shopPays", { price: money(price.floor) })}</span>}
      </div>

      <div
        className="scale"
        role="img"
        aria-label={t("verdict.rulerAria", { low: money(price.low), high: money(price.high), safe: money(headline) })}
      >
        <div className="track" />
        <div className="band" style={{ left: pos(price.low), width: `calc(${pos(price.high)} - ${pos(price.low)})` }} />
        <div className="tick" style={{ left: pos(price.typical) }} />
        {hasAsked && <div className="mark asked" style={{ left: pos(asked as number) }}>{money(asked as number)}</div>}
        <div className="mark max" style={{ left: pos(headline) }}>{t("verdict.offer")}</div>
      </div>
      <p className="legend">
        <span className="sw band" aria-hidden="true" />
        {t("verdict.legendBand", { low: money(price.low), high: money(price.high) })}
        <span className="sw tick" aria-hidden="true" />
        {t("verdict.legendTick", { price: money(price.typical) })}
      </p>

      <details className="more">
        <summary>{t("verdict.show")}</summary>
        <dl className="numbers">
          <div>
            <dt>{resaleLabel}<small>{t("verdict.bandHint")}</small></dt>
            <dd className="mono">{money(price.low)} – {money(price.high)}</dd>
          </div>
          <div>
            <dt>{t("verdict.marginRow", { margin: pct(margin) })}<small>{t("verdict.marginHint")}</small></dt>
            <dd className="mono">{money(price.maxBuy)}</dd>
          </div>
          {price.floor !== undefined && (
            <div>
              <dt>{t("verdict.floor")}<small>{t("verdict.floorHint")}</small></dt>
              <dd className="mono">{money(price.floor)}</dd>
            </div>
          )}
          {price.ceiling !== undefined && (
            <div>
              <dt>{t("verdict.ceiling")}<small>{t("verdict.ceilingHint")}</small></dt>
              <dd className="mono">{money(price.ceiling)}</dd>
            </div>
          )}
          <div>
            <dt>{t("verdict.data")}<small>{conf}</small></dt>
            <dd className="mono">{t("verdict.obs", { n: price.count })}</dd>
          </div>
        </dl>
        <p className="hint">{price.derived ? t("verdict.noteDerived") : price.firm ? t("verdict.noteFirm") : t("verdict.noteWeak")}</p>
      </details>
    </div>
  );
}
