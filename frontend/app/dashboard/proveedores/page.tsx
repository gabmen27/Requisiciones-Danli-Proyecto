"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";

interface Proveedor {
  id: number;
  nombre: string;
  rtn: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  activo: boolean;
}

export default function ProveedoresPage() {
  const router = useRouter();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [form, setForm] = useState({ nombre:"", rtn:"", contacto:"", telefono:"", email:"", direccion:"" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProveedores = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) { router.replace("/"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/proveedores", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setProveedores(Array.isArray(data) ? data : data.data || []);
    } catch { setError("Error al cargar proveedores."); }
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchProveedores(); }, [fetchProveedores]);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    const t = localStorage.getItem("token");
    const method = editando ? "PUT" : "POST";
    const url = editando ? `http://localhost:4000/api/proveedores/${editando.id}` : "http://localhost:4000/api/proveedores";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.message || "Error al guardar."); return; }
      setSuccess(editando ? "Proveedor actualizado." : "Proveedor creado.");
      setShowForm(false); setEditando(null);
      setForm({ nombre:"", rtn:"", contacto:"", telefono:"", email:"", direccion:"" });
      fetchProveedores();
    } catch { setError("Error de conexión."); }
  };

  const handleEdit = (p: Proveedor) => {
    setEditando(p);
    setForm({ nombre:p.nombre, rtn:p.rtn, contacto:p.contacto, telefono:p.telefono, email:p.email, direccion:p.direccion });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    const t = localStorage.getItem("token");
    await fetch(`http://localhost:4000/api/proveedores/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${t}` },
    });
    fetchProveedores();
  };

  const menuItems = [
    {id:"dashboard",label:"Inicio",icon:""},
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
            <button key={item.id} className={`dash-nav-item${item.id==="proveedores"?" dash-nav-item--active":""}`}
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
          <div><p className="dash-header-eyebrow">GESTIÓN</p><h1 className="dash-header-title">Proveedores</h1></div>
          <button className="mod-btn-primary" onClick={() => { setShowForm(true); setEditando(null); setForm({ nombre:"",rtn:"",contacto:"",telefono:"",email:"",direccion:"" }); }}>+ Nuevo Proveedor</button>
        </header>
        {error && <div className="mod-alert mod-alert--error">{error}</div>}
        {success && <div className="mod-alert mod-alert--success">{success}</div>}
        {showForm && (
          <div className="mod-form-card">
            <h3 className="mod-form-title">{editando ? "Editar Proveedor" : "Nuevo Proveedor"}</h3>
            <div className="mod-form-grid">
              {[{key:"nombre",label:"Nombre"},{key:"rtn",label:"RTN"},{key:"contacto",label:"Contacto"},{key:"telefono",label:"Teléfono"},{key:"email",label:"Email"},{key:"direccion",label:"Dirección"}].map(f => (
                <div key={f.key} className="login-field">
                  <label className="login-label">{f.label}</label>
                  <input className="login-input" value={(form as Record<string,string>)[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})} />
                </div>
              ))}
            </div>
            <div className="mod-form-actions">
              <button className="mod-btn-primary" onClick={handleSubmit}>{editando ? "Actualizar" : "Guardar"}</button>
              <button className="mod-btn-secondary" onClick={() => { setShowForm(false); setEditando(null); }}>Cancelar</button>
            </div>
          </div>
        )}
        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead><tr>{["Nombre","RTN","Contacto","Teléfono","Email","Estado","Acciones"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="mod-empty">Cargando...</td></tr>
              : proveedores.length === 0 ? <tr><td colSpan={7} className="mod-empty">No hay proveedores registrados.</td></tr>
              : proveedores.map(p => (
                <tr key={p.id}>
                  <td>{p.nombre}</td><td>{p.rtn}</td><td>{p.contacto}</td><td>{p.telefono}</td><td>{p.email}</td>
                  <td><span className={`mod-badge ${p.activo?"mod-badge--green":"mod-badge--red"}`}>{p.activo?"Activo":"Inactivo"}</span></td>
                  <td className="mod-actions">
                    <button className="mod-btn-edit" onClick={() => handleEdit(p)}>Editar</button>
                    <button className="mod-btn-delete" onClick={() => handleDelete(p.id)}>Eliminar</button>
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
