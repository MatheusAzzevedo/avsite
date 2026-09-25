# Changelog

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

---

## 2026-09-03 - feat: registrar no histórico do pedido as notificações de gateway recusadas

### Arquivos Modificados
- `api/src/routes/webhook.routes.ts` [Nova `registrarNotificacaoIgnorada`; as duas guardas passam a gravar em `activity_logs`]

### Detalhes das Alterações
- **O problema**: As duas proteções contra a cobrança PIX órfã recusavam a notificação registrando apenas no log da aplicação. No banco não sobrava rastro nenhum, e proteção silenciosa é indistinguível de proteção ausente.
- **Como isso apareceu**: Ao investigar um pedido pago no cartão logo após um PIX abandonado, não havia como responder, olhando o histórico, se a guarda tinha agido ou se a notificação nunca havia chegado. A pergunta só se resolveu lendo o código e comparando o formato dos registros — que é justamente o tipo de resposta que deveria estar visível no painel.
- **O que passa a ser gravado**: Uma linha com `action: 'webhook_ignorado'` dizendo qual cobrança foi notificada, com que status, qual é a cobrança atual do pedido e em que status o pedido foi preservado. Vale para as duas guardas: a que recusa notificação de cobrança que não é mais a do pedido, e a que impede `canceled` de rebaixar pedido já pago.
- **Nunca derruba o webhook**: A gravação é isolada em try/catch. Falhar o webhook por causa de auditoria faria o gateway reenviar a notificação — e o reenvio é exatamente o que a guarda precisa continuar recusando.
- **Distinção que o histórico agora torna óbvia**: Webhook grava `action: 'payment_webhook'` e nunca preenche `userId`; alteração manual grava `action: 'update'` com `userId` do admin. Com a nova linha, o terceiro caso — notificação recusada — também fica explícito.
- **Validação**: Gravação e leitura exercitadas contra o banco, confirmando que `action` aceita o valor novo (o campo é String livre no schema, sem enum).

---

## 2026-09-02 - fix: liberar o comprovante para pedidos confirmados, e não só pagos

### Arquivos Modificados
- `api/src/routes/pedido.routes.ts` [Rota do comprovante aceita `PAGO` e `CONFIRMADO`]
- `api/public/cliente/js/pedidos.js` [Botão aparece nos dois status]

### Detalhes das Alterações
- **O problema**: A rota filtrava `status: 'PAGO'` e o botão na tela usava a mesma condição. Só que `CONFIRMADO` não é um status inferior a `PAGO`: é o passo **seguinte**, o pedido pago e confirmado pela empresa. Deixá-lo de fora inverte a intenção da regra.
- **Alcance em produção**: **144 pedidos em `CONFIRMADO`, de 139 clientes distintos**, nenhum conseguia emitir comprovante. Desses, 119 têm data de pagamento registrada.
- **Por que aparecia principalmente no cartão**: É o webhook `PAYMENT_CONFIRMED` do Asaas que promove o pedido de `PAGO` para `CONFIRMADO`, e ele chega segundos depois da aprovação. Dos 144 confirmados, 118 são de cartão e apenas 1 de PIX. Na prática, quem pagava no cartão via o botão do comprovante por alguns segundos e depois o perdia, enquanto quem pagava no PIX ficava em `PAGO` e mantinha.
- **Reuso da constante**: A rota passa a usar `STATUS_DE_PAGAMENTO`, já definida em `transicoes-pedido.ts`, em vez de uma segunda lista. Assim "o que conta como pago" continua definido num lugar só, e o comprovante acompanha se a regra mudar.
- **Fica de fora de propósito**: `PENDENTE` e `AGUARDANDO_PAGAMENTO` ainda não pagaram; `CANCELADO` e `EXPIRADO` encerraram. Emitir comprovante de inscrição cancelada seria pior que o erro corrigido.
- **Validação**: Os seis status exercitados contra a rota real com token de cliente — `PAGO` e `CONFIRMADO` devolvem o comprovante (HTTP 200), e os outros quatro devolvem 404 com a mensagem explicativa. A listagem entrega `CONFIRMADO` cru para a tela, que é o valor que a condição do botão avalia.

---

