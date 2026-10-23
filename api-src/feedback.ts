import { saveFeedback, supabaseReady, userFromToken } from "../server/supabase";
import { jsonBody, rate, sb, send } from "./_lib";
import type { Req, Res } from "./_lib";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** POST /api/feedback: mensagem dos testadores. Login opcional (se houver, guarda quem é); limite por IP contra abuso. */
export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });
  if (!supabaseReady(sb)) return send(res, 503, { error: "Feedback ainda não está ligado no servidor." });

  const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "?").split(",")[0].trim();
  if (!rate(ip, "feedback", 3)) return send(res, 429, { error: "Muitas mensagens seguidas. Tenta daqui a um minuto." });

  const body = jsonBody<{ message?: unknown; contact?: unknown; lang?: unknown; page?: unknown }>(req);
  const message = clean(body?.message, 2000);
  if (message.length < 3) return send(res, 400, { error: "Escreve pelo menos uma frase." });

  const auth = String(req.headers.authorization ?? "");
  const user = auth.startsWith("Bearer ") ? await userFromToken(sb, auth.slice(7).trim()) : null;
  try {
    await saveFeedback(sb, {
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      message,
      contact: clean(body?.contact, 120) || null,
      lang: clean(body?.lang, 5) || "",
      page: clean(body?.page, 40) || "",
    });
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error(`feedback: ${e instanceof Error ? e.message : e}`);
    return send(res, 502, { error: "Não foi possível enviar agora. Tenta outra vez." });
  }
}
