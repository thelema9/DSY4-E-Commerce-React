package cl.huertohogar.api.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * Documentación Swagger en /swagger-ui.html. El botón "Authorize" acepta el JWT del login.
 */
@Configuration
@OpenAPIDefinition(info = @Info(title = "HuertoHogar API", version = "1.0.0",
        description = "API REST de HuertoHogar: login con JWT y roles, CRUD de productos y de usuarios."))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {
}
