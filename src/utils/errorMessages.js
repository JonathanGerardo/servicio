export function getFriendlyApiMessage(error, fallback = "Ocurrió un error. Inténtalo nuevamente.") {
  const status = error?.response?.status;
  const data = error?.response?.data;

  // Sin respuesta del backend: backend apagado, red caída, CORS, etc.
  if (!error?.response) {
    return "No fue posible conectar con el sistema. Verifica tu conexión e inténtalo nuevamente.";
  }

  // Errores de validación: estos sí pueden mostrarse porque ayudan al usuario.
  if (status === 400 && data?.details && typeof data.details === "object") {
    return Object.values(data.details).join(" ");
  }

  // Sesión vencida o token inválido.
  if (status === 401) {
    return "Tu sesión expiró. Inicia sesión nuevamente.";
  }

  // Sin permisos.
  if (status === 403) {
    return data?.error || "No tienes permiso para realizar esta acción.";
  }

  // Recurso no encontrado.
  if (status === 404) {
    return "No se encontró la información solicitada.";
  }

  // Conflictos útiles: correo ya registrado, dispositivo ya vinculado, etc.
  if (status === 409) {
    return data?.error || "Ya existe un registro con esos datos.";
  }

  // Errores técnicos del servidor: NO mostrar detalle técnico.
  if (status >= 500) {
    return fallback;
  }

  return data?.error || data?.message || fallback;
}