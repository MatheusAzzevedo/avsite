# Checklist: API Avorar Turismo - Verificação de Produção

**Data:** 31 de janeiro de 2026  
**Versão:** 1.0.0  
**Status:** ✅ PRONTA PARA PRODUÇÃO

Este documento verifica se a API Avorar Turismo no Railway está configurada corretamente e pronta para receber integração de outros sistemas.

---

## 1. Infraestrutura e Servidor

| Item | Status | Descrição |
|------|--------|-----------|
| **Express.js** | ✅ | Servidor web configurado e rodando |
| **Port configurável** | ✅ | `process.env.PORT \|\| 3001` (Railway define a porta automaticamente) |
| **Node.js versão** | ✅ | `>=18.0.0` (compatível com Railway) |
| **Middlewares globais** | ✅ | Helmet, CORS, Rate Limiting, JSON parser, static files |
| **Health check** | ✅ | `GET /api/health` disponível e funcional |

**Verificação:** O servidor Express está configurado com todos os middlewares necessários, incluindo:
- Helmet para segurança (headers HTTP)
- CORS para requisições de outros domínios
- Rate limiting (100 req/15min por IP)
- Parser JSON (até 10MB)
- Logging de requisições
- Tratamento de erros global

---

## 2. Banco de Dados

| Item | Status | Descrição |
|------|--------|-----------|
| **PostgreSQL** | ✅ | Database engine correto (nunca SQLite) |
| **Prisma Client** | ✅ | ORM configurado na versão ^5.8.0 |
| **Schema Prisma** | ✅ | Modelos: User, Excursao, ExcursaoImagem, Post, ActivityLog, Upload, PaymentConfig |
| **Migrations** | ✅ | Prisma db push configurado no Procfile |
| **Conexão** | ✅ | DATABASE_URL via variável de ambiente |
| **Connection pool** | ✅ | Prisma gerencia automaticamente |
| **Graceful disconnect** | ✅ | `process.on('SIGINT')` desconecta Prisma antes de shutdown |

**Verificação:** 
- Schema bem estruturado com índices e relacionamentos
- Suporta todas as operações CRUD necessárias
- Railway DATABASE_URL configurada corretamente (visto nas variáveis)
- Seed disponível manualmente (`npm run seed`); não roda na inicialização do deploy

---

## 3. Autenticação e Segurança

| Item | Status | Descrição |
|------|--------|-----------|
| **JWT** | ✅ | Tokens JWT com `jsonwebtoken` ^9.0.2 |
| **JWT_SECRET** | ⚠️ | Configurado em `process.env.JWT_SECRET` |
| **JWT_EXPIRES_IN** | ✅ | Default: "7d" (configurável via env) |
| **Hashing de senha** | ✅ | bcryptjs ^2.4.3 com salt 10 |
| **Middleware auth** | ✅ | `authMiddleware` valida Bearer token |
| **Admin middleware** | ✅ | `adminMiddleware` verifica role ADMIN |
| **Endpoints protegidos** | ✅ | POST/PUT/DELETE /api/excursoes requerem auth |
| **CORS headers** | ✅ | Authorization header permitido |
| **Rate limiting** | ✅ | 100 requisições por IP a cada 15 minutos |

**Verificação:**
- Autenticação JWT implementada corretamente
- Senhas hasheadas e bcrypt com salt apropriado
- Tokens validados em middleware Express
- Erro 401 retornado para tokens ausentes/inválidos/expirados
- Seed cria usuário admin: `admin@avorar.com / admin123`

**Atenção:** `JWT_SECRET` DEVE estar configurado em Railway com uma chave criptográfica forte (não usar padrão fraco).

---

## 4. Validação de Dados

| Item | Status | Descrição |
|------|--------|-----------|
| **Zod** | ✅ | Biblioteca de validação ^3.22.4 |
| **Schema excursão** | ✅ | `createExcursaoSchema`, `updateExcursaoSchema`, `filterExcursaoSchema` |
| **Validação body** | ✅ | `validateBody()` middleware no POST/PUT |
| **Validação query** | ✅ | `validateQuery()` middleware no GET com filtros |
| **Mensagens de erro** | ✅ | Retorna array `details` com field + message por erro |
| **Type inference** | ✅ | Tipos TypeScript inferidos dos schemas Zod |

**Verificação:**
- Todos os dados de entrada (body, query, params) são validados
- Erros de validação retornam 400 com detalhes
- Campos obrigatórios: `titulo`, `preco`, `categoria` (criação de excursão)
- Tipos coagidos corretamente (coerce numbers, strings, arrays)

---

## 5. Rotas e Endpoints

