package cl.huertohogar.api.cupon;

import cl.huertohogar.api.common.Excepciones.NoEncontradoException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/cupones")
@Tag(name = "Cupones", description = "Validación de cupones de descuento")
public class CuponController {

    public record CuponResponse(String codigo, BigDecimal porcentaje) {
    }

    private final CuponRepository cuponRepository;

    public CuponController(CuponRepository cuponRepository) {
        this.cuponRepository = cuponRepository;
    }

    @GetMapping("/{codigo}")
    @Operation(summary = "Validar un cupón (público)", description = "200 { codigo, porcentaje } · 404 si no existe o está inactivo")
    public CuponResponse validar(@PathVariable String codigo) {
        return cuponRepository.findById(codigo.trim().toUpperCase())
                .filter(Cupon::isActivo)
                .map(c -> new CuponResponse(c.getCodigo(), c.getPorcentaje()))
                .orElseThrow(() -> new NoEncontradoException("Cupón inválido."));
    }
}
