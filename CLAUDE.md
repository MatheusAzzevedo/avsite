# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Código, comentários, mensagens de commit, documentação e respostas ao usuário são em **português (pt-BR)**.

---

## Visão geral

Sistema completo da **Avoar Turismo Pedagógico**: site institucional, portal do cliente (compra de vagas em excursões) e painel administrativo — todos servidos pelo **mesmo processo Node.js**. Não há build de frontend: o backend Express serve HTML/CSS/JS estático diretamente de `api/public/`.

Deploy: **Railway** (`avoarturismo.up.railway.app` / `avoarturismo.com.br`), PostgreSQL gerenciado.

---

## Comandos

Todo o trabalho de backend acontece dentro de `api/`. **Não existe suíte de testes** (nem `npm test`); a única verificação automatizada é o lint.

```bash
cd api

npm install              # inclui postinstall → prisma generate
npm run dev              # ts-node-dev com respawn, porta 3001
npm run lint             # eslint . — é o que o CI roda (.github/workflows/api-lint.yml)
npm run build            # prisma generate && tsc → dist/
npm start                # prestart injeta footer, depois node dist/server.js

npm run prisma:push      # aplica schema.prisma no banco (fluxo padrão do projeto)
npm run prisma:studio    # inspeciona dados
npm run seed             # cria admin + usuários fixos (ts-node prisma/seed.ts)
npm run optimize:images  # sharp sobre "images/FOTOS AVOAR PREFERIDAS"
```

Banco local: `api/docker-compose.yml` sobe `postgres:15` no container `avoar_postgres_db` (arquivo é gitignored — depende do `.env` local).

Lint isolado de um arquivo: `npx eslint src/routes/pedido.routes.ts`.

---

## Arquitetura

### Um deploy, três frontends

`api/src/server.ts` é o ponto de entrada único e faz três coisas:

1. **Serve o site público** por URLs amigáveis mapeadas em `siteRoutes` (`/inicio` → `index-10.html`, `/sobre-nos` → `about.html`, …), com redirects 301 das URLs `.html` antigas. Ao adicionar uma página nova, é preciso registrar tanto no mapa `siteRoutes` quanto num `app.get` explícito.
2. **Serve `/admin` e `/cliente`** como estáticos (`express.static`).
3. **Expõe a API** em `/api/*`.

### ⚠️ `api/public/` é a fonte de verdade do frontend

Os diretórios na **raiz** do repositório (`index-11.html`, `about.html`, `css/`, `js/`, `cliente/`, `includes/`) são **cópias legadas e desatualizadas**. Todo o frontend real vive em:

- `api/public/` — site público (HTML + `js/api-client.js`, `js/portfolio-excursoes.js`, …)
- `api/public/admin/` — painel administrativo (`listas.js` tem ~58KB, é o maior arquivo do admin)
- `api/public/cliente/` — portal do cliente (`auth-manager.js`, `checkout.js`, `pagamento.js`)

Edite sempre em `api/public/`. Só toque nos arquivos da raiz se a tarefa for explicitamente sobre eles.

### Rodapé é componente injetado em build

`includes/footer.html` (e `api/public/includes/footer.html`) é a fonte única. `scripts/inject-footer.js` substitui o placeholder `<!-- FOOTER_COMPONENT -->` nas páginas HTML. Roda automaticamente no `prestart`. **Nunca edite o rodapé direto num HTML de página** — a próxima injeção sobrescreve.

### Backend: rotas → schemas → Prisma

Não há camada de controllers/services. Cada arquivo em `src/routes/` contém handlers Express inline; a lógica de negócio mora ali.

```
src/
  server.ts       # middlewares globais, mapa de rotas do site, registro de routers, error handler
  config/         # database (Prisma singleton), asaas, paghiper, email (Brevo), google-oauth
  middleware/     # auth (admin JWT), cliente-auth (cliente JWT), validate (Zod), request-logger
  routes/         # 20 routers — ver mapa abaixo
  schemas/        # schemas Zod, um por domínio
  templates/      # HTML de e-mails + comprovante PDF
  utils/          # api-error, logger (Winston), slug, email-service
```

**Dois sistemas de autenticação independentes**, ambos JWT em `Authorization: Bearer`:

| | Admin | Cliente |
|---|---|---|
| Modelo | `User` (role ADMIN/EDITOR) | `Cliente` (LOCAL ou GOOGLE OAuth) |
| Middleware | `auth.middleware.ts` + `adminMiddleware` | `cliente-auth.middleware.ts` |
| Rotas | `/api/auth`, `/api/admin/*` | `/api/cliente/*` |

`/api/public/*` e `/api/webhooks/*` não têm auth. Note que `pedido.routes.ts` é montado **duas vezes** (`/api/cliente/pedidos` e `/api/admin/pedidos`) — as rotas checam o contexto internamente.

