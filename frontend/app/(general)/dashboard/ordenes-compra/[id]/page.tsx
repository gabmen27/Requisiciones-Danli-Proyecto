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
  const { user } = useAuth();
  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrden = async () => {
    try {
      setLoading(true);
      const data = await getOrdenCompraById(Number(id));
      setOrden(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Error al cargar la orden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { router.push('/'); return; }
    if (id) fetchOrden();
  }, [id, user]); // eslint-disable-line

  const handleEntregar = async () => {
    if (!orden || !confirm('Marcar como entregada?')) return;
    try {
      setActionLoading(true);
      await marcarEntregada(orden.id);
      await fetchOrden();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Error');
    } finally { setActionLoading(false); }
  };

  const handleCancelar = async () => {
    if (!orden || !confirm('Cancelar esta orden?')) return;
    try {
      setActionLoading(true);
      await cancelarOrden(orden.id);
      await fetchOrden();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Error');
    } finally { setActionLoading(false); }
  };

  const getEstadoBadge = (estado: string) => {
    const map: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'info'> = {
      emitida: 'info', entregada: 'success', cancelada: 'danger',
    };
    return map[estado] || 'default';
  };

  const fmt = (v: unknown) => { const n = Number(v); return isNaN(n) ? '0.00' : n.toFixed(2); };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="text-gray-500">Cargando...</div></div>;
  if (!orden) return <div className="p-6"><div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">No encontrada</div></div>;

  const isComprasOrAdmin = user?.rol === 'compras' || user?.rol === 'admin';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Orden {orden.numero}</h1>
        <button onClick={() => router.push('/dashboard/ordenes-compra')} className="text-primary hover:underline">Volver</button>
      </div>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <Card className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-sm text-gray-500">Estado</p><Badge variant={getEstadoBadge(orden.estado)}>{orden.estado}</Badge></div>
          <div><p className="text-sm text-gray-500">Proveedor</p><p className="font-medium">{orden.proveedor?.nombre || 'N/A'}</p></div>
          <div><p className="text-sm text-gray-500">RTN</p><p className="font-medium">{orden.proveedor?.rtn || 'N/A'}</p></div>
          <div><p className="text-sm text-gray-500">Fecha emision</p><p className="font-medium">{new Date(orden.fecha_emision).toLocaleString('es-HN')}</p></div>
          {orden.fecha_entrega && <div><p className="text-sm text-gray-500">Fecha entrega</p><p className="font-medium">{new Date(orden.fecha_entrega).toLocaleString('es-HN')}</p></div>}
          {orden.notas && <div className="col-span-2"><p className="text-sm text-gray-500">Notas</p><p className="font-medium">{orden.notas}</p></div>}
        </div>
      </Card>
      {orden.OrdenCompraDetalles && orden.OrdenCompraDetalles.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Detalles</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Descripcion</th>
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
                  <td className="px-4 py-2">L. {fmt(det.precio_unitario)}</td>
                  <td className="px-4 py-2">{det.aplica_isv ? 'Si' : 'No'}</td>
                  <td className="px-4 py-2">L. {fmt(det.valor_total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr><td colSpan={5} className="px-4 py-2 text-right">Subtotal:</td><td className="px-4 py-2">L. {fmt(orden.subtotal)}</td></tr>
              <tr><td colSpan={5} className="px-4 py-2 text-right">Descuento:</td><td className="px-4 py-2">L. {fmt(orden.descuento)}</td></tr>
              <tr><td colSpan={5} className="px-4 py-2 text-right">ISV:</td><td className="px-4 py-2">L. {fmt(orden.impuesto)}</td></tr>
              <tr><td colSpan={5} className="px-4 py-2 text-right">Total:</td><td className="px-4 py-2">L. {fmt(orden.total)}</td></tr>
            </tfoot>
          </table>
        </Card>
      )}
      {orden.estado === 'emitida' && isComprasOrAdmin && (
        <div className="flex gap-3">
          <Button onClick={handleEntregar} disabled={actionLoading} variant="success">{actionLoading ? 'Procesando...' : 'Marcar entregada'}</Button>
          <Button onClick={handleCancelar} disabled={actionLoading} variant="danger">{actionLoading ? 'Procesando...' : 'Cancelar orden'}</Button>
        </div>
      )}
    </div>
  );
}