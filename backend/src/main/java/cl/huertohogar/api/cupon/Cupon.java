package cl.huertohogar.api.cupon;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "cupones")
public class Cupon {

    @Id
    @Column(length = 20)
    private String codigo;

    // Descuento en decimal: 0.10 = 10 %.
    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal porcentaje;

    @Column(nullable = false)
    private boolean activo = true;

    protected Cupon() {
    }

    public Cupon(String codigo, BigDecimal porcentaje) {
        this.codigo = codigo;
        this.porcentaje = porcentaje;
    }

    public String getCodigo() {
        return codigo;
    }

    public BigDecimal getPorcentaje() {
        return porcentaje;
    }

    public boolean isActivo() {
        return activo;
    }
}
