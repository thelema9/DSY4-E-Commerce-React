package cl.huertohogar.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductoControllerTest extends PruebaApiBase {

    private Map<String, Object> producto(String codigo) {
        Map<String, Object> p = new HashMap<>();
        p.put("codigo", codigo);
        p.put("nombre", "Palta Hass");
        p.put("categoria", "Frutas Frescas");
        p.put("atributo", "Cremosa");
        p.put("precio", 2500);
        p.put("stock", 12);
        p.put("unidad", "kilo");
        p.put("descripcion", "Paltas maduras.");
        p.put("imagen", "https://ejemplo.com/palta.jpg");
        return p;
    }

    @Test
    @DisplayName("GET /api/productos es público y trae el catálogo inicial")
    void listarPublico() throws Exception {
        mvc.perform(get("/api/productos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(8)))
                .andExpect(jsonPath("$[0].codigo").value("FR001"))
                .andExpect(jsonPath("$[0].categoria").value("Frutas Frescas"))
                .andExpect(jsonPath("$[0].imagen").exists());
    }

    @Test
    @DisplayName("un token inválido en una ruta pública no rompe la petición")
    void tokenInvalidoEnRutaPublica() throws Exception {
        mvc.perform(get("/api/productos").header("Authorization", "Bearer token-falso"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET de un producto inexistente devuelve 404")
    void detalleInexistente() throws Exception {
        mvc.perform(get("/api/productos/ZZ999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje").value("No existe el producto ZZ999."));
    }

    @Test
    @DisplayName("POST sin token devuelve 401")
    void crearSinToken() throws Exception {
        mvc.perform(post("/api/productos").contentType(MediaType.APPLICATION_JSON).content(json(producto("FR009"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("un CLIENTE recibe 403 al crear, editar o eliminar productos")
    void clienteNoAdministraProductos() throws Exception {
        String token = tokenCliente();

        mvc.perform(conToken(post("/api/productos"), token).content(json(producto("FR009"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensaje").value("No tienes permisos para realizar esta acción."));
        mvc.perform(conToken(put("/api/productos/FR001"), token).content(json(producto("FR001"))))
                .andExpect(status().isForbidden());
        mvc.perform(conToken(delete("/api/productos/FR001"), token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("el ADMIN crea un producto: 201, código en mayúsculas y header Location")
    void adminCreaProducto() throws Exception {
        mvc.perform(conToken(post("/api/productos"), tokenAdmin()).content(json(producto(" fr009 "))))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/productos/FR009"))
                .andExpect(jsonPath("$.codigo").value("FR009"))
                .andExpect(jsonPath("$.stock").value(12));

        mvc.perform(get("/api/productos/FR009")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("crear con un código existente devuelve 409")
    void crearCodigoDuplicado() throws Exception {
        mvc.perform(conToken(post("/api/productos"), tokenAdmin()).content(json(producto("FR001"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value("Ya existe un producto con el código FR001."));
    }

    @Test
    @DisplayName("precio 0, stock negativo o sin código devuelven 400 con errores por campo")
    void crearInvalido() throws Exception {
        Map<String, Object> p = producto("");
        p.put("precio", 0);
        p.put("stock", -1);

        mvc.perform(conToken(post("/api/productos"), tokenAdmin()).content(json(p)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.codigo").value("El código es obligatorio."))
                .andExpect(jsonPath("$.errores.precio").value("El precio debe ser mayor a 0."))
                .andExpect(jsonPath("$.errores.stock").value("El stock debe ser mayor o igual a 0."));
    }

    @Test
    @DisplayName("el ADMIN edita un producto; una categoría nueva se crea sola")
    void adminEditaProducto() throws Exception {
        Map<String, Object> cambios = producto("IGNORADO");
        cambios.put("nombre", "Manzanas Premium");
        cambios.put("categoria", "Frutas de Temporada");

        mvc.perform(conToken(put("/api/productos/FR001"), tokenAdmin()).content(json(cambios)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value("FR001"))
                .andExpect(jsonPath("$.nombre").value("Manzanas Premium"))
                .andExpect(jsonPath("$.categoria").value("Frutas de Temporada"));
    }

    @Test
    @DisplayName("editar un producto inexistente devuelve 404")
    void editarInexistente() throws Exception {
        mvc.perform(conToken(put("/api/productos/ZZ999"), tokenAdmin()).content(json(producto("ZZ999"))))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("eliminar devuelve 204 y luego el producto ya no existe (404)")
    void adminEliminaProducto() throws Exception {
        mvc.perform(conToken(delete("/api/productos/PL001"), tokenAdmin()))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/productos/PL001")).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/categorias es público")
    void categorias() throws Exception {
        mvc.perform(get("/api/categorias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)));
    }
}
