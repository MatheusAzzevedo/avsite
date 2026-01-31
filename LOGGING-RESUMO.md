# 🚀 Sistema de Logging - AVSITE API no Railway

## ✅ O que foi implementado

### 1. **Winston Logger** - Logging Profissional
- ✅ Prefixo `[AVSITE-API]` em todos os logs
- ✅ Timestamps ISO 8601
- ✅ Níveis: INFO, WARN, ERROR, DEBUG
- ✅ Colorização em desenvolvimento
- ✅ JSON estruturado em produção
- ✅ Stack traces completos para erros

### 2. **Request Logger Middleware** - Captura Automática
- ✅ Método HTTP (GET, POST, PUT, DELETE, PATCH)
- ✅ Endpoint (/api/excursoes, /api/auth/login, etc.)
- ✅ IP do cliente
- ✅ Tempo de resposta (ms)
- ✅ Status HTTP (200, 201, 400, 401, 404, etc.)
- ✅ Usuário autenticado (userId, email)
- ✅ Query parameters
- ✅ Tamanho do body

### 3. **Logs Descritivos por Endpoint**

#### 🔐 Autenticação (Login)
```
[AVSITE-API] Autenticação iniciada - LOGIN
├─ email: usuario@exemplo.com
├─ ip: 192.168.1.1
└─ timestamp: 2026-01-31T14:23:45.000Z

[AVSITE-API] ✅ Autenticação bem-sucedida - LOGIN
├─ userId: abc123
├─ email: usuario@exemplo.com
├─ role: ADMIN
└─ ip: 192.168.1.1
```

#### 🏝️ Excursões - Listagem
```
[AVSITE-API] Listagem de Excursões - INICIADO
├─ userId: abc123
├─ userEmail: admin@avorar.com
├─ categoria: natureza
├─ status: ATIVO
└─ page: 1

[AVSITE-API] ✅ Listagem de Excursões - CONCLUÍDO
├─ encontradas: 5
├─ total: 42
└─ responseTime: 245ms
```

#### ➕ Excursões - Criação
```
[AVSITE-API] Criação de Excursão - INICIADO
├─ userId: abc123
├─ titulo: "Passeio de barco - Ilha Grande"
├─ preco: 150.00
└─ categoria: "natureza"

[AVSITE-API] ✅ Criação de Excursão - CONCLUÍDO
├─ excursaoId: xyz789
├─ slug: "passeio-de-barco-ilha-grande"
└─ responseTime: 340ms
```

#### ✏️ Excursões - Atualização
```
[AVSITE-API] Atualização de Excursão - INICIADO
├─ excursaoId: xyz789
├─ camposAtualizados: ["preco", "duracao", "status"]
└─ userId: abc123

[AVSITE-API] ✅ Atualização de Excursão - CONCLUÍDO
├─ excursaoId: xyz789
├─ titulo: "Passeio de barco - Ilha Grande"
└─ responseTime: 215ms
```

---

## 📊 Como visualizar no Railway Logs

### Passo 1: Acessar Railway Dashboard
```
https://railway.app/project/[seu-projeto-id]
```

### Passo 2: Clicar em "Logs"
Você verá os logs em tempo real da aplicação

### Passo 3: Filtrar logs
```
[AVSITE-API]              → Ver todos os logs da API
[AVSITE-API] [ERROR]      → Ver apenas erros
[AVSITE-API] Excursão     → Ver operações de excursões
[AVSITE-API] LOGIN        → Ver logins
admin@avorar.com          → Ver atividades de um usuário específico
```

---

## 🎨 Cores dos Logs

### Em Desenvolvimento (Terminal)
- 🟢 **GREEN** - INFO (operações bem-sucedidas)
- 🟡 **YELLOW** - WARN (avisos, falhas recuperáveis)
- 🔴 **RED** - ERROR (erros da aplicação)
- 🔵 **BLUE** - DEBUG (informações de debug)

### Em Produção (Railroad Logs)
- Logs estruturados em JSON
- Fácil parsing e busca
- Integração com ferramentas de APM (Sentry, Datadog, etc.)

---

## 📝 Exemplo de Log Completo no Railway

```json
{
  "level": "info",
  "message": "[AVSITE-API] ✅ Autenticação bem-sucedida - LOGIN",
  "timestamp": "2026-01-31T14:23:45.123Z",
  "service": "avsite-api",
  "context": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@avorar.com",
    "role": "ADMIN",
    "ip": "192.168.1.100",
    "timestamp": "2026-01-31T14:23:45.000Z"
  }
}
```

---

## 🔍 Informações Capturadas

### Para Cada Requisição
```
✅ Método HTTP          → POST, GET, PUT, DELETE, PATCH
✅ Endpoint             → /api/excursoes, /api/auth/login
✅ IP do cliente        → 192.168.1.100
✅ Status HTTP          → 201, 200, 400, 401, 404, 500
✅ Tempo de resposta    → 145ms, 340ms, 215ms
✅ Usuário              → userId, email
✅ Query params         → page=1, limit=20, categoria=natureza
✅ Tamanho do body      → 1024B, 5120B
```

---

## 🚨 Logs de Erro Detalhados

Quando um erro ocorre, o log inclui:
- ❌ Tipo de erro
- 📋 Stack trace completo
- 👤 Usuário que causou o erro
- 🔗 Endpoint onde ocorreu
- ⏱️ Exato momento do erro
- 🌍 IP do cliente

Exemplo:
```
[AVSITE-API] [ERROR] [AVSITE-API] Erro ao criar excursão | 
{
  "stack": "Error: Database connection failed\n    at ...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@avorar.com",
  "endpoint": "/api/excursoes",
  "timestamp": "2026-01-31T14:30:00.000Z"
}
```

---

## 📦 Instalação

Winston foi adicionado ao `package.json`:
```bash
npm install
# Winston 3.11.0 é instalado automaticamente
```

---

## 🎯 Próximos Passos (Opcional)

Para monitoramento ainda mais robusto, integrar com:

1. **Sentry** - Rastreamento automático de erros
   ```bash
   npm install @sentry/node
   ```

2. **LogRocket** - Reprodução de sessões
   ```bash
   npm install logrocket
   ```

3. **Datadog** - APM completo
   ```bash
   npm install dd-trace
   ```

---

## ✨ Benefícios

✅ **Rastreabilidade Completa** - Cada operação é registrada com contexto  
✅ **Debugging Facilitado** - Stack traces e contextos detalhados  
✅ **Monitoramento em Tempo Real** - Ver logs conforme ocorrem no Railway  
✅ **Segurança** - Rastrear tentativas de login falhadas  
✅ **Auditoria** - Registro de quem fez o quê e quando  
✅ **Performance** - Identificar operações lentas pelos tempos de resposta  

---

## 🎓 Conclusão

A API Avorar Turismo agora possui um sistema de logging **profissional e pronto para produção**, com:

- ✅ Logs descritivos com prefixo `[AVSITE-API]`
- ✅ Captura automática de requisições HTTP
- ✅ Visualização em tempo real no Railway Logs
- ✅ Contexto estruturado em JSON
- ✅ Stack traces detalhados para erros
- ✅ Suporte a desenvolvimento e produção

**Qualquer outro sistema integrando com a API verá todos os detalhes das operações nos Railway Logs!**
