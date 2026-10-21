import { useState } from "react";
import { CSV_TEMPLATE, parseCsv } from "../domain/csv";
import { t } from "../i18n";
import { useApp } from "../state";
import { AccountPanel } from "../auth/AccountPanel";

function ImportPanel() {
  const { importObservations } = useApp();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: number; errors: string[] } | null>(null);
  return (
    <div className="panel">
      <p className="hint">{t("settings.importHint")}</p>
      <label className="label" htmlFor="csv">{t("settings.csvLabel")}</label>
      <textarea id="csv" className="field mono" rows={6} placeholder={CSV_TEMPLATE} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="actions">
        <button
          className="btn primary"
          disabled={!text.trim()}
          onClick={() => {
            const r = parseCsv(text);
            if (r.ok.length) importObservations(r.ok);
            setMsg({ ok: r.ok.length, errors: r.errors });
            if (!r.errors.length) setText("");
          }}
        >
          {t("settings.importBtn")}
        </button>
      </div>
      {msg && (
        <div role="status">
          <p>{t("settings.imported", { n: msg.ok })}</p>
          {msg.errors.map((e) => (
            <p key={e} className="loss">{e}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function Config() {
  const { settings, updateSettings, stock, observations, resetAll } = useApp();
  const [margin, setMargin] = useState(String(Math.round(settings.targetMargin * 100)));
  const [shipping, setShipping] = useState(String(settings.shipping));
  const [promo, setPromo] = useState(String(settings.promo));
  const [stale, setStale] = useState(String(settings.staleDays));

  const num = (s: string) => Number(s.replace(",", "."));
  const valid = [margin, shipping, promo, stale].every((s) => Number.isFinite(num(s)) && num(s) >= 0) && num(margin) < 100;

  return (
    <section>
      <h1>{t("settings.title")}</h1>
      <AccountPanel />
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          updateSettings({
            ...settings,
            targetMargin: num(margin) / 100,
            shipping: num(shipping),
            promo: num(promo),
            staleDays: Math.max(1, Math.round(num(stale))),
          });
        }}
      >
        <label className="label" htmlFor="m">{t("settings.margin")}</label>
        <input id="m" className="field mono" inputMode="decimal" value={margin} onChange={(e) => setMargin(e.target.value)} />
        <label className="label" htmlFor="s">{t("settings.shipping")}</label>
        <input id="s" className="field mono" inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value)} />
        <label className="label" htmlFor="pr">{t("settings.promo")}</label>
        <input id="pr" className="field mono" inputMode="decimal" value={promo} onChange={(e) => setPromo(e.target.value)} />
        <label className="label" htmlFor="st">{t("settings.stale")}</label>
        <input id="st" className="field mono" inputMode="numeric" value={stale} onChange={(e) => setStale(e.target.value)} />
        <button className="btn primary" type="submit" disabled={!valid}>{t("settings.save")}</button>
      </form>

      <label className="check">
        <input type="checkbox" checked={settings.contribute} onChange={(e) => updateSettings({ ...settings, contribute: e.target.checked })} />
        <span>{t("settings.contribute")}</span>
      </label>

      <h2>{t("settings.import")}</h2>
      <ImportPanel />

      <h2>{t("settings.data")}</h2>
      <p className="hint">{t("settings.dataHint")}</p>
      <div className="actions">
        <button className="btn ghost" onClick={() => download("flipwise-data.json", { stock, observations: observations.filter((o) => o.source === "eu") })}>
          {t("settings.export")}
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            if (confirm(t("settings.wipeConfirm"))) resetAll();
          }}
        >
          {t("settings.wipe")}
        </button>
      </div>

      <h2>{t("settings.about")}</h2>
      <p className="hint">{t("settings.aboutText")}</p>
    </section>
  );
}
