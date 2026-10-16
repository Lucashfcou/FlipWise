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

## Avaliar por print (desligado por omissão)
O app lê um print de anúncio (produto, estado, preço pedido) com visão do Claude. **Não custa nada enquanto não houver chave**: sem servidor, o ecrã mostra "desligado" e deixa ver o fluxo com um exemplo.
Para testar a sério:
1. Cria uma chave em console.anthropic.com e define um limite de gasto na conta. **Nunca coles a chave no chat nem no código.**
2. Terminal 1 (PowerShell): `$env:ANTHROPIC_API_KEY="..." ; npm run capture:server`. Limite de `CAPTURE_DAILY_LIMIT` (20) leituras por dia e 6 por minuto; o modelo vem de `CAPTURE_MODEL` (por omissão `claude-haiku-5-5`).
3. Terminal 2: `npm run dev`. Em Avaliar > "Avaliar por print", escolhe uma imagem.
4. O servidor escreve no terminal os tokens de cada leitura (`[captura] entrada=... saída=...`): é com isso que se mede o custo real por print.
O modelo só identifica produto, estado e preço pedido; o preço de mercado continua a vir do motor local. O utilizador confirma sempre antes de usar. As imagens são reduzidas no aparelho e não são guardadas.
Para medir a qualidade: junta uns 20 prints reais com a resposta certa, corre-os e vê quantos produtos, estados e preços saem certos. Compara `claude-haiku-5-5` com um modelo maior (`CAPTURE_MODEL`) nos mesmos prints antes de cobrar por isto.
