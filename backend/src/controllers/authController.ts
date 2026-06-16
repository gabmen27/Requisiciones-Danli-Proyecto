import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generarToken } from '../utils/jwtHelper';
import { registrarBitacora } from '../services/bitacoraService';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }
    const user = await User.findOne({ where: { username, activo: true } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const passwordValido = await bcrypt.compare(password, user.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const token = generarToken({
      id: user.id,
      rol: user.rol,
      empleado_dni: user.empleado_dni,
      username: user.username,
    });
    await user.update({ ultimo_acceso: new Date() });
    await registrarBitacora({
      tabla_afectada: 'usuarios',
      registro_id: user.id,
      accion: 'login',
      descripcion: `Inicio de sesión exitoso - usuario: ${username}`,
      empleado_dni: user.empleado_dni,
      ip_address: req.ip,
    });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        rol: user.rol,
        empleado_dni: user.empleado_dni,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};