# Sistema de Logs Detalhado - Avoar Turismo API

## Visão Geral

Sistema de logging estruturado com Winston que fornece rastreamento completo de todas as operações CRUD de Posts e Excursões, visível no Railway Logs para diagnóstico rápido de falhas e bugs.

## Características

### 🎯 Logs Estruturados
- **Prefixo único**: `[AVSITE-API]` em todos os logs
- **Formato JSON** em produção (Railway)
- **Logs coloridos** em desenvolvimento
- **Contexto completo**: userId, userEmail, timestamps, dados da operação

### 📊 Níveis de Log

| Nível | Emoji | Uso | Exemplo |
|-------|-------|-----|---------|
| `info` | ✅ 🏝️ 📝 | Operações bem-sucedidas, início de operações | Criação iniciada, listagem concluída |
| `warn` | ⚠️ | Validações falhadas, recursos não encontrados | Excursão não encontrada |
| `error` | ❌ | Erros e exceções | Falha na criação, erro de validação |
| `debug` | 🔍 | Debugging em desenvolvimento | Detalhes internos |

## Operações Logadas

### 📝 Posts de Blog

#### Listagem de Posts
```typescript
[AVSITE-API] 📝 Posts - Listagem INICIADA
Contexto: {
  userId, userEmail, categoria, status, busca, page, limit
}

[AVSITE-API] ✅ Posts - Listagem CONCLUÍDA
Contexto: {
  encontrados, total, page, limit, timestamp
}
```

#### Criação de Post
```typescript
[AVSITE-API] 📝 Post - Criação INICIADA
Contexto: {
  userId, userEmail, titulo, categoria, status, autor
}

[AVSITE-API] ✅ Post - Criação CONCLUÍDA
Contexto: {
  postId, titulo, slug, status, timestamp
}

[AVSITE-API] ❌ Post - Criação FALHOU (em caso de erro)
Contexto: {
  userId, userEmail, erro, stack
}
```

#### Atualização de Post
```typescript
[AVSITE-API] 📝 Post - Atualização INICIADA
Contexto: {
  postId, userId, userEmail, camposAtualizados, timestamp
}

[AVSITE-API] ⚠️ Post - Atualização FALHOU - Post não encontrado
Contexto: {
  postId, userId, userEmail
}

[AVSITE-API] ✅ Post - Atualização CONCLUÍDA
Contexto: {
  postId, titulo, slug, status, timestamp
}
```

#### Exclusão de Post
```typescript
[AVSITE-API] 🗑️ Post - Exclusão INICIADA
Contexto: {
  postId, userId, userEmail, timestamp
}

[AVSITE-API] ✅ Post - Exclusão CONCLUÍDA
Contexto: {
  postId, titulo, timestamp
}
```

### 🏝️ Excursões

#### Listagem de Excursões
```typescript
[AVSITE-API] 🏝️ Excursões - Listagem INICIADA
Contexto: {
  userId, userEmail, categoria, status, busca, page, limit
}

[AVSITE-API] ✅ Excursões - Listagem CONCLUÍDA
Contexto: {
  encontradas, total, page, limit, timestamp
}
```

#### Criação de Excursão
```typescript
[AVSITE-API] 🏝️ Excursão - Criação INICIADA
Contexto: {
  userId, userEmail, titulo, preco, categoria, status, duracao, timestamp
}

[AVSITE-API] ✅ Excursão - Criação CONCLUÍDA
Contexto: {
  excursaoId, titulo, slug, preco, categoria, status, galeriaImagens, timestamp
}

[AVSITE-API] ❌ Excursão - Criação FALHOU
Contexto: {
  userId, userEmail, erro, stack
}
```

#### Atualização de Excursão
```typescript
[AVSITE-API] 🏝️ Excursão - Atualização INICIADA
Contexto: {
  excursaoId, userId, userEmail, camposAtualizados, timestamp
}

[AVSITE-API] ⚠️ Excursão - Atualização FALHOU - Excursão não encontrada
Contexto: {
  excursaoId, userId, userEmail
}

[AVSITE-API] ✅ Excursão - Atualização CONCLUÍDA
Contexto: {
  excursaoId, titulo, slug, status, galeriaImagens, timestamp
}
```

