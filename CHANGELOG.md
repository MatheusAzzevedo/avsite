# Changelog

## 2026-08-20 - feat: migrar imagens das excursões pedagógicas para o Cloudflare R2

### Arquivos Modificados
- `api/public/admin/js/excursao-pedagogica-editor.js` [Capa, imagem principal e galeria enviadas ao R2]
- `api/src/scripts/migrar-imagens-r2.ts` [Novos alvos: capa, imagem principal e galeria das pedagógicas]

### Detalhes das Alterações
- **Maior volume até aqui**: 13 registros no banco local somavam **55 MB** apenas nas colunas `imagemCapa` e `imagemPrincipal`. Após a migração, essas colunas somam **2.645 bytes**. A listagem pública dos 13 registros passou a pesar 5,2 KB — em produção, uma amostra de apenas 5 registros pesava 1,5 MB.
- **Documento já resolvido**: O envio de documento desta tela já usava `UploadManager.uploadDocument` e passou a funcionar na fase 1, quando o download foi corrigido. Não precisou de alteração.
- **Um handler para dois campos**: `handleImageUploadPedagogica` recebe os ids por parâmetro e serve tanto à capa quanto à imagem principal, então a troca cobriu os dois de uma vez.
- **Recodificação nem sempre reduz**: Das 12 capas migradas, 5 ficaram maiores — por exemplo 330 KB → 438 KB. São imagens já comprimidas e abaixo do teto de 1920px, onde recodificar em WebP com qualidade 90 custa bytes. O saldo continua muito positivo (as duas rodadas somaram ~34 MB a menos no banco), porque os ganhos vêm dos arquivos grandes: 20.369 KB → 590 KB e 7.264 KB → 390 KB. O ganho principal, de qualquer forma, é o campo do banco deixar de carregar a imagem inteira.
- **Validação em navegador real**: A página de detalhes da excursão na área do cliente renderiza as imagens do R2, sem Base64. No editor do admin, capa de 2800x1800, imagem principal de 2200x1500 e três imagens de galeria enviadas de uma vez chegaram como URL, com as prévias renderizadas.

---

## 2026-08-20 - feat: migrar capa e galeria do blog para o Cloudflare R2

### Arquivos Modificados
- `api/public/admin/js/blog-editor.js` [Capa e galeria enviadas ao R2 em vez de convertidas para Base64]
- `api/src/scripts/migrar-imagens-r2.ts` [Novos alvos: capa do post e tabela de galeria]

### Detalhes das Alterações
- **Primeira tela com galeria**: Além da capa, o post tem até 4 imagens na tabela `post_imagens`. O envio múltiplo usa `enviarVarias`, que sobe em sequência e informa qual arquivo está indo — em paralelo, várias fotos grandes saturam a conexão e todas demoram mais.
- **Limite da galeria respeitado antes do envio**: Só as imagens que cabem nas vagas restantes são enviadas. Antes, cada arquivo era lido e descartado depois; agora o excesso nem sobe, e o usuário é avisado de quantas couberam.
- **Falha isolada**: Um arquivo que falha não derruba os demais do lote, e o erro é mostrado com o nome do arquivo.
- **Migração de tabela relacionada**: O script passou a cobrir `PostImagem.url`, onde cada linha é uma imagem. O formato de alvo já existente serviu sem alteração — o "registro" passa a ser a própria imagem, rotulada com o título do post e a ordem.
- **Resultado medido**: A listagem pública do blog caiu de **489.300 para 1.700 bytes**, uma redução de 288 vezes. As 4 imagens de galeria somadas caíram de 251 KB para 118 KB.
- **Recodificação pode inflar**: Uma capa de 26 KB virou 38 KB. Recodificar uma origem pequena já comprimida custa bytes; em valor absoluto é irrelevante, e o ganho real está no campo do banco, que deixa de carregar a imagem inteira.
- **Validação em navegador real**: Listagem e post individual renderizam tudo do R2, com zero Base64 e os 4 links de galeria funcionando. No editor, uma capa de 2600x1700 e três imagens de galeria enviadas de uma vez chegaram como URL; com 3 já na galeria, um lote de 3 novas adicionou apenas 1, respeitando o teto de 4 sem desperdiçar envios.

