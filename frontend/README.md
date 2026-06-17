**Por qué:** Multer necesita una carpeta de destino. Se crea automáticamente si no existe gracias a `fs.mkdirSync(..., { recursive: true })`, pero se recomienda crearla manualmente para que Git la reconozca. Agregar `uploads/logos/*.png` al `.gitignore` para no subir imágenes al repositorio.

---

---

## FRONTEND

### Archivos nuevos

#### `app/context/AuthContext.tsx`
**Por qué se creó:** El proyecto necesita saber en cualquier página si hay un usuario autenticado y cuál es su rol, sin pasar esa información manualmente entre componentes. Se implementó el patrón Context + Provider, igual al ejercicio del carrito de clase.

Guarda en `localStorage` el token JWT y el objeto `user` para que la sesión persista al recargar la página. Exporta:
- `AuthProvider` — envuelve toda la app en `layout.tsx`
- `useAuth()` — hook que cualquier página puede usar para leer `user`, `token`, `login()` y `logout()`

#### `app/provider/AuthProvider.tsx`
**Por qué se creó:** Re-exporta `AuthProvider` desde el contexto para respetar la estructura del proyecto (carpeta `provider/` separada de `context/`), siguiendo el mismo patrón del instructor.

#### `app/services/api.ts`
**Por qué se creó:** Centraliza todas las llamadas HTTP al backend usando **axios**. La ventaja sobre `fetch` es que permite interceptores:
- **Interceptor de request:** añade automáticamente el header `Authorization: Bearer <token>` en cada petición, eliminando la necesidad de pasarlo manualmente
- **Interceptor de response:** si el backend responde 401 (token expirado o inválido), limpia la sesión y redirige al login automáticamente

#### `app/component/Sidebar.tsx`
**Por qué se creó:** El sidebar es idéntico en todas las páginas del dashboard. Crearlo como componente reutilizable evita duplicar código. Características:
- Menú organizado en secciones (PRINCIPAL, COMPRAS, BIENES, ADMINISTRACIÓN)
- Control de acceso por rol — cada item define qué roles pueden verlo, el sidebar filtra automáticamente según el usuario autenticado
- Botón hamburguesa para colapsar/expandir con animación CSS
- Estado activo resaltado usando `usePathname()` de Next.js
- Usuario y botón de cerrar sesión siempre visibles al fondo

#### `app/(general)/dashboard/page.tsx`
**Por qué se creó:** Panel de control principal. Muestra:
- 4 tarjetas con conteos en tiempo real desde `/api/dashboard/stats`
- 3 gráficas con Chart.js (barras, dona, línea)
- Logo y escudo institucional desde la configuración
- Nombre del usuario y su rol

Las gráficas usan `useRef` para guardar las instancias de Chart.js y destruirlas antes de recrearlas, evitando el error "canvas already in use" al re-renderizar.

#### `app/(general)/dashboard/configuracion/page.tsx`
**Por qué se creó:** Permite al administrador gestionar todos los parámetros del sistema desde la interfaz sin tocar la base de datos directamente. Organizado en secciones:
- **Identidad Visual** — subida de escudo y logo con preview inmediato
- **Datos Institucionales** — nombre, dirección, teléfono, moneda
- **Autoridades** — alcalde, gerente, jefes de compras y bienes
- **Numeración** — prefijos y secuencias de requisiciones, OC, solicitudes, inventario, traslados
- **Parámetros** — ISV, días de alerta de stock, filas base, versión del sistema, pie de documento

La subida de imágenes usa `useRef` en inputs `type="file"` ocultos, activados por botones visibles. El timestamp `imgTs` se actualiza al subir una imagen para forzar al navegador a recargar la imagen y romper el caché.

---

### Archivos modificados

#### `app/page.tsx` (Login)
**Qué cambió:**
- Se integró `useAuth` para usar `login()` del contexto en lugar de escribir en localStorage manualmente
- Se integró `authService` de axios en lugar de `fetch` directo
- Se agregó carga de configuración pública (`/api/dashboard/publica`) para mostrar el escudo y nombre de la municipalidad antes de iniciar sesión
- Se reemplazó el sello circular manual por la imagen real del escudo
- Se muestra el escudo también en el panel derecho del formulario
- Se usa `<img>` nativo en lugar de `<Image>` de Next.js para evitar restricciones de dominio

#### `app/layout.tsx`
**Qué cambió:** Se envolvió el `{children}` con `<AuthProvider>` para que el contexto de autenticación esté disponible en toda la aplicación.

#### `next.config.ts`
**Qué cambió:** Se agregó `images.remotePatterns` para permitir que Next.js cargue imágenes desde `http://localhost:5000`. Sin esto, el componente `<Image>` de Next.js bloquea dominios externos no declarados.

---

### Dependencias nuevas instaladas (frontend)

```bash
npm install axios
npm install chart.js
```

**axios** — cliente HTTP con interceptores automáticos para el token JWT  
**chart.js** — librería de gráficas para las estadísticas del dashboard

---

## Flujo general del sistema




Usuario → Login (/)

→ POST /api/auth/login

→ { token, user } guardado en localStorage vía AuthContext

→ Redirige a /dashboard
Dashboard (/dashboard)

→ GET /api/dashboard/stats    (estadísticas + gráficas)

→ GET /api/configuracion      (logos institucionales)

→ Sidebar filtra menú según user.rol
Configuración (/dashboard/configuracion)

→ GET /api/configuracion      (carga datos actuales)

→ PUT /api/configuracion      (guarda campos de texto)

→ POST /api/configuracion/upload-logo  (sube imagen → guarda ruta en BD)




---

## Estructura de carpetas resultante


frontend/app/

├── page.tsx                          ← Login

├── layout.tsx                        ← AuthProvider global

├── context/

│   └── AuthContext.tsx               ← Estado global de sesión

├── provider/

│   └── AuthProvider.tsx              ← Re-exporta AuthProvider

├── services/

│   └── api.ts                        ← Axios centralizado

├── component/

│   └── Sidebar.tsx                   ← Navegación reutilizable

└── (general)/

└── dashboard/

├── page.tsx                  ← Dashboard con gráficas

└── configuracion/

└── page.tsx              ← Configuración del sistema
backend/src/

├── controllers/

│   └── dashboardController.ts        ← Stats + config pública

├── routes/

│   ├── dashboardRoutes.ts            ← /api/dashboard/*

│   └── configuracionRoutes.ts        ← /api/configuracion/*

└── uploads/

└── logos/

├── escudo.png                ← Escudo institucional

└── logo.png                  ← Logo municipalidad