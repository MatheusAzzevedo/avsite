# Changelog

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

## 2026-09-02 - fix: preservar a data de pagamento ao cancelar um pedido pago

### Arquivos Modificados
- `api/src/utils/transicoes-pedido.ts` [Nova constante `STATUS_ANTES_DO_PAGAMENTO`; aviso restrito a ela]
- `api/src/routes/pedido.routes.ts` [Limpeza das datas só ao voltar para antes do pagamento]

### Detalhes das Alterações
- **O defeito**: A correção do dia 01/09 limpava `dataPagamento` e `dataConfirmacao` em qualquer status que não fosse `PAGO` ou `CONFIRMADO` — inclusive ao **cancelar**. O modal dizia "mudar o status NÃO estorna nada" e, na linha seguinte, apagava o registro de que o dinheiro entrou. As duas frases se contradiziam na mesma tela.
- **Por que importa além da coerência**: Os 41 pedidos cancelados indevidamente pela cobrança órfã só foram encontrados porque `dataPagamento` sobreviveu ao cancelamento. Com o comportamento anterior, um caso desses passaria a ser invisível na consulta.
- **A regra certa é mais estreita**: A limpeza vale só ao ir para `PENDENTE` ou `AGUARDANDO_PAGAMENTO`, que são os status que afirmam "ainda não pagou". `CANCELADO` e `EXPIRADO` encerram o pedido, mas não desfazem o fato de o pagamento ter acontecido.
- **Encontrado em produção**: O pedido `51b57cc4` (R$ 10,00, cartão) foi cancelado pelo modal em 01/09 e ficou sem data de pagamento, como se nunca tivesse sido pago. O valor foi capturado de verdade no Asaas.
- **Validação**: Cancelar um pedido pago preserva a data; voltar o mesmo pedido para `PENDENTE` limpa as duas datas; e o aviso de remoção passa a aparecer apenas em `Pendente` e `Aguardando pagamento`, não mais nas seis opções.

---

## 2026-09-01 - feat: alterar o status do pedido mostrando as consequências de cada opção

### Arquivos Modificados
- `api/src/utils/transicoes-pedido.ts` [Novo: regras que avaliam cada transição]
- `api/src/routes/pedido.routes.ts` [Nova rota `GET /:id/opcoes-status`; `PATCH /:id/status` reforçado]
- `api/src/schemas/pedido.schema.ts` [Campos `confirmacoes` e `avisarCliente`]
- `api/public/admin/js/status-pedido-modal.js` [Novo: componente compartilhado pelas duas telas]
- `api/public/admin/js/listagem-convencional.js`, `listas.js`, `listas.html`, `listagem-convencional.html` [Botão na coluna de ações]
- `api/public/admin/css/admin-style.css` [Estilos do modal e correção da largura dos botões de ação]

### Detalhes das Alterações
- **O problema do seletor simples**: Status não é um campo comum. Ele decide se a vaga está reservada ou de volta no estoque, define quem entra na lista enviada à escola e convive com dinheiro já recebido por um gateway. Um seletor que aceita qualquer valor esconde tudo isso de quem opera — e a rota que existia aceitava qualquer transição sem checar nada.
- **Quatro portões, cada um disparando só onde faz sentido**: vaga (ao sair de um status terminal para um ativo, único caminho que reocupa vaga); dinheiro reconhecido (ao encerrar um pedido já pago); gateway (ao afirmar pagamento que ele não confirma, ou ao cancelar com cobrança viva); e datas (ao sair de um status de pagamento). Uma matriz de 36 combinações seria ilegível e cheia de célula sem sentido.
- **A regra mora no backend**: A tela pede a avaliação a `GET /:id/opcoes-status`, que consulta as vagas reais da excursão e o gateway. A gravação reavalia tudo de novo — entre abrir o modal e salvar, outra pessoa pode ter ocupado a última vaga. Sem isso, bastaria uma chamada direta à API para furar toda a proteção.
- **Confirmação com o texto da consequência**: As opções de risco exigem tokens (`sem_vaga`, `dinheiro_reconhecido`, `sem_confirmacao_gateway`) devolvidos na gravação. A caixa repete a frase específica daquele pedido, não um "tem certeza?" genérico. Sem o token, a rota recusa com 400.
- **Falta de vaga bloqueia, mas pode ser forçada**: Barreira dura obrigaria a cancelar o pedido de outra pessoa para corrigir um engano — pior que o overbooking consciente. Fica registrado no log de atividade junto com o motivo exibido na tela.
- **Três situações de gateway, não duas**: Não ter cobrança registrada é normal (venda manual) e a consulta falhar não é. Na primeira versão as duas viravam "não foi possível consultar", o que faria o operador procurar problema onde não há.
- **Datas passam a ser limpas**: A rota antiga só preenchia `dataPagamento`/`dataConfirmacao`, nunca limpava. Um pedido devolvido de Pago para Pendente ficava com a data de um pagamento que, segundo o próprio status, não existe.
- **Cobrança viva é invalidada junto**: Encerrar o pedido cancela o PIX no gateway. Sem isso o cliente pagaria uma cobrança de pedido cancelado — o mesmo padrão que derrubou 41 pedidos pagos no cartão.
- **E-mail desmarcado por padrão**: Avisar o cliente é irreversível e não pode ser efeito colateral de uma correção de status.
- **Correção de layout encontrada no caminho**: `.btn-primary` é `width: 100%`, pensada para formulário. Na coluna de ações isso fazia o botão de visualizar ocupar a linha inteira e empurrar os demais para baixo — já acontecia antes, e piorava a cada botão novo.
- **Validação em navegador real**: Bloqueio por vaga com a excursão reduzida a 1 vaga já ocupada; gravação recusada sem confirmação e recusada de novo com só uma das duas exigidas; gravação aceita com ambas, registrando o motivo no log; retorno de Pago para Pendente limpando as duas datas; e as duas telas exibindo o modal com o valor recebido, a excursão e as consequências por opção.

---

