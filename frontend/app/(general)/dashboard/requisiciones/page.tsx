'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { getRequisiciones, Requisicion, enviarAprobacion, aprobarRequisicion, rechazarRequisicion } from '@/app/services/requisicionService';
import Button from '@/app/components/ui/Button';
import Table from '@/app/components/ui/Table';
import Badge from '@/app/components/ui/Badge';

export default function RequisicionesPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [requisiciones, setRequisiciones] = useState<Requisicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/');
      return;
    }
    fetchRequisiciones();
  }, [token]);

  const fetchRequisiciones = async () => {
    try {
      setLoading(true);
      const data = await getRequisiciones();
      setRequisiciones(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar requisiciones');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarAprobacion = async (id: number) => {
    try {
      await enviarAprobacion(id);
      await fetchRequisiciones();
    } catch (err: any) {
      setError(err.message || 'Error al enviar a aprobación');
    }
  };

  const handleAprobar = async (id: number) => {
    if (!confirm('¿Estás seguro de aprobar esta requisición?')) return;
    try {
      await aprobarRequisicion(id, 'gerencia');
      await fetchRequisiciones();
    } catch (err: any) {
      setError(err.message || 'Error al aprobar');
    }
  };

  const handleRechazar = async (id: number) => {
    const motivo = prompt('Motivo del rechazo:');
    if (motivo === null) return;
    try {
      await rechazarRequisicion(id, motivo);
      await fetchRequisiciones();
    } catch (err: any) {
      setError(err.message || 'Error al rechazar');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const map: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'info'> = {
      borrador: 'default',
      pendiente: 'warning',
      aprobada: 'success',
      rechazada: 'danger',
      comprometida: 'info',
      anulada: 'default',
    };
    return map[estado] || 'default';
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      borrador: 'Borrador',
      pendiente: 'Pendiente',
      aprobada: 'Aprobada',
      rechazada: 'Rechazada',
      comprometida: 'Comprometida',
      anulada: 'Anulada',
    };
    return labels[estado] || estado;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando requisiciones...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-primary hover:underline flex items-center gap-1 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-primary">Requisiciones</h1>
        </div>
        <Link href="/dashboard/requisiciones/nueva">
          <Button variant="primary" className="shadow-md hover:shadow-lg transition-shadow">
            + Nueva Requisición
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Table headers={['Número', 'Tipo', 'Estado', 'Total', 'Fecha', 'Acciones']}>
        {requisiciones.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
              No hay requisiciones registradas
            </td>
          </tr>
        ) : (
          requisiciones.map((req) => (
            <tr key={req.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{req.numero}</td>
              <td className="px-6 py-4 whitespace-nowrap capitalize">{req.tipo}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={getEstadoBadge(req.estado)}>{getEstadoLabel(req.estado)}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">L. {Number(req.total).toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(req.fecha_creacion).toLocaleDateString('es-HN')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/dashboard/requisiciones/${req.id}`}>
                    <Button variant="primary" size="sm">Ver</Button>
                  </Link>
                  {req.estado === 'borrador' && (
                    <Button variant="warning" size="sm" onClick={() => handleEnviarAprobacion(req.id)}>
                      Enviar
                    </Button>
                  )}
                  {req.estado === 'pendiente' && (user?.rol === 'gerencia' || user?.rol === 'alcaldia' || user?.rol === 'admin') && (
                    <>
                      <Button variant="success" size="sm" onClick={() => handleAprobar(req.id)}>
                        Aprobar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleRechazar(req.id)}>
                        Rechazar
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
}