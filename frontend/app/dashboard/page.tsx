"use client";

import { useRouter } from "next/navigation";
import { use, cache } from "react";

// Leemos localStorage FUERA de cualquier hook
function getStoredUser() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  if (!stored || !token) return null;
  try { return JSON.parse(stored); } catch { return null; }
}

export default function DashboardPage() {
  const router = useRouter();
  const user = getStoredUser();

  if (!user) {
    router.replace("/");
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/");
  };

  const menuItems = [
    { id: "dashboard", label: "Inicio", icon: "⊞" },
    { id: "proveedores", label: "Proveedores", icon: "" },
    { id: "solicitudes", label: "Solicitudes", icon: "" },
    { id: "requisiciones", label: "Requisiciones", icon: "" },
    { id: "ordenes", label: "Órdenes de Compra", icon: "" },
    { id: "usuarios", label: "Usuarios", icon: "" },
  ];

  const cards = [
    { label: "Proveedores", value: "—", desc: "Registrados en el sistema", color: "#1b3a6b", icon: "" },
    { label: "Solicitudes", value: "—", desc: "Activas este mes", color: "#c8a020", icon: "" },
    { label: "Requisiciones", value: "—", desc: "En proceso de aprobación", color: "#2e7d32", icon: "" },
    { label: "Órdenes de Compra", value: "—", desc: "Generadas este mes", color: "#6a1b9a", icon: "" },
  ];

  const rolLabel: Record<string, string> = {
    admin: "Administrador",
    compras: "Depto. Compras",
    bienes: "Depto. Bienes",
    gerencia: "Gerencia",
    alcaldia: "Alcaldía",
    solicitante: "Solicitante",
  };

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <div className="dash-sidebar-logo">R</div>
          <div>
            <p className="dash-sidebar-title">Requisiciones</p>
            <p className="dash-sidebar-sub">Danlí</p>
          </div>
        </div>

        <nav className="dash-nav">
          <p className="dash-nav-section">MÓDULOS</p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`dash-nav-item${item.id === "dashboard" ? " dash-nav-item--active" : ""}`}
              onClick={() => router.push(item.id === "dashboard" ? "/dashboard" : `/dashboard/${item.id}`)}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-user-info">
            <div className="dash-user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="dash-user-name">{user.username}</p>
              <p className="dash-user-role">{rolLabel[user.rol] || user.rol}</p>
            </div>
          </div>
          <button className="dash-logout-btn" onClick={handleLogout}>
            ⏻ Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <header className="dash-header">
          <div>
            <p className="dash-header-eyebrow">PANEL DE CONTROL</p>
            <h1 className="dash-header-title">Bienvenido, {user.username}</h1>
          </div>
          <div className="dash-header-date">
            {new Date().toLocaleDateString("es-HN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </header>

        <section className="dash-cards">
          {cards.map((card) => (
            <div key={card.label} className="dash-card" style={{ borderTopColor: card.color }}>
              <div className="dash-card-top">
                <span className="dash-card-icon">{card.icon}</span>
                <span className="dash-card-value" style={{ color: card.color }}>{card.value}</span>
              </div>
              <p className="dash-card-label">{card.label}</p>
              <p className="dash-card-desc">{card.desc}</p>
            </div>
          ))}
        </section>

        <section className="dash-quick">
          <h2 className="dash-section-title">Accesos rápidos</h2>
          <div className="dash-quick-grid">
            {menuItems.slice(1).map((item) => (
              <button
                key={item.id}
                className="dash-quick-btn"
                onClick={() => router.push(`/dashboard/${item.id}`)}
              >
                <span className="dash-quick-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <footer className="dash-footer">
          <p>Municipalidad de Danlí — Sistema de Gestión de Requisiciones y Compras</p>
          <p>El Paraíso, Honduras · {new Date().getFullYear()}</p>
        </footer>
      </main>
    </div>
  );
}
