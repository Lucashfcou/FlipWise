import { useEffect, useRef, useState } from "react";
import { captureStatus, demoResult, lookupPrice, readPrint, shrinkImage } from "../capture/client";
import type { LookupData } from "../capture/client";
import type { CaptureResult, CaptureStatus } from "../capture/types";
import { CONDITIONS, PRODUCTS, findProduct, productLabel } from "../domain/catalog";
import type { Condition } from "../domain/types";
import { pop, stagger, useFx } from "../fx";
import { t } from "../i18n";
import type { Key } from "../i18n";

export interface PrintPick {
  productId: string;
  condition: Condition;
  price: number | null;
}

const eur = (n: number) => `${Math.round(n)} €`;

/** Produto fora do catálogo: pesquisa o nome no eBay e mostra a faixa de preços, sempre com aviso de que é pouco fiável. */
function Lookup({ q, asked }: { q: string; asked: number | null }) {
  const [state, setState] = useState<"loading" | "none" | "error" | LookupData>("loading");
  useEffect(() => {
    let alive = true;
    setState("loading");
    lookupPrice(q)
      .then((r) => alive && setState(r ?? "none"))
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [q]);

  const pct = typeof state === "object" && asked ? Math.round(((asked - state.median) / state.median) * 100) : null;
  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <strong>{t("lookup.title")}</strong>
      <p className="hint">{q}</p>
      {state === "loading" && <p className="hint">{t("lookup.loading")}</p>}
      {state === "none" && <p className="note">{t("lookup.none")}</p>}
      {state === "error" && <p className="loss" role="alert">{t("lookup.error")}</p>}
      {typeof state === "object" && (
        <>
          <span className="label">{t("lookup.typical")}</span>
          <p style={{ fontSize: 32, fontWeight: 700, margin: "2px 0" }}>{eur(state.median)}</p>
          <p className="hint">{t("lookup.range", { low: eur(state.low), high: eur(state.high) })}</p>
          <p className="hint">{t("lookup.n", { n: state.n })}</p>
          {pct !== null && (
            <p>{Math.abs(pct) < 5 ? t("lookup.close") : pct > 0 ? t("lookup.above", { pct }) : t("lookup.below", { pct: Math.abs(pct) })}</p>
          )}
          <p className="note">{t("lookup.warn")}</p>
        </>
      )}
    </div>
  );
}

