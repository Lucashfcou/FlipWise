// Servidor local de leitura de prints. Guarda a chave fora do app e limita o uso para não haver surpresas na fatura.
//   PowerShell:  $env:ANTHROPIC_API_KEY="..." ; npm run capture:server
// Sem chave, arranca na mesma e responde "desativado": nada é enviado a lado nenhum, nada custa.
// Na Vercel o mesmo núcleo (server/core.ts) corre nas funções de api-src/, com login e limites por utilizador.
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { cleanDeviceType, cleanLookupQuery, cleanSpecs } from "../src/ebay/lookup";
import { MAX_IMAGE_BYTES } from "../src/capture/vision";
import { ServiceError, configFromEnv, createCore } from "./core";
import type { QuotaKind } from "./core";

// As chaves vêm do ficheiro .env (fora do git), se existir.
if (existsSync(".env")) process.loadEnvFile(".env");

const PORT = Number(process.env.CAPTURE_PORT ?? 8787);
/** Máximo de leituras por dia (reinicia ao reiniciar o servidor). Protege a fatura. */
const DAILY_LIMIT = Number(process.env.CAPTURE_DAILY_LIMIT ?? 20);
const PER_MINUTE = 6;
const SMART_DAILY_LIMIT = Number(process.env.SMART_DAILY_LIMIT ?? 10);
const LOOKUP_DAILY_LIMIT = Number(process.env.LOOKUP_DAILY_LIMIT ?? 100);
const LOOKUP_PER_MINUTE = 20;

const cfg = configFromEnv(process.env);

let day = new Date().toISOString().slice(0, 10);
const used: Record<"read" | QuotaKind, number> = { read: 0, smart: 0, lookup: 0 };
let recent: number[] = [];
let recentLookups: number[] = [];

const LIMITS: Record<QuotaKind, number> = { smart: SMART_DAILY_LIMIT, lookup: LOOKUP_DAILY_LIMIT };

const core = createCore(cfg, {
  quota(kind) {
    if (used[kind] >= LIMITS[kind]) return false;
    if (kind === "lookup") {
      const now = Date.now();
      recentLookups = recentLookups.filter((t) => now - t < 60_000);
      if (recentLookups.length >= LOOKUP_PER_MINUTE) return false;
      recentLookups.push(now);
    }
    used[kind]++;
    return true;
  },
  log: (m) => console.log(`${m}  [hoje: leituras ${used.read}/${DAILY_LIMIT}, fortes ${used.smart}/${SMART_DAILY_LIMIT}, buscas ${used.lookup}/${LOOKUP_DAILY_LIMIT}]`),
});

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
    used.read = used.smart = used.lookup = 0;
  }

  if (req.method === "GET" && req.url === "/api/capture/status") {
    return send(res, 200, { enabled: core.visionOn, dailyLimit: DAILY_LIMIT, usedToday: used.read, lookup: core.lookupOn });
  }

  if (req.method === "POST" && req.url === "/api/lookup") {
    if (!(req.headers["content-type"] ?? "").startsWith("application/json")) return send(res, 415, { error: "Tipo de pedido inválido." });
    try {
      const { q, specs: rawSpecs, deviceType: rawType } = JSON.parse(await readBody(req, 2000)) as { q?: unknown; specs?: unknown; deviceType?: unknown };
      const query = cleanLookupQuery(q);
      if (!query) return send(res, 400, { error: "Nome do produto inválido." });
      return send(res, 200, { result: await core.lookup(query, cleanSpecs(rawSpecs), cleanDeviceType(rawType)) });
    } catch (e) {
      if (e instanceof ServiceError) return send(res, e.status, { error: e.message });
      console.error(`busca: ${e instanceof Error ? e.message : e}`);
      return send(res, 502, { error: "A busca no eBay falhou. Tenta outra vez." });
    }
  }

  if (req.method === "POST" && req.url === "/api/capture") {
    if (!(req.headers["content-type"] ?? "").startsWith("application/json")) return send(res, 415, { error: "Tipo de pedido inválido." });
    if (!core.visionOn) return send(res, 503, { error: "Leitura por print desativada: falta ANTHROPIC_API_KEY no servidor." });
    if (used.read >= DAILY_LIMIT) return send(res, 429, { error: `Limite diário de ${DAILY_LIMIT} leituras atingido.` });
    const now = Date.now();
    recent = recent.filter((t) => now - t < 60_000);
    if (recent.length >= PER_MINUTE) return send(res, 429, { error: "Demasiadas leituras seguidas. Espera um minuto." });

    try {
      const { image, lang } = JSON.parse(await readBody(req, MAX_IMAGE_BYTES * 1.5)) as { image?: string; lang?: string };
      if (typeof image !== "string") return send(res, 400, { error: "Falta a imagem." });
      recent.push(now);
      used.read++;
      try {
        const { result, usage } = await core.capture(image, lang === "en" ? "en" : "pt");
        console.log(`[captura] entrada=${usage.input} saída=${usage.output} hoje=${used.read}/${DAILY_LIMIT}`);
        return send(res, 200, { result, usage, usedToday: used.read, dailyLimit: DAILY_LIMIT });
      } catch (e) {
        used.read--; // chamada falhada não conta para o limite
        if (e instanceof ServiceError) return send(res, e.status, { error: e.message });
        throw e;
      }
    } catch (e) {
      return send(res, 400, { error: e instanceof Error ? e.message : "Pedido inválido." });
    }
  }

  send(res, 404, { error: "Não encontrado." });
});

// Só aceita ligações da própria máquina.
server.listen(PORT, "127.0.0.1", () => {
  console.log(`Captura em http://127.0.0.1:${PORT}  (${core.visionOn ? `ativa, modelo ${cfg.model}, limite ${DAILY_LIMIT}/dia` : "DESATIVADA: sem ANTHROPIC_API_KEY"})`);
});
