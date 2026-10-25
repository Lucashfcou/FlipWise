import { useEffect, useRef, useState } from "react";
import { captureStatus, demoResult, lookupPrice, readPrint, shrinkImage } from "../capture/client";
import type { LookupData } from "../capture/client";
import { matchCatalog } from "../capture/match";
import { cleanLookupQuery } from "../ebay/lookup";
import type { CaptureResult, CaptureStatus } from "../capture/types";
import { CONDITIONS, PRODUCTS, findProduct, productLabel } from "../domain/catalog";
import type { BundleLine } from "../domain/bundle";
import type { Condition } from "../domain/types";
import type { LotSeed } from "./Lote";
import { pop, stagger, useFx } from "../fx";
import { estimate } from "../domain/priceEngine";
import { useApp } from "../state";
import { useAuth } from "../auth/AuthProvider";
import { LoginPanel } from "../auth/AccountPanel";
import { Verdict } from "../ui/Verdict";
import { t } from "../i18n";
import type { Key } from "../i18n";

export interface PrintPick {
  productId: string;
  condition: Condition;
  price: number | null;
}

const eur = (n: number) => `${Math.round(n)} €`;

/**
 * Produto fora do catálogo: mostra o nome que a IA entendeu (editável), pesquisa no eBay e dá o mesmo veredito do catálogo.
 * Se só se sabe a linha ("Ryzen 7"), pergunta o modelo com opções. Preço só aparece com anúncios suficientes.
 */
function Lookup({ q: q0, specs, deviceType, asked, preset, options, needsModel, onCatalog }: {
  q: string; specs: string[]; deviceType: string; asked: number | null; preset?: LookupData | null; options: string[]; needsModel: boolean; onCatalog: (id: string) => void;
}) {
  const { settings } = useApp();
  const [q, setQ] = useState(q0);
  const [draft, setDraft] = useState(q0);
  const first = q === q0;
  const [state, setState] = useState<"idle" | "loading" | "none" | "error" | LookupData>(needsModel ? "idle" : preset === undefined ? "loading" : preset ?? "none");
  useEffect(() => {
    if (first && needsModel) {
      setState("idle");
      return;
    }
    if (first && preset !== undefined) {
      setState(preset ?? "none");
      return;
    }
    let alive = true;
    setState("loading");
    lookupPrice(q, specs, deviceType)
      .then((r) => alive && setState(r ?? "none"))
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [q, specs.join(","), deviceType, preset, first, needsModel]);

  const inCatalog = matchCatalog(q, specs).exact;
  const data = typeof state === "object" ? state : null;
  const price = data
    ? estimate(
        data.prices.map((value) => ({ productId: "lookup", condition: "B" as const, kind: "ask" as const, value, source: "eBay", date: new Date().toISOString().slice(0, 10) })),
        { shipping: settings.shipping, promo: settings.promo, margin: settings.targetMargin },
      )
    : null;
  const search = (name: string) => {
    const c = cleanLookupQuery(name);
    if (c) {
      setDraft(c);
      setQ(c);
    }
  };
  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <strong>{t("lookup.title")}</strong>
      <label className="label" htmlFor="lookupname">{needsModel ? t("lookup.pickModel") : t("lookup.understood")}</label>
      <div className="row" style={{ gap: 8 }}>
        <input id="lookupname" className="field" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search(draft)} placeholder={t("lookup.otherModel")} />
        <button className="btn small" onClick={() => search(draft)} disabled={!cleanLookupQuery(draft)}>{t("lookup.search")}</button>
      </div>
      {options.length > 0 && (
        <div className="chips" style={{ marginTop: 8 }}>
          {options.map((o) => (
            <button key={o} className="chip" onClick={() => search(o)}>{o}</button>
          ))}
        </div>
      )}
      {inCatalog && (
        <p className="note">
          {t("lookup.inCatalog", { name: productLabel(inCatalog) })}{" "}
          <button className="btn small" onClick={() => onCatalog(inCatalog.id)}>{t("lookup.useCatalog")}</button>
        </p>
      )}
      {state === "loading" && <p className="hint">{t("lookup.loading")}</p>}
      {state === "none" && <p className="note">{t("lookup.none")}</p>}
      {state === "error" && <p className="loss" role="alert">{t("lookup.error")}</p>}
      {data && price && (
        <>
          <Verdict price={price} asked={asked} productLabel={data.searched ?? q} margin={settings.targetMargin} />
          <p className="hint">{t("lookup.range", { low: eur(data.low), high: eur(data.high) })}</p>
          <p className="hint">
            {t("lookup.n", { n: data.n })} {data.basis === "specs" ? t("lookup.basisSpecs", { specs: specs.join(", ") }) : data.basis === "family" ? t("lookup.basisFamily", { name: data.searched ?? q }) : t("lookup.basisModel")}
          </p>
          {asked && (data.median < asked * 0.25 || data.median > asked * 4) && <p className="loss" role="alert">{t("lookup.suspicious")}</p>}
          <p className="note">{data.reliability === "media" ? t("lookup.warnMedium") : t("lookup.warn")}</p>
        </>
      )}
    </div>
  );
}

