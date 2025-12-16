'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/lib/utils';

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

export default function ExcursaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const excursaoId = params?.id as string;

  const [excursao, setExcursao] = useState<Excursao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (excursaoId) {
      fetchExcursao(excursaoId);
    }
  }, [excursaoId]);

  const fetchExcursao = async (id: string) => {
    try {
      logger.info('PUBLIC_EXCURSAO_DETAIL', 'Carregando excursão', { excursaoId: id });
      const response = await fetch(`/api/excursoes/${id}`);

      if (!response.ok) {
        throw new Error('Excursão não encontrada');
      }

      const data = await response.json();
      
      if (!data.data.active) {
        setError('Esta excursão não está disponível');
        return;
      }

      setExcursao(data.data);
      logger.success('PUBLIC_EXCURSAO_DETAIL', 'Excursão carregada com sucesso');
    } catch (err: any) {
      logger.error('PUBLIC_EXCURSAO_DETAIL', 'Erro ao carregar excursão', err);
      setError(err.message || 'Erro ao carregar excursão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      {excursao?.featured_image_url && (
        <div className="h-96 bg-gray-200 overflow-hidden">
          <img
            src={excursao.featured_image_url}
            alt={excursao.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex justify-between items-start">
          <div className="flex-1">
            <button
              onClick={() => router.push('/excursoes')}
              className="text-green-600 hover:text-green-900 mb-4 font-medium"
            >
              ← Voltar às Excursões
            </button>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-full"></div>
              </div>
            ) : excursao ? (
              <>
                <h1 className="text-4xl font-bold text-gray-900">{excursao.title}</h1>
                <p className="text-xl text-gray-600 mt-2">{excursao.subtitle}</p>
              </>
            ) : (
              <p className="text-red-600">Erro ao carregar excursão</p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-8">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando excursão...</p>
          </div>
        ) : excursao ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Price Banner */}
            <div className="bg-green-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm uppercase tracking-wide opacity-90">Valor por pessoa</p>
                  <p className="text-4xl font-bold mt-1">{formatCurrency(excursao.price)}</p>
                </div>
                <button className="bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                  Reservar Agora
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre esta excursão</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {excursao.description}
                </p>
              </div>

              {/* Features */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <svg className="h-8 w-8 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Duração Flexível</h3>
                  <p className="text-sm text-gray-600 mt-1">Conforme programação</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <svg className="h-8 w-8 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Guia Especializado</h3>
                  <p className="text-sm text-gray-600 mt-1">Acompanhamento profissional</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <svg className="h-8 w-8 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Segurança Total</h3>
                  <p className="text-sm text-gray-600 mt-1">Equipamentos certificados</p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Interessado nesta excursão?
                </h3>
                <p className="text-gray-600 mb-4">
                  Entre em contato conosco para mais informações e disponibilidade de datas.
                </p>
                <button className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors">
                  Solicitar Informações
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">Excursão não encontrada</p>
          </div>
        )}
      </main>
    </div>
  );
}
