"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../component/Sidebar";
import api from "../../../../services/api";

export default function NuevaSolicitudPage() {
  const router             = useRouter();
  const { user, cargando } = useAuth();

  const [tipo,          setTipo]          = useState<"cotizacion" | "precios_bienes">("cotizacion");
  const [observaciones, setObservaciones] = useState("");
  const [guardando,     setGuardando]     = useState(false);
  const [alerta,        setAlerta]        = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const mostrarAlerta = useCallback((tipo: "ok" | "error", msg: string) => {
    setAlerta({ tipo, msg });
    setTimeout(() => setAlerta(null), 4000);
  }, []);

  useEffect(() => {
    if (!cargando && !user) router.replace("/");
  }, [user, cargando, router]);

  const handleGuardar = async () => {
    if (!observaciones.trim() || observaciones.trim().length < 10) {
      mostrarAlerta("error", "La descripción debe tener al menos 10 caracteres");
      return;
    }
    setGuardando(true);
    try {
      // El backend toma departamento_id del token — no se envía desde el body
      await api.post("/solicitudes", { tipo, observaciones: observaciones.trim() });
      mostrarAlerta("ok", "Solicitud enviada correctamente");
      setTimeout(() => router.push("/dashboard/solicitudes"), 1500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      mostrarAlerta("error", e?.response?.data?.message ?? "Error al crear la solicitud");
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
          <button
            onClick={() => router.push("/dashboard/solicitudes")}
            className="text-gray-400 hover:text-gray-600 transition-colors text-lg"
          >
            ←
          </button>
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">General / Solicitudes</p>
            <h1 className="text-xl font-bold text-[#1a1a2e]">Nueva Solicitud</h1>
          </div>
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

        <div className="p-6 max-w-2xl">
          <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-6">

            {/* Info del solicitante */}
            <div className="bg-gray-50 rounded-lg p-4 flex gap-6 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Solicitante</p>
                <p className="font-medium text-gray-700">{user.username}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">DNI</p>
                <p className="font-medium text-gray-700">{user.empleado_dni}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Depto. ID</p>
                <p className="font-medium text-gray-700">{user.departamento_id ?? "—"}</p>
              </div>
            </div>

            {/* Tipo */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                ¿A quién va dirigida? <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTipo("cotizacion")}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${
                    tipo === "cotizacion"
                      ? "border-[#1b3a6b] bg-[#1b3a6b]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className={`font-bold text-sm ${tipo === "cotizacion" ? "text-[#1b3a6b]" : "text-gray-700"}`}>
                    📋 Cotización
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Precios a proveedores externos.<br />
                    Responde <strong>Compras</strong> con PDF.
                  </p>
                </button>
                <button
                  onClick={() => setTipo("precios_bienes")}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${
                    tipo === "precios_bienes"
                      ? "border-[#6a1b9a] bg-[#6a1b9a]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className={`font-bold text-sm ${tipo === "precios_bienes" ? "text-[#6a1b9a]" : "text-gray-700"}`}>
                    📦 Listado de Bienes
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Disponibilidad en bodega.<br />
                    Responde <strong>Bienes</strong> con precios.
                  </p>
                </button>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                ¿Qué necesitas? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={5}
                placeholder={
                  tipo === "cotizacion"
                    ? "Ej: Cotización de 3 impresoras multifunción para la oficina. Incluir precio, garantía y tiempo de entrega."
                    : "Ej: Lista de precios y disponibilidad de resmas de papel, lapiceros y folders para julio."
                }
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1b3a6b]/30 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {observaciones.length} caracteres
                {observaciones.length < 10 && observaciones.length > 0 && (
                  <span className="text-red-400"> — mínimo 10</span>
                )}
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => router.push("/dashboard/solicitudes")}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="text-sm px-6 py-2 rounded-lg bg-[#1b3a6b] text-white font-semibold hover:bg-[#162f58] transition-colors disabled:opacity-60"
              >
                {guardando ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}