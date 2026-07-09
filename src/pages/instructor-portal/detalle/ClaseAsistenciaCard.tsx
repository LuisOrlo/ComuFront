import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { generarReporteAsistenciaPDF, type EstudianteReporte } from "@/lib/generarAsistenciaPDF"
import { toast } from "sonner"
import type { ClaseItem, AsistenciaClaseEstudiante } from "@/services/instructor.service"

interface ClaseAsistenciaCardProps {
  clase: ClaseItem
  asistencias: AsistenciaClaseEstudiante[]
  asistentes: number
  total: number
  pct: number
  cursoId: string
  cursoNombre: string
  onClickVerDetalle?: (claseId: string) => void
}

function formatFechaCorta(f?: string) {
  if (!f) return "—"
  try {
    const d = new Date(f)
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return f
  }
}

export function ClaseAsistenciaCard({ clase, asistencias, asistentes, total, pct, cursoId, cursoNombre, onClickVerDetalle }: ClaseAsistenciaCardProps) {
  const inner = (
    <>
      <div className="min-w-0 space-y-1.5">
        <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
          {formatFechaCorta(clase.fecha_clase)}
        </p>
        {clase.asistencia_registrada ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              <HugeiconsIcon icon={UserGroupIcon} size={14} />
              <span>
                <strong style={{ color: COLORS.CHARCOAL }}>{asistentes}</strong>
                <span className="mx-0.5">/</span>
                <strong style={{ color: COLORS.CHARCOAL }}>{total}</strong>
                {" asistentes"}
              </span>
            </div>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: pct >= 70 ? "#d1fae5" : pct >= 50 ? "#fef3c7" : "#fee2e2",
                color: pct >= 70 ? "#065f46" : pct >= 50 ? "#92400e" : "#991b1b",
              }}
            >
              {pct}%
            </span>
          </div>
        ) : (
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: "oklch(0.93 0.06 20)", color: "oklch(0.55 0.15 20)" }}
          >
            Sin registro
          </span>
        )}
        {clase.observaciones && (
          <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
            📝 {clase.observaciones}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {clase.asistencia_registrada && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const reporte: EstudianteReporte[] = asistencias.map(a => ({
                nombres: a.estudiante?.nombres || a.participante_externo?.nombres || "—",
                apellidos: a.estudiante?.apellidos || a.participante_externo?.apellidos || "—",
                cedula: a.estudiante?.cedula || a.participante_externo?.cedula || "—",
                ciudad: a.estudiante?.ciudad || "—",
                asistio: a.asistio,
              }))
              generarReporteAsistenciaPDF(cursoNombre, formatFechaCorta(clase.fecha_clase), reporte)
                .then(() => toast.success("Reporte descargado"))
                .catch(() => toast.error("Error al generar PDF"))
            }}
            className="relative inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-semibold border transition-all hover:bg-gray-100 hover:border-gray-300"
            style={{ borderColor: "#f1f3f5", color: COLORS.ACCENT }}
          >
            <HugeiconsIcon icon={Download04Icon} size={12} />Reporte
          </button>
        )}
      </div>
    </>
  )

  if (clase.asistencia_registrada) {
    return (
      <div
        onClick={() => onClickVerDetalle?.(clase.id)}
        className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-gray-50/50 cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClickVerDetalle?.(clase.id) }}
      >
        {inner}
      </div>
    )
  }

  return (
    <Link
      to={`/instructor/asistencia/${cursoId}/${clase.id}`}
      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-gray-50/50 no-underline"
    >
      {inner}
    </Link>
  )
}
