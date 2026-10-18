import { PRODUCTS } from "../domain/catalog";
import { rulesClassifier } from "../pipeline/rulesClassifier";
import type { Classifier, Listing, Verdict } from "../pipeline/types";

export interface ProductQuery {
  /** Texto de pesquisa no eBay. */
  q: string;
  /** O título tem de cumprir TODAS. Evita outro modelo ou capacidade. */
  must: RegExp[];
  /** O título não pode cumprir NENHUMA. */
  mustNot: RegExp[];
}

/** Acessórios em PT, ES, EN, DE, FR e IT. */
const ACCESSORY_WORDS =
  /\b(funda|carcasa|soporte|cargador|cable|skin|stand|base de carga|hülle|tasche|ladeger[aä]t|kabel|coque|housse|chargeur|custodia|caricatore|cavo|capa|suporte|carregador|case|cover)\b/i;

/** Lotes: consola com jogos ou vários extras distorce o preço. */
const BUNDLE_WORDS =
  /\+\s*\d*\s*(juego|game|jeux|spiel|titul|jogo|giochi)|\b\d+\s*(juegos|games|jeux|spiele|jogos|giochi)\b|\b(lote|pack|bundle|paquete|konvolut|lot de)\b/i;

const NOT_ALONE = /\b(skin|stand|soporte|cargador|charger|base|funda|carcasa|volante|auricular|headset)\b/i;

const CONSOLES: Record<string, ProductQuery> = {
  "ps4-slim-500": { q: "PlayStation 4 Slim 500GB", must: [/slim/i, /500\s?gb/i], mustNot: [/pro\b/i, /1\s?tb/i] },
  "ps4-slim-1tb": { q: "PlayStation 4 Slim 1TB", must: [/slim/i, /1\s?(tb|to)\b/i], mustNot: [/pro\b/i, /500\s?gb/i] },
  "ps4-pro-1tb": { q: "PlayStation 4 Pro 1TB", must: [/pro\b/i], mustNot: [/slim/i, /ps5|playstation\s?5/i] },
  "ps4-fat-500": { q: "PlayStation 4 500GB", must: [/500\s?gb/i], mustNot: [/slim/i, /pro\b/i, /ps5|playstation\s?5/i] },
  "ps5-disc": { q: "PlayStation 5 825GB disc", must: [/(ps5|playstation\s?5)/i], mustNot: [/digital/i, /pro\b/i, /ps4|playstation\s?4/i] },
  "ps5-digital": { q: "PlayStation 5 Digital Edition", must: [/(ps5|playstation\s?5)/i, /digital/i], mustNot: [/pro\b/i] },
  "switch-v2": { q: "Nintendo Switch HAC-001-01", must: [/switch/i], mustNot: [/oled/i, /lite/i, /\b2\b/i] },
  "switch-oled": { q: "Nintendo Switch OLED", must: [/switch/i, /oled/i], mustNot: [/lite/i] },
  "xbox-series-s": { q: "Xbox Series S 512GB", must: [/series\s?s/i], mustNot: [/series\s?x/i] },
  "xbox-series-x": { q: "Xbox Series X 1TB", must: [/series\s?x/i], mustNot: [/series\s?s/i] },
  "ds4-v2": { q: "DualShock 4 V2 mando", must: [/dualshock\s?4|ds4/i], mustNot: [/ps5/i, NOT_ALONE] },
  dualsense: { q: "DualSense PS5 mando", must: [/dualsense/i], mustNot: [/edge/i, NOT_ALONE] },
  "xbox-controller": { q: "Xbox Series controller", must: [/(xbox)/i], mustNot: [/elite/i, /one\b/i, NOT_ALONE] },
};

const CONSOLE_IDS = [
  "ps4-slim-500", "ps4-slim-1tb", "ps4-pro-1tb", "ps4-fat-500", "ps5-disc", "ps5-digital",
  "switch-v2", "switch-oled", "xbox-series-s", "xbox-series-x",
];
for (const id of CONSOLE_IDS) CONSOLES[id].mustNot.push(ACCESSORY_WORDS, BUNDLE_WORDS);

export function queryFor(productId: string): ProductQuery | undefined {
  if (CONSOLES[productId]) return CONSOLES[productId];
  const p = PRODUCTS.find((x) => x.id === productId);
  if (!p || p.category !== "game") return undefined;
  const words = p.name.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !["the", "and"].includes(w));
  return {
    q: `${p.name} PS4`,
    must: [...words.slice(0, 3).map((w) => new RegExp(`\\b${w}`, "i")), /ps4|playstation\s?4/i],
    mustNot: [/ps5|playstation\s?5/i, /xbox/i, /switch/i, BUNDLE_WORDS, ACCESSORY_WORDS],
  };
}

/** Junta as regras gerais (acessórios, defeitos, isca...) com as do produto, para não aceitar outro modelo. */
export function productClassifier(q: ProductQuery): Classifier {
  return {
    name: "regras locais + produto",
    async classify(query: string, listings: Listing[]): Promise<Verdict[]> {
      const base = await rulesClassifier.classify(query, listings);
      return base.map((v, i) => {
        if (!v.valid) return v;
        const t = listings[i].title;
        if (!q.must.every((r) => r.test(t))) return { id: v.id, valid: false, reason: "não corresponde ao modelo pedido" };
        if (q.mustNot.some((r) => r.test(t))) return { id: v.id, valid: false, reason: "outro modelo ou acessório" };
        return v;
      });
    },
  };
}