Erros: lance `ApiError` (`utils/api-error.ts`); o handler global em `server.ts` formata a resposta. Validação: `validate(schema, 'body'|'params'|'query')` substitui `req[target]` pelo resultado parseado.

### Domínio: dois tipos de excursão

Distinção que atravessa todo o sistema (`PedidoTipo`):

- **`ExcursaoPedagogica`** — identificada por `codigo` único (gerado de destino + data); o cliente entra pelo código. Tem `dataFimInscricoes`, `documentoUrl`, `maxInstallments`.
- **`Excursao`** (convencional) — identificada por `slug`, listada publicamente, com categorias many-to-many (`CategoriaExcursao`).

`Pedido` tem FK opcional para os dois e um `excursaoPedagogicaSnapshot` (JSON) que preserva o histórico do cliente caso a excursão seja excluída. Cada `ItemPedido` é **um aluno** (dados escolares + informações médicas). Vagas são validadas contra `Excursao.vagas`/`ExcursaoPedagogica.vagas` no momento da criação do pedido, para bloquear overbooking.

### Pagamentos: dois gateways coexistindo

- **Asaas** (`config/asaas.ts`, ~600 linhas) — PIX, cartão de crédito, boleto. Webhook em `POST /api/webhooks/asaas`.
- **PagHiper** (`config/paghiper.ts`) — PIX. Webhook em `POST /api/webhooks/paghiper`. **Integração mais recente, em andamento na branch `pagHiperPix`.**

Rotas do cliente: `POST /api/cliente/pagamento/pix`, `/cartao`, `/:pedidoId/cancelar`. Chaves vêm **apenas de variáveis de ambiente** (Railway → Variables), nunca do código. `PaymentConfig` no banco guarda config por gateway para o admin.

Healthchecks de Asaas e Brevo rodam em background no boot e apenas logam warning — não bloqueiam o startup.

### E-mail

Via **API HTTP do Brevo** (não SMTP — Railway Hobby bloqueia SMTP). `config/email.ts` + `utils/enviar-email-confirmacao.ts`. Templates em `src/templates/`.

### Banco de dados

**PostgreSQL, sempre.** Regra dura do projeto: nunca SQLite, em nenhuma circunstância.

O projeto **não usa `prisma migrate`** — não existe `prisma/migrations/`. O fluxo é `prisma db push` a partir de `schema.prisma`; os arquivos `prisma/migration-*.sql` são scripts SQL avulsos, aplicados manualmente em produção. Ao alterar o schema, ajuste `schema.prisma` e considere se um `.sql` correspondente é necessário para o banco de produção.

O `startCommand` do Railway (`railway.json`) roda `prisma db push && npm run seed && npm start` — ou seja, **o seed roda em todo deploy** e faz upsert de usuários admin fixos.

Uploads de imagem: alguns fluxos gravam em `api/uploads/` (efêmero no Docker!), outros salvam **Base64 direto no PostgreSQL** — foi essa a correção feita para a Equipe. Prefira Base64 no banco para dados que precisam sobreviver a redeploys.

---

## Convenções obrigatórias

Vindas de `.cursor/rules/` e `.agent/workflows/`:

- **Uma funcionalidade por vez.** Pedidos grandes devem ser quebrados em etapas menores, com o escopo confirmado antes de gerar código. Toda funcionalidade nova precisa de log/debug com descrições que ajudem a localizar erros.
- **Zod + TypeScript** para validar *toda* entrada externa (formulários, APIs, integrações). Nada não-validado avança no fluxo. Schemas centralizados em `src/schemas/`.
- **Nunca `@ts-ignore` sem justificativa técnica** no comentário imediatamente acima. Warnings de lint/compilação são tratados como erros — corrija antes de seguir.
- **Commits**: um commit por tarefa, formato `feat: [ação]` ou `fix: [problema resolvido]`.
- **Explicação didática**: ao criar/alterar função, API ou arquivo, produza a explicação no formato `Explicação da função [nome]: …`, `Explicação da API [nome]: …`, `Explicação do Arquivo [nome]: …`. É por isso que quase todo arquivo do projeto abre com um bloco desses — mantenha o padrão.
- **`CHANGELOG.md`**: manter apenas as **últimas 5 versões**, no formato `Data, Arquivos modificados [explicação]`.
- **`README.md`**: resumo das atualizações, **máximo 200 palavras**, no formato `Arquivos modificados [explicação do que mudou]`.

---

## Documentação de referência no repo

- `api/API-DOCS.md` — endpoints
- `api/DEPLOY-RAILWAY.md`, `api/RAILWAY-VARIABLES.md` — deploy e variáveis
- `api/ASAAS-CONFIG.md` — configuração do gateway
- `api/docs/` — logging, checklist de produção, trust proxy, integração de envio de excursões
- `api/public/admin/EXPLICACAO-TECNICA.md`, `GUIA-RAPIDO.md` — painel admin
- `Docs/Plano-Implementacao-Sistema.md` — plano original do sistema
