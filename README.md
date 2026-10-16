# Garimpo

PWA para revendedores de eletrónicos usados (Portugal/Europa). Faixa de preço por estado, preço máximo de compra, stock e lucro real. Dados locais no aparelho.

```
npm install
npm run dev      # http://localhost:5174
npm test         # motor de preço, lucro, CSV, anúncio
npm run build
node scripts/make-artifact.mjs   # ficheiro único para pré-visualização
```

## Dados de preço
- `src/data/market.ts`: preços recolhidos à mão a 2026-10-16.
  - **CeX Portugal** (consolas, comandos, 25 jogos): preço de venda (teto) e o que pagam em dinheiro (piso).
  - **eBay.es**: anúncios ativos só de PS4 Slim 500 GB e PS4 Pro. As vendas concluídas exigem login e não foram usadas.
  - **Back Market**: bloqueou a pesquisa com verificação anti-bot; ficou de fora.
- Sem vendas nem anúncios, o preço típico é inferido entre piso e teto (`DERIVED_POSITION` em `priceEngine.ts`) e marcado como estimativa. Calibrar com as vendas reais.
- Em Ajustes dá para importar mais preços por CSV (`produto,estado,tipo,valor,fonte,data`).

## Próximos passos
Leitura de print por IA (precisa de função de servidor com chave), eBay Browse API, PriceCharting, alertas, mais produtos. Ver `docs/spec.md` e `docs/founder/board/`.

## Pipeline de anúncios (src/pipeline)
JSON bruto das plataformas -> `sanitize` (tira HTML, CSS, imagens e layout; fica id, título, preço, moeda, descrição, url) -> classificador (`claudeClassifier` por tool use, ou `rulesClassifier` local) -> moeda principal -> filtro IQR -> média, mediana, mínimo, máximo. As contas são sempre em código, nunca no Claude.
- Demo no terminal sobre dados simulados: `npm run pipeline:demo` (regras locais) ou `ANTHROPIC_API_KEY=... npm run pipeline:demo -- --claude`.
- A chamada ao Claude só deve correr no servidor: a chave não pode ir para o telemóvel. O pipeline não inclui coletor das plataformas; recebe o JSON como entrada (CSV, API oficial ou dados enviados pelo utilizador).
