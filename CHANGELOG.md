# Changelog

## 2026-06-20 - feat: adição manual de alunos via painel administrativo

### Arquivos Modificados
- `api/public/admin/listas.html` [Adicionado botão "Adicionar Aluno" e modal de formulário completo]
- `api/public/admin/js/listas.js` [Implementada lógica de gerenciamento da modal e envio dos dados ao backend]

### Detalhes das Alterações
- **Botão e Modal Admin**: Adicionado o botão "Adicionar Aluno" na interface de gestão de alunos e o modal de formulário completo contendo os dados do aluno, dados do responsável financeiro (obrigatórios), informações médicas (opcionais) e o status desejado para o pedido.
- **Integração Backend**: Implementada a chamada assíncrona ao novo endpoint `POST /api/admin/listas/excursao/:id/aluno` em `listas.js`, manipulando e validando as entradas do formulário e recarregando os dados das tabelas de alunos e excursões automaticamente após o cadastro bem-sucedido.

---

## 2026-06-03 - feat: integração de posts do blog com CRUD de Autores e ajuste visual nos cards

### Arquivos Modificados
- `api/prisma/schema.prisma` [Substituído campo de texto de autor por relacionamento com o modelo `Autor`]
- `api/src/schemas/post.schema.ts` [Atualizada validação do autor para UUID]
- `api/src/routes/post.routes.ts` [Atualizadas rotas administrativas de post para salvar `autorId`]
- `api/src/routes/public.routes.ts` [Inclusão de dados completos do autor nas consultas públicas de posts]
- `api/public/admin/blog-editor.html` e `js/blog-editor.js` [Modificado campo de autor para um select dinâmico consumindo a API de Autores]
- `api/public/js/blog-public.js` e `api/public/js/blog-single-public.js` [Refatoração para puxar e exibir foto e nome baseados no relacionamento do banco]
- `api/public/css/style.css` [Ajustado tamanho da capa e customizada borda do avatar do autor no card do blog]

### Detalhes das Alterações
- **Banco de Dados**: Migração do campo estático de autor para um relacionamento oficial (`autorId`) com o CRUD de Autores recém-criado. 
- **Painel Administrativo**: O editor de posts agora lista todos os autores cadastrados em um `<select>`, tornando a seleção obrigatória e baseada em dados reais e dinâmicos da API.
- **Frontend Público**: O grid de publicações busca a imagem de perfil e o nome oficial de cada Autor diretamente da API. Caso o autor não tenha foto, ocorre um fallback exibindo as letras iniciais do nome.
- **Melhorias Visuais**: Inclusão de uma borda customizada ao redor do avatar do autor e aumento da altura da imagem de capa dos cards de 200px para 280px para dar mais destaque visual.

---

## 2026-05-29 - fix: refatoracao de uploads e remocao de perfil

### Arquivos Modificados
- `api/public/admin/js/equipe.js` [Upload de imagem em Base64 usando FileReader]
- `api/public/admin/autores.html` e `autores.js` [Criacao de CRUD mock para Autores]
- `api/public/admin/*.html` [Removido link "Meu Perfil" da barra lateral]
- `api/public/admin/perfil.html` e `perfil.js` [Arquivos excluidos]
- `api/src/routes/auth.routes.ts` [Removida logica de update de foto]
- `api/prisma/schema.prisma` [Removida coluna `avatarUrl` do modelo `User`]
- `api/public/js/blog-public.js` [Ajustado para sempre exibir as iniciais no avatar]

### Detalhes das Alteracoes
- **Refatoracao de Uploads**: Corrigido bug de imagens quebradas (404) na pagina de Equipe. O sistema passou a salvar as imagens como strings Base64 diretamente no banco de dados, em vez de depender do armazenamento efemero do Docker.
- **Remocao do Perfil**: A pedido do cliente, a funcionalidade recem-adicionada de "Meu Perfil" foi completamente removida do banco de dados, frontend e rotas da API.
- **Autores Mock**: Inicio do desenvolvimento de uma area de gestao de Autores na interface administrativa com funcionamento simulado (mock) no localStorage para aprovacao.

---

## 2026-05-28 - feat: cards de blog responsivos e pagina de perfil

### Arquivos Modificados
- `api/prisma/schema.prisma` [Adicionada propriedade `avatarUrl` ao modelo `User`]
- `api/src/routes/public.routes.ts` [Incluido `avatarUrl` na consulta de autores]
- `api/public/js/blog-public.js` [Logica dinamica para renderizar avatar ou iniciais no card do post]
- `api/public/css/style.css` [Novos estilos customizados para os cards de blog]
- `api/public/admin/perfil.html` [Criada nova tela para edicao de perfil do usuario]
- `api/public/admin/js/perfil.js` [Logica de upload de foto e integracao com API]
- `api/src/routes/auth.routes.ts` [Incluido update de `avatarUrl` na rota de perfil]
- `api/public/admin/*.html` [Link para Meu Perfil adicionado em todas as sidebars]

### Detalhes das Alteracoes
- **Banco de Dados**: Criacao del campo `avatarUrl` opcional no usuario para armazenar foto do autor.
- **Frontend Publico**: Redesign total dos cards de post, aplicando bordas arredondadas, posicionamento com sobreposicao para o avatar e estilo responsivo.
- **Area Administrativa**: Criacao da tela "Meu Perfil" para edicao dos dados do proprio usuario, incluindo funcionalidade de upload ou uso de URL direta para foto. O link foi adicionado uniformemente em toda a navegacao lateral.
- **Integracao Completa**: A pagina de blog publica consome as imagens direto do banco de dados, preenchendo automaticamente as letras iniciais do autor caso nao possua foto.

---

## 2026-05-20 - fix: reverter múltiplas categorias em excursões pedagógicas

### Arquivos Modificados
- `api/docker-compose.yml` [Renomeado container de banco de dados para `avoar_postgres_db`]
- `api/prisma/schema.prisma` [Removido relacionamento many-to-many em excursões pedagógicas, mantendo campo categoria como string simples]
- `api/src/schemas/excursao-pedagogica.schema.ts` [Removido campo `categoriaIds` e tornado `categoria` obrigatório]
- `api/src/routes/excursao-pedagogica.routes.ts` [Removida manipulação de `categorias` nas rotas do CRUD do admin]
- `api/src/routes/public.routes.ts` [Removido select/include de `categorias` nas rotas públicas]
- `api/src/scripts/migrate-categories.ts` [Removida etapa de migração de categorias para pedagógicas]
- `api/public/admin/excursao-pedagogica-editor.html` [Restaurado dropdown select de categoria única]
- `api/public/admin/js/excursao-pedagogica-editor.js` [Ajustada a lógica para categoria única e adicionada documentação padrão]

### Detalhes das Alterações
- **Remoção de Vínculos**: O relacionamento de múltiplas categorias foi restringido exclusivamente às excursões convencionais. As excursões pedagógicas voltaram ao modelo original de categoria única através de uma coluna simples no banco de dados.
- **Validação de Entrada**: O schema do Zod foi adaptado para validar a categoria como uma string simples e obrigatória na criação/atualização de pedagógicas.
- **Interface e Backend**: O painel administrativo do editor de excursão pedagógica foi revertido para exibir e submeter o campo select de categoria única, removendo os checkboxes do seletor múltiplo.
- **Docker**: Container do banco de dados PostgreSQL renomeado para `avoar_postgres_db` para melhor identificação.
- **Documentação de Código**: Implementada documentação padrão para todas as funções modificadas no JavaScript do editor.
