'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES, API_ENDPOINTS } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { formatDate } from '@/lib/utils';

interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_email: string;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push(ROUTES.ADMIN_LOGIN);
      return;
    }

    fetchPosts();
  }, [router]);

  const fetchPosts = async () => {
    try {
      logger.info('ADMIN_BLOG', 'Buscando posts');
      const response = await fetch(API_ENDPOINTS.BLOG_LIST, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar posts');
      }

      const data = await response.json();
      setPosts(data.data);
      logger.success('ADMIN_BLOG', `${data.data.length} posts carregados`);
    } catch (err: any) {
      logger.error('ADMIN_BLOG', 'Erro ao buscar posts', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este post?')) {
      return;
    }

    try {
      logger.info('ADMIN_BLOG', 'Deletando post', { postId: id });
      const response = await fetch(API_ENDPOINTS.BLOG_DELETE(id), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar post');
      }

      logger.success('ADMIN_BLOG', 'Post deletado com sucesso');
      fetchPosts();
    } catch (err: any) {
      logger.error('ADMIN_BLOG', 'Erro ao deletar post', err);
      alert(err.message);
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Gerenciar Blog</h1>
          <button
            onClick={() => router.push('/admin/blog/novo')}
            className="admin-btn admin-btn-primary"
          >
            + Novo Post
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
                Carregando posts...
              </p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="admin-card">
            <div className="admin-empty">
              <h3>Nenhum post criado ainda</h3>
              <p style={{ marginBottom: '1rem' }}>Crie seu primeiro post para começar</p>
              <button
                onClick={() => router.push('/admin/blog/novo')}
                className="admin-btn admin-btn-primary"
              >
                Criar Primeiro Post
              </button>
            </div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Subtítulo</th>
                <th>Status</th>
                <th>Autor</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td style={{ fontWeight: '600', color: '#ffffff' }}>{post.title}</td>
                  <td>{post.subtitle}</td>
                  <td>
                    <span className={`admin-badge ${post.published ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                      {post.published ? 'Publicado' : 'Rascunho'}
                    </span>
                  </td>
                  <td>{post.author_email}</td>
                  <td>{formatDate(post.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => router.push(`/admin/blog/${post.id}`)}
                        className="admin-btn admin-btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
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
