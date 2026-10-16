import { PRODUCTS } from "../domain/catalog";
import type { Condition, Observation } from "../domain/types";

/**
 * Preços recolhidos à mão no site do CeX Portugal (pt.webuy.com), uma página de cada vez.
 *  - venda  = preço de venda de usado na loja  -> teto ("refurb")
 *  - recompra = o que o CeX paga em dinheiro   -> piso ("buyback")
 * Estado da consola: A = "Caixa", B = "Sem Caixa", C = "Descontada".
 * Comandos: B -> "sem-drift", C -> "drift-leve" (aproximação: o CeX classifica por estética, não por drift).
 * Jogos: preço do disco completo. Horizon = edição Complete.
 */
export const MARKET_DATE = "2026-10-16";
export const MARKET_SOURCE = "CeX Portugal";

type Row = [Condition, number, number];

const CONSOLES: Record<string, Row[]> = {
  "ps4-slim-500": [["A", 210, 94], ["B", 160, 72], ["C", 150, 67]],
  "ps4-slim-1tb": [["A", 230, 103], ["B", 190, 85], ["C", 175, 78]],
  "ps4-pro-1tb": [["A", 320, 144], ["B", 240, 108], ["C", 220, 99]],
  "ps4-fat-500": [["A", 210, 94], ["B", 165, 74], ["C", 150, 67]],
  "ps5-disc": [["A", 640, 448], ["B", 620, 434], ["C", 610, 427]],
  "ps5-digital": [["A", 595, 416], ["B", 580, 406], ["C", 570, 399]],
  "switch-v2": [["A", 230, 103], ["B", 205, 92], ["C", 185, 83]],
  "switch-oled": [["A", 275, 123], ["B", 250, 112], ["C", 240, 108]],
  "xbox-series-s": [["A", 400, 252], ["B", 390, 195], ["C", 370, 185]],
  "xbox-series-x": [["A", 750, 472], ["B", 725, 456], ["C", 695, 437]],
  "ds4-v2": [["sem-drift", 65, 29], ["drift-leve", 60, 27]],
  dualsense: [["sem-drift", 72, 39], ["drift-leve", 68, 37]],
  "xbox-controller": [["sem-drift", 65, 32]],
};

/** [nome no catálogo, venda, recompra] */
const GAMES: [string, number, number][] = [
  ["The Last of Us Part II", 28, 13],
  ["God of War", 15, 7],
  ["Marvel's Spider-Man", 28, 13],
  ["Red Dead Redemption 2", 25, 12],
  ["Grand Theft Auto V", 22, 9],
  ["Uncharted 4", 10, 4],
  ["Horizon Zero Dawn", 10, 4],
  ["Bloodborne", 20, 9],
  ["Persona 5 Royal", 25, 12],
  ["Ghost of Tsushima", 32, 15],
  ["Death Stranding", 15, 7],
  ["Gran Turismo Sport", 10, 4],
  ["Days Gone", 28, 13],
  ["The Witcher 3 Wild Hunt", 20, 9],
  ["FIFA 23", 15, 3],
  ["Call of Duty Modern Warfare", 18, 8],
  ["Spider-Man Miles Morales", 38, 18],
  ["Final Fantasy VII Remake", 18, 8],
  ["Kingdom Hearts III", 12, 5],
  ["Dark Souls Remastered", 15, 7],
  ["Resident Evil 2", 30, 13],
  ["Tekken 7", 22, 10],
  ["Crash Bandicoot N. Sane Trilogy", 25, 12],
  ["Minecraft", 28, 13],
  ["Assassin's Creed Odyssey", 20, 9],
];

function pair(productId: string, condition: Condition, sell: number, buy: number): Observation[] {
  const base = { productId, condition, date: MARKET_DATE, source: MARKET_SOURCE };
  return [
    { ...base, kind: "refurb", value: sell },
    { ...base, kind: "buyback", value: buy },
  ];
}

/**
 * Anúncios ativos do eBay.es (compre já, usado), colhidos à mão. Só dois modelos: nos outros a pesquisa
 * misturava versões e lotes. Descartados valores abaixo do que o CeX paga e acima de 1,5x o que o CeX vende
 * (provável lote ou outro modelo). Estado assumido B. As vendas concluídas do eBay exigem login e não foram usadas.
 */
export const EBAY_SOURCE = "eBay.es (anúncios)";
const EBAY_ASKS: Record<string, number[]> = {
  "ps4-slim-500": [124.32, 79.9, 99.9, 140, 161.96, 120, 170, 150, 90, 109, 99.99, 229.9, 110, 104.9, 100, 137.31, 79.83, 159.99],
  "ps4-pro-1tb": [139.9, 167.9, 179.9, 134.9, 354.9, 134.9, 190, 135.07, 179, 218.99, 244.7, 327.99, 170, 148.76, 200, 153.08, 133.69],
};

export function marketObservations(): Observation[] {
  const out: Observation[] = [];
  for (const [id, prices] of Object.entries(EBAY_ASKS)) {
    prices.forEach((value, i) =>
      out.push({ productId: id, condition: "B", kind: "ask", value, source: EBAY_SOURCE, date: MARKET_DATE }),
    );
  }
  for (const [id, rows] of Object.entries(CONSOLES)) {
    for (const [cond, sell, buy] of rows) out.push(...pair(id, cond, sell, buy));
  }
  for (const [name, sell, buy] of GAMES) {
    const p = PRODUCTS.find((x) => x.category === "game" && x.name === name);
    if (p) out.push(...pair(p.id, "completo", sell, buy));
  }
  return out;
}
