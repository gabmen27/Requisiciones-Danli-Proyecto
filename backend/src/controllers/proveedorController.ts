import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Proveedor from '../models/Proveedor';
import { registrarBitacora } from '../services/bitacoraService';

export const getProveedores = async (req: AuthRequest, res: Response) => {
  try {
    const proveedores = await Proveedor.findAll({ where: { activo: true } });
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener proveedores', error });
  }
};

export const getProveedorById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const proveedor = await Proveedor.findByPk(parseInt(id));
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    res.json(proveedor);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener proveedor', error });
  }
};

export const createProveedor = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, rtn, direccion, correo, telefono } = req.body;
    if (!nombre || !rtn) {
      return res.status(400).json({ message: 'Nombre y RTN son obligatorios' });
    }
    const proveedor = await Proveedor.create({ nombre, rtn, direccion, correo, telefono });
    
    await registrarBitacora({
      tabla_afectada: 'proveedores',
      registro_id: proveedor.id,
      accion: 'crear',
      descripcion: `Proveedor creado: ${nombre} (RTN: ${rtn})`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    
    res.status(201).json(proveedor);
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'El RTN ya existe' });
    }
    res.status(500).json({ message: 'Error al crear proveedor', error });
  }
};

export const updateProveedor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const proveedor = await Proveedor.findByPk(parseInt(id));
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    await proveedor.update(req.body);
    
    await registrarBitacora({
      tabla_afectada: 'proveedores',
      registro_id: proveedor.id,
      accion: 'editar',
      descripcion: `Proveedor actualizado: ${proveedor.nombre}`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    
    res.json(proveedor);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar proveedor', error });
  }
};

export const deleteProveedor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const proveedor = await Proveedor.findByPk(parseInt(id));
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    await proveedor.update({ activo: false });
    
    await registrarBitacora({
      tabla_afectada: 'proveedores',
      registro_id: proveedor.id,
      accion: 'editar',
      descripcion: `Proveedor desactivado: ${proveedor.nombre}`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    
    res.json({ message: 'Proveedor eliminado (desactivado)' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar proveedor', error });
  }
};