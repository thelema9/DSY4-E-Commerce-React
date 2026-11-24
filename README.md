# DSY1104 - HuertoHogar: React + Spring Boot + MySQL

**Integrantes:** Fabian Palma · Juan Salas

E-commerce **HuertoHogar** (EP3 + EFT). Un solo repositorio con las tres partes del sistema. Cada parte se
despliega en **su propia instancia AWS EC2** con su propio workflow de GitHub Actions:

| Parte | Carpeta | Tecnología | EC2 | Documentación |
|---|---|---|---|---|
| Frontend | raíz del repo (`src/`, `package.json`, `deploy/`) | React 18 + Vite, Jasmine + Karma, nginx | EC2 front | este README |
| Backend | [`backend/`](backend/) | Spring Boot 3.5 (Java 17), JWT, JUnit + MockMvc | EC2 back | [backend/README.md](backend/README.md) |
| Base de datos | [`database/`](database/) | MySQL 8 | EC2 BD | [database/README.md](database/README.md) |

## Arquitectura

```
                    ┌──────────────── EC2 FRONT ────────────────┐
Navegador ──:80───▶ │ nginx: sirve el build de React (deploy/)  │
    │               └───────────────────────────────────────────┘
    │  fetch(VITE_API_URL) + JWT          (CORS: solo se acepta el origen del front)
    │               ┌──────────────── EC2 BACK ─────────────────┐                ┌───────── EC2 BD ─────────┐
    └──:8080──────▶ │ Spring Boot: API REST /api/** (backend/)  │ ──:3306 IP ──▶ │ MySQL 8 (database/)      │
                    └───────────────────────────────────────────┘    privada     └──────────────────────────┘
```

| URL pública | Ejemplo |
|---|---|
| Frontend | `http://<IP-front>/` |
| Backend (API, Postman) | `http://<IP-back>:8080/api/productos` |
| Base de datos | **no es pública**: el puerto 3306 solo acepta conexiones desde el security group del backend |

## Requisitos

- Node.js 18+ (CI usa Node 22) y npm
- Google Chrome (Karma ejecuta las pruebas en Chrome Headless)
- Docker Desktop, para levantar la base de datos y el backend en local

## Puesta en marcha (local)

### Opción rápida: todo con un solo comando

El [docker-compose.yml](docker-compose.yml) de la raíz levanta MySQL, la API y el frontend juntos. Solo requiere Docker:

```bash
cp .env.example .env              # una sola vez: completar DB_PASSWORD, DB_ROOT_PASSWORD, JWT_SECRET, ADMIN_PASSWORD y CLIENTE_DEMO_PASSWORD
docker compose up -d --build      # el primer arranque compila todo y crea la base (unos minutos)
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8080/api · Swagger en http://localhost:8080/swagger-ui.html |
| MySQL | `localhost:3306` (usuario `huerto_app` o `root`, con las contraseñas del `.env`) |

Funciona igual que en AWS: el navegador llama a la API en otro origen y CORS solo permite `http://localhost:3000`.
Los puertos se cambian en el `.env` (`WEB_PORT`, `API_PORT`, `DB_PORT_LOCAL`).

```bash
docker compose logs -f api        # ver los logs de la API
docker compose down               # apagar (los datos se mantienen)
docker compose down -v            # apagar y borrar la base (la próxima vez se recrea desde schema.sql y seed.sql)
```

Con Postman se usa el entorno **HuertoHogar - Local** (`baseUrl = http://localhost:8080/api`).

### Opción por partes (como en AWS)

Cada parte se levanta por separado, igual que en las 3 EC2:

```bash
# 1) Base de datos (MySQL en localhost:3306)
cd database && cp .env.example .env          # completar contraseñas
docker compose up -d --wait && cd ..         # el primer arranque crea la base (1-2 min)

# 2) Backend (API en http://localhost:8080)
cd backend && cp .env.example .env           # mismas credenciales de BD + JWT_SECRET y ADMIN_PASSWORD
docker compose up -d --build && cd ..        # DB_HOST=host.docker.internal apunta al MySQL del paso 1

# 3) Frontend (http://localhost:5173)
npm install
npm run dev        # /api se redirige al backend en :8080 (proxy de Vite)
npm test           # pruebas unitarias (Jasmine + Karma) + reporte de cobertura
npm run build      # build de producción en dist/
```

### Variables de entorno del frontend

