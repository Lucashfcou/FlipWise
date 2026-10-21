// Empacota as funções da Vercel (api-src/*.ts) em api/*.mjs com esbuild: assim não dependem de extensões nos imports nem de
// o Vercel compilar TypeScript. Corre dentro de `npm run build`; os ficheiros gerados também vão no git (a Vercel procura
// as funções na pasta api/ antes de construir).
import { build } from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync("api/capture", { recursive: true });
const entries = [
  ["api-src/capture.ts", "api/capture.mjs"],
  ["api-src/status.ts", "api/capture/status.mjs"],
  ["api-src/lookup.ts", "api/lookup.mjs"],
];
for (const [entry, out] of entries) {
  await build({
    entryPoints: [entry],
    outfile: out,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    minify: false,
    sourcemap: false,
    legalComments: "none",
    banner: { js: "// Gerado por scripts/build-api.mjs a partir de api-src/. Não editar à mão." },
  });
  console.log(`${entry} -> ${out}`);
}
