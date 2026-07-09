import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, Download04Icon } from "@hugeicons/core-free-icons"
import { COLORS, ESTADO_ASISTENCIA_BADGE } from "@/lib/constants"
import { tallerService, type Taller, type AsistenciaEstudiante } from "@/services/taller.service"
import { generarReporteAsistenciaPDF, type EstudianteReporte } from "@/lib/generarAsistenciaPDF"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function formatFecha(f?: string): string {
  if (!f) return "—"
  try {
    const d = new Date(f.substring(0, 10) + "T12:00:00")
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
  } catch { return f }
}

interface Props {
  taller: Taller
}

export function TallerAsistencia({ taller }: Props) {
  const [detalleAsistencias, setDetalleAsistencias] = useState<Record<string, AsistenciaEstudiante[]>>({})
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!taller.asistencias || taller.asistencias.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCargando(false)
      return
    }
    const cargar = async () => {
      const resultados: Record<string, AsistenciaEstudiante[]> = {}
      await Promise.all(
        taller.asistencias!.map(async a => {
          try {
            const res = await tallerService.listarAsistenciaEstudiantes(taller.id, a.id)
            resultados[a.id] = (res as { estudiantes: AsistenciaEstudiante[] }).estudiantes || []
          } catch {
            resultados[a.id] = []
          }
        })
      )
      setDetalleAsistencias(resultados)
      setCargando(false)
    }
    cargar()
  }, [taller])

  const asistencias = taller.asistencias || []

  return (
    <div className="space-y-5">
      {asistencias.length > 0 ? (
        <div className="space-y-5">
          {cargando ? (
            <div className="bg-white rounded-xl border p-12 text-center text-sm" style={{ borderColor: BORDER, color: TEXT_MUTED }}>
              Cargando detalle de asistencias...
            </div>
          ) : (
            asistencias.map(sesion => {
              const estudiantes = detalleAsistencias[sesion.id] || []
              const pct = sesion.capacidad_registrada > 0
                ? Math.round((sesion.asistentes / sesion.capacidad_registrada) * 100)
                : 0

              return (
                <div key={sesion.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
                  <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-3">
                        <p className="text-sm font-bold" style={{ color: CHARCOAL }}>
                          {formatFecha(sesion.fecha_sesion)}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: TEXT_MUTED }}>
                            <HugeiconsIcon icon={UserGroupIcon} size={14} />
                            <span>
                              <strong style={{ color: CHARCOAL }}>{sesion.asistentes}</strong>
                              <span className="mx-0.5">/</span>
                              <strong style={{ color: CHARCOAL }}>{sesion.capacidad_registrada}</strong>
                              {" asistentes"}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: pct >= 70 ? "#d1fae5" : pct >= 50 ? "#fef3c7" : "#fee2e2",
                              color: pct >= 70 ? "#065f46" : pct >= 50 ? "#92400e" : "#991b1b"
                            }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => {
                          const reporte: EstudianteReporte[] = estudiantes.map(e => ({
                            nombres: e.inscripcion_taller?.nombres || "—",
                            apellidos: e.inscripcion_taller?.apellidos || "—",
                            cedula: e.inscripcion_taller?.cedula || "—",
                            ciudad: e.inscripcion_taller?.ciudad || "—",
                            asistio: e.asistio,
                          }))
                          generarReporteAsistenciaPDF(
                            taller.nombre || "",
                            formatFecha(sesion.fecha_sesion),
                            reporte,
                          ).then(() => toast.success("Reporte descargado"))
                            .catch(() => toast.error("Error al generar PDF"))
                        }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                          style={{ borderColor: BORDER, color: ACCENT, backgroundColor: `color-mix(in srgb, ${ACCENT} 8%, transparent)` }}>
                          <HugeiconsIcon icon={Download04Icon} size={12} />Descargar Reporte
                        </button>
                      </div>
                    </div>
                    {sesion.observaciones && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: BORDER }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: TEXT_MUTED }}>Observaciones</p>
                        <p className="text-sm" style={{ color: CHARCOAL }}>{sesion.observaciones}</p>
                      </div>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    {estudiantes.length === 0 ? (
                      <div className="p-8 text-center text-sm" style={{ color: TEXT_MUTED }}>
                        No hay estudiantes registrados en esta sesión
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b" style={{ borderColor: BORDER }}>
                            <th className="text-left font-semibold px-5 py-3" style={{ color: TEXT_MUTED }}>Nombres</th>
                            <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Apellidos</th>
                            <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Cédula</th>
                            <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Ciudad</th>
                            <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Asistió</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estudiantes.map(est => {
                            const estado = est.estado || (est.asistio ? "presente" : "ausente")
                            const badge = ESTADO_ASISTENCIA_BADGE[estado] || ESTADO_ASISTENCIA_BADGE.ausente
                            return (
                              <tr key={est.id} className="border-b hover:bg-gray-50/50" style={{ borderColor: BORDER }}>
                                <td className="px-5 py-3 font-semibold whitespace-nowrap" style={{ color: CHARCOAL }}>
                                  {est.inscripcion_taller?.nombres || "—"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap" style={{ color: CHARCOAL }}>
                                  {est.inscripcion_taller?.apellidos || "—"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap" style={{ color: TEXT_MUTED }}>
                                  {est.inscripcion_taller?.cedula || "—"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap" style={{ color: TEXT_MUTED }}>
                                  {est.inscripcion_taller?.ciudad || "—"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold"
                                    style={{ backgroundColor: badge.bg, color: badge.text }}>
                                    {badge.label}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border" style={{ borderColor: BORDER }}>
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: TEXT_MUTED }}>No hay registros de asistencia</p>
            <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
              Las sesiones aparecerán aquí cuando el administrador las registre
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
