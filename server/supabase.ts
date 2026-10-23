/**
 * Acesso ao Supabase pelo servidor (Vercel), só com fetch: confirma o login de quem chama, lê o plano e consome o uso diário.
 * Variáveis: SUPABASE_URL, SUPABASE_ANON_KEY (confirmar o token) e SUPABASE_SERVICE_ROLE_KEY (plano e uso; segredo, só no servidor).
 */

export interface SupabaseEnv {
  url: string;
  anonKey: string;
  serviceKey: string;
}

export const supabaseEnv = (env: Record<string, string | undefined>): SupabaseEnv => ({
  url: (env.SUPABASE_URL ?? "").replace(/\/$/, ""),
  anonKey: env.SUPABASE_ANON_KEY ?? "",
  serviceKey: env.SUPABASE_SERVICE_ROLE_KEY ?? "",
});

export const supabaseReady = (e: SupabaseEnv) => Boolean(e.url && e.anonKey && e.serviceKey);

export type Plan = "free" | "trial" | "pro";

export interface Account {
  id: string;
  email?: string;
  plan: Plan;
  trialEndsAt: string | null;
  limits: { reads: number; smart: number; lookups: number };
  usage: { reads: number; smart: number; lookups: number };
}

const rest = (e: SupabaseEnv, path: string, init: RequestInit = {}) =>
  fetch(`${e.url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: e.serviceKey, authorization: `Bearer ${e.serviceKey}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });

const seen = new Map<string, { id: string; email?: string; until: number }>();

/** Valida o token de acesso do utilizador no Supabase. null = inválido ou expirado. Guarda 30 s em memória para não repetir a chamada. */
export async function userFromToken(e: SupabaseEnv, token: string): Promise<{ id: string; email?: string } | null> {
  if (!token || token.length > 4000) return null;
  const hit = seen.get(token);
  if (hit && hit.until > Date.now()) return { id: hit.id, email: hit.email };
  const r = await fetch(`${e.url}/auth/v1/user`, { headers: { apikey: e.anonKey, authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = (await r.json()) as { id?: string; email?: string };
  if (!u.id) return null;
  if (seen.size > 500) seen.clear();
  seen.set(token, { id: u.id, email: u.email, until: Date.now() + 30_000 });
  return { id: u.id, email: u.email };
}

const today = () => new Date().toISOString().slice(0, 10);

/** Plano efetivo (um teste que acabou conta como grátis), limites e uso de hoje. */
export async function loadAccount(e: SupabaseEnv, user: { id: string; email?: string }): Promise<Account> {
  const pr = await rest(e, `profiles?id=eq.${encodeURIComponent(user.id)}&select=plan,trial_ends_at`);
  const prof = ((await pr.json()) as { plan: Plan; trial_ends_at: string | null }[])[0];
  let plan: Plan = prof?.plan ?? "free";
  if (plan === "trial" && (!prof?.trial_ends_at || new Date(prof.trial_ends_at).getTime() < Date.now())) plan = "free";

  const lr = await rest(e, `plan_limits?plan=eq.${plan}&select=reads_per_day,smart_per_day,lookups_per_day`);
  const lim = ((await lr.json()) as { reads_per_day: number; smart_per_day: number; lookups_per_day: number }[])[0];
  const ur = await rest(e, `usage_daily?user_id=eq.${encodeURIComponent(user.id)}&day=eq.${today()}&select=reads,smart,lookups`);
  const use = ((await ur.json()) as { reads: number; smart: number; lookups: number }[])[0];
  return {
    id: user.id,
    email: user.email,
    plan,
    trialEndsAt: prof?.trial_ends_at ?? null,
    limits: { reads: lim?.reads_per_day ?? 0, smart: lim?.smart_per_day ?? 0, lookups: lim?.lookups_per_day ?? 0 },
    usage: { reads: use?.reads ?? 0, smart: use?.smart ?? 0, lookups: use?.lookups ?? 0 },
  };
}

/** Consome uma unidade de forma atómica (a função SQL consume_usage). true = havia quota. */
export async function consume(e: SupabaseEnv, userId: string, kind: "read" | "smart" | "lookup"): Promise<boolean> {
  const r = await rest(e, "rpc/consume_usage", { method: "POST", body: JSON.stringify({ p_user: userId, p_kind: kind }) });
  if (!r.ok) throw new Error(`Supabase consume_usage ${r.status}`);
  return (await r.json()) === true;
}

export async function refund(e: SupabaseEnv, userId: string, kind: "read" | "smart" | "lookup"): Promise<void> {
  await rest(e, "rpc/refund_usage", { method: "POST", body: JSON.stringify({ p_user: userId, p_kind: kind }) });
}

/** Guarda uma mensagem de feedback (tabela feedback; só o servidor escreve). */
export async function saveFeedback(
  e: SupabaseEnv,
  row: { user_id: string | null; email: string | null; message: string; contact: string | null; lang: string; page: string },
): Promise<void> {
  const r = await rest(e, "feedback", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify(row) });
  if (!r.ok) throw new Error(`Supabase feedback ${r.status}`);
}
