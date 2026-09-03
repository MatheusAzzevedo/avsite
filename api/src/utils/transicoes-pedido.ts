/**
 * Explicação do Arquivo [transicoes-pedido.ts]
 *
 * Avalia o que acontece ao mudar o status de um pedido.
 *
 * Por que existe: mudar status não é editar um campo. Status decide se a vaga
 * está reservada ou de volta no estoque, aparece nas listas enviadas à escola e
 * convive com dinheiro que já entrou por um gateway. Um seletor que aceita
 * qualquer valor esconde essas consequências de quem opera.
 *
 * Aqui as regras ficam num lugar só, usadas por duas pontas:
 * - a rota que monta o modal, para exibir cada opção já avaliada;
 * - a rota que grava, para recusar o que não é permitido.
 *
 * Regra que não pode ser quebrada: as duas pontas precisam usar esta mesma
 * função. Regra que só existe na tela não é regra — basta uma chamada direta à
 * API para furá-la.
 */

import { PedidoStatus } from '@prisma/client';

/** Status em que o pedido segura uma vaga da excursão. */
export const STATUS_QUE_OCUPAM_VAGA: PedidoStatus[] = [
  'PENDENTE',
  'AGUARDANDO_PAGAMENTO',
  'PAGO',
  'CONFIRMADO'
];

/** Status terminais, em que a vaga volta para o estoque. */
export const STATUS_QUE_LIBERAM_VAGA: PedidoStatus[] = ['CANCELADO', 'EXPIRADO'];

/** Status que representam dinheiro reconhecido. */
export const STATUS_DE_PAGAMENTO: PedidoStatus[] = ['PAGO', 'CONFIRMADO'];

/**
 * Status que afirmam que o pagamento ainda não aconteceu.
 *
 * Só ao cair num destes as datas de pagamento e confirmação deixam de fazer
 * sentido. `CANCELADO` e `EXPIRADO` encerram o pedido, mas não desfazem o fato
 * de o dinheiro ter entrado — e apagar a data ali destrói justamente a evidência
 * que permite achar depois um pedido pago que foi cancelado por engano.
 */
export const STATUS_ANTES_DO_PAGAMENTO: PedidoStatus[] = ['PENDENTE', 'AGUARDANDO_PAGAMENTO'];

export const TODOS_OS_STATUS: PedidoStatus[] = [
  'PENDENTE',
  'AGUARDANDO_PAGAMENTO',
  'PAGO',
  'CONFIRMADO',
  'CANCELADO',
  'EXPIRADO'
];

/**
 * Confirmações que o operador precisa marcar explicitamente.
 *
 * São enviadas de volta na gravação: sem o token correspondente, a rota recusa.
 * Serve para que a consequência tenha sido lida, e não apenas clicada.
 */
export type TokenConfirmacao =
  | 'sem_vaga'
  | 'dinheiro_reconhecido'
  | 'sem_confirmacao_gateway';

export type Veredito = 'atual' | 'permitido' | 'exige_confirmacao' | 'bloqueado';

export interface OpcaoStatus {
  status: PedidoStatus;
  rotulo: string;
  veredito: Veredito;
  /** Frases já prontas para a tela, específicas deste pedido. */
  motivos: string[];
  /** Tokens que a gravação vai exigir. Vazio quando não há risco. */
  confirmacoes: TokenConfirmacao[];
}

/** Retrato do pedido e da excursão no momento da avaliação. */
export interface ContextoTransicao {
  statusAtual: PedidoStatus;
  quantidade: number;
  valorTotal: number;
  dataPagamento: Date | null;
  dataConfirmacao: Date | null;
  /** Total de vagas da excursão. `null` = ilimitada. */
  vagasTotais: number | null;
  /** Vagas ocupadas por outros pedidos, sem contar este. */
  vagasOcupadasPorOutros: number;
  /**
   * O que se sabe da cobrança no gateway.
   *
   * As três situações são distintas e levam a frases diferentes: não ter
   * cobrança nenhuma é normal (venda manual, por exemplo), enquanto a consulta
   * falhar é uma informação que faltou. Tratar as duas como "não foi possível
   * consultar" faria o operador procurar problema onde não há.
   */
  gateway:
    | { situacao: 'sem_cobranca' }
    | { situacao: 'indisponivel' }
    | {
        situacao: 'consultado';
        reconheceuPagamento: boolean;
        cobrancaAtiva: boolean;
        statusBruto: string;
      };
}

const ROTULOS: Record<PedidoStatus, string> = {
  PENDENTE: 'Pendente',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PAGO: 'Pago',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  EXPIRADO: 'Expirado'
};

/**
 * Explicação da função [formatarDinheiro]
 * Formata em reais para as frases exibidas ao operador.
 */