| Variable | Dónde | Valor por defecto | Para qué |
|---|---|---|---|
| `VITE_API_URL` | build (Vite) | `/api` | URL base de la API. En producción: `http://<IP-back>:8080/api` |
| `VITE_PROXY_TARGET` | solo `npm run dev` | `http://localhost:8080` | A dónde redirige el proxy de Vite las llamadas a `/api` |

Los archivos `.env*` están en `.gitignore` (salvo `.env.example`): **no se suben credenciales al repositorio**.

## Entregables EP3 + EFT

Todo lo que pide la pauta está en [entregables/](entregables/README.md): **ERS** ([Markdown](entregables/ERS.md) / [PDF](entregables/ERS.pdf)),
**informe de cobertura** ([PDF](entregables/informe-cobertura.pdf)) y **capturas de la demo** ([entregables/capturas/](entregables/capturas/)).

## Usuarios y roles

Los usuarios viven en la base de datos MySQL del backend; el frontend **no** tiene credenciales escritas en el código.

| Rol | Qué puede hacer |
|---|---|
| `ADMIN` | Todo lo del cliente + `/admin` (CRUD de productos) y `/admin/usuarios` (crear, editar, cambiar rol, activar/desactivar y eliminar usuarios) |
| `CLIENTE` | Ver el catálogo, usar el carrito y el cupón. Se crea desde `/registro` (el rol no se puede elegir) |

Credenciales de prueba: `admin@huertohogar.cl` (ADMIN) y `cliente@huertohogar.cl` (CLIENTE). Las crea el backend
al arrancar; sus contraseñas están en los secrets de GitHub (`ADMIN_PASSWORD`, `CLIENTE_DEMO_PASSWORD`) y se informan al docente.

## API consumida

| Servicio (`src/services/`) | Endpoints |
|---|---|
| `authService.js` | `POST /auth/login`, `POST /auth/registro`, `GET /auth/me` |
| `productosService.js` | `GET /productos`, `GET /productos/{codigo}`, `POST /productos`, `PUT /productos/{codigo}`, `DELETE /productos/{codigo}` |
| `usuariosService.js` | `GET /usuarios`, `POST /usuarios`, `PUT /usuarios/{id}`, `PATCH /usuarios/{id}/rol`, `PATCH /usuarios/{id}/estado`, `DELETE /usuarios/{id}` |
| `cuponesService.js` | `GET /cupones/{codigo}` |

El detalle de cada endpoint (acceso por rol y códigos HTTP) está en [backend/README.md](backend/README.md).
Todas las llamadas pasan por `src/services/api.js`, que agrega el token, convierte las respuestas de error
en `ApiError` (`status`, `message`, `errores` por campo) y avisa a la app cuando el token expira.

## Despliegue en AWS (3 EC2 con GitHub Actions)

Hay un workflow por parte. En cada push a `main`, **solo se ejecuta el de la carpeta que cambió**, y despliega por SSH en **su** EC2:

| Workflow | Se ejecuta cuando cambia | Qué hace | EC2 |
|---|---|---|---|
| [database.yml](.github/workflows/database.yml) | `database/**` o `scripts/**` | Valida `schema.sql` y `seed.sql` en un MySQL de prueba → copia `database/` → escribe `.env` → `docker compose up` | BD |
| [backend.yml](.github/workflows/backend.yml) | `backend/**` o `scripts/**` | `./mvnw verify` → imagen Docker en GHCR → copia `docker-compose.yml` → escribe `.env` → `docker compose up` → espera `/actuator/health` | back |
| [frontend.yml](.github/workflows/frontend.yml) | todo lo demás (raíz), salvo `docs/` y `entregables/` | `npm test` (artefacto `cobertura`) → `npm run build` con `VITE_API_URL` → copia `dist/` y `deploy/` → reinicia nginx | front |

En los pull requests solo se ejecutan las pruebas y validaciones. Todos se pueden lanzar a mano en
**Actions → (workflow) → Run workflow**. **En el primer despliegue ejecútalos en este orden: Database → Backend → Frontend.**

### 1. Crear las 3 EC2 (una sola vez)

Ubuntu 24.04 en las tres, **en la misma VPC**. La de backend conviene que sea t3.small (Java + Spring).
Asigna una **IP elástica** al front y al back para que sus URLs no cambien.

| EC2 | Security group: reglas de entrada |
|---|---|
| **front** (`sg-front`) | 22 (SSH) · **80** (HTTP) desde `0.0.0.0/0` |
| **back** (`sg-back`) | 22 (SSH) · **8080** desde `0.0.0.0/0` |
| **BD** (`sg-db`) | 22 (SSH) · **3306 solo desde `sg-back`** (como origen se elige el security group del backend, no una IP) |

