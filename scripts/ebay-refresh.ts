// Atualiza src/data/ebay-prices.json com anúncios ativos do eBay (API Browse), já limpos pelo pipeline.
//   1. Cria um ficheiro .env na raiz do projeto (NUNCA o envies para o git nem para o chat):
//        EBAY_CLIENT_ID=...
//        EBAY_CLIENT_SECRET=...
//        EBAY_SITES=EBAY_ES            (opcional; ex.: EBAY_ES,EBAY_DE,EBAY_FR,EBAY_IT)
//        EBAY_MAX_CALLS=200            (opcional; teto de pedidos por corrida)
//   2. npm run ebay:refresh            (só atualiza; --only ps4-slim-500 para um produto)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { MARKETPLACES, getToken, searchItems, toRaw } from "../src/ebay/client";
import type { EbayCredentials, MarketplaceId } from "../src/ebay/client";
import { productClassifier, queryFor } from "../src/ebay/queries";
import { PRODUCTS } from "../src/domain/catalog";
import { runPipeline } from "../src/pipeline/run";

if (existsSync(".env")) process.loadEnvFile(".env");

const clientId = process.env.EBAY_CLIENT_ID ?? "";
const clientSecret = process.env.EBAY_CLIENT_SECRET ?? "";
if (!clientId || !clientSecret) {
  console.error("Faltam EBAY_CLIENT_ID e EBAY_CLIENT_SECRET no ficheiro .env. Ainda não corre sem as chaves do eBay.");
  process.exit(1);
}

const sites = (process.env.EBAY_SITES ?? "EBAY_ES").split(",").map((s) => s.trim()).filter((s): s is MarketplaceId => s in MARKETPLACES);
const maxCalls = Number(process.env.EBAY_MAX_CALLS ?? 200);
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx > -1 ? process.argv[onlyIdx + 1] : undefined;

const creds: EbayCredentials = { clientId, clientSecret };
const { token } = await getToken(creds);

const FILE = "src/data/ebay-prices.json";
const current = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : { products: {} };
const products: Record<string, Record<string, { prices: number[]; captured: number; validated: number }>> = current.products ?? {};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let calls = 0;

for (const p of PRODUCTS) {
  if (only && p.id !== only) continue;
  const q = queryFor(p.id);
  if (!q) continue;
  for (const site of sites) {
    if (calls >= maxCalls) break;
    try {
      calls++;
      const items = await searchItems(token, site, q.q, 100);
      const r = await runPipeline(`${p.name} ${p.variant}`, toRaw(items), productClassifier(q));
      (products[p.id] ??= {})[site] = { prices: r.prices, captured: r.counts.captured, validated: r.counts.validated };
      console.log(`${p.id.padEnd(28)} ${site}  capturados ${r.counts.captured}  validados ${r.counts.validated}  aproveitados ${r.counts.final}` +
        (r.stats ? `  mediana ${r.stats.median} ${r.stats.currency}` : "  (sem dados)"));
    } catch (e) {
      console.error(`${p.id} ${site}: ${e instanceof Error ? e.message : e}`);
    }
    await sleep(300);
  }
}

writeFileSync(FILE, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), sites, products }, null, 2) + "\n");
console.log(`\nGravado em ${FILE}. Pedidos feitos: ${calls}.`);
