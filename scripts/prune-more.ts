// Guarda em src/data/more-keep.json só os produtos do catálogo grande que têm anúncios suficientes (6 ou mais).
//   npm run prune:more   (depois de npm run ebay:refresh -- --more --missing --no-parts)
import { readFileSync, writeFileSync } from "node:fs";
import { MORE_ALL } from "../src/domain/catalogMore";

const FILE = "src/data/ebay-prices.json";
const data = JSON.parse(readFileSync(FILE, "utf8")) as { products?: Record<string, Record<string, { prices?: number[] }>> };
const count = (id: string) => Object.values(data.products?.[id] ?? {}).reduce((n, v) => n + (v.prices?.length ?? 0), 0);

const keep = MORE_ALL.filter((s) => count(s.id) >= 6).map((s) => s.id);
const byCat: Record<string, { kept: number; total: number }> = {};
for (const s of MORE_ALL) {
  const c = (byCat[s.category] ??= { kept: 0, total: 0 });
  c.total++;
  if (count(s.id) >= 6) c.kept++;
}
writeFileSync("src/data/more-keep.json", JSON.stringify({ ids: keep }, null, 2) + "\n");
console.log(`Mantidos ${keep.length} de ${MORE_ALL.length}.`);
for (const [c, v] of Object.entries(byCat)) console.log(`  ${c.padEnd(12)} ${v.kept}/${v.total}`);
