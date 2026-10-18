# Brief para o conselho

## A ideia
Ver `founder/idea.md` (copiada abaixo para o brief ficar independente).

App de revendedores de eletrónicos usados (PWA, Portugal e Europa). O utilizador envia um print de anúncio, cola um link ou escolhe um modelo, e recebe: faixa de preço de mercado por estado, nível de confiança, e o preço máximo de compra para a margem alvo dele. Também gere o stock (custo, dias parado) e calcula o lucro real por item e por mês.

## Cliente
Revendedor individual em Portugal que compra em feiras, Vinted, OLX.pt e Wallapop e vende na Vinted e OLX.pt. O fundador é um desses revendedores (PS4, comandos, jogos de PS4, às vezes ténis).

## Modelo de negócio (hipóteses por testar)
Assinatura de 5 a 15 EUR por mês com plano grátis limitado; possível comissão de afiliados.

## Como obtém os preços (a parte mais difícil)
- Sem API pública do Vinted nem do OLX; os termos desses sites proíbem scraping e têm proteção anti-bot. O fundador decidiu NÃO contornar isso.
- Camadas: preço novo via feeds de afiliados; recondicionado (Back Market, Rebuy); recompra (CeX, que dá piso de preço); eBay via API (Browse API; dados de vendas concluídas exigem aprovação); PriceCharting para jogos (a confirmar custo e termos).
- Anúncios de Vinted/OLX só entram porque o utilizador envia print ou digita o preço (IA lê o print, o utilizador confirma). Nada é lido automaticamente dos sites.
- Vendas reais registadas pelos utilizadores formam, com o tempo, um conjunto de dados próprio.
- Arranque a frio: o app começa com poucos dados e usa pesquisa manual como semente.

## Desenho do produto
- Catálogo canónico de produtos (marca, modelo, variante) e escala de estados fixa por categoria.
- Motor de preço: filtra valores absurdos, pesa por tipo de fonte e por idade, desconta o preço pedido para estimar o preço pago, devolve faixa (percentis 25 a 75), preço máximo de compra e nível de confiança (alta, média, baixa). Mostra sempre faixa, fonte e confiança.
- MVP: consoles e acessórios e cerca de 100 jogos de PS4. Telas: Avaliar, Stock, Vendas e lucro, Catálogo, Configurações. Dados locais no telemóvel primeiro, camada de dados preparada para um backend depois.
- Fora do MVP: ténis, notebooks, alertas automáticos, foto do estado, pagamentos.
- Critério de sucesso do MVP: o fundador usa em compras reais durante 2 a 4 semanas e em pelo menos 7 de 10 avaliações o preço sugerido fica próximo do que conseguiu vender.

## Restrições
Fundador sozinho, renda extra, custo inicial perto de zero, sem orçamento em dinheiro definido. Regime fiscal português de bens em segunda mão (margem) a confirmar com contabilista. Dados pessoais de vendedores não são guardados (só modelo, estado, preço, plataforma).

## O que ainda se desconhece
Tamanho do mercado em Portugal; quantos revendedores pagariam; custo real de aquisição de clientes; se a API do eBay dá acesso útil a vendas concluídas; se a PriceCharting cobre preços europeus a custo viável; quão precisa será a leitura de prints por IA.

## Atualização: o MVP já existe (v0.1, local, sem backend)
Telas: Avaliar (escolhe produto e estado, digita o preço do anúncio, recebe faixa de mercado, "paga no máximo", semáforo), Stock (custo, dias parado, lucro potencial, marcar vendido), Lucro (por mês, por plataforma), Catálogo (preço por estado), Ajustes (margem alvo, envio, destaque).
Catálogo: 10 consolas (PS4, PS5, Switch, Xbox), 4 comandos, 25 jogos de PS4. Os preços de arranque são EXEMPLOS marcados como tal, não dados reais.
Ainda NÃO existe: leitura de print por IA, ligação a eBay/CeX/PriceCharting, alertas, histórico de preço, gerador de anúncio, conta, sincronização, tênis, telemóveis.
O fundador sente que "falta alguma coisa" e que está "muito básico". Pergunta extra para cada membro: **o que falta no produto para ele ser algo que um revendedor usaria todos os dias e pagaria?** Dê no máximo 5 itens, por ordem de impacto, e diga o que cortar.

