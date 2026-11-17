-- =====================================================================
-- HuertoHogar · Esquema de la base de datos (MySQL 8)
-- Lo ejecuta el contenedor de MySQL la primera vez (docker-entrypoint-initdb.d).
-- También sirve para crear la base a mano:  mysql -u root -p huertohogar < db/schema.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS roles (
    id_rol  INT AUTO_INCREMENT PRIMARY KEY,
    nombre  VARCHAR(20) NOT NULL UNIQUE          -- ADMIN, CLIENTE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario      BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(50)  NOT NULL,
    email           VARCHAR(120) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,       -- hash BCrypt, nunca texto plano
    telefono        VARCHAR(15)  NULL,
    region          VARCHAR(80)  NOT NULL,
    comuna          VARCHAR(80)  NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_registro  DATETIME(6)  NULL,
    id_rol          INT          NOT NULL,
    CONSTRAINT fk_usuarios_rol FOREIGN KEY (id_rol) REFERENCES roles (id_rol)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS categorias (
    id_categoria  INT AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(60) NOT NULL UNIQUE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS productos (
    codigo        VARCHAR(10)   PRIMARY KEY,     -- ej. FR001
    nombre        VARCHAR(100)  NOT NULL,
    id_categoria  INT           NOT NULL,
    atributo      VARCHAR(120)  NULL,
    precio        INT           NOT NULL,        -- pesos chilenos
    stock         INT           NOT NULL,
    unidad        VARCHAR(20)   NOT NULL,
    descripcion   VARCHAR(1000) NULL,
    imagen_url    VARCHAR(500)  NULL,
    CONSTRAINT fk_productos_categoria FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria),
    CONSTRAINT chk_productos_precio CHECK (precio > 0),
    CONSTRAINT chk_productos_stock CHECK (stock >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS cupones (
    codigo      VARCHAR(20)   PRIMARY KEY,       -- ej. HUERTO10
    porcentaje  DECIMAL(4, 2) NOT NULL,          -- 0.10 = 10 %
    activo      BOOLEAN       NOT NULL DEFAULT TRUE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
