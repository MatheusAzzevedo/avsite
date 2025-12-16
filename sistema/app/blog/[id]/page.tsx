'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { formatDate } from '@/lib/utils';

interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  author_email: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface TipTapContent {
  type: string;
  content?: any[];
  text?: string;
  marks?: any[];
  attrs?: any;
}

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (postId) {
      fetchPost(postId);
    }
  }, [postId]);

  const fetchPost = async (id: string) => {
    try {
      logger.info('PUBLIC_BLOG_DETAIL', 'Carregando post', { postId: id });
      const response = await fetch(`/api/blog/${id}`);

      if (!response.ok) {
        throw new Error('Post não encontrado');
      }

      const data = await response.json();
      
      if (!data.data.published) {
        setError('Este post não está disponível');
        return;
      }

      setPost(data.data);
      logger.success('PUBLIC_BLOG_DETAIL', 'Post carregado com sucesso');
    } catch (err: any) {
      logger.error('PUBLIC_BLOG_DETAIL', 'Erro ao carregar post', err);
      setError(err.message || 'Erro ao carregar post');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (content: string) => {
    try {
      const data = JSON.parse(content) as { content?: TipTapContent[] };
      
      return (
        <div className="prose prose-lg max-w-none">
          {data.content?.map((node, index) => {
            if (node.type === 'paragraph') {
              return (
                <p key={index} className="mb-4">
                  {node.content?.map((item) => {
                    let text = item.text || '';
                    
                    if (item.marks?.some((m: any) => m.type === 'bold')) {
                      text = `**${text}**`;
                    }
                    if (item.marks?.some((m: any) => m.type === 'italic')) {
                      text = `*${text}*`;
                    }
                    
                    return text;
                  }).join('')}
                </p>
              );
            }
            
            if (node.type === 'heading') {
              const level = node.attrs?.level || 1;
              const Tag = `h${level + 1}` as keyof JSX.IntrinsicElements;
              return (
                <Tag key={index} className={`mb-4 font-bold text-${5 - level}xl`}>
                  {node.content?.map((item) => item.text).join('')}
                </Tag>
              );
            }

            if (node.type === 'bulletList') {
              return (
                <ul key={index} className="list-disc list-inside mb-4">
                  {node.content?.map((item, i) => (
                    <li key={i} className="mb-2">
                      {item.content?.map((c: any) => c.text).join('')}
                    </li>
                  ))}
                </ul>
              );
            }

            if (node.type === 'orderedList') {
              return (
                <ol key={index} className="list-decimal list-inside mb-4">
                  {node.content?.map((item, i) => (
                    <li key={i} className="mb-2">
                      {item.content?.map((c: any) => c.text).join('')}
                    </li>
                  ))}
                </ol>
              );
            }

            return null;
          })}
        </div>
      );
    } catch (e) {
      logger.error('PUBLIC_BLOG_DETAIL', 'Erro ao parsear conteúdo', e);
      return <p className="text-gray-700">{content}</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex justify-between items-start">
          <div>
            <button
              onClick={() => router.push('/blog')}
              className="text-blue-600 hover:text-blue-900 mb-4 font-medium"
            >
              ← Voltar ao Blog
            </button>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-full"></div>
              </div>
            ) : post ? (
              <>
                <h1 className="text-4xl font-bold text-gray-900">{post.title}</h1>
                <p className="text-xl text-gray-600 mt-2">{post.subtitle}</p>
              </>
            ) : (
              <p className="text-red-600">Erro ao carregar post</p>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando post...</p>
          </div>
        ) : post ? (
          <article className="bg-white rounded-lg shadow-md p-8">
            {/* Metadata */}
            <div className="flex justify-between items-center mb-8 pb-8 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-600">
                  Por <span className="font-medium text-gray-900">{post.author_email}</span>
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(post.created_at)}
                </p>
              </div>
              {post.updated_at !== post.created_at && (
                <p className="text-sm text-gray-500">
                  Atualizado em {formatDate(post.updated_at)}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              {renderContent(post.content)}
            </div>
          </article>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">Post não encontrado</p>
          </div>
        )}
      </main>
    </div>
  );
}
