# Flipwise: estado do projeto (para retomar noutra conversa)

Última atualização: 2026-10-18. Ler isto primeiro. A spec antiga (`docs/spec.md`) está desatualizada em vários pontos; este ficheiro manda.

## O que é
PWA para revendedores de eletrónicos usados, para a **Europa** (inglês por omissão, português à escolha). Dá, a partir do preço de um anúncio, a **oferta máxima segura**, a faixa de revenda estimada e uma decisão **Buy / Negotiate / Pass**. Tem stock, lucro, fiscal (DAC7), lotes e gerador de anúncio. O fundador (Lucas) revende em Portugal PS4, comandos, jogos e às vezes ténis (Vinted, OLX, feiras). É renda extra, quer lançar com plano grátis + pago.
- Pasta: `C:\Projetos\Garimpo` (o nome da pasta é antigo; a app chama-se **Flipwise**). Git local, sem remoto e sem push.
- Preview privada (artifact): https://claude.ai/artifact/KFREkHphfmdSEp1j6y75hi (versão 13).

## Stack e comandos
Vite + React 18 + TypeScript, Vitest (95 testes), `tsx` para scripts, biblioteca `motion` só no `fx.ts` indireto (a maior parte usa Web Animations API). Dados **locais** (localStorage, chaves `garimpo.*`), sem contas nem servidor.
- `npm run dev` (porta 5174), `npm test`, `npm run build`
- `node scripts/make-artifact.mjs` gera `dist-artifact/flipwise.html` (ficheiro único) para publicar no artifact
- `npm run ebay:refresh` com `--only id`, `--ids a,b,c`, `--category x`, `--missing`, `--no-parts`
- `npm run capture:server` (leitura de print), `npm run pipeline:demo`
- Chaves em `.env` (gitignored): `EBAY_CLIENT_ID` (é o **App ID**, não o Dev ID), `EBAY_CLIENT_SECRET` (Cert ID), `EBAY_SITES`, `EBAY_MAX_CALLS=800`, `ANTHROPIC_API_KEY` (vazia), `CAPTURE_MODEL`, `CAPTURE_DAILY_LIMIT`. As do eBay estão preenchidas e funcionam. **Nunca pedir nem mostrar chaves.**

## Mapa do código
- `src/domain/`: `priceEngine.ts` (motor), `catalog.ts` + `catalogTech.ts` (247 produtos, 10 categorias), `bundle.ts` (lotes), `stale.ts`, `tax.ts`, `profit.ts`, `listing.ts`, `csv.ts`
- `src/data/market.ts` (preços do CeX à mão + leitura de `ebay-prices.json`), `repo.ts` (localStorage atrás de interface, para trocar por Supabase)
- `src/ebay/` (cliente da API Browse, `queries.ts` com filtros por produto), `src/pipeline/` (sanitizar, classificar por regras ou Claude, IQR), `src/capture/` + `server/capture.ts` (leitura de print, desligada)
- `src/i18n.ts` (EN/PT, `t()`), `src/fx.ts` (animações portadas do jogo do PAS `pas-diario`), `src/screens/`, `src/ui/`, `src/styles.css`

## Regras do motor (e hipóteses a calibrar)
- Preço típico = mediana ponderada de anúncios (desconto de **10%** sobre o pedido, `ASK_DISCOUNT`) e vendas; recompra e recondicionado do CeX são **piso e teto**, não entram na média. Sem anúncios, o típico é inferido entre piso e teto (20%/30%/40%, `DERIVED_*`). O típico nunca fica abaixo do piso.
- "Compra segura" = piso da loja menos 8% (`SAFE_MARGIN`). Margem alvo e custos vêm dos Ajustes.
- Hipóteses ainda sem prova: o desconto de 10%, o desconto de 10% de vender lote junto, a escolha do estado B para anúncios do eBay.
- Produto com menos de 6 anúncios válidos fica **sem dados** (`MIN_VALID`). Sem dados de propósito: PS5 Pro, Switch 2, RTX 3060 12GB, 4060, 4060 Ti, 4070 (anúncios misturados com PCs e novos), MacBooks, iPad Pro, AirPods 2, Canon 250D (poucos anúncios).

## Dados
- Anúncios do **eBay.es** (só preço pedido, usados de preço fixo), atualizados a 2026-10-18; preços do **CeX Portugal** colhidos à mão a 2026-10-16 só para consolas antigas, comandos e 25 jogos de PS4 (~38 produtos). Produtos novos (telemóveis, tablets, etc.) só têm eBay.
- **Não existe** acesso a vendas concluídas do eBay (a Marketplace Insights exige aprovação; Terapeak é manual).
- Back Market bloqueou (anti-bot); Vinted e OLX não têm API e **não se faz scraping nem se contorna proteção**. Caminho aceite: dados que o utilizador cola ou envia, API oficial, CSV.

## Decisões de produto já tomadas
- Local primeiro; sem scraping de Vinted/OLX; preços reais ou "sem dados", nunca inventados; PT de Portugal; inglês por omissão.
- Design: Impeccable (crítica 24/40, detector limpo), UI UX Pro Max (instalado). Paleta verde-salva + verde-petróleo, listas agrupadas estilo iOS, controlo segmentado, furo de etiqueta no veredito, animação sóbria do PAS. **Não instalar repositórios do GitHub sem rever o conteúdo** (o utilizador falou em "UI design" e "Apple design" mas não deu os links).
- Leitura de print por Claude Haiku 5.5 (0,10/0,50 US$ por milhão de tokens): implementada, **desligada por omissão**, nunca medida em prints reais. Exige print da página do anúncio, avisa foto solta e foto que não bate.

