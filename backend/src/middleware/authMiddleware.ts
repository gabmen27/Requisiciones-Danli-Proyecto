import { Request, Response, NextFunction } from 'express';
import { verificarToken, TokenPayload } from '../utils/jwtHelper';

// Extendemos la interfaz Request de Express para incluir 'user'
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No autorizado: token no proporcionado' });
  }

  // El formato esperado es "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No autorizado: formato de token inválido' });
  }

  const decoded = verificarToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'No autorizado: token inválido o expirado' });
  }

  req.user = decoded;
  next();
};