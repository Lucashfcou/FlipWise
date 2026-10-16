# Garimpo

PWA para revendedores de eletrónicos usados (Portugal). Faixa de preço por estado, preço máximo de compra, stock e lucro real. Dados locais no aparelho.

```
npm install
npm run dev      # http://localhost:5174
npm test         # motor de preço e lucro
npm run build
```

- Spec: `docs/spec.md`. Parecer do board: `docs/founder/board/` (2 de 3 membros; Product não rodou).
- Os preços de arranque são EXEMPLOS (`src/domain/catalog.ts`), marcados como tal na interface.
- Camada de dados atrás de `Repo` (`src/data/repo.ts`) para trocar por Supabase depois.
- Ainda por fazer: leitura de print por IA (precisa de chave), PriceCharting/eBay/CeX, mais jogos, ténis.
