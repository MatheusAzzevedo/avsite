# Changelog

## 2026-10-01 - fix: corrigir falha ao criar excursão convencional nova

### Arquivos Modificados
- `api/src/routes/excursao.routes.ts` [Deriva o campo legado `categoria` da primeira `categoriaId` marcada, quando ausente]

### Detalhes das Alterações
- **O problema**: Criar qualquer excursão convencional nova pela tela do admin quebrava com `Argument categoria is missing`. A tela só envia `categoriaIds` (o relacionamento muitos-para-muitos), mas o campo legado `categoria` (string, usado pelo filtro `?categoria=` antigo) continua `NOT NULL` no banco, sem default, e nada preenchia.
- **Por que não apareceu antes**: Todo teste anterior da integração Clicksign editava excursões já existentes (`Santuário do Caraça`, `Cristo Redentor`), e `update()` não exige os campos que já têm valor — só `create()` falhava. O bug é anterior a este trabalho, só nunca tinha sido exercitado.
- **A correção**: Quando `categoria` não vem no corpo e `categoriaIds` tem ao menos um item, busca o `slug` da primeira categoria marcada (`CategoriaExcursao.findUnique`) e usa como valor legado — mesmo formato (`cultura`, `natureza`, `marítimo`) que os registros antigos já têm.
- **Achado em produção**: Apareceu ao criar uma excursão de teste pra validar o webhook da Clicksign em `avoarturismo.up.railway.app`; corrigido e redeployado antes de prosseguir.

---

## 2026-09-30 - feat: integrar assinatura digital de contrato via Clicksign

### Arquivos Modificados
- `api/src/config/clicksign.ts` [Novo: cliente da API v3 da Clicksign — envelope, documento, signatário, requisitos, verificação HMAC do webhook]
- `api/src/routes/webhook.routes.ts` [Nova rota `POST /webhooks/clicksign`, valida `Content-Hmac` contra o corpo bruto]
- `api/src/routes/pedido.routes.ts` [Novas rotas `POST /:id/assinatura` e `/assinatura/confirmar`; trava o contrato após assinar]
- `api/src/jobs/expirar-assinatura.job.ts` [Novo: varredura que expira assinaturas pendentes vencidas]
- `api/src/server.ts` [Captura o corpo bruto da requisição (`rawBody`) para o HMAC; CSP libera os domínios da Clicksign]
- `api/public/cliente/js/pagamento.js`, `api/public/cliente/pagamento.html` [Monta o Widget Embedded no checkout, antes do pagamento]
- `api/public/admin/js/excursao-editor.js`, `excursao-pedagogica-editor.js` [Trava upload/remoção do contrato após a primeira assinatura]
- `api/prisma/schema.prisma` [Novos campos `contratoUrl`/`contratoNome`/`contratoTravado` e model `Assinatura`]

### Detalhes das Alterações
- **O fluxo**: O admin anexa o contrato em PDF na excursão (convencional ou pedagógica). No checkout, antes de liberar o pagamento, o cliente assina pelo Widget Embedded da Clicksign — o backend busca o PDF já publicado no R2 e cria o envelope na hora, nunca recebe upload direto do cliente.
- **Duas confirmações, não uma**: Síncrona, por polling (`/assinatura/confirmar`, chamada quando o widget dispara o evento `signed`) e assíncrona, pelo webhook (`sign`/`auto_close`) — o que importa primeiro vence. Nos testes, o webhook chegou antes do polling nas duas vezes.
- **Segurança do webhook**: `Content-Hmac: sha256=<hex>` conferido com `crypto.timingSafeEqual` contra HMAC-SHA256 do corpo bruto (capturado via `verify` do `express.json()`, antes do corpo ser reserializado). Sem `CLICKSIGN_WEBHOOK_SECRET` configurado, falha fechado (401) para toda requisição.
- **Trava depois de assinado**: `contratoTravado` desabilita upload e remoção do contrato na tela do admin, e o backend recusa a troca de qualquer forma — a defesa real está na API, a tela é só aviso.
- **Dois ajustes exigidos pela API da Clicksign, descobertos só ao testar de verdade**: `phone_number` precisa vir só com 10 ou 11 dígitos, sem máscara nem DDI (mandar o telefone cru formatado dá 400); e o script do Widget Embedded (`cdn-public-library.clicksign.com`) e o iframe de assinatura (`sandbox.clicksign.com`/`app.clicksign.com`) precisam estar liberados na CSP, senão o navegador bloqueia silenciosamente.
- **Bug de CSS do widget**: o container usava `min-height`, que não cria contexto de altura pra `height: 100%` do iframe resolver — ele caía pro padrão do navegador (~150px). Trocado para `height` fixo.
- **Validado em dois ambientes**: sandbox local (Santuário do Caraça e a excursão pedagógica fixture `TESTE-PIX-2026`) e produção real (`app.clicksign.com`, com validade jurídica) — nos dois, envelope criado, assinatura confirmada via webhook com HMAC válido, e contrato travado no admin.
- **Achado em produção, fora do código**: a conta Clicksign de produção não tinha o "e-mail do usuário da API" configurado (Configurações → API), o que gerava 403 `forbidden` ao criar o envelope. Resolvido direto no painel deles, não é bug desta integração.

