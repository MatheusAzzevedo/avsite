# Changelog

## 2026-08-19 - feat: helper compartilhado de upload no painel administrativo

### Arquivos Modificados
- `api/public/admin/js/admin-main.js` [Novo objeto `UploadArquivo`: envio, validação, progresso e preenchimento de campo]

### Detalhes das Alterações
- **Base para migrar as telas**: Cinco telas do admin repetem a mesma lógica de arquivo, hoje convertendo para Base64 com FileReader. Centralizar o envio evita que cada uma trate erro e validação de um jeito próprio — e é o tratamento de erro que importa aqui, porque uma falha silenciosa leva o usuário a comprimir a imagem por fora até "funcionar", que é uma das origens da perda de qualidade.
- **Escolha do XMLHttpRequest**: `fetch` não reporta progresso de envio, e fotos originais passam de 20 MB. Sem indicação de andamento, a tela parece travada durante o envio.
- **Validação antes do envio**: Tipo e tamanho são conferidos no navegador, espelhando o limite do servidor, para não gastar uma subida de 30 MB que seria rejeitada no fim.
- **`preencherCampo`**: Reproduz a interface do padrão antigo (`dataInputId`, `previewId`, container), gravando a URL no lugar do Base64. A prévia local aparece imediatamente via `createObjectURL` e é trocada pela URL definitiva ao terminar; em caso de erro, é limpa, para não dar a impressão de que a imagem foi salva.
- **Envio múltiplo em sequência**: Subir dez fotos grandes em paralelo satura a conexão. A falha de um arquivo não derruba os demais.
- **Sem alteração de HTML**: O helper mora em `admin-main.js`, já carregado por todas as telas do painel.
- **Validação em navegador real**: PNG de 2.606 KB (2000x1400) enviado pela tela de Equipe virou 22 KB em 1920x1344; progresso reportado; nome com acento preservado; arquivo de 30 MB e formato inválido barrados com mensagem clara; e a imagem do R2 carregou na página, confirmando a liberação da CSP.

---

## 2026-08-19 - fix: restaurar o download de documentos após a migração para o R2

### Arquivos Modificados
- `api/src/routes/documentos.routes.ts` [Atende disco e R2; redireciona quando o arquivo não está local]
- `api/src/config/r2.ts` [`Content-Disposition` gravado no objeto e `verificarConfigR2`]
- `api/src/routes/upload.routes.ts` [Correção da codificação do nome de arquivo vindo do multer]

### Detalhes das Alterações
- **Regressão corrigida**: O upload de documento já gravava no R2, mas o cliente baixava por `/api/documentos/download/<arquivo>`, que procurava em disco. Todo documento enviado após a migração resultava em 404. A rota passa a servir do disco quando o arquivo existe (documentos anteriores) e a redirecionar para o R2 caso contrário. O frontend não precisou mudar, já que continua montando o link a partir do nome do arquivo.
- **Download forçado preservado**: Um redirect simples faria o PDF abrir no navegador em vez de baixar. O `Content-Disposition` passa a ser gravado no próprio objeto durante o upload, então o comportamento é o mesmo nas duas origens.
- **Nome de arquivo corrompido**: O multer entrega `originalname` em latin1, então um nome com acento ou travessão chegava com os bytes UTF-8 reinterpretados e era codificado de novo. "Lista de Alunos — Cristo Redentor.pdf" virava `%C3%A2%C2%80%C2%94` no cabeçalho. A correção é aplicada nos três pontos de upload, tanto no cabeçalho quanto no nome gravado no banco.
- **Validação**: Ciclo completo exercitado — envio com nome acentuado, redirect 302, download com nome íntegro em UTF-8, e path traversal ainda barrado com 400.

---

## 2026-08-17 - fix: eliminar perda de qualidade no processamento de imagens

### Arquivos Modificados
- `api/src/routes/upload.routes.ts` [Redimensionamento, preservação de perfil de cor, orientação EXIF e erro legível de tamanho]
- `api/scripts/optimize-images.js` [Deixou de sobrescrever originais; passa a gravar em pasta paralela]
- `api/.env.example` [Variáveis `IMAGEM_DIMENSAO_MAXIMA`, `IMAGEM_QUALIDADE` e novo `MAX_FILE_SIZE`]

### Detalhes das Alterações
- **Origem da perda identificada**: O caminho do admin não degradava nada — `readAsDataURL` guarda os bytes originais. A perda vinha do `optimize-images.js`, que substituía os arquivos no lugar e tinha como única proteção uma comparação de tamanho. Como um JPEG recomprimido costuma ficar menor, cada execução regravava e degradava de novo. Uma passada de verificação sobre o acervo atual economizou 0,4% no total, ou seja, trocava qualidade real por praticamente nada.
- **Script não destrutivo**: A saída passa a ir para `<pasta>-otimizadas`, preservando os originais. Sobrescrever exige `--sobrescrever` explícito, e o modo em uso é anunciado no início da execução.
- **Redimensionamento em vez de compressão**: A rota de upload não tinha `resize` e guardava a imagem nas dimensões originais. Uma foto de 7990x5327 gerava 11,6 MB. Com teto de 1920px e qualidade 90, a mesma foto sai com 299 KB — o peso vem da dimensão, o que permite manter qualidade alta.
- **Perfil de cor preservado**: O sharp descarta metadados por padrão, e uma foto em Display P3 interpretada como sRGB sai com as cores deslocadas. `keepIccProfile()` corrige isso. O EXIF restante continua descartado de propósito, porque carrega GPS de fotos de excursões escolares.
- **Orientação**: `rotate()` aplica a orientação do EXIF antes do descarte, evitando fotos de celular deitadas.
- **Limite de envio**: Subiu de 10 MB para 25 MB por arquivo. O limite apertado empurrava o usuário a comprimir por fora antes de enviar, que era outra fonte de degradação. Arquivos acima do limite passam a responder 413 com mensagem clara em vez de "Erro interno do servidor".

