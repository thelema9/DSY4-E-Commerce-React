package cl.huertohogar.api.common;

/**
 * Excepciones de negocio. GlobalExceptionHandler las traduce a su código HTTP.
 */
public final class Excepciones {

    private Excepciones() {
    }

    /** 404: el recurso pedido no existe. */
    public static class NoEncontradoException extends RuntimeException {
        public NoEncontradoException(String mensaje) {
            super(mensaje);
        }
    }

    /** 409: el recurso ya existe (correo o código de producto repetido). */
    public static class ConflictoException extends RuntimeException {
        public ConflictoException(String mensaje) {
            super(mensaje);
        }
    }

    /** 400: la operación no está permitida por una regla del negocio. */
    public static class ReglaNegocioException extends RuntimeException {
        public ReglaNegocioException(String mensaje) {
            super(mensaje);
        }
    }
}