---

## 2026-09-24 - feat: somar a coluna de CPF à planilha exportada para a escola

### Arquivos Modificados
- `api/src/routes/lista-alunos.routes.ts` [Nova `formatCpf`; coluna CPF somada antes do RG no `exportar-escola`]

### Detalhes das Alterações
- **O pedido**: A exportação "Lista para Escola" (`GET /api/admin/listas/excursao/:id/exportar-escola`) trazia apenas o RG dos alunos, e a escola precisa do CPF.
- **Por que era possível sem cadastro novo**: O CPF já é campo do `ItemPedido` (`schema.prisma`) e é **obrigatório** no checkout, enquanto o RG é opcional — ou seja, a coluna nova passa a ser a mais confiável das duas. Fichas antigas ou preenchidas pelo admin sem CPF continuam saindo em branco, como já acontecia com o RG.
- **A máscara**: O checkout grava o CPF só com dígitos (`onlyDigits`), então a planilha aplicaria `12345678901`. A nova `formatCpf` converte para `123.456.789-01` e normaliza valores que cheguem já mascarados; com menos de 11 dígitos devolve o valor como está, sem descartar dado.
- **O RG continua**: A coluna foi somada, não substituída. A tabela passa de 8 para 9 colunas (`Nº | Nome | Série | Turma | Unidade | CPF | RG | Data de Nascimento`), os merges do topo foram estendidos de `B1:H1`/`B2:H2` para `B1:I1`/`B2:I2` e as larguras ajustadas (CPF 18, RG 15, Data de Nascimento 18).
- **Validação**: `npx eslint` e `npx tsc --noEmit` limpos, e a máscara exercitada com CPF só com dígitos, já mascarado, incompleto e vazio. Não há suíte de testes no projeto, então a conferência do arquivo gerado é manual pelo admin.

---

## 2026-09-15 - fix: corrigir o retorno de falha do login com Google

### Arquivos Modificados
- `api/src/routes/cliente-auth.routes.ts` [Os dois redirecionamentos de falha passam a apontar para `/cliente/login.html`]
- `api/public/cliente/js/login.js` [Nova `mostrarErroDoGoogle`, que exibe a mensagem a partir do parâmetro `error`]

### Detalhes das Alterações
- **O problema**: Quando o cliente cancelava o acesso com Google ou a autenticação falhava, o servidor o mandava para `/login?error=...`. Esse endereço não existe e respondia 404 com "Rota não encontrada". Mesmo defeito do link de recuperação de senha, em outro ponto.
- **Os dois casos**: `google_auth_denied` (o cliente recusou na tela do Google) e `google_auth_failed` (erro ao concluir a autenticação). Os dois foram corrigidos.
- **A mensagem que ninguém via**: A página de login não lia o parâmetro `error`. Corrigir só o caminho levaria o cliente de volta à tela de login sem explicação. Agora cada código mostra uma mensagem própria, e código desconhecido cai numa mensagem genérica.
- **Confirmado em produção**: `/login?error=google_auth_failed` responde 404; `/cliente/login.html?error=google_auth_failed` responde 200.

---

## 2026-09-15 - fix: corrigir o link do e-mail de recuperação de senha

### Arquivos Modificados
- `api/src/routes/cliente-auth.routes.ts` [Link de redefinição passa a apontar para `reset-senha.html`]

### Detalhes das Alterações
- **O problema**: O cliente pedia a recuperação, recebia o e-mail, clicava no link e caía numa tela com `{"error":"Rota não encontrada"}`. Ninguém conseguia redefinir a senha pelo portal.
- **A causa**: O link era montado como `/cliente/reset-senha?resetToken=...`, sem extensão. O servidor entrega o portal do cliente com `express.static`, que não resolve caminho sem extensão: o arquivo existe como `reset-senha.html`, mas o endereço sem `.html` passava por todos os middlewares e terminava no 404 da API.
- **Confirmado em produção**: `/cliente/reset-senha?resetToken=...` responde 404 com exatamente a mensagem que o cliente viu; o mesmo endereço com `.html` responde 200 e abre a página. A página já lia o parâmetro `resetToken`, então só o caminho estava errado.
- **Links já enviados**: O token vale 1 hora. Quem pediu a recuperação antes do deploy e não conseguiu precisa pedir de novo.
- **Achado no caminho, fora deste commit**: O redirecionamento de falha do login com Google aponta para `/login?error=google_auth_failed`, que também responde 404 em produção.

