/**
 * Explicação do Arquivo [email-recuperacao-senha.ts]
 * 
 * Template HTML do e-mail de "Recuperação de Senha" para clientes.
 */

export interface DadosEmailRecuperacao {
  nome: string;
  linkReset: string;
}

export function gerarTemplateRecuperacaoSenha(dados: DadosEmailRecuperacao): string {
  const baseUrl = process.env.API_BASE_URL || process.env.FRONTEND_URL || 'https://avoarturismo.up.railway.app';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha - Avoar Turismo</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif; color: #333333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <tr>
            <td align="center" style="padding: 40px 30px 20px;">
              <img src="${baseUrl}/images/Lavoar.png" alt="Avoar Turismo" width="200" style="display: block; max-width: 200px; height: auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <h1 style="font-size: 24px; font-weight: bold; color: #222222; margin: 0 0 20px; text-align: center;">Recuperação de Senha</h1>
              <p style="font-size: 16px; line-height: 1.6; color: #555555;">
                Olá, <strong>${dados.nome}</strong>.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #555555;">
                Recebemos uma solicitação para redefinir a senha da sua conta na Avoar Turismo. 
                Se você não fez esta solicitação, pode ignorar este e-mail com segurança.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #555555;">
                Para criar uma nova senha, clique no botão abaixo:
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 10px 40px 40px;">
              <a href="${dados.linkReset}" style="display: inline-block; padding: 16px 32px; background-color: #EA580C; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Redefinir Minha Senha</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="font-size: 14px; line-height: 1.6; color: #777777;">
                Este link é válido por 1 hora. Caso o botão acima não funcione, copie e cole o endereço abaixo no seu navegador:
              </p>
              <p style="font-size: 12px; line-height: 1.6; color: #EA580C; word-break: break-all;">
                ${dados.linkReset}
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 20px 40px; background-color: #fafafa; color: #999999; font-size: 12px;">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Avoar Turismo. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function gerarTextoRecuperacaoSenha(dados: DadosEmailRecuperacao): string {
  return `
Olá, ${dados.nome}.

Recebemos uma solicitação para redefinir a senha da sua conta na Avoar Turismo.
Para criar uma nova senha, acesse o link abaixo:

${dados.linkReset}

Este link é válido por 1 hora. Se você não solicitou a redefinição, ignore este e-mail.

Atenciosamente,
Equipe Avoar Turismo
`.trim();
}
