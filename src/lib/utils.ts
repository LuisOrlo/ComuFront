import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseLocalDate(fecha?: string | null): Date {
  if (!fecha) return new Date(NaN)
  const parts = fecha.slice(0, 10).split("-").map(Number)
  if (parts.length < 3 || parts.some((n) => isNaN(n))) return new Date(NaN)
  const [y, m, d] = parts
  return new Date(y, m - 1, d)
}

/** Dates from date columns are calendar values, not UTC instants. */
export function formatCalendarDate(fecha?: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!fecha) return "—"
  const parts = fecha.slice(0, 10).split("-").map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return fecha
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString("es-EC", options ?? { day: "2-digit", month: "long", year: "numeric" })
}

export function todayInEcuador(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" }).format(new Date())
}

export function formatEcuadorDateTime(fecha?: string | null): string {
  if (!fecha) return "—"
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return fecha
  return date.toLocaleString("es-EC", { timeZone: "America/Guayaquil", dateStyle: "medium", timeStyle: "short" })
}

export function getStorageUrl(url?: string | null): string {
  if (!url) return ""
  if (url.startsWith("blob:")) return url
  return url.replace(/^https?:\/\/localhost(?::\d+)?/, "")
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—"
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return formatCalendarDate(dateStr, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString("es-EC", { timeZone: "America/Guayaquil", day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return dateStr
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  activo: { label: "Activo", color: "oklch(0.58 0.16 145)", bg: "oklch(0.58 0.16 145 / 0.1)" },
  finalizado: { label: "Finalizado", color: "oklch(0.55 0.1 260)", bg: "oklch(0.55 0.1 260 / 0.1)" },
  pendiente: { label: "Pendiente", color: "oklch(0.62 0.14 85)", bg: "oklch(0.62 0.14 85 / 0.12)" },
  pagado: { label: "Pagado", color: "oklch(0.58 0.16 145)", bg: "oklch(0.58 0.16 145 / 0.1)" },
  abonado: { label: "Abonado", color: "oklch(0.58 0.16 145)", bg: "oklch(0.58 0.16 145 / 0.1)" },
  anulado: { label: "Anulado", color: "oklch(0.65 0 0)", bg: "oklch(0.85 0 0 / 0.5)" },
  entregado: { label: "Entregado", color: "oklch(0.58 0.16 145)", bg: "oklch(0.58 0.16 145 / 0.1)" },
  confirmada: { label: "Confirmada", color: "oklch(0.58 0.16 145)", bg: "oklch(0.58 0.16 145 / 0.1)" },
  cancelada: { label: "Cancelada", color: "oklch(0.55 0.18 15)", bg: "oklch(0.55 0.18 15 / 0.1)" },
  aprobado: { label: "Aprobado", color: "oklch(0.58 0.16 145)", bg: "oklch(0.58 0.16 145 / 0.1)" },
  rechazado: { label: "Rechazado", color: "oklch(0.55 0.18 15)", bg: "oklch(0.55 0.18 15 / 0.1)" },
  en_progreso: { label: "En progreso", color: "oklch(0.62 0.16 245)", bg: "oklch(0.62 0.16 245 / 0.1)" },
  prestado: { label: "Prestado", color: "oklch(0.62 0.14 85)", bg: "oklch(0.62 0.14 85 / 0.12)" },
  devuelto: { label: "Devuelto", color: "oklch(0.58 0.16 145)", bg: "oklch(0.58 0.16 145 / 0.1)" },
  programado: { label: "Programado", color: "oklch(0.62 0.16 245)", bg: "oklch(0.62 0.16 245 / 0.1)" },
  presente: { label: "Presente", color: "oklch(0.58 0.16 145)", bg: "oklch(0.58 0.16 145 / 0.1)" },
  ausente: { label: "Ausente", color: "oklch(0.55 0.18 15)", bg: "oklch(0.55 0.18 15 / 0.1)" },
  justificado: { label: "Justificado", color: "oklch(0.62 0.14 85)", bg: "oklch(0.62 0.14 85 / 0.12)" },
}

export function getStatus(label: string) {
  return STATUS_COLORS[label] ?? { label, color: "oklch(0.65 0 0)", bg: "oklch(0.85 0 0 / 0.5)" }
}

/**
 * Valida de forma estricta el formato de un correo electrónico en frontend,
 * detectando caracteres inválidos, estructura de dominio y errores comunes (typos).
 */
export function validarEmail(email?: string | null): string | null {
  if (!email || !email.trim()) {
    return "El correo electrónico es requerido"
  }

  const val = email.trim().toLowerCase()

  // No debe contener espacios en ninguna parte
  if (/\s/.test(val)) {
    return "El correo electrónico no puede contener espacios"
  }

  // Estructura general: usuario@dominio.tld
  const emailRegex = /^[a-zA-Z0-9]+([._%+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(val)) {
    return "Formato de correo electrónico inválido (ej: nombre@gmail.com)"
  }

  // Puntos consecutivos o al inicio/fin
  if (val.includes("..") || val.startsWith(".") || val.endsWith(".")) {
    return "El correo electrónico contiene puntos consecutivos o en posición inválida"
  }

  const partes = val.split("@")
  if (partes.length !== 2) {
    return "El correo debe tener un único símbolo '@'"
  }

  const [usuario, dominio] = partes
  if (!usuario || usuario.length < 2) {
    return "El nombre de usuario del correo debe tener al menos 2 caracteres"
  }

  const partesDominio = dominio.split(".")
  const tld = partesDominio[partesDominio.length - 1]

  // Errores tipográficos comunes en la extensión (TLD)
  const typoTlds: Record<string, string> = {
    coimn: ".com",
    coim: ".com",
    coi: ".com",
    cmo: ".com",
    con: ".com",
    comm: ".com",
    coom: ".com",
    col: ".com",
    clm: ".com",
    xom: ".com",
    vom: ".com",
    cim: ".com",
    ocm: ".com",
    kom: ".com",
    gmai: ".com",
    gmali: ".com",
  }

  if (typoTlds[tld]) {
    return `Extensión inválida (.${tld}). ¿Quisiste escribir ${typoTlds[tld]}?`
  }

  // Errores tipográficos comunes en proveedores conocidos
  const typoProveedores: Record<string, string> = {
    "gmai.com": "gmail.com",
    "gamil.com": "gmail.com",
    "gmial.com": "gmail.com",
    "gmaill.com": "gmail.com",
    "hotmial.com": "hotmail.com",
    "hotmai.com": "hotmail.com",
    "outlok.com": "outlook.com",
    "yaho.com": "yahoo.com",
    "yahool.com": "yahoo.com",
  }

  if (typoProveedores[dominio]) {
    return `Proveedor incorrecto (${dominio}). ¿Quisiste escribir ${typoProveedores[dominio]}?`
  }

  // Lista de extensiones de dominio válidas y conocidas
  const tldsValidos = new Set([
    "com", "ec", "net", "org", "edu", "gob", "gov", "mil", "io", "co", "es", "info",
    "biz", "dev", "app", "online", "site", "store", "tech", "xyz", "me", "us", "uk",
    "ar", "pe", "cl", "mx", "br", "tv", "ai", "pro", "live", "academy", "global", "lat",
    "int", "cloud", "agency", "digital", "group", "center", "expert", "club", "space"
  ])

  if (!tldsValidos.has(tld)) {
    return `La extensión (.${tld}) no es válida. Revisa el correo ingresado`
  }

  return null
}
