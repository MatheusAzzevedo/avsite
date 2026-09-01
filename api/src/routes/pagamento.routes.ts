/**
 * Explicação do Arquivo [pagamento.routes.ts]
 * 
 * Rotas de pagamento. Dois gateways convivem:
 * - PIX: PagHiper
 * - Cartão de crédito: Asaas
 *
 * Rotas disponíveis:
 * - POST /api/cliente/pagamento/pix - Criar cobrança PIX (PagHiper)
 * - POST /api/cliente/pagamento/cartao - Pagar com cartão de crédito
 * - GET /api/cliente/pagamento/:pedidoId/status - Consultar status do pagamento
 * - POST /api/webhooks/asaas - Webhook do Asaas (público)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { clienteAuthMiddleware } from '../middleware/cliente-auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { 
  criarPagamentoPixSchema,
  criarPagamentoCartaoSchema,
  asaasWebhookSchema
} from '../schemas/pagamento.schema';
import { 
  criarCobrancaAsaas,
  criarCobrancaCartaoAsaas,
  consultarPagamentoAsaas,
  processarWebhookAsaas,
  verificarConfigAsaas,
  listarPagamentosPorReferencia
} from '../config/asaas';
import {
  criarCobrancaPixPagHiper,
  consultarTransacaoPagHiper,
  cancelarCobrancaPixPagHiper,
  verificarConfigPagHiper
} from '../config/paghiper';
import {
  calcularExpiracaoPix,
  expirarPedidoPix,
  PIX_EXPIRACAO_MINUTOS
} from '../jobs/expirar-pix.job';
import { logger } from '../utils/logger';
import { enviarEmailConfirmacaoPedido } from '../utils/enviar-email-confirmacao';

const router = Router();

/**
 * Explicação da API [POST /api/cliente/pagamento/pix]
 * 
 * Cria cobrança PIX para um pedido.
 * Requer autenticação de cliente.
 * 
 * Fluxo:
 * 1. Valida pedido (existe, pertence ao cliente, status PENDENTE)
 * 2. Cria cobrança no PagHiper
 * 3. Atualiza pedido com código de pagamento
 * 4. Retorna QR Code PIX e dados da cobrança
 * 
 * Body: { pedidoId: string }
 * Response: { success, data: { qrCode, qrCodeImage, valor, ... } }
 */
