"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../component/Sidebar";
import api from "../../../services/api";

interface Configuracion {
  municipalidad_nombre: string;
  municipalidad_dir:    string;
  municipalidad_tel:    string;
  alcalde_nombre:       string;
  alcalde_cargo:        string;
  gerente_nombre:       string;
  gerente_cargo:        string;
  jefe_compras_nombre:  string;
  jefe_compras_cargo:   string;
  jefe_bienes_nombre:   string;
  jefe_bienes_cargo:    string;
  logo_path:            string | null;
  escudo_path:          string | null;
  pie_documento:        string;
  req_prefijo:          string;
  req_siguiente:        number;
  oc_prefijo:           string;
  oc_siguiente:         number;
  sol_prefijo:          string;
  sol_siguiente:        number;
  inv_prefijo:          string;
  inv_siguiente:        number;
  traslado_prefijo:     string;
  traslado_siguiente:   number;
  tasa_impuesto:        number;
  moneda_simbolo:       string;
  req_filas_base:       number;
  oc_filas_base:        number;
  dias_alerta_stock:    number;
  sistema_version:      string;
}

const VACIO: Configuracion = {
  municipalidad_nombre: "", municipalidad_dir: "", municipalidad_tel: "",
  alcalde_nombre: "", alcalde_cargo: "",
  gerente_nombre: "", gerente_cargo: "",
  jefe_compras_nombre: "", jefe_compras_cargo: "",
  jefe_bienes_nombre: "", jefe_bienes_cargo: "",
  logo_path: null, escudo_path: null,
  pie_documento: "",
  req_prefijo: "R",   req_siguiente: 1,
  oc_prefijo: "OC",   oc_siguiente: 1,
  sol_prefijo: "SOL", sol_siguiente: 1,
  inv_prefijo: "INV", inv_siguiente: 1,
  traslado_prefijo: "TRA", traslado_siguiente: 1,
  tasa_impuesto: 15, moneda_simbolo: "L.",
  req_filas_base: 5, oc_filas_base: 5,
  dias_alerta_stock: 7, sistema_version: "1.0",
};

const BASE_URL = "http://localhost:4000";

