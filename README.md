# Pizzería Siciliana

¡El mejor servicio de entrega de pizza de la ciudad! Este proyecto es una tienda en línea construida con Django Oscar en el backend y React (Vite) en el frontend.

## Requisitos Previos

- Docker y Docker Compose
- (Opcional) Node.js y Python 3.11+ si deseas desarrollo local sin Docker

## Inicio Rápido con Docker

La forma más sencilla de arrancar el proyecto es utilizando Docker.

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd pizzeria
   ```

2. **Levantar los servicios:**
   ```bash
   docker compose up --build
   ```

   Este comando realizará lo siguiente:
   - Construirá el frontend de React.
   - Configurará la base de datos PostgreSQL.
   - Instalará las dependencias de Python usando `uv`.
   - Ejecutará las migraciones de la base de datos.
   - Recopilará los archivos estáticos.
   - Iniciará el servidor de desarrollo en `http://localhost:8049`.

3. **Acceder a la aplicación:**
   - Tienda: `http://localhost:8049`
   - Panel de Administración: `http://localhost:8049/admin`
   - Dashboard de Oscar: `http://localhost:8049/dashboard`

## Desarrollo

### Variables de Entorno

Puedes personalizar la configuración creando un archivo `.env` en la raíz del proyecto. El sistema de Docker tomará estas variables automáticamente.

Principales variables configurables:
- `DB_NAME`: Nombre de la base de datos.
- `DB_USER`: Usuario de la base de datos.
- `DB_PASSWORD`: Contraseña de la base de datos.
- `DEBUG`: Modo de depuración (True/False).

### Comandos Útiles

- **Crear un superusuario:**
  ```bash
  docker compose exec web python manage.py createsuperuser
  ```

- **Ejecutar pruebas del backend:**
  ```bash
  docker compose exec web python manage.py test
  ```

- **Ver logs:**
  ```bash
  docker compose logs -f
  ```

## Estructura del Proyecto

- `/catalogo_siciliana`: Aplicaciones personalizadas de Django Oscar.
- `/config`: Configuración principal de Django.
- `/frontend`: Código fuente del frontend en React.
- `/static`: Archivos estáticos y build del frontend.
- `/templates`: Plantillas HTML personalizadas.
