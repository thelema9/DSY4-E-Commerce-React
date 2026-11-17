package cl.huertohogar.api.usuario;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "roles")
public class Rol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idRol;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 20)
    private NombreRol nombre;

    protected Rol() {
    }

    public Rol(NombreRol nombre) {
        this.nombre = nombre;
    }

    public Integer getIdRol() {
        return idRol;
    }

    public NombreRol getNombre() {
        return nombre;
    }
}
