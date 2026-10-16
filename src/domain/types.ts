export type Category = "console" | "controller" | "game";

export type Condition =
  | "A" | "B" | "C" | "P"
  | "sem-drift" | "drift-leve" | "defeito"
  | "lacrado" | "completo" | "so-disco";

export type ObservationKind = "new" | "refurb" | "buyback" | "ask" | "sold";

export interface Product {
  id: string;
  category: Category;
  brand: string;
  name: string;
  variant: string;
}

export interface Observation {
  productId: string;
  condition: Condition;
  value: number;
  kind: ObservationKind;
  source: string;
  date: string;
  example?: boolean;
}

export type Confidence = "alta" | "media" | "baixa";

export interface PriceEstimate {
  low: number;
  typical: number;
  high: number;
  maxBuy: number;
  firm: boolean;
  confidence: Confidence;
  count: number;
}

export interface Sale {
  price: number;
  platform: string;
  shipping: number;
  date: string;
}

export interface StockItem {
  id: string;
  productId: string;
  condition: Condition;
  cost: number;
  extraCosts: number;
  boughtAt: string;
  boughtDate: string;
  /** Preço típico que o app indicava quando compraste. Serve para medir se acertou. */
  estimate?: number;
  sale?: Sale;
}

export interface Settings {
  targetMargin: number;
  shipping: number;
  promo: number;
  contribute: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  targetMargin: 0.25,
  shipping: 4,
  promo: 0,
  contribute: true,
};
