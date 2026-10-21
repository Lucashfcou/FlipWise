// Servidor local de leitura de prints. Guarda a chave fora do app e limita o uso para não haver surpresas na fatura.
//   PowerShell:  $env:ANTHROPIC_API_KEY="..." ; npm run capture:server
// Sem chave, arranca na mesma e responde "desativado": nada é enviado a lado nenhum, nada custa.
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { EbayError, MARKETPLACES, getToken } from "../src/ebay/client";
import type { MarketplaceId } from "../src/ebay/client";
import { cleanDeviceType, cleanLookupQuery, cleanSpecs, lookupConfident, lookupScore, runLookup } from "../src/ebay/lookup";
import type { LookupResult } from "../src/ebay/lookup";
import type { CaptureResult } from "../src/capture/types";
import { DEFAULT_MODEL, MAX_IMAGE_BYTES, buildRetryRequest, buildVisionRequest, parseRetryResponse, parseVisionResponse } from "../src/capture/vision";

// As chaves vêm do ficheiro .env (fora do git), se existir.
if (existsSync(".env")) process.loadEnvFile(".env");

const PORT = Number(process.env.CAPTURE_PORT ?? 8787);
const KEY = process.env.ANTHROPIC_API_KEY ?? "";
const MODEL = process.env.CAPTURE_MODEL ?? DEFAULT_MODEL;
/** Máximo de leituras por dia (reinicia ao reiniciar o servidor). Protege a fatura. */
const DAILY_LIMIT = Number(process.env.CAPTURE_DAILY_LIMIT ?? 20);
const PER_MINUTE = 6;
/** Modelo mais forte, só para anúncios difíceis (baixa confiança, falta o modelo). Vazio desliga. */
const SMART_MODEL = process.env.SMART_MODEL ?? "claude-sonnet-5-5";
const SMART_DAILY_LIMIT = Number(process.env.SMART_DAILY_LIMIT ?? 10);
let smartToday = 0;
/** Países do eBay, por ordem: passa ao seguinte quando o anterior não dá resultado fiável. */
const LOOKUP_SITES = (process.env.LOOKUP_SITES ?? "EBAY_ES,EBAY_DE,EBAY_FR,EBAY_IT")
  .split(",")
  .map((x) => x.trim())
  .filter((x): x is MarketplaceId => x in MARKETPLACES);

// Busca no eBay para produtos fora do catálogo (precisa das chaves do eBay no .env).
const EBAY_ID = process.env.EBAY_CLIENT_ID ?? "";
const EBAY_SECRET = process.env.EBAY_CLIENT_SECRET ?? "";
const LOOKUP_ON = Boolean(EBAY_ID && EBAY_SECRET);
const LOOKUP_SITE = ((process.env.EBAY_SITES ?? "EBAY_ES").split(",")[0].trim() as MarketplaceId) in MARKETPLACES ? ((process.env.EBAY_SITES ?? "EBAY_ES").split(",")[0].trim() as MarketplaceId) : "EBAY_ES";
const LOOKUP_DAILY_LIMIT = Number(process.env.LOOKUP_DAILY_LIMIT ?? 100);
let lookupsToday = 0;
let ebayToken: { value: string; until: number } | null = null;
const lookupCache = new Map<string, { at: number; result: unknown }>();
const CACHE_MS = 6 * 60 * 60 * 1000;

/** Busca com cache de 6 h e limite diário. */
async function doLookup(query: string, specs: string[], deviceType: string): Promise<LookupResult | null> {
  const key = `${query.toLowerCase()}|${specs.join(",").toLowerCase()}|${deviceType.toLowerCase()}`;
  const hit = lookupCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.result as LookupResult | null;
  if (lookupsToday >= LOOKUP_DAILY_LIMIT) throw new Error(`Limite diário de ${LOOKUP_DAILY_LIMIT} buscas atingido.`);
  lookupsToday++;
  const token = await tokenForLookup();
  let result: LookupResult | null = null;
  for (const site of LOOKUP_SITES.length ? LOOKUP_SITES : [LOOKUP_SITE]) {
    const r = await runLookup(token, site, query, { specs, deviceType });
    if (lookupScore(r) > lookupScore(result)) result = r;
    if (lookupConfident(result)) break;
  }
  lookupCache.set(key, { at: Date.now(), result });
  console.log(`[busca] "${query}" ${specs.join("/")} -> ${result ? result.n + " anúncios, mediana " + result.median + " (" + result.site + " " + result.basis + ", " + (result.category ?? "sem categoria") + ", " + result.reliability + ")" : "sem resultado fiável"} (hoje ${lookupsToday}/${LOOKUP_DAILY_LIMIT})`);
  return result;
}

