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

export default function ResponderComprasPage() {
  const router             = useRouter();
  const { user, cargando } = useAuth();

  const [solicitudes,   setSolicitudes]   = useState<Solicitud[]>([]);
  const [seleccionada,  setSeleccionada]  = useState<Solicitud | null>(null);
  const [archivo,       setArchivo]       = useState<File | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [guardando,     setGuardando]     = useState(false);
  const [cargandoData,  setCargandoData]  = useState(true);
  const [alerta,        setAlerta]        = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const mostrarAlerta = useCallback((tipo: "ok" | "error", msg: string) => {
    setAlerta({ tipo, msg });
    setTimeout(() => setAlerta(null), 4000);
  }, []);

  useEffect(() => {
    if (!cargando && !user) { router.replace("/"); return; }
    if (!["admin", "compras"].includes(user?.rol ?? "")) {
      router.replace("/dashboard");
      return;
    }
    api.get<Solicitud[]>("/solicitudes", { params: { tipo: "cotizacion" } })
      .then((res) => {
        setSolicitudes(res.data.filter(s => ["pendiente", "en_espera"].includes(s.estado)));
      })
      .catch(() => mostrarAlerta("error", "No se pudo cargar la lista"))
      .finally(() => setCargandoData(false));
  }, [user, cargando]); // eslint-disable-line

  const handleSeleccionar = (sol: Solicitud) => {
    setSeleccionada(sol);
    setArchivo(null);
    setObservaciones("");
  };

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const tiposPermitidos = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!tiposPermitidos.includes(file.type)) {
        mostrarAlerta("error", "Solo se permiten archivos PDF, JPG o PNG");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        mostrarAlerta("error", "El archivo no debe superar 10MB");
        return;
      }
      setArchivo(file);
    }
  };

  const handleGuardar = async () => {
    if (!seleccionada) return;
    if (!archivo) {
      mostrarAlerta("error", "Debes subir un archivo PDF o imagen");
      return;
    }

    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("tipo_respuesta", "pdf_cotizacion");
      formData.append("archivo", archivo);
      if (observaciones.trim()) {
        formData.append("observaciones", observaciones.trim());
      }

      await api.post("/solicitudes/" + seleccionada.id + "/responder", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      mostrarAlerta("ok", "Cotizacion registrada correctamente");
      setSolicitudes(prev => prev.filter(s => s.id !== seleccionada.id));
      setSeleccionada(null);
      setArchivo(null);
      setObservaciones("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      mostrarAlerta("error", e?.response?.data?.message ?? "Error al registrar la cotizacion");
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
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Compras</p>
            <h1 className="text-xl font-bold text-[#1a1a2e]">Responder Solicitudes de Cotizacion</h1>
          </div>
        </header>

        {alerta && (
          <div className={"mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium " +
            (alerta.tipo === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
            {alerta.msg}
          </div>
        )}

        <div className="p-6 flex gap-4">

          {/* Lista de solicitudes */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Cotizaciones pendientes ({solicitudes.length})
            </p>
            {cargandoData ? (
              <div className="text-sm text-gray-400 p-4">Cargando...</div>
            ) : solicitudes.length === 0 ? (
              <div className="bg-white rounded-xl p-4 text-sm text-gray-400 text-center shadow-sm">
                No hay cotizaciones pendientes
              </div>
            ) : (
              solicitudes.map((sol) => (
                <button
                  key={sol.id}
                  onClick={() => handleSeleccionar(sol)}
                  className={"w-full text-left bg-white rounded-xl p-4 shadow-sm border-2 transition-all " +
                    (seleccionada?.id === sol.id ? "border-[#1b3a6b]" : "border-transparent hover:border-gray-200")}
                >
                  <p className="font-bold text-sm text-[#1b3a6b]">{sol.numero}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{sol.observaciones}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className={"text-xs px-2 py-0.5 rounded font-medium " +
                      (sol.estado === "en_espera" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700")}>
                      {sol.estado === "en_espera" ? "En espera" : "Pendiente"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(sol.fecha_solicitud).toLocaleDateString("es-HN")}
                    </span>
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
                {/* Datos solicitud */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h2 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">
                    Respondiendo: {seleccionada.numero}
                  </h2>
                  <p className="text-sm text-gray-600">{seleccionada.observaciones}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Fecha: {new Date(seleccionada.fecha_solicitud).toLocaleDateString("es-HN")}
                  </p>
                </div>

                {/* Subir archivo */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h2 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">
                    Archivo de Cotizacion
                  </h2>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subir PDF o imagen <span className="text-red-500">*</span>
                  </label>

                  <div className={"border-2 border-dashed rounded-xl p-8 text-center transition-colors " +
                    (archivo ? "border-[#2e7d32] bg-green-50" : "border-gray-300 hover:border-[#1b3a6b]")}>
                    {archivo ? (
                      <div>
                        <p className="text-sm font-semibold text-[#2e7d32]">Archivo seleccionado:</p>
                        <p className="text-sm text-gray-700 mt-1">{archivo.name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(archivo.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          onClick={() => setArchivo(null)}
                          className="mt-3 text-xs text-red-500 hover:text-red-700 underline"
                        >
                          Cambiar archivo
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-3xl mb-2">📄</p>
                        <p className="text-sm text-gray-500 mb-3">
                          Arrastra el archivo aqui o haz clic para seleccionar
                        </p>
                        <p className="text-xs text-gray-400">PDF, JPG o PNG — maximo 10MB</p>
                        <label className="mt-4 inline-block cursor-pointer bg-[#1b3a6b] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#162f58] transition-colors">
                          Seleccionar archivo
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleArchivo}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Observaciones */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    placeholder="Ej. Cotizacion de Jetstereo. Garantia 1 año, entrega en Danli."
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a6b]/30 resize-none"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setSeleccionada(null)}
                    className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGuardar}
                    disabled={guardando || !archivo}
                    className="text-sm px-6 py-2 rounded-lg bg-[#1b3a6b] text-white font-semibold hover:bg-[#162f58] transition-colors disabled:opacity-60"
                  >
                    {guardando ? "Enviando..." : "Registrar Cotizacion"}
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