"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../component/Sidebar";
import { getOrdenesCompra, OrdenCompra, marcarEntregada, cancelarOrden, generarOrdenCompra } from "../../../services/ordenCompraService";
import { getRequisiciones, Requisicion } from "../../../services/requisicionService";
import { getProveedores, Proveedor } from "../../../services/proveedorService";
import api from "../../../services/api";

const ESTADO_COLOR: Record<string, string> = {
  emitida:   "bg-blue-100 text-blue-700",
  entregada: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-700",
};

interface Configuracion { tasa_impuesto: number; moneda_simbolo: string; }
interface ItemManual { descripcion: string; unidad: string; cantidad: number; precio_unitario: number; aplica_isv: boolean; }

export default function OrdenesCompraPage() {
  const router             = useRouter();
  const { user, cargando } = useAuth();

  const [tab,           setTab]           = useState<"ordenes" | "requisiciones" | "manual">("ordenes");
  const [ordenes,       setOrdenes]       = useState<OrdenCompra[]>([]);
  const [requisiciones, setRequisiciones] = useState<Requisicion[]>([]);
  const [proveedores,   setProveedores]   = useState<Proveedor[]>([]);
  const [config,        setConfig]        = useState<Configuracion | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [busy,          setBusy]          = useState<number | null>(null);
  const [guardando,     setGuardando]     = useState(false);
  const [filtro,        setFiltro]        = useState("");
  const [alerta,        setAlerta]        = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  // Form manual
  const [proveedorId,   setProveedorId]   = useState<number | null>(null);
  const [notasManual,   setNotasManual]   = useState("");
  const [itemsManual,   setItemsManual]   = useState<ItemManual[]>([
    { descripcion: "", unidad: "Unidad", cantidad: 1, precio_unitario: 0, aplica_isv: true },
  ]);

  const mostrarAlerta = (tipo: "ok" | "error", msg: string) => {
    setAlerta({ tipo, msg });
    setTimeout(() => setAlerta(null), 5000);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [ords, reqs, provs, resConf] = await Promise.all([
        getOrdenesCompra(),
        getRequisiciones(),
        getProveedores(),
        api.get<Configuracion>("/configuracion"),
      ]);
      setOrdenes(ords);
      // Solo requisiciones comprometidas dirigidas a compras
      setRequisiciones(reqs.filter(r => r.estado === "comprometida" && r.dirigida_a === "compras"));
      setProveedores(provs);
      setConfig(resConf.data);
    } catch { mostrarAlerta("error", "Error al cargar datos"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!cargando && !user) { router.replace("/"); return; }
    if (user) cargar();
  }, [user, cargando]);

  const handleGenerarDesdeReq = async (req: Requisicion) => {
    if (!confirm("Generar Orden de Compra desde requisicion " + req.numero + "?")) return;
    setBusy(req.id);
    try {
      const oc = await generarOrdenCompra({ requisicion_id: req.id });
      mostrarAlerta("ok", "Orden " + oc.numero + " generada correctamente");
      await cargar();
      setTab("ordenes");
    } catch { mostrarAlerta("error", "Error al generar la orden"); }
    finally { setBusy(null); }
  };

  const handleEntregar = async (id: number, numero: string) => {
    if (!confirm("Marcar orden " + numero + " como entregada?")) return;
    try { await marcarEntregada(id); await cargar(); mostrarAlerta("ok", "Orden " + numero + " marcada como entregada"); }
    catch { mostrarAlerta("error", "Error al marcar como entregada"); }
  };

  const handleCancelar = async (id: number, numero: string) => {
    if (!confirm("Cancelar orden " + numero + "?")) return;
    try { await cancelarOrden(id); await cargar(); mostrarAlerta("ok", "Orden " + numero + " cancelada"); }
    catch { mostrarAlerta("error", "Error al cancelar"); }
  };

  const actualizarItem = (idx: number, campo: keyof ItemManual, valor: string | number | boolean) => {
    const copia = [...itemsManual];
    copia[idx] = { ...copia[idx], [campo]: valor };
    setItemsManual(copia);
  };

  const tasa    = (config?.tasa_impuesto ?? 15) / 100;
  const simbolo = config?.moneda_simbolo ?? "L.";
  const fmt     = (n: number) => simbolo + " " + n.toLocaleString("es-HN", { minimumFractionDigits: 2 });
  const subtotalManual = itemsManual.reduce((a, i) => a + i.precio_unitario * i.cantidad, 0);
  const isvManual      = itemsManual.filter(i => i.aplica_isv).reduce((a, i) => a + i.precio_unitario * i.cantidad * tasa, 0);

  const handleGuardarManual = async () => {
    if (!proveedorId) { mostrarAlerta("error", "Debes seleccionar un proveedor"); return; }
    if (itemsManual.some(i => !i.descripcion.trim())) { mostrarAlerta("error", "Todos los items deben tener descripcion"); return; }
    if (itemsManual.some(i => i.precio_unitario <= 0)) { mostrarAlerta("error", "El precio debe ser mayor a 0"); return; }
    if (itemsManual.some(i => i.cantidad <= 0)) { mostrarAlerta("error", "La cantidad debe ser mayor a 0"); return; }

    setGuardando(true);
    try {
      // Crear requisicion manual y luego la OC
      const resReq = await api.post("/requisiciones", {
        tipo: "compras",
        departamento_id: user!.departamento_id ?? 1,
        dirigida_a: "compras",
        proveedor_id: proveedorId,
        observaciones: notasManual || null,
        detalles: itemsManual.map((item, idx) => ({ ...item, numero_linea: idx + 1 })),
      });
      // Enviar a aprobacion directamente (flujo manual compras)
      await api.put("/requisiciones/" + resReq.data.id + "/enviar-aprobacion");
      mostrarAlerta("ok", "Requisicion creada. Pasa a aprobacion de gerencia/alcalde.");
      setItemsManual([{ descripcion: "", unidad: "Unidad", cantidad: 1, precio_unitario: 0, aplica_isv: true }]);
      setProveedorId(null);
      setNotasManual("");
      setTab("ordenes");
      await cargar();
    } catch { mostrarAlerta("error", "Error al crear la orden manual"); }
    finally { setGuardando(false); }
  };

  if (cargando || !user) return null;

  const esComprasOrAdmin = ["compras", "admin"].includes(user.rol);
  const ordenesFiltradas = filtro ? ordenes.filter(o => o.estado === filtro) : ordenes;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">

        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Compras</p>
          <h1 className="text-xl font-bold text-[#1a1a2e]">Ordenes de Compra</h1>
        </header>

        {alerta && (
          <div className={"mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium " +
            (alerta.tipo === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
            {alerta.msg}
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-2">
          {[
            { key: "ordenes",       label: "Ordenes emitidas" },
            { key: "requisiciones", label: "Pendientes de OC (" + requisiciones.length + ")" },
            ...(esComprasOrAdmin ? [{ key: "manual", label: "OC Manual" }] : []),
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={"text-sm px-4 py-2 rounded-lg font-medium transition-colors " +
                (tab === t.key ? "bg-[#1b3a6b] text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200")}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* TAB: Ordenes emitidas */}
          {tab === "ordenes" && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm flex gap-4 items-center">
                <p className="text-xs font-semibold text-gray-500 uppercase">Filtrar:</p>
                <select value={filtro} onChange={(e) => setFiltro(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none">
                  <option value="">Todos</option>
                  <option value="emitida">Emitidas</option>
                  <option value="entregada">Entregadas</option>
                  <option value="cancelada">Canceladas</option>
                </select>
                <span className="ml-auto text-xs text-gray-400">{ordenesFiltradas.length} resultado{ordenesFiltradas.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center text-sm text-gray-400">Cargando...</div>
                ) : ordenesFiltradas.length === 0 ? (
                  <div className="p-12 text-center text-sm text-gray-400">No hay ordenes</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Numero</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Proveedor</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenesFiltradas.map((orden) => (
                        <tr key={orden.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-[#1b3a6b]">{orden.numero}</td>
                          <td className="px-4 py-3">{orden.proveedor?.nombre ?? "N/A"}</td>
                          <td className="px-4 py-3">
                            <span className={"text-xs px-2 py-1 rounded font-medium " + (ESTADO_COLOR[orden.estado] ?? "")}>
                              {orden.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">L. {Number(orden.total).toFixed(2)}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">{new Date(orden.fecha_emision).toLocaleDateString("es-HN")}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => router.push("/dashboard/ordenes-compra/" + orden.id)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-[#1b3a6b] text-white hover:bg-[#162f58] font-medium">
                                Ver
                              </button>
                              {orden.estado === "emitida" && esComprasOrAdmin && (
                                <>
                                  <button onClick={() => handleEntregar(orden.id, orden.numero)}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium">
                                    Entregar
                                  </button>
                                  <button onClick={() => handleCancelar(orden.id, orden.numero)}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium">
                                    Cancelar
                                  </button>
                                </>
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
          )}

          {/* TAB: Requisiciones comprometidas pendientes de OC */}
          {tab === "requisiciones" && (
            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center text-sm text-gray-400">Cargando...</div>
              ) : requisiciones.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <p className="text-2xl mb-2">✅</p>
                  <p className="text-gray-500 text-sm">No hay requisiciones comprometidas pendientes de Orden de Compra</p>
                </div>
              ) : (
                requisiciones.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-400">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-bold text-[#1b3a6b] text-lg">{req.numero}</p>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Comprometida</span>
                          {req.aprobado_por && (
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium capitalize">
                              Aprobada por {req.aprobado_por}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Total</p>
                            <p className="font-bold text-[#1b3a6b] text-lg">L. {Number(req.total).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Proveedor</p>
                            <p>{req.proveedor_nombre_snap ?? "No especificado"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Fecha</p>
                            <p>{new Date(req.fecha_creacion).toLocaleDateString("es-HN")}</p>
                          </div>
                        </div>
                        {req.observaciones && (
                          <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 mb-3">
                            {req.observaciones}
                          </div>
                        )}
                        {req.RequisicionDetalles && req.RequisicionDetalles.length > 0 && (
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-3 py-1.5 font-semibold text-gray-500">Descripcion</th>
                                <th className="text-right px-3 py-1.5 font-semibold text-gray-500">Cant.</th>
                                <th className="text-right px-3 py-1.5 font-semibold text-gray-500">Precio</th>
                                <th className="text-right px-3 py-1.5 font-semibold text-gray-500">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {req.RequisicionDetalles.map((det) => (
                                <tr key={det.id} className="border-b border-gray-100">
                                  <td className="px-3 py-1.5">{det.descripcion}</td>
                                  <td className="px-3 py-1.5 text-right">{det.cantidad}</td>
                                  <td className="px-3 py-1.5 text-right">L. {Number(det.precio_unitario).toFixed(2)}</td>
                                  <td className="px-3 py-1.5 text-right font-medium">L. {Number(det.valor_total).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-6 flex-shrink-0">
                        {esComprasOrAdmin && (
                          <button onClick={() => handleGenerarDesdeReq(req)} disabled={busy === req.id}
                            className="text-sm px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-60 whitespace-nowrap">
                            {busy === req.id ? "Generando..." : "Generar OC"}
                          </button>
                        )}
                        <button onClick={() => router.push("/dashboard/requisiciones/" + req.id)}
                          className="text-sm px-5 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                          Ver detalle
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: OC Manual */}
          {tab === "manual" && esComprasOrAdmin && (
            <div className="flex flex-col gap-4 max-w-4xl">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Nueva Requisicion Manual</h2>
                <p className="text-xs text-gray-400 mb-4">
                  Al crear una OC manual se genera una requisicion que pasa por el flujo normal de aprobacion.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Proveedor *</label>
                    <select value={proveedorId ?? ""} onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1b3a6b]">
                      <option value="">Seleccionar proveedor</option>
                      {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre} — {p.rtn}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Observaciones</label>
                    <input type="text" value={notasManual} onChange={(e) => setNotasManual(e.target.value)}
                      placeholder="Opcional"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1b3a6b]" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-700">Articulos</h2>
                  <button onClick={() => setItemsManual([...itemsManual, { descripcion: "", unidad: "Unidad", cantidad: 1, precio_unitario: 0, aplica_isv: true }])}
                    className="text-xs bg-[#1b3a6b] text-white px-3 py-1.5 rounded-lg hover:bg-[#162f58] font-medium">
                    + Agregar item
                  </button>
                </div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Descripcion</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Unidad</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Cant.</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Precio</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">ISV {config?.tasa_impuesto ?? 15}%</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Total</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsManual.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="px-3 py-2">
                          <input type="text" value={item.descripcion} onChange={(e) => actualizarItem(idx, "descripcion", e.target.value)}
                            placeholder="Descripcion"
                            className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1b3a6b]" />
                        </td>
                        <td className="px-3 py-2">
                          <select value={item.unidad} onChange={(e) => actualizarItem(idx, "unidad", e.target.value)}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1b3a6b]">
                            <option>Unidad</option><option>Resma</option><option>Caja</option>
                            <option>Paquete</option><option>Galon</option><option>Rollo</option>
                            <option>Metro</option><option>Servicio</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="1" value={item.cantidad} onChange={(e) => actualizarItem(idx, "cantidad", Number(e.target.value))}
                            className="w-20 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#1b3a6b]" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" step="0.01" value={item.precio_unitario || ""} onChange={(e) => actualizarItem(idx, "precio_unitario", parseFloat(e.target.value) || 0)}
                            className="w-28 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#1b3a6b]" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={item.aplica_isv} onChange={(e) => actualizarItem(idx, "aplica_isv", e.target.checked)}
                            className="w-4 h-4 accent-[#1b3a6b]" />
                        </td>
                        <td className="px-3 py-2 text-right font-medium whitespace-nowrap">
                          {fmt(item.precio_unitario * item.cantidad * (item.aplica_isv ? 1 + tasa : 1))}
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => { if (itemsManual.length > 1) setItemsManual(itemsManual.filter((_, i) => i !== idx)); }}
                            disabled={itemsManual.length === 1}
                            className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg font-bold">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200">
                    <tr><td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Subtotal</td><td className="px-3 py-2 text-right font-medium">{fmt(subtotalManual)}</td><td></td></tr>
                    <tr><td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold text-gray-500">ISV ({config?.tasa_impuesto ?? 15}%)</td><td className="px-3 py-2 text-right font-medium">{fmt(isvManual)}</td><td></td></tr>
                    <tr className="bg-gray-50"><td colSpan={5} className="px-3 py-2 text-right text-sm font-bold text-gray-700">TOTAL</td><td className="px-3 py-2 text-right font-black text-[#1b3a6b]">{fmt(subtotalManual + isvManual)}</td><td></td></tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setTab("ordenes")}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleGuardarManual} disabled={guardando}
                  className="text-sm px-6 py-2 rounded-lg bg-[#1b3a6b] text-white font-semibold hover:bg-[#162f58] disabled:opacity-60">
                  {guardando ? "Enviando..." : "Enviar a Aprobacion"}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}