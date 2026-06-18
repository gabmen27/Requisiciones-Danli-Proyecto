"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Modelo exacto que devuelve tu backend en el campo "user"
export interface UsuarioAuth {
  id: number;
  username: string;
  rol: "admin" | "compras" | "bienes" | "gerencia" | "alcaldia" | "solicitante";
  empleado_dni: string;
}

interface AuthContextType {
  user: UsuarioAuth | null;
  token: string | null;
  login: (token: string, user: UsuarioAuth) => void;
  logout: () => void;
  cargando: boolean;
}

// Creamos el contexto — valor undefined para detectar si se usa fuera del Provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<UsuarioAuth | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [cargando, setCargando] = useState(true); // evita flash de redirect al cargar

  // Al montar: recuperamos sesión guardada en localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser  = localStorage.getItem("user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        // Si el JSON está corrupto, limpiamos
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setCargando(false);
  }, []);

  const login = (nuevoToken: string, nuevoUser: UsuarioAuth) => {
    setToken(nuevoToken);
    setUser(nuevoUser);
    localStorage.setItem("token", nuevoToken);
    localStorage.setItem("user", JSON.stringify(nuevoUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado — mismo patrón que tus ejercicios de clase
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
