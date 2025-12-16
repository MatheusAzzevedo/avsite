'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES, API_ENDPOINTS } from '@/lib/constants';
import { logger } from '@/lib/logger';

interface User {
  id: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se está autenticado
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      logger.warn('DASHBOARD', 'Usuário não autenticado, redirecionando para login');
      router.push(ROUTES.ADMIN_LOGIN);
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      logger.info('DASHBOARD', 'Usuário autenticado', { userId: userData.id });
    } catch (error) {
      logger.error('DASHBOARD', 'Erro ao parsear dados do usuário', error);
      router.push(ROUTES.ADMIN_LOGIN);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      logger.info('DASHBOARD', 'Realizando logout');
      
      await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
        method: 'POST',
      });

      // Limpar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      logger.success('DASHBOARD', 'Logout realizado com sucesso');
      router.push(ROUTES.ADMIN_LOGIN);
    } catch (error) {
      logger.error('DASHBOARD', 'Erro ao fazer logout', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(250, 204, 21, 0.3)',
            borderTop: '4px solid #facc15',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '1rem', color: '#9ca3af', fontFamily: 'Cairo, sans-serif' }}>
            Carregando...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      fontFamily: 'Cairo, sans-serif',
      color: '#ffffff'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(to right, #0a0a0a, #1a1a1a)',
        borderBottom: '1px solid rgba(250, 204, 21, 0.1)',
        padding: '1.5rem 0'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#facc15',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            Avoar Admin
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = '#dc2626';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = '#ef4444';
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '1.5rem',
      }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: 'semibold',
            marginBottom: '1rem',
            color: '#ffffff',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            Bem-vindo, {user?.email}!
          </h2>
          <p style={{ color: '#d1d5db', fontSize: '0.95rem' }}>
            Este é o painel administrativo do Avoar Sistema. Selecione uma opção abaixo para começar.
          </p>
        </div>

        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Blog Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.6), rgba(0, 0, 0, 0.3))',
            border: '1px solid rgba(250, 204, 21, 0.15)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(250, 204, 21, 0.5)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 20px rgba(250, 204, 21, 0.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(250, 204, 21, 0.15)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <svg style={{ width: '32px', height: '32px', color: '#facc15', marginRight: '1rem', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                  Gerenciar
                </p>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 'semibold',
                  color: '#facc15',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  Blog
                </h3>
              </div>
            </div>
            <button
              onClick={() => router.push(ROUTES.ADMIN_BLOG)}
              style={{
                width: '100%',
                background: '#facc15',
                color: '#000000',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                marginTop: '1rem',
                transition: 'all 0.2s ease',
                fontFamily: 'Montserrat, sans-serif'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = '#f0d15c';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = '#facc15';
              }}
            >
              Acessar Blog
            </button>
          </div>

          {/* Excursões Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.6), rgba(0, 0, 0, 0.3))',
            border: '1px solid rgba(250, 204, 21, 0.15)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(250, 204, 21, 0.5)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 20px rgba(250, 204, 21, 0.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(250, 204, 21, 0.15)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <svg style={{ width: '32px', height: '32px', color: '#facc15', marginRight: '1rem', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                  Gerenciar
                </p>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 'semibold',
                  color: '#facc15',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  Excursões
                </h3>
              </div>
            </div>
            <button
              onClick={() => router.push(ROUTES.ADMIN_EXCURSOES)}
              style={{
                width: '100%',
                background: '#facc15',
                color: '#000000',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                marginTop: '1rem',
                transition: 'all 0.2s ease',
                fontFamily: 'Montserrat, sans-serif'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = '#f0d15c';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = '#facc15';
              }}
            >
              Acessar Excursões
            </button>
          </div>

          {/* Pagamento Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.6), rgba(0, 0, 0, 0.3))',
            border: '1px solid rgba(250, 204, 21, 0.15)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(250, 204, 21, 0.5)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 20px rgba(250, 204, 21, 0.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(250, 204, 21, 0.15)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <svg style={{ width: '32px', height: '32px', color: '#facc15', marginRight: '1rem', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                  Configurar
                </p>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 'semibold',
                  color: '#facc15',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  Pagamento
                </h3>
              </div>
            </div>
            <button
              onClick={() => router.push(ROUTES.ADMIN_PAGAMENTO)}
              style={{
                width: '100%',
                background: '#facc15',
                color: '#000000',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                marginTop: '1rem',
                transition: 'all 0.2s ease',
                fontFamily: 'Montserrat, sans-serif'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = '#f0d15c';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = '#facc15';
              }}
            >
              Configurar Pagamento
            </button>
          </div>
        </div>

        {/* Status Section */}
        <div>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 'semibold',
            marginBottom: '1rem',
            color: '#ffffff',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            Status do Sistema
          </h3>
          <div style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.6), rgba(0, 0, 0, 0.3))',
            border: '1px solid rgba(250, 204, 21, 0.1)',
            borderRadius: '0.5rem',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem'
            }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                  Sistema
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80', fontFamily: 'Montserrat, sans-serif' }}>
                  Online
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                  Versão
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#facc15', fontFamily: 'Montserrat, sans-serif' }}>
                  0.3.0
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                  Banco de Dados
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80', fontFamily: 'Montserrat, sans-serif' }}>
                  Conectado
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
