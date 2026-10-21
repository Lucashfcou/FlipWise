import { productClassifier } from "./queries";
import type { Matcher, ProductQuery } from "./queries";
import { hasDeviceCategory, searchItems, suggestCategory, toRaw } from "./client";
import type { MarketplaceId } from "./client";
import { runPipeline } from "../pipeline/run";

/**
 * Busca no eBay para produtos que não estão no catálogo. O nome e as especificações vêm da leitura do print
 * (a IA nunca recebe dados do eBay). O resultado traz sempre uma conclusão, com a confiança e a base da comparação.
 */
export interface LookupResult {
  /** Nome efetivamente pesquisado (pode ser mais curto que o do print quando não havia anúncios do modelo exato). */
  searched?: string;
  query: string;
  site: string;
  currency: string;
  /** Anúncios usados no cálculo. */
  n: number;
  /** Anúncios devolvidos pelo eBay antes de limpar. */
  captured: number;
  median: number;
  low: number;
  high: number;
  min: number;
  max: number;
  /** Preços usados no cálculo, para o app calcular o veredito com os mesmos custos e margem do utilizador. */
  prices: number[];
  /** "specs": só anúncios com as mesmas especificações; "model": todas as versões do modelo. */
  basis: "specs" | "model" | "family";
  /** Categoria do eBay usada para deixar de fora peças e acessórios. */
  category?: string;
  /** Dispersão: intervalo entre quartis dividido pela mediana. */
  spread: number;
  reliability: "media" | "baixa";
}

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

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Palavra que identifica o modelo (letras e números juntos, ou 3+ dígitos): "5700X", "S145-15IWL", "WH-CH720N". */
const NOT_A_CODE = /^(m\.?2|\d+([.,]\d+)?(gb|tb|mb|mhz|ghz|hz|w|mm|cm|inch|pulgadas|mah)|\d+([.,]\d+)?)$/i;
const isDistinctive = (w: string) => !NOT_A_CODE.test(w) && ((/\d/.test(w) && /[a-z]/i.test(w)) || /\d{3,}/.test(w));

/** Boa o bastante para mostrar sem pedir segunda opinião à IA. */
export function lookupConfident(r: LookupResult | null): boolean {
  if (!r) return false;
  return r.reliability === "media" || (r.basis === "specs" && r.n >= 6) || (r.basis === "model" && r.n >= 10 && r.spread <= 0.8);
}

/** Para escolher o melhor entre vários nomes candidatos. */
export function lookupScore(r: LookupResult | null): number {
  if (!r) return -1;
  const basis = r.basis === "specs" ? 3000 : r.basis === "model" ? 2000 : 0;
  return basis + (r.reliability === "media" ? 500 : 0) + Math.min(r.n, 50) * 10 - Math.min(r.spread, 3) * 10;
}

/**
 * Pesquisa o nome no eBay e calcula a faixa de preços com o mesmo pipeline do catálogo. Primeiro o nome completo (com as
 * mesmas especificações quando há anúncios suficientes), depois variantes que mantêm o código do modelo. Só quando o nome
 * não tem código de modelo (ou o aparelho é um portátil) comparam-se modelos parecidos, sempre marcado como "família".
 */
export async function runLookup(
  token: string,
  site: MarketplaceId,
  q: string,
  opts: { specs?: string[]; deviceType?: string; fetchImpl?: typeof fetch; minValid?: number } = {},
): Promise<LookupResult | null> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const minValid = opts.minValid ?? 8;
  const specs = cleanSpecs(opts.specs ?? []);
  const type = cleanDeviceType(opts.deviceType);

  let category: { id: string; name: string } | null = null;
  try {
    category = await suggestCategory(token, site, q, fetchImpl, type);
  } catch {
    category = null;
  }

  const words = q.split(/\s+/);
  const hasCode = words.some(isDistinctive);
  const tiers: { name: string; family: boolean }[] = [{ name: q, family: false }];
  // Sem a marca (muitos títulos escrevem só "Ryzen 7 5700X").
  if (hasCode && words.length >= 3 && /^[a-z]+$/i.test(words[0])) tiers.push({ name: words.slice(1).join(" "), family: false });
  // Só o código do modelo, mais a palavra que o antecede.
  const ci = words.findIndex(isDistinctive);
  if (ci > 0) tiers.push({ name: words.slice(Math.max(0, ci - 1)).join(" "), family: false });
  // Modelos parecidos: só quando não há código de modelo, ou em portáteis (que existem em muitas configurações).
  if (words.length >= 3 && (!hasCode || /laptop|notebook/i.test(type))) {
    tiers.push({ name: words.slice(0, -1).join(" "), family: true });
    tiers.push({ name: words.slice(0, 2).join(" "), family: true });
  }
  // Último recurso (armazenamento, memória...): marca + tipo + capacidade.
  if (type && specs.length > 0) tiers.push({ name: `${words[0]} ${type} ${specs[0]}`, family: true });
  // Tipo de aparelho com categoria própria: pesquisa só nessa categoria (e salta o país onde ela não existe).
  // Tipo desconhecido: pesquisa sem categoria.
  const catChoices = category ? [category] : hasDeviceCategory(type) ? [] : [null];
  for (const cat of catChoices) {
  const seen = new Set<string>();

  for (const tier of tiers) {
    const key = tier.name.toLowerCase();
    if (seen.has(key) || tier.name.length < 3) continue;
    seen.add(key);
    const base = lookupProductQuery(tier.name);
    {
      const items = await searchItems(token, site, tier.name, 100, fetchImpl, "USED", cat?.id);
      const raw = toRaw(items);
      const attempts: { basis: "specs" | "model" | "family"; query: ProductQuery; needed: number }[] = [];
      if (specs.length > 0) attempts.push({ basis: tier.family ? "family" : "specs", query: { ...base, must: [...base.must, ...specs.map(specMatcher)] }, needed: Math.max(minValid, 6) });
      attempts.push({ basis: tier.family ? "family" : "model", query: base, needed: tier.family ? Math.max(minValid, 8) : minValid });

      for (const att of attempts) {
        const r = await runPipeline(tier.name, raw, productClassifier(att.query), "EUR");
        if (!r.stats || r.counts.final < att.needed) continue;
        const sorted = [...r.prices].sort((x, y) => x - y);
        const low = quantile(sorted, 0.25);
        const high = quantile(sorted, 0.75);
        const spread = r.stats.median > 0 ? (high - low) / r.stats.median : 99;
        const reliability = att.basis === "specs" ? (spread <= 1.0 ? "media" : "baixa") : att.basis === "model" && r.counts.final >= 15 && spread <= 0.6 ? "media" : "baixa";
        return {
          query: q,
          searched: tier.name,
          site,
          currency: r.stats.currency,
          n: r.counts.final,
          captured: r.counts.captured,
          median: round(r.stats.median),
          low: round(low),
          high: round(high),
          min: round(r.stats.min),
          max: round(r.stats.max),
          prices: sorted.map(round),
          basis: att.basis,
          category: cat?.name,
          spread: round(spread),
          reliability,
        };
      }
    }
  }
  }
  return null;
}
