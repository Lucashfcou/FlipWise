import { t } from "../i18n";
import type { Key } from "../i18n";

const PRIVACY: Key[] = ["legal.p1", "legal.p2", "legal.p3", "legal.p4", "legal.p5", "legal.p6"];
const TERMS: Key[] = ["legal.t1", "legal.t2", "legal.t3", "legal.t4", "legal.t5"];

/** Privacidade e termos do beta, em linguagem simples. Fica em Ajustes. */
export function Legal() {
  return (
    <div className="panel">
      <details>
        <summary>{t("legal.privacy")}</summary>
        {PRIVACY.map((k) => (
          <p key={k} className="hint">{t(k)}</p>
        ))}
      </details>
      <details>
        <summary>{t("legal.terms")}</summary>
        {TERMS.map((k) => (
          <p key={k} className="hint">{t(k)}</p>
        ))}
      </details>
    </div>
  );
}
