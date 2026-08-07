# Changelog

## 2026-08-06 - feat: ativar webhook de confirmação de pagamento PIX do PagHiper

### Arquivos Modificados
- `api/src/config/paghiper.ts` [Envio de `notification_url` na criação da cobrança e resolução da URL a partir do ambiente]
- `api/src/routes/webhook.routes.ts` [Conferência de apiKey, códigos HTTP por tipo de falha, logs de idempotência e de status sem mapeamento]
- `api/src/server.ts` [Rate limit próprio e mais alto para `/api/webhooks/`]
- `api/.env.example` e `api/RAILWAY-VARIABLES.md` [Documentada a variável `PAGHIPER_NOTIFICATION_URL`]

### Detalhes das Alterações
- **Ativação do Webhook**: O PagHiper só notifica a URL informada no corpo da requisição de criação da cobrança — não há cadastro no painel do gateway. Como a URL nunca era enviada, o endpoint `/api/webhooks/paghiper` jamais era chamado e o pedido só se confirmava enquanto o cliente mantivesse a página aberta. A URL passa a ser derivada de `API_BASE_URL`, com `PAGHIPER_NOTIFICATION_URL` como override.
- **Ambiente Local**: Endereços locais são detectados e omitidos, com aviso no log. O PagHiper não alcança `localhost`, e enviar a URL assim arriscaria a rejeição da cobrança em desenvolvimento.
- **Retentativas**: O handler respondia HTTP 200 mesmo em erro, o que encerrava as retentativas do gateway e perdia o pagamento. Agora responde 500 em falha transitória (gateway ou banco fora), 400 em payload malformado e 200 apenas quando não há o que reprocessar.
- **Segurança**: A `apiKey` recebida na notificação é conferida contra a nossa antes de acionar o gateway. A defesa principal continua sendo a revalidação do status na API do PagHiper, que impede confirmações forjadas.
- **Rate Limiting**: O limite global de 100 req/15min por IP cobria os webhooks e devolveria 429 a um lote de confirmações vindas do mesmo IP do gateway. Os webhooks passam a ter limite próprio de 500.

---

## 2026-08-06 - fix: corrigir endpoints e parse da integração PIX do PagHiper

### Arquivos Modificados
- `api/src/config/paghiper.ts` [Endpoints corrigidos para o host de PIX, parse da resposta ajustado, timeout e logs de diagnóstico]
- `api/src/routes/pagamento.routes.ts` [Comentários atualizados: PIX é PagHiper, cartão segue no Asaas]
- `api/tsconfig.json` [Adicionada lib `ES2022.Error` para suportar `Error` com `cause`]

### Detalhes das Alterações
- **Endpoints**: A integração apontava para `api.paghiper.com/transaction/*`, que é a API de boleto. O PIX usa host próprio: criação, status e notificação passaram para `pix.paghiper.com/invoice/{create,status,notification}/`.
- **Parse da Resposta**: A leitura era feita em `create_request.bank_slip.pix_code`, campos que não existem na resposta de PIX. Corrigido para `pix_create_request.pix_code.emv` (copia-e-cola) e `qrcode_base64` (imagem), com `pix_url` como link da fatura.
- **Payload**: Removido `type_bank_slip`, campo exclusivo de boleto. Valores numéricos passaram a ser enviados como string, conforme a documentação do gateway.
- **QR Code**: A imagem passa a vir pronta do PagHiper em `qrcode_base64`; a geração local com a lib `qrcode` virou apenas fallback.
- **Robustez**: Adicionado timeout de 20s nas chamadas HTTP, extração da mensagem de erro real do gateway (em vez de "Request failed with status code 4xx") e log da resposta bruta quando o formato vier fora do previsto.

---

## 2026-06-20 - feat: adição manual de alunos via painel administrativo

### Arquivos Modificados
- `api/public/admin/listas.html` [Adicionado botão "Adicionar Aluno" e modal de formulário completo]
- `api/public/admin/js/listas.js` [Implementada lógica de gerenciamento da modal e envio dos dados ao backend]

### Detalhes das Alterações
- **Botão e Modal Admin**: Adicionado o botão "Adicionar Aluno" na interface de gestão de alunos e o modal de formulário completo contendo os dados do aluno, dados do responsável financeiro (obrigatórios), informações médicas (opcionais) e o status desejado para o pedido.
- **Integração Backend**: Implementada a chamada assíncrona ao novo endpoint `POST /api/admin/listas/excursao/:id/aluno` em `listas.js`, manipulando e validando as entradas do formulário e recarregando os dados das tabelas de alunos e excursões automaticamente após o cadastro bem-sucedido.
## 2026-06-08 - feat: galeria de imagens nas postagens do blog

### Arquivos Modificados
- `api/prisma/schema.prisma` [Novo modelo `PostImagem` (url, ordem, FK cascade) e relação `galeria` no modelo `Post`]
- `api/prisma/migrations/20260608000000_add_post_galeria/` [Migration que cria a tabela `post_imagens`]
- `api/src/schemas/post.schema.ts` [Campo `galeria` (array de até 4 imagens) na validação de criação e atualização]
- `api/src/routes/post.routes.ts` [Criação/atualização da galeria aninhada e inclusão da galeria no GET por id]
- `api/src/routes/public.routes.ts` [Inclusão da galeria ordenada na consulta pública de post por slug]
- `api/public/admin/blog-editor.html` e `js/blog-editor.js` [Seção "Galeria de Imagens (até 4)" com upload múltiplo, preview, remoção e carregamento na edição]
- `blog-single.html` e `js/blog-single-public.js` [Widget "Galeria" na sidebar abaixo de "Posts Recentes", com lightbox/carrossel via Fancybox]

### Detalhes das Alterações
- **Banco de Dados**: Galeria armazenada em tabela própria (`post_imagens`) com `ordem` para sequência e exclusão em cascata ao remover o post, seguindo o padrão já usado nas Excursões.
- **Painel Administrativo**: O editor de posts ganhou uma seção de Galeria que aceita no máximo 4 imagens, com prévia em grade e botão de remover, reaproveitando o mesmo padrão de upload das demais áreas do sistema.
- **Frontend Público**: As imagens da galeria aparecem na sidebar do post; ao clicar, abrem ampliadas em um carrossel (setas e swipe) via Fancybox, funcionando tanto no desktop quanto no mobile.

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


