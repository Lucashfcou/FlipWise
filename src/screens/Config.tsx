import { useState } from "react";
import { CSV_TEMPLATE, parseCsv } from "../domain/csv";
import { useApp } from "../state";

function ImportPanel() {
  const { importObservations } = useApp();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: number; errors: string[] } | null>(null);
  return (
    <div className="panel">
      <p className="hint">Uma linha por preço: produto, estado, tipo, valor, fonte, data. Tipos: new, refurb, buyback, ask, sold. O produto é o id do catálogo (ex.: ps4-slim-500).</p>
      <label className="label" htmlFor="csv">Linhas CSV</label>
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
          Importar
        </button>
      </div>
      {msg && (
        <div role="status">
          <p>{msg.ok} preços importados.</p>
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

  const num = (s: string) => Number(s.replace(",", "."));
  const valid = [margin, shipping, promo].every((s) => Number.isFinite(num(s)) && num(s) >= 0) && num(margin) < 100;

  return (
    <section>
      <h1>Ajustes</h1>
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          updateSettings({ ...settings, targetMargin: num(margin) / 100, shipping: num(shipping), promo: num(promo) });
        }}
      >
        <label className="label" htmlFor="m">Margem alvo (%)</label>
        <input id="m" className="field mono" inputMode="decimal" value={margin} onChange={(e) => setMargin(e.target.value)} />
        <label className="label" htmlFor="s">Envio habitual (€)</label>
        <input id="s" className="field mono" inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value)} />
        <label className="label" htmlFor="pr">Destaque do anúncio (€)</label>
        <input id="pr" className="field mono" inputMode="decimal" value={promo} onChange={(e) => setPromo(e.target.value)} />
        <button className="btn primary" type="submit" disabled={!valid}>Guardar</button>
      </form>

      <label className="check">
        <input type="checkbox" checked={settings.contribute} onChange={(e) => updateSettings({ ...settings, contribute: e.target.checked })} />
        <span>Usar as minhas vendas para melhorar o preço de mercado (só modelo, estado e preço)</span>
      </label>

      <h2>Importar preços</h2>
      <ImportPanel />

      <h2>Os teus dados</h2>
      <p className="hint">Tudo fica guardado neste aparelho. Não há conta nem servidor.</p>
      <div className="actions">
        <button className="btn ghost" onClick={() => download("garimpo-dados.json", { stock, observations: observations.filter((o) => o.source === "eu") })}>
          Exportar cópia
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            if (confirm("Apagar stock, vendas e preços guardados neste aparelho? Isto não se pode desfazer.")) resetAll();
          }}
        >
          Apagar tudo
        </button>
      </div>

      <h2>Sobre</h2>
      <p className="hint">
        Garimpo v0.2. Os preços de arranque vêm do CeX Portugal. As tuas vendas e as que importares passam a pesar mais que eles.
      </p>
    </section>
  );
}
