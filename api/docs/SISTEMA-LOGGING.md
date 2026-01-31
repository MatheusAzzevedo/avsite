# Sistema de Logging - AVSITE API

**Data:** 31 de janeiro de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Implementado com Winston

---

## 📋 Resumo

O sistema de logging da API Avorar Turismo agora utiliza **Winston** com prefixo **[AVSITE-API]** em todos os logs. Todos os logs aparecem no console e são capturados pelo Railway Logs.

---

## 🎯 O que foi implementado

### 1. **Winston Logger** (`api/src/utils/logger.ts`)

Sistema robusto com:
- **Timestamps ISO 8601** em todos os logs
- **Prefixo [AVSITE-API]** identificando a aplicação
- **Níveis de log**: info, warn, error, debug
- **Logs estruturados em JSON** (produção) e coloridos (desenvolvimento)
- **Stack traces completos** para erros
- **Contexto estruturado** com metadados

#### Exemplo de saída:

```
2026-01-31 14:23:45 [AVSITE-API] [INFO] [AVSITE-API] Autenticação bem-sucedida - LOGIN | {"userId":"uuid-123","email":"admin@avorar.com","role":"ADMIN","ip":"192.168.1.1"}
```

---

### 2. **Request Logger Middleware** (`api/src/middleware/request-logger.middleware.ts`)

Middleware que captura:
- **Método HTTP** (GET, POST, PUT, DELETE, PATCH)
- **Endpoint** (/api/excursoes, /api/auth/login, etc.)
- **IP do cliente**
- **Tempo de resposta** (em ms)
- **Status HTTP** (200, 201, 400, 401, 404, etc.)
- **Usuário autenticado** (userId, email)
- **Query parameters**
- **Tamanho do body** (para POST/PUT)

#### Exemplo de saída:

```
2026-01-31 14:25:12 [AVSITE-API] [INFO] [AVSITE-API] [POST] /api/excursoes → 201 (145ms) | {"method":"POST","path":"/api/excursoes","ip":"192.168.1.1","statusCode":201,"responseTime":145,"userId":"uuid-123","userEmail":"admin@avorar.com"}
```

---

### 3. **Logs por Endpoint**

#### **Autenticação - LOGIN**

```
[AVSITE-API] Autenticação iniciada - LOGIN
├─ Tentativa: usuario@exemplo.com
├─ IP: 192.168.1.1
└─ Timestamp: 2026-01-31T14:23:45.000Z

[AVSITE-API] ✅ Autenticação bem-sucedida - LOGIN
├─ userId: uuid-123
├─ email: admin@avorar.com
├─ role: ADMIN
└─ IP: 192.168.1.1
```

**Logs de falha:**

```
[AVSITE-API] Falha de login - email não encontrado
├─ email: inexistente@exemplo.com
└─ IP: 192.168.1.1

[AVSITE-API] Falha de login - senha incorreta
├─ userId: uuid-123
├─ email: admin@avorar.com
└─ IP: 192.168.1.1
```

---

#### **Excursões - LISTAGEM**

```
[AVSITE-API] Listagem de Excursões - INICIADO
├─ userId: uuid-123
├─ userEmail: admin@avorar.com
├─ categoria: natureza
├─ status: ATIVO
├─ search: "praia"
├─ page: 1
└─ limit: 20

[AVSITE-API] ✅ Listagem de Excursões - CONCLUÍDO
├─ userId: uuid-123
├─ userEmail: admin@avorar.com
├─ encontradas: 5
├─ total: 42
├─ page: 1
└─ limit: 20
```

---

#### **Excursões - CRIAÇÃO**

```
[AVSITE-API] Criação de Excursão - INICIADO
├─ userId: uuid-123
├─ userEmail: admin@avorar.com
├─ titulo: "Passeio de barco - Ilha Grande"
├─ preco: 150.00
├─ categoria: "natureza"
└─ timestamp: 2026-01-31T14:25:00.000Z

[AVSITE-API] ✅ Criação de Excursão - CONCLUÍDO
├─ userId: uuid-123
├─ userEmail: admin@avorar.com
├─ excursaoId: uuid-456
├─ titulo: "Passeio de barco - Ilha Grande"
├─ slug: "passeio-de-barco-ilha-grande"
└─ timestamp: 2026-01-31T14:25:02.000Z
```

---

#### **Excursões - ATUALIZAÇÃO**

```
[AVSITE-API] Atualização de Excursão - INICIADO
├─ excursaoId: uuid-456
├─ userId: uuid-123
├─ userEmail: admin@avorar.com
├─ camposAtualizados: ["preco", "duracao", "status"]
└─ timestamp: 2026-01-31T14:26:00.000Z

[AVSITE-API] ✅ Atualização de Excursão - CONCLUÍDO
├─ excursaoId: uuid-456
├─ titulo: "Passeio de barco - Ilha Grande"
├─ slug: "passeio-de-barco-ilha-grande"
├─ userId: uuid-123
├─ userEmail: admin@avorar.com
└─ timestamp: 2026-01-31T14:26:01.000Z
```

---

### 4. **Níveis de Log**

| Nível | Cor (Dev) | Quando usar | Exemplo |
|-------|-----------|------------|---------|
| **INFO** | 🟢 Verde | Sucesso, operações normais | Login bem-sucedido, excursão criada |
| **WARN** | 🟡 Amarelo | Avisos, falhas recuperáveis | Login falhou, recursos não encontrados |
| **ERROR** | 🔴 Vermelho | Erros da aplicação | JWT_SECRET não configurado, erro BD |
| **DEBUG** | 🔵 Azul | Desenvolvimento apenas | Queries SQL, stack traces detalhados |