router.post('/pix',
  clienteAuthMiddleware,
  validateBody(criarPagamentoPixSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pedidoId } = req.body;
      const clienteId = req.cliente!.id;
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

      logger.info('[Pagamento PIX] Criando cobrança PIX', {
        context: { pedidoId, clienteId, ip: clientIp }
      });

      // Verifica configuração PagHiper
      if (!verificarConfigPagHiper()) {
        throw ApiError.internal('Gateway de pagamento PagHiper não configurado');
      }

      // Busca pedido com seus itens para extrair dados do responsável
      const pedido = await prisma.pedido.findFirst({
        where: {
          id: pedidoId,
          clienteId // Garante que pedido pertence ao cliente
        },
        include: {
          cliente: true,
          itens: true, // Incluir itens para acessar dados do responsável
          excursaoPedagogica: true,
          excursao: true
        }
      });

      if (!pedido) {
        logger.warn('[Pagamento PIX] Pedido não encontrado', {
          context: { pedidoId, clienteId }
        });
        throw ApiError.notFound('Pedido não encontrado');
      }

      if (pedido.status !== 'PENDENTE' && pedido.status !== 'AGUARDANDO_PAGAMENTO') {
        logger.warn('[Pagamento PIX] Status do pedido não permite pagamento', {
          context: { pedidoId, status: pedido.status }
        });
        throw ApiError.badRequest(`Pedido já está com status: ${pedido.status}`);
      }

      // Extrai dados do PAGADOR para enviar ao PagHiper.
      // Excursão pedagógica: EXCLUSIVAMENTE dadosResponsavelFinanceiro (NUNCA dados do aluno).
      // Excursão convencional: dados do primeiro passageiro (passageiro = pagador).
      const primeiroItem = pedido.itens?.[0];
      if (!primeiroItem) {
        logger.error('[Pagamento PIX] Pedido sem itens', { context: { pedidoId } });
        throw ApiError.internal('Pedido não possui itens associados');
      }

      const dadosResp = pedido.dadosResponsavelFinanceiro as { cpf?: string; nome?: string; sobrenome?: string; email?: string; telefone?: string } | null;
      const isPedagogica = !!pedido.excursaoPedagogicaId;

      let cpfResponsavel: string;
      let nomeResponsavel: string;
      let emailResponsavel: string | undefined;
      let telefoneResponsavel: string | undefined;

      if (isPedagogica) {
        // Excursão pedagógica: PROIBIDO usar dados do aluno. Apenas dadosResponsavelFinanceiro.
        if (!dadosResp?.cpf || String(dadosResp.cpf).replace(/\D/g, '').length < 11) {
          logger.warn('[Pagamento PIX] Excursão pedagógica sem CPF do responsável', { context: { pedidoId } });
          return res.status(400).json({
            success: false,
            error: 'CPF do responsável financeiro é obrigatório. Verifique os dados preenchidos no pedido.'
          });
        }
        cpfResponsavel = String(dadosResp.cpf).replace(/\D/g, '');
        nomeResponsavel = [dadosResp.nome, dadosResp.sobrenome].filter(Boolean).join(' ').trim() || pedido.cliente.nome;
        emailResponsavel = dadosResp.email;
        telefoneResponsavel = dadosResp.telefone;

        logger.info('[Pagamento PIX] Usando dados do responsável financeiro (excursão pedagógica) — NUNCA dados do aluno', {
          context: { pedidoId, temCpf: cpfResponsavel.length >= 11 }
        });
      } else {
        // Convencional: passageiro é o pagador (não é "aluno" no sentido pedagógico)
        cpfResponsavel = primeiroItem.cpfAluno?.replace(/\D/g, '') ?? '';
        nomeResponsavel = primeiroItem.nomeAluno;
        emailResponsavel = primeiroItem.emailResponsavel ?? undefined;
        telefoneResponsavel = primeiroItem.telefoneResponsavel ?? undefined;

        logger.info('[Pagamento PIX] Usando dados do passageiro (excursão convencional)', {
          context: { pedidoId }
        });
      }

      // Validação: PagHiper exige CPF/CNPJ do pagador para criar cobrança PIX
      if (!cpfResponsavel || cpfResponsavel.length < 11) {
        logger.warn('[Pagamento PIX] Pagador sem CPF válido', {
          context: { pedidoId, isPedagogica, temDadosResp: !!dadosResp?.cpf }
        });
        return res.status(400).json({
          success: false,
          error: isPedagogica
            ? 'CPF do responsável financeiro é obrigatório. Verifique os dados preenchidos no pedido.'
            : 'CPF do passageiro é obrigatório. Verifique os dados preenchidos no pedido.'
        });
      }

      const tituloExcursao = pedido.excursaoPedagogica?.titulo ?? pedido.excursao?.titulo ?? 'Excursão';
      const cobranca = await criarCobrancaPixPagHiper({
        order_id: pedido.id,
        payer_email: emailResponsavel || pedido.cliente.email,
        payer_name: nomeResponsavel,
        payer_cpf_cnpj: cpfResponsavel,
        payer_phone: telefoneResponsavel || undefined,
        items: [{
          item_id: pedido.excursaoId || pedido.excursaoPedagogicaId || '1',
          description: `Excursão: ${tituloExcursao} - ${pedido.quantidade}x passagens`,
          price_cents: Math.round(Number(pedido.valorTotal) * 100),
          quantity: 1
        }]
      });

      // Atualiza pedido com código de pagamento e o prazo de validade do PIX.
      // `pixExpiraEm` é a fonte de verdade do prazo: a varredura automática e a
      // contagem regressiva do frontend derivam dele.
      const pixExpiraEm = calcularExpiracaoPix();
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          codigoPagamento: cobranca.transaction_id,
          metodoPagamento: 'pix',
          status: 'AGUARDANDO_PAGAMENTO',
          pixExpiraEm
        }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'payment_initiated',
          entity: 'pedido',
          entityId: pedido.id,
          description: `Pagamento PIX iniciado - Valor: R$ ${Number(pedido.valorTotal).toFixed(2)}`,
          userEmail: pedido.cliente.email,
          ip: clientIp
        }
      });

      logger.info('[Pagamento PIX] Cobrança PIX criada com sucesso', {
        context: {
          pedidoId,
          clienteId,
          transaction_id: cobranca.transaction_id,
          valor: Number(pedido.valorTotal),
          expiraEm: pixExpiraEm.toISOString(),
          prazoMinutos: PIX_EXPIRACAO_MINUTOS
        }
      });

      res.json({
        success: true,
        message: 'Cobrança PIX criada com sucesso',
        data: {
          pedidoId: pedido.id,
          cobrancaId: cobranca.transaction_id,
          valor: cobranca.value_cents / 100,
          qrCode: cobranca.pixData.qrCode,
          qrCodeImage: cobranca.pixData.qrCodeImage,
          invoiceUrl: cobranca.invoiceUrl,
          expiraEm: pixExpiraEm.toISOString(),
          prazoMinutos: PIX_EXPIRACAO_MINUTOS
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown';
      const pedidoIdFromBody = req.body?.pedidoId as string | undefined;

      logger.error('[Pagamento PIX] Erro ao criar cobrança', {
        context: {
          error: message,
          pedidoId: pedidoIdFromBody,
          clienteId: req.cliente?.id
        }
      });

      return res.status(400).json({ success: false, error: message });
    }
  }
);

