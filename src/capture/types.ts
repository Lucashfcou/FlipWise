import type { Condition } from "../domain/types";

/** O que se lê de um print de anúncio. O preço de mercado NÃO vem daqui: vem do motor de preços. */
export interface CaptureResult {
  /** Id do catálogo, ou null se o modelo não conseguiu identificar o produto. */
  productId: string | null;
  title: string;
  /** Preço pedido no anúncio. */
  price: number | null;
  currency: string;
  condition: Condition | null;
  conditionReason: string;
  platform: string | null;
  includes: string[];
  defects: string[];
  confidence: "alta" | "media" | "baixa";
  notes: string;
  /** true quando é só um exemplo de demonstração, sem ler nenhuma imagem. */
  demo?: boolean;
}

export interface CaptureStatus {
  enabled: boolean;
  dailyLimit?: number;
  usedToday?: number;
}