export default function ConfiguracionPage() {
  const router = useRouter();
  const { user, cargando } = useAuth();

  const [form, setForm]           = useState<Configuracion>(VACIO);
  const [loading, setLoading]     = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [alerta, setAlerta]       = useState({ tipo: "", msg: "" });
  // timestamp para romper caché de imágenes
  const [imgTs, setImgTs]         = useState(0);

  const refEscudo = useRef<HTMLInputElement>(null);
  const refLogo   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!cargando && !user) router.replace("/");
    if (!cargando && user && user.rol !== "admin") router.replace("/dashboard");
  }, [user, cargando, router]);

  useEffect(() => {
    if (!user) return;
    api.get<Configuracion>("/configuracion")
      .then((res) => setForm({ ...VACIO, ...res.data }))
      .finally(() => setLoading(false));
  }, [user]);

  const mostrarAlerta = (tipo: string, msg: string) => {
    setAlerta({ tipo, msg });
    setTimeout(() => setAlerta({ tipo: "", msg: "" }), 5000);
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await api.put("/configuracion", form);
      mostrarAlerta("ok", "✓ Configuración guardada correctamente.");
    } catch {
      mostrarAlerta("err", "✗ Error al guardar. Verifica la conexión con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  const handleSubirImagen = async (campo: "escudo_path" | "logo_path", archivo: File) => {
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("campo",   campo);
    try {
      const res = await api.post<{ ruta: string }>("/configuracion/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Actualizar la ruta en el form y romper caché
      setForm((prev) => ({ ...prev, [campo]: res.data.ruta }));
      setImgTs(Date.now()); // fuerza recarga de imagen
      mostrarAlerta("ok", "✓ Imagen subida correctamente.");
    } catch {
      mostrarAlerta("err", "✗ Error al subir la imagen.");
    }
  };

  if (cargando || !user) return null;

  const F = (key: keyof Configuracion, label: string, tipo = "text", full = false) => (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <input
        type={tipo}
        value={(form[key] as string | number) ?? ""}
        onChange={(e) => setForm({
          ...form,
          [key]: tipo === "number" ? Number(e.target.value) : e.target.value,
        })}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b3a6b] transition-colors"
      />
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">

        <header className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-10">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Administración</p>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Configuración del Sistema</h1>
          {form.sistema_version && (
            <p className="text-xs text-gray-400 mt-0.5">Versión {form.sistema_version}</p>
          )}
        </header>

        <div className="p-6 flex flex-col gap-5 max-w-4xl">

          {/* Alerta */}
          {alerta.msg && (
            <div className={`text-sm rounded-lg px-4 py-3 font-medium ${
              alerta.tipo === "ok"
                ? "bg-green-50 border border-green-300 text-green-700"
                : "bg-red-50 border border-red-300 text-red-700"
            }`}>
              {alerta.msg}
            </div>
          )}

          {loading ? (
            <p className="text-gray-400 text-sm">Cargando configuración...</p>
          ) : (<>

            {/* Logos */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">
                Identidad Visual
              </h2>
              <div className="grid grid-cols-2 gap-6">

                {/* Escudo */}
                <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl">
                  {form.escudo_path ? (
                    <img
                      src={`${BASE_URL}/${form.escudo_path}?t=${imgTs}`}
                      alt="Escudo"
                      className="w-24 h-24 object-contain"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 text-4xl">
                      🏛️
                    </div>
                  )}
                  <p className="text-xs font-semibold text-gray-500 uppercase">Escudo Institucional</p>
                  <p className="text-[10px] text-gray-400">PNG, JPG — máx 2MB</p>
                  <input
                    ref={refEscudo} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleSubirImagen("escudo_path", e.target.files[0]); }}
                  />
                  <button
                    onClick={() => refEscudo.current?.click()}
                    className="text-xs bg-[#1b3a6b] text-white px-4 py-1.5 rounded-lg hover:bg-[#2a5298] transition-colors"
                  >
                    {form.escudo_path ? "Cambiar escudo" : "Subir escudo"}
                  </button>
                </div>

                {/* Logo */}
                <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl">
                  {form.logo_path ? (
                    <img
                      src={`${BASE_URL}/${form.logo_path}?t=${imgTs}`}
                      alt="Logo"
                      className="w-40 h-24 object-contain"
                    />
                  ) : (
                    <div className="w-40 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-4xl">
                      🖼️
                    </div>
                  )}
                  <p className="text-xs font-semibold text-gray-500 uppercase">Logo Municipalidad</p>
                  <p className="text-[10px] text-gray-400">PNG, JPG — máx 2MB</p>
                  <input
                    ref={refLogo} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleSubirImagen("logo_path", e.target.files[0]); }}
                  />
                  <button
                    onClick={() => refLogo.current?.click()}
                    className="text-xs bg-[#1b3a6b] text-white px-4 py-1.5 rounded-lg hover:bg-[#2a5298] transition-colors"
                  >
                    {form.logo_path ? "Cambiar logo" : "Subir logo"}
                  </button>
                </div>
              </div>
            </div>

            {/* Datos institucionales */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">
                Datos Institucionales
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {F("municipalidad_nombre", "Nombre de la Municipalidad", "text", true)}
                {F("municipalidad_tel",    "Teléfono")}
                {F("moneda_simbolo",       "Símbolo de Moneda")}
                {F("municipalidad_dir",    "Dirección", "text", true)}
              </div>
            </div>

            {/* Autoridades */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">
                Autoridades y Jefaturas
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {F("alcalde_nombre",      "Nombre del Alcalde")}
                {F("alcalde_cargo",       "Cargo del Alcalde")}
                {F("gerente_nombre",      "Nombre del Gerente")}
                {F("gerente_cargo",       "Cargo del Gerente")}
                {F("jefe_compras_nombre", "Jefe de Compras")}
                {F("jefe_compras_cargo",  "Cargo Compras")}
                {F("jefe_bienes_nombre",  "Jefe de Bienes")}
                {F("jefe_bienes_cargo",   "Cargo Bienes")}
              </div>
            </div>

            {/* Numeración */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">
                Numeración de Documentos
              </h2>
              <div className="grid grid-cols-4 gap-4">
                {F("req_prefijo",        "Prefijo Req.")}
                {F("req_siguiente",      "Siguiente #", "number")}
                {F("oc_prefijo",         "Prefijo OC")}
                {F("oc_siguiente",       "Siguiente #", "number")}
                {F("sol_prefijo",        "Prefijo Sol.")}
                {F("sol_siguiente",      "Siguiente #", "number")}
                {F("inv_prefijo",        "Prefijo Inv.")}
                {F("inv_siguiente",      "Siguiente #", "number")}
                {F("traslado_prefijo",   "Prefijo Traslado")}
                {F("traslado_siguiente", "Siguiente #", "number")}
              </div>
            </div>

            {/* Sistema */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">
                Parámetros del Sistema
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {F("tasa_impuesto",     "Tasa ISV (%)",           "number")}
                {F("dias_alerta_stock", "Días alerta stock bajo", "number")}
                {F("req_filas_base",    "Filas base Requisición", "number")}
                {F("oc_filas_base",     "Filas base OC",          "number")}
                {F("sistema_version",   "Versión del Sistema")}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Pie de Documento
                  </label>
                  <textarea
                    value={form.pie_documento ?? ""}
                    onChange={(e) => setForm({ ...form, pie_documento: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b3a6b] transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Botón guardar */}
            <div className="flex justify-end pb-6">
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="bg-[#1b3a6b] hover:bg-[#2a5298] disabled:opacity-60 text-white font-semibold text-sm px-8 py-3 rounded-lg transition-colors"
              >
                {guardando ? "Guardando..." : "Guardar Configuración"}
              </button>
            </div>

          </>)}
        </div>
      </main>
    </div>
  );
}