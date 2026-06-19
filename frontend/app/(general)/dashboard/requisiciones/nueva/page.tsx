'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { createRequisicion } from '@/app/services/requisicionService';
import { getProveedores } from '@/app/services/proveedorService';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Select from '@/app/components/ui/Select';

export default function NuevaRequisicionPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proveedores, setProveedores] = useState<{ id: number; nombre: string }[]>([]);

  const [formData, setFormData] = useState({
    tipo: 'compras',
    departamento_id: 4,
    dirigida_a: 'compras',
    proveedor_id: null as number | null,
    observaciones: '',
    detalles: [] as { descripcion: string; cantidad: number; precio_unitario: number; aplica_isv: boolean }[],
  });

  const [nuevoDetalle, setNuevoDetalle] = useState({
    descripcion: '',
    cantidad: 1,
    precio_unitario: 0,
    aplica_isv: true,
  });

  useEffect(() => {
    if (!token) {
      router.push('/');
      return;
    }
    cargarProveedores();
  }, [token]);

  const cargarProveedores = async () => {
    try {
      const data = await getProveedores();
      setProveedores(data);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    }
  };

  const agregarDetalle = () => {
    if (!nuevoDetalle.descripcion || nuevoDetalle.cantidad <= 0 || nuevoDetalle.precio_unitario <= 0) {
      setError('Complete todos los campos del detalle');
      return;
    }
    setFormData({
      ...formData,
      detalles: [...formData.detalles, { ...nuevoDetalle }],
    });
    setNuevoDetalle({ descripcion: '', cantidad: 1, precio_unitario: 0, aplica_isv: true });
    setError('');
  };

  const eliminarDetalle = (index: number) => {
    setFormData({
      ...formData,
      detalles: formData.detalles.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.detalles.length === 0) {
      setError('Debe agregar al menos un detalle');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = {
        ...formData,
        proveedor_id: formData.proveedor_id || undefined,
        detalles: formData.detalles.map((d, idx) => ({
          ...d,
          numero_linea: idx + 1,
        })),
      };
      await createRequisicion(data);
      router.push('/dashboard/requisiciones');
    } catch (err: any) {
      setError(err.message || 'Error al crear la requisición');
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear el precio con dos decimales al perder el foco
  const handlePrecioBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setNuevoDetalle({ ...nuevoDetalle, precio_unitario: value });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">Nueva Requisición</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              options={[
                { value: 'compras', label: 'Compras (bienes externos)' },
                { value: 'bienes', label: 'Bienes (consumibles internos)' },
              ]}
            />

            <Select
              label="Dirigida a"
              value={formData.dirigida_a}
              onChange={(e) => setFormData({ ...formData, dirigida_a: e.target.value })}
              options={[
                { value: 'compras', label: 'Compras' },
                { value: 'bienes', label: 'Bienes' },
              ]}
            />

            <Select
              label="Proveedor (opcional)"
              value={formData.proveedor_id || ''}
              onChange={(e) => setFormData({ ...formData, proveedor_id: e.target.value ? Number(e.target.value) : null })}
              options={proveedores.map((p) => ({ value: p.id, label: p.nombre }))}
            />

            <Input
              label="Observaciones"
              type="text"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Detalles adicionales de la requisición (opcional)"
            />
          </div>
        </Card>

        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Detalles de la requisición</h3>
          <p className="text-sm text-gray-500 mb-4">
            Agregue los productos o servicios que desea solicitar. Cada detalle debe incluir descripción, cantidad y precio unitario.
          </p>

          {/* Campos para agregar un nuevo detalle - ahora con grid uniforme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                type="text"
                placeholder="Ej. Laptop HP"
                value={nuevoDetalle.descripcion}
                onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, descripcion: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input
                type="number"
                placeholder="Número de unidades"
                value={nuevoDetalle.cantidad}
                onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, cantidad: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio unitario (Lempiras)</label>
              <input
                type="number"
                placeholder="0.00"
                value={nuevoDetalle.precio_unitario || ''}
                onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, precio_unitario: parseFloat(e.target.value) || 0 })}
                onBlur={handlePrecioBlur}
                className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <Button type="button" variant="success" onClick={agregarDetalle} className="mt-2">
            + Agregar detalle
          </Button>

          {formData.detalles.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Descripción</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cantidad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Precio</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ISV</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.detalles.map((det, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{det.descripcion}</td>
                      <td className="px-4 py-2">{det.cantidad}</td>
                      <td className="px-4 py-2">L. {Number(det.precio_unitario).toFixed(2)}</td>
                      <td className="px-4 py-2">{det.aplica_isv ? 'Sí' : 'No'}</td>
                      <td className="px-4 py-2">L. {(det.cantidad * det.precio_unitario).toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => eliminarDetalle(idx)}
                          className="text-danger hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right">Subtotal:</td>
                    <td className="px-4 py-2">
                      L. {formData.detalles.reduce((sum, d) => sum + d.cantidad * d.precio_unitario, 0).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/requisiciones')}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Guardar Borrador
          </Button>
        </div>
      </form>
    </div>
  );
}