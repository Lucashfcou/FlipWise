/**
 * Núcleo do servidor de leitura de prints e busca de preços, sem HTTP e sem estado global de utilizador.
 * Usado pelo servidor local (server/capture.ts) e pelas funções da Vercel (api-src/*). Quem chama decide os limites:
 * recebe `quota`, que consome uma unidade de "smart" (modelo forte) ou "lookup" (busca no eBay) e diz se ainda havia.
 */
import { EbayError, MARKETPLACES, getToken } from "../src/ebay/client";
import type { MarketplaceId } from "../src/ebay/client";
import { lookupConfident, lookupScore, runLookup } from "../src/ebay/lookup";
import type { LookupResult } from "../src/ebay/lookup";
import type { CaptureResult } from "../src/capture/types";
import { DEFAULT_MODEL, buildRetryRequest, buildVisionRequest, lotDiffs, parseRetryResponse, parseVisionResponse, statedGameCount } from "../src/capture/vision";

export type QuotaKind = "smart" | "lookup";

export interface CoreConfig {
  anthropicKey: string;
  model: string;
  /** Modelo forte para anúncios difíceis. Vazio desliga. */
  smartModel: string;
  ebayId: string;
  ebaySecret: string;
  lookupSites: MarketplaceId[];
}

export interface CoreHooks {
  /** Consome uma unidade da quota do utilizador. false = acabou. */
  quota(kind: QuotaKind): Promise<boolean> | boolean;
  log(msg: string): void;
}

/** Configuração a partir das variáveis de ambiente (iguais no PC e na Vercel). */
export function configFromEnv(env: Record<string, string | undefined>): CoreConfig {
  const sites = (env.LOOKUP_SITES ?? "EBAY_ES,EBAY_DE,EBAY_FR,EBAY_IT")
    .split(",")
    .map((x) => x.trim())
    .filter((x): x is MarketplaceId => x in MARKETPLACES);
  return {
    anthropicKey: env.ANTHROPIC_API_KEY ?? "",
    model: env.CAPTURE_MODEL || DEFAULT_MODEL,
    smartModel: env.SMART_MODEL ?? "claude-sonnet-5-5",
    ebayId: env.EBAY_CLIENT_ID ?? "",
    ebaySecret: env.EBAY_CLIENT_SECRET ?? "",
    lookupSites: sites.length ? sites : ["EBAY_ES"],
  };
}

const CACHE_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX = 500;

const quality = (r: CaptureResult) =>
  (r.productId ? 3 : 0) + (r.searchQuery && !r.needsModel ? 2 : 0) + (r.confidence === "alta" ? 2 : r.confidence === "media" ? 1 : 0) - r.problems.filter((p) => p.severity === "erro").length * 2;

const hard = (r: CaptureResult) => r.imageType === "anuncio" && (r.confidence === "baixa" || r.needsModel === true || (!r.productId && !r.searchQuery));

export class ServiceError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
  }
}

