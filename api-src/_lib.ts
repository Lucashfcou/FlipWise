import { AsyncLocalStorage } from "node:async_hooks";
import type { IncomingMessage, ServerResponse } from "node:http";
import { ServiceError, configFromEnv, createCore } from "../server/core";
import type { QuotaKind } from "../server/core";
import { consume, loadAccount, refund, supabaseEnv, supabaseReady, userFromToken } from "../server/supabase";
import type { Account } from "../server/supabase";

/**
 * Peças partilhadas pelas funções da Vercel: resposta JSON, login obrigatório, e o núcleo ligado aos limites por utilizador
 * no Supabase. As funções são empacotadas por scripts/build-api.mjs em api/*.mjs.
 */
export type Req = IncomingMessage & { body?: unknown };
export type Res = ServerResponse;

export const sb = supabaseEnv(process.env);
export const cfg = configFromEnv(process.env);

/** Quem está a chamar neste pedido (o núcleo é partilhado entre pedidos da mesma instância). */
const who = new AsyncLocalStorage<{ userId: string }>();
export const withUser = <T>(userId: string, fn: () => Promise<T>) => who.run({ userId }, fn);

const KIND: Record<QuotaKind, "smart" | "lookup"> = { smart: "smart", lookup: "lookup" };

const perMinute = new Map<string, number[]>();
/** Limite por minuto, por utilizador (por instância: serve de travão, o limite real está no Supabase). */
export function rate(userId: string, bucket: string, max: number): boolean {
  const key = `${userId}|${bucket}`;
  const now = Date.now();
  const list = (perMinute.get(key) ?? []).filter((t) => now - t < 60_000);
  if (list.length >= max) return false;
  list.push(now);
  perMinute.set(key, list);
  if (perMinute.size > 2000) perMinute.clear();
  return true;
}

export const core = createCore(cfg, {
  async quota(kind) {
    const ctx = who.getStore();
    if (!ctx) return false;
    if (kind === "lookup" && !rate(ctx.userId, "lookup", 20)) return false;
    return consume(sb, ctx.userId, KIND[kind]);
  },
  log: (m) => console.log(m),
});

export function send(res: Res, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

/** JSON do pedido (a Vercel já o interpreta). */
export function jsonBody<T>(req: Req): T | null {
  const b = req.body;
  if (b && typeof b === "object") return b as T;
  if (typeof b === "string") {
    try {
      return JSON.parse(b) as T;
    } catch {
      return null;
    }
  }
  return null;
}

/** Exige login: devolve a conta (plano, limites, uso) ou responde 401 e devolve null. */
export async function requireAccount(req: Req, res: Res): Promise<Account | null> {
  if (!supabaseReady(sb)) {
    send(res, 503, { error: "Contas ainda não configuradas no servidor." });
    return null;
  }
  const auth = String(req.headers.authorization ?? "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const user = await userFromToken(sb, token);
  if (!user) {
    send(res, 401, { error: "Entra na tua conta para usar a leitura por print.", loginRequired: true });
    return null;
  }
  return loadAccount(sb, user);
}

export { ServiceError, consume, refund };
