'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { formatDate } from '@/lib/utils';

interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  author_email: string;
  created_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      logger.info('PUBLIC_BLOG', 'Carregando posts publicados');
      const response = await fetch('/api/blog?published=true');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar posts');
      }

      const data = await response.json();
      setPosts(data.data);
      logger.success('PUBLIC_BLOG', `${data.data.length} posts carregados`);
    } catch (error: any) {
      logger.error('PUBLIC_BLOG', 'Erro ao carregar posts', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Blog</h1>
          <p className="text-xl text-gray-600">Conheça mais sobre nossas excursões e ecologia</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhum post disponível no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full p-6 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-gray-600 mb-4 flex-grow">{post.subtitle}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{post.author_email}</span>
                    <span>{formatDate(post.created_at)}</span>
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