/**
 * Explicação da API [POST /api/cliente/pagamento/cartao]
 * 
 * Processa pagamento com cartão de crédito.
 * Requer autenticação de cliente.
 * 
 * Body: { pedidoId, creditCard: {...}, creditCardHolderInfo: {...} }
 * Response: { success, message, data: { status, transactionId } }
 */
router.post('/cartao',
  clienteAuthMiddleware,
  validateBody(criarPagamentoCartaoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pedidoId, creditCard, creditCardHolderInfo, installmentCount } = req.body;
      const clienteId = req.cliente!.id;

      logger.info('[Pagamento Cartão] Processando pagamento com cartão', {
        context: { pedidoId, clienteId, parcelas: installmentCount || 1 }
      });

      if (!verificarConfigAsaas()) {
        throw ApiError.internal('Gateway de pagamento não configurado');
      }

      // Busca pedido com itens e dados do responsável
      const pedido = await prisma.pedido.findFirst({
        where: { id: pedidoId, clienteId },
        include: { cliente: true, excursaoPedagogica: true, excursao: true, itens: true }
      });

      if (!pedido) {
        throw ApiError.notFound('Pedido não encontrado');
      }

      if (pedido.status !== 'PENDENTE' && pedido.status !== 'AGUARDANDO_PAGAMENTO') {
        throw ApiError.badRequest(`Pedido já está com status: ${pedido.status}`);
      }

      // Excursão pedagógica: TODOS os dados enviados ao Asaas são do RESPONSÁVEL FINANCEIRO (PROIBIDO usar dados do aluno).
      const dadosResp = pedido.dadosResponsavelFinanceiro as {
        cpf?: string; nome?: string; sobrenome?: string; email?: string; telefone?: string;
        cep?: string; numero?: string; endereco?: string;
      } | null;
      const isPedagogica = !!pedido.excursaoPedagogicaId;
      const primeiroItem = pedido.itens?.[0];

      let clienteEmail: string;
      let clienteNome: string;
      let clienteCpf: string | undefined;
      let clienteTelefone: string | undefined;
      let creditCardHolderNameFinal: string;
      // creditCardHolderInfo: para pedagógica, SEMPRE do responsável (ignora formulário)
      let creditCardHolderInfoFinal: {
        name: string;
        email: string;
        cpfCnpj: string;
        postalCode: string;
        addressNumber: string;
        phone: string;
      };

      if (isPedagogica) {
        // Excursão pedagógica: PROIBIDO usar dados do aluno (cpfAluno, nomeAluno, etc.). Apenas dadosResponsavelFinanceiro.
        if (!dadosResp?.cpf || String(dadosResp.cpf).replace(/\D/g, '').length < 11) {
          return res.status(400).json({
            success: false,
            error: 'CPF do responsável financeiro é obrigatório. Verifique os dados preenchidos no pedido.'
          });
        }
        clienteEmail = dadosResp.email || pedido.cliente.email;
        clienteNome = [dadosResp.nome, dadosResp.sobrenome].filter(Boolean).join(' ').trim() || pedido.cliente.nome;
        clienteCpf = String(dadosResp.cpf).replace(/\D/g, '');
        clienteTelefone = dadosResp.telefone || pedido.cliente.telefone || undefined;
        // Nome no cartão: responsável (nunca do aluno)
        creditCardHolderNameFinal = clienteNome;

        const cpfDigits = String(dadosResp.cpf || '').replace(/\D/g, '');
        const cepDigits = String(dadosResp.cep || '').replace(/\D/g, '');
        const phoneDigits = String(dadosResp.telefone || '').replace(/\D/g, '');
        creditCardHolderInfoFinal = {
          name: clienteNome,
          email: clienteEmail,
          cpfCnpj: cpfDigits,
          postalCode: cepDigits,
          addressNumber: String(dadosResp.numero || '').trim() || 'S/N',
          phone: phoneDigits
        };

        logger.info('[Pagamento Cartão] Usando dados do responsável financeiro (excursão pedagógica) — NUNCA dados do aluno', {
          context: { pedidoId }
        });
      } else {
        clienteEmail = pedido.cliente.email;
        clienteNome = pedido.cliente.nome;
        clienteCpf = pedido.cliente.cpf?.replace(/\D/g, '') || primeiroItem?.cpfAluno?.replace(/\D/g, '') || undefined;
        clienteTelefone = pedido.cliente.telefone || primeiroItem?.telefoneResponsavel || undefined;
        creditCardHolderNameFinal = creditCard.holderName;
        creditCardHolderInfoFinal = {
          name: creditCardHolderInfo.name,
          email: creditCardHolderInfo.email,
          cpfCnpj: String(creditCardHolderInfo.cpfCnpj || '').replace(/\D/g, ''),
          postalCode: String(creditCardHolderInfo.postalCode || '').replace(/\D/g, ''),
          addressNumber: String(creditCardHolderInfo.addressNumber || '').trim() || 'S/N',
          phone: String(creditCardHolderInfo.phone || '').replace(/\D/g, '')
        };
      }

      const valorTotal = Number(pedido.valorTotal);
      // Asaas exige valor mínimo de R$ 5,00 para cartão de crédito (regra do gateway)
      if (valorTotal < 5) {
        return res.status(400).json({
          success: false,
          error: 'O valor mínimo para cobranças via Cartão de Crédito é R$ 5,00 (regra do gateway Asaas). Para valores menores, use PIX.'
        });
      }

      const tituloExcursao = pedido.excursaoPedagogica?.titulo ?? pedido.excursao?.titulo ?? 'Excursão';
      const descricao = `Excursão: ${tituloExcursao} - ${pedido.quantidade}x passagens`;

      const maxPermitido = isPedagogica && pedido.excursaoPedagogica?.maxInstallments
        ? pedido.excursaoPedagogica.maxInstallments
        : 1;

      if (installmentCount && installmentCount > maxPermitido) {
        return res.status(400).json({
          success: false,
          error: `Esta excursão permite no máximo ${maxPermitido}x. Você selecionou ${installmentCount}x.`
        });
      }

      const parcelas = isPedagogica && installmentCount && installmentCount >= 2
        ? installmentCount
        : undefined;

      const cobranca = await criarCobrancaCartaoAsaas({
        clienteEmail,
        clienteNome,
        clienteCpf: clienteCpf && clienteCpf.length >= 11 ? clienteCpf : undefined,
        clienteTelefone,
        valor: valorTotal,
        descricao,
        externalReference: pedido.id,
        creditCard: {
          holderName: creditCardHolderNameFinal,
          number: creditCard.number,
          expiryMonth: creditCard.expiryMonth,
          expiryYear: creditCard.expiryYear,
          ccv: creditCard.ccv
        },
        creditCardHolderInfo: creditCardHolderInfoFinal,
        installmentCount: parcelas
      });

      const statusPedido = cobranca.status === 'CONFIRMED' || cobranca.status === 'RECEIVED'
        ? 'PAGO'
        : 'AGUARDANDO_PAGAMENTO';

      // Guarda a cobrança PIX que o pedido tinha antes: ao gravar o id do Asaas
      // em `codigoPagamento`, a referência dela se perde.
      const cobrancaPixAnterior =
        pedido.metodoPagamento === 'pix' ? pedido.codigoPagamento : null;

      await prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          codigoPagamento: cobranca.id,
          metodoPagamento: 'cartao',
          status: statusPedido,
          pixExpiraEm: null,
          ...(statusPedido === 'PAGO' && { dataPagamento: new Date() })
        }
      });

      // Invalida no gateway o PIX que ficou para trás. Sem isso ele segue
      // pagável até o vencimento, e o cliente que já pagou no cartão pode pagar
      // de novo. Falha aqui não derruba o pagamento: o cartão já foi processado
      // e o pedido já está gravado.
      if (cobrancaPixAnterior && verificarConfigPagHiper()) {
        try {
          await cancelarCobrancaPixPagHiper(cobrancaPixAnterior);
          logger.info('[Pagamento Cartão] Cobrança PIX anterior cancelada no PagHiper', {
            context: { pedidoId, transactionIdPix: cobrancaPixAnterior }
          });
        } catch (error) {
          logger.error('[Pagamento Cartão] Falha ao cancelar a cobrança PIX anterior', {
            context: {
              pedidoId,
              transactionIdPix: cobrancaPixAnterior,
              error: error instanceof Error ? error.message : 'Unknown'
            }
          });
        }
      }

      logger.info('[Pagamento Cartão] Cobrança processada', {
        context: { pedidoId, cobrancaId: cobranca.id, status: cobranca.status }
      });

      // Envia e-mail de confirmação quando cartão é aprovado instantaneamente
      if (statusPedido === 'PAGO') {
        logger.info('[Pagamento Cartão] ✉️ Cartão aprovado — disparando e-mail de confirmação', {
          context: { pedidoId: pedido.id }
        });
        enviarEmailConfirmacaoPedido(pedido.id).catch((err) => {
          logger.error('[Pagamento Cartão] ❌ Erro ao disparar e-mail de confirmação', {
            context: { pedidoId: pedido.id, error: err instanceof Error ? err.message : 'Unknown' }
          });
        });
      }

      res.json({
        success: true,
        message: statusPedido === 'PAGO' ? 'Pagamento aprovado' : 'Pagamento em processamento',
        data: {
          pedidoId: pedido.id,
          cobrancaId: cobranca.id,
          status: statusPedido,
          valor: Number(pedido.valorTotal)
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown';
      const pedidoIdFromBody = req.body?.pedidoId as string | undefined;

      logger.error('[Pagamento Cartão] Erro', {
        context: {
          error: message,
          pedidoId: pedidoIdFromBody
        }
      });

      // Reconciliação: às vezes o Asaas debita o cartão mas retorna 400 (ex.: "não autorizada").
      // Consultamos pagamentos por referência e, se existir cobrança confirmada, atualizamos o pedido.
      if (pedidoIdFromBody && verificarConfigAsaas()) {
        try {
          const pagamentos = await listarPagamentosPorReferencia(pedidoIdFromBody);
          const cobrancaConfirmada = pagamentos.find(
            (p) =>
              p.status === 'CONFIRMED' ||
              p.status === 'RECEIVED' ||
              p.status === 'RECEIVED_IN_CASH' ||
              p.status === 'CONFIRMED_BY_CUSTOMER'
          );
          if (cobrancaConfirmada) {
            const pedido = await prisma.pedido.findFirst({
              where: { id: pedidoIdFromBody, clienteId: req.cliente!.id }
            });
            if (pedido) {
              await prisma.pedido.update({
                where: { id: pedido.id },
                data: {
                  codigoPagamento: cobrancaConfirmada.id,
                  metodoPagamento: 'cartao',
                  status: 'PAGO',
                  dataPagamento: new Date()
                }
              });
              logger.info('[Pagamento Cartão] Cobrança encontrada no Asaas após erro; pedido atualizado para PAGO', {
                context: { pedidoId: pedido.id, cobrancaId: cobrancaConfirmada.id }
              });
              // Dispara e-mail de confirmação (reconciliação)
              enviarEmailConfirmacaoPedido(pedido.id).catch((err) => {
                logger.error('[Pagamento Cartão] ❌ Erro ao disparar e-mail na reconciliação', {
                  context: { pedidoId: pedido.id, error: err instanceof Error ? err.message : 'Unknown' }
                });
              });
              return res.json({
                success: true,
                message: 'Pagamento confirmado. A cobrança foi processada.',
                data: {
                  pedidoId: pedido.id,
                  cobrancaId: cobrancaConfirmada.id,
                  status: 'PAGO',
                  valor: Number(pedido.valorTotal)
                }
              });
            }
          }
        } catch (reconcileErr) {
          logger.warn('[Pagamento Cartão] Reconciliação falhou', {
            context: { error: reconcileErr instanceof Error ? reconcileErr.message : 'Unknown' }
          });
        }
      }

      // Erros de validação do Asaas (valor mínimo, etc.) retornam 400
      if (error instanceof Error && /valor mínimo|mínimo|invalid|erro|recusad|recusado|não autorizada/i.test(message)) {
        return res.status(400).json({ success: false, error: message });
      }
      next(error);
    }
  }
);

