# README — Requisiciones Danlí
## Cambios y archivos nuevos · Frontend + Backend

---

## BACKEND

### Archivos nuevos

#### `src/controllers/dashboardController.ts`
**Por qué se creó:** El dashboard necesita estadísticas en tiempo real (conteos de proveedores, solicitudes, requisiciones y órdenes) y tres conjuntos de datos para las gráficas (requisiciones por estado, órdenes por mes, solicitudes por tipo). Se centralizó aquí para mantener la separación de responsabilidades del patrón MVC que ya usa el proyecto.

Exporta dos funciones:
- `getStats` — requiere autenticación, devuelve todos los números del dashboard
- `getConfiguracionPublica` — **sin autenticación**, devuelve solo nombre, escudo y logo para que el login pueda mostrarlos antes de que el usuario inicie sesión

#### `src/routes/dashboardRoutes.ts`
**Por qué se creó:** Registra las dos rutas del dashboard:
- `GET /api/dashboard/stats` — protegida con `authMiddleware`
- `GET /api/dashboard/publica` — pública, sin token, usada por el login

#### `src/routes/configuracionRoutes.ts`
**Por qué se creó:** La tabla `configuracion` tiene datos institucionales (autoridades, prefijos de numeración, logos, ISV) que el administrador necesita editar desde la interfaz. Se creó un CRUD específico para esta tabla con tres endpoints:
- `GET /api/configuracion` — lee toda la configuración (con auth)
- `PUT /api/configuracion` — actualiza todos los campos de texto (solo admin)
- `POST /api/configuracion/upload-logo` — sube escudo o logo al servidor y guarda la ruta en BD (solo admin)

Usa **multer** para el manejo de archivos. El flujo es: recibe el archivo → lo guarda con nombre temporal → lo renombra según el campo (`escudo.png` o `logo.png`) → guarda la ruta relativa en la BD. Así el frontend puede construir la URL completa con `http://localhost:5000/uploads/logos/escudo.png`.

---

### Archivos modificados

#### `src/app.ts`
Se agregaron cuatro líneas:

```typescript
import path from 'path';
import dashboardRoutes from './routes/dashboardRoutes';
import configuracionRoutes from './routes/configuracionRoutes';

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/configuracion', configuracionRoutes);
```

**Por qué:** 
- `express.static` sirve las imágenes subidas (logos, escudos) como archivos estáticos accesibles desde el frontend
- Las dos rutas nuevas registran los módulos de dashboard y configuración
- Se configuró CORS con `origin: 'http://localhost:3000'` y `helmet` con `crossOriginResourcePolicy: 'cross-origin'` para permitir que el frontend cargue imágenes desde el backend sin errores de CORS

---

### Dependencias nuevas instaladas (backend)

```bash
npm install multer
npm install --save-dev @types/multer
```

**Por qué:** Multer maneja la recepción de archivos en formularios `multipart/form-data`, que es el formato estándar para subir imágenes desde un navegador.

---

### Carpeta nueva



API RESTful para la gestión de solicitudes, requisiciones, órdenes de compra y usuarios.

## 🚀 Tecnologías

- Node.js + Express + TypeScript
- Sequelize (ORM) + MySQL
- JWT para autenticación
- Swagger para documentación interactiva

## 📋 Requisitos previos

- Node.js 18 o superior
- MySQL 8 o superior corriendo localmente
- Git

## ⚙️ Instalación y configuración

1. Clonar el repositorio y entrar a la carpeta `backend`:

   ```bash
   git clone https://github.com/gabmen27/Requisiciones-Danli-Proyecto.git
   cd Requisiciones-Danli-Proyecto/backend
2. Instalar dependencias:

    ```bash
    npm install

3. Crear archivo de variables de entorno (copia el ejemplo):

    ```bash
    cp .env.example .env

4. Editar el archivo `.env` con tus credenciales de MySQL y una clave JWT secreta:

   ```env
   PORT=4000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_contraseña
   DB_NAME=req_danli
   JWT_SECRET=clave_super_secreta_para_jwt

5. Importar la base de datos con el script Req_Danli.sql (se encuentra en la raíz del proyecto        principal). Puedes hacerlo desde MySQL Workbench o línea de comandos.

6. Iniciar el servidor en modo desarrollo:

    ```bash
    npm run dev

    El servidor correrá en http://localhost:4000.

## 📚 Documentación de la API (Swagger)

Una vez el servidor esté corriendo, accede a la documentación interactiva:

👉 **http://localhost:4000/api-docs**

Allí podrás ver todos los endpoints, probarlos y consultar los modelos de datos.

## 👤 Credenciales de prueba

- **Usuario:** `admin`
- **Contraseña:** `admin123`

## 📁 Estructura del proyecto

- `backend/`
  - `src/`
    - `config/` - Conexión a BD y configuración Swagger
    - `controllers/` - Lógica de negocio
    - `middleware/` - Autenticación y roles
    - `models/` - Modelos Sequelize
    - `routes/` - Endpoints con anotaciones Swagger
    - `services/` - Bitácora, secuencias
    - `utils/` - JWT, helpers
    - `validations/` - Validaciones (opcional)
  - `.env.example` - Plantilla de variables
  - `package.json`
  - `tsconfig.json`
  - `README.md`

## 🔐 Roles y permisos

| Rol         | Funcionalidades principales                                      |
|-------------|------------------------------------------------------------------|
| **admin**   | Acceso total: gestionar usuarios, proveedores, solicitudes, requisiciones, órdenes |
| **compras** | Gestionar proveedores, generar órdenes de compra, responder solicitudes de cotización |
| **bienes**  | Responder solicitudes de listado de precios                      |
| **gerencia / alcaldia** | Aprobar o rechazar requisiciones                      |
| **solicitante** | Crear solicitudes y requisiciones (borrador)                  |

## ✅ Endpoints principales

| Módulo | Método | Ruta | Descripción |
|--------|--------|------|-------------|
| Autenticación | POST | `/auth/login` | Obtener token JWT |
| Proveedores | GET, POST, PUT, DELETE | `/proveedores` | CRUD completo (con roles) |
| Solicitudes | GET, POST, PUT | `/solicitudes` | Crear, listar, responder, cancelar |
| Requisiciones | GET, POST, PUT | `/requisiciones` | Crear, aprobar, rechazar, enviar a aprobación |
| Órdenes de Compra | GET, POST, PUT | `/ordenes-compra` | Generar desde requisición, entregar, cancelar |
| Usuarios | GET, POST, PUT, DELETE | `/usuarios` | CRUD de usuarios (solo admin) |

## 🧪 Pruebas rápidas (con cURL)

    ```bash
    # Login
    curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}'

    # Listar proveedores (requiere token)
    curl -X GET http://localhost:4000/api/proveedores \
    -H "Authorization: Bearer <token>"

## 🤝 Contribución

Si deseas contribuir, por favor trabaja sobre una rama `feature/` y luego abre un Pull Request hacia `develop`. No se permite código directo a `main`.

## 📄 Licencia

Proyecto académico – sin licencia específica.