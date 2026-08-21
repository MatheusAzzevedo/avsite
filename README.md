# Avorar Turismo - Sistema Completo

Sistema de site e administração para Avorar Turismo com backend em Node.js/Express, banco de dados PostgreSQL e frontend em HTML/CSS/JavaScript.

## Arquivos Modificados [Resumo das Atualizações]

### Última atualização (2026-08-20) - feat: migrar as fotos de Autores do Base64 para o Cloudflare R2
- **api/public/admin/js/autores.js** [Foto enviada ao R2 em vez de Base64]

Resumo: Segundo domínio migrado, com o mesmo padrão da Equipe. A foto do autor vai para o R2 e o campo guarda só a URL; o salvamento não mudou. Removido o teto local de 5 MB, mais apertado que o do servidor. Descoberto no caminho que não existe `autores.html`: o `autores.js` é carregado por `blog.html`, onde o formulário de autor é um modal. Foto de 286 KB virou 32 KB, e os cards do blog renderizam o avatar vindo do R2. As capas dos posts seguem em Base64 e serão tratadas na fase 5.

### Atualização anterior (2026-08-19) - feat: migrar as fotos da Equipe do Base64 para o Cloudflare R2
- **api/public/admin/js/equipe.js** [Foto enviada ao R2 em vez de Base64]
- **api/src/scripts/migrar-imagens-r2.ts** [Novo: migração do acervo com simulação e verificação]
- **api/package.json** [Script `npm run migrar:imagens`]

Resumo: Primeiro domínio migrado. A tela de Equipe passa a enviar a foto ao R2 e gravar só a URL; o salvamento não mudou, pois já lia o mesmo campo. O teto local de 5 MB foi removido — era mais apertado que o do servidor e levava o usuário a comprimir a foto por fora. O script de migração é idempotente e verifica cada imagem lendo-a de volta pela URL pública antes de atualizar o banco; falhas mantêm o Base64 intacto para nova tentativa, e sem `--aplicar` ele apenas simula. Resultado: foto de 286 KB virou 32 KB, e a resposta de `/api/public/equipe` caiu de ~292 KB para 235 bytes.

### Atualização anterior (2026-08-19) - feat: helper compartilhado de upload no painel administrativo
- **api/public/admin/js/admin-main.js** [Novo objeto `UploadArquivo`: envio, validação, progresso e preenchimento de campo]

Resumo: Base para migrar as telas do admin do Base64 para o R2. Centraliza envio, validação e tratamento de erro, que hoje estariam repetidos em cinco telas. Usa XMLHttpRequest porque `fetch` não reporta progresso, e fotos originais passam de 20 MB. O `preencherCampo` reproduz a interface do padrão antigo, gravando a URL no lugar do Base64, com prévia local imediata e limpeza em caso de falha. Mora no `admin-main.js`, já carregado por todas as telas, então nenhum HTML mudou. Validado em navegador real: PNG de 2.606 KB virou 22 KB, com progresso, nome acentuado íntegro, erros claros para arquivo grande e formato inválido, e a imagem do R2 carregando sob a CSP.

### Atualização anterior (2026-08-19) - fix: restaurar o download de documentos após a migração para o R2
- **api/src/routes/documentos.routes.ts** [Atende disco e R2]
- **api/src/config/r2.ts** [`Content-Disposition` no objeto e `verificarConfigR2`]
- **api/src/routes/upload.routes.ts** [Correção da codificação do nome de arquivo]

Resumo: O upload de documento já ia para o R2, mas o download continuava procurando em disco — todo arquivo novo dava 404 para o cliente. A rota passa a servir do disco quando existe e redirecionar para o R2 caso contrário, sem mudança no frontend. Para o PDF continuar baixando em vez de abrir no navegador, o `Content-Disposition` é gravado no próprio objeto. O teste revelou ainda que o multer entrega o nome do arquivo em latin1, corrompendo acentos no cabeçalho e no banco; corrigido nos três pontos de upload.

### Atualização anterior (2026-08-17) - fix: eliminar perda de qualidade no processamento de imagens
- **api/src/routes/upload.routes.ts** [Redimensionamento, perfil de cor, orientação EXIF e erro legível de tamanho]
- **api/scripts/optimize-images.js** [Deixou de sobrescrever os originais]
- **api/.env.example** [`IMAGEM_DIMENSAO_MAXIMA`, `IMAGEM_QUALIDADE` e novo `MAX_FILE_SIZE`]