El puerto 22 queda abierto porque GitHub Actions entra por SSH desde IPs que cambian. Solo se accede con la llave `.pem`.

**No hace falta instalar nada a mano.** Antes de desplegar, cada workflow copia y ejecuta
[scripts/preparar-ec2.sh](scripts/preparar-ec2.sh) en su EC2. El script:

- instala Docker y Docker Compose v2 si faltan (Ubuntu o Amazon Linux 2023);
- crea `/opt/huertohogar`;
- agrega 2 GB de swap si la instancia tiene menos de 2 GB de RAM.

Es idempotente: si la EC2 ya está lista, no cambia nada. El único requisito es que el usuario (`ubuntu`) tenga
`sudo` sin contraseña, que es lo normal en las AMI de AWS.

### 2. Secrets y variables en GitHub

En **Settings → Secrets and variables → Actions** del repositorio, pestañas **Secrets** y **Variables**:

| Tipo | Nombre | Parte | Valor |
|---|---|---|---|
| Secret | `EC2_USER` | las 3 | `ubuntu` |
| Secret | `FRONT_EC2_HOST` | front | IP pública (elástica) de la EC2 front |
| Secret | `FRONT_EC2_SSH_KEY` | front | Contenido completo del `.pem` de la EC2 front |
| Secret | `BACK_EC2_HOST` | back | IP pública (elástica) de la EC2 back |
| Secret | `BACK_EC2_SSH_KEY` | back | Contenido completo del `.pem` de la EC2 back |
| Secret | `DB_EC2_HOST` | BD | IP pública de la EC2 de BD (solo para el SSH del despliegue) |
| Secret | `DB_EC2_SSH_KEY` | BD | Contenido completo del `.pem` de la EC2 de BD |
| Secret | `DB_PASSWORD` | BD y back | Contraseña del usuario de la aplicación en MySQL |
| Secret | `DB_ROOT_PASSWORD` | BD | Contraseña root de MySQL |
| Secret | `JWT_SECRET` | back | Generar con `openssl rand -base64 48` |
| Secret | `ADMIN_PASSWORD` | back | Contraseña del admin inicial (8+ caracteres, mayúscula, minúscula, número y símbolo) |
| Secret | `CLIENTE_DEMO_PASSWORD` | back | Contraseña del cliente demo |
| Variable | `DB_NAME` | BD y back | `huertohogar` |
| Variable | `DB_USER` | BD y back | `huerto_app` |
| Variable | `DB_PRIVATE_IP` | back | **IP privada** de la EC2 de BD (ej. `172.31.x.x`). El back se conecta por la red interna de AWS |
| Variable | `CORS_ALLOWED_ORIGINS` | back | URL del frontend: `http://<IP-front>` |
| Variable | `JWT_EXPIRATION_MS` | back | `3600000` (1 hora) |
| Variable | `ADMIN_EMAIL` | back | `admin@huertohogar.cl` |
| Variable | `CLIENTE_DEMO_EMAIL` | back | `cliente@huertohogar.cl` |
| Variable | `VITE_API_URL` | front | URL pública de la API: `http://<IP-back>:8080/api` |

Notas:
- Si las tres EC2 usan el mismo par de llaves (por ejemplo `vockey` en AWS Academy), pega el mismo `.pem` en los tres secrets `*_SSH_KEY`.
- No uses comillas simples (`'`) dentro de las contraseñas: los `.env` del servidor las usan para que los `$` se lean literalmente.
- Si reinicias las instancias sin IP elástica, cambia la IP pública: actualiza `*_EC2_HOST`, `CORS_ALLOWED_ORIGINS` y `VITE_API_URL`
  y vuelve a ejecutar los workflows de back y front.

### 3. Verificar

```bash
curl http://<IP-back>:8080/actuator/health      # {"status":"UP"}
curl http://<IP-back>:8080/api/productos         # catálogo desde MySQL
```

Luego abre `http://<IP-front>/` desde otra red o computador, como recomienda la rúbrica.

## Qué contiene