export function createCore(cfg: CoreConfig, hooks: CoreHooks) {
  const lookupOn = Boolean(cfg.ebayId && cfg.ebaySecret);
  const visionOn = Boolean(cfg.anthropicKey);
  let ebayToken: { value: string; until: number } | null = null;
  const cache = new Map<string, { at: number; result: LookupResult | null }>();

  async function tokenForLookup(): Promise<string> {
    if (ebayToken && ebayToken.until > Date.now() + 60_000) return ebayToken.value;
    const { token, expiresIn } = await getToken({ clientId: cfg.ebayId, clientSecret: cfg.ebaySecret });
    ebayToken = { value: token, until: Date.now() + expiresIn * 1000 };
    return token;
  }

  /** Busca com cache de 6 h (por instância) e quota do utilizador. As repetidas vêm da cache e não gastam quota. */
  async function lookup(query: string, specs: string[], deviceType: string): Promise<LookupResult | null> {
    if (!lookupOn) throw new ServiceError("Busca de preços desativada: faltam as chaves do eBay no servidor.", 503);
    const key = `${query.toLowerCase()}|${specs.join(",").toLowerCase()}|${deviceType.toLowerCase()}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.result;
    if (!(await hooks.quota("lookup"))) throw new ServiceError("Limite diário de buscas atingido.", 429);
    const token = await tokenForLookup();
    let result: LookupResult | null = null;
    for (const site of cfg.lookupSites) {
      const r = await runLookup(token, site, query, { specs, deviceType });
      if (lookupScore(r) > lookupScore(result)) result = r;
      if (lookupConfident(result)) break;
    }
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
    cache.set(key, { at: Date.now(), result });
    hooks.log(`[busca] "${query}" ${specs.join("/")} -> ${result ? `${result.n} anúncios, mediana ${result.median} (${result.site} ${result.basis}, ${result.category ?? "sem categoria"}, ${result.reliability})` : "sem resultado fiável"}`);
    return result;
  }

  async function callVision(image: string, model: string, lang: "pt" | "en") {
    const api = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": cfg.anthropicKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(buildVisionRequest(image, model, lang, model === cfg.model)),
    });
    if (!api.ok) {
      hooks.log(`Claude API ${api.status} (${model}): ${(await api.text()).slice(0, 300)}`);
      throw new ServiceError("O serviço de leitura falhou. Tenta outra vez.");
    }
    return parseVisionResponse(await api.json());
  }

  /** Lê o print: modelo barato; se for difícil, o forte; fora do catálogo busca no eBay e, se não for fiável, pede nomes alternativos. */
  async function capture(image: string, lang: "pt" | "en"): Promise<{ result: CaptureResult; usage: { input: number; output: number } }> {
    if (!visionOn) throw new ServiceError("Leitura por print desativada: falta ANTHROPIC_API_KEY no servidor.", 503);
    const first = await callVision(image, cfg.model, lang);
    let { result } = first;
    const usage = first.usage;
    /** Segunda leitura (modelo forte), se houve: serve também para conferir as contagens de um lote. */
    let strong: CaptureResult | null = null;

    if (cfg.smartModel && hard(result) && (await hooks.quota("smart"))) {
      try {
        const second = await callVision(image, cfg.smartModel, lang);
        hooks.log(`[captura] modelo forte ${cfg.smartModel} entrada=${second.usage.input} saída=${second.usage.output} (${quality(result)} -> ${quality(second.result)})`);
        strong = second.result;
        if (quality(second.result) > quality(result)) result = second.result;
      } catch {
        /* mantém a primeira leitura */
      }
    }

    // Lote: o modelo barato erra contagens (jogos, canetas, carregadores). O forte lê também e as duas leituras são comparadas;
    // se divergirem, o app avisa em vez de escolher em silêncio.
    const cheap = first.result;
    if (cfg.smartModel && (cheap.lot || strong?.lot)) {
      if (!strong && (await hooks.quota("smart"))) {
        try {
          const second = await callVision(image, cfg.smartModel, lang);
          hooks.log(`[captura] lote: conferência com ${cfg.smartModel} entrada=${second.usage.input} saída=${second.usage.output}`);
          strong = second.result;
        } catch {
          /* fica com uma só leitura */
        }
      }
      if (strong) {
        // Num lote, a leitura forte manda, a menos que tenha perdido o produto principal.
        const base = quality(strong) >= quality(cheap) - 1 ? strong : cheap;
        if (base.lot) {
          const diffs = lotDiffs(cheap.lot, strong.lot);
          result = { ...base, lot: { ...base.lot, check: { state: diffs.length ? "differs" : "match", diffs, statedGames: statedGameCount(base) } } };
        } else {
          result = base;
        }
      }
    }
    if (result.lot && !result.lot.check) {
      result = { ...result, lot: { ...result.lot, check: { state: "single", diffs: [], statedGames: statedGameCount(result) } } };
    }

    if (lookupOn && !result.productId && !result.needsModel && result.searchQuery && !(result.candidates?.length)) {
      try {
        let best = { q: result.searchQuery, specs: result.specs ?? [], type: result.deviceType ?? "", lookup: await lookup(result.searchQuery, result.specs ?? [], result.deviceType ?? "") };
        if (!lookupConfident(best.lookup)) {
          const tried = [best.q];
          const retry = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "content-type": "application/json", "x-api-key": cfg.anthropicKey, "anthropic-version": "2023-06-01" },
            body: JSON.stringify(buildRetryRequest(image, tried, cfg.model, lang)),
          });
          if (retry.ok) {
            const { candidates, usage: u2 } = parseRetryResponse(await retry.json());
            hooks.log(`[captura] segunda leitura entrada=${u2.input} saída=${u2.output} candidatos=${candidates.map((c) => c.searchQuery).join(" | ")}`);
            for (const c of candidates) {
              if (tried.some((x) => x.toLowerCase() === c.searchQuery.toLowerCase())) continue;
              tried.push(c.searchQuery);
              const l = await lookup(c.searchQuery, c.specs.length ? c.specs : best.specs, c.deviceType || best.type);
              if (lookupScore(l) > lookupScore(best.lookup)) best = { q: c.searchQuery, specs: c.specs.length ? c.specs : best.specs, type: c.deviceType || best.type, lookup: l };
              if (lookupConfident(best.lookup)) break;
            }
          } else {
            hooks.log(`Claude API (segunda leitura) ${retry.status}`);
          }
        }
        result = { ...result, searchQuery: best.q, specs: best.specs, deviceType: best.type, lookup: best.lookup };
      } catch (e) {
        hooks.log(`busca: ${e instanceof Error ? e.message : e}`);
      }
    }
    return { result, usage };
  }

  return { capture, lookup, visionOn, lookupOn, ebayErrors: EbayError };
}

export type Core = ReturnType<typeof createCore>;
