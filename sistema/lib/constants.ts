/**
 * Constantes globais da aplicação
 */

export const APP_NAME = 'Avoar Sistema';
export const APP_VERSION = '0.1.0';
export const APP_DESCRIPTION = 'Plataforma de gerenciamento de excursões e blog';

// URLs
export const ROUTES = {
  HOME: '/',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_BLOG: '/admin/blog',
  ADMIN_EXCURSOES: '/admin/excursoes',
  ADMIN_PAGAMENTO: '/admin/pagamento',
  PUBLIC_BLOG: '/blog',
  PUBLIC_EXCURSOES: '/excursoes',
  PUBLIC_CHECKOUT: '/checkout',
};

// APIs
export const API_ENDPOINTS = {
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  BLOG_LIST: '/api/blog',
  BLOG_CREATE: '/api/blog',
  BLOG_UPDATE: (id: string) => `/api/blog/${id}`,
  BLOG_DELETE: (id: string) => `/api/blog/${id}`,
  EXCURSOES_LIST: '/api/excursoes',
  EXCURSOES_CREATE: '/api/excursoes',
  EXCURSOES_UPDATE: (id: string) => `/api/excursoes/${id}`,
  EXCURSOES_DELETE: (id: string) => `/api/excursoes/${id}`,
  PAYMENT_CONFIG: '/api/pagamento/config',
  PAYMENT_CHECKOUT: '/api/pagamento/checkout',
};

// Provedores de Pagamento
export const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe',
  MERCADO_PAGO: 'mercado_pago',
  ASAAS: 'asaas',
  PAYPAL: 'paypal',
} as const;

// Mensagens Padrão
export const MESSAGES = {
  SUCCESS_LOGIN: 'Login realizado com sucesso!',
  SUCCESS_LOGOUT: 'Logout realizado com sucesso!',
  SUCCESS_CREATE: 'Criado com sucesso!',
  SUCCESS_UPDATE: 'Atualizado com sucesso!',
  SUCCESS_DELETE: 'Deletado com sucesso!',
  ERROR_INVALID_EMAIL: 'Email inválido',
  ERROR_INVALID_PASSWORD: 'Senha inválida',
  ERROR_USER_NOT_FOUND: 'Usuário não encontrado',
  ERROR_UNAUTHORIZED: 'Acesso não autorizado',
  ERROR_INTERNAL: 'Erro interno do servidor',
  ERROR_VALIDATION: 'Erro na validação dos dados',
  ERROR_NOT_FOUND: 'Recurso não encontrado',
};

// Paginação Padrão
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};

// Limites de Upload
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
};

// Status HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

// Duração de Cache (em segundos)
export const CACHE_DURATION = {
  SHORT: 60, // 1 minuto
  MEDIUM: 300, // 5 minutos
  LONG: 3600, // 1 hora
  VERY_LONG: 86400, // 1 dia
} as const;

// Regex Validação
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

// Cores Tema (Tailwind)
export const THEME_COLORS = {
  PRIMARY: 'blue-600',
  SECONDARY: 'gray-600',
  SUCCESS: 'green-600',
  DANGER: 'red-600',
  WARNING: 'yellow-600',
  INFO: 'blue-500',
} as const;
