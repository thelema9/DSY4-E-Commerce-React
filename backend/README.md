# HuertoHogar API (Spring Boot + MySQL)

API REST del e-commerce **HuertoHogar** (DSY1104 Desarrollo Full Stack II, EP3 + EFT).
Vive en la carpeta `backend/` del mismo repositorio que el frontend React (`DSY4-E-Commerce-React`).

- **Autenticación con JWT** y dos roles: `ADMIN` y `CLIENTE`. Las contraseñas se guardan con **BCrypt**.
- **CRUD de productos**: leer es público; crear, editar y eliminar es solo para ADMIN.
- **CRUD de usuarios**, solo para ADMIN. Un CLIENTE recibe **403** aunque conozca la URL.
- **Persistencia en MySQL 8** con Spring Data JPA, validaciones con Bean Validation y códigos HTTP correctos.
- **CORS** configurable, documentación **Swagger**, despliegue en **AWS EC2** con Docker y GitHub Actions.

## Arquitectura

Cada parte del sistema corre en su propia EC2:

```
EC2 front (nginx, raíz del repo) ──▶ navegador ──:8080──▶ EC2 back (esta API, backend/) ──:3306 IP privada──▶ EC2 BD (MySQL, database/)
```

- URL pública de la API: `http://<IP-back>:8080/api`. El frontend la usa como `VITE_API_URL` y Postman como `baseUrl`.
- El navegador llama a la API desde otro origen (la IP del front), así que CORS acepta solo `CORS_ALLOWED_ORIGINS`.
- La API se conecta a MySQL por la **IP privada** de la EC2 de BD (`DB_HOST`). El 3306 no es público.

Un solo servicio Spring Boot organizado por módulos:

```
src/main/java/cl/huertohogar/api/
├── config/     SecurityConfig (reglas por rol, CORS, BCrypt) · DataInitializer · OpenApiConfig
├── security/   JwtService · JwtAuthFilter · JsonSecurityHandlers (401/403 en JSON)
├── auth/       login, registro y perfil
├── usuario/    entidades Usuario/Rol, CRUD de usuarios (ADMIN)
├── producto/   entidades Producto/Categoria, CRUD de productos
├── cupon/      validación de cupones
└── common/     ApiError, excepciones y GlobalExceptionHandler
```

## Endpoints

Todas las rutas comienzan con `/api`. Los errores siempre llegan con este formato:
`{ "status", "error", "mensaje", "errores"?, "ruta", "timestamp" }`. El campo `errores` aparece solo en los 400 de validación.

| Método | Ruta | Acceso | Respuestas |
|---|---|---|---|
| POST | `/api/auth/login` | público | 200 `{ token, usuario }` · 400 · 401 credenciales · 403 cuenta desactivada |
| POST | `/api/auth/registro` | público | 201 usuario (siempre `CLIENTE`) · 400 · 409 correo repetido |
| GET | `/api/auth/me` | autenticado | 200 · 401 |
| GET | `/api/productos` | público | 200 |
| GET | `/api/productos/{codigo}` | público | 200 · 404 |
| POST | `/api/productos` | ADMIN | 201 + `Location` · 400 · 401 · 403 · 409 código repetido |
| PUT | `/api/productos/{codigo}` | ADMIN | 200 · 400 · 401 · 403 · 404 |
| DELETE | `/api/productos/{codigo}` | ADMIN | 204 · 401 · 403 · 404 |
| GET | `/api/categorias` | público | 200 |
| GET | `/api/cupones/{codigo}` | público | 200 `{ codigo, porcentaje }` · 404 |
| GET | `/api/usuarios` | ADMIN | 200 · 401 · 403 |
| GET | `/api/usuarios/{id}` | ADMIN | 200 · 404 |
| POST | `/api/usuarios` | ADMIN | 201 · 400 · 409 |
| PUT | `/api/usuarios/{id}` | ADMIN | 200 · 400 · 404 (si la contraseña viene vacía, se mantiene la actual) |
| PATCH | `/api/usuarios/{id}/rol` | ADMIN | 200 · 400 · 404 |
| PATCH | `/api/usuarios/{id}/estado` | ADMIN | 200 · 400 · 404 |
| DELETE | `/api/usuarios/{id}` | ADMIN | 204 · 400 · 404 |
| GET | `/actuator/health` | público | 200 `{ "status": "UP" }` |

Reglas de negocio:
- El ADMIN no puede cambiar su propio rol, desactivarse ni eliminarse.
- Siempre debe quedar al menos un ADMIN activo.
- Si un usuario se desactiva o cambia de rol, el cambio aplica de inmediato aunque su token siga vigente, porque el rol se lee de la base de datos en cada petición.

Documentación interactiva (Swagger): `http://localhost:8080/swagger-ui.html` en local, o `http://<IP-back>:8080/swagger-ui.html` en la EC2.

## Usuarios y credenciales de prueba

Al arrancar, la API crea los roles, el catálogo inicial (8 productos), el cupón `HUERTO10` y estos usuarios
(solo si no existen):

| Correo | Rol | Contraseña |
|---|---|---|
| `admin@huertohogar.cl` | ADMIN | variable `ADMIN_PASSWORD` |
| `cliente@huertohogar.cl` | CLIENTE | variable `CLIENTE_DEMO_PASSWORD` |

