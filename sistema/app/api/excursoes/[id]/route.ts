import { NextRequest, NextResponse } from 'next/server';
import { updateExcursaoSchema } from '@/lib/validation';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { MESSAGES, HTTP_STATUS } from '@/lib/constants';

/**
 * API de Excursões Individual
 * GET /api/excursoes/[id] - Obter excursão específica
 * PUT /api/excursoes/[id] - Atualizar excursão
 * DELETE /api/excursoes/[id] - Deletar excursão
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    logger.debug('EXCURSOES_API', 'Obtendo excursão', { excursaoId: id });

    const result = await query(
      `SELECT 
        id, 
        title, 
        subtitle, 
        description,
        image_url,
        featured_image_url,
        price, 
        active, 
        created_at, 
        updated_at
      FROM excursoes
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      logger.warn('EXCURSOES_API', 'Excursão não encontrada', { excursaoId: id });
      return NextResponse.json(
        { error: MESSAGES.ERROR_NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    logger.success('EXCURSOES_API', 'Excursão obtida com sucesso');

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error: any) {
    logger.error('EXCURSOES_API', 'Erro ao obter excursão', error);
    return NextResponse.json(
      { error: MESSAGES.ERROR_INTERNAL },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    logger.debug('EXCURSOES_API', 'Atualizando excursão', { excursaoId: id });

    // Validar dados
    const validatedData = updateExcursaoSchema.parse(body);

    // Verificar se excursão existe
    const checkResult = await query(
      'SELECT id FROM excursoes WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      logger.warn('EXCURSOES_API', 'Excursão não encontrada para atualização', { excursaoId: id });
      return NextResponse.json(
        { error: MESSAGES.ERROR_NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Atualizar excursão
    const updateResult = await query(
      `UPDATE excursoes 
       SET title = COALESCE($1, title),
           subtitle = COALESCE($2, subtitle),
           description = COALESCE($3, description),
           image_url = COALESCE($4, image_url),
           featured_image_url = COALESCE($5, featured_image_url),
           price = COALESCE($6, price),
           active = COALESCE($7, active)
       WHERE id = $8
       RETURNING id, title, subtitle, price, active, updated_at`,
      [
        validatedData.title || null,
        validatedData.subtitle || null,
        validatedData.description || null,
        validatedData.image_url !== undefined ? validatedData.image_url : null,
        validatedData.featured_image_url !== undefined ? validatedData.featured_image_url : null,
        validatedData.price || null,
        validatedData.active !== undefined ? validatedData.active : null,
        id,
      ]
    );

    logger.success('EXCURSOES_API', 'Excursão atualizada com sucesso', { excursaoId: id });

    return NextResponse.json(
      {
        success: true,
        message: MESSAGES.SUCCESS_UPDATE,
        data: updateResult.rows[0],
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error: any) {
    logger.error('EXCURSOES_API', 'Erro ao atualizar excursão', error);

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    logger.debug('EXCURSOES_API', 'Deletando excursão', { excursaoId: id });

    // Verificar se excursão existe
    const checkResult = await query(
      'SELECT id FROM excursoes WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      logger.warn('EXCURSOES_API', 'Excursão não encontrada para deleção', { excursaoId: id });
      return NextResponse.json(
        { error: MESSAGES.ERROR_NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Deletar excursão
    await query('DELETE FROM excursoes WHERE id = $1', [id]);

    logger.success('EXCURSOES_API', 'Excursão deletada com sucesso', { excursaoId: id });

    return NextResponse.json(
      {
        success: true,
        message: MESSAGES.SUCCESS_DELETE,
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error: any) {
    logger.error('EXCURSOES_API', 'Erro ao deletar excursão', error);
    return NextResponse.json(
      { error: MESSAGES.ERROR_INTERNAL },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
