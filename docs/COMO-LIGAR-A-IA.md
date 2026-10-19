# Como ligar a leitura de print (API da Anthropic)

A API da Anthropic é separada da assinatura do Claude. Tem conta e crédito próprios.

## Passos

1. Entre em **console.anthropic.com** e crie a conta (e-mail ou Google).
2. Compre crédito (a API é pré-paga; o mínimo costuma ser uns US$ 5) e defina um **limite mensal de gasto**.
3. Em **API keys**, crie uma chave. Ela aparece **uma única vez**: copie na hora.
4. No PC, abra o ficheiro `.env` na pasta `C:\Projetos\Garimpo` e acrescente a linha:

   ```
   ANTHROPIC_API_KEY=cole-a-chave-aqui
   ```

   Nunca cole a chave no chat, no GitHub ou em prints.
5. Arranque o servidor de leitura:

   ```
   npm run capture:server
   ```

   Se a chave estiver certa, o terminal escreve "ativa" em vez de "DESATIVADA".
6. Noutro terminal, `npm run dev`, abra o app, toque em **Avaliar por print** e teste com 5 a 10 prints reais de anúncios. Anote o preço certo de cada um para comparar.

## Custo

O modelo padrão é o Claude Haiku 5.5 (US$ 0,10 de entrada e US$ 0,50 de saída por milhão de tokens, segundo o handoff). Medido no teste real: cerca de 14 mil tokens de entrada e 450 de saída por leitura, ou seja, uns US$ 0,002 por print (US$ 5 dão para uns 3 mil prints). O servidor limita a 20 leituras por dia (`CAPTURE_DAILY_LIMIT` no `.env`).

## Regra do eBay (importante)

A IA só lê o **print do utilizador**. Os preços de mercado vêm do motor do app, em código, e **nunca são enviados à IA**. O contrato da API do eBay proíbe enviar dados das suas "Restricted APIs" a uma IA de terceiros sem autorização por escrito. Manter as duas coisas separadas evita o problema.

Ainda por rever antes de cobrar de utilizadores: o contrato limita copiar e guardar conteúdo do eBay (o `ebay-prices.json`). Leia o contrato completo ou consulte um advogado.

Contrato: https://www.edp.ebay.com/join/api-license-agreement

## Depois

Quando o passo 6 estiver testado, falta: servidor hospedado (a chave fica só lá), limite por utilizador, e um teste de segurança final com a IA ligada.
