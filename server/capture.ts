// Servidor local de leitura de prints. Guarda a chave fora do app e limita o uso para não haver surpresas na fatura.
//   PowerShell:  $env:ANTHROPIC_API_KEY="..." ; npm run capture:server
// Sem chave, arranca na mesma e responde "desativado": nada é enviado a lado nenhum, nada custa.
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { DEFAULT_MODEL, MAX_IMAGE_BYTES, buildVisionRequest, parseVisionResponse } from "../src/capture/vision";

// As chaves vêm do ficheiro .env (fora do git), se existir.
if (existsSync(".env")) process.loadEnvFile(".env");

const PORT = Number(process.env.CAPTURE_PORT ?? 8787);
const KEY = process.env.ANTHROPIC_API_KEY ?? "";
const MODEL = process.env.CAPTURE_MODEL ?? DEFAULT_MODEL;
/** Máximo de leituras por dia (reinicia ao reiniciar o servidor). Protege a fatura. */
const DAILY_LIMIT = Number(process.env.CAPTURE_DAILY_LIMIT ?? 20);
const PER_MINUTE = 6;

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
const LOCAL = /^(localhost|127.0.0.1|[::1])(:d+)?$/;
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
  }

  if (req.method === "GET" && req.url === "/api/capture/status") {
    return send(res, 200, { enabled: Boolean(KEY), dailyLimit: DAILY_LIMIT, usedToday });
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
      const { image } = JSON.parse(raw) as { image?: string };
      if (typeof image !== "string") return send(res, 400, { error: "Falta a imagem." });
      const body = buildVisionRequest(image, MODEL);

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
