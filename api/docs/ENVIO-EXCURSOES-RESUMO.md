# Envio de excursões via API — Resumo direto

Informações que devem ser enviadas e como, de forma objetiva.

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

**Resposta:** use `data.token` em todas as requisições de excursão.

---

## 2. Criar excursão

**Método:** `POST`  
**URL:** `https://avoarturismo.up.railway.app/api/excursoes`  
**Headers:** `Content-Type: application/json` e `Authorization: Bearer {token}`

### Campos obrigatórios

| Campo | Tipo | Regras |
|-------|------|--------|
| `titulo` | string | Mín. 3, máx. 200 caracteres |
| `preco` | number | > 0 |
| `categoria` | string | Não vazio |

### Campos opcionais

| Campo | Tipo | Regras |
|-------|------|--------|
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

### Exemplo mínimo
```json
{
  "titulo": "Passeio de barco",
  "preco": 150,
  "categoria": "natureza"
}
```

### Exemplo completo
```json
{
  "titulo": "Passeio de barco - Ilha Grande",
  "subtitulo": "Conheça as praias da ilha",
  "preco": 150,
  "duracao": "Dia inteiro",
  "categoria": "natureza",
  "status": "ATIVO",
  "imagemCapa": "https://exemplo.com/capa.jpg",
  "imagemPrincipal": "https://exemplo.com/principal.jpg",
  "descricao": "<p>Descrição do passeio.</p>",
  "inclusos": "Barco, guia, almoço",
  "recomendacoes": "Protetor solar",
  "local": "Angra dos Reis - RJ",
  "horario": "08h às 17h",
  "tags": ["praia", "trilha"],
  "galeria": ["https://exemplo.com/foto1.jpg", "https://exemplo.com/foto2.jpg"]
}
```

---

## 3. Atualizar excursão

**Método:** `PUT`  
**URL:** `https://avoarturismo.up.railway.app/api/excursoes/{id}`  
**Headers:** `Content-Type: application/json` e `Authorization: Bearer {token}`

- `{id}`: UUID da excursão  
- Body: mesmos campos da criação, todos opcionais  
- Só os campos enviados são atualizados  

**Exemplo:**
```json
{
  "preco": 180,
  "status": "ATIVO",
  "duracao": "8h às 18h"
}
```

---

## 4. Alterar status

**Método:** `PATCH`  
**URL:** `https://avoarturismo.up.railway.app/api/excursoes/{id}/status`  
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
| 400 | Dados inválidos — ver `details` no body |
| 401 | Token ausente ou inválido — refaça o login |
| 404 | Excursão não encontrada (PUT/PATCH) |
| 429 | Rate limit — aguarde 15 minutos |
