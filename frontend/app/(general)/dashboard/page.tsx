"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Chart, registerables } from "chart.js";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../component/Sidebar";
import api from "../../services/api";

Chart.register(...registerables);

interface Solicitud {
  id:              number;
  numero:          string;
  tipo:            string;
  estado:          string;
  fecha_solicitud: string;
  observaciones:   string;
}

interface Stats {
  proveedores:   number;
  solicitudes:   number;
  requisiciones: number;
  ordenes:       number;
  requisicionesPorEstado: { estado: string; total: number }[];
  ordenesPorMes:          { mes: string;    total: number }[];
  solicitudesPorTipo:     { tipo: string;   total: number }[];
  solicitudesPorEstado:   { estado: string; total: number }[];
  ultimasSolicitudes:     Solicitud[];
}

interface Configuracion {
  municipalidad_nombre: string;
  escudo_path:          string | null;
  logo_path:            string | null;
  tasa_impuesto:        number;
  moneda_simbolo:       string;
}

const ROL_LABEL: Record<string, string> = {
  admin: "Administrador", compras: "Depto. Compras",
  bienes: "Depto. Bienes", gerencia: "Gerencia",
  alcaldia: "Alcaldia", solicitante: "Solicitante",
  contabilidad: "Contabilidad",
};

const ESTADO_COLOR: Record<string, string> = {
  pendiente:  "bg-yellow-100 text-yellow-700",
  en_espera:  "bg-orange-100 text-orange-700",
  respondida: "bg-green-100 text-green-700",
  cancelada:  "bg-red-100 text-red-700",
};

const TIPO_LABEL: Record<string, string> = {
  cotizacion:     "Cotizacion",
  precios_bienes: "Listado Bienes",
};

const BASE_URL = "http://localhost:5000";

// Roles que ven el dashboard completo con graficas y tarjetas
const ROLES_DASHBOARD = ["admin", "gerencia", "alcaldia"];

