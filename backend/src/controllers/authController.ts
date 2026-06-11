import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generarToken } from '../utils/jwtHelper';
import { registrarBitacora } from '../services/bitacoraService';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validar que llegaron los datos
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    // Buscar usuario por username y que esté activo
    const user = await User.findOne({ where: { username, activo: true } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Comparar contraseña (la que envía el usuario vs el hash almacenado)
    const passwordValido = await bcrypt.compare(password, user.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = generarToken({
      id: user.id,
      rol: user.rol,
      empleado_dni: user.empleado_dni,
    });

    // Actualizar fecha de último acceso
    await user.update({ ultimo_acceso: new Date() });

    // Registrar en bitácora
    await registrarBitacora({
      tabla_afectada: 'usuarios',
      registro_id: user.id,
      accion: 'login',
      descripcion: `Inicio de sesión exitoso - usuario: ${username}`,
      empleado_dni: user.empleado_dni,
      ip_address: req.ip,
    });

    // Responder con el token y datos básicos del usuario (sin la contraseña)
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