'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { getOrdenesCompra, OrdenCompra, marcarEntregada, cancelarOrden } from '@/app/services/ordenCompraService';
import Table from '@/app/components/ui/Table';
import Badge from '@/app/components/ui/Badge';

export default function OrdenesCompraPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/'); return; }
    fetchOrdenes();
  }, [user]); // eslint-disable-line

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const data = await getOrdenesCompra();
      setOrdenes(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar ordenes');
    } finally {
      setLoading(false);
    }
  };

  const handleEntregar = async (id: number) => {
    if (!confirm('Marcar esta orden como entregada?')) return;
    try { await marcarEntregada(id); await fetchOrdenes(); }
    catch (err: any) { setError(err.message || 'Error'); }
  };

  const handleCancelar = async (id: number) => {
    if (!confirm('Cancelar esta orden?')) return;
    try { await cancelarOrden(id); await fetchOrdenes(); }
    catch (err: any) { setError(err.message || 'Error'); }
  };

  const getEstadoBadge = (estado: string) => {
    const map: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'info'> = {
      emitida: 'info', entregada: 'success', cancelada: 'danger',
    };
    return map[estado] || 'default';
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="text-gray-500">Cargando...</div></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-primary mb-6">Ordenes de Compra</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <Table headers={['Numero', 'Proveedor', 'Estado', 'Total', 'Fecha', 'Acciones']}>
        {ordenes.length === 0 ? (
          <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No hay ordenes de compra</td></tr>
        ) : (
          ordenes.map((orden) => (
            <tr key={orden.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{orden.numero}</td>
              <td className="px-6 py-4 whitespace-nowrap">{orden.proveedor?.nombre || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap"><Badge variant={getEstadoBadge(orden.estado)}>{orden.estado}</Badge></td>
              <td className="px-6 py-4 whitespace-nowrap">L. {Number(orden.total).toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(orden.fecha_emision).toLocaleDateString('es-HN')}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Link href={"/dashboard/ordenes-compra/" + orden.id} className="text-primary hover:underline mr-3">Ver</Link>
                {orden.estado === 'emitida' && (user?.rol === 'compras' || user?.rol === 'admin') && (
                  <>
                    <button onClick={() => handleEntregar(orden.id)} className="text-success hover:underline mr-3">Entregar</button>
                    <button onClick={() => handleCancelar(orden.id)} className="text-danger hover:underline">Cancelar</button>
                  </>
                )}
              </td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
}