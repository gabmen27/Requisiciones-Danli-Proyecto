"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../component/Sidebar";
import api from "../../../../services/api";

const BASE_URL = "http://localhost:5000";

interface Solicitud {
  id: number; numero: string;
  tipo: "cotizacion" | "precios_bienes";
  estado: "pendiente" | "en_espera" | "respondida" | "cancelada";
  departamento_id: number; empleado_dni: string;
  observaciones: string; fecha_solicitud: string; fecha_respuesta: string | null;
}
interface Respuesta {
  id: number; solicitud_id: number;
  tipo_respuesta: "pdf_cotizacion" | "listado_precios";
  archivo_pdf: string | null; respondido_por_dni: string;
  observaciones: string | null; fecha_respuesta: string;
}
interface Item {
  id: number; numero_linea: number; descripcion: string; unidad: string;
  precio_unitario: number; cantidad_disponible: number; aplica_isv: number;
}
interface Configuracion { tasa_impuesto: number; moneda_simbolo: string; }

const ESTADO: Record<string, { label: string; cls: string }> = {
  pendiente:  { label: "Pendiente",  cls: "bg-yellow-100 text-yellow-700" },
  en_espera:  { label: "En espera",  cls: "bg-orange-100 text-orange-700" },
  respondida: { label: "Respondida", cls: "bg-green-100 text-green-700" },
  cancelada:  { label: "Cancelada",  cls: "bg-red-100 text-red-700" },
};
const TIPO: Record<string, string> = {
  cotizacion: "Cotizacion a Compras", precios_bienes: "Listado a Bienes",
};