function formatarDinheiro(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Explicação da função [formatarData]
 * Data curta (DD/MM/AAAA) para as frases exibidas ao operador.
 */
function formatarData(data: Date): string {
  return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

/**
 * Explicação da função [vagasLivres]
 * Vagas ainda disponíveis, desconsiderando este pedido. `null` = ilimitadas.
 */
export function vagasLivres(contexto: ContextoTransicao): number | null {
  if (contexto.vagasTotais === null) return null;
  return contexto.vagasTotais - contexto.vagasOcupadasPorOutros;
}

/**
 * Explicação da função [avaliarTransicao]
 * Avalia um destino específico e devolve veredito, motivos e confirmações.
 *
 * Quatro verificações independentes, cada uma disparando só no movimento em que
 * faz sentido:
 * 1. Vaga — ao sair de um status terminal para um ativo, que é o único caminho
 *    que reocupa vaga.
 * 2. Dinheiro reconhecido — ao mandar para terminal um pedido já pago.
 * 3. Gateway — ao afirmar pagamento que o gateway não confirma, ou ao cancelar
 *    com cobrança ainda viva.
 * 4. Datas — ao voltar para antes do pagamento, as datas registradas caem.
 */
export function avaliarTransicao(
  destino: PedidoStatus,
  contexto: ContextoTransicao
): OpcaoStatus {
  const rotulo = ROTULOS[destino];

  if (destino === contexto.statusAtual) {
    return { status: destino, rotulo, veredito: 'atual', motivos: ['Status atual do pedido.'], confirmacoes: [] };
  }

  const motivos: string[] = [];
  const confirmacoes: TokenConfirmacao[] = [];
  let bloqueado = false;

  const ocupaHoje = STATUS_QUE_OCUPAM_VAGA.includes(contexto.statusAtual);
  const destinoOcupa = STATUS_QUE_OCUPAM_VAGA.includes(destino);
  const destinoLibera = STATUS_QUE_LIBERAM_VAGA.includes(destino);

  // 1. Vaga — só quando o pedido volta a ocupar uma que já havia devolvido.
  if (destinoOcupa && !ocupaHoje) {
    const livres = vagasLivres(contexto);
    if (livres === null) {
      motivos.push('A excursão não tem limite de vagas.');
    } else if (livres < contexto.quantidade) {
      bloqueado = true;
      confirmacoes.push('sem_vaga');
      const faltam = contexto.quantidade - livres;
      const plural = (n: number, singular: string, pluralForma: string) =>
        `${n} ${n === 1 ? singular : pluralForma}`;
      motivos.push(
        `Não há vaga: a excursão tem ${plural(contexto.vagasTotais as number, 'vaga', 'vagas')} e ` +
        `${plural(contexto.vagasOcupadasPorOutros, 'ocupada', 'ocupadas')} por outros pedidos. ` +
        `Reativar este pedido (${plural(contexto.quantidade, 'vaga', 'vagas')}) excederia o limite em ${faltam}.`
      );
    } else {
      motivos.push(
        `A vaga volta a ser ocupada. Restam ${livres}; ficariam ${livres - contexto.quantidade}.`
      );
    }
  }

  // 2. Dinheiro reconhecido saindo para um status terminal.
  if (destinoLibera && contexto.dataPagamento) {
    confirmacoes.push('dinheiro_reconhecido');
    motivos.push(
      `Este pedido tem ${formatarDinheiro(contexto.valorTotal)} recebidos em ${formatarData(contexto.dataPagamento)}. ` +
      'Mudar o status NÃO estorna nada — o estorno é feito no painel do gateway.'
    );
  }

  // 3. O que o gateway diz. Só entra onde muda a decisão: afirmar pagamento e
  // encerrar o pedido. Nos demais destinos seria ruído repetido em toda opção.
  const gw = contexto.gateway;

  if (destino === 'PAGO') {
    if (gw.situacao === 'consultado' && !gw.reconheceuPagamento) {
      confirmacoes.push('sem_confirmacao_gateway');
      motivos.push(
        `O gateway não reconhece pagamento para esta cobrança (status atual: ${gw.statusBruto}). ` +
        'Marcar como Pago registra um recebimento feito por fora do sistema.'
      );
    } else if (gw.situacao === 'sem_cobranca') {
      confirmacoes.push('sem_confirmacao_gateway');
      motivos.push(
        'Não há cobrança registrada em gateway para este pedido. ' +
        'Marcar como Pago registra um recebimento feito por fora do sistema.'
      );
    } else if (gw.situacao === 'indisponivel') {
      confirmacoes.push('sem_confirmacao_gateway');
      motivos.push(
        'Não foi possível consultar o gateway agora, então não dá para verificar se o pagamento entrou.'
      );
    }
  }

  if (destinoLibera) {
    if (gw.situacao === 'consultado' && gw.cobrancaAtiva) {
      motivos.push('Existe cobrança ativa no gateway; ela será invalidada junto, para o cliente não conseguir pagá-la depois.');
    } else if (gw.situacao === 'indisponivel') {
      motivos.push('Não foi possível consultar o gateway agora; se houver cobrança ativa, ela pode continuar pagável.');
    }
  }

  // 4. Datas que deixam de fazer sentido — só ao voltar para antes do pagamento.
  if (STATUS_ANTES_DO_PAGAMENTO.includes(destino)) {
    if (contexto.dataPagamento) {
      motivos.push(`A data de pagamento registrada (${formatarData(contexto.dataPagamento)}) será removida.`);
    }
    if (contexto.dataConfirmacao) {
      motivos.push(`A data de confirmação registrada (${formatarData(contexto.dataConfirmacao)}) será removida.`);
    }
  }

  // Liberar a vaga é sempre digno de nota: ela volta ao estoque na hora.
  if (destinoLibera && ocupaHoje) {
    motivos.push('A vaga volta para o estoque e pode ser comprada por outra pessoa.');
  }

  if (motivos.length === 0) {
    motivos.push('Sem consequências além da mudança de status.');
  }

  const veredito: Veredito = bloqueado
    ? 'bloqueado'
    : confirmacoes.length > 0
      ? 'exige_confirmacao'
      : 'permitido';

  return { status: destino, rotulo, veredito, motivos, confirmacoes };
}

/**
 * Explicação da função [avaliarTodasAsTransicoes]
 * Avalia os seis status de uma vez, na ordem em que a tela os exibe.
 */
export function avaliarTodasAsTransicoes(contexto: ContextoTransicao): OpcaoStatus[] {
  return TODOS_OS_STATUS.map((status) => avaliarTransicao(status, contexto));
}
