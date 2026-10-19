// Servidor local de leitura de prints. Guarda a chave fora do app e limita o uso para não haver surpresas na fatura.
//   PowerShell:  $env:ANTHROPIC_API_KEY="..." ; npm run capture:server
// Sem chave, arranca na mesma e responde "desativado": nada é enviado a lado nenhum, nada custa.
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { EbayError, MARKETPLACES, getToken } from "../src/ebay/client";
import type { MarketplaceId } from "../src/ebay/client";
import { cleanLookupQuery, runLookup } from "../src/ebay/lookup";
import { DEFAULT_MODEL, MAX_IMAGE_BYTES, buildVisionRequest, parseVisionResponse } from "../src/capture/vision";

// As chaves vêm do ficheiro .env (fora do git), se existir.
if (existsSync(".env")) process.loadEnvFile(".env");

const PORT = Number(process.env.CAPTURE_PORT ?? 8787);
const KEY = process.env.ANTHROPIC_API_KEY ?? "";
const MODEL = process.env.CAPTURE_MODEL ?? DEFAULT_MODEL;
/** Máximo de leituras por dia (reinicia ao reiniciar o servidor). Protege a fatura. */
const DAILY_LIMIT = Number(process.env.CAPTURE_DAILY_LIMIT ?? 20);
const PER_MINUTE = 6;

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

const server = createServer(async (req, res) => {
  if (!fromLocal(req)) return send(res, 403, { error: "Origem não permitida." });
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    usedToday = 0;
    lookupsToday = 0;
  }

  if (req.method === "GET" && req.url === "/api/capture/status") {
    return send(res, 200, { enabled: Boolean(KEY), dailyLimit: DAILY_LIMIT, usedToday, lookup: LOOKUP_ON });
  }

  if (req.method === "POST" && req.url === "/api/lookup") {
    if (!LOOKUP_ON) return send(res, 503, { error: "Busca de preços desativada: faltam as chaves do eBay no servidor." });
    if (!(req.headers["content-type"] ?? "").startsWith("application/json")) return send(res, 415, { error: "Tipo de pedido inválido." });
    try {
      const { q } = JSON.parse(await readBody(req, 2000)) as { q?: unknown };
      const query = cleanLookupQuery(q);
      if (!query) return send(res, 400, { error: "Nome do produto inválido." });
      const key = query.toLowerCase();
      const hit = lookupCache.get(key);
      if (hit && Date.now() - hit.at < CACHE_MS) return send(res, 200, { result: hit.result, cached: true });
      if (lookupsToday >= LOOKUP_DAILY_LIMIT) return send(res, 429, { error: `Limite diário de ${LOOKUP_DAILY_LIMIT} buscas atingido.` });
      lookupsToday++;
      const result = await runLookup(await tokenForLookup(), LOOKUP_SITE, query);
      lookupCache.set(key, { at: Date.now(), result });
      console.log(`[busca] "${query}" -> ${result ? result.n + " anúncios, mediana " + result.median : "poucos anúncios"} (hoje ${lookupsToday}/${LOOKUP_DAILY_LIMIT})`);
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
      const body = buildVisionRequest(image, MODEL, lang === "en" ? "en" : "pt");

      recent.push(now);
      usedToday++;
      const api = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify(body),
      });
      if (!api.ok) {
        usedToday--; // chamada falhada não conta para o limite
        console.error(`Claude API ${api.status}: ${(await api.text()).slice(0, 300)}`);
        return send(res, 502, { error: "O serviço de leitura falhou. Tenta outra vez." });
      }
      const { result, usage } = parseVisionResponse(await api.json());
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