async function tokenForLookup(): Promise<string> {
  if (ebayToken && ebayToken.until > Date.now() + 60_000) return ebayToken.value;
  const { token, expiresIn } = await getToken({ clientId: EBAY_ID, clientSecret: EBAY_SECRET });
  ebayToken = { value: token, until: Date.now() + expiresIn * 1000 };
  return token;
}

let day = new Date().toISOString().slice(0, 10);
let usedToday = 0;
let recent: number[] = [];

function send(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req: import("node:http").IncomingMessage, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > max) {
        reject(new Error("Pedido demasiado grande."));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** Só pedidos vindos da própria máquina: bloqueia páginas de outros sites (CSRF) e DNS rebinding. */
const LOCAL_ONLY = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
// Teste no celular (npm run phone): aceita também endereços de rede privada (a tua rede Wi-Fi). Desligado por omissão.
const LAN = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
// Túnel temporário para testar fora de casa: só aceita o nome exato indicado em CAPTURE_EXTRA_HOST.
const EXTRA = (process.env.CAPTURE_EXTRA_HOST ?? "").toLowerCase();
const LOCAL = {
  test: (h: string) =>
    LOCAL_ONLY.test(h) || (process.env.CAPTURE_LAN === "1" && LAN.test(h)) || (EXTRA !== "" && h.toLowerCase() === EXTRA),
};
function fromLocal(req: import("node:http").IncomingMessage): boolean {
  if (!LOCAL.test(req.headers.host ?? "")) return false;
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (!LOCAL.test(new URL(origin).host)) return false;
    } catch {
      return false;
    }
  }
  return true;
}

async function callVision(image: string, model: string, lang: "pt" | "en"): Promise<{ result: CaptureResult; usage: { input: number; output: number } }> {
  const api = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify(buildVisionRequest(image, model, lang, model === MODEL)),
  });
  if (!api.ok) {
    console.error(`Claude API ${api.status} (${model}): ${(await api.text()).slice(0, 300)}`);
    throw new Error("O serviço de leitura falhou. Tenta outra vez.");
  }
  return parseVisionResponse(await api.json());
}

const quality = (r: CaptureResult) =>
  (r.productId ? 3 : 0) + (r.searchQuery && !r.needsModel ? 2 : 0) + (r.confidence === "alta" ? 2 : r.confidence === "media" ? 1 : 0) - r.problems.filter((p) => p.severity === "erro").length * 2;

