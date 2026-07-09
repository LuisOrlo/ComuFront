import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, UserGroupIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { COLORS, ESTADO_ASISTENCIA_BADGE } from "@/lib/constants"
import { generarReporteAsistenciaPDF, type EstudianteReporte } from "@/lib/generarAsistenciaPDF"
import { toast } from "sonner"
import type { ClaseItem, AsistenciaClaseEstudiante } from "@/services/instructor.service"

interface ClaseAsistenciaDetalleProps {
  clase: ClaseItem
  asistencias: AsistenciaClaseEstudiante[]
  asistentes: number
  total: number
  pct: number
  cursoNombre: string
  onVolver: () => void
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

function getNombre(a: AsistenciaClaseEstudiante) {
  if (a.estudiante) return `${a.estudiante.nombres} ${a.estudiante.apellidos}`
  if (a.participante_externo) return `${a.participante_externo.nombres} ${a.participante_externo.apellidos}`
  return "—"
}

function getCedula(a: AsistenciaClaseEstudiante) {
  return a.estudiante?.cedula ?? a.participante_externo?.cedula ?? "—"
}

export function ClaseAsistenciaDetalle({ clase, asistencias, asistentes, total, pct, cursoNombre, onVolver }: ClaseAsistenciaDetalleProps) {
  const handleDownloadReporte = () => {
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
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onVolver}
        className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-70"
        style={{ color: COLORS.TEXT_MUTED }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver al listado
      </button>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#f1f3f5" }}>
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b" style={{ borderColor: "#f1f3f5" }}>
          <div className="space-y-1.5">
            <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
              {formatFechaCorta(clase.fecha_clase)}
            </p>
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
          </div>
          <button
            onClick={handleDownloadReporte}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all hover:bg-gray-100 hover:border-gray-300 active:scale-[0.97]"
            style={{ borderColor: "#f1f3f5", color: COLORS.ACCENT }}
          >
            <HugeiconsIcon icon={Download04Icon} size={14} />Reporte PDF
          </button>
        </div>

        {clase.observaciones && (
          <div className="px-5 py-3 border-b" style={{ borderColor: "#f1f3f5", backgroundColor: "#fafafa" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: COLORS.TEXT_MUTED }}>
              Observaciones
            </p>
            <p className="text-sm" style={{ color: COLORS.CHARCOAL }}>{clase.observaciones}</p>
          </div>
        )}

        {asistencias.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>
            Sin datos de asistencia
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#f1f3f5" }}>
                  <th className="text-left font-semibold px-5 py-3 text-[11px] uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Estudiante</th>
                  <th className="text-left font-semibold px-4 py-3 text-[11px] uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Cédula</th>
                  <th className="text-left font-semibold px-4 py-3 text-[11px] uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Asistió</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#f1f3f5" }}>
                {asistencias.map(a => {
                  const estadoActual = a.estado || (a.asistio ? "presente" : "ausente")
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium whitespace-nowrap" style={{ color: COLORS.CHARCOAL }}>
                        {getNombre(a)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: COLORS.TEXT_MUTED }}>
                        {getCedula(a)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold"
                          style={{
                            backgroundColor: ESTADO_ASISTENCIA_BADGE[estadoActual]?.bg || "#fee2e2",
                            color: ESTADO_ASISTENCIA_BADGE[estadoActual]?.text || "#991b1b",
                          }}
                        >
                          {ESTADO_ASISTENCIA_BADGE[estadoActual]?.label || "No"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
