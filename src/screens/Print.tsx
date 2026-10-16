import { useEffect, useState } from "react";
import { captureStatus, demoResult, readPrint, shrinkImage } from "../capture/client";
import type { CaptureResult, CaptureStatus } from "../capture/types";
import { CONDITIONS, PRODUCTS, findProduct } from "../domain/catalog";
import type { Condition } from "../domain/types";

export interface PrintPick {
  productId: string;
  condition: Condition;
  price: number | null;
}

const CONF = { alta: "confiança alta", media: "confiança média", baixa: "confiança baixa" } as const;

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

  useEffect(() => {
    if (open && status === null) captureStatus().then(setStatus);
  }, [open, status]);

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
      setError("Não consegui abrir esta imagem. Tenta um print em JPEG ou PNG.");
    }
  }

  async function read() {
    if (!image) return;
    setBusy(true);
    setError("");
    try {
      const { result: r, usedToday, dailyLimit } = await readPrint(image);
      load(r);
      setStatus((s) => (s ? { ...s, usedToday, dailyLimit } : s));
    } catch (e) {
      setError(e instanceof Error ? e.message : "A leitura falhou.");
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
          <strong>Avaliar por print</strong>
          <small>Tira um print do anúncio e o app lê o produto, o estado e o preço.</small>
        </span>
        <span className="chip on">Pago</span>
      </button>
    );
  }

  return (
    <div className="panel capture">
      <div className="row">
        <strong>Avaliar por print</strong>
        <button className="btn ghost small" onClick={() => setOpen(false)}>Fechar</button>
      </div>

      {status === null ? (
        <p className="hint">A verificar o serviço…</p>
      ) : status.enabled ? (
        <p className="hint">Leitura ativa. Hoje: {status.usedToday ?? 0} de {status.dailyLimit ?? "?"} leituras.</p>
      ) : (
        <p className="note">
          A leitura por print está <strong>desligada</strong>: não há servidor nem chave configurados, por isso não custa nada.
          Podes ver o fluxo com um resultado de exemplo.
        </p>
      )}

      {status?.enabled && (
        <>
          <label className="label" htmlFor="printfile">Print do anúncio</label>
          <input id="printfile" className="field" type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
          {preview && <img className="printpreview" src={preview} alt="Pré-visualização do print" />}
          <p className="hint">A imagem é reduzida no aparelho, enviada para leitura e não é guardada.</p>
          <div className="actions">
            <button className="btn primary" onClick={read} disabled={!image || busy}>{busy ? "A ler…" : "Ler print"}</button>
          </div>
        </>
      )}

      <div className="guide">
        <strong>O que enviar</strong>
        <p>
          Um print da <b>página do anúncio</b>, com o título e o preço visíveis. Uma foto solta do aparelho, por exemplo
          tirada numa feira, não chega para identificar o produto nem o preço.
        </p>
      </div>

      {status && !status.enabled && !result && (
        <>
          <p className="hint">Exemplos para ver como o app reage:</p>
          <div className="actions">
            <button className="btn accent" onClick={() => load(demoResult("ok"))}>Anúncio lido</button>
            <button className="btn ghost" onClick={() => load(demoResult("foto"))}>Foto solta</button>
            <button className="btn ghost" onClick={() => load(demoResult("naobate"))}>Foto não bate</button>
          </div>
        </>
      )}

      {error && <p className="loss" role="alert">{error}</p>}

      {result && notAd && (
        <div className="confirm">
          {result.demo && <p className="note">Resultado de exemplo: não veio de nenhum print.</p>}
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
              Tentar outro print
            </button>
          </div>
        </div>
      )}

      {result && !notAd && (
        <div className="confirm">
          <div className="row">
            <strong>{result.title || "Anúncio lido"}</strong>
            <span className={`conf ${result.confidence}`}>{CONF[result.confidence]}</span>
          </div>
          {result.demo && <p className="note">Resultado de exemplo: não veio de nenhum print.</p>}
          {result.problems.length > 0 && (
            <ul className="problems" role="alert">
              {result.problems.map((p) => (
                <li key={p.code + p.message} className={p.severity}>{p.message}</li>
              ))}
            </ul>
          )}
          {result.notes && <p className="hint">{result.notes}</p>}
          {result.defects.length > 0 && <p className="loss">Defeitos mencionados: {result.defects.join(", ")}</p>}
          {result.includes.length > 0 && <p className="hint">Inclui: {result.includes.join(", ")}</p>}

          <p className="hint">Confirma antes de usar. O app pode errar o modelo, a capacidade ou o estado.</p>

          <label className="label" htmlFor="cp">Produto</label>
          <select
            id="cp"
            className="field"
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setCondition("");
            }}
          >
            <option value="">Escolher…</option>
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>{p.name} {p.variant}</option>
            ))}
          </select>

          <div className="two">
            <div>
              <label className="label" htmlFor="cc">Estado</label>
              <select id="cc" className="field" value={condition} onChange={(e) => setCondition(e.target.value as Condition)} disabled={!product}>
                <option value="">Escolher…</option>
                {product && CONDITIONS[product.category].map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="cpr">Preço (€)</label>
              <input id="cpr" className="field mono" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          {result.conditionReason && <p className="hint">Estado: {result.conditionReason}</p>}

          <div className="actions">
            <button
              className="btn primary"
              disabled={!canUse}
              onClick={() => onUse({ productId, condition: condition as Condition, price: priceNum !== null && Number.isFinite(priceNum) && priceNum > 0 ? priceNum : null })}
            >
              Usar na avaliação
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
