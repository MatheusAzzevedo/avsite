/**
 * Explicação do Arquivo [email-confirmacao-pedido.ts]
 * 
 * Template HTML do e-mail de "Confirmação de Inscrição" enviado após pagamento confirmado.
 * 
 * Estrutura do e-mail:
 * 1. Header: Logo + mensagem de sucesso + título com número do pedido
 * 2. Texto introdutório com nome do cliente
 * 3. Detalhes do pedido: número, data, tabela de itens, subtotal
 * 4. Informações de pagamento: método, total, observações
 * 5. Dados do(s) estudante(s): nome, nascimento, documento, série, turma, alergias
 * 6. Endereço de cobrança: nome, rua, cidade, estado, CEP, telefone, e-mail
 * 7. Mensagem final + rodapé com redes sociais e copyright
 */

/**
 * Interface com os dados necessários para gerar o template de e-mail
 */
export interface DadosEmailConfirmacao {
  /** Número/ID do pedido */
  numeroPedido: string;
  /** Data do pedido (Date ou string ISO) */
  dataPedido: Date | string;
  /** Nome do cliente (responsável) */
  nomeCliente: string;
  /** Nome do produto/excursão */
  nomeProduto: string;
  /** Quantidade de itens */
  quantidade: number;
  /** Valor unitário */
  valorUnitario: number;
  /** Valor total */
  valorTotal: number;
  /** Método de pagamento (pix, cartao, boleto) */
  metodoPagamento: string;
  /** Observações do pedido */
  observacoes?: string;
  /** Lista de estudantes/participantes */
  estudantes: Array<{
    nomeAluno: string;
    dataNascimento?: string;
    cpfAluno?: string;
    rgAluno?: string;
    serieAluno?: string;
    turma?: string;
    alergiasCuidados?: string;
  }>;
  /** Dados do endereço de cobrança (responsável financeiro) */
  endereco?: {
    nome: string;
    sobrenome?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    telefone?: string;
    email?: string;
  };
}

/**
 * Explicação da função [formatarData]:
 * Formata uma data para o formato brasileiro (ex.: "6 de abril de 2023").
 */
