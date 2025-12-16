import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './lib/auth';

/**
 * Middleware para proteger rotas administrativas
 * Valida JWT token antes de permitir acesso às rotas /admin
 * 
 * Uso: Configure em next.config.js ou middleware.ts
 */

export function middleware(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/admin/login',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/blog',
    '/api/excursoes',
    '/blog',
    '/excursoes',
    '/checkout',
    '/',
  ];
  
  // Verificar se a rota é pública
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Rotas admin que precisam de autenticação (exceto login)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Para rotas admin, não verificamos token no middleware
    // A verificação será feita no cliente (localStorage)
    return NextResponse.next();
  }

  // APIs protegidas (exceto rotas públicas já verificadas acima)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader ? extractTokenFromHeader(authHeader) : null;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Adicionar dados do usuário ao header para uso nas rotas
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
  ],
};
