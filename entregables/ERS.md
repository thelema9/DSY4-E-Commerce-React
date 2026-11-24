# Especificación de Requisitos de Software (ERS) — HuertoHogar

| | |
|---|---|
| **Proyecto** | HuertoHogar: tienda online de productos del campo |
| **Asignatura** | DSY1104 Desarrollo Full Stack II · Duoc UC · 2026-02 |
| **Evaluación** | EP3 + Evaluación Final Transversal (EFT) |
| **Versión del documento** | 3.0 (actualizada para la entrega final integrada) |
| **Fecha** | 17 de noviembre de 2026 |
| **Repositorio** | https://github.com/thelema9/DSY4-E-Commerce-React |
| **Integrantes** | Fabian Palma · Juan Salas |

## Historial de versiones

| Versión | Entrega | Cambios principales |
|---|---|---|
| 1.0 | EP1 | Sitio en HTML, CSS y JavaScript: catálogo, carrito, registro y login sin backend. |
| 2.0 | EP2 | Migración a React 18 + Vite, Context API, CRUD de productos en `localStorage`, pruebas Jasmine + Karma. |
| **3.0** | **EP3 + EFT** | **API REST propia en Spring Boot con MySQL, login con JWT y roles validados en el backend, CRUD de usuarios, capa de servicios en React, despliegue en tres instancias AWS EC2 con GitHub Actions.** |

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requisitos de la versión final de HuertoHogar. Lo usan el equipo de desarrollo para
implementar y probar el sistema, y el docente para evaluar la EP3 y la EFT. Reemplaza las versiones 1.0 y 2.0: la
principal diferencia es que los datos y la seguridad ahora viven en un backend propio y no en el navegador.

### 1.2 Alcance

HuertoHogar conecta a familias chilenas con productores del campo. Los clientes navegan un catálogo de frutas,
verduras y productos orgánicos, arman un carrito, aplican un cupón de descuento y simulan el pago. Los
administradores gestionan el catálogo y las cuentas de usuario.

**Dentro del alcance:** catálogo público, registro e inicio de sesión con roles, carrito con cupón, CRUD de productos,
CRUD de usuarios, persistencia en MySQL y despliegue en la nube.

**Fuera del alcance:** pasarela de pago real (el pago es simulado), despacho y seguimiento de pedidos, historial de
compras, recuperación de contraseña por correo y HTTPS con dominio propio.

### 1.3 Definiciones y abreviaturas

| Término | Significado |
|---|---|
| ADMIN | Rol con permisos de administración del catálogo y de los usuarios. |
| CLIENTE | Rol de un comprador registrado. Es el rol de toda cuenta creada desde el registro público. |
| Visitante | Persona que navega sin iniciar sesión. |
| API REST | Interfaz HTTP del backend (`/api/**`) que intercambia JSON. |
| JWT | JSON Web Token: credencial firmada que el backend entrega al iniciar sesión. |
| BCrypt | Algoritmo de hash usado para guardar las contraseñas. |
| CORS | Mecanismo del navegador que controla qué orígenes pueden llamar a la API. |
| EC2 | Servidor virtual de Amazon Web Services. |
| SPA | Single Page Application: la aplicación React. |

### 1.4 Referencias

- Pauta EP3 + EFT DSY1104 (docente Jesús Vargas), semestre 2026-02.
- IEEE Std 830-1998, *Recommended Practice for Software Requirements Specifications* (estructura de este documento).
- README del repositorio, `backend/README.md` y `database/README.md` (instalación, endpoints y despliegue).

---

## 2. Descripción general

### 2.1 Perspectiva del producto

El sistema tiene tres partes. Cada una se despliega en su propia instancia EC2 desde el mismo repositorio:

```
Navegador ──HTTP :80──▶ EC2 FRONT   nginx con la SPA React (raíz del repo)
    │
    └──HTTP :8080 + JWT──▶ EC2 BACK    API REST Spring Boot (backend/)
                               │
                               └──JDBC :3306 (IP privada)──▶ EC2 BD   MySQL 8 (database/)
```

- El frontend no guarda datos del negocio: productos, usuarios y cupones se obtienen de la API.
- El backend aplica todas las reglas de seguridad y validación, y es el único que accede a la base de datos.
- La base de datos no es accesible desde internet. Solo acepta conexiones del backend.

### 2.2 Funciones principales

