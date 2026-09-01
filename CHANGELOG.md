# Changelog

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

## 2026-08-29 - feat: permitir a edição dos dados de um aluno já inscrito

### Arquivos Modificados
- `api/src/routes/lista-alunos.routes.ts` [Nova rota `PUT /aluno/:id`]
- `api/src/schemas/pedido.schema.ts` [Novo `editarAlunoSchema`]
- `api/public/admin/js/listas.js` [Botão de edição e modal preenchido com a ficha atual]
- `api/public/admin/listas.html` [Novo modal de edição com os 17 campos do aluno]
- `api/public/admin/css/admin-style.css` [Estilo do botão de edição na coluna de ações]

### Detalhes das Alterações
- **O que faltava**: A tela de listas permitia adicionar e excluir aluno, mas não corrigir. Um nome digitado errado, uma turma trocada ou uma informação médica que faltou só se resolviam excluindo a inscrição e recadastrando — o que apaga a ligação com o pedido pago e o histórico do cliente.
- **Todos os 17 campos**: Nome, dados escolares, documentos, responsável pelo aluno, informações médicas e observações. A escolha foi do usuário: qualquer um deles pode ter sido preenchido errado no ato da compra.
- **Só pedidos ativos**: Aluno de pedido cancelado ou expirado não é editável — o botão não aparece na tabela e a rota recusa a alteração. Aquele registro virou histórico encerrado; alterá-lo mudaria o retrato de algo que já terminou. A verificação existe nas duas pontas, porque esconder o botão não impede uma chamada direta à API.
- **Dados de quem pagou ficam intactos**: A edição toca apenas o `ItemPedido`. O `dadosResponsavelFinanceiro` do pedido foi enviado ao gateway e consta do comprovante que o cliente recebeu; reescrevê-lo criaria divergência entre o sistema e o documento que está com o cliente. Confirmado no teste: após a edição, o bloco do pagador seguiu inalterado.
- **Campo vazio apaga o dado**: O formulário envia a ficha inteira, então ausência de valor é decisão do administrador, não omissão. Um update parcial faria a limpeza ser silenciosamente ignorada — o campo continuaria com o valor antigo e ninguém saberia.
- **Erro encontrado no teste**: O primeiro salvamento falhou com 400. A causa era o telefone gravado como `11988887777`, sem máscara, recusado pela regra do cadastro, que exige `(11) 98888-8888`. Corrigir o nome de um aluno era impossível enquanto o telefone dele estivesse num formato que o próprio sistema aceitou ao gravar. Na edição a máscara passou a ser aplicada, não exigida.
- **Rastro da alteração**: Cada edição grava um `activity_log` com o nome anterior e o novo, além do administrador responsável. É o único jeito de rastrear a correção depois, já que a alteração não guarda versão.
- **Validação em navegador real**: Botão presente apenas na linha do pedido ativo entre quatro alunos; edição de nome, turma, limpeza de escola e preenchimento de plano de saúde persistidos; telefone normalizado; alteração refletida na exportação da Lista para Escola; e as rotas recusando pedido cancelado (400), expirado (400) e requisição sem token (401).

---

## 2026-08-26 - feat: implementar o envio do formulário de contato do site

### Arquivos Modificados
- `api/src/routes/contato.routes.ts` [Novo: recebe a mensagem e encaminha por e-mail]
- `api/src/schemas/contato.schema.ts` [Novo: validação Zod dos campos]
- `api/src/templates/email-contato.ts` [Novo: template HTML e texto da mensagem]
- `api/public/js/contato-form.js` [Novo: envio por fetch com feedback na página]
- `api/public/contact.html` [Removido `action="#"`; script do formulário carregado]
- `api/src/server.ts` e `api/.env.example` [Rota registrada e `CONTATO_EMAIL_DESTINO` documentada]

### Detalhes das Alterações
- **O formulário nunca funcionou**: Com `action="#"` e `method="post"` e nenhum JavaScript tratando o envio, o navegador fazia um POST nativo para a própria URL. Como não existia rota para isso, o visitante era levado a uma tela com `{"error":"Rota não encontrada"}`. Toda pessoa que preencheu o formulário acreditou ter falado com a Avoar, e a mensagem não chegava a lugar nenhum.
- **Destino configurável**: `CONTATO_EMAIL_DESTINO` define quem recebe; sem ela, cai no remetente já verificado no Brevo. Assim, trocar o endereço é mudança de variável, não de código.
- **Limite dedicado**: 5 mensagens por IP a cada 15 minutos. O limite global de 100 req/15min não serve aqui, porque cada requisição desta rota custa um e-mail — sem restrição própria, o endereço da Avoar viraria destino de spam.
- **Erro encontrado no teste**: O primeiro envio real falhou com `email is not valid in to`. A causa era usar `getFromAddress()`, que devolve o formato de cabeçalho `"Avoar Turismo" <contato@...>`, no campo de destinatário da API. Corrigido para `getSender().email`.
- **Validação em duas camadas**: Os atributos `required` do HTML barram o envio incompleto sem ida ao servidor; o Zod valida no backend, devolvendo erro por campo.
- **Sem armazenamento em banco**: A decisão foi entregar por e-mail, que é onde a equipe já trabalha. O ponto de extensão para histórico fica na rota, antes do envio.
- **Validação em navegador real**: Formulário preenchido e enviado sem sair da página, com aviso de sucesso, campos limpos e botão reabilitado; envio vazio bloqueado pelo navegador antes de chegar à API; e o limite respondendo 429 com mensagem clara na sexta tentativa.

---
