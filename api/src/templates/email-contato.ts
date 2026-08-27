/**
 * Explicação do Arquivo [email-contato.ts]
 *
 * Template do e-mail que a equipe da Avoar recebe quando alguém envia o
 * formulário de contato do site.
 *
 * Escrito para quem vai ler e responder: os dados de retorno (nome, e-mail e
 * telefone) vêm primeiro, e a mensagem logo abaixo. Campos não preenchidos são
 * omitidos em vez de aparecerem vazios, para a leitura não ter buracos.
 */

import { DadosContato } from '../schemas/contato.schema';

const ROTULOS_SERIE: Record<string, string> = {
  'ensino-infantil': 'Ensino Infantil',
  'ensino-fundamental': 'Ensino Fundamental',
  'ensino-medio': 'Ensino Médio',
  todas: 'Todas as séries'
};

/** Impede que conteúdo enviado pelo visitante seja interpretado como HTML. */
function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nomeCompleto(dados: DadosContato): string {
  return [dados.nome, dados.sobrenome].filter(Boolean).join(' ');
}

export function gerarAssuntoContato(dados: DadosContato): string {
  const origem = dados.escola || dados.municipio;
  return origem
    ? `Contato pelo site: ${nomeCompleto(dados)} — ${origem}`
    : `Contato pelo site: ${nomeCompleto(dados)}`;
}

export function gerarTemplateContato(dados: DadosContato, recebidoEm: Date): string {
  const linha = (rotulo: string, valor?: string) =>
    valor
      ? `<tr>
           <td style="padding:8px 0;color:#6b7280;font-size:14px;width:150px;vertical-align:top">${rotulo}</td>
           <td style="padding:8px 0;color:#111827;font-size:15px">${escapar(valor)}</td>
         </tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden">
    <tr>
      <td style="background:#0d5c4a;padding:20px 28px">
        <h1 style="margin:0;color:#ffffff;font-size:18px">Nova mensagem pelo site</h1>
        <p style="margin:4px 0 0;color:#c7ded7;font-size:13px">
          Recebida em ${recebidoEm.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px">
        <table role="presentation" style="width:100%;border-collapse:collapse">
          ${linha('Nome', nomeCompleto(dados))}
          ${linha('E-mail', dados.email)}
          ${linha('Telefone', dados.telefone)}
          ${linha('Escola', dados.escola)}
          ${linha('Município', dados.municipio)}
          ${linha('Série', ROTULOS_SERIE[dados.serie] || dados.serie)}
          ${linha('Roteiro de interesse', dados.roteiro)}
        </table>

        ${
          dados.mensagem
            ? `<div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb">
                 <p style="margin:0 0 8px;color:#6b7280;font-size:14px">Mensagem</p>
                 <p style="margin:0;color:#111827;font-size:15px;line-height:1.6;white-space:pre-wrap">${escapar(dados.mensagem)}</p>
               </div>`
            : ''
        }

        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb">
          <a href="mailto:${escapar(dados.email)}"
             style="display:inline-block;background:#0d5c4a;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px">
            Responder a ${escapar(dados.nome)}
          </a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Versão em texto puro, para clientes de e-mail que não renderizam HTML. */
export function gerarTextoContato(dados: DadosContato, recebidoEm: Date): string {
  const linhas = [
    'NOVA MENSAGEM PELO SITE',
    `Recebida em ${recebidoEm.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    '',
    `Nome: ${nomeCompleto(dados)}`,
    `E-mail: ${dados.email}`
  ];

  if (dados.telefone) linhas.push(`Telefone: ${dados.telefone}`);
  if (dados.escola) linhas.push(`Escola: ${dados.escola}`);
  if (dados.municipio) linhas.push(`Município: ${dados.municipio}`);
  linhas.push(`Série: ${ROTULOS_SERIE[dados.serie] || dados.serie}`);
  if (dados.roteiro) linhas.push(`Roteiro de interesse: ${dados.roteiro}`);
  if (dados.mensagem) linhas.push('', 'Mensagem:', dados.mensagem);

  return linhas.join('\n');
}
