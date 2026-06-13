import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/jwtHelper';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    rol: string;
    empleado_dni: string;
    username: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No autorizado, token requerido' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verificarToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  req.user = decoded;
  next();
};