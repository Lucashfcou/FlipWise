import { deleteUser, supabaseReady, userFromToken } from "../server/supabase";
import { rate, sb, send } from "./_lib";
import type { Req, Res } from "./_lib";

/** DELETE /api/account: apaga a conta de quem está logado (RGPD). O token tem de ser válido; limite de 3 por minuto. */
export default async function handler(req: Req, res: Res) {
  if (req.method !== "DELETE") return send(res, 405, { error: "Método não permitido." });
  if (!supabaseReady(sb)) return send(res, 503, { error: "Contas ainda não configuradas no servidor." });
  const auth = String(req.headers.authorization ?? "");
  const user = auth.startsWith("Bearer ") ? await userFromToken(sb, auth.slice(7).trim()) : null;
  if (!user) return send(res, 401, { error: "Entra na tua conta para a apagar.", loginRequired: true });
  if (!rate(user.id, "delete", 3)) return send(res, 429, { error: "Tenta daqui a um minuto." });
  try {
    await deleteUser(sb, user.id);
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error(`apagar conta: ${e instanceof Error ? e.message : e}`);
    return send(res, 502, { error: "Não foi possível apagar agora. Tenta outra vez." });
  }
}
