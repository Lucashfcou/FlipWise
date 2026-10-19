import type { Condition } from "../domain/types";

export type ImageType = "anuncio" | "foto_sem_texto" | "outro";

export interface CaptureProblem {
  code: "NAO_E_ANUNCIO" | "SEM_PRODUTO" | "SEM_PRECO" | "NAO_BATE" | "SEM_ESTADO";
  severity: "erro" | "aviso";
  message: string;
}

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
  /** O que a imagem é: página de anúncio, foto solta do aparelho, ou outra coisa. */
  imageType: ImageType;
  /** Contradições entre foto e texto, ou entre título e descrição. */
  inconsistencies: string[];
  /** Problemas calculados em código a partir do resto; a interface mostra-os ao lado do resultado. */
  problems: CaptureProblem[];
  /** Nome curto para pesquisar no eBay quando o produto não está no catálogo (marca e modelo). */
  searchQuery?: string;
  /** true quando é só um exemplo de demonstração, sem ler nenhuma imagem. */
  demo?: boolean;
}

export interface CaptureStatus {
  enabled: boolean;
  dailyLimit?: number;
  usedToday?: number;
  /** A busca de preços no eBay (produtos fora do catálogo) está ligada no servidor. */
  lookup?: boolean;
}
