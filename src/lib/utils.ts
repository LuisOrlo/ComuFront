import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStorageUrl(url?: string | null): string {
  if (!url) return ""
  if (url.startsWith("blob:")) return url
  return url.replace(/^https?:\/\/localhost(?::\d+)?/, "")
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—"
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
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
