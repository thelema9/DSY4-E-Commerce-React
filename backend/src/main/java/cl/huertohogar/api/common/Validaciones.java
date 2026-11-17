package cl.huertohogar.api.common;

/**
 * Expresiones regulares compartidas por los DTOs. Son las mismas reglas que valida el frontend
 * (src/utils/validaciones.js), pero aquí son las que realmente protegen la base de datos.
 */
public final class Validaciones {

    private Validaciones() {
    }

    /** Solo letras (con tildes y ñ) y espacios, de 1 a 50 caracteres. */
    public static final String NOMBRE = "^[A-Za-zÁÉÍÓÚÑáéíóúñ ]{1,50}$";
    public static final String MENSAJE_NOMBRE = "Solo letras y espacios, máximo 50 caracteres.";

    /** Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo (@#$%!.*). */
    public static final String PASSWORD = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%!.*]).{8,}$";
    public static final String MENSAJE_PASSWORD =
            "Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo (@#$%!.*).";

    /** Móvil chileno: 912345678, +56912345678 o "+56 9 1234 5678". Vacío = sin teléfono. */
    public static final String TELEFONO = "^$|^(\\+?56)?\\s?9(\\s?\\d){8}$";
    public static final String MENSAJE_TELEFONO = "Formato de móvil chileno inválido (ej: +56912345678).";

    /** Quita espacios del teléfono; vacío o null se guarda como null. */
    public static String normalizarTelefono(String telefono) {
        if (telefono == null || telefono.isBlank()) {
            return null;
        }
        return telefono.replaceAll("\\s+", "");
    }

    public static String normalizarEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
