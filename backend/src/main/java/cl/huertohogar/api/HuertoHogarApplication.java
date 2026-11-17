package cl.huertohogar.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// Se excluye el usuario en memoria que Spring crea por defecto: aquí los usuarios están en MySQL
// y la autenticación es con JWT (ver security/JwtAuthFilter).
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class HuertoHogarApplication {

    public static void main(String[] args) {
        SpringApplication.run(HuertoHogarApplication.class, args);
    }
}
