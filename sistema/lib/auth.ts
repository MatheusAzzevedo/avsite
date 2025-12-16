import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-key-mude-em-producao';
const JWT_EXPIRY = '7d';

// Interface para o payload do JWT
export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Gera um hash de senha usando bcrypt
 * @param password - Senha em texto plano
 * @returns Hash criptografado da senha
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compara uma senha com seu hash
 * @param password - Senha em texto plano
 * @param hash - Hash da senha armazenada
 * @returns True se as senhas correspondem
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Gera um token JWT
 * @param payload - Dados a serem encriptados no token
 * @returns Token JWT
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Valida e decodifica um token JWT
 * @param token - Token JWT a ser validado
 * @returns Payload decodificado ou null se inválido
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Extrai o token do header Authorization
 * @param authHeader - Header Authorization (ex: "Bearer token")
 * @returns Token ou null se não encontrado
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}
