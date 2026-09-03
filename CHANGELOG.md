# Changelog

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

## 2026-08-31 - fix: impedir que a cobrança PIX abandonada cancele o pedido pago no cartão

### Arquivos Modificados
- `api/src/routes/webhook.routes.ts` [Notificação só vale para a cobrança atual; cancelamento não rebaixa pedido pago]
- `api/public/cliente/js/checkout.js` [PIX deixa de ser gerado na abertura da tela; contagem alinhada ao prazo do servidor]
- `api/src/routes/pagamento.routes.ts` [Pagamento no cartão invalida a cobrança PIX pendente e limpa `pixExpiraEm`]

### Detalhes das Alterações
- **Impacto**: **41 pedidos pagos no cartão, somando R$ 13.550,00, foram cancelados indevidamente** em produção. Outros 5 (R$ 1.245,00) estavam na fila para cair na madrugada seguinte. Todos tinham `dataPagamento` preenchido — o dinheiro entrou e o aluno perdeu a vaga.
- **A cadeia**: O checkout abria com PIX pré-selecionado e gerava o QR Code na hora, criando uma cobrança PagHiper em **todo** checkout, inclusive nos de quem ia pagar no cartão. Ao pagar no cartão, `codigoPagamento` passava a apontar para o Asaas e a cobrança PIX ficava órfã no gateway, sem nunca ser cancelada. Um a dois dias depois ela vencia, o PagHiper notificava `canceled` no lote da madrugada, e o webhook — que só protegia o status `EXPIRADO` — sobrescrevia o pedido para `CANCELADO`.
- **Como o diagnóstico fechou**: Todos os cancelamentos aconteciam entre 04:00 e 04:08, cerca de 48h após a criação. Não batia com a varredura interna do PIX, que roda a cada 10 minutos e filtra `metodoPagamento = 'pix'`, nem com o temporizador do navegador. O padrão de horário apontou para um lote externo, e os 46 pedidos de cartão com `pixExpiraEm` preenchido (de 1.062 no total) confirmaram que a cobrança PIX estava sendo criada onde não devia.
- **Três correções, em camadas**: A raiz é não criar cobrança antes da escolha do cliente — nenhum meio vem pré-selecionado e nenhuma cobrança nasce sozinha. A segunda é o cartão invalidar no gateway o PIX que ficou para trás, senão o cliente que já pagou ainda consegue pagar de novo. A terceira é o webhook ignorar notificação cujo `transaction_id` não é o `codigoPagamento` atual do pedido, com uma barreira adicional que impede `canceled` de rebaixar pedido `PAGO` ou `CONFIRMADO`.
- **Segundo defeito encontrado no caminho**: A contagem regressiva do checkout usava uma constante de **15 minutos** enquanto o servidor concede **120**. Passados 15 minutos com a tela aberta, o navegador chamava a rota de cancelamento e derrubava o pedido 105 minutos antes do prazo real. A contagem passou a derivar de `expiraEm`, devolvido pela API, e o formato virou h:mm:ss — em minutos, 2h apareceriam como "119:59".
- **Clique repetido**: Voltar para a aba do PIX recriava a cobrança e abandonava a anterior. Agora reexibe a que existe e retoma a contagem do prazo original.
- **Validação em navegador real**: Checkout completo até a etapa de pagamento sem nenhuma chamada a `/pagamento/pix` e pedido gravado com `metodoPagamento` nulo; clique em "Cartão de crédito" também sem gerar cobrança; clique em "PIX" gerando uma única cobrança, com a contagem exibindo 1:59:48; e ida e volta entre as abas mantendo uma só cobrança. A cobrança criada no teste foi cancelada no gateway.

---

## 2026-08-29 - feat: converter para caixa alta o código único da excursão pedagógica

### Arquivos Modificados
- `api/public/admin/js/excursao-pedagogica-editor.js` [Nova função `ativarCaixaAltaNoCodigo`]
- `api/public/admin/excursao-pedagogica-editor.html` [Texto de ajuda do campo]

### Detalhes das Alterações
- **Comportamento**: Tudo que for digitado ou colado no campo "Código único" passa a virar caixa alta na hora, com a posição do cursor preservada — digitar no meio do texto não joga o cursor para o fim.
- **A conversão acontece ao digitar, não ao salvar**: A diferença importa. O código é o que o cliente usa para localizar a excursão, e a busca no banco é exata, sensível a maiúsculas. Se a conversão fosse aplicada no momento de salvar, abrir uma excursão antiga só para corrigir o título renomearia o código dela em silêncio, e todo código já em circulação deixaria de encontrar a excursão. Do jeito que ficou, um código existente só muda se o administrador realmente mexer naquele campo.
- **Situação encontrada**: Há uma excursão gravada como `BiologiaM2`, em caixa mista. Ela continua intacta ao ser aberta e salva. Verificado no navegador: o campo exibe `BiologiaM2` ao carregar e o banco segue com o mesmo valor depois de sair da tela.
- **Sem `text-transform` no CSS**: A propriedade só muda a aparência, não o valor enviado. Usá-la exibiria em caixa alta um código que continuaria gravado em caixa mista — a tela mostraria uma coisa e o banco guardaria outra.
- **Validação em navegador real**: `biologia-marinha_2026` digitado virou `BIOLOGIA-MARINHA_2026`; inserção no início do texto manteve o cursor no lugar; e um cadastro completo feito com o código digitado em minúsculas foi gravado no banco como `TESTE-CAIXA-ALTA_01`.

---
