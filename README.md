# DSY1104 - HuertoHogar: E-Commerce con React + Vite

Versión del e-commerce HuertoHogar reconstruida con **React 18 + Vite**, a partir del proyecto original en HTML/CSS/JS puro (Evaluación Parcial 1). Incluye pruebas unitarias con **Jasmine + Karma** y reporte de cobertura de código.

## Requisitos

- Node.js 18+ y npm
- Google Chrome (Karma ejecuta las pruebas en Chrome Headless)

## Puesta en marcha

```bash
npm install
npm run dev          # servidor de desarrollo (http://localhost:5173)
npm run build        # build de producción en dist/
npm test             # pruebas unitarias (Jasmine + Karma) + reporte de cobertura
npm run test:watch   # pruebas en modo watch con Chrome visible
```

## Usuarios y roles

La app trae un **administrador de fábrica** (definido en `src/data/usuarios.js`), disponible aunque `localStorage` esté vacío:

| Correo | Contraseña | Rol |
|---|---|---|
| `admin@huertohogar.cl` | `Admin123!` | `admin` |

- Solo el administrador puede entrar a las rutas protegidas (`/admin`) y ve el link "Administrar" en el menú.
- Toda cuenta creada desde `/registro` queda con rol `cliente`. El rol no se puede elegir desde el formulario, y el correo del administrador no se puede volver a registrar.
- Si alguien sin sesión intenta entrar a `/admin`, se le redirige al login y, tras iniciar sesión, vuelve a `/admin`. Un cliente con sesión ve un mensaje de "No tienes permisos".

## Qué contiene

