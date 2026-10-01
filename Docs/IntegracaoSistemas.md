# Integração Avoar (Site - Sistema)

## Caminho em etapas, cada uma entregável sozinha

1. **Lista de chamada automática:** quando um pedido é pago no site, o aluno entra na lista de chamada do Registro com o mesmo código, já marcado como pago. Na minha leitura, é a etapa de maior valor e a mais simples.

2. **Cadastro único da excursão:** criar o Registro na gestão gera a excursão no site, ou o contrário, para não cadastrar duas vezes.

3. **Vagas e financeiro:** a gestão passa a ver quantos alunos pagaram e quanto entrou, lendo do site.

4. **Só depois, se ainda fizer sentido:** levar o painel administrativo do site para dentro da gestão, deixando no Express apenas o site público e o checkout. Isso seria uma unificação gradual, sem uma reescrita de uma vez.


## Uma etapa por vez:

### Etapa 1: aluno pago entra na lista de chamada

- Quando um pedido fica PAGO ou CONFIRMADO, o site chama uma API nova na gestão, protegida por uma chave compartilhada entre os dois servidores. Nenhum sistema acessa o banco do outro.

- A gestão encontra o Registro pelo codigoExcursao e cria um Participante por aluno, com pagou = true.

- Os campos se correspondem quase um a um: nomeAluno → nome, serieAluno → serie, turma → turma, unidadeColegio → unidade, cpfAluno → cpf, telefoneResponsavel → telefone.

- Se a chamada falhar, o site registra no histórico do pedido e tenta de novo. A integração nunca bloqueia o pagamento.

### Etapa 2: cadastro único da excursão

A gestão tem os dados operacionais: código, destino, datas, preço e colégio. Não tem o que o site mostra ao público: título, fotos, descrição, inclusos. Por isso a excursão nasceria no site como rascunho, e alguém completaria a parte de vitrine.

## Preciso de 5 respostas antes de começar a Etapa 1:

1. Onde a excursão nasce hoje? Na gestão primeiro e depois no site, ou o contrário? Isso define o sentido da Etapa 2.

2. Pedido cancelado ou estornado: o aluno sai da lista, ou fica com pagou = false?

3. Várias listas de chamada: um Registro pode ter mais de uma. Em qual o aluno entra? A primeira, ou uma lista específica para o site?

4. Excursões já em andamento: levo os alunos já pagos para as listas atuais, ou só os pedidos novos?

5. Só excursões pedagógicas? As convencionais não têm código, então presumo que ficam de fora.