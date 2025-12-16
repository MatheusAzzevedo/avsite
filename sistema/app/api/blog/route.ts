import { NextRequest, NextResponse } from 'next/server';
import { createBlogPostSchema } from '@/lib/validation';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { MESSAGES, HTTP_STATUS } from '@/lib/constants';

/**
 * API de Blog Posts
 * GET /api/blog - Listar todos os posts
 * POST /api/blog - Criar novo post
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    const published = searchParams.get('published') === 'true';

    logger.debug('BLOG_API', 'Listando posts', { page, published });

    // Construir query
    let whereClause = '';
    const params: any[] = [];

    if (published) {
      whereClause = 'WHERE published = true';
      params.push(true);
    }

    // Contar total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM blog_posts ${whereClause}`,
      published ? [true] : []
    );
    const total = parseInt(countResult.rows[0].total);

    // Buscar posts
    const result = await query(
      `SELECT 
        bp.id, 
        bp.title, 
        bp.subtitle, 
        bp.published, 
        bp.created_at, 
        bp.updated_at,
        u.email as author_email
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      ${whereClause}
      ORDER BY bp.created_at DESC
      LIMIT $${published ? 2 : 1} OFFSET $${published ? 3 : 2}`,
      published ? [true, pageSize, offset] : [pageSize, offset]
    );

    logger.success('BLOG_API', `${result.rows.length} posts retornados`);

    return NextResponse.json(
      {
        success: true,
        data: result.rows,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error: any) {
    logger.error('BLOG_API', 'Erro ao listar posts', error);
    return NextResponse.json(
      { error: MESSAGES.ERROR_INTERNAL },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logger.debug('BLOG_API', 'Criando novo post');

    // Validar dados
    const validatedData = createBlogPostSchema.parse(body);

    // Obter user_id do header (adicionado pelo middleware)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: MESSAGES.ERROR_UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Inserir no banco
    const result = await query(
      `INSERT INTO blog_posts (title, subtitle, content, author_id, published)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, subtitle, published, created_at`,
      [validatedData.title, validatedData.subtitle, validatedData.content, userId, validatedData.published]
    );

    logger.success('BLOG_API', 'Post criado com sucesso', { postId: result.rows[0].id });

    return NextResponse.json(
      {
        success: true,
        message: MESSAGES.SUCCESS_CREATE,
        data: result.rows[0],
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error: any) {
    logger.error('BLOG_API', 'Erro ao criar post', error);

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
