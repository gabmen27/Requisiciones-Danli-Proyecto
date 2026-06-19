import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_por_defecto';

export const generarToken = (payload: {
  id:              number;
  rol:             string;
  empleado_dni:    string;
  username:        string;
  departamento_id: number | null;
}): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
};

export const verificarToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};