/* eslint-disable @typescript-eslint/no-explicit-any */

export function getFieldValue(datos: any, field: string): string {
  if (!datos) return "—"
  const val = datos.perfil_estudiante?.[field] ?? datos[field]
  if (field === "edad" && val != null) return `${val} años`
  return val ?? "—"
}

export function fixImageUrl(url: string): string {
  if (!url) return url
  return url.replace(/^https?:\/\/localhost(?::\d+)?/, "")
}

export function calcularEdad(fecha: string): string {
  if (!fecha) return ""
  const nacimiento = new Date(fecha)
  if (isNaN(nacimiento.getTime())) return ""
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mesDiff = hoy.getMonth() - nacimiento.getMonth()
  if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  return edad >= 0 ? String(edad) : ""
}
