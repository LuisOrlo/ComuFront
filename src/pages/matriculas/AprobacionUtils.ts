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
  if (!valor || !valor.trim()) return "Ingrese el teléfono o celular"
  if (!DIGITS_ONLY.test(valor)) return "Solo se permiten números"
  if (valor.length !== 10) return "El número debe tener 10 dígitos (ej: 0991234567)"
  return null
}

export function validarCedula(valor: string): string | null {
  if (!valor || !valor.trim()) return "Ingrese la cédula"
  if (!DIGITS_ONLY.test(valor)) return "Solo se permiten números"
  if (valor.length !== 10) return "La cédula debe tener exactamente 10 dígitos"
  return null
}

export function validarTextoSinNumeros(valor: string, label = "Este campo"): string | null {
  if (!valor || !valor.trim()) return `${label} es requerido`
  if (/\d/.test(valor)) return `No se permiten números en ${label.toLowerCase()}`
  if (valor.trim().length < 2) return `${label} debe tener al menos 2 caracteres`
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

export const ESTADO_CIVIL_OPTIONS = [
  { value: "soltero", label: "Soltero(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viudo", label: "Viudo(a)" },
  { value: "union_libre", label: "Unión libre" },
  { value: "otro", label: "Otro" },
]

export const NIVEL_EDUCATIVO_OPTIONS = [
  { value: "educacion inicial", label: "Educación Inicial" },
  { value: "general basica", label: "Educación General Básica" },
  { value: "bachillerato", label: "Bachillerato" },
  { value: "tecnico/tecnologico", label: "Técnico / Tecnológico" },
  { value: "superior", label: "Superior" },
  { value: "otro", label: "Otro" },
]
