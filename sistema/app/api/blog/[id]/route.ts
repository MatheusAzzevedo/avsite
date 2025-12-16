import { NextRequest, NextResponse } from 'next/server';
import { updateBlogPostSchema } from '@/lib/validation';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { MESSAGES, HTTP_STATUS } from '@/lib/constants';

/**
 * API de Blog Posts Individual
 * GET /api/blog/[id] - Obter post específico
 * PUT /api/blog/[id] - Atualizar post
 * DELETE /api/blog/[id] - Deletar post
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    logger.debug('BLOG_API', 'Obtendo post', { postId: id });

    const result = await query(
      `SELECT 
        bp.id, 
        bp.title, 
        bp.subtitle, 
        bp.content,
        bp.published, 
        bp.created_at, 
        bp.updated_at,
        u.email as author_email
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      logger.warn('BLOG_API', 'Post não encontrado', { postId: id });
      return NextResponse.json(
        { error: MESSAGES.ERROR_NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    logger.success('BLOG_API', 'Post obtido com sucesso');

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error: any) {
    logger.error('BLOG_API', 'Erro ao obter post', error);
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
    logger.debug('BLOG_API', 'Atualizando post', { postId: id });

    // Validar dados
    const validatedData = updateBlogPostSchema.parse(body);

    // Verificar se post existe
    const checkResult = await query(
      'SELECT id FROM blog_posts WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      logger.warn('BLOG_API', 'Post não encontrado para atualização', { postId: id });
      return NextResponse.json(
        { error: MESSAGES.ERROR_NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Atualizar post
    const updateResult = await query(
      `UPDATE blog_posts 
       SET title = COALESCE($1, title),
           subtitle = COALESCE($2, subtitle),
           content = COALESCE($3, content),
           published = COALESCE($4, published)
       WHERE id = $5
       RETURNING id, title, subtitle, published, updated_at`,
      [
        validatedData.title || null,
        validatedData.subtitle || null,
        validatedData.content || null,
        validatedData.published !== undefined ? validatedData.published : null,
        id,
      ]
    );

    logger.success('BLOG_API', 'Post atualizado com sucesso', { postId: id });

    return NextResponse.json(
      {
        success: true,
        message: MESSAGES.SUCCESS_UPDATE,
        data: updateResult.rows[0],
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error: any) {
    logger.error('BLOG_API', 'Erro ao atualizar post', error);

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
    logger.debug('BLOG_API', 'Deletando post', { postId: id });

    // Verificar se post existe
    const checkResult = await query(
      'SELECT id FROM blog_posts WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      logger.warn('BLOG_API', 'Post não encontrado para deleção', { postId: id });
      return NextResponse.json(
        { error: MESSAGES.ERROR_NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Deletar post
    await query('DELETE FROM blog_posts WHERE id = $1', [id]);

    logger.success('BLOG_API', 'Post deletado com sucesso', { postId: id });

    return NextResponse.json(
      {
        success: true,
        message: MESSAGES.SUCCESS_DELETE,
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error: any) {
    logger.error('BLOG_API', 'Erro ao deletar post', error);
    return NextResponse.json(
      { error: MESSAGES.ERROR_INTERNAL },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
