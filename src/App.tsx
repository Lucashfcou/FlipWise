import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { stagger, useFx } from "./fx";
import { t } from "./i18n";
import type { Key } from "./i18n";
import { Avaliar } from "./screens/Avaliar";
import { Stock } from "./screens/Stock";
import { Vendas } from "./screens/Vendas";
import { Catalogo } from "./screens/Catalogo";
import { Config } from "./screens/Config";
import { useApp } from "./state";

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

const TABS: { id: Tab; label: Key }[] = [
  { id: "avaliar", label: "nav.evaluate" },
  { id: "stock", label: "nav.stock" },
  { id: "vendas", label: "nav.profit" },
  { id: "catalogo", label: "nav.catalog" },
  { id: "config", label: "nav.settings" },
];

/** Marca: um F geométrico. A barra do meio, a azul, é o preço que se vê no meio da faixa. */
function Logo() {
  return (
    <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--ink)" />
      <path d="M12 24V9.5H22.5" fill="none" stroke="var(--bg)" strokeWidth="3.6" strokeLinejoin="miter" />
      <path d="M12 16.2H20" fill="none" stroke="var(--accent)" strokeWidth="3.6" />
    </svg>
  );
}

export function App() {
  const { settings, updateSettings } = useApp();
  const [tab, setTab] = useState<Tab>("avaliar");
  const main = useRef<HTMLElement>(null);

  // Troca de ecrã: o conteúdo sobe em escada, como no jogo do PAS.
  useFx(main, (root) => stagger([...(root.firstElementChild?.children ?? [])], 12, 40), [tab]);

  return (
    <div className="shell">
      <header className="top">
        <Logo />
        <span className="brand">{t("app.name")}</span>
        <div className="langs" role="group" aria-label={t("lang.aria")}>
          {(["en", "pt"] as const).map((l) => (
            <button key={l} className={settings.lang === l ? "on" : ""} aria-pressed={settings.lang === l} onClick={() => updateSettings({ ...settings, lang: l })}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <main className="page" ref={main} key={tab}>
        {tab === "avaliar" && <Avaliar goStock={() => setTab("stock")} />}
        {tab === "stock" && <Stock />}
        {tab === "vendas" && <Vendas />}
        {tab === "catalogo" && <Catalogo />}
        {tab === "config" && <Config />}
      </main>
      <nav className="tabs" aria-label={t("nav.aria")}>
        {TABS.map((tb) => (
          <button key={tb.id} className={tb.id === tab ? "on" : ""} onClick={() => setTab(tb.id)} aria-current={tb.id === tab ? "page" : undefined}>
            {ICONS[tb.id]}
            <span>{t(tb.label)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
