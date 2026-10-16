import { useState } from "react";
import { useApp } from "../state";

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

      <h2>Os teus dados</h2>
      <p className="hint">Tudo fica guardado neste aparelho. Não há conta nem servidor.</p>
      <div className="actions">
        <button className="btn ghost" onClick={() => download("garimpo-dados.json", { stock, observations: observations.filter((o) => !o.example) })}>
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
        Garimpo v0.1. Os preços de arranque são exemplos. Os teus registos e vendas passam a pesar mais que eles.
      </p>
    </section>
  );
}
