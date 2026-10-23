import { useState } from "react";
import { sendFeedback } from "../feedback";
import { t } from "../i18n";
import { useApp } from "../state";

/** Caixa de feedback para os testadores: texto livre e um contacto opcional. */
export function Feedback({ page }: { page: string }) {
  const { settings } = useApp();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function send() {
    setError("");
    setState("sending");
    try {
      await sendFeedback(message.trim(), contact.trim(), settings.lang, page);
      setState("sent");
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("feedback.error"));
      setState("idle");
    }
  }

  if (!open) {
    return (
      <button
        className="btn ghost"
        onClick={() => {
          setOpen(true);
          setState("idle");
        }}
      >
        {t("feedback.open")}
      </button>
    );
  }
  return (
    <div className="panel">
      <strong>{t("feedback.title")}</strong>
      <p className="hint">{t("feedback.hint")}</p>
      {state === "sent" ? (
        <>
          <p className="note" role="status">{t("feedback.thanks")}</p>
          <div className="actions">
            <button className="btn ghost" onClick={() => setOpen(false)}>{t("feedback.close")}</button>
          </div>
        </>
      ) : (
        <>
          <label className="label" htmlFor="fb-msg">{t("feedback.message")}</label>
          <textarea id="fb-msg" className="field" rows={4} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("feedback.placeholder")} />
          <label className="label" htmlFor="fb-contact">{t("feedback.contact")}</label>
          <input id="fb-contact" className="field" maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t("feedback.contactHint")} />
          {error && <p className="loss" role="alert">{error}</p>}
          <div className="actions">
            <button className="btn primary" onClick={send} disabled={state === "sending" || message.trim().length < 3}>
              {state === "sending" ? t("feedback.sending") : t("feedback.send")}
            </button>
            <button className="btn ghost" onClick={() => setOpen(false)}>{t("feedback.close")}</button>
          </div>
        </>
      )}
    </div>
  );
}
