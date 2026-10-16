import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { localRepo } from "./data/repo";
import { estimate } from "./domain/priceEngine";
import type { Condition, Observation, PriceEstimate, Settings, StockItem } from "./domain/types";

interface AppState {
  stock: StockItem[];
  settings: Settings;
  observations: Observation[];
  usingExamples: boolean;
  priceFor: (productId: string, condition: Condition) => PriceEstimate;
  addStock: (item: Omit<StockItem, "id">) => void;
  sellStock: (id: string, sale: NonNullable<StockItem["sale"]>) => void;
  removeStock: (id: string) => void;
  contribute: (o: Observation) => void;
  updateSettings: (s: Settings) => void;
  resetAll: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp fora do provider");
  return v;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [stock, setStock] = useState(() => localRepo.loadStock());
  const [settings, setSettings] = useState(() => localRepo.loadSettings());
  const [observations, setObservations] = useState(() => localRepo.loadObservations());

  const priceFor = useCallback(
    (productId: string, condition: Condition) =>
      estimate(
        observations.filter((o) => o.productId === productId && o.condition === condition),
        { shipping: settings.shipping, promo: settings.promo, margin: settings.targetMargin },
      ),
    [observations, settings],
  );

  const value = useMemo<AppState>(() => {
    const persistStock = (items: StockItem[]) => {
      setStock(items);
      localRepo.saveStock(items);
    };
    return {
      stock,
      settings,
      observations,
      usingExamples: observations.some((o) => o.example),
      priceFor,
      addStock: (item) => persistStock([{ ...item, id: crypto.randomUUID() }, ...stock]),
      sellStock: (id, sale) => {
        persistStock(stock.map((i) => (i.id === id ? { ...i, sale } : i)));
        const item = stock.find((i) => i.id === id);
        if (item && settings.contribute) {
          const o: Observation = {
            productId: item.productId,
            condition: item.condition,
            value: sale.price,
            kind: "sold",
            source: "eu",
            date: sale.date,
          };
          localRepo.addObservation(o);
          setObservations((prev) => [...prev, o]);
        }
      },
      removeStock: (id) => persistStock(stock.filter((i) => i.id !== id)),
      contribute: (o) => {
        localRepo.addObservation(o);
        setObservations((prev) => [...prev, o]);
      },
      updateSettings: (s) => {
        setSettings(s);
        localRepo.saveSettings(s);
      },
      resetAll: () => {
        try {
          ["garimpo.stock", "garimpo.observations", "garimpo.settings"].forEach((k) => localStorage.removeItem(k));
        } catch {
          /* ignorar */
        }
        setStock([]);
        setSettings(localRepo.loadSettings());
        setObservations(localRepo.loadObservations());
      },
    };
  }, [stock, settings, observations, priceFor]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
