// Corre o pipeline completo sobre scripts/mock_data.json e imprime o resultado no terminal.
//   npm run pipeline:demo                 classificador local de regras (sem chave)
//   ANTHROPIC_API_KEY=... npm run pipeline:demo -- --claude   classificador Claude (tool use)
import { readFileSync } from "node:fs";
import { claudeClassifier } from "../src/pipeline/claudeClassifier";
import { rulesClassifier } from "../src/pipeline/rulesClassifier";
import { runPipeline } from "../src/pipeline/run";
import { sanitize } from "../src/pipeline/sanitize";

const mock = JSON.parse(readFileSync(new URL("./mock_data.json", import.meta.url), "utf8")) as {
  query: string;
  items: unknown[];
};

const wantClaude = process.argv.includes("--claude");
const apiKey = process.env.ANTHROPIC_API_KEY;
if (wantClaude && !apiKey) {
  console.error("Falta ANTHROPIC_API_KEY. Defina a variável de ambiente ou corra sem --claude.");
  process.exit(1);
}
const classifier = wantClaude && apiKey ? claudeClassifier({ apiKey }) : rulesClassifier;

const money = (n: number, c: string) => `${n.toFixed(2)} ${c}`;
const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n));

const result = await runPipeline(mock.query, mock.items, classifier);
const listings = sanitize(mock.items);

console.log(`\nPesquisa: "${result.query}"   Classificador: ${result.classifier}\n`);
console.log("Anúncios sanitizados (id, título, preço, descrição limpa):");
for (const l of listings) {
  const price = l.price === null ? "sem preço" : money(l.price, l.currency);
  console.log(`  ${pad(l.id, 8)} ${pad(l.title, 46)} ${pad(price, 14)} ${pad(l.description, 40)}`);
}

console.log("\nRejeitados:");
for (const r of result.rejected) console.log(`  ${pad(r.id, 8)} ${pad(r.title, 46)} ${r.reason}`);

if (result.iqr?.applied) {
  console.log(
    `\nIQR: Q1=${result.iqr.q1.toFixed(2)}  Q3=${result.iqr.q3.toFixed(2)}  limites=[${result.iqr.lower.toFixed(2)}, ${result.iqr.upper.toFixed(2)}]`,
  );
} else {
  console.log("\nIQR: não aplicado (menos de 4 preços).");
}
if (result.outliers.length) {
  console.log("Outliers removidos pelo IQR:");
  for (const o of result.outliers) console.log(`  ${pad(o.id, 8)} ${pad(o.title, 46)} ${o.price.toFixed(2)}`);
}

console.log("\nContagem:");
console.log(`  capturados ${result.counts.captured}  |  validados ${result.counts.validated}  |  aproveitados ${result.counts.final}`);

if (result.stats) {
  const s = result.stats;
  console.log("\nPreço (após IQR):");
  console.log(`  médio   ${money(s.mean, s.currency)}`);
  console.log(`  mediano ${money(s.median, s.currency)}`);
  console.log(`  mínimo  ${money(s.min, s.currency)}`);
  console.log(`  máximo  ${money(s.max, s.currency)}`);
} else {
  console.log("\nSem anúncios válidos suficientes para estatística.");
}
console.log("");
