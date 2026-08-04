/* eslint-disable @typescript-eslint/no-explicit-any */

import { getStorageUrl } from "@/lib/utils"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DIGITS_ONLY = /^\d*$/

export function getFieldValue(datos: any, field: string): string {
  if (!datos) return "—"
  const val = datos.perfil_estudiante?.[field] ?? datos[field]
  if (field === "edad" && val != null) return `${val} años`
  return val ?? "—"
}

export function fixImageUrl(url: string): string {
  return getStorageUrl(url)
}

export function validarTelefono(valor: string): string | null {
  if (!DIGITS_ONLY.test(valor)) return "Solo se permiten números"
  if (valor.length > 10) return "Máximo 10 dígitos"
  return null
}

export function validarCedula(valor: string): string | null {
  if (!DIGITS_ONLY.test(valor)) return "Solo se permiten números"
  return null
}

export function validarEmail(valor: string): string | null {
  if (!EMAIL_REGEX.test(valor)) return "Correo electrónico inválido"
  return null
}

export function validarEdad(valor: string): string | null {
  if (!valor || !valor.trim()) return "Ingrese una edad"
  const edad = Number(valor)
  if (isNaN(edad)) return "Debe ser un número"
  if (edad < 10) return "Debe tener al menos 10 años"
  if (edad > 70) return "La edad máxima es 70 años"
  return null
}

export function validarImagen(file: File, maxSizeMB: number): string | null {
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `La imagen no debe superar los ${maxSizeMB}MB`
  }
  return null
}
