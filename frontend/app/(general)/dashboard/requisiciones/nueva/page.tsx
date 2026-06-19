'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { createRequisicion } from '../../../../services/requisicionService';
import { getProveedores, Proveedor } from '../../../../services/proveedorService';
import api from '../../../../services/api';
import Sidebar from '../../../../component/Sidebar';

interface ItemForm {
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  aplica_isv: boolean;
}

interface Configuracion {
  tasa_impuesto: number;
  moneda_simbolo: string;
}

export default function NuevaRequisicionPage() {
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const { user, cargando } = useAuth();
  const desdeSolicitud = searchParams.get('desde_solicitud');

  const [proveedores,   setProveedores]   = useState<Proveedor[]>([]);
  const [config,        setConfig]        = useState<Configuracion | null>(null);
  const [items,         setItems]         = useState<ItemForm[]>([
    { descripcion: '', unidad: 'Unidad', cantidad: 1, precio_unitario: 0, aplica_isv: true },
  ]);
  const [tipo,          setTipo]          = useState<'compras' | 'bienes'>('compras');
  const [dirigidaA,     setDirigidaA]     = useState<'compras' | 'bienes'>('compras');
  const [proveedorId,   setProveedorId]   = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [loading,       setLoading]       = useState(false);
  const [cargandoInit,  setCargandoInit]  = useState(true);
  const [alerta,        setAlerta]        = useState<{ tipo: 'ok' | 'error'; msg: string } | null>(null);

  const mostrarAlerta = useCallback((tipo: 'ok' | 'error', msg: string) => {
    setAlerta({ tipo, msg });
    setTimeout(() => setAlerta(null), 4000);
  }, []);

  useEffect(() => {
    if (!cargando && !user) { router.replace('/'); return; }
    if (!user) return;

    Promise.all([
      getProveedores(),
      api.get<Configuracion>('/configuracion'),
    ]).then(async ([provs, resConf]) => {
      setProveedores(provs);
      setConfig(resConf.data);

      if (desdeSolicitud) {
        try {
          const resDet = await api.get<{
            solicitud: { tipo: string; observaciones: string };
            items: { descripcion: string; unidad: string; precio_unitario: number; cantidad_disponible: number; aplica_isv: number }[];
          }>('/solicitudes/' + desdeSolicitud + '/detalle');

          if (resDet.data.items?.length > 0) {
            setItems(resDet.data.items.map(i => ({
              descripcion:     i.descripcion,
              unidad:          i.unidad,
              cantidad:        Number(i.cantidad_disponible),
              precio_unitario: Number(i.precio_unitario),
              aplica_isv:      i.aplica_isv === 1,
            })));
            setTipo('bienes');
            setDirigidaA('bienes');
            setObservaciones(resDet.data.solicitud.observaciones ?? '');
          }
        } catch { /* el usuario llena manual */ }
      }
    }).catch(() => mostrarAlerta('error', 'Error al cargar datos'))
      .finally(() => setCargandoInit(false));
  }, [user, cargando]); // eslint-disable-line

  const tasa    = (config?.tasa_impuesto ?? 15) / 100;
  const simbolo = config?.moneda_simbolo ?? 'L.';
  const fmt     = (n: number) => simbolo + ' ' + n.toLocaleString('es-HN', { minimumFractionDigits: 2 });

  const actualizarItem = (idx: number, campo: keyof ItemForm, valor: string | number | boolean) => {
    const copia = [...items];
    copia[idx] = { ...copia[idx], [campo]: valor };
    setItems(copia);
  };

  const subtotal = items.reduce((a, i) => a + i.precio_unitario * i.cantidad, 0);
  const isv      = items.filter(i => i.aplica_isv).reduce((a, i) => a + i.precio_unitario * i.cantidad * tasa, 0);
  const total    = subtotal + isv;

  const handleGuardar = async () => {
    if (items.some(i => !i.descripcion.trim())) { mostrarAlerta('error', 'Todos los items deben tener descripcion'); return; }
    if (items.some(i => i.cantidad <= 0))        { mostrarAlerta('error', 'La cantidad debe ser mayor a 0'); return; }
    if (items.some(i => i.precio_unitario <= 0)) { mostrarAlerta('error', 'El precio debe ser mayor a 0'); return; }

    setLoading(true);
    try {
      await createRequisicion({
        tipo, dirigida_a: dirigidaA,
        departamento_id:  user!.departamento_id ?? 1,
        solicitud_id:     desdeSolicitud ? Number(desdeSolicitud) : null,
        proveedor_id:     proveedorId,
        observaciones,
        detalles: items.map((item, idx) => ({ ...item, numero_linea: idx + 1 })),
      });
      mostrarAlerta('ok', 'Requisicion creada correctamente');
      setTimeout(() => router.push('/dashboard/requisiciones'), 1500);
    } catch {
      mostrarAlerta('error', 'Error al crear la requisicion');
    } finally {
      setLoading(false);
    }
  };

  if (cargando || !user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/requisiciones')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">General / Requisiciones</p>
            <h1 className="text-xl font-bold text-[#1a1a2e]">
              {desdeSolicitud ? 'Requisicion desde Listado de Bienes' : 'Nueva Requisicion'}
            </h1>
          </div>
        </header>

        {alerta && (
          <div className={"mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium " +
            (alerta.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200')}>
            {alerta.msg}
          </div>
        )}

        {cargandoInit ? (
          <div className="p-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : (
          <div className="p-6 flex flex-col gap-4 max-w-5xl">

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Datos Generales</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Tipo</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value as 'compras' | 'bienes')}
                    disabled={!!desdeSolicitud}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1b3a6b] disabled:bg-gray-50">
                    <option value="compras">Compras (bienes externos)</option>
                    <option value="bienes">Bienes (consumibles internos)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Dirigida a</label>
                  <select value={dirigidaA} onChange={(e) => setDirigidaA(e.target.value as 'compras' | 'bienes')}
                    disabled={!!desdeSolicitud}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1b3a6b] disabled:bg-gray-50">
                    <option value="compras">Compras</option>
                    <option value="bienes">Bienes</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Proveedor (opcional)</label>
                  <select value={proveedorId ?? ''} onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1b3a6b]">
                    <option value="">Sin proveedor</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre} — {p.rtn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Observaciones</label>
                  <input type="text" value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Opcional"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1b3a6b]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-700">Detalle de Articulos</h2>
                <button onClick={() => setItems([...items, { descripcion: '', unidad: 'Unidad', cantidad: 1, precio_unitario: 0, aplica_isv: true }])}
                  className="text-xs bg-[#1b3a6b] text-white px-3 py-1.5 rounded-lg hover:bg-[#162f58] font-medium">
                  + Agregar item
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Descripcion</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Unidad</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Cantidad</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Precio Unit.</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">ISV {config?.tasa_impuesto ?? 15}%</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Total</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="px-3 py-2">
                          <input type="text" value={item.descripcion}
                            onChange={(e) => actualizarItem(idx, 'descripcion', e.target.value)}
                            placeholder="Descripcion"
                            className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1b3a6b]" />
                        </td>
                        <td className="px-3 py-2">
                          <select value={item.unidad} onChange={(e) => actualizarItem(idx, 'unidad', e.target.value)}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1b3a6b]">
                            <option>Unidad</option>
                            <option>Resma</option>
                            <option>Caja</option>
                            <option>Paquete</option>
                            <option>Galon</option>
                            <option>Rollo</option>
                            <option>Metro</option>
                            <option>Servicio</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="1" value={item.cantidad}
                            onChange={(e) => actualizarItem(idx, 'cantidad', Number(e.target.value))}
                            className="w-20 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#1b3a6b]" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" step="0.01" value={item.precio_unitario || ''}
                            onChange={(e) => actualizarItem(idx, 'precio_unitario', parseFloat(e.target.value) || 0)}
                            className="w-28 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#1b3a6b]" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={item.aplica_isv}
                            onChange={(e) => actualizarItem(idx, 'aplica_isv', e.target.checked)}
                            className="w-4 h-4 accent-[#1b3a6b]" />
                        </td>
                        <td className="px-3 py-2 text-right font-medium whitespace-nowrap">
                          {fmt(item.precio_unitario * item.cantidad * (item.aplica_isv ? 1 + tasa : 1))}
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); }}
                            disabled={items.length === 1}
                            className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg font-bold">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200">
                    <tr><td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Subtotal</td><td className="px-3 py-2 text-right font-medium">{fmt(subtotal)}</td><td></td></tr>
                    <tr><td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold text-gray-500">ISV ({config?.tasa_impuesto ?? 15}%)</td><td className="px-3 py-2 text-right font-medium">{fmt(isv)}</td><td></td></tr>
                    <tr className="bg-gray-50"><td colSpan={5} className="px-3 py-2 text-right text-sm font-bold text-gray-700">TOTAL</td><td className="px-3 py-2 text-right font-black text-[#1b3a6b]">{fmt(total)}</td><td></td></tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => router.push('/dashboard/requisiciones')}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={loading}
                className="text-sm px-6 py-2 rounded-lg bg-[#1b3a6b] text-white font-semibold hover:bg-[#162f58] disabled:opacity-60">
                {loading ? 'Guardando...' : 'Guardar Borrador'}
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}