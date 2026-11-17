package cl.huertohogar.api;

import cl.huertohogar.api.usuario.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UsuarioControllerTest extends PruebaApiBase {

    @Autowired
    private UsuarioRepository usuarioRepository;

    private Long idDe(String email) {
        return usuarioRepository.findByEmail(email).orElseThrow().getIdUsuario();
    }

    private Map<String, Object> nuevoUsuario(String email, String rol) {
        Map<String, Object> u = new HashMap<>();
        u.put("nombre", "Pedro Soto");
        u.put("email", email);
        u.put("password", "Clave123!");
        u.put("telefono", null);
        u.put("region", "Región de Valparaíso");
        u.put("comuna", "Viña del Mar");
        u.put("rol", rol);
        return u;
    }

    @Test
    @DisplayName("sin token, /api/usuarios devuelve 401")
    void sinToken() throws Exception {
        mvc.perform(get("/api/usuarios")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("un CLIENTE recibe 403 en todas las operaciones de usuarios")
    void clienteRecibe403() throws Exception {
        String token = tokenCliente();
        Long idAdmin = idDe(ADMIN_EMAIL);

        mvc.perform(conToken(get("/api/usuarios"), token)).andExpect(status().isForbidden());
        mvc.perform(conToken(post("/api/usuarios"), token).content(json(nuevoUsuario("x@correo.com", "ADMIN"))))
                .andExpect(status().isForbidden());
        mvc.perform(conToken(patch("/api/usuarios/" + idAdmin + "/estado"), token).content(json(Map.of("activo", false))))
                .andExpect(status().isForbidden());
        mvc.perform(conToken(delete("/api/usuarios/" + idAdmin), token)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("el ADMIN lista los usuarios sin exponer contraseñas")
    void adminLista() throws Exception {
        mvc.perform(conToken(get("/api/usuarios"), tokenAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$[0].email").value(ADMIN_EMAIL))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("el ADMIN crea un usuario con rol ADMIN (201) y el correo repetido da 409")
    void adminCreaUsuario() throws Exception {
        String token = tokenAdmin();

        mvc.perform(conToken(post("/api/usuarios"), token).content(json(nuevoUsuario("nuevo@correo.com", "ADMIN"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rol").value("ADMIN"));

        mvc.perform(conToken(post("/api/usuarios"), token).content(json(nuevoUsuario("nuevo@correo.com", "CLIENTE"))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("editar sin contraseña mantiene la anterior; el usuario puede seguir entrando")
    void editarSinCambiarContrasena() throws Exception {
        Map<String, Object> cambios = new HashMap<>();
        cambios.put("nombre", "Cliente Editado");
        cambios.put("telefono", "");
        cambios.put("region", "Región del Biobío");
        cambios.put("comuna", "Concepción");
        cambios.put("rol", "CLIENTE");
        cambios.put("password", "");

        mvc.perform(conToken(put("/api/usuarios/" + idDe(CLIENTE_EMAIL)), tokenAdmin()).content(json(cambios)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Cliente Editado"))
                .andExpect(jsonPath("$.email").value(CLIENTE_EMAIL));

        login(CLIENTE_EMAIL, CLIENTE_PASSWORD); // sigue funcionando la contraseña original
    }

    @Test
    @DisplayName("cambiar el rol de otro usuario funciona; el propio rol devuelve 400")
    void cambiarRol() throws Exception {
        String token = tokenAdmin();

        mvc.perform(conToken(patch("/api/usuarios/" + idDe(CLIENTE_EMAIL) + "/rol"), token)
                        .content(json(Map.of("rol", "ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("ADMIN"));

        mvc.perform(conToken(patch("/api/usuarios/" + idDe(ADMIN_EMAIL) + "/rol"), token)
                        .content(json(Map.of("rol", "CLIENTE"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("No puedes cambiar tu propio rol."));
    }

    @Test
    @DisplayName("desactivar a un usuario invalida su sesión: su token pasa a dar 401")
    void desactivarInvalidaSesion() throws Exception {
        String tokenDelCliente = tokenCliente();

        mvc.perform(conToken(patch("/api/usuarios/" + idDe(CLIENTE_EMAIL) + "/estado"), tokenAdmin())
                        .content(json(Map.of("activo", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activo").value(false));

        mvc.perform(conToken(get("/api/auth/me"), tokenDelCliente)).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("el ADMIN no puede desactivarse ni eliminarse a sí mismo")
    void adminNoSeAutoElimina() throws Exception {
        String token = tokenAdmin();
        Long idAdmin = idDe(ADMIN_EMAIL);

        mvc.perform(conToken(patch("/api/usuarios/" + idAdmin + "/estado"), token).content(json(Map.of("activo", false))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("No puedes desactivar tu propia cuenta."));
        mvc.perform(conToken(delete("/api/usuarios/" + idAdmin), token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("No puedes eliminar tu propia cuenta."));
    }

    @Test
    @DisplayName("eliminar devuelve 204, y un id inexistente 404")
    void eliminar() throws Exception {
        String token = tokenAdmin();
        Long idCliente = idDe(CLIENTE_EMAIL);

        mvc.perform(conToken(delete("/api/usuarios/" + idCliente), token)).andExpect(status().isNoContent());
        mvc.perform(conToken(get("/api/usuarios/" + idCliente), token)).andExpect(status().isNotFound());
    }
}