const server = createServer(async (req, res) => {
  if (!fromLocal(req)) return send(res, 403, { error: "Origem não permitida." });
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    usedToday = 0;
    lookupsToday = 0;
    smartToday = 0;
  }

  if (req.method === "GET" && req.url === "/api/capture/status") {
    return send(res, 200, { enabled: Boolean(KEY), dailyLimit: DAILY_LIMIT, usedToday, lookup: LOOKUP_ON });
  }

  if (req.method === "POST" && req.url === "/api/lookup") {
    if (!LOOKUP_ON) return send(res, 503, { error: "Busca de preços desativada: faltam as chaves do eBay no servidor." });
    if (!(req.headers["content-type"] ?? "").startsWith("application/json")) return send(res, 415, { error: "Tipo de pedido inválido." });
    try {
      const { q, specs: rawSpecs, deviceType: rawType } = JSON.parse(await readBody(req, 2000)) as { q?: unknown; specs?: unknown; deviceType?: unknown };
      const query = cleanLookupQuery(q);
      if (!query) return send(res, 400, { error: "Nome do produto inválido." });
      const specs = cleanSpecs(rawSpecs);
      const deviceType = cleanDeviceType(rawType);
      const result = await doLookup(query, specs, deviceType);
      return send(res, 200, { result });
    } catch (e) {
      if (e instanceof EbayError) console.error(`eBay: ${e.message}`);
      return send(res, 502, { error: "A busca no eBay falhou. Tenta outra vez." });
    }
  }

  if (req.method === "POST" && req.url === "/api/capture") {
    if (!(req.headers["content-type"] ?? "").startsWith("application/json")) return send(res, 415, { error: "Tipo de pedido inválido." });
    if (!KEY) return send(res, 503, { error: "Leitura por print desativada: falta ANTHROPIC_API_KEY no servidor." });
    if (usedToday >= DAILY_LIMIT) return send(res, 429, { error: `Limite diário de ${DAILY_LIMIT} leituras atingido.` });
    const now = Date.now();
    recent = recent.filter((t) => now - t < 60_000);
    if (recent.length >= PER_MINUTE) return send(res, 429, { error: "Demasiadas leituras seguidas. Espera um minuto." });

    try {
      const raw = await readBody(req, MAX_IMAGE_BYTES * 1.5);
      const { image, lang } = JSON.parse(raw) as { image?: string; lang?: string };
      if (typeof image !== "string") return send(res, 400, { error: "Falta a imagem." });
      const lg: "pt" | "en" = lang === "en" ? "en" : "pt";

      recent.push(now);
      usedToday++;
      let first;
      try {
        first = await callVision(image, MODEL, lg);
      } catch (e) {
        usedToday--; // chamada falhada não conta para o limite
        return send(res, 502, { error: e instanceof Error ? e.message : "A leitura falhou." });
      }
      let { result, usage } = first;

      // Anúncio difícil (baixa confiança, falta o modelo): repete com o modelo mais forte.
      const hard = (r: CaptureResult) => r.imageType === "anuncio" && (r.confidence === "baixa" || r.needsModel === true || (!r.productId && !r.searchQuery));
      if (SMART_MODEL && hard(result) && smartToday < SMART_DAILY_LIMIT) {
        smartToday++;
        try {
          const second = await callVision(image, SMART_MODEL, lg);
          console.log(`[captura] modelo forte ${SMART_MODEL} entrada=${second.usage.input} saída=${second.usage.output} (${quality(result)} -> ${quality(second.result)}) hoje=${smartToday}/${SMART_DAILY_LIMIT}`);
          if (quality(second.result) > quality(result)) result = second.result;
        } catch {
          /* mantém a primeira leitura */
        }
      }

      // Fora do catálogo e com o modelo conhecido: busca no eBay; se não for fiável, a IA reanalisa a imagem e propõe outros nomes.
      if (LOOKUP_ON && !result.productId && !result.needsModel && result.searchQuery && !(result.candidates?.length)) {
        try {
          let best = { q: result.searchQuery, specs: result.specs ?? [], type: result.deviceType ?? "", lookup: await doLookup(result.searchQuery, result.specs ?? [], result.deviceType ?? "") };
          if (!lookupConfident(best.lookup) && usedToday < DAILY_LIMIT) {
            const tried = [best.q];
            usedToday++;
            const retry = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
              body: JSON.stringify(buildRetryRequest(image, tried, MODEL, lg)),
            });
            if (retry.ok) {
              const { candidates, usage: u2 } = parseRetryResponse(await retry.json());
              console.log(`[captura] segunda leitura entrada=${u2.input} saída=${u2.output} candidatos=${candidates.map((c) => c.searchQuery).join(" | ")}`);
              for (const c of candidates) {
                if (tried.some((x) => x.toLowerCase() === c.searchQuery.toLowerCase())) continue;
                tried.push(c.searchQuery);
                const l = await doLookup(c.searchQuery, c.specs.length ? c.specs : best.specs, c.deviceType || best.type);
                if (lookupScore(l) > lookupScore(best.lookup)) best = { q: c.searchQuery, specs: c.specs.length ? c.specs : best.specs, type: c.deviceType || best.type, lookup: l };
                if (lookupConfident(best.lookup)) break;
              }
            } else {
              usedToday--;
              console.error(`Claude API (segunda leitura) ${retry.status}`);
            }
          }
          result = { ...result, searchQuery: best.q, specs: best.specs, deviceType: best.type, lookup: best.lookup };
        } catch (e) {
          console.error(`busca: ${e instanceof Error ? e.message : e}`);
        }
      }
      // Para medir o custo real por leitura: tokens de entrada e saída de cada pedido.
      console.log(`[captura] modelo=${MODEL} entrada=${usage.input} saída=${usage.output} hoje=${usedToday}/${DAILY_LIMIT}`);
      return send(res, 200, { result, usage, usedToday, dailyLimit: DAILY_LIMIT });
    } catch (e) {
      return send(res, 400, { error: e instanceof Error ? e.message : "Pedido inválido." });
    }
  }

  send(res, 404, { error: "Não encontrado." });
});

// Só aceita ligações da própria máquina.
server.listen(PORT, "127.0.0.1", () => {
  console.log(`Captura em http://127.0.0.1:${PORT}  (${KEY ? `ativa, modelo ${MODEL}, limite ${DAILY_LIMIT}/dia` : "DESATIVADA: sem ANTHROPIC_API_KEY"})`);
});
