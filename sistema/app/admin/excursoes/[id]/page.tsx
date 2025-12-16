'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createExcursaoSchema, updateExcursaoSchema } from '@/lib/validation';
import { ROUTES } from '@/lib/constants';
import { logger } from '@/lib/logger';

interface Excursao {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  featured_image_url: string;
  price: number;
  active: boolean;
}

export default function ExcursaoEditorPage() {
  const router = useRouter();
  const params = useParams();
  const excursaoId = params?.id as string;
  const isEditMode = !!excursaoId && excursaoId !== 'novo';

  const [excursao, setExcursao] = useState<Excursao>({
    id: '',
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    featured_image_url: '',
    price: 0,
    active: true,
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

    if (isEditMode && excursaoId) {
      fetchExcursao(excursaoId);
    } else {
      setIsLoading(false);
    }
  }, [isEditMode, excursaoId, router]);

  const fetchExcursao = async (id: string) => {
    try {
      logger.info('EXCURSAO_EDITOR', 'Buscando excursão para edição', { excursaoId: id });
      const response = await fetch(`/api/excursoes/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar excursão');
      }

      const data = await response.json();
      setExcursao(data.data);
      logger.success('EXCURSAO_EDITOR', 'Excursão carregada para edição');
    } catch (err: any) {
      logger.error('EXCURSAO_EDITOR', 'Erro ao buscar excursão', err);
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
        updateExcursaoSchema.parse(excursao);
      } else {
        createExcursaoSchema.parse(excursao);
      }

      logger.info('EXCURSAO_EDITOR', isEditMode ? 'Atualizando excursão' : 'Criando nova excursão');

      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode ? `/api/excursoes/${excursaoId}` : '/api/excursoes';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(excursao),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar excursão');
      }

      logger.success('EXCURSAO_EDITOR', isEditMode ? 'Excursão atualizada' : 'Excursão criada');
      router.push(ROUTES.ADMIN_EXCURSOES);
    } catch (err: any) {
      logger.error('EXCURSAO_EDITOR', 'Erro ao salvar excursão', err);
      setError(err.message || 'Erro ao salvar excursão');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando excursão...</p>
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
            {isEditMode ? 'Editar Excursão' : 'Nova Excursão'}
          </h1>
          <button
            onClick={() => router.push(ROUTES.ADMIN_EXCURSOES)}
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
              value={excursao.title}
              onChange={(e) => setExcursao({ ...excursao, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Digite o título da excursão"
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
              value={excursao.subtitle}
              onChange={(e) => setExcursao({ ...excursao, subtitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Digite o subtítulo"
              disabled={isSaving}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              required
              value={excursao.description}
              onChange={(e) => setExcursao({ ...excursao, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 h-32"
              placeholder="Digite a descrição da excursão"
              disabled={isSaving}
            />
          </div>

          {/* Preço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço (R$) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={excursao.price}
              onChange={(e) => setExcursao({ ...excursao, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="0.00"
              disabled={isSaving}
            />
          </div>

          {/* URL da Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL da Imagem (Thumbnail)
            </label>
            <input
              type="url"
              value={excursao.image_url}
              onChange={(e) => setExcursao({ ...excursao, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="https://exemplo.com/imagem.jpg"
              disabled={isSaving}
            />
          </div>

          {/* URL da Imagem Destacada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL da Imagem Destacada
            </label>
            <input
              type="url"
              value={excursao.featured_image_url}
              onChange={(e) => setExcursao({ ...excursao, featured_image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="https://exemplo.com/imagem-destaque.jpg"
              disabled={isSaving}
            />
          </div>

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={excursao.active}
              onChange={(e) => setExcursao({ ...excursao, active: e.target.checked })}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              disabled={isSaving}
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
              Excursão ativa
            </label>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              {isSaving ? 'Salvando...' : isEditMode ? 'Atualizar Excursão' : 'Criar Excursão'}
            </button>
            <button
              type="button"
              onClick={() => router.push(ROUTES.ADMIN_EXCURSOES)}
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
