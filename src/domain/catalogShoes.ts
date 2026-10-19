import type { TechSeed } from "./catalogTech";

/**
 * Ténis famosos com muito mercado em segunda mão. Mesma ideia do catalogTech: o que pesquisar no eBay e como
 * reconhecer o modelo certo no título. O preço varia com a cor e o tamanho, por isso as entradas mais
 * dependentes da cor (Jordan 1 High, Yeezy) são um intervalo largo e valem como referência, não como garantia.
 */
const KIDS = /\b(kids?|ni[ñn]os?|ni[ñn]as?|junior|jr|gs|ps|td|toddler|infant|baby|beb[eé]|enfants?|kinder|bambin[oi]|ragazz[oi]|crian[cç]as?|jugend)\b/i;
const NOT_A_SHOE = /\b(cordones|cordones?|laces?|schn[uü]rsenkel|lacets|lacci|plantillas?|insoles?|einlegesohlen|shoe\s?tree|horma|spray|cleaner|limpiador|caja\s?(vac[ií]a|sola)|solo\s?caja|box\s?only|empty\s?box|leere\s?box|sticker|llavero|keychain|miniature|miniatura)\b/i;
const FAKE = /\b(replica|r[eé]plica|fake|custom|customi[sz]ed|bootleg|unauthorized|inspired)\b/i;
const NOT = [KIDS, NOT_A_SHOE, FAKE];

const S = (id: string, brand: string, name: string, variant: string, opts: TechSeed["opts"]): TechSeed => ({
  id, category: "shoe", brand, name, variant, opts: { ...opts, not: [...(opts.not ?? []), ...NOT] },
});

