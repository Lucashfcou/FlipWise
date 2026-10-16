import { useState } from "react";
import { Avaliar } from "./screens/Avaliar";
import { Stock } from "./screens/Stock";
import { Vendas } from "./screens/Vendas";
import { Catalogo } from "./screens/Catalogo";
import { Config } from "./screens/Config";

type Tab = "avaliar" | "stock" | "vendas" | "catalogo" | "config";

const TABS: { id: Tab; label: string }[] = [
  { id: "avaliar", label: "Avaliar" },
  { id: "stock", label: "Stock" },
  { id: "vendas", label: "Lucro" },
  { id: "catalogo", label: "Catálogo" },
  { id: "config", label: "Ajustes" },
];

export function App() {
  const [tab, setTab] = useState<Tab>("avaliar");
  return (
    <div className="shell">
      <header className="top">
        <span className="brand">Garimpo</span>
        <span className="tag">preço de mercado e lucro real</span>
      </header>
      <main className="page" key={tab}>
        {tab === "avaliar" && <Avaliar goStock={() => setTab("stock")} />}
        {tab === "stock" && <Stock />}
        {tab === "vendas" && <Vendas />}
        {tab === "catalogo" && <Catalogo />}
        {tab === "config" && <Config />}
      </main>
      <nav className="tabs" aria-label="Secções">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? "on" : ""} onClick={() => setTab(t.id)} aria-current={t.id === tab}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
