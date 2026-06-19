"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../component/Sidebar";
import { getRequisiciones, comprometerRequisicion, Requisicion } from "../../../../services/requisicionService";

export default function CompromisoPresupuestarioPage() {
  const router             = useRouter();
  const { user, cargando } = useAuth();
  const [requisiciones, setRequisiciones] = useState<Requisicion[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [busy,          setBusy]          = useState<number | null>(null);
  const [alerta,        setAlerta]        = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const mostrarAlerta = (tipo: "ok" | "error", msg: string) => {
    setAlerta({ tipo, msg });
    setTimeout(() => setAlerta(null), 4000);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const todas = await getRequisiciones();
      // Solo requisiciones aprobadas dirigidas a compras
      setRequisiciones(todas.filter(r => r.estado === "aprobada" && r.dirigida_a === "compras"));
    } catch { mostrarAlerta("error", "Error al cargar requisiciones"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!cargando && !user) { router.replace("/"); return; }
    if (!cargando && user && !["contabilidad", "admin"].includes(user.rol)) {
      router.replace("/dashboard"); return;
    }
    if (user) cargar();
  }, [user, cargando]);

  const handleComprometer = async (req: Requisicion) => {
    if (!confirm("Registrar compromiso presupuestario para " + req.numero + "?")) return;
    setBusy(req.id);
    try {
      await comprometerRequisicion(req.id);
      mostrarAlerta("ok", "Compromiso registrado para " + req.numero);
      await cargar();
    } catch { mostrarAlerta("error", "Error al registrar compromiso"); }
    finally { setBusy(null); }
  };

  if (cargando || !user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Contabilidad</p>
          <h1 className="text-xl font-bold text-[#1a1a2e]">Compromiso Presupuestario</h1>
          <p className="text-xs text-gray-400">
            {requisiciones.length} requisicion{requisiciones.length !== 1 ? "es" : ""} aprobada{requisiciones.length !== 1 ? "s" : ""} pendiente{requisiciones.length !== 1 ? "s" : ""} de compromiso
          </p>
        </header>

        {alerta && (
          <div className={"mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium " +
            (alerta.tipo === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
            {alerta.msg}
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-sm text-gray-400">Cargando...</div>
          ) : requisiciones.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-gray-500 text-sm font-medium">No hay requisiciones pendientes de compromiso presupuestario</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {requisiciones.map((req) => (
                <div key={req.id} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-400">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-bold text-[#1b3a6b] text-lg">{req.numero}</p>
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">Aprobada</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Compras</span>
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
                          <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">ISV</p>
                          <p>L. {Number(req.total_isv).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Fecha aprobacion</p>
                          <p>{req.fecha_aprobacion ? new Date(req.fecha_aprobacion).toLocaleDateString("es-HN") : "-"}</p>
                        </div>
                      </div>
                      {req.proveedor_nombre_snap && (
                        <div className="text-sm mb-3">
                          <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Proveedor</p>
                          <p>{req.proveedor_nombre_snap}</p>
                        </div>
                      )}
                      {req.observaciones && (
                        <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 mb-3">
                          {req.observaciones}
                        </div>
                      )}
                      {req.RequisicionDetalles && req.RequisicionDetalles.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-3 py-1.5 font-semibold text-gray-500">Descripcion</th>
                                <th className="text-left px-3 py-1.5 font-semibold text-gray-500">Unidad</th>
                                <th className="text-right px-3 py-1.5 font-semibold text-gray-500">Cant.</th>
                                <th className="text-right px-3 py-1.5 font-semibold text-gray-500">Precio</th>
                                <th className="text-center px-3 py-1.5 font-semibold text-gray-500">ISV</th>
                                <th className="text-right px-3 py-1.5 font-semibold text-gray-500">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {req.RequisicionDetalles.map((det) => (
                                <tr key={det.id} className="border-b border-gray-100">
                                  <td className="px-3 py-1.5">{det.descripcion}</td>
                                  <td className="px-3 py-1.5 text-gray-500">{det.unidad ?? "Unidad"}</td>
                                  <td className="px-3 py-1.5 text-right">{det.cantidad}</td>
                                  <td className="px-3 py-1.5 text-right">L. {Number(det.precio_unitario).toFixed(2)}</td>
                                  <td className="px-3 py-1.5 text-center">{det.aplica_isv ? "Si" : "No"}</td>
                                  <td className="px-3 py-1.5 text-right font-medium">L. {Number(det.valor_total).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-6 flex-shrink-0">
                      <button
                        onClick={() => handleComprometer(req)}
                        disabled={busy === req.id}
                        className="text-sm px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 whitespace-nowrap"
                      >
                        {busy === req.id ? "..." : "Comprometer"}
                      </button>
                      <button
                        onClick={() => router.push("/dashboard/requisiciones/" + req.id)}
                        className="text-sm px-5 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}