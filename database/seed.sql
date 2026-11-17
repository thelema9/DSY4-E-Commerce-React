-- =====================================================================
-- HuertoHogar · Datos iniciales (MySQL 8)
-- Roles, categorías, el catálogo original de 8 productos y el cupón HUERTO10.
-- Los USUARIOS no van aquí: los crea la API al arrancar (DataInitializer) con la contraseña
-- hasheada en BCrypt a partir de las variables ADMIN_PASSWORD / CLIENTE_DEMO_PASSWORD.
-- INSERT IGNORE: se puede ejecutar más de una vez sin duplicar.
-- =====================================================================

SET NAMES utf8mb4;

INSERT IGNORE INTO roles (nombre) VALUES ('ADMIN'), ('CLIENTE');

INSERT IGNORE INTO categorias (nombre) VALUES
    ('Frutas Frescas'), ('Verduras Orgánicas'), ('Productos Orgánicos'), ('Productos Lácteos');

INSERT IGNORE INTO productos (codigo, nombre, id_categoria, atributo, precio, stock, unidad, descripcion, imagen_url)
SELECT p.codigo, p.nombre, c.id_categoria, p.atributo, p.precio, p.stock, p.unidad, p.descripcion, p.imagen_url
FROM (
    SELECT 'FR001' AS codigo, 'Manzanas Fuji' AS nombre, 'Frutas Frescas' AS categoria, 'Origen: Valle del Maule' AS atributo,
           1200 AS precio, 50 AS stock, 'kilo' AS unidad,
           'Manzanas Fuji crujientes y dulces, cultivadas en el Valle del Maule.' AS descripcion,
           'https://freshmate.cl/cdn/shop/files/manzanas_fuji_en_bowl_de_madera_21_11zon.webp?v=1724716431' AS imagen_url
    UNION ALL SELECT 'FR002', 'Naranjas Valencia', 'Frutas Frescas', 'Rico en vitamina C', 1000, 40, 'kilo',
           'Jugosas y dulces, ideales para zumos frescos.',
           'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEERn_QEqcdw8rb-Pr-NHCS6gfr0xgb9p_lAkcOQycDzpqRBdiar16yZk&s=10'
    UNION ALL SELECT 'FR003', 'Plátanos Cavendish', 'Frutas Frescas', 'Rico en potasio', 800, 60, 'kilo',
           'Plátanos maduros, perfectos para el desayuno.',
           'https://cdn.tasteatlas.com/images/ingredients/9c0c4471200241dca531e49994960eaf.jpg?w=600'
    UNION ALL SELECT 'VR001', 'Zanahorias Orgánicas', 'Verduras Orgánicas', 'Origen: Región de O''Higgins', 900, 35, 'kilo',
           'Zanahorias crujientes cultivadas sin pesticidas.',
           'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLSUgAU50K1nkeIKtKl2_sBRndaZdvnZ5yaR3MZsnpHuTB7n-I6DJNNVrG&s=10'
    UNION ALL SELECT 'VR002', 'Espinacas Frescas', 'Verduras Orgánicas', 'Cultivo orgánico', 700, 25, 'bolsa 500g',
           'Espinacas frescas, ideales para ensaladas y batidos verdes.',
           'https://borges1896.com/app/uploads//2021/06/WW-MI-TRUC-20180605-1.jpg'
    UNION ALL SELECT 'VR003', 'Pimientos Tricolores', 'Verduras Orgánicas', 'Ricos en antioxidantes', 1500, 20, 'kilo',
           'Pimientos rojos, amarillos y verdes para platos coloridos.',
           'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7o-h_-AVgcQqHUD7XX9jpgGxB8laCQG-WwcmkRNL1Dwya-Qenk0e-PN8&s=10'
    UNION ALL SELECT 'PO001', 'Miel Orgánica', 'Productos Orgánicos', '100% natural', 5000, 15, 'frasco 500g',
           'Miel pura producida por apicultores locales.',
           'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6kYFiUGawvF0F12WBl9DUzqQsVtypd8ePWXQGBXa76qHJCOQtNLNoV8WQ&s=10'
    UNION ALL SELECT 'PL001', 'Leche Entera', 'Productos Lácteos', 'Rica en calcio', 1200, 30, 'litro',
           'Leche entera fresca de granjas locales.',
           'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuV6cWewbL3ffJPnqSDezv0vG_8nxmaqKCjPehN0V2XD34CQcrUsVCzKWP&s=10'
) AS p
JOIN categorias c ON c.nombre = p.categoria;

INSERT IGNORE INTO cupones (codigo, porcentaje, activo) VALUES ('HUERTO10', 0.10, TRUE);