---

## 2026-08-20 - feat: migrar as fotos de Autores do Base64 para o Cloudflare R2

### Arquivos Modificados
- `api/public/admin/js/autores.js` [Foto enviada ao R2 em vez de convertida para Base64]

### Detalhes das Alterações
- **Segundo domínio migrado**: A foto do autor passa a ser enviada ao R2, com o campo guardando apenas a URL. O salvamento não mudou, porque já lia `fotoUrl.value`.
- **Limite local removido**: A tela rejeitava acima de 5 MB, contra os 25 MB do servidor. O teto mais apertado no navegador levava o usuário a comprimir a imagem por fora antes de enviar.
- **Onde a tela vive**: Não existe `autores.html`. O `autores.js` é carregado por `blog.html`, e o formulário de autor é um modal dentro dessa página. A verificação inicial falhou por procurar numa página inexistente.
- **Resultado medido**: Foto de 286 KB em Base64 virou 32 KB no R2. Na resposta pública de posts, o campo do autor caiu para 101 caracteres.
- **Validação em navegador real**: Os cards do blog renderizam o avatar do autor vindo do R2. Pelo modal em `blog.html`, um PNG de 3000x2000 enviado pelo seletor de arquivo real chegou ao campo como URL e a prévia carregou em 1920x1280.
- **Pendente para a fase 5**: As capas dos posts continuam em Base64 — uma delas com 441 KB —, o que ainda domina o peso da listagem do blog.

---

## 2026-08-19 - feat: migrar as fotos da Equipe do Base64 para o Cloudflare R2

### Arquivos Modificados
- `api/public/admin/js/equipe.js` [Foto enviada ao R2 em vez de convertida para Base64]
- `api/src/scripts/migrar-imagens-r2.ts` [Novo: migração do acervo, com simulação e verificação]
- `api/public/admin/js/admin-main.js` [Container do `preencherCampo` passa a cair no próprio elemento de prévia]
- `api/package.json` [Script `npm run migrar:imagens`]

### Detalhes das Alterações
- **Primeiro domínio migrado**: A tela de Equipe passa a enviar a foto para o R2 e gravar apenas a URL. O salvamento não mudou, porque já lia o valor do mesmo campo escondido.
- **Limite local removido**: A tela rejeitava acima de 5 MB, sendo que o servidor aceita 25 MB. O teto mais apertado no navegador levava o usuário a comprimir a foto por fora antes de enviar, degradando-a antes de o sistema ver o arquivo.
- **Script de migração idempotente**: Registros cujo campo já é URL são ignorados, então a execução pode ser interrompida e repetida sem duplicar objetos no bucket.
- **Verificação antes de descartar o original**: Cada imagem é enviada, lida de volta pela URL pública e conferida antes de o banco ser atualizado. Sem isso, uma falha silenciosa deixaria o registro apontando para uma imagem inexistente, com o Base64 já perdido. Uma falha mantém o registro intacto para nova tentativa.
- **Simulação por padrão**: Sem `--aplicar`, o script apenas relata o que faria.
- **Resultado medido**: A foto de 286 KB em Base64 virou 32 KB no R2. A resposta de `/api/public/equipe` caiu de cerca de 292 KB para 235 bytes, e o campo do banco de ~292 mil caracteres para 100.
- **Validação em navegador real**: A página "Sobre Nós" renderiza a foto vinda do R2, sem nenhum Base64 restante. Pela tela do admin, um PNG de 2400x1600 enviado pelo seletor de arquivo real chegou ao campo como URL e a prévia carregou em 1920x1280.

---

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
