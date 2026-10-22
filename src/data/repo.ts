import { findProduct, normalizeCondition } from "../domain/catalog";
import { marketObservations } from "./market";
import { DEFAULT_SETTINGS } from "../domain/types";
import type { Condition, Observation, Settings, StockItem } from "../domain/types";

/**
 * Camada de dados. Hoje usa localStorage; trocar por Supabase = nova
 * implementação desta interface, sem mexer nas telas.
 */
export interface Repo {
  loadStock(): StockItem[];
  saveStock(items: StockItem[]): void;
  loadObservations(): Observation[];
  addObservations(list: Observation[]): void;
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

/** Lista guardada: se o conteúdo estiver corrompido (ou editado à mão) e não for uma lista, usa vazio. */
function readList<T>(key: string): T[] {
  const v = read<unknown>(key, []);
  return Array.isArray(v) ? (v.filter((x) => x !== null && typeof x === "object") as T[]) : [];
}

/** Definições guardadas: só aceita os campos conhecidos com o tipo certo; o resto cai nos valores por omissão. */
function readSettings(): Partial<Settings> {
  const v = read<Record<string, unknown>>("garimpo.settings", {});
  const out: Record<string, unknown> = {};
  if (v === null || typeof v !== "object" || Array.isArray(v)) return out;
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const d = DEFAULT_SETTINGS[k];
    const x = v[k];
    if (typeof x === typeof d && (typeof x !== "number" || Number.isFinite(x))) out[k] = x;
  }
  if (out.lang !== "en" && out.lang !== "pt") delete out.lang;
  return out as Partial<Settings>;
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* armazenamento cheio ou bloqueado: a app continua a funcionar em memória */
  }
}

/** Itens guardados com estados antigos (como novo, gasto, drift leve, lacrado) passam para os dois atuais. */
function fixCondition<T extends { productId: string; condition: Condition }>(x: T): T {
  const p = findProduct(x.productId);
  return p ? { ...x, condition: normalizeCondition(p.category, x.condition) } : x;
}

export const localRepo: Repo = {
  loadStock: () => readList<StockItem>("garimpo.stock").map(fixCondition),
  saveStock: (items) => write("garimpo.stock", items),
  loadObservations: () => [...marketObservations(), ...readList<Observation>("garimpo.observations").map(fixCondition)],
  addObservations: (list) => {
    const mine = readList<Observation>("garimpo.observations");
    write("garimpo.observations", [...mine, ...list]);
  },
  loadSettings: () => ({ ...DEFAULT_SETTINGS, ...readSettings() }),
  saveSettings: (s) => write("garimpo.settings", s),
};
