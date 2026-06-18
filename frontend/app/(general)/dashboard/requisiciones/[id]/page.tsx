'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import {
  getRequisicionById,
  enviarAprobacion,
  aprobarRequisicion,
  rechazarRequisicion,
  Requisicion,
} from '@/app/services/requisicionService';
import { generarOrdenCompra } from '@/app/services/ordenCompraService';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';

export default function RequisicionDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [requisicion, setRequisicion] = useState<Requisicion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/');
      return;
    }
    if (id) {
      fetchRequisicion();
    }
  }, [id, token]);

  const fetchRequisicion = async () => {
    try {
      setLoading(true);
      const data = await getRequisicionById(Number(id));
      setRequisicion(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar requisición');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarAprobacion = async () => {
    if (!requisicion) return;
    try {
      setActionLoading(true);
      await enviarAprobacion(requisicion.id);
      await fetchRequisicion();
    } catch (err: any) {
      setError(err.message || 'Error al enviar a aprobación');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAprobar = async () => {
    if (!requisicion) return;
    try {
      setActionLoading(true);
      await aprobarRequisicion(requisicion.id, 'gerencia');
      await fetchRequisicion();
    } catch (err: any) {
      setError(err.message || 'Error al aprobar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (!requisicion) return;
    const motivo = prompt('Motivo del rechazo:');
    if (motivo === null) return;
    try {
      setActionLoading(true);
      await rechazarRequisicion(requisicion.id, motivo);
      await fetchRequisicion();
    } catch (err: any) {
      setError(err.message || 'Error al rechazar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerarOrden = async () => {
    if (!requisicion) return;
    try {
      setActionLoading(true);
      const orden = await generarOrdenCompra({ requisicion_id: requisicion.id });
      router.push(`/dashboard/ordenes-compra/${orden.id}`);
    } catch (err: any) {
      setError(err.message || 'Error al generar orden de compra');
    } finally {
      setActionLoading(false);
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
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!requisicion) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Requisición no encontrada
        </div>
      </div>
    );
  }

  const isGerenciaOrAlcaldia = user?.rol === 'gerencia' || user?.rol === 'alcaldia' || user?.rol === 'admin';
  const isComprasOrAdmin = user?.rol === 'compras' || user?.rol === 'admin';

  // Función para formatear números con seguridad
  const formatCurrency = (value: any): string => {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">
          Requisición {requisicion.numero}
        </h1>
        <button
          onClick={() => router.push('/dashboard/requisiciones')}
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
            <p className="text-sm text-gray-500">Tipo</p>
            <p className="font-medium">{requisicion.tipo === 'compras' ? 'Compras' : 'Bienes'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <p className="font-medium">
              <Badge variant={getEstadoBadge(requisicion.estado)}>
                {getEstadoLabel(requisicion.estado)}
              </Badge>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Dirigida a</p>
            <p className="font-medium capitalize">{requisicion.dirigida_a}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha de creación</p>
            <p className="font-medium">
              {new Date(requisicion.fecha_creacion).toLocaleString('es-HN')}
            </p>
          </div>
          {requisicion.proveedor_nombre_snap && (
            <div>
              <p className="text-sm text-gray-500">Proveedor</p>
              <p className="font-medium">{requisicion.proveedor_nombre_snap}</p>
            </div>
          )}
          {requisicion.aprobado_por && (
            <div>
              <p className="text-sm text-gray-500">Aprobado por</p>
              <p className="font-medium capitalize">{requisicion.aprobado_por}</p>
            </div>
          )}
        </div>
        {requisicion.observaciones && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Observaciones</p>
            <p className="font-medium">{requisicion.observaciones}</p>
          </div>
        )}
      </Card>

      {requisicion.RequisicionDetalles && requisicion.RequisicionDetalles.length > 0 && (
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
                {requisicion.RequisicionDetalles.map((det) => (
                  <tr key={det.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{det.numero_linea}</td>
                    <td className="px-4 py-2">{det.descripcion}</td>
                    <td className="px-4 py-2">{det.cantidad}</td>
                    <td className="px-4 py-2">
                      L. {formatCurrency(det.precio_unitario)}
                    </td>
                    <td className="px-4 py-2">{det.aplica_isv ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-2">
                      L. {formatCurrency(det.valor_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right">Subtotal:</td>
                  <td className="px-4 py-2">L. {formatCurrency(requisicion.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right">ISV:</td>
                  <td className="px-4 py-2">L. {formatCurrency(requisicion.total_isv)}</td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right">Total:</td>
                  <td className="px-4 py-2">L. {formatCurrency(requisicion.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        {requisicion.estado === 'borrador' && (
          <Button
            onClick={handleEnviarAprobacion}
            disabled={actionLoading}
            variant="warning"
          >
            {actionLoading ? 'Procesando...' : 'Enviar a Aprobación'}
          </Button>
        )}

        {requisicion.estado === 'pendiente' && isGerenciaOrAlcaldia && (
          <>
            <Button
              onClick={handleAprobar}
              disabled={actionLoading}
              variant="success"
            >
              {actionLoading ? 'Procesando...' : 'Aprobar'}
            </Button>
            <Button
              onClick={handleRechazar}
              disabled={actionLoading}
              variant="danger"
            >
              {actionLoading ? 'Procesando...' : 'Rechazar'}
            </Button>
          </>
        )}

        {(requisicion.estado === 'aprobada' || requisicion.estado === 'comprometida') && isComprasOrAdmin && (
          <Button
            onClick={handleGenerarOrden}
            disabled={actionLoading}
            variant="secondary"
          >
            {actionLoading ? 'Generando...' : 'Generar Orden de Compra'}
          </Button>
        )}
      </div>
    </div>
  );
}