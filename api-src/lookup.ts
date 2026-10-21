import { cleanDeviceType, cleanLookupQuery, cleanSpecs } from "../src/ebay/lookup";
import { ServiceError, core, jsonBody, requireAccount, send, withUser } from "./_lib";
import type { Req, Res } from "./_lib";

/** POST /api/lookup: preços do eBay para um nome (botões de modelo, nome corrigido à mão). Exige login e plano com buscas. */
export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });
  const acct = await requireAccount(req, res);
  if (!acct) return;
  if (!core.lookupOn) return send(res, 503, { error: "Busca de preços desativada no servidor." });
  if (acct.limits.lookups <= 0) return send(res, 403, { error: "A busca fora do catálogo é do plano Pro.", upgrade: true });

  const body = jsonBody<{ q?: unknown; specs?: unknown; deviceType?: unknown }>(req);
  const query = cleanLookupQuery(body?.q);
  if (!body || !query) return send(res, 400, { error: "Nome do produto inválido." });
  try {
    const result = await withUser(acct.id, () => core.lookup(query, cleanSpecs(body.specs), cleanDeviceType(body.deviceType)));
    return send(res, 200, { result });
  } catch (e) {
    if (e instanceof ServiceError) return send(res, e.status, { error: e.message });
    console.error(`busca: ${e instanceof Error ? e.message : e}`);
    return send(res, 502, { error: "A busca no eBay falhou. Tenta outra vez." });
  }
}
