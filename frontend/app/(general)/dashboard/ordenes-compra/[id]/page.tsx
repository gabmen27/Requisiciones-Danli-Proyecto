'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { getOrdenCompraById, OrdenCompra, marcarEntregada, cancelarOrden } from '@/app/services/ordenCompraService';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';

export default function OrdenCompraDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/');
      return;
    }
    if (id) {
      fetchOrden();
    }
  }, [id, token]);

  const fetchOrden = async () => {
    try {
      setLoading(true);
      const data = await getOrdenCompraById(Number(id));
      setOrden(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la orden');
    } finally {
      setLoading(false);
    }
  };

  const handleEntregar = async () => {
    if (!orden) return;
    if (!confirm('¿Marcar esta orden como entregada?')) return;
    try {
      setActionLoading(true);
      await marcarEntregada(orden.id);
      await fetchOrden();
    } catch (err: any) {
      setError(err.message || 'Error al marcar como entregada');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!orden) return;
    if (!confirm('¿Cancelar esta orden?')) return;
    try {
      setActionLoading(true);
      await cancelarOrden(orden.id);
      await fetchOrden();
    } catch (err: any) {
      setError(err.message || 'Error al cancelar');
    } finally {
      setActionLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const map: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'info'> = {
      emitida: 'info',
      entregada: 'success',
      cancelada: 'danger',
    };
    return map[estado] || 'default';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Orden no encontrada
        </div>
      </div>
    );
  }

  const isComprasOrAdmin = user?.rol === 'compras' || user?.rol === 'admin';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">
          Orden de Compra {orden.numero}
        </h1>
        <button
          onClick={() => router.push('/dashboard/ordenes-compra')}
          className="text-primary hover:underline"
        >
          ← Volver al listado
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <p className="font-medium"><Badge variant={getEstadoBadge(orden.estado)}>{orden.estado}</Badge></p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Proveedor</p>
            <p className="font-medium">{orden.proveedor?.nombre || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">RTN</p>
            <p className="font-medium">{orden.proveedor?.rtn || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha de emisión</p>
            <p className="font-medium">{new Date(orden.fecha_emision).toLocaleString('es-HN')}</p>
          </div>
          {orden.fecha_entrega && (
            <div>
              <p className="text-sm text-gray-500">Fecha de entrega</p>
              <p className="font-medium">{new Date(orden.fecha_entrega).toLocaleString('es-HN')}</p>
            </div>
          )}
          {orden.notas && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Notas</p>
              <p className="font-medium">{orden.notas}</p>
            </div>
          )}
        </div>
      </Card>

      {orden.OrdenCompraDetalles && orden.OrdenCompraDetalles.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Detalles</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Descripción</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cantidad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Precio</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ISV</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {orden.OrdenCompraDetalles.map((det) => (
                  <tr key={det.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{det.numero_linea}</td>
                    <td className="px-4 py-2">{det.descripcion}</td>
                    <td className="px-4 py-2">{det.cantidad}</td>
                    <td className="px-4 py-2">L. {det.precio_unitario.toFixed(2)}</td>
                    <td className="px-4 py-2">{det.aplica_isv ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-2">L. {det.valor_total?.toFixed(2) || 0}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right">Subtotal:</td>
                  <td className="px-4 py-2">L. {orden.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right">Descuento:</td>
                  <td className="px-4 py-2">L. {orden.descuento.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right">ISV:</td>
                  <td className="px-4 py-2">L. {orden.impuesto.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right">Total:</td>
                  <td className="px-4 py-2">L. {orden.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {orden.estado === 'emitida' && isComprasOrAdmin && (
        <div className="flex gap-3">
          <Button onClick={handleEntregar} disabled={actionLoading} variant="success">
            {actionLoading ? 'Procesando...' : 'Marcar como entregada'}
          </Button>
          <Button onClick={handleCancelar} disabled={actionLoading} variant="danger">
            {actionLoading ? 'Procesando...' : 'Cancelar orden'}
          </Button>
        </div>
      )}
    </div>
  );
}