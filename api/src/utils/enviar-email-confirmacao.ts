/**
 * Explicação do Arquivo [enviar-email-confirmacao.ts]
 * 
 * Função que orquestra o envio do e-mail de "Confirmação de Inscrição"
 * após o pagamento de um pedido ser confirmado pelo Asaas.
 * 
 * Fluxo:
 * 1. Busca pedido completo no banco (com cliente, itens, excursão)
 * 2. Monta os dados para o template
 * 3. Gera o HTML do e-mail
 * 4. Envia via serviço de e-mail
 * 5. Registra log de sucesso ou falha
 * 
 * Chamada por:
 * - webhook.routes.ts (quando Asaas notifica pagamento confirmado)
 * - pagamento.routes.ts (quando polling detecta pagamento confirmado)
 */

import { prisma } from '../config/database';
import { logger } from './logger';
import { enviarEmail } from './email-service';
import {
  gerarTemplateConfirmacaoPedido,
  gerarTextoConfirmacaoPedido,
  DadosEmailConfirmacao
} from '../templates/email-confirmacao-pedido';

/**
 * Explicação da função [enviarEmailConfirmacaoPedido]:
 * Busca os dados completos do pedido e envia o e-mail de confirmação.
 * 
 * Esta função é "fire-and-forget": não lança exceção em caso de falha,
 * apenas registra o erro no log. Isso evita que uma falha no envio de e-mail
 * afete o fluxo principal (webhook/polling).
 * 
 * @param pedidoId - ID do pedido que teve pagamento confirmado
 */
