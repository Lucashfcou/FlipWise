import { MAX_IMAGE_BYTES } from "../src/capture/vision";
import { ServiceError, consume, core, jsonBody, rate, refund, requireAccount, send, sb, withUser } from "./_lib";
import type { Req, Res } from "./_lib";

/** POST /api/capture: lê o print de um anúncio. Exige login e plano com leituras; conta uma leitura por pedido. */
export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });
  const acct = await requireAccount(req, res);
  if (!acct) return;
  if (!core.visionOn) return send(res, 503, { error: "Leitura por print desativada no servidor." });
  if (acct.limits.reads <= 0) return send(res, 403, { error: "A leitura por print é do plano Pro. Começa o teste grátis de 1 semana ou assina.", upgrade: true });
  if (!rate(acct.id, "read", 6)) return send(res, 429, { error: "Demasiadas leituras seguidas. Espera um minuto." });

  const body = jsonBody<{ image?: unknown; lang?: unknown }>(req);
  if (!body || typeof body.image !== "string" || body.image.length > MAX_IMAGE_BYTES * 1.4) return send(res, 400, { error: "Imagem em falta ou grande demais." });

  if (!(await consume(sb, acct.id, "read"))) return send(res, 429, { error: `Limite diário de ${acct.limits.reads} leituras atingido.` });
  try {
    const { result, usage } = await withUser(acct.id, () => core.capture(body.image as string, body.lang === "en" ? "en" : "pt"));
    return send(res, 200, { result, usage, usedToday: acct.usage.reads + 1, dailyLimit: acct.limits.reads });
  } catch (e) {
    await refund(sb, acct.id, "read"); // leitura que falhou não conta
    if (e instanceof ServiceError) return send(res, e.status, { error: e.message });
    console.error(`captura: ${e instanceof Error ? e.message : e}`);
    return send(res, 502, { error: "A leitura falhou. Tenta outra vez." });
  }
}
