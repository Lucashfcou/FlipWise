import type { Condition } from "../domain/types";
import type { LookupResult } from "../ebay/lookup";

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
  /** Especificações que mudam o preço (processador, RAM, armazenamento...), em formato curto. */
  specs?: string[];
  /** Só se sabe a linha do produto (ex.: "Ryzen 7"): o app pergunta o modelo. */
  needsModel?: boolean;
  /** Modelos prováveis, do conhecimento da IA (não vêm do eBay). */
  modelOptions?: string[];
  /** Vários produtos do catálogo possíveis (ex.: capacidades diferentes): o app pergunta qual. */
  candidates?: { id: string; label: string }[];
  /** Estado genérico lido (A/B/C/P), para produtos fora do catálogo. */
  genericCondition?: "A" | "B" | "C" | "P";
  /** Preços do eBay para produtos fora do catálogo, já calculados no servidor (pode ser null: sem anúncios fiáveis). */
  lookup?: LookupResult | null;
  /** Tipo de aparelho (laptop, headphones, tablet...), para achar a categoria no eBay. */
  deviceType?: string;
  /** Anúncio que vende vários artigos por um só preço: lista lida (máx. 10), cada artigo casado com o catálogo quando possível. */
  lot?: { items: { name: string; qty: number; productId: string | null; condition: Condition | null; deviceType?: string }[]; more: number };
  /** true quando é só um exemplo de demonstração, sem ler nenhuma imagem. */
  demo?: boolean;
}

export interface CaptureStatus {
  enabled: boolean;
  /** O servidor tem contas e quem chama não entrou. */
  loginRequired?: boolean;
  /** Entrou, mas o plano não inclui a leitura por print. */
  upgrade?: boolean;
  accounts?: boolean;
  plan?: "free" | "trial" | "pro";
  trialEndsAt?: string | null;
  email?: string;
  dailyLimit?: number;
  usedToday?: number;
  /** A busca de preços no eBay (produtos fora do catálogo) está ligada no servidor. */
  lookup?: boolean;
}
