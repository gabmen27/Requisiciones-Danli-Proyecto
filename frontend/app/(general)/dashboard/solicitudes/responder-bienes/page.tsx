"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../component/Sidebar";
import api from "../../../../services/api";

interface Solicitud {
  id: number;
  numero: string;
  estado: string;
  observaciones: string;
  departamento_id: number;
  fecha_solicitud: string;
}

interface Configuracion {
  tasa_impuesto: number;
  moneda_simbolo: string;
}

interface ItemForm {
  descripcion: string;
  unidad: string;
  precio_unitario: number;
  cantidad_disponible: number;
  aplica_isv: boolean;
}

export default function ResponderBienesPage() {
  const router             = useRouter();
  const { user, cargando } = useAuth();

  const [solicitudes,   setSolicitudes]   = useState<Solicitud[]>([]);
  const [seleccionada,  setSeleccionada]  = useState<Solicitud | null>(null);
  const [config,        setConfig]        = useState<Configuracion | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [guardando,     setGuardando]     = useState(false);
  const [cargandoData,  setCargandoData]  = useState(true);
  const [alerta,        setAlerta]        = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const [items, setItems] = useState<ItemForm[]>([
    { descripcion: "", unidad: "Unidad", precio_unitario: 0, cantidad_disponible: 0, aplica_isv: true },
  ]);

  const mostrarAlerta = useCallback((tipo: "ok" | "error", msg: string) => {
    setAlerta({ tipo, msg });
    setTimeout(() => setAlerta(null), 4000);
  }, []);

  useEffect(() => {
    if (!cargando && !user) { router.replace("/"); return; }
    if (!["admin", "bienes"].includes(user?.rol ?? "")) {
      router.replace("/dashboard");
      return;
    }
    Promise.all([
      api.get<Solicitud[]>("/solicitudes", { params: { tipo: "precios_bienes" } }),
      api.get<Configuracion>("/configuracion"),
    ]).then(([resSol, resConf]) => {
      // Solo las que están pendientes o en espera
      setSolicitudes(resSol.data.filter(s => ["pendiente", "en_espera"].includes(s.estado)));
      setConfig(resConf.data);
    }).catch(() => mostrarAlerta("error", "No se pudo cargar la lista"))
      .finally(() => setCargandoData(false));
  }, [user, cargando]); // eslint-disable-line

  const tasa    = (config?.tasa_impuesto ?? 15) / 100;
  const simbolo = config?.moneda_simbolo ?? "L.";
  const fmt     = (n: number) => simbolo + " " + n.toLocaleString("es-HN", { minimumFractionDigits: 2 });

  const agregarItem = () => {
    setItems([...items, { descripcion: "", unidad: "Unidad", precio_unitario: 0, cantidad_disponible: 0, aplica_isv: true }]);
  };

  const eliminarItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const actualizarItem = (idx: number, campo: keyof ItemForm, valor: string | number | boolean) => {
    const copia = [...items];
    copia[idx] = { ...copia[idx], [campo]: valor };
    setItems(copia);
  };

  const totalItem = (item: ItemForm) => {
    const base = item.precio_unitario * item.cantidad_disponible;
    return item.aplica_isv ? base * (1 + tasa) : base;
  };

  const subtotal = items.reduce((a, i) => a + i.precio_unitario * i.cantidad_disponible, 0);
  const totalIsv = items.filter(i => i.aplica_isv).reduce((a, i) => a + i.precio_unitario * i.cantidad_disponible * tasa, 0);
  const total    = subtotal + totalIsv;

  const handleSeleccionar = (sol: Solicitud) => {
    setSeleccionada(sol);
    setItems([{ descripcion: "", unidad: "Unidad", precio_unitario: 0, cantidad_disponible: 0, aplica_isv: true }]);
    setObservaciones("");
  };

  const handleGuardar = async () => {
    if (!seleccionada) return;
    if (items.some(i => !i.descripcion.trim())) {
      mostrarAlerta("error", "Todos los items deben tener descripcion"); return;
    }
    if (items.some(i => i.precio_unitario <= 0)) {
      mostrarAlerta("error", "El precio unitario debe ser mayor a 0"); return;
    }
    if (items.some(i => i.cantidad_disponible <= 0)) {
      mostrarAlerta("error", "La cantidad disponible debe ser mayor a 0"); return;
    }
    setGuardando(true);
    try {
      await api.post("/solicitudes/" + seleccionada.id + "/responder", {
        tipo_respuesta: "listado_precios",
        observaciones:  observaciones.trim() || null,
        items,
      });
      mostrarAlerta("ok", "Listado registrado correctamente");
      setSolicitudes(prev => prev.filter(s => s.id !== seleccionada.id));
      setSeleccionada(null);
      setItems([{ descripcion: "", unidad: "Unidad", precio_unitario: 0, cantidad_disponible: 0, aplica_isv: true }]);
      setObservaciones("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      mostrarAlerta("error", e?.response?.data?.message ?? "Error al registrar");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando || !user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">

        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/solicitudes")} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Bienes</p>
            <h1 className="text-xl font-bold text-[#1a1a2e]">Responder Solicitudes de Listado</h1>
          </div>
        </header>

        {alerta && (
          <div className={"mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium " +
            (alerta.tipo === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
            {alerta.msg}
          </div>
        )}

        <div className="p-6 flex gap-4">

          {/* Lista de solicitudes pendientes */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Solicitudes pendientes ({solicitudes.length})
            </p>
            {cargandoData ? (
              <div className="text-sm text-gray-400 p-4">Cargando...</div>
            ) : solicitudes.length === 0 ? (
              <div className="bg-white rounded-xl p-4 text-sm text-gray-400 text-center shadow-sm">
                No hay solicitudes pendientes
              </div>
            ) : (
              solicitudes.map((sol) => (
                <button
                  key={sol.id}
                  onClick={() => handleSeleccionar(sol)}
                  className={"w-full text-left bg-white rounded-xl p-4 shadow-sm border-2 transition-all " +
                    (seleccionada?.id === sol.id ? "border-[#2e7d32]" : "border-transparent hover:border-gray-200")}
                >
                  <p className="font-bold text-sm text-[#1b3a6b]">{sol.numero}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{sol.observaciones}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className={"text-xs px-2 py-0.5 rounded font-medium " +
                      (sol.estado === "en_espera" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700")}>
                      {sol.estado === "en_espera" ? "En espera" : "Pendiente"}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(sol.fecha_solicitud).toLocaleDateString("es-HN")}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Panel de respuesta */}
          <div className="flex-1 flex flex-col gap-4">
            {!seleccionada ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <p className="text-gray-400 text-sm">Selecciona una solicitud de la lista para responderla</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h2 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">
                    Respondiendo: {seleccionada.numero}
                  </h2>
                  <p className="text-sm text-gray-600">{seleccionada.observaciones}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-gray-700">Listado de Precios</h2>
                    <button
                      onClick={agregarItem}
                      className="text-xs bg-[#1b3a6b] text-white px-3 py-1.5 rounded-lg hover:bg-[#162f58] font-medium"
                    >
                      + Agregar item
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Descripcion</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Unidad</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Precio</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Disponible</th>
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
                                onChange={(e) => actualizarItem(idx, "descripcion", e.target.value)}
                                placeholder="Ej. Resma de papel"
                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1b3a6b]" />
                            </td>
                            <td className="px-3 py-2">
                              <select value={item.unidad}
                                onChange={(e) => actualizarItem(idx, "unidad", e.target.value)}
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
                              <input type="number" min="0" step="0.01" value={item.precio_unitario || ""}
                                onChange={(e) => actualizarItem(idx, "precio_unitario", parseFloat(e.target.value) || 0)}
                                className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#1b3a6b]" />
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" min="0" step="0.01" value={item.cantidad_disponible || ""}
                                onChange={(e) => actualizarItem(idx, "cantidad_disponible", parseFloat(e.target.value) || 0)}
                                className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#1b3a6b]" />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input type="checkbox" checked={item.aplica_isv}
                                onChange={(e) => actualizarItem(idx, "aplica_isv", e.target.checked)}
                                className="w-4 h-4 accent-[#1b3a6b]" />
                            </td>
                            <td className="px-3 py-2 text-right font-medium whitespace-nowrap">{fmt(totalItem(item))}</td>
                            <td className="px-3 py-2">
                              <button onClick={() => eliminarItem(idx)} disabled={items.length === 1}
                                className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg font-bold">×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-gray-200">
                        <tr>
                          <td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Subtotal</td>
                          <td className="px-3 py-2 text-right font-medium">{fmt(subtotal)}</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold text-gray-500">ISV ({config?.tasa_impuesto ?? 15}%)</td>
                          <td className="px-3 py-2 text-right font-medium">{fmt(totalIsv)}</td>
                          <td></td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td colSpan={5} className="px-3 py-2 text-right text-sm font-bold text-gray-700">TOTAL</td>
                          <td className="px-3 py-2 text-right font-black text-[#1b3a6b]">{fmt(total)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Observaciones (opcional)</label>
                  <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                    rows={3} placeholder="Ej. Articulos disponibles en bodega al dia de hoy..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a6b]/30 resize-none" />
                </div>

                <div className="flex gap-3 justify-end">
                  <button onClick={() => setSeleccionada(null)}
                    className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button onClick={handleGuardar} disabled={guardando}
                    className="text-sm px-6 py-2 rounded-lg bg-[#2e7d32] text-white font-semibold hover:bg-[#256327] disabled:opacity-60">
                    {guardando ? "Guardando..." : "Registrar Listado"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}