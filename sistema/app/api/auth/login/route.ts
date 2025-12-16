import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { comparePassword, generateToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { MESSAGES, HTTP_STATUS } from '@/lib/constants';

/**
 * API de Login
 * POST /api/auth/login
 * 
 * Body: { email: string, password: string }
 * Returns: { token: string, user: { id, email } }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Receber dados
    const body = await request.json();
    logger.debug('AUTH_API', 'Requisição de login recebida', { email: body.email });

    // 2. Validar com Zod
    const validatedData = loginSchema.parse(body);
    logger.info('AUTH_API', 'Dados validados com sucesso');

    // 3. Buscar usuário no banco
    const result = await query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [validatedData.email]
    );

    if (result.rows.length === 0) {
      logger.warn('AUTH_API', 'Usuário não encontrado', { email: validatedData.email });
      return NextResponse.json(
        { error: MESSAGES.ERROR_USER_NOT_FOUND },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const user = result.rows[0];

    // 4. Comparar senha
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      logger.warn('AUTH_API', 'Senha inválida', { email: validatedData.email });
      return NextResponse.json(
        { error: MESSAGES.ERROR_INVALID_PASSWORD },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // 5. Gerar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    logger.success('AUTH_API', 'Login realizado com sucesso', { userId: user.id });

    // 6. Retornar token e dados do usuário
    return NextResponse.json(
      {
        success: true,
        message: MESSAGES.SUCCESS_LOGIN,
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error: any) {
    logger.error('AUTH_API', 'Erro no login', error);

    // Tratar erro de validação Zod
    if (error.errors) {
      return NextResponse.json(
        { error: MESSAGES.ERROR_VALIDATION, details: error.errors },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    return NextResponse.json(
      { error: MESSAGES.ERROR_INTERNAL },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