export function Print({ onUse }: { onUse: (p: PrintPick) => void }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<CaptureStatus | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CaptureResult | null>(null);

  const [productId, setProductId] = useState("");
  const [condition, setCondition] = useState<Condition | "">("");
  const [price, setPrice] = useState("");
  const demo = status !== null && !status.enabled;
  const confirmRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && status === null) captureStatus().then(setStatus);
  }, [open, status]);

  useFx(panelRef, (el) => pop(el, 1.01), [open]);
  useFx(confirmRef, (el) => stagger([...el.children], 8, 35), [result]);

  function load(r: CaptureResult) {
    setResult(r);
    setProductId(r.productId ?? "");
    setCondition(r.condition ?? "");
    setPrice(r.price ? String(r.price) : "");
  }

  async function onFile(file: File | undefined) {
    setError("");
    setResult(null);
    if (!file) return;
    try {
      const data = await shrinkImage(file);
      setImage(data);
      setPreview(data);
    } catch {
      setError(t("print.fileError"));
    }
  }

  async function read() {
    if (!image) return;
    setBusy(true);
    setError("");
    if (demo) {
      // Modo demo: o print fica no aparelho, não é enviado nem lido; mostra-se um resultado de exemplo.
      setTimeout(() => {
        load(demoResult("ok"));
        setBusy(false);
      }, 700);
      return;
    }
    try {
      const { result: r, usedToday, dailyLimit } = await readPrint(image);
      load(r);
      setStatus((s) => (s ? { ...s, usedToday, dailyLimit } : s));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("print.readError"));
    } finally {
      setBusy(false);
    }
  }

  const product = productId ? findProduct(productId) : undefined;
  const priceNum = price === "" ? null : Number(price.replace(",", "."));
  const canUse = Boolean(product && condition);
  const notAd = result?.problems.some((p) => p.code === "NAO_E_ANUNCIO") ?? false;

  if (!open) {
    return (
      <button className="printcard" onClick={() => setOpen(true)}>
        <span>
          <strong>{t("print.card")}</strong>
          <small>{t("print.cardText")}</small>
        </span>
        <span className="chip on">{t("print.paid")}</span>
      </button>
    );
  }

  return (
    <div className="panel capture" ref={panelRef}>
      <div className="row">
        <strong>{t("print.card")}</strong>
        <button className="btn ghost small" onClick={() => setOpen(false)}>{t("print.close")}</button>
      </div>

      {status === null ? (
        <p className="hint">{t("print.checking")}</p>
      ) : status.enabled ? (
        <p className="hint">{t("print.on", { used: status.usedToday ?? 0, limit: status.dailyLimit ?? "?" })}</p>
      ) : (
        <p className="note">{t("print.demoOn")}</p>
      )}

      {status && (
        <>
          <label className="label" htmlFor="printfile">{t("print.file")}</label>
          <input id="printfile" className="field" type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
          {preview && <img className="printpreview" src={preview} alt={t("print.preview")} />}
          <p className="hint">{t(demo ? "print.demoPrivacy" : "print.privacy")}</p>
          <div className="actions">
            <button className="btn primary" onClick={read} disabled={!image || busy}>{busy ? t("print.reading") : t("print.read")}</button>
          </div>
        </>
      )}

      <div className="guide">
        <strong>{t("print.guideTitle")}</strong>
        <p>{t("print.guide")}</p>
      </div>

      {status && !status.enabled && !result && (
        <>
          <p className="hint">{t("print.examples")}</p>
          <div className="actions">
            <button className="btn accent" onClick={() => load(demoResult("ok"))}>{t("print.exOk")}</button>
            <button className="btn ghost" onClick={() => load(demoResult("foto"))}>{t("print.exPhoto")}</button>
            <button className="btn ghost" onClick={() => load(demoResult("naobate"))}>{t("print.exMismatch")}</button>
          </div>
        </>
      )}

      {error && <p className="loss" role="alert">{error}</p>}

      {result && notAd && (
        <div className="confirm" ref={confirmRef}>
          {result.demo && <p className="note">{t("print.demoNote")}</p>}
          <ul className="problems" role="alert">
            {result.problems.map((p) => (
              <li key={p.code} className={p.severity}>{p.message}</li>
            ))}
          </ul>
          <div className="actions">
            <button
              className="btn primary"
              onClick={() => {
                setResult(null);
                setImage(null);
                setPreview(null);
              }}
            >
              {t("print.tryAgain")}
            </button>
          </div>
        </div>
      )}

      {result && !notAd && (
        <div className="confirm" ref={confirmRef}>
          <div className="row">
            <strong>{result.title || t("print.read1")}</strong>
            <span className={`conf ${result.confidence}`}>{t(`conf.${result.confidence}` as Key)}</span>
          </div>
          {result.demo && <p className="note">{t("print.demoNote")}</p>}
          {result.problems.length > 0 && (
            <ul className="problems" role="alert">
              {result.problems.map((p) => (
                <li key={p.code + p.message} className={p.severity}>{p.message}</li>
              ))}
            </ul>
          )}
          {!result.productId && (
            <p className="note"><strong>{t("print.unknownTitle")}.</strong> {t("print.unknownText")}</p>
          )}
          {!result.productId && result.searchQuery && status?.lookup && !result.demo && <Lookup q={result.searchQuery} asked={priceNum} />}
          {result.notes && <p className="hint">{result.notes}</p>}
          {result.defects.length > 0 && <p className="loss">{t("print.defects", { list: result.defects.join(", ") })}</p>}
          {result.includes.length > 0 && <p className="hint">{t("print.includes", { list: result.includes.join(", ") })}</p>}

          <p className="hint">{t("print.confirm")}</p>

          <label className="label" htmlFor="cp">{t("eval.product")}</label>
          <select
            id="cp"
            className="field"
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setCondition("");
            }}
          >
            <option value="">{t("print.choose")}</option>
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>{productLabel(p)}</option>
            ))}
          </select>

          <div className="two">
            <div>
              <label className="label" htmlFor="cc">{t("eval.condition")}</label>
              <select id="cc" className="field" value={condition} onChange={(e) => setCondition(e.target.value as Condition)} disabled={!product}>
                <option value="">{t("print.choose")}</option>
                {product && CONDITIONS[product.category].map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="cpr">{t("eval.price")}</label>
              <input id="cpr" className="field mono" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          {result.conditionReason && <p className="hint">{t("print.conditionNote", { note: result.conditionReason })}</p>}

          <div className="actions">
            <button
              className="btn primary"
              disabled={!canUse}
              onClick={() => onUse({ productId, condition: condition as Condition, price: priceNum !== null && Number.isFinite(priceNum) && priceNum > 0 ? priceNum : null })}
            >
              {t("print.use")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
