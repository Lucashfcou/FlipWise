// Reduz o ficheiro de preços do eBay para a app carregar rápido: no máximo 40 preços por produto e país,
// escolhidos a intervalos iguais (a mediana e os quartis ficam praticamente iguais), arredondados a 0,5 €.
//   npm run slim:prices   (depois de buscar os preços)
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "src/data/ebay-prices.json";
const MAX = 40;
const data = JSON.parse(readFileSync(FILE, "utf8")) as { products: Record<string, Record<string, { prices?: number[]; parts?: number[] } & Record<string, unknown>>> };

const thin = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const pick = s.length <= MAX ? s : Array.from({ length: MAX }, (_, i) => s[Math.round((i * (s.length - 1)) / (MAX - 1))]);
  return pick.map((v) => Math.round(v * 2) / 2);
};

let before = 0;
let after = 0;
for (const sites of Object.values(data.products)) {
  for (const e of Object.values(sites)) {
    if (e.prices) {
      before += e.prices.length;
      e.prices = thin(e.prices);
      after += e.prices.length;
    }
    if (e.parts) e.parts = thin(e.parts);
  }
}
writeFileSync(FILE, JSON.stringify(data) + "\n");
console.log(`Preços: ${before} -> ${after}.`);