export async function enviarEmailConfirmacaoPedido(pedidoId: string): Promise<void> {
  try {
    logger.info('[Email Confirmação] 🔄 ETAPA 1/5 — Iniciando fluxo de e-mail de confirmação', {
      context: { pedidoId }
    });

    // 1. Busca pedido completo no banco
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        cliente: true,
        itens: true,
        excursaoPedagogica: true,
        excursao: true
      }
    });

    if (!pedido) {
      logger.error('[Email Confirmação] ❌ ETAPA 1 FALHOU — Pedido não encontrado no banco', {
        context: { pedidoId }
      });
      return;
    }

    logger.info('[Email Confirmação] ✅ ETAPA 1/5 — Pedido encontrado no banco', {
      context: {
        pedidoId,
        clienteId: pedido.clienteId,
        clienteEmail: pedido.cliente.email,
        clienteNome: pedido.cliente.nome,
        status: pedido.status,
        tipo: pedido.tipo,
        quantidade: pedido.quantidade,
        totalItens: pedido.itens.length,
        temExcursaoPedagogica: !!pedido.excursaoPedagogica,
        temExcursaoConvencional: !!pedido.excursao,
        temDadosResponsavel: !!pedido.dadosResponsavelFinanceiro,
        metodoPagamento: pedido.metodoPagamento
      }
    });

    // 2. Determina o e-mail do destinatário
    // Prioridade: e-mail do responsável financeiro > e-mail do cliente
    const dadosResponsavel = pedido.dadosResponsavelFinanceiro as Record<string, string> | null;
    const emailDestinatario = dadosResponsavel?.email || pedido.cliente.email;

    if (!emailDestinatario) {
      logger.error('[Email Confirmação] ❌ ETAPA 2 FALHOU — Nenhum e-mail de destinatário encontrado', {
        context: {
          pedidoId,
          clienteId: pedido.clienteId,
          clienteEmail: pedido.cliente.email || 'VAZIO',
          responsavelEmail: dadosResponsavel?.email || 'VAZIO'
        }
      });
      return;
    }

    logger.info('[Email Confirmação] ✅ ETAPA 2/5 — Destinatário definido', {
      context: {
        pedidoId,
        emailDestinatario,
        fonte: dadosResponsavel?.email ? 'responsavelFinanceiro' : 'cliente'
      }
    });

    // 3. Determina o nome do produto
    const nomeProduto = pedido.excursaoPedagogica?.titulo
      || pedido.excursao?.titulo
      || 'Viagem pedagógica';

    logger.info('[Email Confirmação] ✅ ETAPA 3/5 — Dados do produto identificados', {
      context: {
        pedidoId,
        nomeProduto,
        valorTotal: Number(pedido.valorTotal),
        quantidade: pedido.quantidade
      }
    });

    // 4. Monta dados do endereço de cobrança
    const endereco = dadosResponsavel ? {
      nome: dadosResponsavel.nome || dadosResponsavel.nomeCompleto || pedido.cliente.nome,
      sobrenome: dadosResponsavel.sobrenome || '',
      rua: dadosResponsavel.endereco || dadosResponsavel.rua || '',
      numero: dadosResponsavel.numero || '',
      complemento: dadosResponsavel.complemento || '',
      cidade: dadosResponsavel.cidade || '',
      estado: dadosResponsavel.estado || '',
      cep: dadosResponsavel.cep || '',
      telefone: dadosResponsavel.telefone || pedido.cliente.telefone || '',
      email: dadosResponsavel.email || pedido.cliente.email
    } : undefined;

    // 5. Monta dados dos estudantes
    const estudantes = pedido.itens.map((item) => ({
      nomeAluno: item.nomeAluno,
      dataNascimento: item.dataNascimento
        ? item.dataNascimento.toISOString().split('T')[0]
        : undefined,
      cpfAluno: item.cpfAluno || undefined,
      rgAluno: item.rgAluno || undefined,
      serieAluno: item.serieAluno || undefined,
      turma: item.turma || undefined,
      alergiasCuidados: item.alergiasCuidados || undefined
    }));

    // 6. Monta dados completos para o template
    const dadosEmail: DadosEmailConfirmacao = {
      numeroPedido: pedido.id,
      dataPedido: pedido.createdAt,
      nomeCliente: dadosResponsavel?.nome || pedido.cliente.nome,
      nomeProduto,
      quantidade: pedido.quantidade,
      valorUnitario: Number(pedido.valorUnitario),
      valorTotal: Number(pedido.valorTotal),
      metodoPagamento: pedido.metodoPagamento || 'pix',
      observacoes: pedido.observacoes || undefined,
      estudantes,
      endereco
    };

    // 7. Gera HTML e texto do e-mail
    logger.info('[Email Confirmação] 🔄 ETAPA 4/5 — Gerando template HTML do e-mail', {
      context: {
        pedidoId,
        totalEstudantes: estudantes.length,
        temEndereco: !!endereco
      }
    });

    const html = gerarTemplateConfirmacaoPedido(dadosEmail);
    const texto = gerarTextoConfirmacaoPedido(dadosEmail);

    logger.info('[Email Confirmação] ✅ ETAPA 4/5 — Template gerado', {
      context: {
        pedidoId,
        htmlLength: html.length,
        textoLength: texto.length
      }
    });

    // 8. Envia o e-mail
    logger.info('[Email Confirmação] 🔄 ETAPA 5/5 — Enviando e-mail via SMTP', {
      context: {
        pedidoId,
        para: emailDestinatario,
        assunto: `Confirmação de Inscrição - Pedido ${pedido.id.substring(0, 8)}`,
        smtpHost: process.env.SMTP_HOST || 'smtp.hostinger.com',
        smtpUser: process.env.SMTP_USER || 'NÃO CONFIGURADO'
      }
    });

    const resultado = await enviarEmail({
      para: emailDestinatario,
      assunto: `Confirmação de Inscrição - Pedido ${pedido.id.substring(0, 8)}`,
      html,
      texto
    });

    if (resultado.success) {
      logger.info('[Email Confirmação] ✅ ETAPA 5/5 — E-mail enviado com SUCESSO', {
        context: {
          pedidoId,
          para: emailDestinatario,
          messageId: resultado.messageId,
          nomeProduto,
          valorTotal: Number(pedido.valorTotal)
        }
      });
    } else {
      logger.error('[Email Confirmação] ❌ ETAPA 5 FALHOU — E-mail NÃO foi enviado', {
        context: {
          pedidoId,
          para: emailDestinatario,
          error: resultado.error,
          smtpHost: process.env.SMTP_HOST || 'smtp.hostinger.com',
          smtpUser: process.env.SMTP_USER || 'NÃO CONFIGURADO',
          smtpPort: process.env.SMTP_PORT || '465'
        }
      });
    }
  } catch (error) {
    // Fire-and-forget: não lança exceção, apenas registra no log
    logger.error('[Email Confirmação] ❌ ERRO INESPERADO no fluxo de e-mail', {
      context: {
        pedidoId,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined
      }
    });
  }
}
