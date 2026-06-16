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