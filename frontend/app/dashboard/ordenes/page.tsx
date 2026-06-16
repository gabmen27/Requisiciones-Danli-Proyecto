"use client";
// ============================================
// PÁGINA: Órdenes de Compra
// RUTA: /dashboard/ordenes
// ============================================
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";

interface Orden {
  id: number;
  numero: string;
  estado: string;
  fecha_emision: string;
  total: number;
  proveedor_id: number;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function OrdenesPage() {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = getToken();

  const fetchOrdenes = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) { router.replace("/"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/ordenes-compra", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setOrdenes(Array.isArray(data) ? data : data.data || []);
    } catch { setError("Error al cargar órdenes."); }
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchOrdenes(); }, [fetchOrdenes]);

  const estadoColor: Record<string, string> = {
    pendiente: "mod-badge--yellow",
    entregada: "mod-badge--green",
    cancelada: "mod-badge--red",
  };

  const menuItems = [
    {id:"dashboard",label:"Inicio",icon:"⊞"},
    {id:"proveedores",label:"Proveedores",icon:"🏢"},
    {id:"solicitudes",label:"Solicitudes",icon:"📋"},
    {id:"requisiciones",label:"Requisiciones",icon:"📄"},
    {id:"ordenes",label:"Órdenes de Compra",icon:"🛒"},
    {id:"usuarios",label:"Usuarios",icon:"👤"},
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
            <button key={item.id} className={`dash-nav-item${item.id==="ordenes"?" dash-nav-item--active":""}`}
              onClick={() => router.push(item.id==="dashboard"?"/dashboard":`/dashboard/${item.id}`)}>
              <span className="dash-nav-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="dash-sidebar-footer">
          <button className="dash-logout-btn" onClick={() => { localStorage.clear(); router.replace("/"); }}>⏻ Cerrar sesión</button>
        </div>
      </aside>
      <main className="dash-main">
        <header className="dash-header">
          <div><p className="dash-header-eyebrow">GESTIÓN</p><h1 className="dash-header-title">🛒 Órdenes de Compra</h1></div>
        </header>
        {error && <div className="mod-alert mod-alert--error">{error}</div>}
        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead><tr>{["#","Número","Estado","Fecha Emisión","Total","Proveedor ID"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="mod-empty">Cargando...</td></tr>
              : ordenes.length === 0 ? <tr><td colSpan={6} className="mod-empty">No hay órdenes de compra registradas.</td></tr>
              : ordenes.map(o => (
                <tr key={o.id}>
                  <td>{o.id}</td><td>{o.numero}</td>
                  <td><span className={`mod-badge ${estadoColor[o.estado] || "mod-badge--yellow"}`}>{o.estado}</span></td>
                  <td>{o.fecha_emision ? new Date(o.fecha_emision).toLocaleDateString("es-HN") : "—"}</td>
                  <td>L. {Number(o.total || 0).toFixed(2)}</td>
                  <td>{o.proveedor_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
