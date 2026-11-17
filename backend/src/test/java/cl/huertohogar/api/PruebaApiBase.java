package cl.huertohogar.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base de las pruebas de la API: levanta la aplicación completa con H2 (perfil "test")
 * y la llama por HTTP simulado con MockMvc, pasando por Spring Security de verdad.
 * Cada prueba corre en una transacción que se revierte al terminar: no se afectan entre sí.
 * Los usuarios admin y cliente demo los crea DataInitializer (contraseñas en application-test.yml).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public abstract class PruebaApiBase {

    protected static final String ADMIN_EMAIL = "admin@huertohogar.cl";
    protected static final String ADMIN_PASSWORD = "Admin123!";
    protected static final String CLIENTE_EMAIL = "cliente@huertohogar.cl";
    protected static final String CLIENTE_PASSWORD = "Cliente123!";

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper objectMapper;

    protected String json(Object cuerpo) throws Exception {
        return objectMapper.writeValueAsString(cuerpo);
    }

    /** Hace login y devuelve el JWT. */
    protected String login(String email, String password) throws Exception {
        String respuesta = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.token");
    }

    protected String tokenAdmin() throws Exception {
        return login(ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    protected String tokenCliente() throws Exception {
        return login(CLIENTE_EMAIL, CLIENTE_PASSWORD);
    }

    /** Agrega el header Authorization: Bearer <token> y el Content-Type JSON. */
    protected MockHttpServletRequestBuilder conToken(MockHttpServletRequestBuilder peticion, String token) {
        return peticion.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON);
    }
}
