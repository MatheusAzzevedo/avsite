'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/lib/utils';

interface Excursao {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  price: number;
}

export default function ExcursoesPage() {
  const [excursoes, setExcursoes] = useState<Excursao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExcursoes();
  }, []);

  const fetchExcursoes = async () => {
    try {
      logger.info('PUBLIC_EXCURSOES', 'Carregando excursões ativas');
      const response = await fetch('/api/excursoes?active=true');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar excursões');
      }

      const data = await response.json();
      setExcursoes(data.data);
      logger.success('PUBLIC_EXCURSOES', `${data.data.length} excursões carregadas`);
    } catch (error: any) {
      logger.error('PUBLIC_EXCURSOES', 'Erro ao carregar excursões', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Excursões</h1>
          <p className="text-xl text-gray-600">Conheça nossas aventuras ecológicas</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando excursões...</p>
          </div>
        ) : excursoes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhuma excursão disponível no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {excursoes.map((excursao) => (
              <Link key={excursao.id} href={`/excursoes/${excursao.id}`}>
                <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer h-full overflow-hidden">
                  {/* Image */}
                  {excursao.image_url && (
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={excursao.image_url}
                        alt={excursao.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{excursao.title}</h3>
                    <p className="text-gray-600 mb-3">{excursao.subtitle}</p>
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">{excursao.description}</p>
                    
                    {/* Price */}
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(excursao.price)}
                      </span>
                      <span className="text-sm text-blue-600 font-medium hover:text-blue-800">
                        Ver detalhes →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
