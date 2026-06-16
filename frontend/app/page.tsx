"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    setError("");
    if (!username || !password) {
      setError("Ingresa tu usuario y contraseña.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Credenciales incorrectas.");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      }
    } catch {
      setError("No se pudo conectar al servidor. Verifica que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Panel izquierdo */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo">R</div>
          <h1 className="login-brand-title">Requisiciones<br />Danlí</h1>
          <p className="login-brand-sub">
            Sistema municipal de gestión de compras,
            solicitudes y órdenes de suministro.
          </p>
        </div>
        <div className="login-seal">
          <div className="login-seal-circle">
            <span>MUNICIPALIDAD</span>
            <strong>DANLÍ</strong>
            <span>HONDURAS</span>
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="login-right">
        <div className="login-card">
          <p className="login-eyebrow">ACCESO AL SISTEMA</p>
          <h2 className="login-title">Iniciar sesión</h2>
          <p className="login-subtitle">
            Ingresa tus credenciales institucionales para continuar.
          </p>

          <div className="login-field">
            <label className="login-label">Usuario</label>
            <input
              className="login-input"
              type="text"
              placeholder="Ej. admin"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleLogin()}
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label className="login-label">Contraseña</label>
            <input
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleLogin()}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error">
              <span className="login-error-icon">!</span>
              {error}
            </div>
          )}

          <button
            className={`login-btn${loading ? " login-btn--disabled" : ""}`}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>

          <p className="login-hint">
            ¿Problemas para acceder? Contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