| Requisito de la rúbrica | Dónde está |
|---|---|
| Capa de servicios separada de los componentes | `src/services/` (`fetch`) |
| URL de la API por variable de entorno | `VITE_API_URL` en `src/services/api.js`, `.env.example`, `frontend.yml` |
| Login, registro y cierre de sesión contra el backend (JWT) | `src/context/AuthContext.jsx`, `LoginPage.jsx`, `RegistroPage.jsx` · `backend/.../auth/` |
| Contraseñas con hash, endpoints protegidos por rol (403) | `backend/.../config/SecurityConfig.java`, `@PreAuthorize`, BCrypt |
| Rutas protegidas en React | `src/components/RutaProtegida.jsx` (`/admin`, `/admin/usuarios`) |
| CRUD de productos | `src/pages/AdminPage.jsx` + `src/context/ProductosContext.jsx` · `backend/.../producto/` |
| CRUD de usuarios (solo ADMIN) | `src/pages/AdminUsuariosPage.jsx` + `src/components/UsuarioForm.jsx` · `backend/.../usuario/` |
| CORS para el dominio del front | `CORS_ALLOWED_ORIGINS` en `backend/.../config/SecurityConfig.java` |
| Estados de carga y error visibles | `src/components/EstadoCarga.jsx` (Home, Carrito, Admin) y mensajes del backend en formularios |
| Sin datos quemados | Productos, categorías del footer, usuarios y cupones vienen de la API. Solo queda `src/data/regiones.js` (listado de regiones/comunas del formulario) |
| Persistencia en MySQL + script de BD | `database/schema.sql`, `database/seed.sql`, `database/backup.sh` |
| Pruebas unitarias + cobertura | `src/tests/` (156 pruebas Jasmine/Karma) y `coverage/` · `backend/src/test/` (34 pruebas) |
| Colección Postman | `backend/postman/` (colección con 40 requests + entornos AWS y Local) |
| Despliegue en la nube, secretos fuera del repo | `.github/workflows/` (3 workflows, 3 EC2), secrets de GitHub, `.gitignore` |

## Estructura

```
DSY4-E-Commerce-React/
├── index.html                  # Bootstrap 5 CDN + fuentes + #root
├── package.json
├── vite.config.js              # proxy /api → backend en desarrollo
├── karma.conf.cjs              # Karma + Jasmine + cobertura (define VITE_API_URL para las pruebas)
├── .env.example                # variables de entorno (frontend y docker compose local)
├── docker-compose.yml          # todo en local con un comando: MySQL + API + frontend
├── Dockerfile                  # imagen del frontend para el compose local (build de Vite + nginx)
├── deploy/                     # EC2 front
│   ├── docker-compose.yml      # nginx en el puerto 80
│   └── nginx.conf              # sirve la SPA
├── backend/                    # EC2 back (ver backend/README.md)
│   ├── src/                    # código y pruebas (JUnit + MockMvc)
│   ├── postman/                # colección Postman + entornos AWS y Local
│   ├── Dockerfile
│   └── docker-compose.yml      # API en el puerto 8080
├── scripts/preparar-ec2.sh      # instala Docker y prepara cada EC2 (lo ejecutan los workflows)
├── database/                   # EC2 BD (ver database/README.md)
│   ├── schema.sql, seed.sql    # tablas y datos iniciales
│   ├── backup.sh               # respaldo .sql (mysqldump)
│   └── docker-compose.yml      # MySQL en el puerto 3306
├── .github/workflows/
│   ├── frontend.yml
│   ├── backend.yml
│   └── database.yml
├── public/
│   └── logo_trasnparente.png
└── src/
    ├── main.jsx
    ├── App.jsx                 # Proveedores + Layout con las rutas
    ├── index.css
    ├── services/
    │   ├── api.js              # cliente HTTP: URL base, token, ApiError, sesión expirada
    │   ├── authService.js
    │   ├── productosService.js
    │   ├── usuariosService.js
    │   └── cuponesService.js
    ├── components/
    │   ├── Header.jsx          # props: totalUnidades, usuario, onCerrarSesion
    │   ├── Footer.jsx          # props: categorias
    │   ├── ProductoCard.jsx    # props: producto, onAgregar
    │   ├── ProductoForm.jsx    # props: productoInicial, onGuardar, onCancelar, guardando, erroresServidor
    │   ├── UsuarioForm.jsx     # props: usuarioInicial, onGuardar, onCancelar, guardando, erroresServidor
    │   ├── EstadoCarga.jsx     # Cargando y MensajeError (con "Reintentar")
    │   └── RutaProtegida.jsx   # props: rol (por defecto ADMIN)
    ├── pages/
    │   ├── HomePage.jsx        # hero + catálogo desde la API + visión + video
    │   ├── LoginPage.jsx
    │   ├── RegistroPage.jsx
    │   ├── CarritoPage.jsx     # cantidades, cupón validado por la API, pago simulado
    │   ├── AdminPage.jsx       # CRUD de productos
    │   └── AdminUsuariosPage.jsx # CRUD de usuarios
    ├── context/
    │   ├── AuthContext.jsx     # login (JWT), registro, logout, sesión expirada
    │   ├── ProductosContext.jsx# catálogo + CRUD contra la API, con estados de carga/error
    │   └── CarritoContext.jsx  # carrito en localStorage
    ├── data/
    │   └── regiones.js         # regiones y comunas del formulario
    ├── utils/
    │   ├── roles.js            # ADMIN / CLIENTE
    │   ├── jwt.js              # lee la expiración del token
    │   ├── storage.js          # helpers de localStorage
    │   └── validaciones.js     # validaciones puras (fáciles de probar)
    └── tests/
        ├── backendFalso.js     # reemplaza fetch con el mismo contrato de la API
        ├── helpers.jsx         # utilidades compartidas
        └── *.spec.js(x)
```