Resumo: A perda de qualidade relatada não vinha do upload — o admin guarda os bytes originais. Vinha do `optimize-images.js`, que substituía os arquivos no lugar e, por só comparar tamanho, regravava a cada execução, degradando de novo. Uma passada de verificação economizou 0,4%, trocando qualidade real por quase nada. O script passou a gravar em pasta paralela. Na rota de upload, o ganho de peso passou a vir do redimensionamento (1920px) e não da compressão: uma foto de 7990x5327 saía com 11,6 MB e agora sai com 299 KB, com qualidade 90. O perfil de cor deixou de ser descartado, a orientação do EXIF é aplicada, e o limite subiu de 10 MB para 25 MB — o limite apertado empurrava o usuário a comprimir por fora, que era outra fonte de degradação.

### Atualização anterior (2026-08-17) - feat: fundação do Cloudflare R2 para armazenamento de imagens
- **api/src/server.ts** [Origem do R2 liberada no `img-src` da CSP, derivada de `R2_PUBLIC_URL`]
- **api/src/scripts/test-r2.ts** [Script de diagnóstico movido e reescrito com verificação de leitura pública]
- **api/src/routes/upload.routes.ts** [Log da causa real na falha de exclusão no R2]
- **api/package.json** [Script `npm run test:r2`]

Resumo: Primeira etapa da migração de imagens para o Cloudflare R2. A CSP não liberava o domínio do R2, o que faria o navegador bloquear toda imagem vinda de lá — sem erro no backend e sem nada nos logs. A origem passa a ser derivada da variável de ambiente. O script de diagnóstico não compilava por estar fora de `rootDir` e foi movido para `src/scripts/`; além disso ele apagava o arquivo antes de conferir a leitura pública, mascarando um bucket fechado. Ciclo completo validado contra o bucket real: upload pela API, conversão para WebP, leitura pública e exclusão.

### Atualização anterior (2026-08-06) - feat: expiração de 2h do PIX com cancelamento da cobrança no PagHiper
- **api/src/jobs/expirar-pix.job.ts** [Novo: regra de expiração e varredura automática]
- **api/src/config/paghiper.ts** [Nova função de cancelamento da cobrança]
- **api/src/routes/pagamento.routes.ts** [Gravação do prazo, expiração sob demanda e cancelamento no gateway]
- **api/prisma/schema.prisma** [Campo `pixExpiraEm` com índice]
- **api/public/cliente/js/pagamento.js** [Contagem regressiva usa o prazo do servidor]

Resumo: O PIX passa a valer 2 horas. Como o PagHiper só aceita vencimento em dias, a cobrança nasce com 1 dia e é invalidada no gateway pelo nosso servidor ao fim do prazo. Antes o prazo era só um temporizador na página: fechando a aba, nada expirava e o PIX seguia pagável. Agora uma varredura roda a cada 10 minutos, com uma passada no boot. Antes de cancelar, o status é consultado — se o pagamento entrou no limite, o pedido é confirmado em vez de expirado. Validado em teste real ponta a ponta: pagamento confirmado via webhook em 3 minutos e expiração cancelando a cobrança no gateway. O teste revelou que o PagHiper notifica de volta o nosso próprio cancelamento, o que sobrescrevia `EXPIRADO` por `CANCELADO`; o mapeamento foi corrigido.

### Atualização anterior (2026-08-06) - feat: ativar webhook de confirmação de pagamento PIX do PagHiper
- **api/src/config/paghiper.ts** [Envio de `notification_url` na criação da cobrança]
- **api/src/routes/webhook.routes.ts** [Conferência de apiKey, códigos HTTP por tipo de falha e logs de idempotência]
- **api/src/server.ts** [Rate limit próprio para `/api/webhooks/`]
- **api/.env.example**, **api/RAILWAY-VARIABLES.md** [Documentada a variável `PAGHIPER_NOTIFICATION_URL`]

Resumo: O PagHiper só notifica a URL enviada na criação da cobrança — não há cadastro no painel. Como ela nunca era enviada, o webhook jamais era chamado e o pedido só se confirmava enquanto o cliente mantivesse a página aberta. A URL passa a ser derivada de `API_BASE_URL` (com override por `PAGHIPER_NOTIFICATION_URL`) e endereços locais são omitidos com aviso, já que o gateway não alcança `localhost`. O handler passou a responder 500 em falhas transitórias, para que o PagHiper reenvie em vez de dar o pagamento como processado. Os webhooks ganharam rate limit próprio, evitando 429 em lotes de confirmação.

### Atualização anterior (2026-08-06) - fix: corrigir endpoints e parse da integração PIX do PagHiper
- **api/src/config/paghiper.ts** [Endpoints migrados para o host de PIX, parse da resposta corrigido, timeout de 20s e logs de diagnóstico]
- **api/src/routes/pagamento.routes.ts** [Comentários atualizados: PIX no PagHiper, cartão no Asaas]
- **api/tsconfig.json** [Adicionada lib `ES2022.Error`]

