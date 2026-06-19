"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../component/Sidebar";
import api from "../../../services/api";

interface Solicitud {
  id:              number;
  numero:          string;
  tipo:            "cotizacion" | "precios_bienes";
  estado:          "pendiente" | "en_espera" | "respondida" | "cancelada";
  departamento_id: number;
  empleado_dni:    string;
  observaciones:   string;
  fecha_solicitud: string;
  fecha_respuesta: string | null;
}

const TIPO_LABEL: Record<string, string> = {
  cotizacion:     "Cotización",
  precios_bienes: "Listado Bienes",
};

const TIPO_COLOR: Record<string, string> = {
  cotizacion:     "bg-blue-50 text-blue-700 border border-blue-100",
  precios_bienes: "bg-purple-50 text-purple-700 border border-purple-100",
};

const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
  pendiente:  { label: "Pendiente",  cls: "bg-yellow-100 text-yellow-700" },
  en_espera:  { label: "En espera",  cls: "bg-orange-100 text-orange-700" },
  respondida: { label: "Respondida", cls: "bg-green-100 text-green-700"   },
  cancelada:  { label: "Cancelada",  cls: "bg-red-100 text-red-700"       },
};

const ROLES_GLOBALES = ["admin", "compras", "bienes"];

export default function SolicitudesPage() {
  const router             = useRouter();
  const { user, cargando } = useAuth();

  const [solicitudes,  setSolicitudes]  = useState<Solicitud[]>([]);
  const [cargandoData, setCargandoData] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipo,   setFiltroTipo]   = useState("");
  const [alerta,       setAlerta]       = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const mostrarAlerta = useCallback((tipo: "ok" | "error", msg: string) => {
    setAlerta({ tipo, msg });
    setTimeout(() => setAlerta(null), 4000);
  }, []);

  const cargarSolicitudes = useCallback(async () => {
    setCargandoData(true);
    try {
      const params: Record<string, string> = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroTipo)   params.tipo   = filtroTipo;
      const res = await api.get<Solicitud[]>("/solicitudes", { params });
      setSolicitudes(res.data);
    } catch {
      mostrarAlerta("error", "Error al cargar solicitudes");
    } finally {
      setCargandoData(false);
    }
  }, [filtroEstado, filtroTipo, mostrarAlerta]);

  const cargadoRef = useRef(false);

  useEffect(() => {
    if (!cargando && !user) router.replace("/");
  }, [user, cargando, router]);

  useEffect(() => {
    if (user && !cargadoRef.current) {
      cargadoRef.current = true;
      cargarSolicitudes();
    }
  }, [user, cargarSolicitudes]);

  useEffect(() => {
    if (user && cargadoRef.current) {
      cargarSolicitudes();
    }
  }, [filtroEstado, filtroTipo]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelar = async (id: number, numero: string) => {
    if (!confirm(`¿Cancelar la solicitud ${numero}?`)) return;
    try {
      await api.put(`/solicitudes/${id}/cancelar`);
      mostrarAlerta("ok", `Solicitud ${numero} cancelada`);
      cargarSolicitudes();
    } catch {
      mostrarAlerta("error", "No se pudo cancelar la solicitud");
    }
  };

  if (cargando || !user) return null;

  const esRolGlobal = ROLES_GLOBALES.includes(user.rol);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">

        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">General</p>
            <h1 className="text-xl font-bold text-[#1a1a2e]">Solicitudes</h1>
            <p className="text-xs text-gray-400">
              {esRolGlobal ? "Viendo todas las solicitudes del sistema" : "Viendo solicitudes de tu departamento"}
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/solicitudes/nueva")}
            className="bg-[#1b3a6b] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#162f58] transition-colors"
          >
            + Nueva Solicitud
          </button>
        </header>

        {alerta && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium ${
            alerta.tipo === "ok"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {alerta.msg}
          </div>
        )}

        <div className="p-6 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm flex gap-4 items-center flex-wrap">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtrar:</p>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_espera">En espera</option>
              <option value="respondida">Respondida</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none"
            >
              <option value="">Todos los tipos</option>
              <option value="cotizacion">Cotización (Compras)</option>
              <option value="precios_bienes">Listado Bienes</option>
            </select>
            <button
              onClick={() => { setFiltroEstado(""); setFiltroTipo(""); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Limpiar
            </button>
            <span className="ml-auto text-xs text-gray-400">
              {solicitudes.length} resultado{solicitudes.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {cargandoData ? (
              <div className="p-12 text-center text-sm text-gray-400">Cargando solicitudes...</div>
            ) : solicitudes.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-400 text-sm">No hay solicitudes con los filtros seleccionados.</p>
                <button
                  onClick={() => router.push("/dashboard/solicitudes/nueva")}
                  className="mt-4 text-sm text-[#1b3a6b] hover:underline font-medium"
                >
                  Crear la primera solicitud →
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Número</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((s) => {
                    const estado = ESTADO_CONFIG[s.estado] ?? { label: s.estado, cls: "" };
                    const puedeCancelar =
                      ["pendiente", "en_espera"].includes(s.estado) &&
                      (user.rol === "admin" || s.departamento_id === user.departamento_id);
                    return (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-[#1b3a6b] whitespace-nowrap">{s.numero}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${TIPO_COLOR[s.tipo] ?? ""}`}>
                            {TIPO_LABEL[s.tipo] ?? s.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs">
                          <span className="line-clamp-2">{s.observaciones}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${estado.cls}`}>
                            {s.estado === "en_espera" && "👁 "}{estado.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                          {new Date(s.fecha_solicitud).toLocaleDateString("es-HN")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => router.push(`/dashboard/solicitudes/${s.id}`)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-[#1b3a6b] text-white hover:bg-[#162f58] transition-colors font-medium"
                            >
                              Ver detalle
                            </button>
                            {puedeCancelar && (
                              <button
                                onClick={() => cancelar(s.id, s.numero)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}