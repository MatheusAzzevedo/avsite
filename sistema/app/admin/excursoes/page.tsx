'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Excursao {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  active: boolean;
  created_at: string;
}

export default function AdminExcursoesPage() {
  const router = useRouter();
  const [excursoes, setExcursoes] = useState<Excursao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push(ROUTES.ADMIN_LOGIN);
      return;
    }

    fetchExcursoes();
  }, [router]);

  const fetchExcursoes = async () => {
    try {
      logger.info('ADMIN_EXCURSOES', 'Buscando excursões');
      const response = await fetch('/api/excursoes', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar excursões');
      }

      const data = await response.json();
      setExcursoes(data.data);
      logger.success('ADMIN_EXCURSOES', `${data.data.length} excursões carregadas`);
    } catch (err: any) {
      logger.error('ADMIN_EXCURSOES', 'Erro ao buscar excursões', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta excursão?')) {
      return;
    }

    try {
      logger.info('ADMIN_EXCURSOES', 'Deletando excursão', { excursaoId: id });
      const response = await fetch(`/api/excursoes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar excursão');
      }

      logger.success('ADMIN_EXCURSOES', 'Excursão deletada com sucesso');
      fetchExcursoes();
    } catch (err: any) {
      logger.error('ADMIN_EXCURSOES', 'Erro ao deletar excursão', err);
      alert(err.message);
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Gerenciar Excursões</h1>
          <button
            onClick={() => router.push('/admin/excursoes/novo')}
            className="admin-btn admin-btn-primary"
          >
            + Nova Excursão
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        {error && (
          <div className="admin-error">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="admin-loading">
            <div>
              <div className="admin-spinner"></div>
              <p style={{ marginTop: '1rem', color: '#9ca3af', textAlign: 'center' }}>
                Carregando excursões...
              </p>
            </div>
          </div>
        ) : excursoes.length === 0 ? (
          <div className="admin-card">
            <div className="admin-empty">
              <h3>Nenhuma excursão criada ainda</h3>
              <p style={{ marginBottom: '1rem' }}>Crie sua primeira excursão para começar</p>
              <button
                onClick={() => router.push('/admin/excursoes/novo')}
                className="admin-btn admin-btn-primary"
              >
                Criar Primeira Excursão
              </button>
            </div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Preço</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {excursoes.map((excursao) => (
                <tr key={excursao.id}>
                  <td>
                    <div style={{ fontWeight: '600', color: '#ffffff' }}>{excursao.title}</div>
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{excursao.subtitle}</div>
                  </td>
                  <td style={{ fontWeight: '600', color: '#facc15' }}>
                    {formatCurrency(excursao.price)}
                  </td>
                  <td>
                    <span className={`admin-badge ${excursao.active ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                      {excursao.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td>{formatDate(excursao.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => router.push(`/admin/excursoes/${excursao.id}`)}
                        className="admin-btn admin-btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(excursao.id)}
                        className="admin-btn admin-btn-danger"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                      >
                        Deletar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