Resumo: A integração PIX apontava para a API de boleto (`api.paghiper.com/transaction/*`) e lia a resposta em campos que não existem no PIX (`bank_slip`), o que impedia qualquer cobrança de ser gerada. Endpoints migrados para `pix.paghiper.com/invoice/*` e leitura ajustada para `pix_create_request.pix_code.emv`. Removido o campo `type_bank_slip` (exclusivo de boleto) e adicionados timeout, extração da mensagem de erro real do gateway e log da resposta bruta em caso de formato inesperado. O QR Code passa a vir pronto do PagHiper. Pagamentos por cartão permanecem no Asaas.

### Última atualização (2026-06-20) - feat: adição manual de alunos via painel administrativo
- **api/public/admin/listas.html** [Adicionado botão "Adicionar Aluno" e modal de formulário completo]
- **api/public/admin/js/listas.js** [Implementada lógica de abertura/fechamento do modal, submissão do formulário e recarregamento da tabela]

Resumo: Adicionado o botão "Adicionar Aluno" e um modal de formulário no painel de administração de listas. O formulário envia informações detalhadas do aluno e do responsável financeiro para o backend para criar automaticamente o registro de cliente e pedido associados à excursão.


### Última atualização (2026-05-29) - fix: refatoração de uploads e remoção de perfil
- **api/public/admin/js/equipe.js** [Substituído upload físico por conversão para Base64 local]
- **api/public/admin/autores.html** e **autores.js** [Criado CRUD mock para gestão de Autores]
- **api/public/admin/perfil.html** e **perfil.js** [Funcionalidade "Meu Perfil" apagada]
- **api/prisma/schema.prisma** [Remoção do campo `avatarUrl`]

Resumo: Correção estrutural na rotina de upload de imagens da Equipe, substituindo o envio de arquivos físicos (efêmeros no Docker) por salvamento direto no banco de dados PostgreSQL via string Base64. Adicionalmente, a área "Meu Perfil" foi completamente removida do painel e APIs a pedido do cliente, e uma nova interface de demonstração (mock) para gestão de Autores foi criada.

