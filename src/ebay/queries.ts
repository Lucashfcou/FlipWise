import { PRODUCTS } from "../domain/catalog";
import { createRulesClassifier, rulesClassifier } from "../pipeline/rulesClassifier";
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
  /\b(funda|carcasa|soporte|cargador|cable|skin|stand|base de carga|hülle|tasche|ladeger[aä]t|kabel|coque|housse|chargeur|custodia|caricatore|cavo|capa|suporte|carregador|case|cover|protector|l[aá]mina|auricular|airpods)\b/i;

/** Lotes: consola com jogos ou vários extras distorce o preço. */
const BUNDLE_WORDS =
  /\+\s*\d*\s*(juego|game|jeux|spiel|titul|jogo|giochi)|\b\d+\s*(juegos|games|jeux|spiele|jogos|giochi)\b|\b(lote|pack|bundle|paquete|konvolut|lot de)\b/i;

/** Edições especiais e coleção: preço próprio, fora da média do modelo normal. */
const SPECIAL_EDITION =
  /\b(limited|limitada|limitado|special edition|edici[oó]n especial|edici[oó]n limitada|collector|coleccionista|sonderedition|anniversary|aniversario|spider-?man|days of play|fortnite|star wars|cyberpunk|destiny|gran turismo|last of us|god of war|horizon|uncharted|pok[eé]mon|zelda|mario|splatoon|animal crossing|call of duty|fifa|minecraft|dragon ball|assassin|crash|gold|dorad[oa]|rose gold|rosa|camo|crystal|glacier|500 million|20th|ghostwire|returnal|stellar|cosmic|galaxy|slayer|midnight sun|cobalt)\b/i;

const NOT_ALONE = /\b(skin|stand|soporte|cargador|charger|base|funda|carcasa|volante|auricular|headset|grips?|thumb)\b/i;

const NO_NEW_MODEL = [ACCESSORY_WORDS, BUNDLE_WORDS, SPECIAL_EDITION];

/** Constrói uma consulta de consola: nome pesquisado, o que o título deve ter e o que não pode ter. */
const dev = (q: string, must: RegExp[], mustNot: RegExp[] = []): ProductQuery => ({
  q,
  must,
  mustNot: [...mustNot, ...NO_NEW_MODEL],
});

const CONSOLES: Record<string, ProductQuery> = {
  "ps4-slim-500": dev("PlayStation 4 Slim 500GB", [/slim/i, /500\s?gb/i], [/pro\b/i, /1\s?tb/i]),
  "ps4-slim-1tb": dev("PlayStation 4 Slim 1TB", [/slim/i, /1\s?(tb|to)\b/i], [/pro\b/i, /500\s?gb/i]),
  "ps4-pro-1tb": dev("PlayStation 4 Pro 1TB", [/pro\b/i], [/slim/i, /ps5|playstation\s?5/i]),
  "ps4-fat-500": dev("PlayStation 4 500GB", [/500\s?gb/i], [/slim/i, /pro\b/i, /ps5|playstation\s?5/i]),
  "ps5-disc": dev("PlayStation 5 825GB disc", [/(ps5|playstation\s?5)/i], [/digital/i, /pro\b/i, /slim/i, /\b(1|2)\s?tb\b/i, /ps4|playstation\s?4/i]),
  "ps5-digital": dev("PlayStation 5 Digital Edition 825GB", [/(ps5|playstation\s?5)/i, /digital/i], [/pro\b/i, /slim/i, /\b(1|2)\s?tb\b/i]),
  "ps5-slim-disc": dev("PlayStation 5 Slim 1TB disc", [/(ps5|playstation\s?5)/i, /slim/i], [/digital/i, /pro\b/i]),
  "ps5-slim-digital": dev("PlayStation 5 Slim Digital 1TB", [/(ps5|playstation\s?5)/i, /slim/i, /digital/i], [/pro\b/i]),
  // PS5 Pro e Switch 2: sem consulta por agora. Os anúncios "usados" são raros e vêm misturados (acessórios, lotes, novos),
  // o que dava preços sem sentido. Voltar a ligar quando houver mais usados à venda.
  "ps3-slim-500": dev("PlayStation 3 Slim 500GB", [/(ps3|playstation\s?3)/i, /500\s?gb/i], [/ps4|ps2/i]),
  "ps3-slim-250": dev("PlayStation 3 Slim 250GB", [/(ps3|playstation\s?3)/i, /250\s?gb/i], [/ps4|ps2/i]),
  "ps2-slim": dev("PlayStation 2 Slim", [/(ps2|playstation\s?2)/i, /slim/i], [/ps3|ps4/i]),
  "psp-3000": dev("PSP 3000", [/\bpsp\b/i, /3000|3004|3003/i], [/vita/i, /go\b/i]),
  "ps-vita": dev("PS Vita", [/vita/i], [/ps4|ps5/i]),
  "switch-v2": dev("Nintendo Switch HAC-001-01", [/switch/i], [/oled/i, /lite/i, /\b2\b/i]),
  "switch-oled": dev("Nintendo Switch OLED", [/switch/i, /oled/i], [/lite/i]),
  "switch-lite": dev("Nintendo Switch Lite", [/switch/i, /lite/i], [/oled/i]),
  wii: dev("Nintendo Wii", [/\bwii\b/i], [/\bu\b/i, /mini/i]),
  "wii-u": dev("Nintendo Wii U 32GB", [/wii\s?u/i], []),
  "3ds-xl": dev("Nintendo 3DS XL", [/3ds/i, /xl/i], [/\b2ds\b/i]),
  "xbox-series-s": dev("Xbox Series S 512GB", [/series\s?s/i], [/series\s?x/i]),
  "xbox-series-x": dev("Xbox Series X 1TB", [/series\s?x/i], [/series\s?s/i]),
  "xbox-one-s": dev("Xbox One S 1TB", [/one\s?s\b/i], [/series/i, /one\s?x/i]),
  "xbox-one-x": dev("Xbox One X 1TB", [/one\s?x\b/i], [/series/i, /one\s?s/i]),
  "xbox-360-slim": dev("Xbox 360 Slim 250GB", [/360/i, /(slim|\be\b|250)/i], [/one|series/i]),
  "steam-deck-lcd": dev("Steam Deck 256GB", [/steam\s?deck/i, /256/i], [/oled/i, /512/i, /1\s?tb/i]),
  "steam-deck-oled": dev("Steam Deck OLED 512GB", [/steam\s?deck/i, /oled/i], []),
};

