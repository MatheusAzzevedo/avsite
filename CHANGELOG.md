# Changelog

## 2026-08-06 - feat: expiração de 2h do PIX com cancelamento da cobrança no PagHiper

### Arquivos Modificados
- `api/src/jobs/expirar-pix.job.ts` [Novo: regra de expiração e varredura automática de cobranças vencidas]
- `api/src/config/paghiper.ts` [Nova função `cancelarCobrancaPixPagHiper`]
- `api/src/routes/pagamento.routes.ts` [Gravação de `pixExpiraEm`, expiração sob demanda na consulta de status e cancelamento no gateway ao cancelar o pedido]
- `api/src/server.ts` [Início da varredura no boot]
- `api/prisma/schema.prisma` e `api/prisma/migration-add-pix-expira-em.sql` [Campo `pixExpiraEm` com índice]
- `api/public/cliente/js/pagamento.js` [Contagem regressiva passa a usar o prazo devolvido pelo servidor]
- `api/.env.example` e `api/RAILWAY-VARIABLES.md` [Documentada a variável `PIX_EXPIRACAO_MINUTOS`]

### Detalhes das Alterações
- **Prazo de 2h**: O PagHiper conta vencimento em dias (`days_due_date`), então não é possível emitir um PIX de 2 horas. A cobrança continua nascendo com 1 dia e passa a ser invalidada no gateway pelo nosso servidor ao fim do prazo, via `POST /invoice/cancel/`.
- **Independência do Navegador**: Antes o prazo existia apenas como temporizador na página — se o cliente fechasse a aba, nada expirava e o PIX seguia pagável. Uma varredura roda a cada 10 minutos no processo da API e trata os vencidos, com uma passada no boot para limpar o que venceu enquanto o serviço esteve fora.
- **Corrida com o Pagamento**: Antes de cancelar, o status é consultado no gateway. Se o pagamento entrou no limite do prazo, o pedido é confirmado como PAGO em vez de expirado — cancelar às cegas tiraria a vaga de quem já pagou. A mesma checagem foi aplicada ao botão de cancelar do cliente.
- **Falha Segura**: Se o cancelamento no gateway falhar, o pedido permanece pendente e é reprocessado na varredura seguinte. Marcá-lo como expirado sem confirmar o cancelamento deixaria uma cobrança pagável sem pedido correspondente.
- **Status EXPIRADO**: Pedidos vencidos passam a usar `EXPIRADO` em vez de `CANCELADO`, distinguindo prazo esgotado de desistência. O status já era suportado pelos painéis e libera a vaga da mesma forma.
- **Preservação do EXPIRADO** (encontrado em teste real): ao cancelar a cobrança no gateway, o PagHiper notifica de volta o nosso próprio cancelamento com status `canceled`. O webhook sobrescrevia `EXPIRADO` por `CANCELADO` segundos depois, apagando a distinção recém-criada. O mapeamento passa a preservar `EXPIRADO`.
- **Prazo Único**: `pixExpiraEm` é gravado no pedido e devolvido pela API; a contagem regressiva da tela deriva dele, eliminando a duplicação do prazo no JavaScript.

---

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



