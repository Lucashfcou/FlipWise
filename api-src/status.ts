import { core, sb, send } from "./_lib";
import type { Req, Res } from "./_lib";
import { loadAccount, supabaseReady, userFromToken } from "../server/supabase";

/** GET /api/capture/status: estado da leitura por print para quem chama (sem login: pede login; sem contas: modo demo). */
export default async function handler(req: Req, res: Res) {
  if (req.method !== "GET") return send(res, 405, { error: "Método não permitido." });
  if (!supabaseReady(sb)) return send(res, 200, { enabled: false });
  const auth = String(req.headers.authorization ?? "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const user = token ? await userFromToken(sb, token) : null;
  if (!user) return send(res, 200, { enabled: false, accounts: true, loginRequired: true });
  const a = await loadAccount(sb, user);
  return send(res, 200, {
    enabled: core.visionOn && a.limits.reads > 0,
    lookup: core.lookupOn && a.limits.lookups > 0,
    accounts: true,
    loginRequired: false,
    upgrade: a.limits.reads <= 0,
    plan: a.plan,
    trialEndsAt: a.trialEndsAt,
    email: a.email,
    dailyLimit: a.limits.reads,
    usedToday: a.usage.reads,
  });
}