1. Mostrar el catálogo de productos con precio, unidad y disponibilidad de stock.
2. Registrar clientes y autenticar usuarios con JWT.
3. Gestionar un carrito con cantidades, cupón de descuento y pago simulado.
4. Administrar productos (crear, ver, editar y eliminar).
5. Administrar usuarios (crear, editar, cambiar rol, activar o desactivar y eliminar).

### 2.3 Usuarios del sistema

| Usuario | Descripción | Puede |
|---|---|---|
| Visitante | Persona sin sesión | Ver el catálogo, usar el carrito, registrarse e iniciar sesión |
| CLIENTE | Comprador registrado | Lo mismo que el visitante, con su nombre visible y la sesión guardada |
| ADMIN | Personal de HuertoHogar | Todo lo anterior más el CRUD de productos y el CRUD de usuarios |

### 2.4 Restricciones

- **Stack:** React 18 + Vite (frontend), Spring Boot 3 con Java 17 (backend) y MySQL 8 (base de datos), según la pauta.
- **Despliegue:** debe estar en una nube pública (AWS EC2) y accesible por URL pública.
- **Pruebas:** al menos 10 pruebas Jasmine + Karma con informe de cobertura.
- **Credenciales:** nunca en el repositorio. Se entregan por variables de entorno y secrets de GitHub.

### 2.5 Suposiciones y dependencias

- Las tres EC2 están en la misma VPC y la de la base de datos es alcanzable por IP privada desde el backend.
- AWS Academy puede cambiar las IP públicas al reiniciar el laboratorio. En ese caso se actualizan los secrets y se
  vuelven a ejecutar los workflows.
- Las imágenes de los productos son URL externas.

---

## 3. Requisitos funcionales

Prioridad: **A** = obligatorio en la pauta · **M** = importante · **B** = deseable.

### 3.1 Autenticación y roles

| ID | Requisito | Rol | Prioridad | Endpoint / pantalla | Criterio de aceptación |
|---|---|---|---|---|---|
| RF-01 | Registro de clientes con nombre, correo, contraseña, teléfono opcional, región y comuna. | Visitante | A | `POST /api/auth/registro` · `/registro` | Responde 201 con el usuario; el rol siempre es CLIENTE, aunque el JSON pida otro. |
| RF-02 | Validación del registro: nombre solo letras (máx. 50), correo válido, contraseña de 8+ caracteres con mayúscula, minúscula, número y símbolo, móvil chileno y confirmación de correo y contraseña. | Visitante | A | `/registro` + backend | Datos inválidos: el front muestra errores por campo y el backend responde 400 con `errores`. |
| RF-03 | Un correo ya registrado no puede volver a registrarse. | Visitante | A | `POST /api/auth/registro` | Responde 409 "Ya existe una cuenta con este correo." |
| RF-04 | Inicio de sesión contra el backend que entrega un JWT. | Todos | A | `POST /api/auth/login` · `/login` | 200 con `{ token, usuario }`; 401 si las credenciales son incorrectas; 403 si la cuenta está desactivada. |
| RF-05 | Cierre de sesión. | CLIENTE, ADMIN | A | Botón "Cerrar sesión" | Se elimina el token del navegador y se vuelve al estado de visitante. |
| RF-06 | La sesión expira con el token (1 hora por defecto). | CLIENTE, ADMIN | M | Frontend + backend | Con un token vencido o inválido, la API responde 401 y la app cierra la sesión y vuelve al login. |
| RF-07 | Rutas privadas protegidas en React. | Todos | A | `/admin`, `/admin/usuarios` | Sin sesión redirige al login (y luego vuelve a la ruta pedida); un CLIENTE ve "No tienes permisos". |
| RF-08 | Endpoints de administración protegidos en el backend. | CLIENTE | A | `/api/productos` (escritura), `/api/usuarios/**` | Un CLIENTE recibe **403** aunque conozca la URL; sin token, **401**. |

### 3.2 Catálogo y productos

