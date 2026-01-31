# Como testar se a API está funcionando

Este guia mostra como testar a API Avorar Turismo **localmente** ou **em produção (Railway)**.

---

## 1. Teste rápido: Health Check

Verifica se o servidor está no ar e respondendo.

### Produção (Railway)

```bash
curl https://avoarturismo.up.railway.app/api/health
```

**Resposta esperada (200):**
```json
{
  "status": "ok",
  "message": "API Avorar Turismo funcionando!",
  "timestamp": "2026-01-31T15:00:00.000Z",
  "version": "1.0.0"
}
```

### Local

```bash
curl http://localhost:3001/api/health
```

Se receber JSON com `"status": "ok"`, a API está **funcionando**.

---

## 2. Teste de autenticação (Login)

Verifica se o login retorna um token JWT.

### Produção (Railway)

```bash
curl -X POST https://avoarturismo.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@avorar.com\",\"password\":\"admin123\"}"
```

### Local

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@avorar.com\",\"password\":\"admin123\"}"
```

**Resposta esperada (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@avorar.com",
      "name": "Administrador",
      "role": "ADMIN"
    }
  }
}
```

**Credenciais padrão (criadas pelo seed):**
- **Email:** `admin@avorar.com`
- **Senha:** `admin123`

Se receber `"success": true` e um `token`, a **autenticação está funcionando**. Guarde o valor de `data.token` para os próximos testes.

---

## 3. Teste de listagem de excursões (público)

Verifica se a API pública retorna excursões (não precisa de login).

### Produção

```bash
curl https://avoarturismo.up.railway.app/api/public/excursoes
```

### Local

```bash
curl http://localhost:3001/api/public/excursoes
```

**Resposta esperada (200):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

---

## 4. Teste de criação de excursão (com token)

Verifica se é possível criar uma excursão com o token obtido no login.

**Passo 1:** Faça login e copie o `token` da resposta.

**Passo 2:** Crie uma excursão (substitua `SEU_TOKEN_AQUI` pelo token):

### Produção

```bash
curl -X POST https://avoarturismo.up.railway.app/api/excursoes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d "{\"titulo\":\"Teste API - Passeio\",\"preco\":99.90,\"categoria\":\"natureza\"}"
```

### Local

```bash
curl -X POST http://localhost:3001/api/excursoes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d "{\"titulo\":\"Teste API - Passeio\",\"preco\":99.90,\"categoria\":\"natureza\"}"
```

**Resposta esperada (201):**
```json
{
  "success": true,
  "message": "Excursão criada com sucesso",
  "data": {
    "id": "uuid",
    "titulo": "Teste API - Passeio",
    "slug": "teste-api-passeio",
    "preco": 99.9,
    "categoria": "natureza",
    "status": "ATIVO",
    ...
  }
}
```

Se receber `"success": true` e um `data.id`, a **criação de excursão está funcionando**.

---

## 5. Resumo: ordem dos testes

| Ordem | Teste              | Endpoint                    | Auth? | O que valida        |
|-------|--------------------|-----------------------------|-------|----------------------|
| 1     | Health             | GET /api/health             | Não   | Servidor no ar       |
| 2     | Login              | POST /api/auth/login       | Não   | Autenticação         |
| 3     | Listar excursões   | GET /api/public/excursoes  | Não   | API pública          |
| 4     | Criar excursão     | POST /api/excursoes        | Sim   | CRUD com token       |

---

## 6. Testar no navegador

- **Health:** abra no navegador:  
  `https://avoarturismo.up.railway.app/api/health`  
  Deve aparecer o JSON na tela.

- **Excursões públicas:**  
  `https://avoarturismo.up.railway.app/api/public/excursoes`  
  Deve listar excursões em JSON.

Login e criação de excursão precisam de **POST** com body JSON, então use **curl**, **Postman**, **Thunder Client** ou o script abaixo.

---

## 7. Script de teste automático (Node.js)

Na pasta `api` existe o script `scripts/test-api.js`. Requer **Node.js 18+** (usa `fetch` nativo).

**Testar produção (Railway):**
```bash
cd api
node scripts/test-api.js
```

**Testar local:**
```bash
cd api
node scripts/test-api.js http://localhost:3001
```

O script testa em sequência: health → login → listar excursões → criar excursão (com token) e mostra ✅ ou ❌ para cada passo.

---

## 8. Usando Postman ou Thunder Client

1. **Health:**  
   - Método: GET  
   - URL: `https://avoarturismo.up.railway.app/api/health`

2. **Login:**  
   - Método: POST  
   - URL: `https://avoarturismo.up.railway.app/api/auth/login`  
   - Body: raw → JSON  
   - Conteúdo: `{"email":"admin@avorar.com","password":"admin123"}`

3. **Criar excursão:**  
   - Método: POST  
   - URL: `https://avoarturismo.up.railway.app/api/excursoes`  
   - Headers: `Authorization: Bearer <token>` e `Content-Type: application/json`  
   - Body: raw → JSON  
   - Conteúdo: `{"titulo":"Teste","preco":50,"categoria":"natureza"}`

---

## 9. Erros comuns

| Situação                    | Causa provável                    | Solução                                      |
|----------------------------|-----------------------------------|----------------------------------------------|
| Connection refused         | Servidor não está rodando         | Subir a API: `npm run dev` (local) ou deploy |
| 401 no POST /api/excursoes | Token ausente ou inválido         | Fazer login de novo e usar o novo token      |
| 400 no login               | Email/senha errados               | Usar admin@avorar.com e admin123             |
| 404 em qualquer rota       | URL errada ou API não publicada  | Conferir base URL e /api/ no path            |

---

## 10. Conclusão

Se os quatro testes (health, login, listar excursões, criar excursão) retornarem as respostas esperadas, a **API está funcionando** e pronta para uso e integração.
