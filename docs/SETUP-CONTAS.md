# Contas, limites e IA na Vercel (Supabase)

Resumo: o app continua a funcionar sem conta. A **leitura por print** (IA + busca no eBay) passa a exigir conta: cada utilizador tem 1 semana de teste do plano Pro e limites por dia. As chaves da Anthropic e do eBay ficam só na Vercel.

```
Navegador (app)  ──login──▶  Supabase (contas, plano, uso diário)
      │                              ▲
      └──── /api/capture ───▶  Vercel (funções) ──┬─▶ Anthropic (IA)
            /api/lookup                           ├─▶ eBay
            /api/capture/status                   └─▶ Supabase (confirma o login e conta o uso)
```

## 1. Supabase (uma vez)

1. **Project Settings > API**: copia o **Project URL** e a chave **anon public** (essa é pública por desenho). A chave **service_role** é segredo: nunca no app, nunca no chat, nunca no GitHub.
2. **SQL Editor > New query**: cola o ficheiro `supabase/schema.sql` e clica **Run**. Cria as tabelas (perfis, limites por plano, uso diário, dados sincronizados), as regras de segurança por linha e a função que conta o uso. Pode correr mais de uma vez.
3. **Authentication > URL Configuration**:
   - Site URL: `https://flip-wise-chi.vercel.app`
   - Redirect URLs: `https://flip-wise-chi.vercel.app/**` e `http://localhost:5174/**`
4. **Authentication > Providers**: o **Email** já vem ligado (entrada por link). O **Google** é opcional: precisa de um cliente OAuth no Google Cloud (o Supabase mostra o endereço de retorno a usar).
5. Região: o projeto deve estar na Europa (por exemplo Frankfurt) por causa da GDPR.

## 2. Vercel (uma vez)

**Settings > Environment Variables** (Production e Preview). Marca como *Sensitive* as que são segredo:

| Nome | Valor | Segredo? |
|---|---|---|
| `ANTHROPIC_API_KEY` | chave da Anthropic | sim |
| `EBAY_CLIENT_ID` | App ID do eBay | não |
| `EBAY_CLIENT_SECRET` | Cert ID do eBay | sim |
| `SUPABASE_URL` | Project URL | não |
| `SUPABASE_ANON_KEY` | chave anon | não |
| `SUPABASE_SERVICE_ROLE_KEY` | chave service_role | **sim** |
| `VITE_SUPABASE_URL` | Project URL (usada ao construir o app) | não |
| `VITE_SUPABASE_ANON_KEY` | chave anon (usada ao construir o app) | não |

Opcionais: `SMART_MODEL` (modelo forte, por omissão `claude-sonnet-5-5`; vazio desliga), `LOOKUP_SITES` (por omissão `EBAY_ES,EBAY_DE,EBAY_FR,EBAY_IT`), `CAPTURE_MODEL`.

Depois: **Deployments > Redeploy** (as variáveis `VITE_*` só entram numa nova construção).

## 3. Conferir

- `https://flip-wise-chi.vercel.app/api/capture/status` deve responder `{"enabled":false,"accounts":true,"loginRequired":true}`.
- No app: **Ajustes** mostra "Entrar". Entra com o e-mail, abre o link, e o painel passa a mostrar "Teste do Pro: faltam 7 dias".
- **Avaliar por print** deve dizer "Leitura ativa" e ler um print.

## 4. Ajustar limites (sem mexer no código)

No Supabase, **Table Editor > plan_limits**: muda `reads_per_day`, `smart_per_day` e `lookups_per_day` de cada plano (`free`, `trial`, `pro`). Por omissão: grátis 0; teste e Pro 10 leituras, 3 com o modelo forte e 40 buscas por dia.

Para dar o plano Pro a alguém (até haver pagamento): **Table Editor > profiles**, muda `plan` para `pro`.

## 5. Feedback dos testadores

O botão **Enviar feedback** (início e Ajustes) grava na tabela `feedback` do Supabase (criada pelo mesmo `schema.sql`). Lê as mensagens em **Table Editor > feedback**. Não precisa de login para enviar; se a pessoa estiver logada, guarda o e-mail. Limite de 3 mensagens por minuto por IP.

## 6. Notas

- O limite de tempo das funções está em 60 s (`vercel.json`). Uma leitura com busca em vários países pode levar de 10 a 25 s. Se o teu plano da Vercel não aceitar 60 s, a implantação avisa: baixa o valor e eu separo a leitura da busca.
- O plano grátis da Vercel (Hobby) costuma ser só para uso pessoal; ao cobrar, confere os termos.
- As funções em `api/*.mjs` são geradas por `npm run build:api` a partir de `api-src/` e vão no git. Depois de mexer em `api-src/`, `server/` ou `src/`, corre `npm run build` e faz commit também de `api/`.
- Cada print consome: 1 leitura do utilizador, mais (só nos casos difíceis) 1 leitura forte e algumas buscas no eBay.
- O servidor local (`npm run capture:server`, `npm run phone`) continua sem contas, para testar em casa.
