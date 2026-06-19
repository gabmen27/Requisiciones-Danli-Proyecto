'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getRequisiciones, Requisicion, enviarAprobacion, aprobarRequisicion, rechazarRequisicion, comprometerRequisicion } from '../../../services/requisicionService';
import Sidebar from '../../../component/Sidebar';

const ESTADO_COLOR: Record<string, string> = {
  borrador:     'bg-gray-100 text-gray-600',
  pendiente:    'bg-yellow-100 text-yellow-700',
  aprobada:     'bg-green-100 text-green-700',
  rechazada:    'bg-red-100 text-red-700',
  comprometida: 'bg-blue-100 text-blue-700',
  anulada:      'bg-gray-100 text-gray-500',
};

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador', pendiente: 'Pendiente', aprobada: 'Aprobada',
  rechazada: 'Rechazada', comprometida: 'Comprometida', anulada: 'Anulada',
};

export default function RequisicionesPage() {
  const { user, cargando } = useAuth();
  const router = useRouter();
  const [requisiciones, setRequisiciones] = useState<Requisicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchRequisiciones = useCallback(async () => {
    try {
      setLoading(true);
      setRequisiciones(await getRequisiciones());
    } catch { setError('Error al cargar requisiciones'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!cargando && !user) { router.replace('/'); return; }
    if (user) fetchRequisiciones();
  }, [user, cargando, fetchRequisiciones, router]);

  const handleEnviar = async (id: number) => {
    try { await enviarAprobacion(id); await fetchRequisiciones(); }
    catch { setError('Error al enviar'); }
  };

  const handleAprobar = async (id: number) => {
    if (!confirm('Aprobar esta requisicion?')) return;
    const aprobado_por = user?.rol === 'alcaldia' ? 'alcaldia' : 'gerencia';
    try { await aprobarRequisicion(id, aprobado_por); await fetchRequisiciones(); }
    catch { setError('Error al aprobar'); }
  };

  const handleRechazar = async (id: number) => {
    const motivo = prompt('Motivo del rechazo:');
    if (motivo === null) return;
    try { await rechazarRequisicion(id, motivo); await fetchRequisiciones(); }
    catch { setError('Error al rechazar'); }
  };

  const handleComprometer = async (id: number) => {
    if (!confirm('Registrar compromiso presupuestario?')) return;
    try { await comprometerRequisicion(id); await fetchRequisiciones(); }
    catch { setError('Error al comprometer'); }
  };

  if (cargando || !user) return null;

  const esAprobador    = ['gerencia', 'alcaldia', 'admin'].includes(user.rol);
  const esContabilidad = ['contabilidad', 'admin'].includes(user.rol);
  const esCompras      = ['compras', 'admin'].includes(user.rol);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">General</p>
            <h1 className="text-xl font-bold text-[#1a1a2e]">Requisiciones</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard/requisiciones/nueva')}
            className="bg-[#1b3a6b] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#162f58]"
          >
            + Nueva Requisicion
          </button>
        </header>

        {error && <div className="mx-6 mt-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}

        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-sm text-gray-400">Cargando...</div>
            ) : requisiciones.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">No hay requisiciones</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Numero</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requisiciones.map((req) => (
                    <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-[#1b3a6b]">{req.numero}</td>
                      <td className="px-4 py-3 capitalize">{req.tipo}</td>
                      <td className="px-4 py-3">
                        <span className={"text-xs px-2 py-1 rounded font-medium " + (ESTADO_COLOR[req.estado] ?? '')}>
                          {ESTADO_LABEL[req.estado] ?? req.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">L. {Number(req.total).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(req.fecha_creacion).toLocaleDateString('es-HN')}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => router.push("/dashboard/requisiciones/" + req.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-[#1b3a6b] text-white hover:bg-[#162f58] font-medium">
                            Ver
                          </button>
                          {req.estado === 'borrador' && (
                            <button onClick={() => handleEnviar(req.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 font-medium">
                              Enviar
                            </button>
                          )}
                          {req.estado === 'pendiente' && esAprobador && (
                            <>
                              <button onClick={() => handleAprobar(req.id)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium">
                                Aprobar
                              </button>
                              <button onClick={() => handleRechazar(req.id)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium">
                                Rechazar
                              </button>
                            </>
                          )}
                          {req.estado === 'aprobada' && esContabilidad && (
                            <button onClick={() => handleComprometer(req.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium">
                              Comprometer
                            </button>
                          )}
                          {req.estado === 'comprometida' && esCompras && (
                            <button onClick={() => router.push("/dashboard/requisiciones/" + req.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium">
                              Generar OC
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}