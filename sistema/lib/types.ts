// Tipos para Usuários
export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

// Tipos para Blog Posts
export interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  content: string; // JSON do TipTap
  author_id: string;
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

export type BlogPostWithAuthor = BlogPost & {
  author?: User;
};

// Tipos para Excursões
export interface Excursao {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string | null;
  featured_image_url: string | null;
  price: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Tipos para Configuração de Pagamento
export interface PaymentConfiguration {
  id: string;
  provider: 'stripe' | 'mercado_pago' | 'asaas' | 'paypal';
  api_key: string;
  secret_key: string;
  webhook_url: string | null;
  active: boolean;
  updated_at: Date;
}

// Tipos para Respostas da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Tipos para Erros
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Tipos para Contexto de Autenticação
export interface AuthContext {
  userId?: string;
  email?: string;
  isAuthenticated: boolean;
}
