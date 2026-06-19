"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../component/Sidebar";
import { getProveedores, createProveedor, Proveedor } from "../../../services/proveedorService";
import api from "../../../services/api";

const FORM_VACIO = { nombre: "", rtn: "", direccion: "", correo: "", telefono: "" };

export default function ProveedoresPage() {
  const router             = useRouter();
  const { user, cargando } = useAuth();
  const [proveedores,  setProveedores]  = useState<Proveedor[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState<"crear" | "editar" | null>(null);
  const [seleccionado, setSeleccionado] = useState<Proveedor | null>(null);
  const [form,         setForm]         = useState(FORM_VACIO);
  const [guardando,    setGuardando]    = useState(false);
  const [busqueda,     setBusqueda]     = useState("");
  const [alerta,       setAlerta]       = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const mostrarAlerta = (tipo: "ok" | "error", msg: string) => {
    setAlerta({ tipo, msg });
    setTimeout(() => setAlerta(null), 4000);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try { setProveedores(await getProveedores()); }
    catch { mostrarAlerta("error", "Error al cargar proveedores"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!cargando && !user) { router.replace("/"); return; }
    if (!cargando && user && !["admin", "compras"].includes(user.rol)) { router.replace("/dashboard"); return; }
    if (user) cargar();
  }, [user, cargando]);

  const abrirCrear = () => { setForm(FORM_VACIO); setModal("crear"); };
  const abrirEditar = (p: Proveedor) => {
    setSeleccionado(p);
    setForm({ nombre: p.nombre, rtn: p.rtn, direccion: p.direccion ?? "", correo: p.correo ?? "", telefono: p.telefono ?? "" });
    setModal("editar");
  };
  const cerrarModal = () => { setModal(null); setSeleccionado(null); };

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { mostrarAlerta("error", "El nombre es obligatorio"); return; }
    if (!form.rtn.trim() || form.rtn.replace(/-/g, "").length !== 14) {
      mostrarAlerta("error", "El RTN debe tener 14 digitos"); return;
    }
    setGuardando(true);
    try {
      const payload = {
        nombre:    form.nombre.trim(),
        rtn:       form.rtn.replace(/-/g, ""),
        direccion: form.direccion.trim() || undefined,
        correo:    form.correo.trim() || undefined,
        telefono:  form.telefono.trim() || undefined,
      };
      if (modal === "crear") {
        await createProveedor(payload);
        mostrarAlerta("ok", "Proveedor creado correctamente");
      } else if (modal === "editar" && seleccionado) {
        await api.put("/proveedores/" + seleccionado.id, payload);
        mostrarAlerta("ok", "Proveedor actualizado correctamente");
      }
      cerrarModal();
      await cargar();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      mostrarAlerta("error", err?.response?.data?.message ?? "Error al guardar");
    } finally { setGuardando(false); }
  };

  const handleDesactivar = async (p: Proveedor) => {
    if (!confirm("Desactivar proveedor " + p.nombre + "?")) return;
    try {
      await api.delete("/proveedores/" + p.id);
      mostrarAlerta("ok", "Proveedor desactivado");
      await cargar();
    } catch { mostrarAlerta("error", "Error al desactivar"); }
  };

  if (cargando || !user) return null;

  const proveedoresFiltrados = busqueda
    ? proveedores.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.rtn.includes(busqueda))
    : proveedores;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Compras</p>
            <h1 className="text-xl font-bold text-[#1a1a2e]">Proveedores</h1>
          </div>
          <button onClick={abrirCrear}
            className="bg-[#1b3a6b] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#162f58]">
            + Nuevo Proveedor
          </button>
        </header>

        {alerta && (
          <div className={"mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium " +
            (alerta.tipo === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
            {alerta.msg}
          </div>
        )}

        <div className="p-6 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm flex gap-4 items-center">
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o RTN..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b3a6b]" />
            <span className="text-xs text-gray-400">{proveedoresFiltrados.length} resultado{proveedoresFiltrados.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-sm text-gray-400">Cargando...</div>
            ) : proveedoresFiltrados.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">No hay proveedores registrados</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">RTN</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Telefono</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Correo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedoresFiltrados.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-[#1b3a6b]">{p.nombre}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.rtn}</td>
                      <td className="px-4 py-3 text-gray-500">{p.telefono ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{p.correo ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={"text-xs px-2 py-1 rounded font-medium " + (p.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => abrirEditar(p)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-[#1b3a6b] text-white hover:bg-[#162f58] font-medium">
                            Editar
                          </button>
                          {p.activo && user.rol === "admin" && (
                            <button onClick={() => handleDesactivar(p)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium">
                              Desactivar
                            </button>
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

        {/* Modal Crear/Editar */}
        {(modal === "crear" || modal === "editar") && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-[#1a1a2e] mb-4">
                {modal === "crear" ? "Nuevo Proveedor" : "Editar Proveedor"}
              </h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Nombre / Razon Social *</label>
                  <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Papeleria El Estudiante"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b3a6b]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">RTN * (14 digitos)</label>
                  <input type="text" value={form.rtn} onChange={(e) => setForm({ ...form, rtn: e.target.value })}
                    placeholder="06019887200321"
                    maxLength={14}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#1b3a6b]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Direccion</label>
                  <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    placeholder="Danli, El Paraiso"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b3a6b]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Correo</label>
                  <input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })}
                    placeholder="info@proveedor.hn"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b3a6b]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Telefono</label>
                  <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="2763-5678"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b3a6b]" />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-5">
                <button onClick={cerrarModal}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleGuardar} disabled={guardando}
                  className="text-sm px-5 py-2 rounded-lg bg-[#1b3a6b] text-white font-semibold hover:bg-[#162f58] disabled:opacity-60">
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}