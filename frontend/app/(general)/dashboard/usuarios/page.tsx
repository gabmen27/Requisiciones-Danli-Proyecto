"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../component/Sidebar";
import api from "../../../services/api";

interface Usuario {
  id: number;
  empleado_dni: string;
  username: string;
  rol: string;
  departamento_id: number | null;
  activo: boolean;
}

interface Departamento {
  id: number;
  nombre: string;
}

const ROL_LABEL: Record<string, string> = {
  admin: "Administrador", compras: "Depto. Compras",
  bienes: "Depto. Bienes", gerencia: "Gerencia",
  alcaldia: "Alcaldia", contabilidad: "Contabilidad",
  solicitante: "Solicitante",
};

const ROLES = ["admin", "compras", "bienes", "gerencia", "alcaldia", "contabilidad", "solicitante"];

const FORM_VACIO = { empleado_dni: "", username: "", password: "", rol: "solicitante", departamento_id: "" };

export default function UsuariosPage() {
  const router             = useRouter();
  const { user, cargando } = useAuth();
  const [usuarios,     setUsuarios]     = useState<Usuario[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState<"crear" | "editar" | "password" | null>(null);
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
  const [form,         setForm]         = useState(FORM_VACIO);
  const [nuevaPass,    setNuevaPass]    = useState("");
  const [guardando,    setGuardando]    = useState(false);
  const [alerta,       setAlerta]       = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const mostrarAlerta = (tipo: "ok" | "error", msg: string) => {
    setAlerta({ tipo, msg });
    setTimeout(() => setAlerta(null), 4000);
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [resU, resD] = await Promise.all([
        api.get<Usuario[]>("/usuarios"),
        api.get<Departamento[]>("/departamentos").catch(() => ({ data: [] })),
      ]);
      setUsuarios(resU.data);
      setDepartamentos(resD.data);
    } catch { mostrarAlerta("error", "Error al cargar usuarios"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!cargando && !user) { router.replace("/"); return; }
    if (!cargando && user && user.rol !== "admin") { router.replace("/dashboard"); return; }
    if (user) cargar();
  }, [user, cargando]);

  const abrirCrear = () => { setForm(FORM_VACIO); setModal("crear"); };
  const abrirEditar = (u: Usuario) => {
    setSeleccionado(u);
    setForm({ empleado_dni: u.empleado_dni, username: u.username, password: "", rol: u.rol, departamento_id: u.departamento_id?.toString() ?? "" });
    setModal("editar");
  };
  const abrirPassword = (u: Usuario) => { setSeleccionado(u); setNuevaPass(""); setModal("password"); };
  const cerrarModal = () => { setModal(null); setSeleccionado(null); };

  const handleGuardar = async () => {
    if (!form.empleado_dni.trim() || !form.username.trim()) { mostrarAlerta("error", "DNI y usuario son obligatorios"); return; }
    if (modal === "crear" && !form.password.trim()) { mostrarAlerta("error", "La contrasena es obligatoria"); return; }
    setGuardando(true);
    try {
      const payload = {
        empleado_dni:   form.empleado_dni.trim(),
        username:       form.username.trim(),
        rol:            form.rol,
        departamento_id: form.departamento_id ? Number(form.departamento_id) : null,
        ...(modal === "crear" && { password: form.password }),
      };
      if (modal === "crear") {
        await api.post("/usuarios", payload);
        mostrarAlerta("ok", "Usuario creado correctamente");
      } else if (modal === "editar" && seleccionado) {
        await api.put("/usuarios/" + seleccionado.id, payload);
        mostrarAlerta("ok", "Usuario actualizado correctamente");
      }
      cerrarModal();
      await cargar();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      mostrarAlerta("error", err?.response?.data?.message ?? "Error al guardar");
    } finally { setGuardando(false); }
  };

  const handleCambiarPassword = async () => {
    if (!nuevaPass.trim() || nuevaPass.length < 6) { mostrarAlerta("error", "La contrasena debe tener al menos 6 caracteres"); return; }
    if (!seleccionado) return;
    setGuardando(true);
    try {
      await api.put("/usuarios/" + seleccionado.id + "/cambiar-password", { password_nuevo: nuevaPass });
      mostrarAlerta("ok", "Contrasena actualizada");
      cerrarModal();
    } catch { mostrarAlerta("error", "Error al cambiar contrasena"); }
    finally { setGuardando(false); }
  };

  const handleToggleActivo = async (u: Usuario) => {
    if (!confirm((u.activo ? "Desactivar" : "Activar") + " usuario " + u.username + "?")) return;
    try {
      await api.put("/usuarios/" + u.id, { activo: !u.activo });
      mostrarAlerta("ok", "Usuario " + (u.activo ? "desactivado" : "activado"));
      await cargar();
    } catch { mostrarAlerta("error", "Error al cambiar estado"); }
  };

  if (cargando || !user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Administracion</p>
            <h1 className="text-xl font-bold text-[#1a1a2e]">Usuarios</h1>
          </div>
          <button onClick={abrirCrear}
            className="bg-[#1b3a6b] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#162f58]">
            + Nuevo Usuario
          </button>
        </header>

        {alerta && (
          <div className={"mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium " +
            (alerta.tipo === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
            {alerta.msg}
          </div>
        )}

        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-sm text-gray-400">Cargando...</div>
            ) : usuarios.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">No hay usuarios registrados</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">DNI</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-[#1b3a6b]">{u.username}</td>
                      <td className="px-4 py-3 text-gray-500">{u.empleado_dni}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                          {ROL_LABEL[u.rol] ?? u.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={"text-xs px-2 py-1 rounded font-medium " + (u.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => abrirEditar(u)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-[#1b3a6b] text-white hover:bg-[#162f58] font-medium">
                            Editar
                          </button>
                          <button onClick={() => abrirPassword(u)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 font-medium">
                            Contrasena
                          </button>
                          <button onClick={() => handleToggleActivo(u)}
                            className={"text-xs px-3 py-1.5 rounded-lg font-medium " + (u.activo ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-600 text-white hover:bg-green-700")}>
                            {u.activo ? "Desactivar" : "Activar"}
                          </button>
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
                {modal === "crear" ? "Nuevo Usuario" : "Editar Usuario"}
              </h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">DNI del Empleado *</label>
                  <input type="text" value={form.empleado_dni} onChange={(e) => setForm({ ...form, empleado_dni: e.target.value })}
                    placeholder="0801-1990-12345"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b3a6b]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Nombre de usuario *</label>
                  <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="j.garcia"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b3a6b]" />
                </div>
                {modal === "crear" && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Contrasena *</label>
                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min. 6 caracteres"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b3a6b]" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Rol *</label>
                  <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b3a6b]">
                    {ROLES.map(r => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
                  </select>
                </div>
                {departamentos.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Departamento</label>
                    <select value={form.departamento_id} onChange={(e) => setForm({ ...form, departamento_id: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b3a6b]">
                      <option value="">Sin departamento</option>
                      {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                    </select>
                  </div>
                )}
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

        {/* Modal Cambiar Contrasena */}
        {modal === "password" && seleccionado && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h2 className="text-lg font-bold text-[#1a1a2e] mb-1">Cambiar Contrasena</h2>
              <p className="text-sm text-gray-500 mb-4">{seleccionado.username}</p>
              <div>
                <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Nueva Contrasena *</label>
                <input type="password" value={nuevaPass} onChange={(e) => setNuevaPass(e.target.value)}
                  placeholder="Min. 6 caracteres"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b3a6b]" />
              </div>
              <div className="flex gap-3 justify-end mt-5">
                <button onClick={cerrarModal}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleCambiarPassword} disabled={guardando}
                  className="text-sm px-5 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 disabled:opacity-60">
                  {guardando ? "Guardando..." : "Cambiar"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}