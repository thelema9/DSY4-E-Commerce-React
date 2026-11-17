package cl.huertohogar.api;

import cl.huertohogar.api.usuario.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest extends PruebaApiBase {

    @Autowired
    private UsuarioRepository usuarioRepository;

    private Map<String, Object> registroValido(String email) {
        Map<String, Object> datos = new HashMap<>();
        datos.put("nombre", "Pedro Soto");
        datos.put("email", email);
        datos.put("password", "Clave123!");
        datos.put("telefono", "+56 9 1234 5678");
        datos.put("region", "Región de Valparaíso");
        datos.put("comuna", "Viña del Mar");
        return datos;
    }

    @Test
    @DisplayName("login correcto devuelve 200 con el token y el rol del usuario")
    void loginCorrecto() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "  ADMIN@huertohogar.cl ", "password", ADMIN_PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", not(emptyString())))
                .andExpect(jsonPath("$.usuario.email").value(ADMIN_EMAIL))
                .andExpect(jsonPath("$.usuario.rol").value("ADMIN"))
                .andExpect(jsonPath("$.usuario.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("login con contraseña incorrecta devuelve 401 con el mensaje")
    void loginContrasenaIncorrecta() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", ADMIN_EMAIL, "password", "Incorrecta1!"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Correo o contraseña incorrectos."));
    }

    @Test
    @DisplayName("login de una cuenta desactivada devuelve 403")
    void loginCuentaDesactivada() throws Exception {
        usuarioRepository.findByEmail(CLIENTE_EMAIL).orElseThrow().setActivo(false);

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", CLIENTE_EMAIL, "password", CLIENTE_PASSWORD))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensaje").value("Tu cuenta está desactivada."));
    }

    @Test
    @DisplayName("registro crea un CLIENTE (201) aunque el JSON pida rol ADMIN")
    void registroSiempreCliente() throws Exception {
        Map<String, Object> datos = registroValido("pedro@correo.com");
        datos.put("rol", "ADMIN");

        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON).content(json(datos)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rol").value("CLIENTE"))
                .andExpect(jsonPath("$.activo").value(true))
                .andExpect(jsonPath("$.telefono").value("+56912345678"));
    }

    @Test
    @DisplayName("la contraseña se guarda hasheada con BCrypt, nunca en texto plano")
    void contrasenaHasheada() throws Exception {
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                        .content(json(registroValido("hash@correo.com"))))
                .andExpect(status().isCreated());

        String hash = usuarioRepository.findByEmail("hash@correo.com").orElseThrow().getPasswordHash();
        assertThat(hash).startsWith("$2").isNotEqualTo("Clave123!");
    }

    @Test
    @DisplayName("registro con un correo existente devuelve 409")
    void registroCorreoDuplicado() throws Exception {
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                        .content(json(registroValido(CLIENTE_EMAIL))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value("Ya existe una cuenta con este correo."));
    }

    @Test
    @DisplayName("registro con datos inválidos devuelve 400 con errores por campo")
    void registroInvalido() throws Exception {
        Map<String, Object> datos = registroValido("no-es-correo");
        datos.put("password", "debil");

        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON).content(json(datos)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.email").exists())
                .andExpect(jsonPath("$.errores.password").exists());
    }

    @Test
    @DisplayName("GET /api/auth/me devuelve el usuario del token, y 401 sin token")
    void perfil() throws Exception {
        mvc.perform(conToken(get("/api/auth/me"), tokenCliente()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(CLIENTE_EMAIL));

        mvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Debes iniciar sesión para continuar."));
    }
}
