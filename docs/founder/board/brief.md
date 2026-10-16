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
