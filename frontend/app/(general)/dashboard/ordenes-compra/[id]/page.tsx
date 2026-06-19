"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../component/Sidebar";
import { getOrdenCompraById, OrdenCompra, marcarEntregada, cancelarOrden } from "../../../../services/ordenCompraService";

const ESTADO_COLOR: Record<string, string> = {
  emitida:   "bg-blue-100 text-blue-700",
  entregada: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-700",
};

export default function OrdenCompraDetallePage() {
  const { id }             = useParams<{ id: string }>();
  const router             = useRouter();
  const { user, cargando } = useAuth();
  const [orden,   setOrden]   = useState<OrdenCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [busy,    setBusy]    = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try { setOrden(await getOrdenCompraById(Number(id))); }
    catch { setError("No se pudo cargar la orden"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    if (!cargando && !user) { router.replace("/"); return; }
    if (user && id) cargar();
  }, [user, cargando, id]);

  const handleEntregar = async () => {
    if (!orden || !confirm("Marcar orden " + orden.numero + " como entregada?")) return;
    setBusy(true);
    try { await marcarEntregada(orden.id); await cargar(); }
    catch { setError("Error al marcar como entregada"); }
    finally { setBusy(false); }
  };

  const handleCancelar = async () => {
    if (!orden || !confirm("Cancelar orden " + orden.numero + "?")) return;
    setBusy(true);
    try { await cancelarOrden(orden.id); await cargar(); }
    catch { setError("Error al cancelar la orden"); }
    finally { setBusy(false); }
  };

  const fmt = (v: unknown) => { const n = Number(v); return isNaN(n) ? "0.00" : n.toFixed(2); };

  if (cargando || !user) return null;

  const esComprasOrAdmin = ["compras", "admin"].includes(user.rol);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/ordenes-compra")} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Compras / Ordenes</p>
            <h1 className="text-xl font-bold text-[#1a1a2e]">{orden?.numero ?? "Cargando..."}</h1>
          </div>
          {orden && (
            <span className={"text-xs px-3 py-1 rounded-full font-semibold " + (ESTADO_COLOR[orden.estado] ?? "")}>
              {orden.estado}
            </span>
          )}
        </header>

        {error && <div className="mx-6 mt-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : !orden ? (
          <div className="p-12 text-center text-sm text-gray-400">Orden no encontrada</div>
        ) : (
          <div className="p-6 flex flex-col gap-4 max-w-4xl">

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Informacion</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Numero</p><p className="font-bold text-[#1b3a6b]">{orden.numero}</p></div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Estado</p>
                  <span className={"text-xs px-2 py-1 rounded font-medium " + (ESTADO_COLOR[orden.estado] ?? "")}>{orden.estado}</span>
                </div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Proveedor</p><p>{orden.proveedor?.nombre ?? "N/A"}</p></div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">RTN</p><p>{orden.proveedor?.rtn ?? "N/A"}</p></div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Fecha emision</p><p>{new Date(orden.fecha_emision).toLocaleDateString("es-HN", { day: "2-digit", month: "long", year: "numeric" })}</p></div>
                {orden.fecha_entrega && <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Fecha entrega</p><p>{new Date(orden.fecha_entrega).toLocaleDateString("es-HN", { day: "2-digit", month: "long", year: "numeric" })}</p></div>}
                {orden.notas && <div className="col-span-2"><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Notas</p><p>{orden.notas}</p></div>}
                {orden.snap_jefe_compras && <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Jefe de Compras</p><p>{orden.snap_jefe_compras}</p></div>}
                {orden.snap_gerente && <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Gerente</p><p>{orden.snap_gerente}</p></div>}
                {orden.snap_alcalde && <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Alcalde</p><p>{orden.snap_alcalde}</p></div>}
              </div>
            </div>

            {orden.OrdenCompraDetalles && orden.OrdenCompraDetalles.length > 0 && (
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
                    {orden.OrdenCompraDetalles.map((det) => (
                      <tr key={det.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{det.numero_linea}</td>
                        <td className="px-3 py-2">{det.descripcion}</td>
                        <td className="px-3 py-2 text-gray-500">{det.unidad ?? "Unidad"}</td>
                        <td className="px-3 py-2 text-right">{det.cantidad}</td>
                        <td className="px-3 py-2 text-right">L. {fmt(det.precio_unitario)}</td>
                        <td className="px-3 py-2 text-center">{det.aplica_isv ? "Si" : "No"}</td>
                        <td className="px-3 py-2 text-right font-medium">L. {fmt(det.valor_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200">
                    <tr><td colSpan={6} className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Subtotal</td><td className="px-3 py-2 text-right font-medium">L. {fmt(orden.subtotal)}</td></tr>
                    <tr><td colSpan={6} className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Descuento</td><td className="px-3 py-2 text-right font-medium">L. {fmt(orden.descuento)}</td></tr>
                    <tr><td colSpan={6} className="px-3 py-2 text-right text-xs font-semibold text-gray-500">ISV</td><td className="px-3 py-2 text-right font-medium">L. {fmt(orden.impuesto)}</td></tr>
                    <tr className="bg-gray-50"><td colSpan={6} className="px-3 py-2 text-right text-sm font-bold text-gray-700">TOTAL</td><td className="px-3 py-2 text-right font-black text-[#1b3a6b]">L. {fmt(orden.total)}</td></tr>
                  </tfoot>
                </table>
              </div>
            )}

            {orden.estado === "emitida" && esComprasOrAdmin && (
              <div className="flex gap-3">
                <button onClick={handleEntregar} disabled={busy}
                  className="text-sm px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60">
                  {busy ? "Procesando..." : "Marcar como Entregada"}
                </button>
                <button onClick={handleCancelar} disabled={busy}
                  className="text-sm px-5 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-60">
                  {busy ? "Procesando..." : "Cancelar Orden"}
                </button>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}