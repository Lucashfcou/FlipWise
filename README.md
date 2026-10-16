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
