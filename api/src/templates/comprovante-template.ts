/**
 * Explicação do Arquivo [comprovante-template.ts]
 * 
 * Template HTML para o "Comprovante de Inscrição e Pagamento" do cliente.
 * Este template é renderizado como uma página HTML que utiliza a biblioteca html2pdf.js
 * para permitir o download em formato PDF com alta fidelidade visual.
 */

export interface DadosComprovante {
  numeroPedido: string;
  dataPedido: Date | string;
  dataPagamento: Date | string | null;
  nomeCliente: string;
  nomeProduto: string;
  codigoExcursao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  metodoPagamento: string;
  observacoes?: string;
  estudantes: Array<{
    nomeAluno: string;
    idadeAluno?: number | null;
    dataNascimento?: Date | string | null;
    escolaAluno?: string | null;
    serieAluno?: string | null;
    turma?: string | null;
    unidadeColegio?: string | null;
    cpfAluno?: string | null;
    rgAluno?: string | null;
    responsavel?: string | null;
    telefoneResponsavel?: string | null;
    emailResponsavel?: string | null;
    alergiasCuidados?: string | null;
    planoSaude?: string | null;
    medicamentosFebre?: string | null;
    medicamentosAlergia?: string | null;
    observacoes?: string | null;
  }>;
  responsavelFinanceiro?: {
    nome: string;
    sobrenome?: string;
    cpf?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
}

function formatarData(data: Date | string | null | undefined): string {
  if (!data) return '-';
  const d = typeof data === 'string' ? new Date(data) : data;
  return d.toLocaleDateString('pt-BR');
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarMetodoPagamento(metodo: string | null): string {
  if (!metodo) return '-';
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

export function gerarTemplateComprovante(dados: DadosComprovante): string {
  const baseUrl = process.env.API_BASE_URL || 'https://avoarturismo.up.railway.app';

  const estudantesHtml = dados.estudantes.map((est, index) => {
    const titulo = `Dados do Participante ${dados.estudantes.length > 1 ? '#' + (index + 1) : ''}`;
    
    return `
    <div class="student-box">
      <div class="section-title">${titulo}</div>
      <div class="grid">
        <div class="field"><span>Nome:</span> ${est.nomeAluno}</div>
        <div class="field"><span>Data Nascimento:</span> ${formatarData(est.dataNascimento)} ${est.idadeAluno ? `(${est.idadeAluno} anos)` : ''}</div>
        <div class="field"><span>CPF:</span> ${est.cpfAluno || '-'}</div>
        <div class="field"><span>RG:</span> ${est.rgAluno || '-'}</div>
        <div class="field"><span>Escola:</span> ${est.escolaAluno || '-'}</div>
        <div class="field"><span>Unidade/Campus:</span> ${est.unidadeColegio || '-'}</div>
        <div class="field"><span>Série / Turma:</span> ${est.serieAluno || '-'} / ${est.turma || '-'}</div>
        <div class="field"><span>Responsável Legal:</span> ${est.responsavel || '-'}</div>
        <div class="field"><span>Telefone Resp.:</span> ${est.telefoneResponsavel || '-'}</div>
        <div class="field"><span>E-mail Resp.:</span> ${est.emailResponsavel || '-'}</div>
      </div>
      
      <div class="section-title sub">Informações Médicas e Observações</div>
      <div class="grid">
        <div class="field full"><span>Alergias ou Cuidados Especiais:</span> ${est.alergiasCuidados || 'Nenhuma informada'}</div>
        <div class="field"><span>Plano de Saúde:</span> ${est.planoSaude || '-'}</div>
        <div class="field"><span>Medicamento p/ Febre:</span> ${est.medicamentosFebre || '-'}</div>
        <div class="field"><span>Medicamento p/ Alergia:</span> ${est.medicamentosAlergia || '-'}</div>
        <div class="field full"><span>Observações do Pedido:</span> ${est.observacoes || '-'}</div>
      </div>
    </div>
    `;
  }).join('');

  const resp = dados.responsavelFinanceiro;
  const enderecoResp = resp ? [resp.endereco, resp.numero, resp.complemento, resp.bairro, resp.cidade, resp.estado, resp.cep].filter(Boolean).join(', ') : '-';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Comprovante de Inscrição - ${dados.numeroPedido.substring(0, 8)}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <style>
        :root {
            --primary: #EA580C;
            --secondary: #4B5563;
            --border: #E5E7EB;
            --bg: #F9FAFB;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--bg);
            color: #111827;
        }
        .page {
            background: white;
            width: 800px;
            margin: 0 auto;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--primary);
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo img {
            height: 60px;
        }
        .header-info {
            text-align: right;
        }
        .header-info h1 {
            margin: 0;
            color: var(--primary);
            font-size: 24px;
        }
        .header-info p {
            margin: 5px 0 0;
            font-size: 14px;
            color: var(--secondary);
        }
        .section-title {
            background: #FFF7ED;
            color: #9A3412;
            padding: 8px 15px;
            border-radius: 6px;
            font-weight: bold;
            margin: 25px 0 15px;
            font-size: 16px;
            border-left: 4px solid var(--primary);
        }
        .section-title.sub {
            background: transparent;
            border-left: none;
            padding-left: 0;
            font-size: 14px;
            margin-top: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--secondary);
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        .field {
            font-size: 14px;
            line-height: 1.5;
        }
        .field span {
            font-weight: 600;
            color: var(--secondary);
            display: block;
            font-size: 12px;
            text-transform: uppercase;
        }
        .field.full {
            grid-column: span 2;
        }
        .student-box {
            border: 1px solid var(--border);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .summary-box {
            background: #F3F4F6;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #9CA3AF;
            border-top: 1px solid var(--border);
            padding-top: 20px;
        }
        .no-print {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 100;
        }
        .btn-download {
            background-color: var(--primary);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
        }
        .btn-download:hover {
            background-color: #C2410C;
        }
        @media print {
            .no-print { display: none; }
            body { background: white; }
            .page { box-shadow: none; width: 100%; margin: 0; padding: 0; }
        }
    </style>
</head>
<body>
    <div class="no-print">
        <button onclick="downloadPDF()" class="btn-download">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Baixar PDF
        </button>
    </div>

    <div class="page" id="receipt-content">
        <div class="header">
            <div class="logo">
                <img src="${baseUrl}/images/Lavoar.png" alt="Avoar Turismo">
            </div>
            <div class="header-info">
                <h1>Comprovante de Inscrição</h1>
                <p>Pedido #${dados.numeroPedido.substring(0, 8).toUpperCase()}</p>
                <p>Data: ${formatarData(dados.dataPedido)}</p>
            </div>
        </div>

        <div class="section-title">Dados da Viagem</div>
        <div class="grid">
            <div class="field"><span>Evento / Destino:</span> ${dados.nomeProduto}</div>
            <div class="field"><span>Código da Excursão:</span> ${dados.codigoExcursao}</div>
            <div class="field"><span>Status do Pagamento:</span> <strong style="color: #059669;">CONFIRMADO (PAGO)</strong></div>
            <div class="field"><span>Data de Pagamento:</span> ${formatarData(dados.dataPagamento)}</div>
        </div>

        <div class="section-title">Responsável Financeiro</div>
        <div class="grid">
            <div class="field"><span>Nome Completo:</span> ${resp ? `${resp.nome} ${resp.sobrenome || ''}` : dados.nomeCliente}</div>
            <div class="field"><span>CPF:</span> ${resp?.cpf || '-'}</div>
            <div class="field"><span>E-mail:</span> ${resp?.email || '-'}</div>
            <div class="field"><span>Telefone:</span> ${resp?.telefone || '-'}</div>
            <div class="field full"><span>Endereço:</span> ${enderecoResp}</div>
        </div>

        ${estudantesHtml}

        <div class="summary-box">
            <div class="section-title" style="margin-top: 0; background: transparent; border: none; padding: 0; color: var(--secondary);">Resumo Financeiro</div>
            <div class="summary-grid">
                <div class="field"><span>Quantidade:</span> ${dados.quantidade} passagens</div>
                <div class="field"><span>Valor Unitário:</span> ${formatarMoeda(dados.valorUnitario)}</div>
                <div class="field"><span>Método:</span> ${formatarMetodoPagamento(dados.metodoPagamento)}</div>
            </div>
            <div style="margin-top: 15px; text-align: right; font-size: 20px;">
                <span style="font-size: 12px; color: var(--secondary); font-weight: 600; text-transform: uppercase;">Total Pago</span><br>
                <strong style="color: var(--primary);">${formatarMoeda(dados.valorTotal)}</strong>
            </div>
        </div>

        <div class="footer">
            <p>Este documento é um comprovante de inscrição válido após a confirmação do pagamento.</p>
            <p>Avoar Turismo Pedagógico | Avenida do Contorno 9681 sala 504 - Prado - Belo Horizonte - MG</p>
            <p>(31) 2514-7884 | contato@avoarturismo.com.br</p>
            <p>© ${new Date().getFullYear()} Avoar Turismo. Todos os direitos reservados.</p>
        </div>
    </div>

    <script>
        function downloadPDF() {
            const element = document.getElementById('receipt-content');
            const opt = {
                margin:       [10, 10],
                filename:     'Comprovante_Avoar_${dados.numeroPedido.substring(0, 8)}.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // New Promise-based usage:
            html2pdf().set(opt).from(element).save();
        }

        // Auto-download or show success toast?
        // Let's just let the user click the button for better control, 
        // but we could trigger it automatically after a short delay if needed.
    </script>
</body>
</html>`;
}
