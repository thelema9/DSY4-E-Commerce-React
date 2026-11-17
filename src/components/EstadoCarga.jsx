// Indicadores reutilizables para los estados de carga y error de las llamadas a la API.

export function Cargando({ texto = "Cargando..." }) {
  return (
    <div className="d-flex align-items-center gap-2 my-4 justify-content-center" role="status">
      <span className="spinner-border spinner-border-sm text-success" aria-hidden="true"></span>
      <span>{texto}</span>
    </div>
  );
}

export function MensajeError({ mensaje, onReintentar }) {
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <span>{mensaje}</span>
      {onReintentar && (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}