export default function DetalleSolicitudPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, cargando } = useAuth();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [cargandoData, setCargandoData] = useState(true);
  const [alerta, setAlerta] = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const mostrarAlerta = useCallback((tipo: "ok" | "error", msg: string) => {
    setAlerta({ tipo, msg });
    setTimeout(() => setAlerta(null), 4000);
  }, []);

  const cargarDetalle = useCallback(async () => {
    setCargandoData(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get<{ solicitud: Solicitud; respuesta: Respuesta | null; items: Item[] }>(
          "/solicitudes/" + id + "/detalle"
        ),
        api.get<Configuracion>("/configuracion"),
      ]);
      setSolicitud(r1.data.solicitud);
      setRespuesta(r1.data.respuesta);
      setItems(r1.data.items ?? []);
      setConfig(r2.data);
    } catch { mostrarAlerta("error", "No se pudo cargar"); }
    finally { setCargandoData(false); }
  }, [id, mostrarAlerta]);

  useEffect(() => { if (!cargando && !user) router.replace("/"); }, [user, cargando, router]);
  useEffect(() => { if (user) cargarDetalle(); }, [user, cargarDetalle]); // eslint-disable-line

  const tasa = (config?.tasa_impuesto ?? 15) / 100;
  const sim = config?.moneda_simbolo ?? "L.";
  const fmt = (n: number) => sim + " " + n.toLocaleString("es-HN", { minimumFractionDigits: 2 });
  const subtotal = items.reduce((a, i) => a + Number(i.precio_unitario) * Number(i.cantidad_disponible), 0);
  const isv = items.filter(i => i.aplica_isv === 1).reduce((a, i) => a + Number(i.precio_unitario) * Number(i.cantidad_disponible) * tasa, 0);
  const total = subtotal + isv;

  if (cargando || !user) return null;

  const esCompras = solicitud?.tipo === "cotizacion" && ["admin","compras"].includes(user.rol);
  const esBienes = solicitud?.tipo === "precios_bienes" && ["admin","bienes"].includes(user.rol);
  const respondida = solicitud?.estado === "respondida";
  const cancelada = solicitud?.estado === "cancelada";
  const puedeReq = respondida && solicitud?.tipo === "precios_bienes" &&
    (user.departamento_id === solicitud?.departamento_id || user.rol === "admin");
  const urlPdf = respuesta?.archivo_pdf ? BASE_URL + "/" + respuesta.archivo_pdf : null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/solicitudes")} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">General / Solicitudes</p>
            <h1 className="text-xl font-bold text-[#1a1a2e]">{solicitud?.numero ?? "Cargando..."}</h1>
          </div>
          {puedeReq && (
            <button onClick={() => router.push("/dashboard/requisiciones/nueva?desde_solicitud=" + solicitud?.id)}
              className="bg-[#2e7d32] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#256327]">
              Generar Requisicion
            </button>
          )}
        </header>

        {alerta && (
          <div className={"mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium " +
            (alerta.tipo === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
            {alerta.msg}
          </div>
        )}

        {cargandoData ? (
          <div className="p-12 text-center text-sm text-gray-400">Cargando...</div>
        ) : !solicitud ? (
          <div className="p-12 text-center text-sm text-gray-400">No encontrada</div>
        ) : (
          <div className="p-6 flex flex-col gap-4 max-w-4xl">

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Informacion</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Numero</p><p className="font-bold text-[#1b3a6b]">{solicitud.numero}</p></div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Tipo</p><p className="font-medium text-gray-700">{TIPO[solicitud.tipo]}</p></div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Estado</p>
                  <span className={"text-xs px-2 py-1 rounded font-medium " + (ESTADO[solicitud.estado]?.cls ?? "")}>
                    {ESTADO[solicitud.estado]?.label}
                  </span>
                </div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Fecha</p><p className="text-gray-700">{new Date(solicitud.fecha_solicitud).toLocaleDateString("es-HN")}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Descripcion</p><p className="text-gray-700">{solicitud.observaciones}</p></div>
              </div>
            </div>

            {!respondida && !cancelada && (
              <div className={"rounded-xl px-5 py-4 text-sm border " +
                (solicitud.estado === "en_espera" ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-yellow-50 border-yellow-200 text-yellow-700")}>
                {solicitud.estado === "pendiente" && "Pendiente de revision."}
                {solicitud.estado === "en_espera" && "En atencion. Ya fue vista por el responsable."}
              </div>
            )}

            {cancelada && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">Cancelada.</div>}

            {respondida && respuesta && respuesta.tipo_respuesta === "pdf_cotizacion" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Respuesta de Compras</h2>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Respondido por</p><p>{respuesta.respondido_por_dni}</p></div>
                  <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Fecha</p><p>{new Date(respuesta.fecha_respuesta).toLocaleDateString("es-HN")}</p></div>
                  {respuesta.observaciones && <div className="col-span-2"><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Observaciones</p><p>{respuesta.observaciones}</p></div>}
                </div>
                {urlPdf
                  ? <a href={urlPdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#1b3a6b] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#162f58]">Descargar PDF</a>
                  : <p className="text-sm text-gray-400 italic">Sin archivo adjunto.</p>
                }
              </div>
            )}

            {respondida && respuesta && respuesta.tipo_respuesta === "listado_precios" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-700">Respuesta de Bienes</h2>
                  {puedeReq && (
                    <button onClick={() => router.push("/dashboard/requisiciones/nueva?desde_solicitud=" + solicitud.id)}
                      className="bg-[#2e7d32] text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-[#256327]">
                      Generar Requisicion
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Respondido por</p><p>{respuesta.respondido_por_dni}</p></div>
                  <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Fecha</p><p>{new Date(respuesta.fecha_respuesta).toLocaleDateString("es-HN")}</p></div>
                </div>
                {items.length === 0 ? <p className="text-sm text-gray-400 italic">Sin items.</p> : (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-3 py-2 text-xs text-gray-500">#</th>
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Descripcion</th>
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Unidad</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-500">Disp.</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-500">Precio</th>
                        <th className="text-center px-3 py-2 text-xs text-gray-500">ISV</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => {
                        const t = Number(item.precio_unitario) * Number(item.cantidad_disponible);
                        return (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-400">{item.numero_linea}</td>
                            <td className="px-3 py-2 text-gray-700">{item.descripcion}</td>
                            <td className="px-3 py-2 text-gray-500">{item.unidad}</td>
                            <td className="px-3 py-2 text-right">{Number(item.cantidad_disponible).toLocaleString("es-HN")}</td>
                            <td className="px-3 py-2 text-right">{fmt(Number(item.precio_unitario))}</td>
                            <td className="px-3 py-2 text-center">
                              {item.aplica_isv === 1
                                ? <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{config?.tasa_impuesto ?? 15}%</span>
                                : <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Exento</span>}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">{fmt(t)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-200">
                      <tr><td colSpan={6} className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Subtotal</td><td className="px-3 py-2 text-right font-medium">{fmt(subtotal)}</td></tr>
                      <tr><td colSpan={6} className="px-3 py-2 text-right text-xs font-semibold text-gray-500">ISV ({config?.tasa_impuesto ?? 15}%)</td><td className="px-3 py-2 text-right font-medium">{fmt(isv)}</td></tr>
                      <tr className="bg-gray-50"><td colSpan={6} className="px-3 py-2 text-right text-sm font-bold text-gray-700">TOTAL</td><td className="px-3 py-2 text-right font-black text-[#1b3a6b]">{fmt(total)}</td></tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}

            {(esCompras || esBienes) && !respondida && !cancelada && (
              <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-[#c8a020]">
                <p className="text-sm font-semibold text-gray-700 mb-1">Accion requerida</p>
                <p className="text-xs text-gray-400 mb-3">{esCompras ? "Sube el PDF de cotizacion." : "Registra el listado de precios."}</p>
                <button
                  onClick={() => router.push((esCompras ? "/dashboard/solicitudes/responder-compras?id=" : "/dashboard/solicitudes/responder-bienes?id=") + solicitud.id)}
                  className="bg-[#c8a020] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#b8901a]">
                  Responder esta solicitud
                </button>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}