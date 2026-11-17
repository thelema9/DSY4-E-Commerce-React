package cl.huertohogar.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CuponYSeguridadTest extends PruebaApiBase {

    @Test
    @DisplayName("el cupón HUERTO10 es válido (sin distinguir mayúsculas) con 10 % de descuento")
    void cuponValido() throws Exception {
        mvc.perform(get("/api/cupones/huerto10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value("HUERTO10"))
                .andExpect(jsonPath("$.porcentaje").value(0.10));
    }

    @Test
    @DisplayName("un cupón inexistente devuelve 404")
    void cuponInvalido() throws Exception {
        mvc.perform(get("/api/cupones/GRATIS"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje").value("Cupón inválido."));
    }

    @Test
    @DisplayName("CORS permite el origen configurado del frontend")
    void corsOrigenPermitido() throws Exception {
        mvc.perform(options("/api/productos")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Authorization, Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    @DisplayName("CORS rechaza un origen no configurado")
    void corsOrigenRechazado() throws Exception {
        mvc.perform(options("/api/productos")
                        .header("Origin", "http://sitio-malicioso.com")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("el health check del actuator es público")
    void health() throws Exception {
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