| ID | Requisito | Rol | Prioridad | Endpoint / pantalla | Criterio de aceptación |
|---|---|---|---|---|---|
| RF-09 | Listar el catálogo público. | Todos | A | `GET /api/productos` · Home | Muestra los productos de MySQL con imagen, precio en CLP y unidad. Mientras carga se ve "Cargando productos..." y si falla, un error con "Reintentar". |
| RF-10 | Ver el detalle de un producto. | Todos | A | `GET /api/productos/{codigo}` | 200 con el producto; 404 si no existe. |
| RF-11 | Crear un producto. | ADMIN | A | `POST /api/productos` · `/admin` | 201 con el producto y header `Location`; el código se guarda en mayúsculas. |
| RF-12 | Validar los productos: código obligatorio (máx. 10), nombre, categoría y unidad obligatorios, precio entero mayor a 0, stock entero mayor o igual a 0. | ADMIN | A | Formulario + backend | 400 con `errores` por campo; el front no envía datos inválidos. |
| RF-13 | No permitir códigos de producto repetidos. | ADMIN | A | `POST /api/productos` | 409 "Ya existe un producto con el código X." |
| RF-14 | Editar un producto (el código no se puede cambiar). | ADMIN | A | `PUT /api/productos/{codigo}` | 200 con el producto actualizado; 404 si no existe. El cambio persiste al recargar. |
| RF-15 | Eliminar un producto con confirmación. | ADMIN | A | `DELETE /api/productos/{codigo}` | Pide confirmación, responde 204 y el producto desaparece del catálogo. |
| RF-16 | Indicar los productos sin stock. | Todos | M | Home | Con `stock = 0` el botón muestra "Sin stock" y está deshabilitado. |
| RF-17 | Listar las categorías; una categoría nueva se crea al usarla en un producto. | Todos | B | `GET /api/categorias` · Footer | Las categorías del footer salen del catálogo de la API. |

### 3.3 Carrito

| ID | Requisito | Rol | Prioridad | Endpoint / pantalla | Criterio de aceptación |
|---|---|---|---|---|---|
| RF-18 | Agregar productos al carrito y ver el total de unidades en el encabezado. | Todos | M | Home, Header | El contador "Cart (n)" se actualiza; el carrito se conserva al recargar. |
| RF-19 | Modificar cantidades y quitar productos. | Todos | M | `/carrito` | Los botones + y - cambian la cantidad; con 0 la línea se elimina. |
| RF-20 | Calcular el total con los precios vigentes de la API. | Todos | M | `/carrito` | El total usa los precios del catálogo, no valores guardados en el navegador. |
| RF-21 | Aplicar el cupón `HUERTO10` (10 % de descuento), validado por el backend. | Todos | M | `GET /api/cupones/{codigo}` | Un cupón válido descuenta el porcentaje; uno inválido muestra "Cupón inválido." (404). |
| RF-22 | Pago simulado. | Todos | B | `/carrito` | Confirma el pedido y vacía el carrito; con el carrito vacío avisa que se agreguen productos. |

### 3.4 Usuarios (solo ADMIN)

| ID | Requisito | Rol | Prioridad | Endpoint / pantalla | Criterio de aceptación |
|---|---|---|---|---|---|
| RF-23 | Listar usuarios sin exponer contraseñas. | ADMIN | A | `GET /api/usuarios` · `/admin/usuarios` | Muestra nombre, correo, rol y estado; la respuesta nunca incluye la contraseña ni su hash. |
| RF-24 | Crear usuarios con el rol ADMIN o CLIENTE. | ADMIN | A | `POST /api/usuarios` | 201; 409 si el correo existe; 400 si los datos son inválidos. |
| RF-25 | Editar los datos de un usuario; el correo no cambia y la contraseña solo cambia si se escribe una nueva. | ADMIN | A | `PUT /api/usuarios/{id}` | 200 con el usuario; con la contraseña vacía se mantiene la anterior. |
| RF-26 | Cambiar el rol de un usuario. | ADMIN | A | `PATCH /api/usuarios/{id}/rol` | 200; el cambio aplica de inmediato aunque el usuario tenga un token vigente. |
| RF-27 | Activar o desactivar un usuario. | ADMIN | A | `PATCH /api/usuarios/{id}/estado` | Un usuario desactivado no puede iniciar sesión (403) y su token deja de servir (401). |
| RF-28 | Eliminar un usuario con confirmación. | ADMIN | A | `DELETE /api/usuarios/{id}` | 204; 404 si no existe. |
| RF-29 | Proteger la cuenta propia y al último administrador. | ADMIN | M | Backend + `/admin/usuarios` | El ADMIN no puede cambiar su propio rol, desactivarse ni eliminarse (400); siempre debe quedar un ADMIN activo. |

### 3.5 Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Toda cuenta creada desde el registro público es CLIENTE. |
| RN-02 | Los precios se expresan en pesos chilenos, como enteros sin decimales. |
| RN-03 | El cupón `HUERTO10` descuenta un 10 % sobre el subtotal. |
| RN-04 | Las regiones y comunas disponibles son las de cobertura de HuertoHogar (RM, Valparaíso, Biobío, Los Lagos y La Araucanía). |
| RN-05 | Los usuarios iniciales (administrador y cliente demo) los crea el backend al arrancar, con contraseñas tomadas de variables de entorno. |

