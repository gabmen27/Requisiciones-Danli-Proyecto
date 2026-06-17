// Instancia central de axios — todas las llamadas al backend pasan por aquí
// El interceptor añade el token JWT automáticamente en cada petición
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

// INTERCEPTOR REQUEST: lee el token de localStorage y lo adjunta al header
// Así no tienes que escribir Authorization: Bearer ... en cada llamada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// INTERCEPTOR RESPONSE: si el token expiró (401), limpia sesión y redirige al login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── SERVICIOS DE AUTH ────────────────────────────────────────────────────────
// Respuesta exacta de tu authController: { token, user: { id, username, rol, empleado_dni } }
export const authService = {
  login: (username: string, password: string) =>
    api.post<{ token: string; user: { id: number; username: string; rol: string; empleado_dni: string } }>(
      "/auth/login",
      { username, password }
    ),
};
