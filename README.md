# Lumina — Tesouraria Inteligente para PMEs

Lumina é uma plataforma SaaS B2B de tesouraria integrada (*Embedded Finance*)
pensada para o mercado médio paulista, projetada a partir de um relatório
estratégico sobre o mercado financeiro de São Paulo e o impacto da Reforma
Tributária (Split Payment do IBS/CBS), da Resolução Conjunta BCB/CMN nº
16/2025 (Banking as a Service), do Open Finance/Pix Automático e do PL
2338/2023 (Marco Legal da IA).

Este repositório contém uma implementação funcional (MVP de demonstração) da
plataforma descrita nesse relatório: aplicação Next.js completa, com
autenticação, base de dados, motor de simulação fiscal e motor de score de
crédito explicável — tudo executável localmente.

> **Aviso:** este é um projeto de demonstração/portfólio. Os parceiros
> (Pluggy, Klavi, Celcoin, QI Tech, TOTVS, SAP, Senior) são citados como
> referência de integração real de mercado, mas nenhuma integração externa é
> efetivamente realizada — todos os dados são simulados localmente.

## Por que estes módulos

A partir de 2026, o Split Payment do IVA Dual passa a segregar
automaticamente o IBS e a CBS na fonte de cada liquidação, eliminando o
"float tributário" que hoje financia o capital de giro informal das PMEs. Ao
mesmo tempo, a Resolução Conjunta BCB/CMN nº 16/2025 limita rigorosamente o
que uma Entidade Tomadora de BaaS pode fazer, e o PL 2338/2023 exige
explicabilidade para sistemas de IA que avaliam risco de crédito. A Lumina
foi desenhada dentro dessas fronteiras regulatórias — não apesar delas.

| Módulo | O que resolve | Como está implementado aqui |
| --- | --- | --- |
| **Agregação Patrimonial** | Fragmentação bancária e reconciliação manual | `dashboard/contas` — contas simuladas via Open Finance (Pluggy/Klavi), com consentimento e expiração |
| **Previsibilidade de Liquidez** | Choque de caixa do Split Payment | `dashboard/fluxo-caixa` — motor `simulateSplitPayment()` aplica IBS/CBS por regime tributário sobre cada fatura |
| **Crédito Contextual** | Necessidade de capital de giro pós-Split Payment | `dashboard/credito` — motor `computeCreditScore()` gera score explicável (0–1000) a partir do histórico real de recebíveis |
| **Cobrança B2B & Pix Automático** | Churn involuntário e custo de MDR | `dashboard/cobranca` — cobranças recorrentes, mandatos Pix Automático, simulação de falha/reenvio de cobrança |

A Lumina nunca decide crédito sozinha: o motor de score apenas gera a
**pré-visualização explicável** que seria enviada a uma Instituição
Prestadora de BaaS licenciada (aqui representada por "Celcoin Instituição de
Pagamento S.A."), conforme a separação de responsabilidades da Resolução
Conjunta nº 16/2025.

## Stack técnica

- **Next.js 16** (App Router, Server Components, Server Actions) + React 19 + TypeScript
- **Tailwind CSS 4** para estilo
- **Prisma 7** (novo gerador `prisma-client`) + **SQLite** via `@prisma/adapter-better-sqlite3`
- **jose** para sessão JWT assinada (HS256) em cookie `httpOnly`
- **bcryptjs** para hashing de senha
- **zod** para validação de entrada nas rotas de autenticação

Não há dependência de serviços externos — tudo roda localmente com SQLite.

## Domínio de dados (`prisma/schema.prisma`)

`Company` → `User`, `BankAccount` (+ `Transaction`), `Invoice`,
`CreditOffer`, `Subscription`. Os valores monetários são armazenados em
**centavos** (`Int`) para evitar erros de ponto flutuante.

## Rodando o projeto

```bash
npm install
cp .env.example .env        # ajuste JWT_SECRET em produção
npm run db:migrate           # cria o banco SQLite local
npm run db:seed              # popula uma empresa de demonstração
npm run dev
```

Acesse `http://localhost:3000` e entre com a conta de demonstração
pré-preenchida no login:

- **E-mail:** `demo@lumina.com.br`
- **Senha:** `lumina123`

Ou crie uma conta nova em `/registro` — o cadastro gera automaticamente uma
`Company` com plano Starter e período de teste de 14 dias.

### Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Ambiente de desenvolvimento (Turbopack) |
| `npm run build` / `npm run start` | Build e execução em modo produção |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Aplica migrações Prisma |
| `npm run db:seed` | Repopula o banco com dados de demonstração |
| `npm run db:studio` | Abre o Prisma Studio |

## Estrutura do projeto

```
src/
  app/
    page.tsx                 # Landing page
    login/, registro/        # Autenticação
    dashboard/
      layout.tsx              # Shell autenticado (Sidebar + Topbar)
      page.tsx                 # Visão geral / radar de liquidez
      contas/                  # Módulo 1 — Agregação Patrimonial
      fluxo-caixa/              # Módulo 2 — Split Payment
      credito/                  # Módulo 3 — Crédito Contextual
      cobranca/                  # Módulo 4 — Pix Automático
    api/auth/                # Rotas de login/registro/logout
  components/
    marketing/                # Seções da landing page
    dashboard/                # Sidebar, Topbar, gráficos, badges
    auth/                      # Formulários de login/registro
  lib/
    tax.ts                     # Simulação de Split Payment (IBS/CBS)
    credit.ts                   # Motor de score explicável
    analytics.ts                 # Agregações por mês/semana para os gráficos
    auth.ts, session.ts           # JWT + leitura de sessão no servidor
    queries.ts                     # Consultas Prisma reutilizadas nos módulos
  proxy.ts                    # Proteção de rotas /dashboard (antigo middleware)
prisma/
  schema.prisma
  seed.ts
```

## Limitações conhecidas (é uma demonstração)

- As alíquotas de IBS/CBS em `lib/tax.ts` são **ilustrativas** — a
  regulamentação complementar da Reforma Tributária ainda está em curso.
- O motor de crédito é uma simulação de regras; não há ligação real a
  nenhuma Instituição Prestadora de BaaS, SCR do Banco Central ou parceiro
  de Open Finance.
- Autenticação usa JWT em cookie simples — adequado para demonstração, mas
  produção exigiria rotação de chaves, MFA e rate limiting.
- Sem testes automatizados end-to-end no repositório (foi feito smoke test
  manual com Playwright durante o desenvolvimento).
