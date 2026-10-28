# Changelog

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

---

## 2026-10-01 - fix: corrigir falha ao criar excursão convencional nova

### Arquivos Modificados
- `api/src/routes/excursao.routes.ts` [Deriva o campo legado `categoria` da primeira `categoriaId` marcada, quando ausente]

### Detalhes das Alterações
- **O problema**: Criar qualquer excursão convencional nova pela tela do admin quebrava com `Argument categoria is missing`. A tela só envia `categoriaIds` (o relacionamento muitos-para-muitos), mas o campo legado `categoria` (string, usado pelo filtro `?categoria=` antigo) continua `NOT NULL` no banco, sem default, e nada preenchia.
- **Por que não apareceu antes**: Todo teste anterior da integração Clicksign editava excursões já existentes (`Santuário do Caraça`, `Cristo Redentor`), e `update()` não exige os campos que já têm valor — só `create()` falhava. O bug é anterior a este trabalho, só nunca tinha sido exercitado.
- **A correção**: Quando `categoria` não vem no corpo e `categoriaIds` tem ao menos um item, busca o `slug` da primeira categoria marcada (`CategoriaExcursao.findUnique`) e usa como valor legado — mesmo formato (`cultura`, `natureza`, `marítimo`) que os registros antigos já têm.
- **Achado em produção**: Apareceu ao criar uma excursão de teste pra validar o webhook da Clicksign em `avoarturismo.up.railway.app`; corrigido e redeployado antes de prosseguir.

---

## 2026-10-09 - fix: buscar excursão pedagógica por código ignora maiúsculas e imagem de reserva deixou de ser 404

### Arquivos Modificados
- `api/src/routes/public.routes.ts` [Busca por código no portal passa a ser case-insensitive (`mode: 'insensitive'`)]
- `api/public/cliente/js/excursao.js` [Imagem de reserva deixa de apontar para `/images/default.jpg` (inexistente) e passa a usar `Queda de agua.webp`]

### Detalhes das Alterações
- **O problema 1**: o portal da família digita o código em caixa alta (`inicio.js`) e o servidor comparava exato. Códigos gerados pelo próprio site são em minúsculas (slug do título), então a família não achava a excursão que tinha em mãos. A comparação virou insensível a maiúsculas/minúsculas.
- **O problema 2**: excursão sem capa usava `/images/default.jpg`, arquivo que não existe — a família via imagem quebrada na página da excursão e no checkout. Cai agora numa foto real já usada pelo site.
- **Contexto**: mudanças pontuais para a fase 1 da integração com a gestão (`avoar`), que passa a publicar automaticamente as excursões pedagógicas criadas lá. Códigos novos chegam em caixa alta e sem capa no primeiro momento.
