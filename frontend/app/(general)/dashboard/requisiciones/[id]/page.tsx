'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { getRequisicionById, enviarAprobacion, aprobarRequisicion, rechazarRequisicion, comprometerRequisicion, Requisicion } from '../../../../services/requisicionService';
import { generarOrdenCompra } from '../../../../services/ordenCompraService';
import Sidebar from '../../../../component/Sidebar';

const ESTADO_COLOR: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-600', pendiente: 'bg-yellow-100 text-yellow-700',
  aprobada: 'bg-green-100 text-green-700', rechazada: 'bg-red-100 text-red-700',
  comprometida: 'bg-blue-100 text-blue-700', anulada: 'bg-gray-100 text-gray-500',
};
const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador', pendiente: 'Pendiente', aprobada: 'Aprobada',
  rechazada: 'Rechazada', comprometida: 'Comprometida', anulada: 'Anulada',
};

export default function RequisicionDetallePage() {
  const { id }             = useParams<{ id: string }>();
  const router             = useRouter();
  const { user, cargando } = useAuth();
  const [req,     setReq]     = useState<Requisicion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [busy,    setBusy]    = useState(false);

  const fetchReq = useCallback(async () => {
    try {
      setLoading(true);
      setReq(await getRequisicionById(Number(id)));
    } catch { setError('No se pudo cargar la requisicion'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    if (!cargando && !user) { router.replace('/'); return; }
    if (user && id) fetchReq();
  }, [user, cargando, id, fetchReq, router]);

  const run = async (fn: () => Promise<Requisicion | void>) => {
    setBusy(true);
    try { await fn(); await fetchReq(); }
    catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? 'Error al procesar');
    }
    finally { setBusy(false); }
  };

  const fmt = (v: unknown) => { const n = Number(v); return isNaN(n) ? '0.00' : n.toFixed(2); };

  if (cargando || !user) return null;

  const esAprobador    = ['gerencia', 'alcaldia', 'admin'].includes(user.rol);
  const esContabilidad = ['contabilidad', 'admin'].includes(user.rol);
  const esCompras      = ['compras', 'admin'].includes(user.rol);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/requisiciones')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">General / Requisiciones</p>
            <h1 className="text-xl font-bold text-[#1a1a2e]">{req?.numero ?? 'Cargando...'}</h1>
          </div>
        </header>

        {error && <div className="mx-6 mt-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : !req ? (
          <div className="p-12 text-center text-sm text-gray-400">No encontrada</div>
        ) : (
          <div className="p-6 flex flex-col gap-4 max-w-4xl">

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Informacion</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Numero</p><p className="font-bold text-[#1b3a6b]">{req.numero}</p></div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Estado</p>
                  <span className={"text-xs px-2 py-1 rounded font-medium " + (ESTADO_COLOR[req.estado] ?? '')}>
                    {ESTADO_LABEL[req.estado] ?? req.estado}
                  </span>
                </div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Tipo</p><p className="capitalize">{req.tipo}</p></div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Dirigida a</p><p className="capitalize">{req.dirigida_a}</p></div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Fecha</p><p>{new Date(req.fecha_creacion).toLocaleDateString('es-HN')}</p></div>
                {req.proveedor_nombre_snap && <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Proveedor</p><p>{req.proveedor_nombre_snap}</p></div>}
                {req.aprobado_por && <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Aprobado por</p><p className="capitalize">{req.aprobado_por}</p></div>}
                {req.motivo_rechazo && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Motivo rechazo</p>
                    <p className="text-red-600">{req.motivo_rechazo}</p>
                  </div>
                )}
                {req.observaciones && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Observaciones</p>
                    <p>{req.observaciones}</p>
                  </div>
                )}
              </div>
            </div>

            {req.RequisicionDetalles && req.RequisicionDetalles.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Detalles</h2>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">#</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Descripcion</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Unidad</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Cantidad</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Precio</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">ISV</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {req.RequisicionDetalles.map((det) => (
                      <tr key={det.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{det.numero_linea}</td>
                        <td className="px-3 py-2">{det.descripcion}</td>
                        <td className="px-3 py-2 text-gray-500">{det.unidad ?? 'Unidad'}</td>
                        <td className="px-3 py-2 text-right">{det.cantidad}</td>
                        <td className="px-3 py-2 text-right">L. {fmt(det.precio_unitario)}</td>
                        <td className="px-3 py-2 text-center">{det.aplica_isv ? 'Si' : 'No'}</td>
                        <td className="px-3 py-2 text-right font-medium">L. {fmt(det.valor_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200">
                    <tr><td colSpan={6} className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Subtotal</td><td className="px-3 py-2 text-right font-medium">L. {fmt(req.subtotal)}</td></tr>
                    <tr><td colSpan={6} className="px-3 py-2 text-right text-xs font-semibold text-gray-500">ISV</td><td className="px-3 py-2 text-right font-medium">L. {fmt(req.total_isv)}</td></tr>
                    <tr className="bg-gray-50"><td colSpan={6} className="px-3 py-2 text-right text-sm font-bold text-gray-700">TOTAL</td><td className="px-3 py-2 text-right font-black text-[#1b3a6b]">L. {fmt(req.total)}</td></tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              {req.estado === 'borrador' && (
                <button onClick={() => run(() => enviarAprobacion(req.id))} disabled={busy}
                  className="text-sm px-5 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 disabled:opacity-60">
                  {busy ? 'Procesando...' : 'Enviar a Aprobacion'}
                </button>
              )}
              {req.estado === 'pendiente' && esAprobador && (
                <>
                  <button onClick={() => {
                    if (!confirm('Aprobar esta requisicion?')) return;
                    const ap = user.rol === 'alcaldia' ? 'alcaldia' : 'gerencia';
                    run(() => aprobarRequisicion(req.id, ap));
                  }} disabled={busy}
                    className="text-sm px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60">
                    {busy ? 'Procesando...' : 'Aprobar'}
                  </button>
                  <button onClick={() => {
                    const motivo = prompt('Motivo del rechazo:');
                    if (motivo === null) return;
                    run(() => rechazarRequisicion(req.id, motivo));
                  }} disabled={busy}
                    className="text-sm px-5 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-60">
                    {busy ? 'Procesando...' : 'Rechazar'}
                  </button>
                </>
              )}
              {req.estado === 'aprobada' && esContabilidad && (
                <button onClick={() => {
                  if (!confirm('Registrar compromiso presupuestario?')) return;
                  run(() => comprometerRequisicion(req.id));
                }} disabled={busy}
                  className="text-sm px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">
                  {busy ? 'Procesando...' : 'Compromiso Presupuestario'}
                </button>
              )}
              {req.estado === 'comprometida' && esCompras && (
                <button onClick={() => {
                  if (!confirm('Generar Orden de Compra?')) return;
                  run(async () => {
                    const oc = await generarOrdenCompra({ requisicion_id: req.id });
                    router.push("/dashboard/ordenes-compra/" + oc.id);
                  });
                }} disabled={busy}
                  className="text-sm px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-60">
                  {busy ? 'Generando...' : 'Generar Orden de Compra'}
                </button>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}