## Pruebas unitarias

### Herramientas

| Herramienta | Rol |
|---|---|
| **Jasmine** | Framework de pruebas: `describe`, `it`, `expect`, `beforeEach` y spies (`spyOn`, `jasmine.createSpy`) |
| **Karma** | Levanta Chrome Headless, carga las pruebas y reporta los resultados |
| **karma-webpack + Babel** | Compilan el JSX para el navegador; `DefinePlugin` inyecta `import.meta.env` (`VITE_API_URL=/api`) |
| **@testing-library/react** | Monta componentes en el DOM y los consulta como lo haría un usuario |
| **karma-coverage + babel-plugin-istanbul** | Generan el reporte de cobertura de `src/` (sin las pruebas) |

Las pruebas **no necesitan el backend real**: [backendFalso.js](src/tests/backendFalso.js) reemplaza `window.fetch` con un
spy de Jasmine que responde con el mismo contrato que la API de Spring Boot: tokens por usuario, 401 sin sesión,
403 para CLIENTE, 404, 409 y errores de validación. Así se prueba la cadena completa:
componente → contexto → servicio → `fetch`.
Las pruebas corren en **orden aleatorio** para asegurar que sean independientes.

| Archivo | Pruebas | Qué verifica |
|---|---|---|
| `validaciones.spec.js` | 33 | Email, nombre, contraseña segura, teléfono, registro, producto (precio entero > 0, stock >= 0) y usuario (contraseña opcional al editar) |
| `servicios.spec.js` | 21 | Cliente HTTP: URL base desde la variable de entorno, header `Authorization`, JSON, `ApiError` con status/mensaje/errores, 401 con sesión expirada, sin conexión, 204; endpoints de cada servicio; lectura del JWT |
| `storage.spec.js` | 6 | `localStorage`: JSON corrupto y almacenamiento bloqueado |
| `contextos.spec.jsx` | 21 | Catálogo desde la API (carga, error, reintento) y su CRUD (incluye 403); carrito; login con JWT, credenciales malas, registro, logout, token vencido y evento de sesión expirada |
| `componentes.spec.jsx` | 29 | `ProductoCard` (sin stock), `Header` (links de admin), `Footer`, `EstadoCarga`, `ProductoForm` y `UsuarioForm` (validación, normalización, errores del servidor) y `RutaProtegida` |
| `paginas.spec.jsx` | 40 | Home (carga, error y reintento), Login (401, 403, sin conexión), Registro (409 y 400 del backend), Carrito (cupón vía API), Admin productos (CRUD, 409, 403 del backend) y Admin usuarios (CRUD, rol, estado, cuenta propia protegida) |
| `app.spec.jsx` | 6 | Integración: rutas protegidas, flujo completo registro → login → admin ve al nuevo usuario, y token expirado durante una acción |
| **Total** | **156** | |

### Resultado y cobertura

Resultado actual: **156 de 156 pruebas aprobadas**. El reporte HTML queda en `coverage/html/index.html`.

| Métrica | Cobertura |
|---|---|
| Sentencias | 97,46 % (538/552) |
| Ramas | 91,09 % (307/337) |
| Funciones | 97,26 % (178/183) |
| Líneas | 98,05 % (454/463) |

## Claves de `localStorage`

| Clave | Contenido |
|---|---|
| `huertohogar_sesion` | `{ token, usuario }` de la sesión activa (no existe si no hay sesión) |
| `huertohogar_carrito` | Líneas del carrito (`codigo` + `cantidad`); los precios se leen siempre del catálogo de la API |

## Notas

- El pago sigue siendo simulado (sin pasarela real).
- El cupón se valida contra la API (`HUERTO10` = -10 %).
- Si el JWT ya venció al abrir la app, la sesión se descarta. Si vence durante el uso, el primer 401 de la API
  cierra la sesión.