## Conselho "founders" (4 rondas, mesmo modelo de IA, não é evidência independente)
Ronda 4: Offers 5/10, Monopoly 5/10, Product 6/10, todos "aprovar com condições". Memos em `docs/founder/board/*-r4.md`. Defeitos comuns: número não provado contra vendas reais; nenhum utilizador além do fundador; gancho pago (print e busca por IA) não medido; termos comerciais da API do eBay por ler; sem contas, hospedagem nem pagamento.
Plano pago em estudo: **grátis** = catálogo, avaliar, lotes, stock, lucro, "o app acertou?", fiscal básico; **pago com 1 semana de teste** = print, busca por IA, alertas, comparação entre países, calibração pessoal. Assinatura fixa com limite de leituras.

## Próximos passos pendentes (nenhum está feito)
1. **Kit de validação**: script `capture:eval` (taxa de acerto por campo em prints reais) e roteiro de 1 página para 10 a 20 revendedores. Critérios a fixar antes de começar.
2. Ler os termos comerciais da API do eBay.
3. Home: resumo no topo da Evaluate quando há stock ("€X parados, N parados há 14+ dias") e primeira abertura guiada; tirar o Catálogo da barra. Foi **sugerido, não aprovado**.
4. Aumentar jogos (hoje 103) e colher a referência do CeX para os produtos novos (gasta ~50 mil tokens).
5. Busca livre com IA para produtos fora do catálogo (protótipo sem IA já testado com "ps vita slim": faltam sinónimos), com resultado marcado como pouco fiável.
6. Hospedagem, contas, pagamento e controlo do teste de 1 semana (só depois de validar com utilizadores reais).
7. Limpar: a pasta `C:\Projetos\app-revendedores` é cópia antiga do material do conselho e pode ser apagada.

## Atualização 2026-10-21 (IA, busca no eBay e catálogo grande)

**Fluxo do print (pago, ligado e testado com chave real)** — `server/capture.ts`, `src/capture/*`, `src/ebay/*`
1. A IA (Claude Haiku 5.5, ~3 mil tokens de entrada, ~US$ 0,0004 por leitura) lê o print **sem o catálogo no prompt** e devolve nome, tipo, especificações, preço, estado, e `needsModel`/`modelOptions` quando só se sabe a linha (`src/capture/vision.ts`).
2. O **código** casa o nome com o catálogo por palavras inteiras (`src/capture/match.ts`). Se casa: motor do catálogo. Se há várias capacidades: botões.
3. Fora do catálogo: busca no eBay (`src/ebay/lookup.ts`): categoria certa por país (Taxonomy API, `suggestCategory`), código de modelo inteiro (5700X não casa com 5700X3D, `titleMatch.ts`), especificações, degraus até a "família", vários países (ES, DE, FR, IT) até haver resultado fiável. Base mínima: 8 anúncios. O mesmo cartão Comprar/Negociar/Deixar passar (`estimate` + `Verdict`).
4. Se não for fiável: segunda leitura da imagem pedindo nomes alternativos; anúncios difíceis repetem com o **Sonnet 5.5** (`SMART_MODEL`, sem tool_choice forçado: o Sonnet recusa). A IA nunca recebe dados do eBay (cláusula da licença).
5. Interface (`Print.tsx`): nome editável ("Percebi isto"), opções de modelo, ponte para o catálogo, aviso de pouca fiabilidade e de preço suspeito.
- Variáveis (`.env`): ANTHROPIC_API_KEY, EBAY_CLIENT_ID/SECRET, CAPTURE_DAILY_LIMIT, LOOKUP_DAILY_LIMIT, SMART_MODEL, SMART_DAILY_LIMIT, LOOKUP_SITES, CAPTURE_EXTRA_HOST (túnel), CAPTURE_LAN. `npm run phone` testa no celular pela rede de casa.

**Catálogo** (`src/domain/catalogMore.ts`, gerado por listas): ~2.400 produtos novos em 14 categorias (5 novas: processadores, SSD e memória, monitores, periféricos, computadores) com filtro automático. Os preços vêm de `npm run ebay:refresh -- --more --missing --no-parts` (e `--thin` com `EBAY_SITES=EBAY_DE` para ir buscar a outros países). `npm run prune:more` guarda em `src/data/more-keep.json` só o que tem 6+ anúncios; `npm run slim:prices` reduz o ficheiro de preços (40 por produto). Ténis em `catalogShoes.ts`.
- eBay: Browse API 5.000 chamadas/dia por omissão. Contrato: proíbe enviar dados de "Restricted APIs" a IA de terceiros e limita copiar/guardar conteúdo do eBay (**rever antes de cobrar**).
- Falta: servidor hospedado com as chaves só lá, limite por utilizador, login/pagamento, teste de segurança final com a IA ligada. Vídeos em `C:\Projetos\flipwise-video` (PT) e `flipwise-video-en` (EN).
