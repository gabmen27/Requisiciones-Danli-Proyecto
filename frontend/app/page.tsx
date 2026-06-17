"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import { authService } from "./services/api";

interface ConfigPublica {
  municipalidad_nombre: string;
  escudo_path:          string | null;
  logo_path:            string | null;
}

const BASE_URL = "http://localhost:5000";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [config, setConfig]     = useState<ConfigPublica | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/dashboard/publica`)
      .then((r) => r.json())
      .then((d) => setConfig(d))
      .catch(() => {});
  }, []);

  const handleLogin = async () => {
    setError("");
    if (!username || !password) {
      setError("Ingresa tu usuario y contraseña.");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.login(username, password);
      login(res.data.token, {
        id:           res.data.user.id,
        username:     res.data.user.username,
        empleado_dni: res.data.user.empleado_dni,
        rol: res.data.user.rol as "admin" | "compras" | "bienes" | "gerencia" | "alcaldia" | "solicitante",
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Credenciales incorrectas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-2">

      {/* ── Panel izquierdo azul ── */}
      <div className="bg-[#1b3a6b] text-white flex flex-col justify-between p-12">
        <div className="flex flex-col gap-6 mt-16">

          {/* Escudo o logo cuadrado por defecto */}
          {config?.escudo_path ? (
            <img
              src={`${BASE_URL}/${config.escudo_path}`}
              alt="Escudo institucional"
              className="w-24 h-24 object-contain"
            />
          ) : (
            <div className="w-16 h-16 bg-[#c8a020] rounded-xl flex items-center justify-center text-[#1a1a2e] text-3xl font-black">
              R
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold leading-tight">
              {config?.municipalidad_nombre || "Requisiciones Danlí"}
            </h1>
            <p className="text-sm text-white/60 mt-1">
              Municipalidad de Danlí, El Paraíso
            </p>
          </div>

          <div className="w-12 h-1 bg-[#c8a020] rounded-full" />

          <p className="text-sm text-white/80 max-w-xs leading-relaxed">
            Sistema municipal de gestión de compras, solicitudes y órdenes de suministro.
          </p>

          <div className="flex gap-2 flex-wrap">
            {["Compras", "Bienes", "Activos"].map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded border border-white/25 bg-white/10"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Logo municipalidad si existe */}
          {config?.logo_path && (
            <img
              src={`${BASE_URL}/${config.logo_path}`}
              alt="Logo municipalidad"
              className="w-40 h-16 object-contain mt-2"
            />
          )}
        </div>

        <p className="text-xs text-white/40">
          Unidad Municipal de Informática · {new Date().getFullYear()}
        </p>
      </div>

      {/* ── Panel derecho blanco ── */}
      <div className="bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm">

          <div className="text-center mb-6">
  {config?.escudo_path ? (
    <img
      src={`${BASE_URL}/${config.escudo_path}`}
      alt="Escudo"
      className="w-16 h-16 object-contain mx-auto mb-3"
    />
  ) : (
    <div className="w-14 h-14 bg-[#1b3a6b] rounded-xl flex items-center justify-center text-white text-2xl font-black mx-auto mb-3">
      R
    </div>
  )}
  <h2 className="text-2xl font-bold text-[#1a1a2e]">Iniciar sesión</h2>
  <p className="text-sm text-gray-500 mt-1">
    Ingresa tus credenciales institucionales para continuar.
  </p>
</div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
              <span className="font-bold">!</span> {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Usuario
            </label>
            <input
              type="text"
              placeholder="tu.usuario"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1b3a6b] transition-colors"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1b3a6b] transition-colors"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#1b3a6b] hover:bg-[#2a5298] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-lg transition-colors"
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>

          <p className="text-xs text-gray-400 text-center mt-5">
            ¿Problemas para acceder? Contacta al administrador del sistema.
          </p>
        </div>
      </div>

    </div>
  );
}