const CONTROLLERS: Record<string, ProductQuery> = {
  "ds4-v2": { q: "DualShock 4 V2 mando", must: [/dualshock\s?4|ds4/i], mustNot: [/ps5/i, NOT_ALONE, SPECIAL_EDITION] },
  dualsense: { q: "DualSense PS5 mando", must: [/dualsense/i], mustNot: [/edge/i, NOT_ALONE, SPECIAL_EDITION] },
  "joycon-pair": { q: "Joy-Con par Nintendo Switch", must: [/joy-?\s?con/i], mustNot: [/3rd|gen[eé]rico|compatible|grip|dock|strap|correa|single|\b1\b/i, NOT_ALONE, SPECIAL_EDITION] },
  "switch-pro-controller": { q: "Nintendo Switch Pro Controller", must: [/pro\s?controller|mando\s?pro/i], mustNot: [/compatible|gen[eé]rico|3rd/i, NOT_ALONE, SPECIAL_EDITION] },
  "xbox-controller": { q: "Xbox Series controller", must: [/xbox/i], mustNot: [/elite/i, /one\b/i, NOT_ALONE, SPECIAL_EDITION] },
  "xbox-one-controller": { q: "Xbox One controller", must: [/xbox/i, /one\b/i], mustNot: [/elite/i, /series/i, NOT_ALONE, SPECIAL_EDITION] },
};

/** iPhone: modelo e capacidade têm de bater; outras capacidades e variantes (Max, Plus, mini) ficam de fora. */
function phoneQuery(productId: string): ProductQuery | undefined {
  const m = productId.match(/^iphone-(\d+)(-pro)?-(\d+)$/);
  if (!m) return undefined;
  const [, gen, pro, gb] = m;
  const others = ["64", "128", "256", "512"].filter((x) => x !== gb).map((x) => `${x}\\s?gb`).join("|");
  const variants = pro ? "max|mini|plus" : "pro|max|mini|plus";
  return {
    q: `iPhone ${gen}${pro ? " Pro" : ""} ${gb}GB`,
    must: [new RegExp(`iphone\\s?${gen}\\b`, "i"), pro ? /\bpro\b/i : /./, new RegExp(`\\b${gb}\\s?gb`, "i")],
    mustNot: [new RegExp(`\\b(${variants})\\b`, "i"), new RegExp(`\\b(${others}|1\\s?tb)\\b`, "i"), ACCESSORY_WORDS, BUNDLE_WORDS],
  };
}

const PLATFORMS = {
  PS4: { search: "PS4", is: /ps4|playstation\s?4/i, not: [/ps5|playstation\s?5/i, /xbox/i, /switch/i] },
  PS5: { search: "PS5", is: /ps5|playstation\s?5/i, not: [/ps4|playstation\s?4/i, /xbox/i, /switch/i] },
  Switch: { search: "Nintendo Switch", is: /switch/i, not: [/ps4|playstation\s?4/i, /ps5|playstation\s?5/i, /xbox/i] },
} as const;

function gameQuery(productId: string): ProductQuery | undefined {
  const p = PRODUCTS.find((x) => x.id === productId);
  if (!p || p.category !== "game") return undefined;
  const plat = PLATFORMS[p.variant as keyof typeof PLATFORMS];
  if (!plat) return undefined;
  const words = p.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "of"].includes(w));
  return {
    q: `${p.name} ${plat.search}`,
    must: [...words.slice(0, 3).map((w) => new RegExp(`\\b${w}`, "i")), plat.is],
    mustNot: [...plat.not, BUNDLE_WORDS, ACCESSORY_WORDS],
  };
}

export function queryFor(productId: string): ProductQuery | undefined {
  return CONSOLES[productId] ?? CONTROLLERS[productId] ?? phoneQuery(productId) ?? gameQuery(productId);
}

/**
 * Junta as regras gerais (acessórios, defeitos, isca...) com as do produto, para não aceitar outro modelo.
 * Com `parts`, aceita anúncios defeituosos ou "para peças" (usado para medir o valor de peças).
 */
export function productClassifier(q: ProductQuery, opts: { parts?: boolean } = {}): Classifier {
  const base = opts.parts ? createRulesClassifier({ allowDefective: true }) : rulesClassifier;
  return {
    name: opts.parts ? "regras locais + produto (para peças)" : "regras locais + produto",
    async classify(query: string, listings: Listing[]): Promise<Verdict[]> {
      const verdicts = await base.classify(query, listings);
      return verdicts.map((v, i) => {
        if (!v.valid) return v;
        // Sem acentos, para "Ragnarök" casar com "ragnarok" e "Pokémon" com "pokemon".
        const t = listings[i].title.normalize("NFD").replace(/[̀-ͯ]/g, "");
        if (!q.must.every((r) => r.test(t))) return { id: v.id, valid: false, reason: "não corresponde ao modelo pedido" };
        if (q.mustNot.some((r) => r.test(t))) return { id: v.id, valid: false, reason: "outro modelo, edição especial ou acessório" };
        return v;
      });
    },
  };
}