| Categoria | Rota | Método | Auth | Status |
|-----------|------|--------|------|--------|
| **Autenticação** | `/api/auth/login` | POST | ❌ | ✅ |
| **Autenticação** | `/api/auth/register` | POST | ✅ | ✅ |
| **Autenticação** | `/api/auth/me` | GET | ✅ | ✅ |
| **Autenticação** | `/api/auth/change-password` | PUT | ✅ | ✅ |
| **Autenticação** | `/api/auth/verify` | POST | ✅ | ✅ |
| **Excursões (admin)** | `/api/excursoes` | GET | ✅ | ✅ |
| **Excursões (admin)** | `/api/excursoes/:id` | GET | ✅ | ✅ |
| **Excursões (admin)** | `/api/excursoes` | POST | ✅ | ✅ |
| **Excursões (admin)** | `/api/excursoes/:id` | PUT | ✅ | ✅ |
| **Excursões (admin)** | `/api/excursoes/:id` | DELETE | ✅ | ✅ |
| **Excursões (admin)** | `/api/excursoes/:id/status` | PATCH | ✅ | ✅ |
| **Excursões (público)** | `/api/public/excursoes` | GET | ❌ | ✅ |
| **Excursões (público)** | `/api/public/excursoes/:slug` | GET | ❌ | ✅ |
| **Posts** | `/api/posts` | GET/POST/PUT/DELETE | ✅ | ✅ |
| **Uploads** | `/api/uploads` | POST | ✅ | ✅ |
| **Health** | `/api/health` | GET | ❌ | ✅ |

**Verificação:** Todas as rotas necessárias implementadas, autenticação corretamente aplicada.

---

## 6. Configuração do Railway

| Item | Status | Configuração |
|------|--------|--------------|
| **Procfile** | ✅ | `web: npx prisma db push && npm start` |
| **Railway.json** | ✅ | Builder: RAILPACK, startCommand com Prisma db push + npm start (sem seed automático) |
| **Environment Variables** | ⚠️ | Ver seção abaixo |
| **Deploy restarts** | ✅ | ON_FAILURE com max 10 retries |
| **Node replicas** | ✅ | 1 réplica (pode escalar se necessário) |

**Variáveis de Ambiente Necessárias em Railway:**

```
NODE_ENV=production
PORT=<automaticamente atribuído pelo Railway>
DATABASE_URL=postgresql://user:pass@host:port/database
JWT_SECRET=<gerar chave forte, ex: openssl rand -hex 32>
JWT_EXPIRES_IN=7d
CORS_ORIGINS=https://avoarturismo.up.railway.app,https://outro-dominio.com
API_BASE_URL=https://avoarturismo.up.railway.app
```

**Status Atual de Variáveis (visto na imagem do Railway):**
- ✅ API_BASE_URL: https://avoarturismo.up.railway.app
- ✅ CORS_ORIGIN: https://avoarturismo.up.railway.app
- ✅ CORS_ORIGINS: avoarturismo.up.railway.app
- ✅ DATABASE_URL: postgresql:// [configurado]
- ✅ DATABASE_PUBLIC_URL: postgresql:// [configurado]
- ✅ JWT_SECRET: [configurado]
- ✅ NODE_ENV: production

---

## 7. CORS - Permitir requisições de outros sistemas

| Item | Status | Descrição |
|------|--------|-----------|
| **CORS ativado** | ✅ | `cors()` middleware configurado |
| **Métodos permitidos** | ✅ | GET, POST, PUT, DELETE, PATCH, OPTIONS |
| **Headers permitidos** | ✅ | Content-Type, Authorization |
| **Credentials** | ✅ | `credentials: true` |
| **CORS_ORIGINS env** | ⚠️ | Deve estar corretamente configurado em Railway |

