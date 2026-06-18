"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Chart, registerables } from "chart.js";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../component/Sidebar";
import api from "../../services/api";

Chart.register(...registerables);

interface Stats {
  proveedores:   number;
  solicitudes:   number;
  requisiciones: number;
  ordenes:       number;
  requisicionesPorEstado: { estado: string; total: number }[];
  ordenesPorMes:          { mes: string;    total: number }[];
  solicitudesPorTipo:     { tipo: string;   total: number }[];
}

interface Configuracion {
  municipalidad_nombre: string;
  escudo_path:          string | null;
  logo_path:            string | null;
}

const ROL_LABEL: Record<string, string> = {
  admin:       "Administrador",
  compras:     "Depto. Compras",
  bienes:      "Depto. Bienes",
  gerencia:    "Gerencia",
  alcaldia:    "Alcaldía",
  solicitante: "Solicitante",
};

const BASE_URL = "http://localhost:5000";

export default function DashboardPage() {
  const router = useRouter();
  const { user, cargando } = useAuth();

  const [stats, setStats]       = useState<Stats | null>(null);
  const [config, setConfig]     = useState<Configuracion | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const refBarras  = useRef<HTMLCanvasElement>(null);
  const refDona    = useRef<HTMLCanvasElement>(null);
  const refLinea   = useRef<HTMLCanvasElement>(null);
  const instBarras = useRef<Chart | null>(null);
  const instDona   = useRef<Chart | null>(null);
  const instLinea  = useRef<Chart | null>(null);

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

    if (refBarras.current) {
      instBarras.current?.destroy();
      instBarras.current = new Chart(refBarras.current, {
        type: "bar",
        data: {
          labels: stats.requisicionesPorEstado.map((r) => r.estado),
          datasets: [{
            label: "Requisiciones",
            data:  stats.requisicionesPorEstado.map((r) => Number(r.total)),
            backgroundColor: ["#1b3a6b","#c8a020","#2e7d32","#6a1b9a","#c62828","#e65100"],
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales:  { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });
    }

    if (refDona.current) {
      instDona.current?.destroy();
      instDona.current = new Chart(refDona.current, {
        type: "doughnut",
        data: {
          labels: stats.solicitudesPorTipo.map((s) => s.tipo),
          datasets: [{
            data:            stats.solicitudesPorTipo.map((s) => Number(s.total)),
            backgroundColor: ["#1b3a6b","#c8a020","#2e7d32"],
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom" } },
        },
      });
    }

    if (refLinea.current) {
      instLinea.current?.destroy();
      instLinea.current = new Chart(refLinea.current, {
        type: "line",
        data: {
          labels: stats.ordenesPorMes.map((o) => o.mes),
          datasets: [{
            label:           "Órdenes emitidas",
            data:            stats.ordenesPorMes.map((o) => Number(o.total)),
            borderColor:     "#1b3a6b",
            backgroundColor: "#1b3a6b22",
            tension: 0.4,
            fill: true,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales:  { y: { beginAtZero: true } },
        },
      });
    }

    return () => {
      instBarras.current?.destroy();
      instDona.current?.destroy();
      instLinea.current?.destroy();
    };
  }, [stats]);

  if (cargando || !user) return null;

  const CARDS = [
    { label: "Proveedores",       valor: stats?.proveedores,   desc: "Registrados activos",     color: "#1b3a6b" },
    { label: "Solicitudes",       valor: stats?.solicitudes,   desc: "Total en el sistema",      color: "#c8a020" },
    { label: "Requisiciones",     valor: stats?.requisiciones, desc: "En proceso de aprobación", color: "#2e7d32" },
    { label: "Órdenes de Compra", valor: stats?.ordenes,       desc: "Generadas",                color: "#6a1b9a" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {/* Escudo — usando img normal, no next/image */}
            {config?.escudo_path ? (
              <img
                src={`${BASE_URL}/${config.escudo_path}`}
                alt="Escudo"
                className="w-12 h-12 object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-[#1b3a6b] rounded-full flex items-center justify-center text-white font-black text-lg">
                M
              </div>
            )}
            <div>
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                Panel de Control
              </p>
              <h1 className="text-xl font-bold text-[#1a1a2e]">
                Bienvenido, {user.username}
              </h1>
              <p className="text-xs text-gray-400">
                {ROL_LABEL[user.rol]} · {new Date().toLocaleDateString("es-HN", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Logo — usando img normal, no next/image */}
          {config?.logo_path && (
            <img
              src={`${BASE_URL}/${config.logo_path}`}
              alt="Logo"
              className="h-12 object-contain"
            />
          )}
        </header>

        <div className="p-6 flex flex-col gap-5">

          {/* Tarjetas */}
          <section className="grid grid-cols-4 gap-4">
            {CARDS.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl p-5 shadow-sm border-t-4"
                style={{ borderTopColor: card.color }}
              >
                <p className="text-3xl font-black mb-1" style={{ color: card.color }}>
                  {loadingStats ? "..." : (card.valor ?? "0")}
                </p>
                <p className="text-sm font-semibold text-gray-800">{card.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
              </div>
            ))}
          </section>

          {/* Gráficas fila 1 */}
          <section className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-700 mb-4">
                Requisiciones por Estado
              </p>
              <canvas ref={refBarras} />
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-700 mb-4">
                Solicitudes por Tipo
              </p>
              <canvas ref={refDona} />
            </div>
          </section>

          {/* Gráfica línea — ancho completo */}
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-700 mb-4">
              Órdenes de Compra por Mes
            </p>
            <canvas ref={refLinea} />
          </section>

        </div>

        <footer className="mt-auto px-8 py-3 border-t border-gray-200 bg-white text-xs text-gray-400">
          <p>
            {config?.municipalidad_nombre || "Municipalidad de Danlí"} — Sistema de Gestión de Requisiciones y Compras
          </p>
          <p>El Paraíso, Honduras · {new Date().getFullYear()}</p>
        </footer>

      </main>
    </div>
  );
}