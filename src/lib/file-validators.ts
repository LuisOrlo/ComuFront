export function validarComprobante(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Solo se permiten imágenes (JPG, PNG)"
  }
  if (file.size > 20 * 1024 * 1024) {
    return "La imagen no debe superar los 20MB"
  }
  return null
}
