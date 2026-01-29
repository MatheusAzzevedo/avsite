# Guia de Deploy no Railway

Este guia explica como fazer o deploy da API Avorar no Railway.

## Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Banco PostgreSQL já configurado no Railway (conforme fornecido)

## Passo a Passo

### 1. Preparar Repositório

```bash
# Na pasta do projeto
cd avs/api

# Instalar dependências localmente para teste
npm install

# Gerar cliente Prisma
npm run prisma:generate

# Testar localmente (opcional)
npm run dev
```

### 2. Criar Projeto no Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Conecte seu repositório GitHub
5. Selecione a pasta `/api` como root directory

### 3. Configurar Variáveis de Ambiente

No painel do Railway, vá em "Variables" e adicione:

```env
# Obrigatório - URL do PostgreSQL (usar a interna quando no Railway)
DATABASE_URL=postgresql://postgres:qTZACPiLyUXxLRTIqYTIknotpFbTGOcw@postgres-1ehm.railway.internal:5432/railway

# Servidor
NODE_ENV=production
PORT=3001

# Autenticação JWT
JWT_SECRET=sua-chave-secreta-muito-forte-e-unica-aqui
JWT_EXPIRES_IN=7d

# CORS - Adicione as URLs do seu site
CORS_ORIGINS=https://seu-site.com,https://www.seu-site.com

# Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif

# URL da API (após deploy, pegue a URL gerada pelo Railway)
API_BASE_URL=https://avorar-api.up.railway.app
```

### 4. Configurar Build Settings

No Railway, configure:

- **Root Directory:** `api`
- **Build Command:** `npm install && npm run prisma:generate && npm run build`
- **Start Command:** `npm start`

Ou use o arquivo `railway.json` já configurado.

### 5. Executar Migrations

Após o primeiro deploy, execute as migrations:

```bash
# Conecte ao shell do Railway
railway run npm run prisma:push
```

Ou use o CLI do Railway:

```bash
# Instalar CLI
npm i -g @railway/cli

# Login
railway login

# Conectar ao projeto
railway link

# Executar migration
railway run npx prisma db push
```

### 6. Popular Banco de Dados (Seed)

```bash
railway run npm run seed
```

Isso criará:
- Usuário admin (admin@avorar.com / admin123)
- Excursões de exemplo
- Posts de exemplo
- Configurações de pagamento

### 7. Verificar Deploy

Após o deploy, acesse:

```
https://[sua-url-railway].up.railway.app/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "message": "API Avorar Turismo funcionando!",
  "timestamp": "...",
  "version": "1.0.0"
}
```

## Atualizando o Frontend

Após obter a URL do Railway, atualize o `api-client.js`:

```javascript
const API_CONFIG = {
  BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : 'https://[sua-url-railway].up.railway.app/api',
  // ...
};
```

## Monitoramento

- **Logs:** Railway > Projeto > Deployments > View Logs
- **Métricas:** Railway > Projeto > Metrics
- **Database:** Railway > PostgreSQL > Data

## Troubleshooting

### Erro de conexão com banco

Verifique se está usando a URL interna do PostgreSQL:
```
postgresql://...@postgres-1ehm.railway.internal:5432/railway
```

### Erro de CORS

Adicione a URL do seu site nas variáveis de ambiente:
```
CORS_ORIGINS=https://seu-site.com
```

### Erro de autenticação

Verifique se o JWT_SECRET está configurado corretamente.

### Uploads não funcionando

Railway não persiste arquivos no filesystem entre deploys. Para produção, considere usar:
- Cloudinary
- AWS S3
- Railway Volume (pago)

## Custos

O plano gratuito do Railway oferece:
- 500 horas de execução/mês
- 100 GB de bandwidth
- 1 GB de storage PostgreSQL

Para produção, considere o plano Pro ($5/mês por projeto).

---

**Última atualização:** Janeiro 2026
