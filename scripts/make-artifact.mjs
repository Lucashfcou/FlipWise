// Gera dist-artifact/garimpo.html: o app inteiro num único ficheiro (CSS, JS e fontes embutidos).
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const out = "dist-artifact/build";
await build({
  plugins: [react()],
  base: "./",
  logLevel: "warn",
  build: { outDir: out, emptyOutDir: true, assetsInlineLimit: 100_000_000, cssCodeSplit: false },
});

const assets = join(out, "assets");
const files = readdirSync(assets);
const jsFile = files.find((f) => f.endsWith(".js"));
const cssFile = files.find((f) => f.endsWith(".css"));
let css = readFileSync(join(assets, cssFile), "utf8");
const js = readFileSync(join(assets, jsFile), "utf8");

const doto = readFileSync("public/fonts/doto-latin.woff2").toString("base64");
css = css.replace(/url\(["']?[^)"']*doto-latin\.woff2["']?\)/g, `url(data:font/woff2;base64,${doto})`);

const html = `<title>Garimpo</title>
<style>${css}</style>
<div id="root"></div>
<script type="module">${js.replaceAll("</script", "<\\/script")}</script>
`;
mkdirSync("dist-artifact", { recursive: true });
writeFileSync("dist-artifact/garimpo.html", html);
console.log("ok", (html.length / 1024).toFixed(0) + " KB");
