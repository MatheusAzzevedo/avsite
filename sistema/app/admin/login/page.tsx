'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginSchema } from '@/lib/validation';
import { ROUTES, API_ENDPOINTS, MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validar com Zod
      logger.debug('LOGIN', 'Validando dados de login');
      const validatedData = loginSchema.parse({ email, password });

      logger.info('LOGIN', 'Enviando requisição de login');
      
      // Enviar para API
      const response = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || MESSAGES.ERROR_INTERNAL);
      }

      // Armazenar token
      logger.success('LOGIN', 'Login realizado com sucesso');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirecionar para dashboard
      router.push(ROUTES.ADMIN_DASHBOARD);
    } catch (err: any) {
      logger.error('LOGIN', 'Erro no login', err);
      
      if (err.errors) {
        // Erro de validação Zod
        setError(err.errors[0].message);
      } else {
        setError(err.message || MESSAGES.ERROR_INTERNAL);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background gradient effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.1,
        background: 'linear-gradient(to bottom right, rgba(250, 204, 21, 0.3), rgba(0, 0, 0, 1))'
      }}></div>

      {/* Left Side - Branding (hidden) */}
      <div className="login-branding"></div>

      {/* Right Side - Login Form */}
      <div className="login-form-container">
        <div className="login-form-box">
          {/* Form Container */}
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Acesso ao Painel</h2>
            <p>Digite suas credenciais para continuar</p>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@avoar.com.br"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div className="login-field">
              <label htmlFor="password">Senha</label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg className="animate-spin" style={{ marginRight: '0.75rem', height: '1.25rem', width: '1.25rem' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Autenticando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="login-footer">
            © 2025 Avoar Turismo Ecológico
          </p>
        </div>
      </div>

      {/* Decorative Circles */}
      <div className="login-decorative login-decorative-1"></div>
      <div className="login-decorative login-decorative-2"></div>
    </div>
  );
}