| Requisito | Dónde está |
|---|---|
| Componentes (Header, Footer, tarjetas, formularios) | `src/components/` |
| Uso de Props | `Header` (totalUnidades, usuario, onCerrarSesion), `ProductoCard` (producto, onAgregar), `ProductoForm` (productoInicial, onGuardar, onCancelar), `Footer` (categorias) |
| Manejo de estado con `useState` | Todas las páginas y componentes (formularios, cupón, boletín, etc.) |
| Rutas SPA (una sola página) | `react-router-dom` en `src/App.jsx` (`/`, `/login`, `/registro`, `/carrito`, `/admin`) |
| CRUD completo de productos | `src/pages/AdminPage.jsx` + `src/context/ProductosContext.jsx` (crear, editar, eliminar) |
| Formulario (registro con validaciones) | `src/pages/RegistroPage.jsx` + `src/utils/validaciones.js` |
| Login funcional y roles | `src/pages/LoginPage.jsx` + `src/context/AuthContext.jsx` + `src/data/usuarios.js` (admin de fábrica) |
| Gestión de datos (localStorage + useState + useContext) | `src/context/` (Auth, Productos, Carrito) con persistencia en `localStorage` |
| Pruebas unitarias | `src/tests/`: 115 pruebas con Jasmine + Karma (ver [Pruebas unitarias](#pruebas-unitarias)) |
| Responsividad básica | Bootstrap 5 por CDN (navbar colapsable + grillas) + media query propia en `src/index.css` |

## Estructura

```
DSY4-E-Commerce-React/
├── index.html                  # Bootstrap 5 CDN + fuentes + #root
├── package.json
├── vite.config.js              # config de Vite
├── karma.conf.cjs              # config de Karma + Jasmine + cobertura
├── public/
│   └── logo_trasnparente.png
└── src/
    ├── main.jsx
    ├── App.jsx                 # Proveedores (Auth, Productos, Carrito) + Layout con las rutas
    ├── index.css               # estilos propios (mismos del original)
    ├── components/
    │   ├── Header.jsx          # props: totalUnidades, usuario, onCerrarSesion
    │   ├── Footer.jsx          # props: categorias
    │   ├── ProductoCard.jsx    # props: producto, onAgregar
    │   ├── ProductoForm.jsx    # props: productoInicial, onGuardar, onCancelar
    │   └── RutaProtegida.jsx   # props: rol (por defecto "admin"); protege /admin
    ├── pages/
    │   ├── HomePage.jsx        # hero + catálogo + visión + video
    │   ├── LoginPage.jsx
    │   ├── RegistroPage.jsx    # formulario completo con validaciones
    │   ├── CarritoPage.jsx     # cantidades, cupón HUERTO10, pago simulado
    │   └── AdminPage.jsx       # CRUD de productos
    ├── context/
    │   ├── AuthContext.jsx     # registrar, iniciar/cerrar sesión
    │   ├── ProductosContext.jsx# agregar, actualizar, eliminar productos
    │   └── CarritoContext.jsx  # agregar, actualizar cantidades, vaciar
    ├── data/
    │   ├── productos.js        # catálogo inicial (8 productos), cupones, regiones
    │   └── usuarios.js         # roles y administrador de fábrica
    ├── utils/
    │   ├── storage.js          # helpers de localStorage
    │   └── validaciones.js     # validaciones puras (fáciles de probar)
    └── tests/
        ├── helpers.jsx         # datos de prueba y utilidades compartidas
        ├── validaciones.spec.js
        ├── storage.spec.js
        ├── contextos.spec.jsx
        ├── componentes.spec.jsx
        ├── paginas.spec.jsx
        └── app.spec.jsx
```

## Pruebas unitarias

### Herramientas y configuración del entorno

| Herramienta | Rol |
|---|---|
| **Jasmine** (`jasmine-core`) | Framework de pruebas: `describe`, `it`, `expect`, `beforeEach`, spies (`spyOn`, `jasmine.createSpy`) y reloj simulado (`jasmine.clock`) |
| **Karma** | Test runner: levanta Chrome Headless, carga las pruebas y reporta los resultados |
| **karma-webpack + Babel** | Compilan el JSX de React para que Karma pueda ejecutarlo en el navegador |
| **@testing-library/react** | Monta componentes en el DOM real y los consulta como lo haría un usuario (por rol, etiqueta o texto) |
| **karma-coverage + babel-plugin-istanbul** | Instrumentan `src/` (excepto las pruebas) y generan el reporte de cobertura |
| **karma-spec-reporter** | Muestra en consola el resultado de cada prueba con su nombre |

Toda la configuración está en [karma.conf.cjs](karma.conf.cjs). Las pruebas se ejecutan en **orden aleatorio** (`random: true`) para asegurar que sean independientes entre sí; cada suite limpia `localStorage` en su `beforeEach`.

Para que las pruebas de páginas no modifiquen la URL real del navegador donde corre Karma, `App.jsx` exporta `Proveedores` y `Layout`, y las pruebas montan la app con un `MemoryRouter` (`renderApp(ruta)` en [helpers.jsx](src/tests/helpers.jsx)).

### Escritura de las pruebas

Todas siguen el patrón **Arrange / Act / Assert**: se preparan los datos (por ejemplo, sembrando `localStorage`), se simula la acción del usuario (`fireEvent.click`, `fireEvent.change`) y se verifica el resultado en el DOM o en el estado.

| Archivo | Pruebas | Qué verifica |
|---|---|---|
| `validaciones.spec.js` | 26 | Lógica pura de validación: email, nombre, contraseña segura, teléfono chileno, formulario de registro y de producto |
| `storage.spec.js` | 6 | Lectura/escritura en `localStorage`, JSON corrupto y fallas del almacenamiento |
| `contextos.spec.jsx` | 26 | Estado global: CRUD de productos, carrito (acumular, cantidades, vaciar), registro/login/logout, roles (admin de fábrica, registro siempre como cliente) y persistencia; error al usar un hook fuera de su Provider |
| `componentes.spec.jsx` | 23 | Props y eventos de `ProductoCard`, `Header` (link "Administrar" solo para admin, menú colapsable), `Footer`, `ProductoForm` y `RutaProtegida` (sin sesión, cliente y admin) |
| `paginas.spec.jsx` | 29 | Comportamiento de cada página en el DOM: Home (agregar al carrito, scroll al catálogo), Login (incluye volver a `/admin` tras iniciar sesión), Registro (comunas por región, duplicados, correo del admin), Carrito (totales, cupón, +/-, pago) y Admin (crear, editar, eliminar) |
| `app.spec.jsx` | 5 | Integración: smoke test, ruta desconocida, `/admin` sin sesión y con sesión de cliente, y el flujo completo cliente sin acceso → admin administra |
| **Total** | **115** | |

### Uso de mocks y spies

| Mock / spy | Dónde | Para qué |
|---|---|---|
| `jasmine.createSpy` | `componentes.spec.jsx` | Reemplaza los callbacks recibidos por props (`onAgregar`, `onGuardar`, `onCancelar`, `onCerrarSesion`) y verifica con qué argumentos se llaman |
| `spyOn(window, "confirm").and.returnValue(...)` | `paginas.spec.jsx` (Admin) | Simula que el usuario acepta o cancela la eliminación de un producto |
| `spyOn(window, "alert")` | `paginas.spec.jsx` (Admin) | Verifica el aviso de código de producto duplicado sin abrir un diálogo real |
| `spyOn(Storage.prototype, "getItem").and.throwError(...)` | `storage.spec.js` | Simula un `localStorage` bloqueado para probar el valor por defecto |
| `spyOn(Storage.prototype, "setItem").and.callThrough()` | `storage.spec.js` | Verifica que se guarde el JSON correcto |
| `spyOn(Element.prototype, "scrollIntoView")` | `paginas.spec.jsx` (Home) | Comprueba el scroll al catálogo (`/#catalogo`) sin depender del navegador |
| `jasmine.clock().mockDate(...)` | `contextos.spec.jsx` | Fija la fecha para verificar `creadoEn` al registrar un usuario |
| `spyOn(console, "error")` + `jasmine.spyOnGlobalErrorsAsync` | `contextos.spec.jsx` | Captura el error esperado al usar un hook fuera de su Provider |

### Análisis de resultados y cobertura

`npm test` imprime cada prueba con su resultado y, al final, la tabla de cobertura. El reporte HTML queda en `coverage/html/index.html` (y `coverage/lcov.info` para otras herramientas).

Resultado actual: **115 de 115 pruebas aprobadas**.

| Métrica | Cobertura |
|---|---|
| Sentencias | 98,01 % (297/303) |
| Ramas | 94,44 % (153/162) |
| Funciones | 95,49 % (106/111) |
| Líneas | 98,14 % (264/269) |

Lo que queda sin cubrir es menor: `App.jsx` (el `BrowserRouter` de producción, reemplazado por `MemoryRouter` en las pruebas), algunos `onChange` de campos opcionales de `ProductoForm` (atributo, imagen, descripción) y ramas defensivas del carrito (producto eliminado del catálogo que sigue en el carrito).

## Claves de `localStorage`

| Clave | Contenido |
|---|---|
| `huertohogar_usuarios` | Lista de cuentas registradas |
| `huertohogar_sesion` | Sesión activa (`null` si no hay) |
| `huertohogar_carrito` | Líneas del carrito (`codigo` + `cantidad`) |
| `huertohogar_productos` | Catálogo (sembrado con los 8 productos iniciales la primera vez) |

## Notas

- La ruta `/admin` está protegida: solo entra el administrador (ver [Usuarios y roles](#usuarios-y-roles)).
- Los roles se validan en el navegador, sin backend: alguien con conocimientos técnicos podría editar `localStorage` para darse el rol de admin. Es una limitación esperada en un frontend sin servidor; con backend, el rol debe validarse en el servidor.
- El link "Productos" del menú lleva al Home y hace scroll hasta el catálogo (`/#catalogo`).
- El pago sigue siendo simulado (sin pasarela real), igual que el original.
- El único cupón válido es `HUERTO10` (-10%).
- Las contraseñas se guardan en texto plano en `localStorage`: es una simplificación esperada sin backend, documentada como limitación, no como práctica a replicar con un servidor real.