---

## 📊 Visualização no Railway Logs

Todos os logs aparecem na aba **Logs** do Railway com:

1. **Timestamp preciso** (ISO 8601)
2. **Prefixo [AVSITE-API]** para identificar a aplicação
3. **Nível de severidade** [INFO], [WARN], [ERROR], [DEBUG]
4. **Mensagem descritiva** com contexto do que foi feito
5. **Metadados estruturados** (JSON) com informações adicionais

### Exemplo de filtro no Railway Logs:

```
[AVSITE-API]  // Filtra todos os logs da API
[AVSITE-API] [ERROR]  // Filtra apenas erros
[AVSITE-API] Excursão  // Filtra operações de excursões
```

---

## 🔍 Como usar em desenvolvimento

### Ativar logs de debug

```bash
LOG_LEVEL=debug npm run dev
```

### Ver todos os logs coloridos

```bash
npm run dev
# Os logs aparecerão no terminal com cores:
# 🟢 INFO em verde
# 🟡 WARN em amarelo
# 🔴 ERROR em vermelho
# 🔵 DEBUG em azul (somente desenvolvimento)
```

---

## 🚀 Como usar em produção (Railway)

Os logs são capturados automaticamente pelo Railway. Para visualizar:

1. Ir para o projeto no Railway (`railway.app`)
2. Clicar em **Logs**
3. Filtrar por `[AVSITE-API]`
4. Ver logs em tempo real

### Exemplos de busca:

```
[AVSITE-API] [ERROR]     → Ver apenas erros
[AVSITE-API] Excursão    → Ver operações de excursões
[AVSITE-API] LOGIN       → Ver tentativas de login
admin@avorar.com         → Ver atividades de um usuário
```

---

## 📝 Campos de contexto em cada log

### Login

```json
{
  "email": "usuario@exemplo.com",
  "ip": "192.168.1.1",
  "userId": "uuid-123",
  "role": "ADMIN",
  "timestamp": "2026-01-31T14:23:45.000Z"
}
```

### Criação de Excursão

```json
{
  "userId": "uuid-123",
  "userEmail": "admin@avorar.com",
  "excursaoId": "uuid-456",
  "titulo": "Passeio de barco",
  "preco": 150.00,
  "categoria": "natureza",
  "slug": "passeio-de-barco-ilha-grande",
  "timestamp": "2026-01-31T14:25:00.000Z"
}
```

### Atualização de Excursão

```json
{
  "excursaoId": "uuid-456",
  "userId": "uuid-123",
  "userEmail": "admin@avorar.com",
  "camposAtualizados": ["preco", "duracao", "status"],
  "titulo": "Passeio de barco",
  "slug": "passeio-de-barco-ilha-grande",
  "timestamp": "2026-01-31T14:26:00.000Z"
}
```

---

## 🔧 Configuração

### Variáveis de ambiente

```bash
# Nível de log (padrão: 'info' em produção, 'debug' em desenvolvimento)
LOG_LEVEL=info

# NODE_ENV (automaticamente ajusta verbose)
NODE_ENV=production  # Logs estruturados em JSON
NODE_ENV=development # Logs coloridos no console
```

---

## 📦 Dependência instalada

```json
{
  "dependencies": {
    "winston": "^3.11.0"
  }
}
```

---

## ✅ Checklist de verificação

- ✅ Winston instalado e configurado
- ✅ Prefixo [AVSITE-API] em todos os logs
- ✅ Request logger middleware implementado
- ✅ Logs em autenticação (login, falhas)
- ✅ Logs em excursões (criar, listar, atualizar)
- ✅ Logs estruturados com metadados
- ✅ Suporta produção (Railway) e desenvolvimento
- ✅ Colorização em desenvolvimento
- ✅ JSON estruturado em produção
- ✅ Stack traces em erros

---

## 🎓 Exemplos de uso em código

### Logar informação simples

```typescript
logger.info('Operação concluída', { context: { userId: 'uuid-123' } });
```

### Logar aviso

```typescript
logger.warn('Limite de requisições próximo', { context: { ip: '192.168.1.1' } });
```

### Logar erro com contexto

```typescript
logger.error('Falha ao conectar BD', { context: { erro: error.message } });
```

### Logar debug (somente desenvolvimento)

```typescript
logger.debug('Query SQL: SELECT * FROM users', { context: { query } });
```

---

## 📞 Monitoramento Recomendado

Para produção, recomenda-se integrar com:

1. **Sentry** - Rastreamento automático de erros
2. **LogRocket** - Reprodução de sessões
3. **Datadog** - APM e monitoramento de performance
4. **New Relic** - Observabilidade completa

Todos os logs estão estruturados em JSON e prontos para integração com essas plataformas.

---

## 🎯 Conclusão

A API Avorar Turismo agora possui um sistema de logging profissional com:
- ✅ Logs descritivos e estruturados
- ✅ Identificação clara com prefixo [AVSITE-API]
- ✅ Captura automática no Railway Logs
- ✅ Suporte a desenvolvimento e produção
- ✅ Metadados contextuais completos
- ✅ Stack traces detalhados para erros

Qualquer operação na API (login, criação de excursão, atualização) é registrada com contexto completo e visível no Railway.
