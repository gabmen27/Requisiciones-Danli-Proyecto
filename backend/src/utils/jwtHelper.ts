import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_por_defecto';

// Interfaz para el payload del token
export interface TokenPayload {
  id: number;
  rol: string;
  empleado_dni: string;
}

/**
 * Genera un token JWT válido por 8 horas
 */
export const generarToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
};

/**
 * Verifica un token JWT y devuelve el payload si es válido, o null si no
 */
export const verificarToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};