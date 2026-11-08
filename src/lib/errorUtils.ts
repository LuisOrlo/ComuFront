/**
 * Utilidad para sanitizar y formatear mensajes de error de la API
 * evitando que excepciones internas (SQLSTATE, uuid, nombres de tablas/columnas)
 * o cadenas en inglés se muestren directamente al usuario final.
 */

const FIELD_LABELS: Record<string, string> = {
  archivo_comprobante: "Comprobante de pago",
  archivo_cedula: "Documento de cédula",
  archivo_cedula_url: "Documento de cédula",
  curso_abierto_id: "Curso seleccionado",
  cedula: "Cédula o documento",
  correo: "Correo electrónico",
  nombres: "Nombres",
  apellidos: "Apellidos",
  celular: "Teléfono celular",
  monto_solicitado: "Monto a pagar",
  monto_declarado: "Monto declarado",
  tipo_pago: "Tipo de pago",
  tipo_comprobante: "Tipo de comprobante",
  fecha_pago_declarada: "Fecha de pago",
  tipo_id: "Tipo de documento",
  ciudad: "Ciudad",
  edad: "Edad",
  direccion: "Dirección",
  ocupacion: "Ocupación",
  estado_civil: "Estado civil",
  nivel_educativo: "Nivel educativo",
}

function isTechnicalError(str: string): boolean {
  if (!str) return false
  const lower = str.toLowerCase()
  return (
    lower.includes("sqlstate") ||
    lower.includes("syntax error") ||
    lower.includes("type uuid") ||
    lower.includes("integrity constraint") ||
    lower.includes("call to undefined") ||
    lower.includes("column not found") ||
    lower.includes("stack trace") ||
    lower.includes("internal server error") ||
    lower.includes("pdoexception") ||
    lower.includes("database query") ||
    lower.includes("violates foreign key") ||
    lower.includes("numeric value out of range") ||
    lower.includes("could not connect to server")
  )
}

export function getFriendlyErrorMessage(err: unknown, defaultMessage = "Error al enviar la solicitud"): string {
  if (!err || typeof err !== "object") return defaultMessage

  const axiosError = err as {
    response?: {
      status?: number
      data?: {
        mensaje?: unknown
        message?: unknown
        errores?: unknown
        errors?: Record<string, string[] | string>
      }
    }
    message?: string
  }

  const data = axiosError.response?.data
  const status = axiosError.response?.status

  if (!data) {
    if (axiosError.message === "Network Error" || !axiosError.response) {
      return "No se pudo conectar con el servidor. Por favor verifique su conexión a internet."
    }
    return defaultMessage
  }

  const detailList: string[] = []

  // Errores de validación personalizados en array 'errores'
  if (Array.isArray(data.errores)) {
    data.errores.forEach((item) => {
      if (typeof item === "string" && !isTechnicalError(item)) {
        detailList.push(item)
      }
    })
  }

  // Errores de validación estándar de Laravel en objeto 'errors'
  if (data.errors && typeof data.errors === "object") {
    Object.entries(data.errors).forEach(([field, msgs]) => {
      const fieldName = FIELD_LABELS[field] || field
      const list = Array.isArray(msgs) ? msgs : [msgs]
      list.forEach((msg) => {
        if (typeof msg === "string" && !isTechnicalError(msg)) {
          // Si el mensaje contiene el nombre crudo del campo, reemplazarlo por la etiqueta amigable
          const sanitized = msg.replace(new RegExp(`\\b${field}\\b`, "gi"), fieldName)
          detailList.push(sanitized)
        }
      })
    })
  }

  // Mensaje principal de la respuesta
  let rawMsg = typeof data.mensaje === "string" ? data.mensaje : typeof data.message === "string" ? data.message : ""

  if (isTechnicalError(rawMsg)) {
    rawMsg =
      status === 422
        ? "Los datos enviados contienen inconsistencias. Por favor verifique el formulario."
        : "Ocurrió un inconveniente al procesar la solicitud. Por favor intente más tarde."
  } else if (rawMsg.toLowerCase() === "the given data was invalid.") {
    rawMsg = "Por favor verifique los datos ingresados en el formulario."
  }

  if (detailList.length > 0) {
    const uniqueDetails = Array.from(new Set(detailList))
    if (!rawMsg || rawMsg === "Por favor verifique los datos ingresados en el formulario.") {
      return uniqueDetails.join("\n")
    }
    return `${rawMsg}\n${uniqueDetails.join("\n")}`
  }

  return rawMsg || defaultMessage
}
