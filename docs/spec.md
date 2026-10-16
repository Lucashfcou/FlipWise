# Garimpo: spec do MVP (Fases 0 e 1)

PWA para revendedores de eletrónicos usados em Portugal. Dá a faixa de preço de mercado por estado, o preço máximo de compra para a margem alvo, e gere stock e lucro. Aprovada pelo fundador em conversa (seções 1 a 4). Revisão do ficheiro escrito dispensada pelo fundador para a build noturna.

## Decisões fixas
- Local primeiro: dados em `localStorage`, sem contas nem servidor. Camada de dados atrás da interface `Repo` para trocar por Supabase depois.
- Leitura de print por IA fica fora desta noite (sem chave). A tela Avaliar usa formulário assistido e deixa um ponto de ligação (`CaptureReader`) para a IA.
- Sem scraping de Vinted nem OLX. Preços de anúncio entram só por dados enviados pelo utilizador.
- Preços do catálogo inicial são EXEMPLOS marcados (`source: "exemplo"`), nunca apresentados como dados reais.
- Português de Portugal, euro.

## Domínio
- `Product`: id, category (console, controller, game), brand, name, variant.
- `Condition` por categoria: console A/B/C/P; controlo sem drift / drift leve / defeito; jogo lacrado / completo / só disco.
- `Observation`: productId, condition, value (EUR), kind (new, refurb, buyback, ask, sold), source, date, example flag.
- `StockItem`: productId, condition, cost, boughtAt (local), boughtDate, extraCosts, status, sale (price, platform, shipping, date).
- `Settings`: targetMargin (default 25%), default shipping, default promo cost, contribute flag.

## Motor de preço (`priceEngine`)
Entrada: observações de um produto e estado. Saída: `{ low, typical, high, maxBuy, confidence, count }`.
1. Descarta valores fora de 30% a 300% da mediana provisória; descarta duplicados (mesma fonte, valor e dia).
2. Peso por tipo: sold 1.0, buyback 0.8, refurb 0.7, ask 0.5 (valor multiplicado por um desconto estimado de 0.9 sobre preço pedido), new 0.3 e só como teto. Peso decai a metade a cada 60 dias.
3. `typical` = mediana ponderada; `low`/`high` = percentis 25 e 75 ponderados.
4. `maxBuy` = typical − custos (envio + destaque) − typical × margem alvo, nunca negativo.
5. Confiança: alta se ≥10 observações recentes e pelo menos uma sold; média se 4 a 9, ou só anúncios; baixa se <4 (sem `maxBuy` firme: devolve `maxBuy` com `firm: false`).

## Lucro (`profit`)
Lucro por item = preço de venda − custo − extras − envio. Margem = lucro / custo. Dias parado = hoje (ou data de venda) − data de compra. Resumo mensal agregado.

## Telas
Avaliar (início), Stock, Vendas e lucro, Catálogo, Configurações. Uma coluna, pensada para telemóvel.

## Fora do MVP
Ténis, notebooks, alertas, foto do estado, pagamentos, backend, leitura de print por IA.

## Critério de sucesso
Fundador usa 2 a 4 semanas; em 7 de 10 avaliações o preço fica próximo do vendido.

## Riscos do board (a tratar fora do código)
Disposição a pagar não provada; dados fracos no arranque; concorrente grátis (olhar Vinted/OLX); sem vantagem de dados no lançamento. Ver `docs/founder/board/`.
