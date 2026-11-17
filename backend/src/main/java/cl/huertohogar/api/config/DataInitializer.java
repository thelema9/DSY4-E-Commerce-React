package cl.huertohogar.api.config;

import cl.huertohogar.api.cupon.Cupon;
import cl.huertohogar.api.cupon.CuponRepository;
import cl.huertohogar.api.producto.Categoria;
import cl.huertohogar.api.producto.CategoriaRepository;
import cl.huertohogar.api.producto.Producto;
import cl.huertohogar.api.producto.ProductoRepository;
import cl.huertohogar.api.usuario.NombreRol;
import cl.huertohogar.api.usuario.Rol;
import cl.huertohogar.api.usuario.RolRepository;
import cl.huertohogar.api.usuario.Usuario;
import cl.huertohogar.api.usuario.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Carga los datos mínimos al arrancar. Es idempotente: solo inserta lo que falta,
 * así que se puede reiniciar la app (o el contenedor) sin duplicar nada.
 * Las contraseñas del admin y del cliente demo vienen de variables de entorno, nunca del código.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final CuponRepository cuponRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;
    @Value("${app.admin.password}")
    private String adminPassword;
    @Value("${app.cliente-demo.email}")
    private String clienteEmail;
    @Value("${app.cliente-demo.password:}")
    private String clientePassword;

    public DataInitializer(RolRepository rolRepository, UsuarioRepository usuarioRepository,
                           CategoriaRepository categoriaRepository, ProductoRepository productoRepository,
                           CuponRepository cuponRepository, PasswordEncoder passwordEncoder) {
        this.rolRepository = rolRepository;
        this.usuarioRepository = usuarioRepository;
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
        this.cuponRepository = cuponRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        for (NombreRol nombre : NombreRol.values()) {
            if (rolRepository.findByNombre(nombre).isEmpty()) {
                rolRepository.save(new Rol(nombre));
            }
        }

        crearUsuarioSiFalta("Administrador", adminEmail, adminPassword, NombreRol.ADMIN);
        if (clientePassword != null && !clientePassword.isBlank()) {
            crearUsuarioSiFalta("Cliente Demo", clienteEmail, clientePassword, NombreRol.CLIENTE);
        }

        if (!cuponRepository.existsById("HUERTO10")) {
            cuponRepository.save(new Cupon("HUERTO10", new BigDecimal("0.10")));
        }

        if (productoRepository.count() == 0) {
            cargarCatalogoInicial();
        }
    }

    private void crearUsuarioSiFalta(String nombre, String email, String password, NombreRol rol) {
        String correo = email.trim().toLowerCase();
        if (usuarioRepository.existsByEmail(correo)) {
            return;
        }
        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setEmail(correo);
        usuario.setPasswordHash(passwordEncoder.encode(password));
        usuario.setRegion("Región Metropolitana de Santiago");
        usuario.setComuna("Santiago");
        usuario.setRol(rolRepository.findByNombre(rol).orElseThrow());
        usuarioRepository.save(usuario);
        log.info("Usuario inicial creado: {} ({})", correo, rol);
    }

    // Los 8 productos del catálogo original de HuertoHogar.
    private void cargarCatalogoInicial() {
        producto("FR001", "Manzanas Fuji", "Frutas Frescas", "Origen: Valle del Maule", 1200, 50, "kilo",
                "Manzanas Fuji crujientes y dulces, cultivadas en el Valle del Maule.",
                "https://freshmate.cl/cdn/shop/files/manzanas_fuji_en_bowl_de_madera_21_11zon.webp?v=1724716431");
        producto("FR002", "Naranjas Valencia", "Frutas Frescas", "Rico en vitamina C", 1000, 40, "kilo",
                "Jugosas y dulces, ideales para zumos frescos.",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEERn_QEqcdw8rb-Pr-NHCS6gfr0xgb9p_lAkcOQycDzpqRBdiar16yZk&s=10");
        producto("FR003", "Plátanos Cavendish", "Frutas Frescas", "Rico en potasio", 800, 60, "kilo",
                "Plátanos maduros, perfectos para el desayuno.",
                "https://cdn.tasteatlas.com/images/ingredients/9c0c4471200241dca531e49994960eaf.jpg?w=600");
        producto("VR001", "Zanahorias Orgánicas", "Verduras Orgánicas", "Origen: Región de O'Higgins", 900, 35, "kilo",
                "Zanahorias crujientes cultivadas sin pesticidas.",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLSUgAU50K1nkeIKtKl2_sBRndaZdvnZ5yaR3MZsnpHuTB7n-I6DJNNVrG&s=10");
        producto("VR002", "Espinacas Frescas", "Verduras Orgánicas", "Cultivo orgánico", 700, 25, "bolsa 500g",
                "Espinacas frescas, ideales para ensaladas y batidos verdes.",
                "https://borges1896.com/app/uploads//2021/06/WW-MI-TRUC-20180605-1.jpg");
        producto("VR003", "Pimientos Tricolores", "Verduras Orgánicas", "Ricos en antioxidantes", 1500, 20, "kilo",
                "Pimientos rojos, amarillos y verdes para platos coloridos.",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7o-h_-AVgcQqHUD7XX9jpgGxB8laCQG-WwcmkRNL1Dwya-Qenk0e-PN8&s=10");
        producto("PO001", "Miel Orgánica", "Productos Orgánicos", "100% natural", 5000, 15, "frasco 500g",
                "Miel pura producida por apicultores locales.",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6kYFiUGawvF0F12WBl9DUzqQsVtypd8ePWXQGBXa76qHJCOQtNLNoV8WQ&s=10");
        producto("PL001", "Leche Entera", "Productos Lácteos", "Rica en calcio", 1200, 30, "litro",
                "Leche entera fresca de granjas locales.",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuV6cWewbL3ffJPnqSDezv0vG_8nxmaqKCjPehN0V2XD34CQcrUsVCzKWP&s=10");
        log.info("Catálogo inicial cargado: {} productos", productoRepository.count());
    }

    private void producto(String codigo, String nombre, String categoria, String atributo, int precio, int stock,
                          String unidad, String descripcion, String imagen) {
        Categoria cat = categoriaRepository.findByNombreIgnoreCase(categoria)
                .orElseGet(() -> categoriaRepository.save(new Categoria(categoria)));
        Producto p = new Producto(codigo);
        p.setNombre(nombre);
        p.setCategoria(cat);
        p.setAtributo(atributo);
        p.setPrecio(precio);
        p.setStock(stock);
        p.setUnidad(unidad);
        p.setDescripcion(descripcion);
        p.setImagenUrl(imagen);
        productoRepository.save(p);
    }
}