---

## 4. Requisitos no funcionales

| ID | Categoría | Requisito | Cómo se cumple |
|---|---|---|---|
| RNF-01 | Seguridad | Las contraseñas se guardan con hash, nunca en texto plano. | BCrypt en el backend (`password_hash`). |
| RNF-02 | Seguridad | La autorización se valida en el servidor. | Spring Security con reglas por URL y `@PreAuthorize("hasRole('ADMIN')")`; el rol se lee desde la base de datos en cada petición. |
| RNF-03 | Seguridad | Sesión sin estado con token firmado y con expiración. | JWT HS256 firmado con `JWT_SECRET`; expira según `JWT_EXPIRATION_MS`. |
| RNF-04 | Seguridad | Solo el frontend autorizado puede llamar a la API desde el navegador. | CORS con `CORS_ALLOWED_ORIGINS`; cualquier otro origen recibe 403. |
| RNF-05 | Seguridad | Las credenciales no están en el repositorio. | Secrets y variables de GitHub que se escriben en un `.env` en cada EC2; `.env` y `.pem` en `.gitignore`. |
| RNF-06 | Seguridad | La base de datos no queda expuesta a internet. | Security group: puerto 3306 solo desde el security group del backend. |
| RNF-07 | Confiabilidad | Respuestas de error consistentes y con el código HTTP correcto. | `GlobalExceptionHandler` con formato `{ status, mensaje, errores }`: 200, 201, 204, 400, 401, 403, 404, 409. |
| RNF-08 | Usabilidad | La interfaz muestra estados de carga y de error, y los mensajes del backend. | Componentes `Cargando` y `MensajeError` con "Reintentar"; errores por campo en los formularios. |
| RNF-09 | Usabilidad | Diseño responsivo. | Bootstrap 5 con menú colapsable en celular. |
| RNF-10 | Mantenibilidad | La comunicación con la API está separada de los componentes. | Capa `src/services/` (`fetch`) con la URL base en `VITE_API_URL`. |
| RNF-11 | Mantenibilidad | El código está probado automáticamente. | 156 pruebas Jasmine + Karma (98 % de líneas) y 34 pruebas JUnit + MockMvc. |
| RNF-12 | Portabilidad | Cada parte se ejecuta en contenedores. | Docker y Docker Compose para MySQL, la API y nginx. |
| RNF-13 | Despliegue | El despliegue es automático y reproducible. | Tres workflows de GitHub Actions, uno por carpeta y EC2, que preparan la instancia, prueban y despliegan. |
| RNF-14 | Disponibilidad | Los servicios se recuperan solos y los datos persisten. | `restart: unless-stopped`, healthchecks y volumen de MySQL persistente. |
| RNF-15 | Documentación | La API está documentada. | Swagger en `/swagger-ui.html`, colección Postman y README. |

---

## 5. Interfaces

### 5.1 Interfaz de usuario

| Pantalla | Ruta | Acceso |
|---|---|---|
| Inicio y catálogo | `/` | Todos |
| Inicio de sesión | `/login` | Todos |
| Registro | `/registro` | Todos |
| Carrito | `/carrito` | Todos |
| Administrar productos | `/admin` | ADMIN |
| Administrar usuarios | `/admin/usuarios` | ADMIN |

Las capturas de cada pantalla están en `entregables/capturas/`.

### 5.2 Interfaz de software (API REST)

URL base en producción: `http://<IP-back>:8080/api`. Formato JSON. Autenticación con el header
`Authorization: Bearer <token>`.

| Método | Ruta | Acceso | Respuestas |
|---|---|---|---|
| POST | `/auth/login` | Público | 200, 400, 401, 403 |
| POST | `/auth/registro` | Público | 201, 400, 409 |
| GET | `/auth/me` | Autenticado | 200, 401 |
| GET | `/productos` · `/productos/{codigo}` | Público | 200, 404 |
| POST | `/productos` | ADMIN | 201, 400, 401, 403, 409 |
| PUT | `/productos/{codigo}` | ADMIN | 200, 400, 401, 403, 404 |
| DELETE | `/productos/{codigo}` | ADMIN | 204, 401, 403, 404 |
| GET | `/categorias` | Público | 200 |
| GET | `/cupones/{codigo}` | Público | 200, 404 |
| GET · POST | `/usuarios` | ADMIN | 200 / 201, 400, 401, 403, 409 |
| GET · PUT · DELETE | `/usuarios/{id}` | ADMIN | 200 / 204, 400, 404 |
| PATCH | `/usuarios/{id}/rol` · `/usuarios/{id}/estado` | ADMIN | 200, 400, 404 |