### Última atualização (2026-05-28) - feat: cards de blog responsivos e página de perfil
- **api/prisma/schema.prisma** [Adicionada propriedade `avatarUrl` ao modelo `User`]
- **api/src/routes/public.routes.ts** [Incluído `avatarUrl` na consulta pública de posts]
- **api/public/js/blog-public.js** [Lógica dinâmica para renderizar avatar ou iniciais no card do post]
- **api/public/css/style.css** [Novos estilos customizados para os cards de blog e arredondamento de elementos]
- **api/public/admin/perfil.html** [Criada nova tela para edição de perfil do usuário (avatar, nome, senha)]
- **api/public/admin/js/perfil.js** [Integração de formulários de perfil com a API e upload de foto]
- **api/src/routes/auth.routes.ts** [Incluído update de `avatarUrl` na rota PUT `/auth/me`]
- **api/public/admin/*.html** [Adicionado link para Meu Perfil em todos os menus laterais]

Resumo: Implementação de um design moderno para a listagem pública de posts do blog, com inclusão das fotos de perfil dos autores. Para sustentar essa alteração, foi modificada a modelagem do banco (Prisma), as rotas da API pública, e desenvolvida uma interface "Meu Perfil" no painel administrativo para os usuários realizarem o upload de seu próprio avatar.

### Atualização anterior (2026-05-20) - fix: reverter múltiplas categorias em excursões pedagógicas
- **api/docker-compose.yml** [Renomeado container de banco de dados para `avoar_postgres_db`]
- **api/prisma/schema.prisma** [Removido relacionamento many-to-many em excursões pedagógicas, mantendo categoria única]
- **api/src/schemas/excursao-pedagogica.schema.ts** [Removido campo `categoriaIds` e tornado `categoria` obrigatório]
- **api/src/routes/excursao-pedagogica.routes.ts** [Removida manipulação de `categorias` nas rotas do CRUD do admin]
- **api/src/routes/public.routes.ts** [Removido select/include de `categorias` nas rotas públicas]
- **api/public/admin/excursao-pedagogica-editor.html** [Restaurado dropdown select de categoria única]
- **api/public/admin/js/excursao-pedagogica-editor.js** [Ajustada a lógica e validações para categoria única e adicionada documentação]

Resumo: Remoção completa do sistema de múltiplas categorias das excursões pedagógicas para mantê-lo exclusivamente nas excursões convencionais. Revertido banco de dados, APIs, validações e interface administrativa de edição para o uso de categoria única (string simples), além de renomear o container Docker do banco de dados para `avoar_postgres_db` e documentar as funções do editor no admin.

### Atualização anterior (2026-05-19) - feat: sistema de equipe (CRUD no Admin e exibição na página Sobre Nós)
- **api/prisma/schema.prisma** [Adicionado modelo `Equipe`]
- **api/src/routes/equipe.routes.ts** [Rotas CRUD equipe]
- **api/public/admin/equipe.html** [Tela de gerenciamento da equipe]
- **api/public/about.html** [Exibição da equipe no site público]

Resumo: Implementação completa da funcionalidade de Equipe. Criado modelo no banco de dados, rotas de API (admin e pública) e interface no painel administrativo para cadastrar, editar e excluir membros da equipe. A página "Sobre Nós" foi atualizada para exibir os membros ativos em um grid dinâmico. O link para a tela de Equipe foi adicionado ao menu lateral de todas as páginas administrativas para consistência.

### Atualização anterior (2026-05-16) - feat: sistema de múltiplas categorias (muito-para-muitos)
- **api/prisma/schema.prisma** [Transição para relacionamento many-to-many em categorias]
- **api/src/routes/admin.routes.ts** [Logica de persistência de múltiplas categorias]
- **api/public/admin/js/excursao-editor.js** [Interface de checkboxes para seleção múltipla]
- **api/public/js/portfolio-excursoes.js** [Renderização de múltiplas tags nos cards do site]
- **api/public/cliente/js/pacotes-viagens.js** [Suporte a categorias múltiplas no portal do cliente]

Resumo: Migração completa do sistema de categorias de um campo de texto fixo para um relacionamento relacional flexível. Agora uma excursão pode pertencer a múltiplas categorias simultaneamente. A interface administrativa foi atualizada para seleção via checkboxes e o frontend agora exibe todas as etiquetas associadas de forma dinâmica e elegante.

### Atualização anterior (2026-05-14) - feat: comprovante de pagamento PDF, segurança (CSP) e interface de datas
- **api/src/routes/pedido.routes.ts** [Download de comprovante PDF para clientes]
- **api/src/server.ts** [Ajustes de CSP para scripts externos e eventos inline]
- **api/public/js/portfolio-excursoes.js** [Cards enriquecidos com Data, Duração e Local]
- **api/public/cliente/js/pacotes-viagens.js** [Exibição de data e destino na área do cliente]

Resumo: Implementada funcionalidade de download de comprovante em PDF para clientes logados. Ajustadas políticas de segurança (CSP) para habilitar o Google Tag Manager e corrigir falhas de UI em acordeons. Melhoria visual significativa em todas as listagens e detalhes de excursões, exibindo agora a data da viagem e localidade de forma clara.

### Atualização anterior (2026-05-11) - perf: otimização de performance e ajustes na interface de vagas
- **api/src/routes/public.routes.ts** [Otimização N+1 e redução de payload]
- **api/src/routes/lista-alunos.routes.ts** [Agregação em lote para performance]
- **api/public/cliente/js/excursao.js** [Interface de vagas esgotadas]

Resumo: Otimização crítica de performance no backend eliminando gargalos N+1 em listagens e busca. Ajuste na UX da área do cliente para exibir aviso de "Inscrições Encerradas" e remover seletor de quantidade quando não houver vagas.

### Atualização anterior (2026-05-09) - feat: dashboard de alunos, exportação escolar e CI/CD
- **api/src/routes/lista-alunos.routes.ts** [Estatísticas de pagamento e nova exportação escolar]
- **api/public/admin/js/listas.js** [Interface com novas labels e botão "Lista para Escola"]
- **.github/workflows/api-lint.yml** [Workflow de linter automático para API]

Resumo: Atualização visual e lógica dos cards de listagem de alunos, implementação de exportação personalizada para escolas (Excel) e Pipeline de CI para Linting. Introduzidas novas labels ("Limite de Vagas"), estatísticas de pagamento e exportação automática em formato escolar.

### Versão anterior (2026-05-07) - feat: sistema de limite de vagas (capacidade) em excursões
- **api/prisma/schema.prisma** [Novos campos `vagas` nos modelos de Excursão]
- **api/src/routes/pedido.routes.ts** [Validação de disponibilidade e bloqueio de overbooking]

Resumo: Implementado sistema de gestão de capacidade. É possível definir limite de vagas, com cálculo automático de disponibilidade em tempo real e bloqueio de novos pedidos se o limite for atingido.


