import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import { registrarBitacora } from '../services/bitacoraService';

export const getUsuarios = async (req: AuthRequest, res: Response) => {
  try {
    const usuarios = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['id', 'ASC']],
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error });
  }
};

export const getUsuarioById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const usuario = await User.findByPk(parseInt(id), {
      attributes: { exclude: ['password_hash'] },
    });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (req.user?.rol !== 'admin' && req.user?.id !== usuario.id) {
      return res.status(403).json({ message: 'No tiene permisos para ver este usuario' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error });
  }
};

export const createUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { empleado_dni, username, password, rol, departamento_id } = req.body;
    if (!empleado_dni || !username || !password || !rol) {
      return res.status(400).json({ message: 'Faltan datos obligatorios (empleado_dni, username, password, rol)' });
    }
    const rolesValidos = ['admin', 'solicitante', 'compras', 'bienes', 'gerencia', 'alcaldia'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const usuario = await User.create({
      empleado_dni,
      username,
      password_hash,
      rol,
      departamento_id: departamento_id || null,
      activo: true,
    });
    await registrarBitacora({
      tabla_afectada: 'usuarios',
      registro_id: usuario.id,
      accion: 'crear',
      descripcion: `Usuario ${usuario.username} (rol: ${rol}) creado por ${req.user!.username}`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    res.status(201).json({
      id: usuario.id,
      empleado_dni: usuario.empleado_dni,
      username: usuario.username,
      rol: usuario.rol,
      departamento_id: usuario.departamento_id,
      activo: usuario.activo,
    });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'El username o el DNI ya existe' });
    }
    res.status(500).json({ message: 'Error al crear usuario', error });
  }
};

export const updateUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const usuario = await User.findByPk(parseInt(id));
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const { empleado_dni, username, rol, departamento_id, activo } = req.body;
    if (rol) {
      const rolesValidos = ['admin', 'solicitante', 'compras', 'bienes', 'gerencia', 'alcaldia'];
      if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ message: 'Rol inválido' });
      }
    }
    await usuario.update({
      empleado_dni: empleado_dni !== undefined ? empleado_dni : usuario.empleado_dni,
      username: username !== undefined ? username : usuario.username,
      rol: rol !== undefined ? rol : usuario.rol,
      departamento_id: departamento_id !== undefined ? departamento_id : usuario.departamento_id,
      activo: activo !== undefined ? activo : usuario.activo,
    });
    await registrarBitacora({
      tabla_afectada: 'usuarios',
      registro_id: usuario.id,
      accion: 'editar',
      descripcion: `Usuario ${usuario.username} actualizado por ${req.user!.username}`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    res.json({
      id: usuario.id,
      empleado_dni: usuario.empleado_dni,
      username: usuario.username,
      rol: usuario.rol,
      departamento_id: usuario.departamento_id,
      activo: usuario.activo,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error });
  }
};

export const cambiarPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const { password_actual, password_nuevo } = req.body;
    if (!password_nuevo) {
      return res.status(400).json({ message: 'La nueva contraseña es obligatoria' });
    }
    const usuario = await User.findByPk(parseInt(id));
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (req.user?.rol !== 'admin') {
      if (!password_actual) {
        return res.status(400).json({ message: 'Debe proporcionar la contraseña actual' });
      }
      const valida = await bcrypt.compare(password_actual, usuario.password_hash);
      if (!valida) {
        return res.status(401).json({ message: 'Contraseña actual incorrecta' });
      }
    }
    const newHash = await bcrypt.hash(password_nuevo, 10);
    await usuario.update({ password_hash: newHash });
    await registrarBitacora({
      tabla_afectada: 'usuarios',
      registro_id: usuario.id,
      accion: 'editar',
      descripcion: `Contraseña de usuario ${usuario.username} actualizada por ${req.user!.username}`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar contraseña', error });
  }
};

export const deleteUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const usuario = await User.findByPk(parseInt(id));
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (usuario.id === req.user!.id) {
      return res.status(400).json({ message: 'No puede desactivar su propio usuario' });
    }
    await usuario.update({ activo: false });
    await registrarBitacora({
      tabla_afectada: 'usuarios',
      registro_id: usuario.id,
      accion: 'editar',
      descripcion: `Usuario ${usuario.username} desactivado por ${req.user!.username}`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    res.json({ message: 'Usuario desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al desactivar usuario', error });
  }
};