## Atualização 3: cenário com eBay e funções novas
Suposição a avaliar: o fundador consegue a API do eBay (anúncios ativos, vários mercados da Europa), padroniza os preços por produto, aplica cerca de 10% de desconto sobre o preço pedido para estimar o preço pago, e cobre o máximo de eletrónicos possível (consolas, telemóveis, portáteis, tablets). Continua sem vendas reais do eBay e sem scraping de Vinted/OLX.
O que já existe além do que está acima: avaliação de lotes (soma as peças, compara vender separado e junto), stock parado com sugestão de baixa de preço e dinheiro parado, painel fiscal (faturado, lucro, vendas por plataforma, aviso perto do limite DAC7 de 30 vendas ou 2000 EUR/ano, exportação CSV), "o app acertou?" (compara a previsão na compra com a venda real), gerador de anúncio, pipeline de limpeza e classificação de anúncios (regras locais e Claude), importação de preços por CSV, e um ecrã de avaliação simplificado (categoria, produto, estado, preço; um número principal e uma decisão Comprar/Negociar/Deixar).
Perguntas a responder, cada membro pela sua lente:
1. Dado o cenário do eBay, o voto muda? Quais são os 3 defeitos que ainda restam?
2. O que melhorar no produto (máximo 5 itens, por impacto)?
3. Modelo de preço: o que ficaria grátis e o que seria pago? Assinatura, uso por consulta, ou outro? Justifica com o que o revendedor valoriza. Não inventes números de mercado: marca como hipótese a testar.
4. Como validar de forma menos enviesada (o produto foi desenhado em conjunto com o fundador, que é o primeiro utilizador)?

## Atualização 4: estado atual e plano pago (pergunta desta ronda)
O app agora chama-se **Flipwise**, é para a **Europa** (inglês por omissão, português à escolha), e continua local, sem contas nem servidor.
**Dados:** 247 produtos em 10 categorias (consolas, telemóveis, tablets, portáteis, relógios, áudio, câmaras e drones, placas gráficas, comandos, 103 jogos). Preços de anúncios ativos do eBay.es (API oficial Browse, já aprovada e a funcionar), limpos por um pipeline (acessórios, lotes, edições especiais, defeituosos, golpes, IQR) com 10% de desconto sobre o pedido; mais piso e teto do CeX Portugal para ~38 produtos; preços de "para peças". Produtos com poucos anúncios válidos ficam sem dados em vez de mostrar número duvidoso (PS5 Pro, Switch 2, 4 placas gráficas). Continuam a ser preços PEDIDOS, não vendas concluídas; o acesso a vendas concluídas do eBay não existe.
**Produto:** avaliar um item (decisão Buy/Negotiate/Pass, oferta máxima, régua, números de apoio), avaliar lotes, stock com dinheiro parado e sugestão de baixa de preço, painel de lucro e fiscal (DAC7) com CSV, "o app acertou?", gerador de anúncio, importação CSV, recentes.
**Leitura de print** por IA (Claude Haiku 5.5): implementada, desligada por omissão, só prova de conceito; exige chave e servidor; nunca foi medida a qualidade em prints reais. Custo estimado por leitura cerca de 0,07 cêntimos de dólar e por busca por texto com IA entre 0,06 e 0,16 cêntimos (estimativas pelo tamanho dos pedidos, não medidas).
**Plano em estudo:** grátis = catálogo grande já com preços, stock básico, lotes, fiscal básico. Pago, com uma semana de teste = leitura de print, busca por texto com IA para qualquer produto fora do catálogo (preço marcado como pouco fiável), comparação de preços entre países do eBay, alertas, mais categorias, exportações. Para impor teste e pagamento seria preciso contas, servidor e pagamentos (ainda não existem).
**O que ainda não existe:** nenhum utilizador real além do fundador; nenhuma venda registada; nenhuma validação com outros revendedores; hospedagem; contas; pagamento; vendas concluídas; análise de termos da API do eBay para uso comercial.
Perguntas desta ronda, cada membro pela sua lente:
1. Comparado com a ronda anterior (Offers 4/10, Monopoly 4/10, Product 6/10, todos "fund if"), o voto muda? Porquê?
2. Vê futuro neste plano pago (print + busca por IA + mais funções)? Qual é o gancho que justifica pagar e qual é o risco?
3. O que deve ficar grátis e o que deve ser pago, e o que falta acrescentar ao pago?
4. Os 3 defeitos que ainda restam e as 3 próximas ações, por ordem.
5. Qual é a primeira coisa a validar com utilizadores reais, e qual o critério para continuar ou parar?
