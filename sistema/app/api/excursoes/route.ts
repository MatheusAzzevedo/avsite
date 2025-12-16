import { NextRequest, NextResponse } from 'next/server';
import { createExcursaoSchema } from '@/lib/validation';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { MESSAGES, HTTP_STATUS } from '@/lib/constants';

/**
 * API de Excursões
 * GET /api/excursoes - Listar todas as excursões
 * POST /api/excursoes - Criar nova excursão
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    const active = searchParams.get('active') === 'true';

    logger.debug('EXCURSOES_API', 'Listando excursões', { page, active });

    // Construir query
    let whereClause = '';
    if (active) {
      whereClause = 'WHERE active = true';
    }

    // Contar total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM excursoes ${whereClause}`,
      active ? [true] : []
    );
    const total = parseInt(countResult.rows[0].total);

    // Buscar excursões
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
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${active ? 2 : 1} OFFSET $${active ? 3 : 2}`,
      active ? [true, pageSize, offset] : [pageSize, offset]
    );

    logger.success('EXCURSOES_API', `${result.rows.length} excursões retornadas`);

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
    logger.error('EXCURSOES_API', 'Erro ao listar excursões', error);
    return NextResponse.json(
      { error: MESSAGES.ERROR_INTERNAL },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logger.debug('EXCURSOES_API', 'Criando nova excursão');

    // Validar dados
    const validatedData = createExcursaoSchema.parse(body);

    // Verificar autenticação
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: MESSAGES.ERROR_UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Inserir no banco
    const result = await query(
      `INSERT INTO excursoes (title, subtitle, description, image_url, featured_image_url, price, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, subtitle, price, active, created_at`,
      [
        validatedData.title,
        validatedData.subtitle,
        validatedData.description,
        validatedData.image_url || null,
        validatedData.featured_image_url || null,
        validatedData.price,
        validatedData.active,
      ]
    );

    logger.success('EXCURSOES_API', 'Excursão criada com sucesso', { excursaoId: result.rows[0].id });

    return NextResponse.json(
      {
        success: true,
        message: MESSAGES.SUCCESS_CREATE,
        data: result.rows[0],
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error: any) {
    logger.error('EXCURSOES_API', 'Erro ao criar excursão', error);

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
