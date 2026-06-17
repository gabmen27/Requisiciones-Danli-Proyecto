"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const MENU = [
  {
    seccion: "PRINCIPAL",
    items: [
      { id: "dashboard",     label: "Inicio",           ruta: "/dashboard",               roles: ["admin","compras","bienes","gerencia","alcaldia","solicitante"] },
    ]
  },
  {
    seccion: "COMPRAS",
    items: [
      { id: "proveedores",   label: "Proveedores",       ruta: "/dashboard/proveedores",   roles: ["admin","compras"] },
      { id: "solicitudes",   label: "Solicitudes",       ruta: "/dashboard/solicitudes",   roles: ["admin","compras","bienes","solicitante"] },
      { id: "requisiciones", label: "Requisiciones",     ruta: "/dashboard/requisiciones", roles: ["admin","compras","bienes","gerencia","alcaldia","solicitante"] },
      { id: "ordenes",       label: "Órdenes de Compra", ruta: "/dashboard/ordenes",       roles: ["admin","compras","gerencia","alcaldia"] },
    ]
  },
  {
    seccion: "BIENES",
    items: [
      { id: "kardex",        label: "Kardex",            ruta: "/dashboard/kardex",        roles: ["admin","bienes"] },
      { id: "activos",       label: "Activos Fijos",     ruta: "/dashboard/activos",       roles: ["admin","bienes"] },
    ]
  },
  {
    seccion: "ADMINISTRACIÓN",
    items: [
      { id: "usuarios",      label: "Usuarios",          ruta: "/dashboard/usuarios",      roles: ["admin"] },
      { id: "configuracion", label: "Configuración",     ruta: "/dashboard/configuracion", roles: ["admin"] },
    ]
  },
];

const ROL_LABEL: Record<string, string> = {
  admin: "Administrador", compras: "Depto. Compras",
  bienes: "Depto. Bienes", gerencia: "Gerencia",
  alcaldia: "Alcaldía", solicitante: "Solicitante",
};

export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [abierto, setAbierto] = useState(true);

  const handleLogout = () => { logout(); router.replace("/"); };

  return (
    <aside className={`${abierto ? "w-56" : "w-14"} h-screen bg-[#1b3a6b] text-white flex flex-col flex-shrink-0 sticky top-0 transition-all duration-200`}>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-white/10 flex-shrink-0">
        <button
          onClick={() => setAbierto(!abierto)}
          className="w-8 h-8 flex flex-col items-center justify-center gap-1 flex-shrink-0 hover:bg-white/10 rounded-lg transition-colors"
        >
          <span className="block w-4 h-0.5 bg-white/80" />
          <span className="block w-4 h-0.5 bg-white/80" />
          <span className="block w-4 h-0.5 bg-white/80" />
        </button>
        {abierto && (
          <div>
            <p className="text-sm font-bold leading-tight whitespace-nowrap">Requisiciones</p>
            <p className="text-xs text-white/50">Danlí</p>
          </div>
        )}
      </div>

      {/* Nav — scroll solo aquí */}
      <nav className="px-2 py-3 flex flex-col gap-3 overflow-y-auto flex-1">
        {MENU.map((seccion) => {
          const itemsVisibles = seccion.items.filter(
            (item) => user && item.roles.includes(user.rol)
          );
          if (itemsVisibles.length === 0) return null;
          return (
            <div key={seccion.seccion}>
              {abierto && (
                <p className="text-[9px] font-bold tracking-widest text-white/40 px-2 pb-1 uppercase">
                  {seccion.seccion}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {itemsVisibles.map((item) => {
                  const activo = pathname === item.ruta;
                  return (
                    <button
                      key={item.id}
                      onClick={() => router.push(item.ruta)}
                      title={!abierto ? item.label : undefined}
                      className={`w-full text-left px-2 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                        activo ? "bg-white/15 text-white font-semibold" : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activo ? "bg-[#c8a020]" : "bg-white/30"}`} />
                      {abierto && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer — siempre visible abajo */}
      <div className="px-2 pb-3 border-t border-white/10 pt-3 flex-shrink-0">
        {user && abierto && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-7 h-7 bg-[#c8a020] rounded-full flex items-center justify-center text-[#1a1a2e] font-bold text-xs flex-shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate">{user.username}</p>
              <p className="text-[10px] text-white/50">{ROL_LABEL[user.rol] || user.rol}</p>
            </div>
          </div>
        )}
        {user && !abierto && (
          <div className="flex justify-center mb-2">
            <div className="w-7 h-7 bg-[#c8a020] rounded-full flex items-center justify-center text-[#1a1a2e] font-bold text-xs">
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full text-xs text-white/70 hover:text-white border border-white/15 hover:bg-white/10 rounded-lg py-1.5 transition-colors"
        >
          {abierto ? "⏻ Cerrar sesión" : "⏻"}
        </button>
      </div>
    </aside>
  );
}