"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";

interface Solicitud {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  fecha_solicitud: string;
  descripcion: string;
  proveedor_id: number;
}

export default function SolicitudesPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo:"cotizacion", descripcion:"", proveedor_id:"" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSolicitudes = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) { router.replace("/"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/solicitudes", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setSolicitudes(Array.isArray(data) ? data : data.data || []);
    } catch { setError("Error al cargar solicitudes."); }
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchSolicitudes(); }, [fetchSolicitudes]);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    const t = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:4000/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.message || "Error al guardar."); return; }
      setSuccess("Solicitud creada exitosamente.");
      setShowForm(false);
      setForm({ tipo:"cotizacion", descripcion:"", proveedor_id:"" });
      fetchSolicitudes();
    } catch { setError("Error de conexión."); }
  };

  const estadoColor: Record<string,string> = {
    pendiente:"mod-badge--yellow", respondida:"mod-badge--green", cancelada:"mod-badge--red",
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
            <button key={item.id} className={`dash-nav-item${item.id==="solicitudes"?" dash-nav-item--active":""}`}
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
          <div><p className="dash-header-eyebrow">GESTIÓN</p><h1 className="dash-header-title">Solicitudes</h1></div>
          <button className="mod-btn-primary" onClick={() => setShowForm(true)}>+ Nueva Solicitud</button>
        </header>
        {error && <div className="mod-alert mod-alert--error">{error}</div>}
        {success && <div className="mod-alert mod-alert--success">{success}</div>}
        {showForm && (
          <div className="mod-form-card">
            <h3 className="mod-form-title">Nueva Solicitud</h3>
            <div className="mod-form-grid">
              <div className="login-field">
                <label className="login-label">Tipo</label>
                <select className="login-input" value={form.tipo} onChange={e => setForm({...form,tipo:e.target.value})}>
                  <option value="cotizacion">Cotización</option>
                  <option value="lista_precios">Lista de Precios</option>
                </select>
              </div>
              <div className="login-field">
                <label className="login-label">ID Proveedor</label>
                <input className="login-input" type="number" value={form.proveedor_id} onChange={e => setForm({...form,proveedor_id:e.target.value})} />
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
            <thead><tr>{["#","Número","Tipo","Estado","Fecha","Descripción"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="mod-empty">Cargando...</td></tr>
              : solicitudes.length === 0 ? <tr><td colSpan={6} className="mod-empty">No hay solicitudes registradas.</td></tr>
              : solicitudes.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td><td>{s.numero}</td><td>{s.tipo}</td>
                  <td><span className={`mod-badge ${estadoColor[s.estado]||"mod-badge--yellow"}`}>{s.estado}</span></td>
                  <td>{s.fecha_solicitud ? new Date(s.fecha_solicitud).toLocaleDateString("es-HN") : "—"}</td>
                  <td>{s.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
