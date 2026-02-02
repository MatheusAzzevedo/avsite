# Trust Proxy: Configuração para Proxy Reverso (Railway)

## Problema Identificado

No Railway, requisições chegam à aplicação através de um **proxy reverso**. Esse proxy envia o header `X-Forwarded-For` com o IP real do cliente, mas o Express não estava configurado para confiar nesse header.

### Sintomas
- ❌ Requisições GET retornam ValidationError
- ❌ Rate limiter bloqueia os requests (identifica proxy como cliente)
- ❌ Dados não aparecem na API (GETs falham)
- ❌ Criações funcionam mas listagens falham
- ❌ Nenhuma excursão aparece no site nem admin

### Causa Raiz
```typescript
// ❌ ANTES (sem trust proxy)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  // Express não identifica o cliente corretamente
  // Rate limiter usa X-Forwarded-For quando não confiável = ValidationError
});
```

## Solução Implementada

Adicionar uma única linha antes dos middlewares:

```typescript
// ✅ DEPOIS (com trust proxy)
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  // Express agora identifica corretamente o IP do cliente
  // Rate limiter funciona normalmente
});
```

## Como Funciona

1. **Cliente** faz requisição
2. **Proxy Reverso (Railway)** recebe, adiciona header `X-Forwarded-For: <IP_REAL>`
3. **Express (com trust proxy = 1)** lê `X-Forwarded-For` e confia nele
4. **Rate Limiter** identifica cliente corretamente pelo IP real
5. **Handler da rota** executa normalmente

### Valores de `trust proxy`

| Valor | Descrição | Uso |
|-------|-----------|-----|
| `false` | Desabilita (default) | Local, sem proxy |
| `true` | Confia em qualquer proxy | ⚠️ Inseguro em produção |
| `1` | Confia em 1 proxy | ✅ Railway, Heroku, etc |
| `2` | Confia em 2 proxies | Multi-proxy |
| Array | Confia em IPs específicos | `['192.0.2.1', '203.0.113.195']` |

## Impacto no Railway

### Antes da Correção
```
GET /api/excursoes
↓
Rate Limiter vê X-Forwarded-For
↓
Trust proxy = false → ValidationError ❌
↓
Requisição falha antes de chegar ao handler
↓
Frontend recebe erro → Excursões não aparecem
```

### Depois da Correção
```
GET /api/excursoes
↓
Rate Limiter vê X-Forwarded-For
↓
Trust proxy = 1 → Express identifica cliente
↓
Requisição passa normalmente
↓
Handler executa → Dados retornados ✅
↓
Frontend recebe dados → Excursões aparecem
```

## Verificação em Produção

### Health Check
```bash
curl https://avoarturismo.up.railway.app/api/health
# Retorna: { "status": "ok", "message": "...", "timestamp": "...", "version": "1.0.0" }
```

### GET de Excursões
```bash
curl https://avoarturismo.up.railway.app/api/public/excursoes
# Retorna: [ { "id": "...", "titulo": "Cristo Redentor", ... }, ... ]
```

### Verificar no Railway Logs
```
[AVSITE-API] ✅ Operação CONCLUÍDA: getAll
```

## Segurança

### ✅ Railway (Seguro)
- `trust proxy: 1` porque o Railway tem apenas 1 proxy reverso
- IP real recuperado de `req.ip` e `req.ips`
- Rate limiter funciona corretamente

### ⚠️ Alertas
- Nunca use `trust proxy: true` em produção (confia em qualquer proxy)
- Se mudar de plataforma (AWS, GCP), verificar número de proxies
- Sempre usar a menor quantidade de proxies confiáveis

## Referências

- [Express Trust Proxy Documentation](https://expressjs.com/en/guide/behind-proxies.html)
- [Express Rate Limit Docs](https://github.com/nfriedly/express-rate-limit)
- [Railway Environment](https://docs.railway.app)

## Checklist para Outros Ambientes

| Ambiente | trust proxy | Status |
|----------|-------------|--------|
| Railway | 1 | ✅ Configurado |
| Heroku | 1 | - |
| Render | 1 | - |
| Vercel (API Routes) | 1 | - |
| AWS Lambda | IP específico | - |
| Local (localhost) | false | - |

---

**Commit de Correção**: `fix: resolver excursões não aparecem no site nem admin (trust proxy)` — bb745f6
