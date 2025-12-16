import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { MESSAGES, HTTP_STATUS } from '@/lib/constants';

/**
 * API de Logout
 * POST /api/auth/logout
 * 
 * Invalida o token no cliente (remoção de localStorage é feita pelo cliente)
 */
export async function POST() {
  try {
    logger.info('AUTH_API', 'Logout realizado');

    return NextResponse.json(
      {
        success: true,
        message: MESSAGES.SUCCESS_LOGOUT,
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error: any) {
    logger.error('AUTH_API', 'Erro no logout', error);

    return NextResponse.json(
      { error: MESSAGES.ERROR_INTERNAL },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
