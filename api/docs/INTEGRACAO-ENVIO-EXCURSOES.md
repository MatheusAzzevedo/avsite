# Integração técnica: envio de excursões via API

Este documento descreve de forma técnica como um programa externo deve usar a API Avorar Turismo para **enviar** (criar e atualizar) excursões. A API está em **produção no Railway** e deve ser acessada pela URL pública abaixo.

---

## 1. Informações gerais

| Item | Valor |
|------|--------|
| **Base da API (produção)** | `https://avoarturismo.up.railway.app` |
| **Prefixo das rotas** | `/api` (ex.: login = `https://avoarturismo.up.railway.app/api/auth/login`) |
| **Conteúdo** | JSON (`Content-Type: application/json`) |
| **Autenticação** | JWT Bearer (obrigatório para criar/atualizar excursões) |
| **Limite de body** | 10 MB |
| **Rate limit** | 100 requisições por IP a cada 15 minutos (em `/api/`) |

**Importante:** Use sempre a URL de produção acima. Não utilize `localhost` — o sistema Avorar Turismo (avsite) está hospedado no Railway e a API responde apenas na URL pública configurada no projeto.

O cliente deve enviar sempre o header:

```
Content-Type: application/json
```

---

## 2. Autenticação

Todas as rotas de **envio** de excursão exigem autenticação. O fluxo é:

1. Obter um token JWT via **login**.
2. Incluir o token em toda requisição de criação/atualização de excursão.

### 2.1 Obter o token (login)

**Requisição**

```
POST https://avoarturismo.up.railway.app/api/auth/login
Content-Type: application/json
```

**Body**

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

| Campo | Tipo | Obrigatório | Regras |
|-------|------|-------------|--------|
| `email` | string | Sim | E-mail válido (será convertido para minúsculas) |
| `password` | string | Sim | Mínimo 6 caracteres |

**Resposta de sucesso (200)**

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-do-usuario",
      "email": "usuario@exemplo.com",
      "name": "Nome do Usuário",
      "role": "ADMIN"
    }
  }
}
```

O valor de `data.token` deve ser guardado e enviado no header `Authorization` nas próximas requisições.

**Respostas de erro**

- **401** – Credenciais inválidas ou usuário desativado:
  ```json
  { "error": "Email ou senha incorretos" }
  ```

- **400** – Dados inválidos (validação):
  ```json
  {
    "error": "Dados inválidos",
    "details": [
      { "field": "email", "message": "Email inválido" },
      { "field": "password", "message": "Senha deve ter no mínimo 6 caracteres" }
    ]
  }
  ```

### 2.2 Usar o token nas requisições de excursão

Em **toda** requisição de criação ou atualização de excursão, o cliente deve enviar:

```
Authorization: Bearer {token}
```

Exemplo:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Se o token não for enviado, for inválido ou expirado, a API responde **401** (Não autorizado). O token tem validade definida pelo servidor (ex.: 7 dias); após expirar, é necessário fazer login novamente.

---

## 3. Criar excursão (POST)

**Requisição**

```
POST https://avoarturismo.up.railway.app/api/excursoes
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (JSON)**

| Campo | Tipo | Obrigatório | Regras / Observações |
|-------|------|-------------|----------------------|
| `titulo` | string | **Sim** | Mín. 3, máx. 200 caracteres |
| `subtitulo` | string | Não | Máx. 500 caracteres. Pode ser `null`. |
| `preco` | number | **Sim** | Deve ser > 0 |
| `duracao` | string | Não | Máx. 100 caracteres. Ex.: "Meio período", "1 dia". Pode ser `null`. |
| `categoria` | string | **Sim** | Não pode ser vazio |
| `status` | string | Não | `"ATIVO"` ou `"INATIVO"`. Default: `"ATIVO"`. |
| `imagemCapa` | string | Não | URL da imagem de capa. Pode ser `null`. |
| `imagemPrincipal` | string | Não | URL da imagem principal. Pode ser `null`. |
| `descricao` | string | Não | Texto/HTML. Pode ser `null`. |
| `inclusos` | string | Não | Texto (ex.: itens inclusos). Pode ser `null`. |
| `recomendacoes` | string | Não | Texto. Pode ser `null`. |
| `local` | string | Não | Máx. 200 caracteres. Pode ser `null`. |
| `horario` | string | Não | Máx. 100 caracteres. Pode ser `null`. |
| `tags` | string[] | Não | Array de strings. Default: `[]`. |
| `galeria` | string[] | Não | Array de URLs de imagens (ordem = índice). Default: `[]`. |

**Exemplo de body mínimo (apenas obrigatórios)**

```json
{
  "titulo": "Passeio de barco - Ilha Grande",
  "preco": 150.00,
  "categoria": "natureza"
}
```

**Exemplo de body completo**

```json
{
  "titulo": "Passeio de barco - Ilha Grande",
  "subtitulo": "Conheça as praias e trilhas da ilha",
  "preco": 150.00,
  "duracao": "Dia inteiro",
  "categoria": "natureza",
  "status": "ATIVO",
  "imagemCapa": "https://exemplo.com/capa.jpg",
  "imagemPrincipal": "https://exemplo.com/principal.jpg",
  "descricao": "<p>Descrição detalhada do passeio.</p>",
  "inclusos": "Barco, guia, almoço",
  "recomendacoes": "Protetor solar, roupa de banho",
  "local": "Angra dos Reis - RJ",
  "horario": "08h às 17h",
  "tags": ["praia", "trilha", "barco"],
  "galeria": [
    "https://exemplo.com/foto1.jpg",
    "https://exemplo.com/foto2.jpg"
  ]
}
```