/**
 * Explicação da API [POST /api/cliente/pagamento/:pedidoId/cancelar]
 *
 * Cancela um pedido pendente (PIX expirado).
 * Requer autenticação de cliente.
 * 
 * Params: { pedidoId: string }
 * Response: { success, message }
 */
router.post('/:pedidoId/cancelar',
  clienteAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pedidoId } = req.params;
      const clienteId = req.cliente!.id;

      const pedido = await prisma.pedido.findFirst({
        where: { id: pedidoId, clienteId }
      });

      if (!pedido) {
        throw ApiError.notFound('Pedido não encontrado');
      }

      if (pedido.status !== 'PENDENTE' && pedido.status !== 'AGUARDANDO_PAGAMENTO') {
        throw ApiError.badRequest(`Pedido não pode ser cancelado (status: ${pedido.status})`);
      }

      // Antes de cancelar, confirma que o pagamento não entrou nesse meio-tempo:
      // cancelar um pedido já pago deixaria o cliente sem a vaga que quitou.
      if (pedido.metodoPagamento === 'pix' && pedido.codigoPagamento && verificarConfigPagHiper()) {
        try {
          const statusGateway = await consultarTransacaoPagHiper(pedido.codigoPagamento);

          if (['paid', 'completed', 'reserved'].includes(statusGateway.status)) {
            logger.warn('[Pagamento] Cancelamento abortado: pagamento já reconhecido no gateway', {
              context: { pedidoId, statusGateway: statusGateway.status }
            });
            return res.status(400).json({
              success: false,
              error: 'O pagamento deste pedido já foi identificado. Atualize a página.'
            });
          }

          // Invalida a cobrança no PagHiper — sem isto o PIX seguiria pagável
          // até o vencimento, mesmo com o pedido cancelado aqui.
          await cancelarCobrancaPixPagHiper(pedido.codigoPagamento);
        } catch (error) {
          // Não impede o cancelamento local: a varredura tenta de novo depois.
          logger.error('[Pagamento] Falha ao cancelar cobrança no PagHiper', {
            context: {
              pedidoId,
              transactionId: pedido.codigoPagamento,
              error: error instanceof Error ? error.message : 'Unknown'
            }
          });
        }
      }

      await prisma.pedido.update({
        where: { id: pedido.id },
        data: { status: 'CANCELADO' }
      });

      logger.info('[Pagamento] Pedido cancelado por expiração do PIX', {
        context: { pedidoId, clienteId }
      });

      res.json({
        success: true,
        message: 'Pedido cancelado. O tempo para pagamento expirou.'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Explicação da API [GET /api/cliente/pagamento/:pedidoId/status]
 * 
 * Consulta status do pagamento de um pedido.
 * Requer autenticação de cliente.
 * 
 * Params: { pedidoId: string }
 * Response: { success, data: { status, codigoPagamento, ... } }
 */
router.get('/:pedidoId/status',
  clienteAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pedidoId } = req.params;
      const clienteId = req.cliente!.id;

      logger.info('[Pagamento Status] Consultando status', {
        context: { pedidoId, clienteId }
      });

      // Busca pedido
      const pedido = await prisma.pedido.findFirst({
        where: { id: pedidoId, clienteId },
        select: {
          id: true,
          status: true,
          codigoPagamento: true,
          metodoPagamento: true,
          valorTotal: true,
          dataPagamento: true,
          pixExpiraEm: true
        }
      });

      if (!pedido) {
        throw ApiError.notFound('Pedido não encontrado');
      }

      // Se tem código de pagamento, consulta gateway e confirma o pagamento
      let gatewayStatus = null;
      let statusFinal = pedido.status;

      const pixVenceu = !!pedido.pixExpiraEm && pedido.pixExpiraEm.getTime() <= Date.now();
      const aguardandoPagamento = pedido.status === 'PENDENTE' || pedido.status === 'AGUARDANDO_PAGAMENTO';

      // Prazo estourado: aplica a expiração agora, sem esperar a varredura.
      // `expirarPedidoPix` já consulta o gateway e, se o pagamento tiver entrado
      // no limite, confirma o pedido em vez de expirá-lo.
      if (pedido.metodoPagamento === 'pix' && pixVenceu && aguardandoPagamento) {
        const resultado = await expirarPedidoPix(pedido.id);

        logger.info('[Pagamento Status] Prazo do PIX vencido; expiração aplicada', {
          context: { pedidoId, resultado, expiraEm: pedido.pixExpiraEm?.toISOString() }
        });

        if (resultado === 'pago') statusFinal = 'PAGO';
        else if (resultado === 'expirado') statusFinal = 'EXPIRADO';

        return res.json({
          success: true,
          data: {
            pedidoId: pedido.id,
            status: statusFinal,
            codigoPagamento: pedido.codigoPagamento,
            metodoPagamento: pedido.metodoPagamento,
            valorTotal: Number(pedido.valorTotal),
            dataPagamento: pedido.dataPagamento,
            expiraEm: pedido.pixExpiraEm,
            gatewayStatus: null
          }
        });
      }

      if (pedido.codigoPagamento) {
        if (pedido.metodoPagamento === 'pix' && verificarConfigPagHiper()) {
          try {
            const pagHiperStatus = await consultarTransacaoPagHiper(pedido.codigoPagamento);
            gatewayStatus = pagHiperStatus.status;

            logger.info('[Pagamento Status] Status consultado no PagHiper', {
              context: { pedidoId, pagHiperStatus: gatewayStatus, statusPedido: pedido.status }
            });

            const pedidoAguardando = pedido.status === 'PENDENTE' || pedido.status === 'AGUARDANDO_PAGAMENTO';
            if ((gatewayStatus === 'paid' || gatewayStatus === 'completed' || gatewayStatus === 'reserved') && pedidoAguardando) {
              await prisma.pedido.update({
                where: { id: pedido.id },
                data: {
                  status: 'PAGO',
                  dataPagamento: pedido.dataPagamento || new Date()
                }
              });
              statusFinal = 'PAGO';

              logger.info('[Pagamento Status] Pagamento PIX confirmado no PagHiper; pedido atualizado para PAGO', {
                context: { pedidoId, gatewayStatus }
              });

              // Envia e-mail de confirmação
              enviarEmailConfirmacaoPedido(pedido.id).catch((err) => {
                logger.error('[Pagamento Status] ❌ Erro ao disparar e-mail de confirmação', {
                  context: { pedidoId: pedido.id, error: err instanceof Error ? err.message : 'Unknown' }
                });
              });
            }
          } catch (error) {
            logger.error('[Pagamento Status] Erro ao consultar PagHiper', {
              context: { error: error instanceof Error ? error.message : 'Unknown' }
            });
          }
        } else if (verificarConfigAsaas()) {
          try {
            const asaasStatusObj = await consultarPagamentoAsaas(pedido.codigoPagamento);
            gatewayStatus = asaasStatusObj.status;

            logger.info('[Pagamento Status] Status consultado no Asaas', {
              context: { pedidoId, asaasStatus: gatewayStatus, statusPedido: pedido.status }
            });

            const statusAsaasPago = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'CONFIRMED_BY_CUSTOMER'];
            const pedidoAguardando = pedido.status === 'PENDENTE' || pedido.status === 'AGUARDANDO_PAGAMENTO';

            if (gatewayStatus && statusAsaasPago.includes(gatewayStatus) && pedidoAguardando) {
              await prisma.pedido.update({
                where: { id: pedido.id },
                data: {
                  status: 'PAGO',
                  dataPagamento: pedido.dataPagamento || new Date()
                }
              });
              statusFinal = 'PAGO';

              logger.info('[Pagamento Status] Pagamento confirmado no Asaas; pedido atualizado para PAGO', {
                context: { pedidoId, asaasStatus: gatewayStatus }
              });

              // Envia e-mail de confirmação
              enviarEmailConfirmacaoPedido(pedido.id).catch((err) => {
                logger.error('[Pagamento Status] ❌ Erro ao disparar e-mail de confirmação', {
                  context: { pedidoId: pedido.id, error: err instanceof Error ? err.message : 'Unknown' }
                });
              });
            }
          } catch (error) {
            logger.error('[Pagamento Status] Erro ao consultar Asaas', {
              context: { error: error instanceof Error ? error.message : 'Unknown' }
            });
          }
        }
      }

      res.json({
        success: true,
        data: {
          pedidoId: pedido.id,
          status: statusFinal,
          codigoPagamento: pedido.codigoPagamento,
          metodoPagamento: pedido.metodoPagamento,
          valorTotal: Number(pedido.valorTotal),
          dataPagamento: pedido.dataPagamento,
          expiraEm: pedido.pixExpiraEm,
          gatewayStatus: gatewayStatus
        }
      });
    } catch (error) {
      logger.error('[Pagamento Status] Erro', {
        context: {
          error: error instanceof Error ? error.message : 'Unknown',
          pedidoId: req.params.pedidoId
        }
      });
      next(error);
    }
  }
);

export default router;