export default function DashboardPage() {
  const router = useRouter();
  const { user, cargando } = useAuth();

  const [stats, setStats]           = useState<Stats | null>(null);
  const [config, setConfig]         = useState<Configuracion | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const refBarras  = useRef<HTMLCanvasElement>(null);
  const refDona    = useRef<HTMLCanvasElement>(null);
  const refLinea   = useRef<HTMLCanvasElement>(null);
  const refSolTipo = useRef<HTMLCanvasElement>(null);
  const instBarras  = useRef<Chart | null>(null);
  const instDona    = useRef<Chart | null>(null);
  const instLinea   = useRef<Chart | null>(null);
  const instSolTipo = useRef<Chart | null>(null);

  useEffect(() => {
    if (!cargando && !user) router.replace("/");
  }, [user, cargando, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get<Stats>("/dashboard/stats"),
      api.get<Configuracion>("/configuracion"),
    ]).then(([resStats, resConfig]) => {
      setStats(resStats.data);
      setConfig(resConfig.data);
    }).finally(() => setLoadingStats(false));
  }, [user]);

  useEffect(() => {
    if (!stats) return;
    if (!ROLES_DASHBOARD.includes(user?.rol ?? "")) return;

    if (refBarras.current) {
      instBarras.current?.destroy();
      instBarras.current = new Chart(refBarras.current, {
        type: "bar",
        data: {
          labels: stats.requisicionesPorEstado.map((r) => r.estado),
          datasets: [{ label: "Requisiciones", data: stats.requisicionesPorEstado.map((r) => Number(r.total)), backgroundColor: ["#1b3a6b","#c8a020","#2e7d32","#6a1b9a","#c62828","#e65100"], borderRadius: 6 }],
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
      });
    }

    if (refDona.current) {
      instDona.current?.destroy();
      instDona.current = new Chart(refDona.current, {
        type: "doughnut",
        data: {
          labels: stats.solicitudesPorEstado.map((s) => s.estado),
          datasets: [{ data: stats.solicitudesPorEstado.map((s) => Number(s.total)), backgroundColor: ["#c8a020","#2e7d32","#c62828"], borderWidth: 2 }],
        },
        options: { responsive: true, plugins: { legend: { position: "bottom" } } },
      });
    }

    if (refLinea.current) {
      instLinea.current?.destroy();
      instLinea.current = new Chart(refLinea.current, {
        type: "line",
        data: {
          labels: stats.ordenesPorMes.map((o) => o.mes),
          datasets: [{ label: "Ordenes emitidas", data: stats.ordenesPorMes.map((o) => Number(o.total)), borderColor: "#1b3a6b", backgroundColor: "#1b3a6b22", tension: 0.4, fill: true }],
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
      });
    }

    if (refSolTipo.current) {
      instSolTipo.current?.destroy();
      instSolTipo.current = new Chart(refSolTipo.current, {
        type: "bar",
        data: {
          labels: stats.solicitudesPorTipo.map((s) => TIPO_LABEL[s.tipo] || s.tipo),
          datasets: [{ label: "Solicitudes", data: stats.solicitudesPorTipo.map((s) => Number(s.total)), backgroundColor: ["#1b3a6b","#c8a020"], borderRadius: 6 }],
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
      });
    }

    return () => {
      instBarras.current?.destroy();
      instDona.current?.destroy();
      instLinea.current?.destroy();
      instSolTipo.current?.destroy();
    };
  }, [stats, user]);

  if (cargando || !user) return null;

  const esDashboardCompleto = ROLES_DASHBOARD.includes(user.rol);

  const CARDS = [
    { label: "Proveedores",       valor: stats?.proveedores,   desc: "Registrados activos",     color: "#1b3a6b" },
    { label: "Solicitudes",       valor: stats?.solicitudes,   desc: "Total en el sistema",      color: "#c8a020" },
    { label: "Requisiciones",     valor: stats?.requisiciones, desc: "En proceso de aprobacion", color: "#2e7d32" },
    { label: "Ordenes de Compra", valor: stats?.ordenes,       desc: "Generadas",                color: "#6a1b9a" },
  ];

  const pendientes    = stats?.solicitudesPorEstado.find(s => s.estado === "pendiente")?.total ?? 0;
  const cotizaciones  = stats?.solicitudesPorTipo.find(s => s.tipo === "cotizacion")?.total ?? 0;
  const listadoBienes = stats?.solicitudesPorTipo.find(s => s.tipo === "precios_bienes")?.total ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">

        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {config?.escudo_path ? (
              <img src={BASE_URL + "/" + config.escudo_path} alt="Escudo" className="w-12 h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 bg-[#1b3a6b] rounded-full flex items-center justify-center text-white font-black text-lg">M</div>
            )}
            <div>
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Panel de Control</p>
              <h1 className="text-xl font-bold text-[#1a1a2e]">Bienvenido, {user.username}</h1>
              <p className="text-xs text-gray-400">
                {ROL_LABEL[user.rol]} · {new Date().toLocaleDateString("es-HN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          {config?.logo_path && (
            <img src={BASE_URL + "/" + config.logo_path} alt="Logo" className="h-12 object-contain" />
          )}
        </header>

        <div className="p-6 flex flex-col gap-5">

          {/* Solo admin, gerencia y alcaldia ven tarjetas y graficas */}
          {esDashboardCompleto && (
            <>
              <section className="grid grid-cols-4 gap-4">
                {CARDS.map((card) => (
                  <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border-t-4" style={{ borderTopColor: card.color }}>
                    <p className="text-3xl font-black mb-1" style={{ color: card.color }}>
                      {loadingStats ? "..." : (card.valor ?? "0")}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">{card.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
                  </div>
                ))}
              </section>

              <section className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#c8a020]">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Cotizaciones (Compras)</p>
                  <p className="text-3xl font-black text-[#c8a020]">{loadingStats ? "..." : cotizaciones}</p>
                  <p className="text-xs text-gray-400 mt-1">Dirigidas a Compras y Suministros</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#2e7d32]">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Listados de Precios (Bienes)</p>
                  <p className="text-3xl font-black text-[#2e7d32]">{loadingStats ? "..." : listadoBienes}</p>
                  <p className="text-xs text-gray-400 mt-1">Dirigidas a Bienes y Proveeduria</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#c62828]">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Pendientes de Respuesta</p>
                  <p className="text-3xl font-black text-[#c62828]">{loadingStats ? "..." : pendientes}</p>
                  <p className="text-xs text-gray-400 mt-1">Requieren atencion</p>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-bold text-gray-700 mb-4">Requisiciones por Estado</p>
                  <canvas ref={refBarras} />
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-bold text-gray-700 mb-4">Solicitudes por Estado</p>
                  <canvas ref={refDona} />
                </div>
              </section>

              <section className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-bold text-gray-700 mb-4">Solicitudes por Tipo</p>
                  <canvas ref={refSolTipo} />
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-bold text-gray-700 mb-4">Ordenes de Compra por Mes</p>
                  <canvas ref={refLinea} />
                </div>
              </section>

              <section className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-gray-700">Ultimas Solicitudes</h2>
                  <button onClick={() => router.push("/dashboard/solicitudes")} className="text-xs text-[#1b3a6b] hover:underline font-medium">
                    Ver todas
                  </button>
                </div>
                {!stats?.ultimasSolicitudes?.length ? (
                  <p className="text-sm text-gray-400 p-6 text-center">No hay solicitudes registradas.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["Numero", "Tipo", "Descripcion", "Estado", "Fecha"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.ultimasSolicitudes.map((s) => (
                        <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-[#1b3a6b]">{s.numero}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">
                              {TIPO_LABEL[s.tipo] || s.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{s.observaciones}</td>
                          <td className="px-4 py-3">
                            <span className={"text-xs px-2 py-1 rounded font-medium " + (ESTADO_COLOR[s.estado] || "")}>
                              {s.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                            {s.fecha_solicitud ? new Date(s.fecha_solicitud).toLocaleDateString("es-HN") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}

          {/* Mensaje de bienvenida para roles sin dashboard */}
          {!esDashboardCompleto && (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <div className="w-16 h-16 bg-[#1b3a6b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👋</span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">Bienvenido, {user.username}</h2>
              <p className="text-gray-500 text-sm mb-6">Usa el menu lateral para acceder a tus funciones.</p>
              <button
                onClick={() => router.push("/dashboard/solicitudes")}
                className="bg-[#1b3a6b] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#162f58] transition-colors"
              >
                Ir a Solicitudes
              </button>
            </div>
          )}

        </div>

        <footer className="mt-auto px-8 py-3 border-t border-gray-200 bg-white text-xs text-gray-400">
          <p>{config?.municipalidad_nombre || "Municipalidad de Danli"} - Sistema de Gestion de Requisiciones y Compras</p>
          <p>El Paraiso, Honduras · ISV {config?.tasa_impuesto ?? 15}% · {config?.moneda_simbolo ?? "L."} · {new Date().getFullYear()}</p>
        </footer>

      </main>
    </div>
  );
}