**Verificação:** Código no server.ts:
```typescript
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Atenção:** Se outro sistema chamar a API de um domínio diferente, adicionar esse domínio a `CORS_ORIGINS` no Railway.

---

## 8. Logging e Monitoring

| Item | Status | Descrição |
|------|--------|-----------|
| **Logger** | ✅ | Implementado em `src/utils/logger.ts` |
| **Log levels** | ✅ | info, warn, error, debug |
| **Request logging** | ✅ | Todas as requisições loggadas com método e path |
| **Error logging** | ✅ | Erros capturados no handler global |
| **Query logging (dev)** | ✅ | Prisma queries loggadas em desenvolvimento |
| **Production logging** | ⚠️ | Console.log (considerar Winston/Pino para produção robusta) |

**Recomendação:** Para produção robusta, considerar migrar para Winston ou Pino para logs persistentes e estruturados. Atualmente usa `console.log` que é funcional mas não ideal para arquivos de log ou aggregators como Sentry.

---

## 9. Seed de Dados Inicial

| Item | Status | Descrição |
|------|--------|-----------|
| **Seed no deploy** | ❌ | Não roda automaticamente; deploy executa apenas prisma db push + npm start |
| **Seed manual** | ✅ | `npm run seed` disponível para rodar quando necessário (ex.: primeiro deploy ou ambiente novo) |
| **Usuário admin padrão** | ✅ | admin@avorar.com / admin123 (criado ao rodar seed manualmente) |
| **Excursões de exemplo** | ✅ | Criadas ao rodar seed manualmente |
| **Upsert strategy** | ✅ | Seed é idempotente (executa múltiplas vezes sem erro) |

**Verificação:** Seed.ts não é executado no deploy. Para popular o banco com dados iniciais, rodar manualmente: `railway run npm run seed`.

---

## 10. Scripts de Inicialização

| Script | Função | Usado em |
|--------|--------|----------|
| `npm run dev` | Desenvolvimen local com hot reload | Dev local |
| `npm run build` | Compila TypeScript → JavaScript | Railway build phase |
| `npm start` | Inicia servidor compilado | Railway `startCommand` |
| `npm run prisma:generate` | Gera Prisma Client | `postinstall` hook |
| `npm run prisma:push` | Sincroniza schema com banco | Procfile / railway.json |
| `npm run seed` | Popula banco com dados iniciais | Manual (não no deploy) |

**Verificação:** Railway.json executa:
```
npx prisma db push && npm start
```

Que garante schema no banco + inicia servidor. Seed não roda no deploy; executar manualmente quando necessário.

---

## 11. Tratamento de Erros

| Tipo de Erro | Status | Código HTTP | Formato |
|------------|--------|------------|---------|
| Validação inválida | ✅ | 400 | `{ error, details: [{field, message}] }` |
| Token ausente | ✅ | 401 | `{ error: "Token não fornecido" }` |
| Token inválido | ✅ | 401 | `{ error: "Token inválido" }` |
| Token expirado | ✅ | 401 | `{ error: "Token expirado" }` |
| Recurso não encontrado | ✅ | 404 | `{ error: "Excursão não encontrada" }` |
| Rate limit | ✅ | 429 | `{ error: "Muitas requisições..." }` |
| Erro interno | ✅ | 500 | `{ error: "Erro interno do servidor" }` |

**Verificação:** Todos os erros tratados globalmente via middleware em server.ts, respostas estruturadas e informativas.

---

## 12. Performance e Escalabilidade

| Aspecto | Status | Detalhes |
|---------|--------|----------|
| **Limite de body** | ✅ | 10MB (apropriado) |
| **Rate limiting** | ✅ | 100 req/IP/15min (proteção contra abuso) |
| **Pagination** | ✅ | Listagens suportam `page` e `limit` params |
| **Índices no BD** | ✅ | schema.prisma com índices em slug, status, categoria |
| **Prisma connection pool** | ✅ | Gerenciado automaticamente |
| **Graceful shutdown** | ✅ | Desconecta Prisma antes de matar processo |
| **Horizontal scaling** | ⚠️ | Stateless → pode escalar (sem session store local) |

---

## Resumo de Checklist

### ✅ Funcionando Corretamente

1. Servidor Express com middlewares de segurança (Helmet, CORS, Rate Limit)
2. Banco PostgreSQL com schema Prisma bem estruturado
3. Autenticação JWT com validação de token
4. Validação de dados com Zod
5. Rotas protegidas e públicas implementadas
6. Tratamento de erros global
7. Health check endpoint
8. Seed manual (não automático no deploy); usuário admin criado ao rodar seed
9. Railway configurado com Procfile e railway.json
10. Logging básico funcional
11. CORS permitindo outros domínios
12. Scripts de inicialização corretos

### ⚠️ Itens de Atenção

1. **JWT_SECRET** - Deve ser uma chave criptográfica forte em Railway (não usar padrão fraco)
2. **CORS_ORIGINS** - Se sistema externo chamar de domínio diferente, adicionar à lista
3. **Logging em produção** - Considerar migrar para Winston/Pino para logs persistentes
4. **Monitoramento** - Adicionar Sentry ou similar para rastrear erros em produção

### ❌ Problemas Encontrados

Nenhum problema crítico encontrado. A API está pronta para produção.

---

## Passos Finais para Colocar em Produção

1. **Verificar variáveis no Railway:**
   ```
   ✅ NODE_ENV = production
   ✅ DATABASE_URL = postgresql://...
   ✅ JWT_SECRET = <chave forte, ex: openssl rand -hex 32>
   ✅ CORS_ORIGINS = https://avoarturismo.up.railway.app
   ```

2. **Testar autenticação:**
   ```bash
   curl -X POST https://avoarturismo.up.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@avorar.com","password":"admin123"}'
   ```

3. **Testar criação de excursão:**
   ```bash
   curl -X POST https://avoarturismo.up.railway.app/api/excursoes \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer {token}" \
     -d '{
       "titulo":"Nova Excursão",
       "preco":150.00,
       "categoria":"natureza"
     }'
   ```

4. **Testar health check:**
   ```bash
   curl https://avoarturismo.up.railway.app/api/health
   ```

5. **Compartilhar documento de integração:**
   - Compartilhar `api/docs/INTEGRACAO-ENVIO-EXCURSOES.md` com sistema externo
   - Fornecer credenciais de admin temporário ou criar novo usuário
   - Orientar sobre rate limit e tratamento de erros

---

## Conclusão

✅ **A API Avorar Turismo está PRONTA PARA PRODUÇÃO no Railway e pode receber integração de outros sistemas.**

Todos os requisitos técnicos foram atendidos:
- Servidor Express funcional
- Banco PostgreSQL com schema correto
- Autenticação JWT segura
- Validação de dados robusta
- CORS configurado
- Rate limiting ativo
- Tratamento de erros completo
- Documentação de integração disponível

Qualquer outro sistema pode chamar a API seguindo o documento `api/docs/INTEGRACAO-ENVIO-EXCURSOES.md`.
