import { useState, useEffect, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, Download04Icon, SaveIcon } from "@hugeicons/core-free-icons"
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
  const [editandoSesion, setEditandoSesion] = useState<string | null>(null)
  const [editandoEstados, setEditandoEstados] = useState<Record<string, boolean>>({})
  const [guardando, setGuardando] = useState(false)

  const cargarAsistencias = useCallback(async () => {
    if (!taller.asistencias || taller.asistencias.length === 0) {
      setCargando(false)
      return
    }
    setCargando(true)
    const resultados: Record<string, AsistenciaEstudiante[]> = {}
    await Promise.all(
      taller.asistencias.map(async a => {
        try {
          const res = await tallerService.listarAsistenciaEstudiantesInstructor(taller.id, a.id)
          resultados[a.id] = (res as { estudiantes: AsistenciaEstudiante[] }).estudiantes || []
        } catch {
          resultados[a.id] = []
        }
      })
    )
    setDetalleAsistencias(resultados)
    setCargando(false)
  }, [taller])

  useEffect(() => {
    cargarAsistencias()
  }, [cargarAsistencias])

  const iniciarEdicion = (sesionId: string) => {
    const estudiantes = detalleAsistencias[sesionId] || []
    const estados: Record<string, boolean> = {}
    estudiantes.forEach(e => {
      estados[e.id] = e.asistio
    })
    setEditandoEstados(estados)
    setEditandoSesion(sesionId)
  }

  const cancelarEdicion = () => {
    setEditandoSesion(null)
    setEditandoEstados({})
  }

  const toggleAsistencia = (estudianteId: string) => {
    setEditandoEstados(prev => ({
      ...prev,
      [estudianteId]: !prev[estudianteId],
    }))
  }

  const guardarAsistencia = async () => {
    if (!editandoSesion) return
    setGuardando(true)
    try {
      const estudiantes = detalleAsistencias[editandoSesion] || []
      const asistencias = estudiantes.map(e => ({
        id: e.id,
        asistio: editandoEstados[e.id] ?? e.asistio,
        estado: editandoEstados[e.id] ? "presente" : "ausente",
      }))

      await tallerService.actualizarAsistenciaInstructor(editandoSesion, { estudiantes: asistencias })
      toast.success("Asistencia actualizada")

      setDetalleAsistencias(prev => ({
        ...prev,
        [editandoSesion]: estudiantes.map(e => ({
          ...e,
          asistio: editandoEstados[e.id] ?? e.asistio,
          estado: editandoEstados[e.id] ? "presente" : "ausente",
        })),
      }))

      cancelarEdicion()
    } catch {
      toast.error("Error al guardar asistencia")
    } finally {
      setGuardando(false)
    }
  }

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
              const editando = editandoSesion === sesion.id

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
                        {!editando ? (
                          <button onClick={() => iniciarEdicion(sesion.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all"
                            style={{ backgroundColor: ACCENT }}>
                            <HugeiconsIcon icon={SaveIcon} size={12} />Registrar Asistencia
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={guardarAsistencia} disabled={guardando}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all disabled:opacity-50"
                              style={{ backgroundColor: "oklch(0.50 0.12 150)" }}>
                              <HugeiconsIcon icon={SaveIcon} size={12} />{guardando ? "Guardando..." : "Guardar"}
                            </button>
                            <button onClick={cancelarEdicion}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                              style={{ borderColor: BORDER, color: TEXT_MUTED }}>
                              Cancelar
                            </button>
                          </div>
                        )}
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
                            const asistioEnEdicion = editando ? (editandoEstados[est.id] ?? est.asistio) : est.asistio
                            const estado = editando
                              ? (asistioEnEdicion ? "presente" : "ausente")
                              : (est.estado || (est.asistio ? "presente" : "ausente"))
                            const badge = ESTADO_ASISTENCIA_BADGE[estado] || ESTADO_ASISTENCIA_BADGE.ausente
                            return (
                              <tr key={est.id} className="border-b hover:bg-gray-50/50"
                                style={{
                                  borderColor: BORDER,
                                  cursor: editando ? "pointer" : "default",
                                }}
                                onClick={() => editando && toggleAsistencia(est.id)}>
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
              Las sesiones aparecerán aquí cuando sean registradas
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
