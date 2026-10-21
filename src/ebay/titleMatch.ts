/**
 * Regras para decidir se o título de um anúncio é do produto pedido: código do modelo inteiro, especificações,
 * e sem peças nem acessórios. Usadas pela busca fora do catálogo e pelo catálogo gerado por listas.
 */

/** Qualquer coisa com test(): uma expressão regular ou uma regra feita em código. */
export interface Matcher {
  test(s: string): boolean;
}

export interface ProductQuery {
  /** Texto de pesquisa no eBay. */
  q: string;
  /** O título tem de cumprir TODAS. Evita outro modelo ou capacidade. */
  must: Matcher[];
  /** O título não pode cumprir NENHUMA. */
  mustNot: Matcher[];
  /** Piso de preço em euros, quando o catálogo o define. */
  min?: number;
}

/** Palavra que identifica o modelo (letras e números juntos, ou 3+ dígitos): "5700X", "S145-15IWL", "WH-CH720N". */
const NOT_A_CODE = /^(m\.?2|\d+([.,]\d+)?(gb|tb|mb|mhz|ghz|hz|w|mm|cm|inch|pulgadas|mah)|\d+([.,]\d+)?)$/i;
export const isDistinctive = (w: string) => !NOT_A_CODE.test(w) && ((/\d/.test(w) && /[a-z]/i.test(w)) || /\d{3,}/.test(w));

/** Limpa o texto de pesquisa: só letras, números e alguns símbolos comuns, até 80 caracteres. */
export function cleanLookupQuery(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const q = raw.normalize("NFKC").replace(/[^\p{L}\p{N}\s\-+.'&/]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return q.length >= 3 ? q : null;
}

/** Tipo de aparelho em uma ou duas palavras ("laptop", "headphones"): ajuda a achar a categoria certa no eBay. */
export function cleanDeviceType(raw: unknown): string {
  return typeof raw === "string" ? raw.normalize("NFKC").replace(/[^\p{L}\s-]/gu, "").trim().slice(0, 24) : "";
}

/** Especificações curtas ("i7", "8GB", "256GB"): até 5, só letras, números e . + - */
export function cleanSpecs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.replace(/\s+/g, "").slice(0, 14))
    .filter((x) => /^[\p{L}\p{N}.+-]{2,14}$/u.test(x))
    .slice(0, 5);
}

const compact = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Peças e acessórios que aparecem na pesquisa de um aparelho e puxam o preço para baixo (portátil -> carregador, teclado, ecrã...). */
const JUNK = /\b(cargador|charger|ladeger[aä]t|chargeur|caricatore|bater[ií]a|battery|akku|batterie|batteria|pantalla|screen|display|bildschirm|[eé]cran|teclado|keyboard|tastatur|clavier|tastiera|carcasa|carcassa|cover|funda|case|tasche|h[uü]lle|bisagra|hinge|scharnier|placa\s?base|motherboard|ventilador|fan|l[uü]fter|ventola|caddy|adaptador|adapter|cable|kabel|c[aâ]ble|cavo|altavoz|speaker|lautsprecher|repuesto|spare|ersatzteil|piezas|pieces|pi[eè]ces|for\s?parts|defekt|broken|averiad[oa]|roto|rota|sticker|pegatina|skin|protector|soporte|stand|halterung|mouse\s?pad|alfombrilla)\b/gi;

function hasCode(title: string, code: string): boolean {
  const toks = title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (let i = 0; i < toks.length; i++) {
    let acc = "";
    for (let k = i; k < Math.min(toks.length, i + 3); k++) {
      acc += toks[k];
      if (acc === code) return true;
      if (acc.length >= code.length) break;
    }
  }
  return false;
}

/** O título tem de conter todas as palavras do nome (sem espaços nem hífenes, para "WH-CH720N" casar com "WH CH720N"). */
export function lookupProductQuery(q: string): ProductQuery {
  const raws = q.split(/\s+/).filter((raw) => compact(raw).length >= 2);
  const hasModelCode = raws.some(isDistinctive);
  const matchers = raws.map((raw) => {
    const w = compact(raw);
    // Código de modelo ("5700X"): tem de aparecer inteiro, não como parte de outro ("5700X3D"); aceita "WH-CH720N" ou "WH CH720N".
    if (isDistinctive(raw)) return (title: string) => hasCode(title, w);
    return (title: string) => compact(title).includes(w);
  });
  const must =
    hasModelCode || matchers.length <= 2
      ? matchers.map((test) => ({ test }))
      : [
          // Sem código de modelo (ex.: "Kingston SSD M.2 480GB SATA"): a marca (1.ª palavra) é obrigatória e das restantes chega a maioria.
          { test: matchers[0] },
          { test: (title: string) => matchers.slice(1).filter((m) => m(title)).length >= Math.ceil((matchers.length - 1) * 0.6) },
        ];
  // Tira peças e acessórios, exceto quando o próprio nome pesquisado os inclui (ex.: "carregador MagSafe").
  const inQuery = new Set((q.match(JUNK) ?? []).map((w) => w.toLowerCase()));
  const mustNot = [{ test: (title: string) => (title.match(JUNK) ?? []).some((w) => !inQuery.has(w.toLowerCase())) }];
  return { q, must, mustNot };
}

/** Tamanhos de armazenamento que os vendedores escrevem de formas diferentes (240 e 256 GB são o mesmo disco). */
const STORAGE_EQUIV: Record<string, string[]> = {
  "120": ["120", "128"], "128": ["120", "128"], "240": ["240", "256"], "256": ["240", "256"],
  "480": ["480", "512"], "512": ["480", "512"], "960": ["960", "1000", "1024"], "1tb": ["960", "1000", "1024", "1tb"],
};

/** Um critério de especificação: "8GB" não pode casar com "128GB"; "256GB" aceita "240 GB" e "256GB". */
export function specMatcher(spec: string): Matcher {
  const s = spec.toLowerCase().replace(/\s+/g, "");
  const m = s.match(/^(\d+)(gb|tb)$/);
  const alts = m && m[2] === "gb" ? (STORAGE_EQUIV[m[1]] ?? [m[1]]).map((n) => `${n}\\s?gb`) : [s.replace(/[.+-]/g, (c) => `\\${c}`).replace(/(\d)([a-z])/g, "$1\\s?$2")];
  const re = new RegExp(`(?<![a-z0-9])(${alts.join("|")})(?![a-z0-9])`, "i");
  return { test: (title: string) => re.test(title.normalize("NFD").replace(/[̀-ͯ]/g, "")) };
}

