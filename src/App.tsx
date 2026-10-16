import { useState } from "react";
import type { ReactNode } from "react";
import { Avaliar } from "./screens/Avaliar";
import { Stock } from "./screens/Stock";
import { Vendas } from "./screens/Vendas";
import { Catalogo } from "./screens/Catalogo";
import { Config } from "./screens/Config";

type Tab = "avaliar" | "stock" | "vendas" | "catalogo" | "config";

const ICONS: Record<Tab, ReactNode> = {
  avaliar: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2M8.5 11h5M11 8.5v5" /></svg>
  ),
  stock: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8" /></svg>
  ),
  vendas: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6" /></svg>
  ),
  catalogo: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h9" /></svg>
  ),
  config: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h9M18 7h1M5 17h1M10 17h9" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
  ),
};

const TABS: { id: Tab; label: string }[] = [
  { id: "avaliar", label: "Avaliar" },
  { id: "stock", label: "Stock" },
  { id: "vendas", label: "Lucro" },
  { id: "catalogo", label: "Catálogo" },
  { id: "config", label: "Ajustes" },
];

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--ink)" />
      <path d="M22.1 11.7A7.5 7.5 0 1 0 23.5 16" fill="none" stroke="var(--bg)" strokeWidth="3.6" />
      <path d="M16.2 16H23.5" fill="none" stroke="var(--accent)" strokeWidth="3.6" />
    </svg>
  );
}

export function App() {
  const [tab, setTab] = useState<Tab>("avaliar");
  return (
    <div className="shell">
      <header className="top">
        <Logo />
        <span className="brand">Garimpo</span>
        <span className="tag">PT · EUR</span>
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
          <button key={t.id} className={t.id === tab ? "on" : ""} onClick={() => setTab(t.id)} aria-current={t.id === tab ? "page" : undefined}>
            {ICONS[t.id]}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
