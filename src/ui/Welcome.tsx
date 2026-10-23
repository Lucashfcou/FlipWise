import { useState } from "react";
import { t } from "../i18n";

const KEY = "flipfind.welcome";

function seen(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Guia da primeira abertura: três passos curtos, uma vez só. */
export function Welcome() {
  const [hidden, setHidden] = useState(seen);
  if (hidden) return null;
  const done = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* sem armazenamento: o guia volta na próxima visita */
    }
    setHidden(true);
  };
  return (
    <div className="welcome" role="region" aria-label={t("welcome.title")}>
      <strong>{t("welcome.title")}</strong>
      <ol>
        <li><b>{t("welcome.s1")}</b> {t("welcome.s1t")}</li>
        <li><b>{t("welcome.s2")}</b> {t("welcome.s2t")}</li>
        <li><b>{t("welcome.s3")}</b> {t("welcome.s3t")}</li>
      </ol>
      <button className="btn ghost small" onClick={done}>{t("welcome.ok")}</button>
    </div>
  );
}