Las contraseñas **no están en el código ni en el repositorio**: se guardan como secrets de GitHub y se informan al docente.

## Levantar el proyecto en local

Requisitos: **Docker Desktop** (o Docker + Compose). Para correr sin Docker: Java 17+ y un MySQL 8.

Primero levanta la base de datos (ver [database/README.md](../database/README.md)). Luego:

```bash
cd backend
cp .env.example .env                     # mismas credenciales de BD, JWT_SECRET (openssl rand -base64 48) y ADMIN_PASSWORD
docker compose up -d --build             # API en http://localhost:8080 (DB_HOST=host.docker.internal → MySQL local)
curl http://localhost:8080/api/productos
```

Para usar el frontend contra esta API: en la raíz del repo, `npm run dev`. El proxy de Vite envía `/api` a `localhost:8080`.

Sin Docker: exportar las variables de `.env.example` (con `DB_HOST=localhost`) y ejecutar `./mvnw spring-boot:run`.

### Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DB_HOST`, `DB_PORT` | sí (host) | Dónde está MySQL. En AWS: **IP privada** de la EC2 de BD. En local con Docker: `host.docker.internal`. Puerto por defecto `3306` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | sí | Base y usuario de la aplicación (los mismos que usa la EC2 de BD) |
| `JWT_SECRET` | sí | Clave HMAC de 32 bytes o más, en Base64 (`openssl rand -base64 48`) |
| `JWT_EXPIRATION_MS` | no | Duración del token. Por defecto `3600000` (1 hora) |
| `CORS_ALLOWED_ORIGINS` | sí en AWS | URL pública del frontend (`http://<IP-front>`). Varias, separadas por coma |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | sí (password) | Administrador inicial |
| `CLIENTE_DEMO_EMAIL` / `CLIENTE_DEMO_PASSWORD` | no | Cliente demo. Si no hay contraseña, no se crea |

## Pruebas

```bash
./mvnw verify
```

Son 34 pruebas de integración con **JUnit 5 + MockMvc**. Usan H2 en memoria, así que no necesitan MySQL,
y pasan por Spring Security real. Cubren:
- **Login:** 200, 401 y 403 por cuenta desactivada.
- **Registro:** siempre crea un CLIENTE, guarda la contraseña con hash BCrypt y responde 409 y 400 con errores por campo.
- **Productos:** público, 401 sin token, 403 para CLIENTE, 201, 409, 400, 404 y 204.
- **Usuarios:** 401, 403, CRUD, cambio de rol y estado, protección de la cuenta propia y sesión invalidada al desactivar.
- **Cupones, CORS y el health check.**

## Despliegue en la EC2 de backend (GitHub Actions)

El workflow [.github/workflows/backend.yml](../.github/workflows/backend.yml) se ejecuta en cada push a `main` que cambie algo dentro de `backend/`:

1. **Pruebas:** `./mvnw verify`.
2. **Imagen:** construye la imagen Docker y la publica en GitHub Container Registry (`ghcr.io/<usuario>/huertohogar-api`).
3. **Despliegue en la EC2 back:**
   - Copia `docker-compose.yml` a `/opt/huertohogar/backend`.
   - Escribe el `.env` con los secrets, incluido `DB_HOST` = IP privada de la EC2 de BD.
   - Ejecuta `docker compose up -d` y espera a que `/actuator/health` responda.

La base de datos debe estar desplegada antes (workflow `database.yml`). La preparación de las 3 EC2
(security groups, Docker) y la tabla completa de secrets y variables están en el [README principal](../README.md#despliegue-en-aws-3-ec2-con-github-actions).
Los que usa este workflow son:

- **Secrets:** `BACK_EC2_HOST`, `BACK_EC2_SSH_KEY`, `EC2_USER`, `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, `CLIENTE_DEMO_PASSWORD`.
- **Variables:** `DB_PRIVATE_IP`, `DB_NAME`, `DB_USER`, `CORS_ALLOWED_ORIGINS`, `JWT_EXPIRATION_MS`, `ADMIN_EMAIL`, `CLIENTE_DEMO_EMAIL`.

Si la API no arranca en la EC2, casi siempre es la conexión a MySQL. Revisa que el security group de la BD
permita el 3306 desde el security group del backend y que `DB_PRIVATE_IP` sea la IP **privada**, no la pública.

## Base de datos

El esquema, los datos iniciales y el respaldo están en [database/](../database/) (ver [database/README.md](../database/README.md)).
Los usuarios no van en los scripts SQL: los crea la API al arrancar, porque sus contraseñas deben quedar hasheadas con BCrypt.

## Colección Postman

[postman/HuertoHogar.postman_collection.json](postman/HuertoHogar.postman_collection.json) trae 32 requests, cada una con
la prueba de su código esperado: Auth, Productos, Usuarios y Cupones, incluidos los casos 400, 401, 403, 404 y 409.

1. Importa la colección y completa las variables `baseUrl` (`http://<IP-back>:8080/api` o `http://localhost:8080/api`),
   `adminPassword` y `clientePassword`.
2. Ejecuta primero los dos login: guardan los tokens.
3. Ejecuta el resto en orden, o todo con el Runner.
