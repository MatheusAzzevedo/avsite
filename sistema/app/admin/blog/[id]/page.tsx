'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBlogPostSchema, updateBlogPostSchema } from '@/lib/validation';
import { ROUTES, API_ENDPOINTS } from '@/lib/constants';
import { logger } from '@/lib/logger';

interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  published: boolean;
}

export default function BlogEditorPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;
  const isEditMode = !!postId && postId !== 'novo';

  const [post, setPost] = useState<BlogPost>({
    id: '',
    title: '',
    subtitle: '',
    content: '',
    published: false,
  });

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push(ROUTES.ADMIN_LOGIN);
      return;
    }

    if (isEditMode && postId) {
      fetchPost(postId);
    } else {
      setIsLoading(false);
    }
  }, [isEditMode, postId, router]);

  const fetchPost = async (id: string) => {
    try {
      logger.info('BLOG_EDITOR', 'Buscando post para edição', { postId: id });
      const response = await fetch(API_ENDPOINTS.BLOG_UPDATE(id), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar post');
      }

      const data = await response.json();
      setPost(data.data);
      logger.success('BLOG_EDITOR', 'Post carregado para edição');
    } catch (err: any) {
      logger.error('BLOG_EDITOR', 'Erro ao buscar post', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      // Validar dados
      if (isEditMode) {
        updateBlogPostSchema.parse(post);
      } else {
        createBlogPostSchema.parse(post);
      }

      logger.info('BLOG_EDITOR', isEditMode ? 'Atualizando post' : 'Criando novo post');

      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode ? API_ENDPOINTS.BLOG_UPDATE(postId) : API_ENDPOINTS.BLOG_LIST;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(post),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar post');
      }

      logger.success('BLOG_EDITOR', isEditMode ? 'Post atualizado' : 'Post criado');
      router.push(ROUTES.ADMIN_BLOG);
    } catch (err: any) {
      logger.error('BLOG_EDITOR', 'Erro ao salvar post', err);
      setError(err.message || 'Erro ao salvar post');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Editar Post' : 'Novo Post'}
          </h1>
          <button
            onClick={() => router.push(ROUTES.ADMIN_BLOG)}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Voltar
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              required
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o título do post"
              disabled={isSaving}
            />
          </div>

          {/* Subtítulo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtítulo *
            </label>
            <input
              type="text"
              required
              value={post.subtitle}
              onChange={(e) => setPost({ ...post, subtitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o subtítulo do post"
              disabled={isSaving}
            />
          </div>

          {/* Conteúdo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conteúdo (Markdown) *
            </label>
            <textarea
              required
              value={post.content}
              onChange={(e) => setPost({ ...post, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm h-64"
              placeholder="Digite o conteúdo do post (suporta Markdown)"
              disabled={isSaving}
            />
          </div>

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="published"
              checked={post.published}
              onChange={(e) => setPost({ ...post, published: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSaving}
            />
            <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
              Publicar imediatamente
            </label>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              {isSaving ? 'Salvando...' : isEditMode ? 'Atualizar Post' : 'Criar Post'}
            </button>
            <button
              type="button"
              onClick={() => router.push(ROUTES.ADMIN_BLOG)}
              disabled={isSaving}
              className="bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-900 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