**Resposta de sucesso (201 Created)**

```json
{
  "success": true,
  "message": "Excursão criada com sucesso",
  "data": {
    "id": "uuid-da-excursao",
    "titulo": "Passeio de barco - Ilha Grande",
    "slug": "passeio-de-barco-ilha-grande",
    "subtitulo": "Conheça as praias e trilhas da ilha",
    "preco": 150,
    "duracao": "Dia inteiro",
    "categoria": "natureza",
    "status": "ATIVO",
    "imagemCapa": "https://exemplo.com/capa.jpg",
    "imagemPrincipal": "https://exemplo.com/principal.jpg",
    "descricao": "<p>Descrição detalhada do passeio.</p>",
    "inclusos": "Barco, guia, almoço",
    "recomendacoes": "Protetor solar, roupa de banho",
    "local": "Angra dos Reis - RJ",
    "horario": "08h às 17h",
    "tags": ["praia", "trilha", "barco"],
    "authorId": "uuid-do-usuario",
    "createdAt": "2025-01-31T12:00:00.000Z",
    "updatedAt": "2025-01-31T12:00:00.000Z",
    "galeria": [
      { "id": "uuid-1", "url": "https://exemplo.com/foto1.jpg", "ordem": 0 },
      { "id": "uuid-2", "url": "https://exemplo.com/foto2.jpg", "ordem": 1 }
    ]
  }
}
```

O **slug** é gerado automaticamente a partir do título (URL amigável, único). Não é enviado no body.

**Respostas de erro**

- **401** – Token ausente ou inválido:
  ```json
  { "error": "Token não fornecido" }
  ```
  ou `"Formato de token inválido"`, `"Token expirado"`, `"Token inválido"`, `"Usuário não encontrado ou inativo"`.

- **400** – Validação do body (Zod):
  ```json
  {
    "error": "Dados inválidos",
    "details": [
      { "field": "titulo", "message": "Título deve ter no mínimo 3 caracteres" },
      { "field": "preco", "message": "Preço deve ser maior que zero" }
    ]
  }
  ```

- **429** – Rate limit:
  ```json
  { "error": "Muitas requisições. Tente novamente em 15 minutos." }
  ```

---

## 4. Atualizar excursão (PUT)

**Requisição**

```
PUT https://avoarturismo.up.railway.app/api/excursoes/{id}
Content-Type: application/json
Authorization: Bearer {token}
```

- `{id}`: UUID da excursão (retornado na criação ou em listagem).

**Body (JSON)**

Os mesmos campos da criação, todos **opcionais**. Apenas os campos enviados são atualizados. Se o `titulo` for alterado, um novo **slug** é gerado automaticamente.

Para **galeria**: enviar o array completo; a galeria antiga é substituída pela nova (ordem = índice do array).

**Exemplo (atualização parcial)**

```json
{
  "preco": 180.00,
  "status": "ATIVO",
  "duracao": "Dia inteiro (8h às 18h)"
}
```

**Resposta de sucesso (200)**

```json
{
  "success": true,
  "message": "Excursão atualizada com sucesso",
  "data": { ... }
}
```

`data` é o objeto da excursão atualizado (incluindo `galeria`).

**Respostas de erro**

- **401** – Mesmo critério do POST.
- **400** – Validação (mesmo formato de `details` por campo).
- **404** – Excursão não encontrada:
  ```json
  { "error": "Excursão não encontrada" }
  ```

---

## 5. Alterar apenas o status (PATCH)

**Requisição**

```
PATCH https://avoarturismo.up.railway.app/api/excursoes/{id}/status
Content-Type: application/json
Authorization: Bearer {token}
```

**Body**

```json
{
  "status": "ATIVO"
}
```

ou `"INATIVO"`. Qualquer outro valor retorna **400** com mensagem de status inválido.

---

## 6. Resumo para implementação

1. **Base URL (produção no Railway)**  
   Use sempre: `https://avoarturismo.up.railway.app`.  
   Todas as rotas de envio de excursão ficam nesse domínio (não use localhost).

2. **Login**  
   `POST https://avoarturismo.up.railway.app/api/auth/login` com `{ "email", "password" }` e guardar `data.token`.

3. **Headers em todas as requisições de excursão**  
   - `Content-Type: application/json`  
   - `Authorization: Bearer {token}`  

4. **Criar excursão**  
   `POST https://avoarturismo.up.railway.app/api/excursoes` com body conforme tabela e exemplos (mínimo: `titulo`, `preco`, `categoria`).

5. **Atualizar excursão**  
   `PUT https://avoarturismo.up.railway.app/api/excursoes/{id}` com body parcial ou completo.

6. **Tratamento de erros**  
   - **401**: renovar token (novo login).  
   - **400**: ler `details` e corrigir campos.  
   - **404**: verificar `id` no PUT/PATCH.  
   - **429**: respeitar rate limit e tentar de novo depois.

7. **Tipos**  
   - `preco`: número (não string).  
   - `tags`: array de strings.  
   - `galeria`: array de strings (URLs).  
   - Campos opcionais podem ser omitidos ou enviados como `null` conforme o schema.

---

**Referência:** Este documento reflete o comportamento da API em `api/src/routes/excursao.routes.ts` e `api/src/schemas/excursao.schema.ts`. A API em produção está no Railway; a variável `API_BASE_URL` do projeto aponta para `https://avoarturismo.up.railway.app`.
