import { PRODUCTS, productLabel } from "../domain/catalog";
import type { Product } from "../domain/types";

/**
 * Casa o nome livre que a IA leu do print ("Samsung Galaxy S21 Ultra 256GB") com um produto do catálogo.
 * É código, não IA: assim a IA não precisa de ver o catálogo (mais barato) e não fica presa a ele.
 */

const ALIASES: [RegExp, string][] = [
  [/\bseries\s?(\d+)\b/g, "s$1"],
  [/\bps\s?([2345])\b/g, "playstation $1"],
  [/\bpsp\b/g, "psp"],
  [/\bjoy-?con\b/g, "joycon"],
  [/\bdual\s?sense\b/g, "dualsense"],
  [/\bdual\s?shock\s?(\d)\b/g, "ds$1"],
  [/\bairpods\b/g, "airpods"],
  [/\bgeforce\b/g, ""],
  [/\bnvidia\b/g, ""],
  [/\bradeon\b/g, ""],
];

const norm = (s: string) => {
  let x = s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  for (const [re, to] of ALIASES) x = x.replace(re, to);
  return x;
};
const words = (s: string) => norm(s).split(/[^a-z0-9+]+/).filter(Boolean);

const STOP = new Set(["de", "da", "do", "the", "and", "con", "para", "for", "with", "wi", "fi", "edition", "series"]);
const CAPACITY = /^(\d+)(gb|tb)$/;

/** Capacidades escritas no texto: "128GB", "1 TB" -> {"128gb","1tb"}. */
function capacities(s: string): Set<string> {
  const out = new Set<string>();
  for (const m of norm(s).matchAll(/(\d+(?:[.,]\d+)?)\s?(gb|tb)\b/g)) out.add(`${m[1].replace(",", ".")}${m[2]}`);
  return out;
}

interface Indexed {
  p: Product;
  nameTokens: string[];
  brandTokens: string[];
  /** Nome genérico ("7", "One", "Go"): só casa se a marca também aparecer no texto. */
  weak: boolean;
  caps: Set<string>;
}

let INDEX: Indexed[] | null = null;
function index(): Indexed[] {
  if (INDEX) return INDEX;
  INDEX = PRODUCTS.map((p) => {
    const nameTokens = words(p.name).filter((w) => !STOP.has(w) && w.length > 0);
    return {
      p,
      nameTokens,
      brandTokens: words(p.brand),
      weak: !nameTokens.some((t) => t.length >= 4 || (/\d/.test(t) && /[a-z]/.test(t))),
      caps: capacities(p.variant + " " + p.name),
    };
  });
  return INDEX;
}

export interface CatalogMatch {
  /** Produto certo, quando só há um candidato. */
  exact?: Product;
  /** Vários candidatos (ex.: o mesmo telemóvel em 128 e 256 GB) quando falta um dado para escolher. */
  options: Product[];
}

/**
 * `query`: nome lido do print. `specs`: especificações curtas lidas ("128GB"). Devolve o produto do catálogo, ou várias
 * opções da mesma família, ou nada.
 */
export function matchCatalog(query: string, specs: string[] = []): CatalogMatch {
  const qw = new Set(words(query));
  const qcaps = capacities(`${query} ${specs.join(" ")}`);
  if (qw.size === 0) return { options: [] };

  // Palavra inteira, ou duas palavras seguidas coladas ("joy con" -> "joycon"). Nada de pedaços de palavra ("sense" em "dualsense").
  const ordered = words(query);
  for (let k = 0; k + 1 < ordered.length; k++) qw.add(ordered[k] + ordered[k + 1]);
  const hit = (tok: string) => qw.has(tok);

  let best = 0;
  let cands: Indexed[] = [];
  for (const ix of index()) {
    if (ix.nameTokens.length === 0) continue;
    if (!ix.nameTokens.every(hit)) continue;
    if (ix.weak && !ix.brandTokens.every(hit)) continue;
    const score = ix.nameTokens.length;
    if (score > best) {
      best = score;
      cands = [ix];
    } else if (score === best) cands.push(ix);
  }
  if (cands.length === 0) return { options: [] };

  // Capacidade: se o texto diz uma, só ficam os produtos dessa capacidade (e os sem capacidade na variante).
  if (qcaps.size > 0) {
    const same = cands.filter((c) => [...c.caps].some((x) => qcaps.has(x)) || c.caps.size === 0);
    if (same.length > 0) cands = same;
    else return { options: [] };
  }
  // Variante sem capacidade ("disc", "digital", "OLED"): usa as palavras da variante que aparecem no texto.
  const withVariant = cands.filter((c) => {
    const vw = words(c.p.variant).filter((w) => !CAPACITY.test(w) && !/^\d+$/.test(w) && !STOP.has(w));
    return vw.length > 0 && vw.every(hit);
  });
  if (withVariant.length > 0) cands = withVariant;

  const uniq = [...new Map(cands.map((c) => [c.p.id, c.p])).values()];
  if (uniq.length === 1) return { exact: uniq[0], options: [] };
  return { options: uniq.slice(0, 8) };
}

export const optionLabel = (p: Product) => productLabel(p);
