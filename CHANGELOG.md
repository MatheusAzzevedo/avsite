# Changelog

## 2026-10-30 - feat: gestão edita a lista de alunos do site

### Arquivos Modificados
- `api/src/routes/sincronizacao-gestao.routes.ts` [`GET /api/admin/sincronizacao/alunos` passa a exigir ADMIN (devolve CPF e telefone) e ganha `completo=1`: todos os pedidos, de qualquer status, com a ficha inteira e o resumo do pedido]
- `api/src/routes/lista-alunos.routes.ts` [`POST /api/admin/listas/excursao/:id/aluno` aceita `?tipo=CONVENCIONAL` para adicionar passageiro em excursão convencional]
- `api/src/schemas/sincronizacao.schema.ts` [`completo` na query de alunos e `tipoExcursaoQuerySchema`]

### Detalhes das Alterações
- **Para que serve**: a gestão (avoar) ganhou o painel "Inscrições no site" no Registro, de onde adiciona, corrige, remove e muda status de pedido usando as rotas que o admin já usa. O modo `completo` é o que alimenta esse painel; a lista de chamada continua lendo só os pagos.
- **Convencional**: o admin do site não tinha como adicionar passageiro à mão; a mesma rota da pedagógica agora serve aos dois tipos.

---

## 2026-10-28 - feat: alunos pagos de cada excursão para a lista de chamada da gestão

### Arquivos Modificados
- `api/src/routes/sincronizacao-gestao.routes.ts` [Nova rota `GET /api/admin/sincronizacao/alunos?tipo=&excursaoId=`: alunos dos pedidos PAGO/CONFIRMADO de uma excursão pedagógica ou convencional]
- `api/src/schemas/sincronizacao.schema.ts` [Novo: validação Zod da query (`tipo` PEDAGOGICA/CONVENCIONAL e `excursaoId`)]
- `api/src/routes/lista-alunos.routes.ts` [fix: "Lista para Escola" dava erro 500 em excursão com "—" ou outro caractere fora do latim no título; o nome do arquivo no cabeçalho agora sai sem acento e sem símbolo]

### Detalhes das Alterações
- **Para que serve**: quando um pedido é pago no site, a gestão (avoar) coloca o aluno na lista de chamada do Registro, já como pago. Ela lê esta rota ao abrir a lista (no máximo 1x por minuto) e pelo botão "Atualizar".
- **O que volta**: só os campos da chamada (nome, CPF, série, turma, unidade, telefone do responsável) e o id do item, que é a ligação. Aluno removido no admin ou pedido cancelado deixa de vir, e a gestão o tira da lista.
- **Convencional**: as rotas de listas do admin só cobrem pedagógica; esta cobre as duas.

---

## 2026-10-24 - feat: endpoint de sincronização com a gestão e trava de contrato sem mexer na data da excursão

### Arquivos Modificados
- `api/src/routes/sincronizacao-gestao.routes.ts` [Novo: `GET /api/admin/sincronizacao` devolve id e `updatedAt` de todas as excursões pedagógicas e convencionais]
- `api/src/server.ts` [Monta a rota nova]
- `api/src/utils/trava-contrato.ts` [Novo: `travarContrato` marca `contratoTravado` por SQL direto, sem atualizar o `updatedAt`]
- `api/src/routes/pedido.routes.ts`, `api/src/routes/webhook.routes.ts` [Confirmação de assinatura usa `travarContrato`]
- `api/src/routes/categorias-excursao.routes.ts` [Excluir categoria também confere o relacionamento, não só o campo legado]

### Detalhes das Alterações
- **Para que serve**: a gestão (avoar) ganhou um botão de sincronização por registro (verde sincronizado, vermelho quando alguém editou no site). Ela compara o `updatedAt` desta rota com a data que guardou no último envio, com uma chamada só para a listagem inteira.
- **Por que a trava mudou**: a 1ª assinatura gravava `contratoTravado` pelo Prisma, que atualiza o `updatedAt`, e a gestão acharia que a excursão foi editada. Assinar contrato não é edição; o comportamento da trava continua o mesmo.
- **Categorias**: a gestão marca categorias só pelo relacionamento; antes daria para excluir uma categoria em uso se ela não fosse a primeira da excursão.

---

## 2026-10-24 - feat: parcelamento em até 21x no cartão, limitado pela bandeira

### Arquivos Modificados
- `api/src/utils/bandeira-cartao.ts` [Novo: `ehVisaOuMaster` e `limiteParcelasPorBandeira` (21x Visa/Mastercard, 12x demais)]
- `api/src/routes/pagamento.routes.ts` [Recusa parcelas acima do limite da bandeira com mensagem clara, antes de chamar o Asaas]
- `api/src/schemas/pagamento.schema.ts`, `api/src/schemas/excursao-pedagogica.schema.ts` [Máximo de parcelas sobe de 12 para 21]
- `api/public/cliente/js/parcelas-bandeira.js` [Novo: a mesma regra no navegador]
- `api/public/cliente/js/checkout.js`, `js/pagamento.js`, `checkout.html`, `pagamento.html` [Select de parcelas corta pela bandeira ao digitar o cartão e mostra o aviso]
- `api/public/admin/excursao-pedagogica-editor.html` [Opções de 13x a 21x marcadas "só Visa e Mastercard"]

### Detalhes das Alterações
- **A regra vem do Asaas**: até 21 parcelas só para Visa e Mastercard; demais bandeiras até 12 ([docs](https://docs.asaas.com/reference/criar-cobranca-com-cartao-de-credito)). Antes o site cortava tudo em 12x.
- **Como a bandeira é identificada**: pelos primeiros dígitos (Visa começa com 4, Mastercard 51-55 ou 2221-2720). Alguns cartões Elo também começam com 4; os BINs Elo mais comuns estão listados para não serem tratados como Visa. Se aparecer recusa de Elo acima de 12x, a lista precisa crescer.
- **O backend é quem decide**: o front só ajuda a família a escolher; mesmo que alguém force o select, a rota responde 400 explicando o limite.
- **Origem**: a gestão (avoar) passa a definir as parcelas da excursão e permite até 21x. Este deploy precisa ir antes do da gestão, senão o site recusa a ficha com mais de 12x.

---

## 2026-10-16 - fix: limpeza de R2 passa a contar o snapshot do pedido

### Arquivos Modificados
- `api/src/utils/limpeza-r2.ts` [`contarReferencias` soma o `documentoUrl` gravado em `Pedido.excursaoPedagogicaSnapshot`; comentário dos 11 campos vira 12]

### Detalhes das Alterações
- **O problema**: Trocar ou apagar o "Documento para Download" de uma excursão pedagógica podia apagar o PDF do bucket mesmo com pedidos antigos usando o link — `contarReferencias` não olhava o snapshot do pedido. O download dentro do histórico do cliente desses pedidos virava 404.
- **Por que importa agora**: A gestão (avoar) passa a gerenciar esse documento e vai trocá-lo com frequência; sem a contagem, cada troca destruiria o histórico de quem já comprou. O snapshot é JSON, então a contagem usa filtro de caminho no Prisma (`path: ['documentoUrl']`).
- **Também cobre a exclusão**: quando a excursão é excluída, o snapshot nasce com o `documentoUrl` antigo e a limpeza da exclusão agora o respeita.