export function Print({ onUse, onUseLot }: { onUse: (p: PrintPick) => void; onUseLot: (s: LotSeed) => void }) {
  const { settings } = useApp();
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
  const [editing, setEditing] = useState(false);
  /** Anúncio de lote: true = a pessoa escolheu avaliar só o artigo principal. */
  const [mainOnly, setMainOnly] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const demo = status !== null && !status.enabled;
  const confirmRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Volta a perguntar ao servidor quando se abre o painel ou quando a pessoa entra ou sai da conta.
  const { user } = useAuth();
  useEffect(() => {
    if (open) captureStatus().then(setStatus);
  }, [open, user?.id]);

  useFx(panelRef, (el) => pop(el, 1.01), [open]);
  useFx(confirmRef, (el) => stagger([...el.children], 8, 35), [result]);

  /** Volta ao início: sem print, sem resultado, sem nada preenchido. */
  function reset() {
    setPreview(null);
    setImage(null);
    setResult(null);
    setProductId("");
    setCondition("");
    setPrice("");
    setEditing(false);
    setMainOnly(false);
    setError("");
    setBusy(false);
    setFileKey((k) => k + 1);
  }

  function load(r: CaptureResult) {
    setResult(r);
    setProductId(r.productId ?? "");
    setCondition(r.condition ?? "");
    setPrice(r.price ? String(r.price) : "");
    setEditing(false);
    setMainOnly(false);
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
  const validPrice = priceNum !== null && Number.isFinite(priceNum) && priceNum > 0;
  const canUse = Boolean(product && condition);
  const showLookup = Boolean(result && !productId && result.searchQuery && status?.lookup && !result.demo && !(result.candidates?.length));
  const notAd = result?.problems.some((p) => p.code === "NAO_E_ANUNCIO") ?? false;
  const lot = result?.lot && !mainOnly && !notAd ? result.lot : undefined;
  const foundName = product ? productLabel(product) : result?.searchQuery || result?.title || "";

  /** Preço do artigo principal do lote fora do catálogo, calculado como no veredito de um artigo. */
  function mainLookupEstimate() {
    const prices = result?.lookup?.prices;
    if (!prices || prices.length === 0) return null;
    const e = estimate(
      prices.map((value) => ({ productId: "lookup", condition: "B" as const, kind: "ask" as const, value, source: "eBay", date: new Date().toISOString().slice(0, 10) })),
      { shipping: settings.shipping, promo: settings.promo, margin: settings.targetMargin },
    );
    return e.count > 0 ? e : null;
  }

  function lotLabel(it: NonNullable<CaptureResult["lot"]>["items"][number]) {
    const p = it.productId ? findProduct(it.productId) : undefined;
    return p ? productLabel(p) : it.name;
  }

  /** O que conta no veredito do lote e o que não conta, mais as avisos de contagem. */
  const lotInfo = (() => {
    if (!lot) return null;
    const rows = lot.items.map((it, i) => ({ it, i, priced: Boolean(it.productId) || (i === 0 && mainLookupEstimate() !== null) }));
    const total = rows.reduce((a, r) => a + r.it.qty, 0);
    const counted = rows.filter((r) => r.priced).reduce((a, r) => a + r.it.qty, 0);
    const warnings: string[] = [];
    const c = lot.check;
    if (c?.state === "differs") warnings.push(t("print.lotDiffers", { kinds: c.diffs.map((k) => t(("kind." + k) as Key)).join(", ") }));
    const games = lot.items.filter((x) => x.kind === "game").reduce((a, x) => a + x.qty, 0);
    if (c?.statedGames !== undefined && c.statedGames !== games) warnings.push(t("print.lotStated", { n: c.statedGames, m: games }));
    const check =
      c?.state === "match" && warnings.length === 0 ? <p className="hint">{t("print.lotMatch")}</p>
      : c?.state === "single" ? <p className="hint">{t("print.lotSingle")}</p>
      : null;
    return { rows, total, counted, warnings, check };
  })();

  function useLot() {
    if (!result?.lot) return;
    const lines: BundleLine[] = [];
    const skipped: string[] = [];
    result.lot.items.forEach((it, i) => {
      const p = it.productId ? findProduct(it.productId) : undefined;
      if (p) {
        lines.push({ productId: p.id, condition: it.condition ?? CONDITIONS[p.category][0].id, qty: it.qty });
        return;
      }
      const est = i === 0 ? mainLookupEstimate() : null;
      if (est) lines.push({ productId: "custom:" + it.name, condition: "B", qty: it.qty, custom: { label: it.name, price: est } });
      else skipped.push(it.qty > 1 ? `${it.qty}× ${it.name}` : it.name);
    });
    const skippedUnits = result.lot.items.reduce((a, it, i) => {
      const p = it.productId ? findProduct(it.productId) : undefined;
      const priced = Boolean(p) || (i === 0 && mainLookupEstimate() !== null);
      return priced ? a : a + it.qty;
    }, 0);
    onUseLot({ lines, asked: validPrice ? (priceNum as number) : null, skipped, skippedUnits });
  }

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
        <button
          className="btn ghost small"
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          {t("print.close")}
        </button>
      </div>

      {status === null ? (
        <p className="hint">{t("print.checking")}</p>
      ) : status.enabled ? (
        <p className="hint">{t("print.on", { used: status.usedToday ?? 0, limit: status.dailyLimit ?? "?" })}</p>
      ) : status.loginRequired ? (
        <>
          <p className="note">{t("auth.needLogin")}</p>
          <LoginPanel compact />
          <p className="hint">{t("print.demoOn")}</p>
        </>
      ) : status.upgrade ? (
        <p className="note">{t("auth.needPro")}</p>
      ) : (
        <p className="note">{t("print.demoOn")}</p>
      )}

      {status && (
        <>
          <input
            key={fileKey}
            ref={fileRef}
            id="printfile"
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {!preview ? (
            <button className="dropzone" onClick={() => fileRef.current?.click()}>
              <strong>{t("print.pick")}</strong>
              <small>{t("print.pickHint")}</small>
            </button>
          ) : (
            <div className="previewbox">
              <img className="printpreview" src={preview} alt={t("print.preview")} />
              <div className="actions">
                <button className="btn ghost" onClick={() => fileRef.current?.click()}>{t("print.change")}</button>
                <button className="btn ghost" onClick={reset}>{t("print.remove")}</button>
              </div>
            </div>
          )}
          {preview && !result && (
            <div className="actions">
              <button className="btn primary" onClick={read} disabled={!image || busy}>{busy ? t("print.reading") : t("print.read")}</button>
            </div>
          )}
          <p className="hint">{t(demo ? "print.demoPrivacy" : "print.privacy")}</p>
        </>
      )}

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
            <button className="btn primary" onClick={reset}>{t("print.tryAgain")}</button>
          </div>
        </div>
      )}

      {result && !notAd && lot && lotInfo && (
        <div className="confirm" ref={confirmRef}>
          {result.demo && <p className="note">{t("print.demoNote")}</p>}
          <div className="found">
            <small className="label">{t("print.lotTitle", { n: lot.items.length })}</small>
            <div className="lotprice">
              <label className="label" htmlFor="lotprice">{t("lot.ask")}</label>
              <input id="lotprice" className="field mono" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>

          <p className={lotInfo.counted < lotInfo.total ? "note" : "hint"}>
            {t("print.lotCounted", { counted: lotInfo.counted, total: lotInfo.total })}
          </p>
          {lotInfo.warnings.map((w) => (
            <p key={w} className="loss" role="alert">{w}</p>
          ))}
          {lotInfo.check}

          {lotInfo.counted > 0 && (
            <>
              <small className="label">{t("print.lotCountedLabel")}</small>
              <ul className="plain lotlist">
                {lotInfo.rows.filter((r) => r.priced).map((r) => (
                  <li key={r.i} className="row">
                    <span>{r.it.qty}× {lotLabel(r.it)}</span>
                    <small className="gain">✓</small>
                  </li>
                ))}
              </ul>
            </>
          )}
          {lotInfo.counted < lotInfo.total && (
            <>
              <small className="label">{t("print.lotNotCounted")}</small>
              <ul className="plain lotlist muted">
                {lotInfo.rows.filter((r) => !r.priced).map((r) => (
                  <li key={r.i} className="row">
                    <span>{r.it.qty}× {lotLabel(r.it)}</span>
                    <small>{t(("kind." + r.it.kind) as Key)}</small>
                  </li>
                ))}
              </ul>
            </>
          )}
          {lot.more > 0 && <p className="hint">{t("print.lotMore", { n: lot.more })}</p>}
          <div className="actions">
            <button className="btn primary" onClick={useLot}>{t("print.lotUse")}</button>
            <button className="btn ghost" onClick={() => setMainOnly(true)}>{t("print.lotMain")}</button>
          </div>
        </div>
      )}

      {result && !notAd && !lot && (
        <div className="confirm" ref={confirmRef}>
          {result.demo && <p className="note">{t("print.demoNote")}</p>}
          <div className="found">
            <small className="label">{t("print.found")}</small>
            <strong className="foundname">{foundName || t("print.read1")}</strong>
            <span className={`conf ${result.confidence}`}>{t(`conf.${result.confidence}` as Key)}</span>
          </div>
          {result.problems.length > 0 && (
            <ul className="problems" role="alert">
              {result.problems.map((p) => (
                <li key={p.code + p.message} className={p.severity}>{p.message}</li>
              ))}
            </ul>
          )}
          {!productId && !result.searchQuery && (
            <p className="note"><strong>{t("print.unknownTitle")}.</strong> {t("print.unknownText")}</p>
          )}
          {!productId && (result.candidates?.length ?? 0) > 0 && (
            <div className="panel" style={{ marginTop: 12 }}>
              <strong>{t("lookup.pickOne")}</strong>
              <div className="chips" style={{ marginTop: 8 }}>
                {result.candidates!.map((c) => (
                  <button key={c.id} className="chip" onClick={() => setProductId(c.id)}>{c.label}</button>
                ))}
              </div>
            </div>
          )}
          {!productId && result.searchQuery && status?.lookup && !result.demo && !(result.candidates?.length) && (
            <Lookup
              q={result.searchQuery}
              specs={result.specs ?? []}
              deviceType={result.deviceType ?? ""}
              asked={priceNum}
              preset={result.lookup as LookupData | null | undefined}
              options={result.modelOptions ?? []}
              needsModel={result.needsModel === true}
              onCatalog={(id) => {
                setProductId(id);
                setCondition("");
              }}
            />
          )}
          {result.defects.length > 0 && <p className="loss">{t("print.defects", { list: result.defects.join(", ") })}</p>}
          {(result.notes || result.includes.length > 0 || result.conditionReason) && (
            <details className="more">
              <summary>{t("print.more")}</summary>
              {result.includes.length > 0 && <p className="hint">{t("print.includes", { list: result.includes.join(", ") })}</p>}
              {result.conditionReason && <p className="hint">{t("print.conditionNote", { note: result.conditionReason })}</p>}
              {result.notes && <p className="hint">{result.notes}</p>}
            </details>
          )}

          {product && condition && !editing && (
            <div className="summary">
              <div>
                <strong>{CONDITIONS[product.category].find((c) => c.id === condition)?.label}</strong>
                <small>{validPrice ? `${priceNum} €` : t("print.noPrice")}</small>
              </div>
              <button className="btn ghost small" onClick={() => setEditing(true)}>{t("print.edit")}</button>
            </div>
          )}
          {!(product && condition) && !editing && showLookup && (
            <button className="btn ghost small" onClick={() => setEditing(true)}>{t("print.pickCatalog")}</button>
          )}

          {(editing || (!(product && condition) && !showLookup)) && (
            <>
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
            </>
          )}

          {(canUse || editing || !showLookup) && (
            <div className="actions">
              <button
                className="btn primary"
                disabled={!canUse}
                onClick={() => onUse({ productId, condition: condition as Condition, price: validPrice ? (priceNum as number) : null })}
              >
                {t("print.use")}
              </button>
              <button className="btn ghost" onClick={reset}>{t("print.tryAgain")}</button>
            </div>
          )}
          {showLookup && !canUse && !editing && (
            <div className="actions">
              <button className="btn ghost" onClick={reset}>{t("print.tryAgain")}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