function formatarData(data: Date | string): string {
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const d = typeof data === 'string' ? new Date(data) : data;
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

/**
 * Explicação da função [formatarMoeda]:
 * Formata um número para moeda brasileira (ex.: "R$ 5,00").
 */
function formatarMoeda(valor: number): string {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

/**
 * Explicação da função [formatarMetodoPagamento]:
 * Converte o método de pagamento (pix, cartao, boleto) para texto legível.
 */
function formatarMetodoPagamento(metodo: string): string {
  const mapa: Record<string, string> = {
    'pix': 'PIX',
    'cartao': 'Cartão de Crédito',
    'boleto': 'Boleto Bancário',
    'CREDIT_CARD': 'Cartão de Crédito',
    'PIX': 'PIX',
    'BOLETO': 'Boleto Bancário'
  };
  return mapa[metodo] || metodo;
}

/**
 * Explicação da função [gerarTemplateConfirmacaoPedido]:
 * Gera o HTML completo do e-mail de confirmação de pedido.
 * 
 * O template segue o layout descrito nos prints de referência:
 * - Logo centralizada no topo
 * - Mensagem "Oba! Compra concluída com sucesso!"
 * - Título "Seu pedido {número} foi concluído com sucesso"
 * - Detalhes do pedido em tabela
 * - Dados dos estudantes
 * - Endereço de cobrança
 * - Rodapé com redes sociais e copyright
 * 
 * @param dados - Dados do pedido para preencher o template
 * @returns HTML completo do e-mail
 */
export function gerarTemplateConfirmacaoPedido(dados: DadosEmailConfirmacao): string {
  const baseUrl = process.env.API_BASE_URL || process.env.FRONTEND_URL || 'https://avoarturismo.up.railway.app';

  // Gera linhas da tabela de estudantes
  const estudantesHtml = dados.estudantes.map((est) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;">
        <strong>Nome Completo do Estudante:</strong> ${est.nomeAluno}
      </td>
    </tr>
    ${est.dataNascimento ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;"><strong>Data de nascimento do aluno:</strong> ${est.dataNascimento}</td></tr>` : ''}
    ${est.cpfAluno || est.rgAluno ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;"><strong>Documento de identificação:</strong> ${est.cpfAluno || est.rgAluno || ''}</td></tr>` : ''}
    ${est.serieAluno ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;"><strong>Série:</strong> ${est.serieAluno}</td></tr>` : ''}
    ${est.turma ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;"><strong>Turma:</strong> ${est.turma}</td></tr>` : ''}
    ${est.alergiasCuidados ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;"><strong>O estudante possui alergias ou necessita de cuidados especiais?:</strong> ${est.alergiasCuidados}</td></tr>` : ''}
  `).join('<tr><td style="padding: 16px 0;">&nbsp;</td></tr>');

  // Monta o bloco de endereço
  const enderecoHtml = dados.endereco ? `
    <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 4px; padding: 24px; text-align: center; margin: 20px 0;">
      <p style="margin: 4px 0;">${dados.endereco.nome}${dados.endereco.sobrenome ? ' ' + dados.endereco.sobrenome : ''}</p>
      ${dados.endereco.rua ? `<p style="margin: 4px 0;">${dados.endereco.rua}${dados.endereco.numero ? ', ' + dados.endereco.numero : ''}</p>` : ''}
      ${dados.endereco.complemento ? `<p style="margin: 4px 0;">${dados.endereco.complemento}</p>` : ''}
      ${dados.endereco.cidade ? `<p style="margin: 4px 0;">${dados.endereco.cidade}</p>` : ''}
      ${dados.endereco.estado ? `<p style="margin: 4px 0;">${dados.endereco.estado}</p>` : ''}
      ${dados.endereco.cep ? `<p style="margin: 4px 0;">${dados.endereco.cep}</p>` : ''}
      ${dados.endereco.telefone ? `<p style="margin: 4px 0;"><a href="tel:${dados.endereco.telefone}" style="color: #EA580C;">${dados.endereco.telefone}</a></p>` : ''}
      ${dados.endereco.email ? `<p style="margin: 4px 0;"><a href="mailto:${dados.endereco.email}" style="color: #EA580C;">${dados.endereco.email}</a></p>` : ''}
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Pedido - Avoar Turismo</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif; color: #333333;">
  <!-- Container externo -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <!-- Card principal -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 4px; overflow: hidden;">

          <!-- ============================================ -->
          <!-- 1. HEADER: Logo + Mensagem de Sucesso -->
          <!-- ============================================ -->
          <tr>
            <td align="center" style="padding: 40px 30px 20px;">
              <img src="${baseUrl}/images/background/Logo%20avorar.webp" alt="Avoar Turismo Pedagógico" width="180" style="display: block; max-width: 180px; height: auto;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 30px;">
              <p style="font-size: 16px; color: #666666; font-style: italic; margin: 0 0 10px;">Oba! Compra concluída com sucesso!</p>
              <h1 style="font-size: 26px; font-weight: bold; color: #222222; margin: 0 0 20px; line-height: 1.3;">
                Seu pedido ${dados.numeroPedido.substring(0, 8)} foi concluído com sucesso
              </h1>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- 2. TEXTO INTRODUTÓRIO -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <p style="font-size: 14px; line-height: 1.6; color: #555555;">
                Olá ${dados.nomeCliente}. Informamos que seu pedido em Avoar Turismo foi concluído com sucesso.
                Segue os detalhes da compra da viagem:
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #555555;">
                Caso tenha alguma dúvida ou necessite de mais informações, entre em contato conosco.
              </p>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- 3. DETALHES DO PEDIDO -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 0 30px;">
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 0 0 20px;" />
              <h2 style="font-size: 22px; font-weight: bold; text-align: center; color: #222222; margin: 0 0 20px;">Detalhes do pedido</h2>

              <!-- Número e Data -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="50%" style="font-size: 14px; color: #555555;">
                    <em>Número do pedido: <strong>${dados.numeroPedido.substring(0, 8)}</strong></em>
                  </td>
                  <td width="50%" style="font-size: 14px; color: #555555; text-align: right;">
                    <em>Data do pedido: <strong>${formatarData(dados.dataPedido)}</strong></em>
                  </td>
                </tr>
              </table>

              <!-- Tabela de itens -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="text-align: left; padding: 10px 0; border-bottom: 2px solid #333333; font-size: 14px;">Produto</th>
                    <th style="text-align: center; padding: 10px 0; border-bottom: 2px solid #333333; font-size: 14px;">Quantidade</th>
                    <th style="text-align: right; padding: 10px 0; border-bottom: 2px solid #333333; font-size: 14px;">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; font-size: 14px;">${dados.nomeProduto}</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; text-align: center;">${dados.quantidade}</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; text-align: right;">${formatarMoeda(dados.valorUnitario)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; font-size: 14px;"><strong>Subtotal:</strong></td>
                    <td></td>
                    <td style="padding: 12px 0; font-size: 14px; text-align: right;"><strong>${formatarMoeda(dados.valorTotal)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- 4. INFORMAÇÕES DE PAGAMENTO -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 20px 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; font-size: 14px;"><strong>Método de pagamento:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; text-align: right;">${formatarMetodoPagamento(dados.metodoPagamento)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; font-size: 14px;"><strong>Total:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; text-align: right;">${formatarMoeda(dados.valorTotal)}</td>
                </tr>
                ${dados.observacoes ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; font-size: 14px;"><strong>Nota:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; text-align: right;">${dados.observacoes}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- 5. DADOS DO(S) ESTUDANTE(S) -->
          <!-- ============================================ -->
          ${dados.estudantes.length > 0 ? `
          <tr>
            <td style="padding: 10px 30px 20px;">
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 0 0 20px;" />
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${estudantesHtml}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- ============================================ -->
          <!-- 6. ENDEREÇO DE COBRANÇA -->
          <!-- ============================================ -->
          ${dados.endereco ? `
          <tr>
            <td style="padding: 0 30px 20px;">
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 0 0 20px;" />
              <h2 style="font-size: 22px; font-weight: bold; text-align: center; color: #222222; margin: 0 0 20px;">Endereço de cobrança</h2>
              ${enderecoHtml}
            </td>
          </tr>
          ` : ''}

          <!-- ============================================ -->
          <!-- 7. MENSAGEM FINAL -->
          <!-- ============================================ -->
          <tr>
            <td align="center" style="padding: 20px 30px 30px;">
              <p style="font-size: 15px; color: #555555; font-weight: 500;">
                Estamos ansiosos para tê-lo conosco em breve!
              </p>
            </td>
          </tr>

          <!-- ============================================ -->
          <!-- 8. RODAPÉ: REDES SOCIAIS + COPYRIGHT -->
          <!-- ============================================ -->
          <tr>
            <td style="padding: 0 30px;">
              <hr style="border: none; border-top: 1px dashed #cccccc; margin: 0;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 20px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="padding: 0 14px;">
                    <a href="https://www.facebook.com/people/Avoar-Turismo/100089301964232/" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                      <img src="https://img.icons8.com/fluency/32/facebook.png" alt="Facebook" width="28" height="28" style="display: block; border: 0;" />
                    </a>
                  </td>
                  <td style="padding: 0 14px;">
                    <a href="https://www.instagram.com/avoarturismo/" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                      <img src="https://img.icons8.com/fluency/32/instagram-new.png" alt="Instagram" width="28" height="28" style="display: block; border: 0;" />
                    </a>
                  </td>
                  <td style="padding: 0 14px;">
                    <a href="https://www.linkedin.com/company/avoar-turismo-pedag%C3%B3gico/" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                      <img src="https://img.icons8.com/fluency/32/linkedin.png" alt="LinkedIn" width="28" height="28" style="display: block; border: 0;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 30px 30px;">
              <p style="font-size: 12px; color: #999999; margin: 0;">
                Copyright &copy; ${new Date().getFullYear()} Avoar Turismo, All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- Fim card principal -->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Explicação da função [gerarTextoConfirmacaoPedido]:
 * Gera versão texto puro do e-mail (fallback para clientes sem HTML).
 * 
 * @param dados - Dados do pedido
 * @returns Texto puro do e-mail
 */
export function gerarTextoConfirmacaoPedido(dados: DadosEmailConfirmacao): string {
  const estudantesTexto = dados.estudantes.map((est, i) => {
    let texto = `\nEstudante ${i + 1}: ${est.nomeAluno}`;
    if (est.dataNascimento) texto += `\nData de nascimento: ${est.dataNascimento}`;
    if (est.serieAluno) texto += `\nSérie: ${est.serieAluno}`;
    if (est.turma) texto += `\nTurma: ${est.turma}`;
    if (est.alergiasCuidados) texto += `\nAlergias/Cuidados: ${est.alergiasCuidados}`;
    return texto;
  }).join('\n');

  return `
Oba! Compra concluída com sucesso!

Seu pedido ${dados.numeroPedido.substring(0, 8)} foi concluído com sucesso

Olá ${dados.nomeCliente}. Informamos que seu pedido em Avoar Turismo foi concluído com sucesso.

DETALHES DO PEDIDO
Número do pedido: ${dados.numeroPedido.substring(0, 8)}
Data do pedido: ${formatarData(dados.dataPedido)}
Produto: ${dados.nomeProduto}
Quantidade: ${dados.quantidade}
Valor unitário: ${formatarMoeda(dados.valorUnitario)}
Total: ${formatarMoeda(dados.valorTotal)}
Método de pagamento: ${formatarMetodoPagamento(dados.metodoPagamento)}
${dados.observacoes ? `Observações: ${dados.observacoes}` : ''}

DADOS DOS ESTUDANTES
${estudantesTexto}

Estamos ansiosos para tê-lo conosco em breve!

Copyright © ${new Date().getFullYear()} Avoar Turismo, All rights reserved.
`.trim();
}
