# Lumina — Tesouraria Inteligente para PMEs

Lumina é uma plataforma SaaS B2B de tesouraria integrada (*Embedded Finance*)
pensada para o mercado médio paulista, projetada a partir de um relatório
estratégico sobre o mercado financeiro de São Paulo e o impacto da Reforma
Tributária (Split Payment do IBS/CBS), da Resolução Conjunta BCB/CMN nº
16/2025 (Banking as a Service), do Open Finance/Pix Automático e do PL
2338/2023 (Marco Legal da IA).

Este repositório contém uma implementação funcional (MVP de demonstração) da
plataforma descrita nesse relatório, construída como um projeto **backend
Node.js/Express + frontend React**, com base de dados SQL própria (sem ORM).

> **Aviso:** este é um projeto de demonstração/portfólio. Os parceiros
> (Pluggy, Klavi, Celcoin, QI Tech, TOTVS, SAP, Senior) são citados como
> referência de integração real de mercado, mas nenhuma integração externa é
> efetivamente realizada — todos os dados são simulados localmente.

## Stack técnica

O projeto é um monorepo simples com duas aplicações independentes que
conversam por API REST:

| Camada | Tecnologias |
| --- | --- |
| **Backend** (`/server`) | Node.js, Express, SQLite (`better-sqlite3`, SQL puro — sem ORM), JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `helmet`, `express-rate-limit` |
| **Frontend** (`/client`) | React (JavaScript, sem TypeScript), React Router, Vite, CSS puro (Flexbox — sem frameworks utilitários) |
| **Testes** | `node:test` + `node:assert` (nativos do Node, sem dependências extra) |
| **Infra** | Dockerfile multi-stage pronto para Google Cloud Run / App Engine flexible |

Todo o SQL é escrito à mão (sem Prisma/Sequelize/TypeORM): consultas
parametrizadas, `JOIN`s, agregações com `GROUP BY`, uma `VIEW` e transações
explícitas — ver `server/src/db/schema.sql` e as rotas em `server/src/routes/`.

## Qualidade e segurança

- **Validação de dados**: e-mail por regex e **CNPJ pelo algoritmo oficial
  dos dois dígitos verificadores** (módulo 11), não apenas checagem de
  formato — ver `server/src/utils/validators.js`. Valores numéricos
  (montantes, prazos) são validados contra `NaN`/negativos antes de chegar
  ao banco.
- **CRUD completo em todos os recursos**: contas e cobranças suportam
  Create/Read/Update **e Delete** (`DELETE /api/accounts/:id`,
  `DELETE /api/invoices/:id`), com regras de negócio (ex.: só é possível
  excluir uma cobrança ainda pendente — registos liquidados são mantidos
  para auditoria).
- **Segurança da API**: `helmet` para cabeçalhos HTTP de segurança e
  `express-rate-limit` em `/api/auth/login` e `/api/auth/register` para
  mitigar força bruta. 404 em JSON para rotas inexistentes (em vez do HTML
  padrão do Express).
- **Testes automatizados** (`cd server && npm test`): testes unitários dos
  serviços puros (`tax.service.js`, `credit.service.js`, `validators.js`) e
  um teste de integração que sobe a API Express real numa porta aleatória,
  com base de dados isolada, e exercita registo → login → validação →
  CRUD → logout via `fetch`.

## Por que estes módulos

A partir de 2026, o Split Payment do IVA Dual passa a segregar
automaticamente o IBS e a CBS na fonte de cada liquidação, eliminando o
"float tributário" que hoje financia o capital de giro informal das PMEs. Ao
mesmo tempo, a Resolução Conjunta BCB/CMN nº 16/2025 limita rigorosamente o
que uma Entidade Tomadora de BaaS pode fazer, e o PL 2338/2023 exige
explicabilidade para sistemas de IA que avaliam risco de crédito. A Lumina
foi desenhada dentro dessas fronteiras regulatórias — não apesar delas.

| Módulo | O que resolve | Onde está implementado |
| --- | --- | --- |
| **Agregação Patrimonial** | Fragmentação bancária e reconciliação manual | `GET/POST /api/accounts`, página `Contas.jsx` |
| **Previsibilidade de Liquidez** | Choque de caixa do Split Payment | `GET /api/invoices/summary\|monthly`, `GET /api/tax/simulate`, página `FluxoCaixa.jsx` |
| **Crédito Contextual** | Necessidade de capital de giro pós-Split Payment | `GET/POST /api/credit/*`, página `Credito.jsx` |
| **Cobrança B2B & Pix Automático** | Churn involuntário e custo de MDR | `GET/POST/PATCH /api/invoices`, página `Cobranca.jsx` |

