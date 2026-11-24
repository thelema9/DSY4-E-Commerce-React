# Entregables EP3 + EFT · HuertoHogar

**Integrantes:** Fabian Palma · Juan Salas

| Entregable (pauta) | Archivo |
|---|---|
| ERS actualizado | [ERS.md](ERS.md) · [ERS.pdf](ERS.pdf) |
| Informe de cobertura de pruebas | [informe-cobertura.pdf](informe-cobertura.pdf) · [captura del reporte Istanbul](capturas/20-cobertura-istanbul.png) |
| Capturas de la demo (login, restricciones por rol, ambos CRUD, persistencia) | [capturas/](capturas/) |
| Colección Postman | [Colección](../backend/postman/HuertoHogar.postman_collection.json) · entornos [AWS](../backend/postman/HuertoHogar-AWS.postman_environment.json) y [Local](../backend/postman/HuertoHogar-Local.postman_environment.json) · [instrucciones](../backend/README.md#colección-postman) |
| Script y respaldo de la base de datos | [../database/schema.sql](../database/schema.sql) · [../database/seed.sql](../database/seed.sql) · [../database/backup.sh](../database/backup.sh) |
| README con arquitectura, endpoints, instalación y credenciales | [../README.md](../README.md) · [../backend/README.md](../backend/README.md) |

## Capturas de la demo

Tomadas sobre el despliegue real en AWS (frontend `http://52.90.43.206`, backend `http://3.82.7.248:8080`).
El producto `DEMO01` y el usuario `usuario.demo@huertohogar.cl` se crearon para la demo y se eliminaron al final.

| # | Qué muestra | Requisito |
|---|---|---|
| 01 | Catálogo cargado desde la API (visitante) | RF-09 |
| 02 | Ruta `/admin` sin sesión → redirige al login | RF-07 |
| 03 | Login con contraseña incorrecta → mensaje del backend (401) | RF-04 |
| 04 | Login ADMIN: menú con "Administrar" y "Usuarios" | RF-04, RF-07 |
| 05 | Listado de productos (ADMIN) | RF-09 |
| 06 | Formulario de nuevo producto | RF-11 |
| 07 | Producto creado (201) | RF-11 |
| 08 | Validaciones: precio 0 y stock negativo rechazados | RF-12 |
| 09 | Producto editado; el cambio persiste tras recargar la página | RF-14 |
| 10 | El mismo producto consultado directo en la API (MySQL) | RF-10 |
| 11 | Documentación Swagger del backend | RNF-15 |
| 12 | Listado de usuarios (ADMIN) | RF-23 |
| 13 | Formulario de nuevo usuario | RF-24 |
| 14 | Usuario creado, rol cambiado a ADMIN y desactivado | RF-24, RF-26, RF-27 |
| 15 | Login CLIENTE: sin enlaces de administración | RF-07 |
| 16 | CLIENTE en `/admin/usuarios` → "No tienes permisos" | RF-07, RF-08 |
| 17 | Carrito con cupón `HUERTO10` validado por la API | RF-18 a RF-21 |
| 18 | Usuario eliminado | RF-28 |
| 19 | Producto eliminado | RF-15 |
| 20 | Reporte de cobertura (Istanbul) | RNF-11 |

Para la demo en vivo con el docente, la evidencia del **403 del backend** (un CLIENTE que llama a la API directamente)
se muestra con la colección Postman: request "Crear como CLIENTE → 403".
