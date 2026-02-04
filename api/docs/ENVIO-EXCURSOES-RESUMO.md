# Envio de excursões via API — Resumo direto

API de integração para **Excursões Pedagógicas**. Outros sistemas devem usar apenas esta API para criar/atualizar excursões pedagógicas.

**Excursões normais** (gerais) são criadas e gerenciadas **exclusivamente pelo sistema avsite** (painel admin); não há endpoint de integração para elas.

---

## Base e headers

| Item | Valor |
|------|--------|
| **URL base** | `https://avoarturismo.up.railway.app` |
| **Headers obrigatórios** | `Content-Type: application/json` e `Authorization: Bearer {token}` |

---

## 1. Obter token (login)

**Método:** `POST`  
**URL:** `https://avoarturismo.up.railway.app/api/auth/login`

**Body JSON:**
```json
{
  "email": "seu-email@exemplo.com",
  "password": "sua-senha"
}
```

- `email`: obrigatório, e-mail válido  
- `password`: obrigatório, mínimo 6 caracteres  

**Resposta:** use `data.token` em todas as requisições de excursão pedagógica.

---

## 2. Criar excursão pedagógica

**Método:** `POST`  
**URL:** `https://avoarturismo.up.railway.app/api/excursoes-pedagogicas`  
**Headers:** `Content-Type: application/json` e `Authorization: Bearer {token}`

### Código: manual ou gerado

- **Manual (admin):** envie o campo `codigo`. Ele pode ser criado e editado no painel avsite.
- **Via API (outro sistema):** envie `destino` (nome do destino) e `dataDestino` (data no formato **YYYY-MM-DD**). O código será gerado automaticamente como **slug do destino + data**, por exemplo: `museu-de-ciencias-2025-03-15`. Se já existir, a API acrescenta sufixo numérico (`-2`, `-3`, …).

É obrigatório informar **ou** `codigo` **ou** (`destino` + `dataDestino`).

### Campos obrigatórios

| Campo | Tipo | Regras |
|-------|------|--------|
| `codigo` **ou** (`destino` + `dataDestino`) | — | Ver regra acima |
| `titulo` | string | Mín. 3, máx. 200 caracteres |
| `preco` | number | > 0 |
| `categoria` | string | Não vazio |

### Campos opcionais

| Campo | Tipo | Regras |
|-------|------|--------|
| `destino` | string | Nome do destino (usado com `dataDestino` para gerar o código) |
| `dataDestino` | string | Data no formato **YYYY-MM-DD** (usado com `destino` para gerar o código) |
| `subtitulo` | string | Máx. 500 caracteres |
| `duracao` | string | Máx. 100 caracteres |
| `status` | string | `"ATIVO"` ou `"INATIVO"` (default: ATIVO) |
| `imagemCapa` | string | URL da imagem |
| `imagemPrincipal` | string | URL da imagem |
| `descricao` | string | Texto/HTML |
| `inclusos` | string | Texto |
| `recomendacoes` | string | Texto |
| `local` | string | Máx. 200 caracteres |
| `horario` | string | Máx. 100 caracteres |
| `tags` | string[] | Array de strings |
| `galeria` | string[] | Array de URLs (ordem = índice) |

O `codigo` (manual ou gerado) deve ser **único**; se já existir, a API retorna 400.

### Exemplo mínimo (código manual)
```json
{
  "codigo": "PED-2025-01",
  "titulo": "Visita ao Museu de Ciências",
  "preco": 80,
  "categoria": "educacao"
}
```

### Exemplo mínimo (código gerado — uso por outro sistema)
```json
{
  "destino": "Museu de Ciências",
  "dataDestino": "2025-03-15",
  "titulo": "Visita ao Museu de Ciências",
  "preco": 80,
  "categoria": "educacao"
}
```
*(O código gerado será algo como `museu-de-ciencias-2025-03-15`.)*

### Exemplo completo (com destino e data para gerar código)
```json
{
  "destino": "Museu de Ciências",
  "dataDestino": "2025-03-15",
  "titulo": "Visita ao Museu de Ciências",
  "subtitulo": "Experiência educativa para escolas",
  "preco": 80,
  "duracao": "4 horas",
  "categoria": "educacao",
  "status": "ATIVO",
  "imagemCapa": "https://exemplo.com/capa.jpg",
  "imagemPrincipal": "https://exemplo.com/principal.jpg",
  "descricao": "<p>Descrição da excursão pedagógica.</p>",
  "inclusos": "Ingresso, guia, material",
  "recomendacoes": "Levar lanche",
  "local": "São Paulo - SP",
  "horario": "09h às 13h",
  "tags": ["museu", "ciencias"],
  "galeria": ["https://exemplo.com/foto1.jpg", "https://exemplo.com/foto2.jpg"]
}
```

---

## 3. Atualizar excursão pedagógica

**Método:** `PUT`  
**URL:** `https://avoarturismo.up.railway.app/api/excursoes-pedagogicas/{id}`  
**Headers:** `Content-Type: application/json` e `Authorization: Bearer {token}`

- `{id}`: UUID da excursão pedagógica  
- Body: mesmos campos da criação, todos opcionais  
- Só os campos enviados são atualizados  

**Exemplo:**
```json
{
  "preco": 90,
  "status": "ATIVO",
  "duracao": "8h às 12h"
}
```

---

## 4. Alterar status

**Método:** `PATCH`  
**URL:** `https://avoarturismo.up.railway.app/api/excursoes-pedagogicas/{id}/status`  
**Headers:** `Content-Type: application/json` e `Authorization: Bearer {token}`

**Body:**
```json
{
  "status": "ATIVO"
}
```
ou `"INATIVO"`.

---

## Códigos de resposta

| Código | Significado |
|--------|-------------|
| 200 | Sucesso (PUT/PATCH) |
| 201 | Criado (POST) |
| 400 | Dados inválidos ou código já em uso — ver `details`/mensagem no body |
| 401 | Token ausente ou inválido — refaça o login |
| 404 | Excursão pedagógica não encontrada (PUT/PATCH) |
| 429 | Rate limit — aguarde 15 minutos |