A Lumina nunca decide crédito sozinha: o motor de score (`server/src/services/credit.service.js`)
apenas gera a **pré-visualização explicável** que seria enviada a uma
Instituição Prestadora de BaaS licenciada (aqui representada por "Celcoin
Instituição de Pagamento S.A."), conforme a separação de responsabilidades
da Resolução Conjunta nº 16/2025.

## Estrutura do projeto

```
server/                      API REST (Node.js + Express)
  src/
    app.js                     monta middlewares, segurança e rotas (exporta o app)
    index.js                    entrada fina: carrega .env e chama app.listen()
    db/
      index.js                 conexão better-sqlite3 (cria a pasta data/ se faltar)
      schema.sql                 tabelas, índices e a VIEW v_company_invoice_metrics
      migrate.js                  aplica o schema.sql
    middleware/auth.js         JWT em cookie httpOnly + requireAuth
    routes/                    auth, accounts, invoices, credit, tax, plans (CRUD completo)
    services/
      tax.service.js            simulação de Split Payment (IBS/CBS)
      credit.service.js          motor de score explicável
      plans.js                    planos e preços
    utils/
      validators.js              e-mail (regex) e CNPJ (dígitos verificadores)
      id.js                       geração de IDs
    seed.js                    popula uma empresa de demonstração
  test/                       testes unitários + integração (node:test)
  data/lumina.db              base de dados SQLite (gerada localmente)

client/                      SPA (React + Vite, JavaScript puro)
  src/
    api/client.js              wrapper fetch (cookies de sessão inclusos)
    context/AuthContext.jsx    estado de sessão (login/registo/logout)
    components/
      marketing/                Navbar, Hero, simulador, módulos, preços…
      dashboard/                Sidebar, Topbar, StatCard, BarChart, Badge…
    pages/
      Landing.jsx, Login.jsx, Register.jsx
      dashboard/                Overview, Contas, FluxoCaixa, Credito, Cobranca
    styles/                   CSS puro (global.css + dashboard.css, layout em Flexbox)

Dockerfile                   build multi-stage (cliente + servidor num único container)
```

## Rodando o projeto localmente

Requer Node.js 20+. O backend usa SQLite embutido — não é preciso instalar
nenhum servidor de banco de dados.

```bash
# 1. Backend
cd server
npm install
cp .env.example .env
npm run db:migrate     # cria server/data/lumina.db a partir do schema.sql
npm run db:seed        # popula uma empresa de demonstração
npm run dev             # http://localhost:4000

# 2. Frontend (noutro terminal)
cd client
npm install
npm run dev              # http://localhost:5173 (proxy automático de /api para :4000)
```

Acesse `http://localhost:5173` e entre com a conta de demonstração
pré-preenchida no login:

- **E-mail:** `demo@lumina.com.br`
- **Senha:** `lumina123`

Ou crie uma conta nova em `/registro` — o cadastro gera automaticamente uma
empresa com plano Starter e período de teste de 14 dias.

### Build de produção

```bash
cd client && npm run build      # gera client/dist
cd ../server && npm start        # serve a API e o build estático do client em :4000
```

### Scripts disponíveis

| Local | Comando | Descrição |
| --- | --- | --- |
| `server/` | `npm run dev` | API com reload automático (`node --watch`) |
| `server/` | `npm start` | API em modo produção (também serve `client/dist`) |
| `server/` | `npm run db:migrate` | Aplica `schema.sql` ao SQLite |
| `server/` | `npm run db:seed` | Repopula o banco com dados de demonstração |
| `server/` | `npm test` | Executa os testes unitários e de integração |
| `client/` | `npm run dev` | Vite em modo desenvolvimento |
| `client/` | `npm run build` | Build de produção do React |

## Implantação (Google Cloud)

O `Dockerfile` na raiz gera uma única imagem (build do React + API Express)
pronta para **Google Cloud Run**:

```bash
gcloud builds submit --tag gcr.io/SEU_PROJETO/lumina
gcloud run deploy lumina \
  --image gcr.io/SEU_PROJETO/lumina \
  --set-env-vars JWT_SECRET=troque-este-segredo,DATABASE_PATH=/app/data/lumina.db \
  --port 8080
```

> SQLite é um ficheiro local — num serviço serverless como o Cloud Run, cada
> instância teria o seu próprio banco. Para produção real, o próximo passo
> natural seria trocar `better-sqlite3` por **Cloud SQL (PostgreSQL/MySQL)**
> via um driver como `pg` ou `mysql2`, mantendo as mesmas queries SQL.

## Limitações conhecidas (é uma demonstração)

- As alíquotas de IBS/CBS em `tax.service.js` são **ilustrativas** — a
  regulamentação complementar da Reforma Tributária ainda está em curso.
- O motor de crédito é uma simulação de regras; não há ligação real a
  nenhuma Instituição Prestadora de BaaS, SCR do Banco Central ou parceiro
  de Open Finance.
- SQLite é adequado para demonstração e desenvolvimento local; um ambiente
  multi-instância em produção exigiria um banco gerido (Cloud SQL).
- Autenticação usa JWT em cookie simples com rate limiting básico — adequado
  para demonstração, mas produção exigiria rotação de chaves e MFA.
- A cobertura de testes automatizados é focada (serviços puros + um fluxo de
  integração ponta a ponta), não exaustiva; foi complementada por smoke test
  manual com Playwright durante o desenvolvimento.