export const SHOES: TechSeed[] = [
  // Nike
  S("nike-af1-07-white", "Nike", "Air Force 1 '07", "Triple White", { q: "Nike Air Force 1 07 white", min: 40, must: [/air\s?force\s?(1|one)/i, /(white|blanc[oa]s?|wei[sß]|bianc[oa]|blanche?s?|triple)/i], not: [/\b(high|mid|shadow|utility|lv8|react|crater|sage|pixel|platform)\b/i] }),
  S("nike-dunk-low-panda", "Nike", "Dunk Low", "Black/White (Panda)", { q: "Nike Dunk Low Panda", min: 60, must: [/dunk/i, /\blow\b/i, /(panda|black\s?\/?\s?white|negr[oa]\s?\/?\s?blanc|nero\s?\/?\s?bianc|schwarz\s?\/?\s?wei)/i], not: [/\b(high|mid|sb|ko|off.?white)\b/i] }),
  S("nike-airmax-90", "Nike", "Air Max 90", "", { min: 45, must: [/air\s?max\s?90/i], not: [/\b(ndstrkt|futura|surplus)\b/i] }),
  S("nike-airmax-97", "Nike", "Air Max 97", "", { min: 55, must: [/air\s?max\s?97/i] }),
  S("nike-airmax-1", "Nike", "Air Max 1", "", { min: 45, must: [/air\s?max\s?1\b/i], not: [/air\s?max\s?(90|95|97|98)/i] }),
  S("nike-airmax-plus-tn", "Nike", "Air Max Plus (TN)", "", { q: "Nike Air Max Plus TN", min: 55, must: [/air\s?max\s?plus|\btn\b/i], not: [/plus\s?(3|iii)|drift/i] }),
  S("nike-blazer-mid-77", "Nike", "Blazer Mid '77", "", { q: "Nike Blazer Mid 77 vintage", min: 40, must: [/blazer/i, /mid/i, /77/i] }),
  // Jordan
  S("jordan-1-high-og", "Jordan", "Air Jordan 1 Retro High OG", "todas as cores", { q: "Air Jordan 1 Retro High OG", min: 80, must: [/jordan\s?1\b/i, /\bhigh\b/i], not: [/\b(low|mid|ko|dior|travis|off.?white|zoom|element|lv8|elevate|method)\b/i] }),
  S("jordan-1-low", "Jordan", "Air Jordan 1 Low", "", { q: "Air Jordan 1 Low", min: 55, must: [/jordan\s?1\b/i, /\blow\b/i], not: [/\b(high|mid|travis|off.?white|og\s?high|ko|elevate)\b/i] }),
  S("jordan-1-mid", "Jordan", "Air Jordan 1 Mid", "", { q: "Air Jordan 1 Mid", min: 50, must: [/jordan\s?1\b/i, /\bmid\b/i], not: [/\b(high|low|ko)\b/i] }),
  S("jordan-4-retro", "Jordan", "Air Jordan 4 Retro", "todas as cores", { q: "Air Jordan 4 Retro", min: 100, must: [/jordan\s?4\b/i], not: [/\b(rm|union|off.?white|travis|kaws)\b/i] }),
  // Adidas
  S("adidas-samba-og", "Adidas", "Samba OG", "", { q: "Adidas Samba OG", min: 45, must: [/samba/i], not: [/\b(sporty|rich|wales|bonner|pharrell)\b/i] }),
  S("adidas-gazelle", "Adidas", "Gazelle", "", { q: "Adidas Gazelle", min: 40, must: [/gazelle/i], not: [/\b(bold|indoor\s?x|gucci|wales|bonner)\b/i] }),
  S("adidas-campus-00s", "Adidas", "Campus 00s", "", { q: "Adidas Campus 00s", min: 45, must: [/campus/i, /00s?/i] }),
  S("adidas-superstar", "Adidas", "Superstar", "", { q: "Adidas Superstar", min: 35, must: [/superstar/i], not: [/\b(bold|xlg|platform)\b/i] }),
  S("adidas-stan-smith", "Adidas", "Stan Smith", "", { q: "Adidas Stan Smith", min: 35, must: [/stan\s?smith/i], not: [/\b(recon|lux|bold)\b/i] }),
  S("adidas-yeezy-350-v2", "Adidas", "Yeezy Boost 350 V2", "todas as cores", { q: "Adidas Yeezy Boost 350 V2", min: 80, must: [/yeezy/i, /350/i], not: [/\b(slide|foam|700|500|450|750)\b/i] }),
  S("adidas-ultraboost", "Adidas", "Ultraboost", "", { q: "Adidas Ultraboost", min: 45, must: [/ultra\s?boost/i] }),
  S("adidas-forum-low", "Adidas", "Forum Low", "", { q: "Adidas Forum Low", min: 40, must: [/forum/i, /\blow\b/i], not: [/\b(mid|high|84)\b/i] }),
  S("adidas-handball-spezial", "Adidas", "Handball Spezial", "", { q: "Adidas Handball Spezial", min: 50, must: [/(handball\s?)?spezial/i] }),
  // New Balance
  S("nb-550", "New Balance", "550", "", { q: "New Balance 550", min: 50, must: [/\b550\b/i, /new\s?balance|\bnb\b/i] }),
  S("nb-574", "New Balance", "574", "", { q: "New Balance 574", min: 35, must: [/\b574\b/i, /new\s?balance|\bnb\b/i] }),
  S("nb-530", "New Balance", "530", "", { q: "New Balance 530", min: 40, must: [/\b530\b/i, /new\s?balance|\bnb\b/i] }),
  S("nb-9060", "New Balance", "9060", "", { q: "New Balance 9060", min: 70, must: [/\b9060\b/i] }),
  // Outras marcas
  S("converse-chuck-70-high", "Converse", "Chuck 70 High", "", { q: "Converse Chuck 70 High", min: 40, must: [/(chuck|all\s?star)/i, /\b70s?\b/i], not: [/\b(low|ox|platform|lift)\b/i] }),
  S("vans-old-skool", "Vans", "Old Skool", "", { q: "Vans Old Skool", min: 30, must: [/old\s?skool/i], not: [/\b(platform|vault|og)\b/i] }),
  S("asics-gel-kayano-14", "ASICS", "Gel-Kayano 14", "", { q: "ASICS Gel-Kayano 14", min: 60, must: [/kayano/i, /\b14\b/i] }),
  S("puma-speedcat", "Puma", "Speedcat", "", { q: "Puma Speedcat", min: 45, must: [/speedcat/i] }),
];
