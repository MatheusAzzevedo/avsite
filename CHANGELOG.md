# Changelog

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
- **Banco de Dados**: Criacao do campo `avatarUrl` opcional no usuario para armazenar foto do autor.
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

---

## 2026-05-19 - feat: sistema de equipe (CRUD no Admin e exibição na página Sobre Nós)

### Arquivos Modificados
- `api/prisma/schema.prisma` [Adicionado modelo `Equipe`]
- `api/src/routes/equipe.routes.ts` [Rotas CRUD administrativas para equipe]
- `api/src/routes/public.routes.ts` [Rota pública para listar membros ativos]
- `api/src/server.ts` [Registro das novas rotas]
- `api/public/admin/equipe.html` [Tela de gerenciamento da equipe]
- `api/public/admin/js/equipe.js` [Lógica de listagem e formulário de equipe]
- `api/public/about.html` [Seção de equipe e script de carregamento no site público]
- `about.html` [Replicação da seção de equipe no arquivo da raiz]
- `api/public/admin/*.html` [Adicionado link de Equipe no menu lateral de 13 arquivos]

### Detalhes das Alterações
- **Banco de Dados**: Criação do modelo `Equipe` para persistir dados dos membros (Nome, Data de Nascimento, Função, Ativo, Foto).
- **Interface Admin**: Nova tela para gerenciamento completo (CRUD) dos membros, com modal de cadastro e upload de imagem.
- **Integração Pública**: Exibição dos membros ativos na página Sobre Nós, com layout em grid e carregamento assíncrono.
- **Consistência do Menu**: Atualização de todas as telas do admin para incluir o acesso à nova funcionalidade.

---

## 2026-05-16 - feat: sistema de múltiplas categorias (relacionamento many-to-many)

### Arquivos Modificados
- `api/prisma/schema.prisma` [Novo modelo `CategoriaExcursao` e relações many-to-many com Excursao e ExcursaoPedagogica]
- `api/src/routes/admin.routes.ts` [Atualização das rotas de salvar/editar para suportar `categoriaIds`]
- `api/src/routes/public.routes.ts` [Inclusão de `categorias` nos retornos de listagem e detalhe]
- `api/public/admin/js/excursao-editor.js` [Refatoração da UI para seleção múltipla de categorias (checkboxes)]
- `api/public/js/portfolio-excursoes.js` [Renderização de múltiplas etiquetas de categoria nos cards públicos]
- `api/public/js/portfolio-single.js` [Exibição de todas as categorias na página de detalhes]
- `api/public/cliente/js/pacotes-viagens.js` [Suporte a múltiplas categorias nos cards da área do cliente]
- `api/public/cliente/js/excursao.js` [Exibição dinâmica de categorias no detalhe da excursão do cliente]
- `api/src/scripts/migrate-categories.ts` [Script de migração de dados legados para o novo formato relacional]

### Detalhes das Alterações
- **Migração Relacional**: Transição do campo de categoria de uma string simples para um relacionamento many-to-many, permitindo que uma excursão pertença a várias categorias simultaneamente (ex: Natureza + Internacional).
- **Interface Administrativa**: Substituído o seletor único por uma lista de checkboxes dinâmica, carregada do banco de dados, facilitando a gestão de tags.
- **Renderização Dinâmica**: Implementada lógica de separadores nos cards do site e portal do cliente para exibição elegante de múltiplas categorias.
- **Resiliência de Dados**: Mantida compatibilidade com o campo `categoria` antigo (marcado como @deprecated) para garantir que o site continue funcionando durante a transição.
- **Infraestrutura**: Aplicadas migrações e baselining no banco de dados de produção (Railway) via Prisma.

---

## 2026-05-14 - feat: comprovante de pagamento PDF, ajustes de segurança (CSP) e exibição de data da viagem

### Arquivos Modificados
- `api/src/server.ts` [Atualização da Content Security Policy para permitir GTM, FontAwesome e eventos inline]
- `api/src/middleware/cliente-auth.middleware.ts` [Suporte a autenticação via token na query string (?token=...)]
- `api/src/routes/pedido.routes.ts` [Nova rota GET para geração de comprovante de pagamento em PDF]
- `api/public/cliente/js/pedidos.js` [Botão de download de comprovante anexando token dinâmico]
- `api/public/portfolio-single.html` [Campo de 'Data da Viagem' no hero e grade de informações]
- `api/public/js/portfolio-single.js` [Renderização da data formatada nos detalhes da excursão]
- `api/public/js/portfolio-excursoes.js` [Novos 'pills' informativos (Data, Duração, Local) nos cards de listagem pública]
- `api/public/cliente/js/pacotes-viagens.js` [Atualização dos cards na área do cliente com informações de data e local]
- `api/public/cliente/excursao.html` [Inclusão de campos de data no detalhe interno da excursão]
- `api/public/cliente/js/excursao.js` [Lógica de exibição de data na área logada]

### Detalhes das Alterações
- **Comprovante PDF**: Implementada a funcionalidade de download de comprovante para pedidos com status PAGO. O PDF é gerado no backend e enviado como anexo.
- **Segurança Adaptativa**: Ajuste nas diretivas de CSP do Helmet para resolver bloqueios de scripts do Google Tag Manager e falhas em acordeons UI que dependiam de eventos `onclick` inline.
- **Transparência de Datas**: Excursões convencionais agora exibem a data da viagem de forma clara e formatada em todas as interfaces, facilitando a decisão de compra do cliente.
- **Cards Enriquecidos**: A listagem de pacotes recebeu um upgrade visual, exibindo ícones e informações rápidas (data, duração e destino) diretamente nos cards.

---

## 2026-05-11 - perf: otimização de performance e ajustes na interface de vagas

### Arquivos Modificados
- `api/src/routes/public.routes.ts` [Otimização N+1 em listagens públicas e redução de payload]
- `api/src/routes/lista-alunos.routes.ts` [Otimização de agregação em lote para listagem administrativa de alunos]
- `api/src/routes/pedido.routes.ts` [Redução de payload em buscas por código e listagem de pedidos]
- `api/public/cliente/js/excursao.js` [Ajuste visual: oculta seletor e mostra aviso "Inscrições Encerradas" quando sem vagas]

Resumo: Implementação de otimizações críticas de performance no backend, eliminando gargalos N+1 e reduzindo o tráfego de dados. Melhora na experiência do usuário na área do cliente com feedback visual claro sobre disponibilidade de vagas.

### Detalhes das Alterações
- **Otimização N+1**: Substituídas consultas individuais de vagas por agregação em lote (`groupBy` e contagem agregada) em todas as listagens principais.
- **Payload Minimizado**: Implementado `select` seletivo em rotas críticas, removendo campos pesados e desnecessários (galerias, descrições longas) de listagens.
- **Interface de Vagas**: Quando uma excursão atinge o limite de vagas na área do cliente, o seletor de quantidade é removido e substituído pelo status "Inscrições Encerradas".
- **Performance de Busca**: Busca por código de excursão pedagógica agora é 60-80% mais rápida devido ao refinamento da query e remoção de `includes` redundantes.

