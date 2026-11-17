# HuertoHogar · Base de datos (MySQL 8)

Base de datos del e-commerce HuertoHogar. Se despliega en **su propia EC2** con Docker. El backend
(EC2 back) se conecta por la **IP privada** de esta instancia.

| Archivo | Qué es |
|---|---|
| [schema.sql](schema.sql) | Tablas `roles`, `usuarios`, `categorias`, `productos` y `cupones`, con sus FK y CHECK (`precio > 0`, `stock >= 0`) |
| [seed.sql](seed.sql) | Datos iniciales: roles, categorías, los 8 productos del catálogo y el cupón `HUERTO10`. Se puede ejecutar varias veces sin duplicar (`INSERT IGNORE`) |
| [docker-compose.yml](docker-compose.yml) | MySQL 8 con volumen persistente (`huertohogar-mysql-data`), healthcheck y puerto 3306 |
| [backup.sh](backup.sh) | Respaldo `.sql` con `mysqldump` (entregable de la rúbrica) |
| [.env.example](.env.example) | Variables necesarias: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_ROOT_PASSWORD` |

Los **usuarios** no están en los scripts SQL: los crea la API al arrancar, porque sus contraseñas deben
quedar hasheadas con BCrypt. Las credenciales salen de variables de entorno, nunca del repositorio.

## Modelo

```
roles (id_rol PK, nombre UNIQUE)            categorias (id_categoria PK, nombre UNIQUE)
   │ 1                                          │ 1
   │ N                                          │ N
usuarios (id_usuario PK, email UNIQUE,       productos (codigo PK, nombre, id_categoria FK,
          password_hash BCrypt, ..., id_rol FK)          precio > 0, stock >= 0, ...)

cupones (codigo PK, porcentaje, activo)
```

## Levantar en local

```bash
cd database
cp .env.example .env          # completar contraseñas
docker compose up -d --wait   # MySQL en localhost:3306
```

`schema.sql` y `seed.sql` se ejecutan **solo la primera vez**, con el volumen vacío. El primer arranque
puede tardar algunos minutos. Para partir de cero: `docker compose down -v` (**borra los datos**).

## Despliegue en la EC2 de base de datos

El workflow [database.yml](../.github/workflows/database.yml) se ejecuta cuando cambia algo en `database/`:

1. **Valida** `schema.sql` y `seed.sql` en un MySQL 8 de prueba, dentro de GitHub Actions.
2. **Copia** esta carpeta a `/opt/huertohogar/database` en la EC2 de BD.
3. **Escribe** el `.env` con los secrets y ejecuta `docker compose up -d --wait`.

Volver a desplegar **no borra los datos**: el volumen se mantiene y los scripts no se vuelven a aplicar.

Usa estos secrets: `DB_EC2_HOST`, `DB_EC2_SSH_KEY`, `EC2_USER`, `DB_PASSWORD` y `DB_ROOT_PASSWORD`.
Y estas variables: `DB_NAME` y `DB_USER`. La tabla completa está en el [README principal](../README.md#despliegue-en-aws-3-ec2-con-github-actions).

**Seguridad:** el security group de esta EC2 debe permitir el puerto **3306 solo desde el security group del
backend**. MySQL nunca queda abierto a internet.

## Respaldo

En la EC2 de BD:

```bash
cd /opt/huertohogar/database
./backup.sh                    # genera backup.sql
```

Para traerlo a tu computador: `scp -i llave.pem ubuntu@<IP-BD>:/opt/huertohogar/database/backup.sql .`

Restaurar un respaldo:

```bash
docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -u root' < backup.sql
```