#### Exclusão de Excursão
```typescript
[AVSITE-API] 🗑️ Excursão - Exclusão INICIADA
Contexto: {
  excursaoId, userId, userEmail, timestamp
}

[AVSITE-API] ✅ Excursão - Exclusão CONCLUÍDA
Contexto: {
  excursaoId, titulo, categoria, imagensExcluidas, timestamp
}
```

## Visualização no Railway Logs

### Exemplo de Log em Produção

```json
{
  "level": "info",
  "message": "[AVSITE-API] 🏝️ Excursão - Criação INICIADA",
  "context": {
    "userId": "cm5x1y2z3000...",
    "userEmail": "admin@avorar.com",
    "titulo": "Passeio de Barco",
    "preco": 180,
    "categoria": "marítimo",
    "status": "ATIVO",
    "duracao": "6 horas",
    "timestamp": "2026-02-02T19:45:23.456Z"
  },
  "service": "avsite-api",
  "timestamp": "2026-02-02 19:45:23"
}
```

### Filtrando Logs no Railway

**Ver apenas operações de Excursões:**
```
[AVSITE-API] 🏝️ Excursão
```

**Ver apenas operações de Posts:**
```
[AVSITE-API] 📝 Post
```

**Ver apenas criações bem-sucedidas:**
```
[AVSITE-API] ✅
```

**Ver apenas falhas:**
```
[AVSITE-API] ❌
```

**Ver apenas avisos:**
```
[AVSITE-API] ⚠️
```

**Ver operações de um usuário específico:**
```
"userEmail": "admin@avorar.com"
```

## Diagnóstico de Problemas Comuns

### Excursão não está sendo criada

1. Busque por: `[AVSITE-API] 🏝️ Excursão - Criação`
2. Verifique se aparece `INICIADA`
3. Se sim, busque por `CONCLUÍDA` ou `FALHOU`
4. Se `FALHOU`, veja o contexto com `erro` e `stack`

### Post não está sendo atualizado

1. Busque por: `[AVSITE-API] 📝 Post - Atualização`
2. Veja se aparece `⚠️ Post não encontrado` (ID incorreto)
3. Ou `❌ Atualização FALHOU` (erro de validação/banco)

### Usuário não consegue fazer operação

1. Busque por `userEmail` do usuário
2. Veja todas as operações que ele tentou
3. Identifique onde está falhando

## Configuração

### Variável de Ambiente

```bash
# Nível de log (opcional)
LOG_LEVEL=info  # debug, info, warn, error
```

### Formato dos Logs

- **Desenvolvimento**: Colorido e legível
- **Produção (Railway)**: JSON estruturado para parsing

## Boas Práticas

### ✅ Fazer

- Buscar por emojis para filtrar rapidamente
- Usar `userId` ou `userEmail` para rastrear usuários
- Verificar `timestamp` para correlação temporal
- Olhar `camposAtualizados` para ver o que mudou
- Consultar `stack` em erros para debug

### ❌ Evitar

- Ignorar logs de `INICIADA` (mostram que o request chegou)
- Confiar apenas em logs de sucesso (verificar erros também)
- Não filtrar por contexto (muita informação misturada)

## Integração com ActivityLog

Além dos logs no console (Railway), todas as operações são registradas na tabela `ActivityLog` do banco para auditoria permanente:

- `action`: create, update, delete
- `entity`: post, excursao
- `entityId`: ID do recurso
- `description`: Descrição legível
- `userId` e `userEmail`: Quem executou
- `createdAt`: Quando foi executado

## Exemplos de Uso

### Verificar se excursão foi criada hoje

```
[AVSITE-API] ✅ Excursão - Criação CONCLUÍDA
"timestamp": "2026-02-02T"
```

### Identificar erro em criação de post

```
[AVSITE-API] ❌ Post - Criação FALHOU
"erro": "..."
```

### Rastrear todas as ações de um admin

```
"userEmail": "admin@avorar.com"
```

### Ver quantas imagens foram enviadas em uma excursão

```
"galeriaImagens": 5
```

---

**Sistema implementado em**: 2026-02-02  
**Arquivos principais**:
- `api/src/routes/post.routes.ts`
- `api/src/routes/excursao.routes.ts`
- `api/src/utils/logger.ts`
