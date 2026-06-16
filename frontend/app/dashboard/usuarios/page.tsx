"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";

interface Usuario {
  id: string;
  username: string;
  rol: string;
  activo: boolean;
  empleado_dni: string;
}

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ username:"", password:"", rol:"solicitante", empleado_dni:"" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsuarios = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) { router.replace("/"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/usuarios", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : data.data || []);
    } catch { setError("Error al cargar usuarios."); }
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    const t = localStorage.getItem("token");
    const method = editando ? "PUT" : "POST";
    const url = editando ? `http://localhost:4000/api/usuarios/${editando.id}` : "http://localhost:4000/api/usuarios";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.message || "Error."); return; }
      setSuccess(editando ? "Usuario actualizado." : "Usuario creado.");
      setShowForm(false); setEditando(null);
      setForm({ username:"", password:"", rol:"solicitante", empleado_dni:"" });
      fetchUsuarios();
    } catch { setError("Error de conexión."); }
  };

  const handleEdit = (u: Usuario) => {
    setEditando(u);
    setForm({ username:u.username, password:"", rol:u.rol, empleado_dni:u.empleado_dni });
    setShowForm(true);
  };

  const roles = ["admin","compras","bienes","gerencia","alcaldia","solicitante"];

  const menuItems = [
    {id:"dashboard",label:"Inicio",icon:"⊞"},
    {id:"proveedores",label:"Proveedores",icon:""},
    {id:"solicitudes",label:"Solicitudes",icon:""},
    {id:"requisiciones",label:"Requisiciones",icon:""},
    {id:"ordenes",label:"Órdenes de Compra",icon:""},
    {id:"usuarios",label:"Usuarios",icon:""},
  ];

  return (
    <div className="mod-layout">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <div className="dash-sidebar-logo">R</div>
          <div><p className="dash-sidebar-title">Requisiciones</p><p className="dash-sidebar-sub">Danlí</p></div>
        </div>
        <nav className="dash-nav">
          <p className="dash-nav-section">MÓDULOS</p>
          {menuItems.map(item => (
            <button key={item.id} className={`dash-nav-item${item.id==="usuarios"?" dash-nav-item--active":""}`}
              onClick={() => router.push(item.id==="dashboard"?"/dashboard":`/dashboard/${item.id}`)}>
              <span className="dash-nav-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="dash-sidebar-footer">
          <button className="dash-logout-btn" onClick={() => { localStorage.clear(); router.replace("/"); }}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="dash-main">
        <header className="dash-header">
          <div><p className="dash-header-eyebrow">GESTIÓN</p><h1 className="dash-header-title">Usuarios</h1></div>
          <button className="mod-btn-primary" onClick={() => { setShowForm(true); setEditando(null); setForm({ username:"",password:"",rol:"solicitante",empleado_dni:"" }); }}>+ Nuevo Usuario</button>
        </header>
        {error && <div className="mod-alert mod-alert--error">{error}</div>}
        {success && <div className="mod-alert mod-alert--success">{success}</div>}
        {showForm && (
          <div className="mod-form-card">
            <h3 className="mod-form-title">{editando ? "Editar Usuario" : "Nuevo Usuario"}</h3>
            <div className="mod-form-grid">
              <div className="login-field">
                <label className="login-label">Username</label>
                <input className="login-input" value={form.username} onChange={e => setForm({...form,username:e.target.value})} />
              </div>
              <div className="login-field">
                <label className="login-label">Contraseña {editando && "(dejar vacío para no cambiar)"}</label>
                <input className="login-input" type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} />
              </div>
              <div className="login-field">
                <label className="login-label">Rol</label>
                <select className="login-input" value={form.rol} onChange={e => setForm({...form,rol:e.target.value})}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="login-field">
                <label className="login-label">DNI Empleado</label>
                <input className="login-input" value={form.empleado_dni} onChange={e => setForm({...form,empleado_dni:e.target.value})} />
              </div>
            </div>
            <div className="mod-form-actions">
              <button className="mod-btn-primary" onClick={handleSubmit}>{editando ? "Actualizar" : "Guardar"}</button>
              <button className="mod-btn-secondary" onClick={() => { setShowForm(false); setEditando(null); }}>Cancelar</button>
            </div>
          </div>
        )}
        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead><tr>{["DNI","Username","Rol","Estado","Acciones"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="mod-empty">Cargando...</td></tr>
              : usuarios.length === 0 ? <tr><td colSpan={5} className="mod-empty">No hay usuarios.</td></tr>
              : usuarios.map(u => (
                <tr key={u.id}>
                  <td>{u.empleado_dni}</td><td>{u.username}</td>
                  <td><span className="mod-badge mod-badge--blue">{u.rol}</span></td>
                  <td><span className={`mod-badge ${u.activo?"mod-badge--green":"mod-badge--red"}`}>{u.activo?"Activo":"Inactivo"}</span></td>
                  <td className="mod-actions">
                    <button className="mod-btn-edit" onClick={() => handleEdit(u)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
