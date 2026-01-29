# API Avorar Turismo - Documentação

Esta documentação descreve as rotas públicas da API que podem ser usadas para integração com outros sistemas.

## URL Base

```
Desenvolvimento: http://localhost:3001/api
Produção: https://avorar-api.up.railway.app/api
```

## Autenticação

As rotas públicas (`/api/public/*`) não requerem autenticação.

Para rotas administrativas, inclua o header:
```
Authorization: Bearer <token>
```

---

## Rotas Públicas (Para Integração Externa)

### Excursões

#### Listar Excursões Ativas

```http
GET /api/public/excursoes
```

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| categoria | string | Filtrar por categoria (natureza, cultura, aventura, marítimo) |
| limit | number | Quantidade de resultados (default: 20, max: 100) |
| page | number | Página para paginação (default: 1) |

**Exemplo de Requisição:**
```bash
curl "https://avorar-api.up.railway.app/api/public/excursoes?categoria=natureza&limit=10"
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "titulo": "Cachoeiras",
      "slug": "cachoeiras",
      "subtitulo": "Trilha até as mais belas quedas d'água da região",
      "preco": 120.00,
      "duracao": "5 horas",
      "categoria": "natureza",
      "imagemCapa": "/images/background/Queda de agua.webp",
      "imagemPrincipal": "/images/background/Queda de agua.webp",
      "local": "Centro de Angra dos Reis",
      "horario": "08:00 - 13:00",
      "tags": ["natureza", "aventura", "cachoeiras", "trilha"],
      "galeria": ["/uploads/img1.webp", "/uploads/img2.webp"],
      "createdAt": "2026-01-29T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

#### Buscar Excursão por Slug

```http
GET /api/public/excursoes/:slug
```

**Exemplo:**
```bash
curl "https://avorar-api.up.railway.app/api/public/excursoes/cachoeiras"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "titulo": "Cachoeiras",
    "slug": "cachoeiras",
    "subtitulo": "Trilha até as mais belas quedas d'água da região",
    "preco": 120.00,
    "duracao": "5 horas",
    "categoria": "natureza",
    "status": "ATIVO",
    "imagemCapa": "/images/background/Queda de agua.webp",
    "imagemPrincipal": "/images/background/Queda de agua.webp",
    "descricao": "<h2>Aventura nas Cachoeiras</h2>...",
    "inclusos": "- Guia especializado\n- Transporte...",
    "recomendacoes": "- Usar calçado de trilha...",
    "local": "Centro de Angra dos Reis",
    "horario": "08:00 - 13:00",
    "tags": ["natureza", "aventura", "cachoeiras", "trilha"],
    "galeria": ["/uploads/img1.webp"],
    "createdAt": "2026-01-29T10:00:00.000Z",
    "updatedAt": "2026-01-29T10:00:00.000Z"
  }
}
```

---

#### Listar por Categoria

```http
GET /api/public/excursoes/categoria/:categoria
```

**Categorias disponíveis:**
- `natureza`
- `cultura`
- `aventura`
- `marítimo`

---

### Posts do Blog

#### Listar Posts Publicados

```http
GET /api/public/posts
```

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| categoria | string | Filtrar por categoria |
| limit | number | Quantidade de resultados (default: 20) |
| page | number | Página para paginação (default: 1) |

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "titulo": "Explorando Angra dos Reis",
      "slug": "explorando-angra-dos-reis",
      "autor": "Administrador",
      "data": "2026-01-25T00:00:00.000Z",
      "categoria": "turismo",
      "imagemCapa": "/images/resource/news-1.jpg",
      "resumo": "Descubra as maravilhas naturais...",
      "tags": ["turismo", "aventura", "praias"]
    }
  ],
  "pagination": {...}
}
```

---

#### Buscar Post por Slug

```http
GET /api/public/posts/:slug
```

---

#### Posts Recentes

```http
GET /api/public/posts/recent/:limit
```

**Exemplo:**
```bash
curl "https://avorar-api.up.railway.app/api/public/posts/recent/5"
```

---

### Estatísticas

#### Estatísticas Públicas

```http
GET /api/public/stats
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "excursoes": 5,
    "posts": 3,
    "categorias": [
      { "nome": "natureza", "quantidade": 2 },
      { "nome": "cultura", "quantidade": 1 },
      { "nome": "marítimo", "quantidade": 2 }
    ]
  }
}
```

---

#### Listar Categorias

```http
GET /api/public/categorias
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    { "nome": "natureza", "slug": "natureza", "quantidade": 2 },
    { "nome": "cultura", "slug": "cultura", "quantidade": 1 }
  ]
}
```

---

## Estrutura dos Dados

### Excursão

```typescript
interface Excursao {
  id: string;           // UUID único
  titulo: string;       // Título da excursão
  slug: string;         // Slug para URL (único)
  subtitulo: string;    // Descrição curta
  preco: number;        // Preço em R$
  duracao: string;      // Ex: "4 horas"
  categoria: string;    // natureza, cultura, aventura, marítimo
  status: "ATIVO" | "INATIVO";
  imagemCapa: string;   // URL da imagem de capa
  imagemPrincipal: string; // URL da imagem principal
  descricao: string;    // Descrição completa (HTML)
  inclusos: string;     // O que está incluso (texto)
  recomendacoes: string; // Recomendações (texto)
  local: string;        // Local de saída
  horario: string;      // Horário (ex: "08:00 - 12:00")
  tags: string[];       // Tags para busca
  galeria: string[];    // URLs das imagens da galeria
  createdAt: string;    // Data de criação (ISO)
  updatedAt: string;    // Data de atualização (ISO)
}
```

### Post

```typescript
interface Post {
  id: string;
  titulo: string;
  slug: string;
  autor: string;
  data: string;         // Data de publicação (ISO)
  categoria: string;
  status: "PUBLICADO" | "RASCUNHO";
  imagemCapa: string;
  resumo: string;
  conteudo: string;     // Conteúdo completo (HTML)
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida (dados incorretos) |
| 401 | Não autorizado (token inválido/expirado) |
| 403 | Acesso negado |
| 404 | Recurso não encontrado |
| 429 | Muitas requisições (rate limit) |
| 500 | Erro interno do servidor |

---

## Exemplo de Integração

### JavaScript/Fetch

```javascript
// Buscar todas as excursões ativas
async function getExcursoes() {
  const response = await fetch('https://avorar-api.up.railway.app/api/public/excursoes');
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  throw new Error(data.error);
}

// Buscar excursão específica
async function getExcursao(slug) {
  const response = await fetch(`https://avorar-api.up.railway.app/api/public/excursoes/${slug}`);
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  }
  throw new Error(data.error);
}
```

### PHP

```php
<?php
// Buscar excursões
$response = file_get_contents('https://avorar-api.up.railway.app/api/public/excursoes');
$data = json_decode($response, true);

if ($data['success']) {
    foreach ($data['data'] as $excursao) {
        echo $excursao['titulo'] . ' - R$ ' . $excursao['preco'] . "\n";
    }
}
?>
```

### Python

```python
import requests

# Buscar excursões
response = requests.get('https://avorar-api.up.railway.app/api/public/excursoes')
data = response.json()

if data['success']:
    for excursao in data['data']:
        print(f"{excursao['titulo']} - R$ {excursao['preco']}")
```

---

## Rate Limiting

A API possui limite de 100 requisições por 15 minutos por IP.

---

## Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.

**Versão da API:** 1.0.0  
**Última atualização:** Janeiro 2026
