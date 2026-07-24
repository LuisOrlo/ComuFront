export function validarComprobante(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Solo se permiten imágenes (JPG, PNG)"
  }
  if (file.size > 5 * 1024 * 1024) {
    return "La imagen no debe superar los 5MB"
  }
  return null
}
