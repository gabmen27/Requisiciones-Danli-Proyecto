"use client";
import { createContext, useContext, useEffect, useState } from "react";

export interface UsuarioAuth {
  id: number;
  username: string;
  rol:
    | "admin"
    | "compras"
    | "bienes"
    | "gerencia"
    | "alcaldia"
    | "contabilidad"
    | "solicitante";
  empleado_dni: string;
  departamento_id: number | null;
}

interface AuthContextType {
  user: UsuarioAuth | null;
  cargando: boolean;
  login: (token: string, userData: UsuarioAuth) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UsuarioAuth | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const j = localStorage.getItem("user");

        if (j) {
          const usuarioParseado: UsuarioAuth = JSON.parse(j);
          setUser(usuarioParseado);
        }
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } finally {
        setCargando(false);
      }
    };

    cargarSesion();
  }, []);

  const login = (token: string, userData: UsuarioAuth) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return ctx;
}