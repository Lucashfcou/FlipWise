import { exampleObservations } from "../domain/catalog";
import { DEFAULT_SETTINGS } from "../domain/types";
import type { Observation, Settings, StockItem } from "../domain/types";

/**
 * Camada de dados. Hoje usa localStorage; trocar por Supabase = nova
 * implementação desta interface, sem mexer nas telas.
 */
export interface Repo {
  loadStock(): StockItem[];
  saveStock(items: StockItem[]): void;
  loadObservations(): Observation[];
  addObservation(o: Observation): void;
  loadSettings(): Settings;
  saveSettings(s: Settings): void;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* armazenamento cheio ou bloqueado: a app continua a funcionar em memória */
  }
}

export const localRepo: Repo = {
  loadStock: () => read<StockItem[]>("garimpo.stock", []),
  saveStock: (items) => write("garimpo.stock", items),
  loadObservations: () => [
    ...exampleObservations(),
    ...read<Observation[]>("garimpo.observations", []),
  ],
  addObservation: (o) => {
    const mine = read<Observation[]>("garimpo.observations", []);
    write("garimpo.observations", [...mine, o]);
  },
  loadSettings: () => ({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>("garimpo.settings", {}) }),
  saveSettings: (s) => write("garimpo.settings", s),
};
