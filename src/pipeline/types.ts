/** Anúncio já limpo: só os campos que interessam ao classificador e às contas. */
export interface Listing {
  id: string;
  title: string;
  /** null quando o anúncio não tem preço numérico ("A combinar", "Troco"). */
  price: number | null;
  currency: string;
  description: string;
  url: string;
}

export interface Verdict {
  id: string;
  valid: boolean;
  reason: string;
}

/** Classifica anúncios de eletrónicos para uma pesquisa. Implementações: regras locais ou Claude. */
export interface Classifier {
  readonly name: string;
  classify(query: string, listings: Listing[]): Promise<Verdict[]>;
}

export interface PriceStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  currency: string;
}

export interface PipelineResult {
  query: string;
  classifier: string;
  counts: {
    captured: number;
    validated: number;
    /** Aproveitados nas estatísticas: válidos, na moeda principal e dentro do IQR. */
    final: number;
  };
  stats: PriceStats | null;
  /** Preços aproveitados (válidos, na moeda principal, dentro do IQR). */
  prices: number[];
  iqr: { q1: number; q3: number; lower: number; upper: number; applied: boolean } | null;
  rejected: { id: string; title: string; reason: string }[];
  outliers: { id: string; title: string; price: number }[];
}