---

## 6. Modelo de datos

Base de datos MySQL 8 `huertohogar`. Las tablas se crean con `database/schema.sql` y los datos iniciales se cargan con `database/seed.sql`.

| Tabla | Campos principales | Relaciones y restricciones |
|---|---|---|
| `roles` | `id_rol`, `nombre` (ADMIN, CLIENTE) | `nombre` único |
| `usuarios` | `id_usuario`, `nombre`, `email`, `password_hash`, `telefono`, `region`, `comuna`, `activo`, `fecha_registro` | `email` único · FK `id_rol` → `roles` (N:1) |
| `categorias` | `id_categoria`, `nombre` | `nombre` único |
| `productos` | `codigo` (PK, ej. FR001), `nombre`, `atributo`, `precio`, `stock`, `unidad`, `descripcion`, `imagen_url` | FK `id_categoria` → `categorias` (N:1) · `CHECK precio > 0` · `CHECK stock >= 0` |
| `cupones` | `codigo` (PK), `porcentaje`, `activo` | — |

El diagrama de arquitectura y de datos está en `docs/arquitectura.drawio`.

---

## 7. Verificación

| Tipo | Herramienta | Alcance | Resultado |
|---|---|---|---|
| Unitarias e integración del frontend | Jasmine + Karma + Testing Library | Componentes, contextos, páginas, servicios y validaciones, con un backend falso que replica la API | 156/156 · cobertura de líneas del 98,05 % (`entregables/informe-cobertura.pdf`) |
| Integración del backend | JUnit 5 + MockMvc (H2) | Endpoints, seguridad (401/403), validaciones y reglas de negocio | 34/34 |
| Validación SQL | GitHub Actions + MySQL 8 | `schema.sql` y `seed.sql` (idempotente) | OK en cada cambio de `database/` |
| De punta a punta | Pruebas sobre las URL públicas | Login por rol, 403 para CLIENTE, ambos CRUD, persistencia y CORS | 20/20 sobre el despliegue en AWS |

### 7.1 Trazabilidad requisitos → pruebas

| Requisitos | Pruebas que los verifican |
|---|---|
| RF-01 a RF-03 | `paginas.spec.jsx` (Registro), `validaciones.spec.js`, `AuthControllerTest` |
| RF-04 a RF-06 | `contextos.spec.jsx` (AuthContext), `paginas.spec.jsx` (Login), `servicios.spec.js`, `AuthControllerTest` |
| RF-07 y RF-08 | `componentes.spec.jsx` (RutaProtegida), `app.spec.jsx`, `ProductoControllerTest`, `UsuarioControllerTest` |
| RF-09 a RF-17 | `paginas.spec.jsx` (Home y Admin productos), `contextos.spec.jsx` (ProductosContext), `componentes.spec.jsx` (ProductoForm y ProductoCard), `ProductoControllerTest` |
| RF-18 a RF-22 | `contextos.spec.jsx` (CarritoContext), `paginas.spec.jsx` (Carrito), `CuponYSeguridadTest` |
| RF-23 a RF-29 | `paginas.spec.jsx` (Admin usuarios), `componentes.spec.jsx` (UsuarioForm), `UsuarioControllerTest` |
| RNF-04 | `CuponYSeguridadTest` (CORS permitido y rechazado) |

---

## 8. Cumplimiento de la pauta EP3 + EFT

| Requisito de la pauta | Requisitos del ERS | Evidencia |
|---|---|---|
| Login funcional con roles y validación de seguridad | RF-04 a RF-08, RNF-01 a RNF-03 | Capturas 02, 03, 04, 15 y 16 |
| CRUD de productos (REST) sobre MySQL | RF-09 a RF-17 | Capturas 05 a 10 y 19 |
| CRUD de usuarios solo para ADMIN | RF-23 a RF-29 | Capturas 12 a 14 y 18 |
| Integración front + back (servicios, variable de entorno, CORS, carga y error) | RNF-04, RNF-08, RNF-10 | `src/services/`, captura 01 |
| Pruebas unitarias con cobertura | RNF-11 | `entregables/informe-cobertura.pdf`, captura 20 |
| Despliegue en la nube con secretos fuera del repositorio | RNF-05, RNF-06, RNF-12 a RNF-14 | `.github/workflows/`, URL públicas |
| Documentación (README, Postman, respaldo de BD) | RNF-15 | `README.md`, `backend/postman/`, `database/` |
