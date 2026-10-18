// Atualiza src/data/ebay-prices.json com anúncios ativos do eBay (API Browse), já limpos pelo pipeline.
//   1. Chaves no ficheiro .env (NUNCA no git nem no chat): EBAY_CLIENT_ID (App ID), EBAY_CLIENT_SECRET (Cert ID)
//        EBAY_SITES=EBAY_ES            (opcional; ex.: EBAY_ES,EBAY_DE,EBAY_FR,EBAY_IT)
//        EBAY_MAX_CALLS=400            (opcional; teto de pedidos por corrida)
//   2. npm run ebay:refresh              (tudo)
//      npm run ebay:refresh -- --only iphone-13-128     (um produto)
//      npm run ebay:refresh -- --ids a,b,c              (vários produtos)
//      npm run ebay:refresh -- --category phone         (uma categoria: console, phone, controller, game)
//      npm run ebay:refresh -- --no-parts               (salta a busca de "para peças")
//      npm run ebay:refresh -- --missing                (só os produtos que ainda não têm dados)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { MARKETPLACES, EbayError, getToken, searchItems, toRaw } from "../src/ebay/client";
import type { EbayCondition, EbayCredentials, MarketplaceId } from "../src/ebay/client";
import { productClassifier, queryFor } from "../src/ebay/queries";
import { PRODUCTS } from "../src/domain/catalog";
import { referenceFor } from "../src/data/market";
import { runPipeline } from "../src/pipeline/run";

if (existsSync(".env")) process.loadEnvFile(".env");

const clientId = process.env.EBAY_CLIENT_ID ?? "";
const clientSecret = process.env.EBAY_CLIENT_SECRET ?? "";
if (!clientId || !clientSecret) {
  console.error("Faltam EBAY_CLIENT_ID e EBAY_CLIENT_SECRET no ficheiro .env.");
  process.exit(1);
}

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const sites = (process.env.EBAY_SITES ?? "EBAY_ES").split(",").map((s) => s.trim()).filter((s): s is MarketplaceId => s in MARKETPLACES);
const maxCalls = Number(process.env.EBAY_MAX_CALLS ?? 800);
/** Menos anúncios válidos do que isto = dado pouco fiável (como o PS5 Pro e o Switch 2): o produto fica sem dados. */
const MIN_VALID = 6;
const only = arg("--only");
const onlyIds = arg("--ids")?.split(",").map((x) => x.trim()).filter(Boolean);
const category = arg("--category");
const withParts = !process.argv.includes("--no-parts");
const missingOnly = process.argv.includes("--missing");

const creds: EbayCredentials = { clientId, clientSecret };
const { token } = await getToken(creds);

const FILE = "src/data/ebay-prices.json";
const current = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : { products: {} };
type Entry = { prices: number[]; captured: number; validated: number; parts?: number[]; partsCaptured?: number };
const products: Record<string, Record<string, Entry>> = current.products ?? {};

const MAIN_CONDITION = { console: "B", phone: "B", tablet: "B", laptop: "B", watch: "B", audio: "B", camera: "B", gpu: "B", controller: "sem-drift", game: "completo" } as const;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let calls = 0;
let stop = false;

async function search(site: MarketplaceId, q: string, condition: EbayCondition) {
  calls++;
  return searchItems(token, site, q, 100, fetch, condition);
}

for (const p of PRODUCTS) {
  if (stop) break;
  if (only && p.id !== only) continue;
  if (onlyIds && !onlyIds.includes(p.id)) continue;
  if (category && p.category !== category) continue;
  const q = queryFor(p.id);
  if (!q) continue;

  for (const site of sites) {
    if (missingOnly && products[p.id]?.[site]) continue;
    if (calls >= maxCalls) {
      console.log(`Teto de ${maxCalls} pedidos atingido.`);
      stop = true;
      break;
    }
    try {
      // Usados: limites de plausibilidade a partir do CeX (se existir). Abaixo do que a loja paga ou acima do que vende = suspeito.
      const ref = referenceFor(p.id, MAIN_CONDITION[p.category]);
      const bounds = { min: Math.max(ref.floor !== undefined ? ref.floor * 0.8 : 0, q.min ?? 0) || undefined, max: ref.ceiling };
      const items = await search(site, q.q, "USED");
      const r = await runPipeline(`${p.name} ${p.variant}`, toRaw(items), productClassifier(q), "EUR", bounds);
      const entry: Entry = { prices: r.prices, captured: r.counts.captured, validated: r.counts.validated };

      let partsInfo = "";
      if (withParts && p.category !== "game" && calls < maxCalls) {
        await sleep(250);
        const refB = referenceFor(p.id, "B");
        const partsItems = await search(site, q.q, "PARTS");
        const rp = await runPipeline(`${p.name} ${p.variant}`, toRaw(partsItems), productClassifier(q, { parts: true }), "EUR", { max: refB.floor });
        entry.parts = rp.prices;
        entry.partsCaptured = rp.counts.captured;
        partsInfo = `  | peças: ${rp.counts.final}/${rp.counts.captured}` + (rp.stats ? ` med ${rp.stats.median}` : "");
      }

      if (r.counts.final < MIN_VALID) {
        delete products[p.id]?.[site];
        console.log(`${p.id.padEnd(34)} ${site.slice(5)}  só ${r.counts.final} válidos de ${r.counts.captured}: ignorado (sem dados)`);
        await sleep(250);
        continue;
      }
      (products[p.id] ??= {})[site] = entry;
      console.log(
        `${p.id.padEnd(34)} ${site.slice(5)}  ${String(r.counts.final).padStart(3)}/${String(r.counts.captured).padStart(3)} usados` +
          (r.stats ? `  med ${String(r.stats.median).padStart(7)}` : "  (sem dados)") + partsInfo,
      );
    } catch (e) {
      console.error(`${p.id} ${site}: ${e instanceof Error ? e.message : e}`);
      if (e instanceof EbayError && e.status === 429) {
        console.error("Limite de pedidos do eBay atingido: a parar.");
        stop = true;
        break;
      }
    }
    await sleep(250);
  }
}

writeFileSync(FILE, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), sites, products }, null, 2) + "\n");
console.log(`\nGravado em ${FILE}. Pedidos feitos: ${calls}.`);
