import { useEffect, useState } from "react";
import { captureStatus } from "../capture/client";
import type { CaptureStatus } from "../capture/types";
import { t } from "../i18n";
import { useAuth } from "./AuthProvider";
import { accessToken } from "./supabase";

/** O botão do Google só aparece com VITE_AUTH_GOOGLE=1 (depois de ligar o provedor no Supabase). */
const GOOGLE_ON = import.meta.env.VITE_AUTH_GOOGLE === "1";

/** Entrar (e-mail com link ou Google). Sem as variáveis do Supabase não aparece nada. */
export function LoginPanel({ compact = false }: { compact?: boolean }) {
  const { configured, signInEmail, signInGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  if (!configured) return null;

  async function send() {
    setError("");
    setState("sending");
    try {
      await signInEmail(email.trim());
      setState("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.error"));
      setState("idle");
    }
  }

  return (
    <div className={compact ? "" : "panel"}>
      {!compact && <strong>{t("auth.signIn")}</strong>}
      <p className="hint">{t("auth.why")}</p>
      {state === "sent" ? (
        <p className="note" role="status">{t("auth.sent", { email })}</p>
      ) : (
        <>
          <label className="label" htmlFor="auth-email">{t("auth.email")}</label>
          <input
            id="auth-email"
            className="field"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="nome@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && /\S+@\S+\.\S+/.test(email) && send()}
          />
          <div className="actions">
            <button className="btn primary" onClick={send} disabled={state === "sending" || !/\S+@\S+\.\S+/.test(email)}>
              {state === "sending" ? t("auth.sending") : t("auth.sendLink")}
            </button>
            {GOOGLE_ON && (
              <button className="btn ghost" onClick={() => signInGoogle().catch((e) => setError(e instanceof Error ? e.message : t("auth.error")))}>
                {t("auth.google")}
              </button>
            )}
          </div>
        </>
      )}
      {error && <p className="loss" role="alert">{error}</p>}
    </div>
  );
}

/** Conta: quem és, plano, dias de teste, uso de hoje, sair. */
export function AccountPanel() {
  const { configured, loading, user, signOut } = useAuth();
  const [status, setStatus] = useState<CaptureStatus | null>(null);
  useEffect(() => {
    if (user) captureStatus().then(setStatus);
    else setStatus(null);
  }, [user?.id]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  if (!configured) return null;
  if (loading) return <p className="hint">{t("auth.loading")}</p>;
  if (!user) return <LoginPanel />;

  async function deleteAccount() {
    if (!confirm(t("account.deleteConfirm"))) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const token = await accessToken();
      const res = await fetch("/api/account", { method: "DELETE", headers: token ? { authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error();
      await signOut();
    } catch {
      setDeleteError(t("account.deleteError"));
    } finally {
      setDeleting(false);
    }
  }

  const days = status?.trialEndsAt ? Math.max(0, Math.ceil((new Date(status.trialEndsAt).getTime() - Date.now()) / 86_400_000)) : 0;
  return (
    <div className="panel">
      <strong>{t("auth.account")}</strong>
      <p className="hint">{user.email}</p>
      {status?.plan && (
        <p>
          {status.plan === "pro" ? t("auth.planPro") : status.plan === "trial" ? t("auth.planTrial", { days }) : t("auth.planFree")}
          {status.enabled && status.dailyLimit ? " · " + t("auth.usage", { used: status.usedToday ?? 0, limit: status.dailyLimit }) : ""}
        </p>
      )}
      <div className="actions">
        <button className="btn ghost" onClick={() => signOut()}>{t("auth.signOut")}</button>
        <button className="btn ghost" disabled={deleting} onClick={deleteAccount}>{deleting ? t("account.deleting") : t("account.delete")}</button>
      </div>
      {deleteError && <p className="loss" role="alert">{deleteError}</p>}
    </div>
  );
}
