# Avorar Turismo - Sistema Completo

Sistema de site e administração para Avorar Turismo com backend em Node.js/Express, banco de dados PostgreSQL e frontend em HTML/CSS/JavaScript.

## Arquivos Modificados [Resumo das Atualizações]

### Última atualização (2026-05-09) - feat: melhorias nos cards de listagem de alunos e controle de vagas
- **api/src/routes/lista-alunos.routes.ts** [Estatísticas de pagamento (PIX/Cartão) e capacidade]
- **api/public/admin/js/listas.js** [Interface com novas labels e exibição de ocupação]

Resumo: Atualização visual e lógica dos cards de listagem de alunos. Introduzidas novas labels ("Alunos Inscritos", "Total de Pedidos", "Pagamentos PIX/Cartão") e exibição de capacidade ("Vagas"). O backend agora processa a divisão por método de pagamento e filtra automaticamente registros cancelados para garantir dados precisos.

### Versão anterior (2026-05-07) - feat: sistema de limite de vagas (capacidade) em excursões
- **api/prisma/schema.prisma** [Novos campos `vagas` nos modelos de Excursão]
- **api/src/routes/pedido.routes.ts** [Validação de disponibilidade e bloqueio de overbooking]

Resumo: Implementado sistema de gestão de capacidade. É possível definir limite de vagas, com cálculo automático de disponibilidade em tempo real e bloqueio de novos pedidos se o limite for atingido.

### Versão anterior (2026-05-04) - feat: paginação e filtragem no servidor para excursões pedagógicas
- **api/src/routes/excursao-pedagogica.routes.ts** [Paginação e filtros avançados no servidor]
- **api/public/admin/js/excursoes-pedagogicas.js** [Consumo de API paginada e debouncing]

Resumo: Implementada paginação server-side e filtragem dinâmica para excursões pedagógicas, processando filtros de localidade, data e valor via Prisma para máxima performance.

### Versão anterior (2026-04-27) - feat: adicionar CPF e endereço do responsável na extração completa
- **api/src/routes/lista-alunos.routes.ts** [CPF e Endereço do responsável na exportação Excel]

Resumo: Atualização da extração completa na lista de alunos para incluir colunas de CPF e Endereço do Responsável no relatório gerado.

### Versão anterior (2026-04-22) - feat: exportação de pedidos cancelados na lista de alunos
- **api/src/routes/lista-alunos.routes.ts** [Nova rota para exportação de cancelados]
- **api/public/admin/js/listas.js** [Interface e lógica de exportação]

Resumo: Adicionada funcionalidade para exportar pedidos cancelados para Excel, com botões de acesso rápido nos cards da listagem.