---

## 2026-08-17 - feat: fundação do Cloudflare R2 para armazenamento de imagens

### Arquivos Modificados
- `api/src/server.ts` [Origem do R2 liberada no `img-src` da CSP, derivada de `R2_PUBLIC_URL`]
- `api/src/scripts/test-r2.ts` [Movido de `scripts/` e reescrito: valida upload, leitura pública e exclusão]
- `api/src/routes/upload.routes.ts` [Log da causa real na falha de exclusão no R2]
- `api/package.json` [Script `npm run test:r2`]

### Detalhes das Alterações
- **CSP**: O `img-src` não incluía o domínio do R2, então toda imagem vinda de lá seria bloqueada pelo navegador — com o backend respondendo normalmente e nenhum erro no log. A origem passa a ser derivada de `R2_PUBLIC_URL`, acompanhando o bucket de cada ambiente em vez de fixar domínio no código.
- **Diagnóstico**: O script de teste ficava fora de `rootDir` (`scripts/` contra `src/`) e não compilava. Movido para `src/scripts/`, seguindo a convenção já usada pelos demais scripts em TypeScript.
- **Verificação de leitura pública**: O teste anterior apagava o arquivo antes de conferir se a URL pública servia o conteúdo. Como credenciais válidas fazem o upload funcionar mesmo com o bucket fechado, essa falha só apareceria como 404 no navegador do visitante. O teste passou a baixar o arquivo e comparar o conteúdo antes de excluir.
- **Exclusão**: A falha ao remover do R2 era capturada e descartada sem registrar a causa. Agora o motivo é logado junto da chave, para permitir limpeza de objetos órfãos no bucket.
- **Validação**: Ciclo completo exercitado contra o bucket real — upload de imagem pela API, conversão para WebP, leitura pública (HTTP 200, `image/webp`) e exclusão confirmada por 404.

---

## 2026-08-06 - feat: expiração de 2h do PIX com cancelamento da cobrança no PagHiper

### Arquivos Modificados
- `api/src/jobs/expirar-pix.job.ts` [Novo: regra de expiração e varredura automática de cobranças vencidas]
- `api/src/config/paghiper.ts` [Nova função `cancelarCobrancaPixPagHiper`]
- `api/src/routes/pagamento.routes.ts` [Gravação de `pixExpiraEm`, expiração sob demanda na consulta de status e cancelamento no gateway ao cancelar o pedido]
- `api/src/server.ts` [Início da varredura no boot]
- `api/prisma/schema.prisma` e `api/prisma/migration-add-pix-expira-em.sql` [Campo `pixExpiraEm` com índice]
- `api/public/cliente/js/pagamento.js` [Contagem regressiva passa a usar o prazo devolvido pelo servidor]
- `api/.env.example` e `api/RAILWAY-VARIABLES.md` [Documentada a variável `PIX_EXPIRACAO_MINUTOS`]

### Detalhes das Alterações
- **Prazo de 2h**: O PagHiper conta vencimento em dias (`days_due_date`), então não é possível emitir um PIX de 2 horas. A cobrança continua nascendo com 1 dia e passa a ser invalidada no gateway pelo nosso servidor ao fim do prazo, via `POST /invoice/cancel/`.
- **Independência do Navegador**: Antes o prazo existia apenas como temporizador na página — se o cliente fechasse a aba, nada expirava e o PIX seguia pagável. Uma varredura roda a cada 10 minutos no processo da API e trata os vencidos, com uma passada no boot para limpar o que venceu enquanto o serviço esteve fora.
- **Corrida com o Pagamento**: Antes de cancelar, o status é consultado no gateway. Se o pagamento entrou no limite do prazo, o pedido é confirmado como PAGO em vez de expirado — cancelar às cegas tiraria a vaga de quem já pagou. A mesma checagem foi aplicada ao botão de cancelar do cliente.
- **Falha Segura**: Se o cancelamento no gateway falhar, o pedido permanece pendente e é reprocessado na varredura seguinte. Marcá-lo como expirado sem confirmar o cancelamento deixaria uma cobrança pagável sem pedido correspondente.
- **Status EXPIRADO**: Pedidos vencidos passam a usar `EXPIRADO` em vez de `CANCELADO`, distinguindo prazo esgotado de desistência. O status já era suportado pelos painéis e libera a vaga da mesma forma.
- **Preservação do EXPIRADO** (encontrado em teste real): ao cancelar a cobrança no gateway, o PagHiper notifica de volta o nosso próprio cancelamento com status `canceled`. O webhook sobrescrevia `EXPIRADO` por `CANCELADO` segundos depois, apagando a distinção recém-criada. O mapeamento passa a preservar `EXPIRADO`.
- **Prazo Único**: `pixExpiraEm` é gravado no pedido e devolvido pela API; a contagem regressiva da tela deriva dele, eliminando a duplicação do prazo no JavaScript.

---
