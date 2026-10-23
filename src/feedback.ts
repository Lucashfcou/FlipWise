import { accessToken } from "./auth/supabase";

/** Envia a mensagem do testador. Lança erro com texto legível se falhar. */
export async function sendFeedback(message: string, contact: string, lang: string, page: string): Promise<void> {
  const token = await accessToken();
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ message, contact, lang, page }),
  });
  if (res.ok) return;
  let text = "";
  try {
    text = ((await res.json()) as { error?: string }).error ?? "";
  } catch {
    /* sem corpo JSON */
  }
  throw new Error(text || `HTTP ${res.status}`);
}
