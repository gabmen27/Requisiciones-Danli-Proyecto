# 🏛️ Backend - Sistema de Requisiciones (Municipalidad de Danlí)

API RESTful para la gestión de solicitudes, requisiciones y órdenes de compra.

## 🚀 Tecnologías Utilizadas

- **Node.js** – Entorno de ejecución.
- **Express.js** – Framework web.
- **TypeScript** – Superset tipado de JavaScript.
- **Sequelize** – ORM para la interacción con la base de datos.
- **MySQL** – Sistema gestor de bases de datos relacional.
- **JWT** – Autenticación basada en tokens.
- **Swagger** – Documentación interactiva de la API.

## 📋 Requisitos Previos

- Node.js (versión 18 o superior).
- MySQL Server (versión 8.0 o superior) en ejecución.

## ⚙️ Instalación y Configuración

Sigue estos pasos para levantar el proyecto en tu máquina local:

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/gabmen27/Requisiciones-Danli-Proyecto.git
   cd Requisiciones-Danli-Proyecto/backend

2. **Instalar dependencias**
   ```bash
   npm install

3. **Configurar variables de entorno**
    Copia el archivo de ejemplo:
    ```bash
    cp .env.example .env

    Edita el archivo .env y completa con tus credenciales locales de MySQL.

4. **Preparar la Base de Datos**
    Asegúrate de que tu servidor MySQL esté corriendo.
    Ejecuta el script principal (Req_Danli.sql) para crear la estructura y los datos de prueba

5. **Iniciar el servidor**
    ```bash
    npm run dev

    El servidor se ejecutará en http://localhost:4000.

## Documentación de la API (Swagger)
Una vez que el servidor esté en funcionamiento, puedes acceder a la documentación interactiva de todos los endpoints disponibles a través de la interfaz de Swagger UI:

👉 http://localhost:4000/api-docs

Desde allí podrás ver los modelos de datos, probar las peticiones y entender cómo interactuar con el backend.

## 👤 Credenciales de Prueba
Para empezar a probar la API que requiere autenticación, puedes usar el siguiente usuario de prueba (incluido en el script de la base de datos):

Usuario: admin

Contraseña: admin123


## 🤝 Contribución

Si deseas contribuir al proyecto, por favor sigue estos pasos:

Crea una rama nueva (git checkout -b feature/nueva-funcionalidad)

Realiza tus cambios y haz commit (git commit -m 'Agrega nueva funcionalidad')

Sube la rama (git push origin feature/nueva-funcionalidad)

Abre un Pull Request en GitHub.


## Estructura del proyecto

```bash
backend/
├── src/
│   ├── config/          # Conexión a BD y Swagger
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Autenticación y roles
│   ├── models/          # Modelos Sequelize
│   ├── routes/          # Endpoints de la API
│   ├── services/        # Servicios (bitácora, secuencias)
│   ├── utils/           # Utilidades (JWT)
│   └── validations/     # Validaciones con express-validator
├── .env.example         # Plantilla de variables de entorno
├── package.json
├── tsconfig.json
└── README.md