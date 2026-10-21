import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente do Supabase no navegador. A chave "anon" é pública por desenho (a segurança está nas regras do banco);
 * a chave "service role" nunca entra aqui. Sem as duas variáveis o app funciona sem contas (modo demo da leitura).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const authConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null = authConfigured
  ? createClient(url as string, key as string, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

/** Token de acesso atual (para o servidor confirmar quem é). null = sem sessão. */
export async function accessToken(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}
