# Changelog

## 2026-02-04 - Reconciliação de pagamento PIX/cartão quando Asaas retorna erro

### Arquivos Modificados
- `api/src/config/asaas.ts` [Nova função listarPagamentosPorReferencia(externalReference) para consultar pagamentos na Asaas por id do pedido; erros de criação PIX/cartão repassados para as rotas em vez de lançar exceção]
- `api/src/routes/pagamento.routes.ts` [POST /pix e POST /cartao: em caso de erro da Asaas ao criar cobrança, consulta listarPagamentosPorReferencia(pedidoId); se existir pagamento confirmado/recebido, atualiza pedido para PAGO e retorna 200; senão retorna 400 com mensagem Asaas, evitando 500 quando a cobrança de fato ocorreu]
- `api/public/admin/config-pagamento.html` [Ajustes de exibição do status e teste de conexão Asaas]

### Alterações
- Cobrança aprovada no cartão ou PIX mas resposta da Asaas com erro (ex.: "Transação não autorizada") deixava de atualizar o pedido e retornava 500. Agora, após erro na criação, a API consulta pagamentos pela referência do pedido na Asaas; se houver pagamento confirmado, o pedido é marcado como PAGO e o cliente recebe 200, alinhando estado do sistema ao que realmente foi pago.

---

## 2026-02-04 - Checkout: etapa de pagamento Asaas (PIX e Cartão)

### Arquivos Modificados
- `cliente/checkout.html` [Seção checkoutStepPagamento com opções PIX e Cartão de crédito; pixBox com QR Code e botão Copiar; cartaoBox com formulário completo (cartão + titular)]
- `cliente/js/checkout.js` [mostrarEtapaPagamento: listeners únicos (pagamentoListenersAdded), PIX selecionado por padrão e gerarPix() ao exibir; gerarPix (POST /cliente/pagamento/pix), iniciarPollStatus (GET status a cada 3s), pagarComCartao (POST /cliente/pagamento/cartao)]
- `api/public/cliente/checkout.html`, `api/public/cliente/js/checkout.js` [Cópias para paridade com a API]

### Alterações
- Após criar o pedido, o checkout exibe a etapa de pagamento com valor total, opção PIX (QR Code + copiar código) e opção Cartão de crédito (formulário com número, validade, CVV e dados do titular). Listeners são registrados uma única vez; PIX é exibido por padrão e o polling verifica o status até PAGO/CONFIRMADO. Cartão envia dados para a API que processa via Asaas.

---

## 2026-02-04 - Checkout cliente: todos os campos do admin (responsável + aluno + médico)

### Arquivos Modificados
- `api/prisma/schema.prisma` [Pedido: campo dadosResponsavelFinanceiro (Json?); ItemPedido: dataNascimento, rgAluno, turma, unidadeColegio, alergiasCuidados, planoSaude, medicamentosFebre, medicamentosAlergia]
- `api/src/schemas/pedido.schema.ts` [dadosResponsavelFinanceiroSchema (nome, sobrenome, cpf, pais, cep, endereco, numero, cidade, estado, telefone, email, etc.); dadosAlunoSchema estendido com dataNascimento, rgAluno, turma, unidadeColegio, alergiasCuidados, planoSaude, medicamentosFebre, medicamentosAlergia; createPedidoSchema com dadosResponsavelFinanceiro opcional]
- `api/src/routes/pedido.routes.ts` [POST: salva dadosResponsavelFinanceiro no Pedido; itens com todos os novos campos por aluno]
- `cliente/checkout.html` [Container responsavelContainer antes de alunosContainer]
- `cliente/js/checkout.js` [gerarResponsavelBlock: bloco único Dados do Responsável Financeiro (todos os campos do admin); gerarFormularios: por aluno Informações do estudante + Informações médicas; submit envia dadosResponsavelFinanceiro e dadosAlunos completos; apiPathToInputName e showValidationErrors para responsável e novos campos]
- `api/public/cliente/checkout.html`, `api/public/cliente/js/checkout.js` [Cópias das alterações]

### Alterações
- Checkout do cliente passou a ter todos os campos do admin/checkout.html: um bloco único "Dados do Responsável Financeiro" (nome, sobrenome, CPF, país, CEP, endereço, número, cidade, estado, bairro, telefone, email) e, para cada participante (quantidade), bloco completo "Informações do estudante" (nome, data nascimento, CPF, RG, série, turma, unidade do colégio, escola, idade) + "Informações médicas" (alergias/cuidados, plano de saúde, medicamentos febre/dor, medicamentos alergia). API e banco atualizados para persistir esses dados; migration deve ser aplicada quando o banco estiver acessível (`npx prisma migrate dev` ou `prisma db push`).

---

## 2026-02-04 - Checkout cliente: UX, erros por campo e design alinhado ao sistema

### Arquivos Modificados
- `cliente/checkout.html` [Navbar alinhada ao dashboard (marca + Voltar + Meus Pedidos); design com variáveis do sistema; formulário em seções (Aluno N, Dados do responsável); labels com hint e obrigatório; bloco de erro com título + lista; estilos para campo inválido e mensagem inline]
- `cliente/js/checkout.js` [Uso de resData.details da API para exibir quais campos falharam e por quê; clearFieldErrors; apiPathToInputName; showValidationErrors (lista no topo + marcação nos inputs); gerarFormularios com seções, labels e placeholders organizados]
- `api/public/cliente/checkout.html`, `api/public/cliente/js/checkout.js` [Cópias das alterações para paridade]

### Alterações
- Resposta 400 da API já retorna `details: [{ field, message }]`. O checkout passou a exibir lista "Aluno N – Campo: motivo" no topo e a marcar cada input inválido com borda vermelha e mensagem abaixo do campo.
- Design da página alinhado à área do cliente: mesma navbar (marca Avorar, Voltar, Meus Pedidos), cores (--primary-color, --danger-color), cards e botão em gradiente. Labels organizadas em seções (Aluno 1, Dados do responsável), com hint (ex.: formato do telefone) e asterisco só no obrigatório.

---

## 2026-02-04 - Excursão e dashboard: CSP excursao.html + pattern removido

### Arquivos Modificados
- `api/public/cliente/excursao.html` [Removido script inline e onclick no botão Checkout; carrega js/excursao.js]
- `api/public/cliente/js/excursao.js` [Novo: lógica de carregar excursão por código, exibir, calcular total e checkout externalizada para CSP]
- `cliente/excursao.html` [Mesmas alterações: script externo e botão sem onclick]
- `cliente/js/excursao.js` [Cópia do excursao.js para paridade com api/public]
- `api/public/cliente/dashboard.html`, `cliente/dashboard.html` [Removido atributo pattern do input de código]
- `api/public/cliente/js/dashboard.js`, `cliente/js/dashboard.js` [Validação do código no submit com regex em JS: ^[A-Za-z0-9_\-]+$]

### Alterações
- excursao.html ficava em "Carregando excursão..." porque o CSP bloqueava o script inline (linha 79). Toda a lógica foi movida para excursao.js.
- pattern [-A-Za-z0-9_]+ no dashboard ainda gerava SyntaxError em alguns navegadores (flag /v). Atributo pattern removido; validação feita apenas em JavaScript no submit.

---

**Mantidas apenas as últimas 5 versões conforme regra do projeto**
