"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";

interface Requisicion {
  id: number;
  numero: string;
  estado: string;
  fecha_creacion: string;
  descripcion: string;
  total: number;
}

export default function RequisicionesPage() {
  const router = useRouter();
  const [requisiciones, setRequisiciones] = useState<Requisicion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ descripcion:"", departamento_id:"" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchRequisiciones = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) { router.replace("/"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/requisiciones", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setRequisiciones(Array.isArray(data) ? data : data.data || []);
    } catch { setError("Error al cargar requisiciones."); }
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchRequisiciones(); }, [fetchRequisiciones]);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    const t = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:4000/api/requisiciones", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.message || "Error."); return; }
      setSuccess("Requisición creada.");
      setShowForm(false);
      setForm({ descripcion:"", departamento_id:"" });
      fetchRequisiciones();
    } catch { setError("Error de conexión."); }
  };

  const estadoColor: Record<string,string> = {
    borrador:"mod-badge--gray", enviada:"mod-badge--yellow",
    aprobada:"mod-badge--green", rechazada:"mod-badge--red",
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
            <button key={item.id} className={`dash-nav-item${item.id==="requisiciones"?" dash-nav-item--active":""}`}
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
          <div><p className="dash-header-eyebrow">GESTIÓN</p><h1 className="dash-header-title">Requisiciones</h1></div>
          <button className="mod-btn-primary" onClick={() => setShowForm(true)}>+ Nueva Requisición</button>
        </header>
        {error && <div className="mod-alert mod-alert--error">{error}</div>}
        {success && <div className="mod-alert mod-alert--success">{success}</div>}
        {showForm && (
          <div className="mod-form-card">
            <h3 className="mod-form-title">Nueva Requisición</h3>
            <div className="mod-form-grid">
              <div className="login-field">
                <label className="login-label">ID Departamento</label>
                <input className="login-input" type="number" value={form.departamento_id} onChange={e => setForm({...form,departamento_id:e.target.value})} />
              </div>
              <div className="login-field" style={{gridColumn:"1/-1"}}>
                <label className="login-label">Descripción</label>
                <textarea className="login-input mod-textarea" value={form.descripcion} onChange={e => setForm({...form,descripcion:e.target.value})} />
              </div>
            </div>
            <div className="mod-form-actions">
              <button className="mod-btn-primary" onClick={handleSubmit}>Guardar</button>
              <button className="mod-btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}
        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead><tr>{["#","Número","Estado","Fecha","Total","Descripción"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="mod-empty">Cargando...</td></tr>
              : requisiciones.length === 0 ? <tr><td colSpan={6} className="mod-empty">No hay requisiciones registradas.</td></tr>
              : requisiciones.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td><td>{r.numero}</td>
                  <td><span className={`mod-badge ${estadoColor[r.estado]||"mod-badge--gray"}`}>{r.estado}</span></td>
                  <td>{r.fecha_creacion ? new Date(r.fecha_creacion).toLocaleDateString("es-HN") : "—"}</td>
                  <td>L. {Number(r.total||0).toFixed(2)}</td>
                  <td>{r.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
