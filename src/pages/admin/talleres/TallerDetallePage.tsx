/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Edit01Icon, Delete01Icon, Download01Icon,
  UserGroupIcon, CalendarIcon, Money01Icon, CheckmarkCircle01Icon,
  Image01Icon, Search01Icon, Download04Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { getStorageUrl } from "@/lib/utils"
import { tallerService, type Taller, type InscripcionTaller, type AsistenciaEstudiante } from "@/services/taller.service"
import { generarListadoAsistenciaPDF, generarReporteAsistenciaPDF, generarListadoParticipantesPDF, type EstudianteReporte, type ParticipanteReporte } from "@/lib/generarAsistenciaPDF"
import { ESTADO_ASISTENCIA_BADGE } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

const ESTADO_BADGE: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: "oklch(0.92 0.05 80)", text: "oklch(0.55 0.12 70)" },
  confirmado: { bg: "oklch(0.92 0.08 140)", text: "oklch(0.45 0.12 140)" },
  completado: { bg: "oklch(0.95 0 0)", text: "oklch(0.45 0 0)" },
  cancelado: { bg: "oklch(0.93 0.06 20)", text: "oklch(0.55 0.15 20)" },
}

type Tab = "info" | "participantes" | "pagos" | "asistencia"

export function TallerDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin, isSecretaria } = usePermission()
  const [taller, setTaller] = useState<Taller | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("info")
  const [searchParticipantes, setSearchParticipantes] = useState("")
  const [inscripciones, setInscripciones] = useState<InscripcionTaller[]>([])
  const [loadingInscripciones, setLoadingInscripciones] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<InscripcionTaller | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [financieroData, setFinancieroData] = useState<any>(null)
  const [transacciones, setTransacciones] = useState<any[]>([])
  const [loadingPagos, setLoadingPagos] = useState(false)
  const [comprobanteModalUrl, setComprobanteModalUrl] = useState<string | null>(null)
  const [detalleAsistencias, setDetalleAsistencias] = useState<Record<string, AsistenciaEstudiante[]>>({})
  const [cargandoDetalleAsistencia, setCargandoDetalleAsistencia] = useState(false)
  const [editandoSesionId, setEditandoSesionId] = useState<string | null>(null)
  const [editsLocal, setEditsLocal] = useState<Record<string, { estado: string; observaciones: string }>>({})

  useEffect(() => {
    if (!id) return
    tallerService.obtener(id)
      .then(t => setTaller(t))
      .catch(() => toast.error("Error al cargar taller"))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || tab !== "participantes") return
    const params: Record<string, unknown> = { per_page: 100 }
    if (searchParticipantes.trim()) params.search = searchParticipantes
    tallerService.listarInscripciones(id, params)
      .then(res => setInscripciones((res as any).data || []))
      .catch(() => {})
      .finally(() => setLoadingInscripciones(false))
  }, [id, tab, searchParticipantes, refreshKey])

  useEffect(() => {
    if (!id || tab !== "pagos") return
    const loadPagosData = async () => {
      setLoadingPagos(true)
      try {
        const res = await financeService.getTallerFinanciero(id)
        const data = res.datos || res.data || res
        setFinancieroData(data)

        const participantes = data.participantes || []
        const historiales = await Promise.all(
          participantes.map((p: any) =>
            financeService.getHistorialParticipanteTaller(id, p.id)
              .then(r => ({
                participanteId: p.id,
                nombre: p.estudiante_nombre || `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
                data: r.datos || r.data || r,
              }))
              .catch(() => null)
          )
        )

        const allTransacciones: any[] = []
        historiales.forEach(h => {
          if (!h) return
          const trans = h.data.transacciones || []
          trans.forEach((t: any) => {
            allTransacciones.push({
              id: t.id,
              participante_nombre: h.nombre,
              participante_id: h.participanteId,
              monto: t.monto || 0,
              metodo_pago: t.metodo_pago || "—",
              fecha_pago: t.fecha_pago || null,
              estado_verificacion: t.estado_verificacion || "pendiente",
              comprobante_url: t.comprobante_url || null,
              observaciones: t.observaciones || null,
            })
          })
        })
        setTransacciones(allTransacciones)
      } catch {
        toast.error("Error al cargar datos financieros")
      } finally {
        setLoadingPagos(false)
      }
    }
    loadPagosData()
  }, [id, tab])

  useEffect(() => {
    if (!id || tab !== "asistencia") return
    if (!taller?.asistencias?.length) return

    const cargarDetalles = async () => {
      setCargandoDetalleAsistencia(true)
      const resultados: Record<string, AsistenciaEstudiante[]> = {}

      await Promise.all(
        taller.asistencias!.map(async (a) => {
          try {
            const res = await tallerService.listarAsistenciaEstudiantes(id!, a.id)
            const data = (res as any).estudiantes || []
            resultados[a.id] = data
          } catch {
            resultados[a.id] = []
          }
        })
      )

      setDetalleAsistencias(resultados)
      setCargandoDetalleAsistencia(false)
    }

    cargarDetalles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tab, refreshKey])

  const handleDeleteInscripcion = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await tallerService.eliminarInscripcion(deleteTarget.id)
      toast.success("Inscripción eliminada")
      setDeleteTarget(null)
      setRefreshKey(k => k + 1)
    } catch { toast.error("Error al eliminar inscripción") }
    finally { setDeleting(false) }
  }

  const iniciarEdicionAsistencia = (sesionId: string) => {
    const estudiantes = detalleAsistencias[sesionId]
    if (!estudiantes) return
    setEditandoSesionId(sesionId)
    const initial: Record<string, { estado: string; observaciones: string }> = {}
    estudiantes.forEach(e => {
      const key = e.inscripcion_taller_id || `ext-${e.participante_externo_id}`
      initial[key] = {
        estado: e.estado || (e.asistio ? "presente" : "ausente"),
        observaciones: e.observaciones || "",
      }
    })
    setEditsLocal(initial)
  }

  const handleCambiarEstado = (estudianteKey: string, estado: string) => {
    setEditsLocal(prev => ({
      ...prev,
      [estudianteKey]: { ...prev[estudianteKey], estado },
    }))
  }

  const guardarEdicionAsistencia = async (sesionId: string) => {
    if (!id) return
    const estudiantes = detalleAsistencias[sesionId]
    if (!estudiantes) return
    try {
      const payload = {
        estudiantes: estudiantes.map(e => {
          const key = e.inscripcion_taller_id || `ext-${e.participante_externo_id}`
          const edit = editsLocal[key]
          return {
            inscripcion_taller_id: e.inscripcion_taller_id,
            participante_externo_id: e.participante_externo_id,
            asistio: edit?.estado === "presente" || edit?.estado === "tardanza",
            estado: edit?.estado || "presente",
            observaciones: edit?.observaciones || null,
          }
        }),
      }
      await tallerService.registrarAsistenciaEstudiantes(id, sesionId, payload)
      toast.success("Asistencia actualizada")
      setEditandoSesionId(null)
      setEditsLocal({})
      const [updatedTaller, res] = await Promise.all([
        tallerService.obtener(id),
        tallerService.listarAsistenciaEstudiantes(id, sesionId),
      ])
      setTaller(updatedTaller)
      const data = (res as any).estudiantes || []
      setDetalleAsistencias(prev => ({ ...prev, [sesionId]: data }))
    } catch {
      toast.error("Error al guardar cambios")
    }
  }

  const cancelarEdicionAsistencia = () => {
    setEditandoSesionId(null)
    setEditsLocal({})
  }

  const getEstudianteName = (e: AsistenciaEstudiante) => {
    if (e.inscripcion_taller) {
      return `${e.inscripcion_taller.nombres} ${e.inscripcion_taller.apellidos}`
    }
    return "—"
  }

  const getEstudianteCedula = (e: AsistenciaEstudiante) =>
    e.inscripcion_taller?.cedula ?? "—"

  const getEstudianteCiudad = (e: AsistenciaEstudiante) =>
    e.inscripcion_taller?.ciudad ?? "—"

  const ESTADO_OPCIONES = [
    { value: "presente", label: "Presente", color: "#10b981" },
    { value: "tardanza", label: "Tardanza", color: "#f59e0b" },
    { value: "ausente", label: "Ausente", color: "#ef4444" },
    { value: "justificado", label: "Justificado", color: "#3b82f6" },
  ]

  const formatFecha = (f?: string) => {
    if (!f) return "—"
    try {
      const d = new Date(f)
      const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
      return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
    } catch { return f }
  }

  const formatHora = (h?: string) => h ? h.substring(0, 5) : "—"

  const generarDiasDelRango = (fechaInicio: string, fechaFin: string, horaInicio?: string, horaFin?: string) => {
    const dias: { id: string; dia_semana: number; hora_inicio: string; hora_fin: string; aula: null }[] = []
    const start = new Date(fechaInicio)
    const end = new Date(fechaFin)
    const current = new Date(start)
    let idx = 0
    while (current <= end) {
      const jsDay = current.getDay()
      dias.push({
        id: `inferred-${idx++}`,
        dia_semana: jsDay === 0 ? 7 : jsDay,
        hora_inicio: horaInicio ?? "—",
        hora_fin: horaFin ?? "—",
        aula: null,
      })
      current.setDate(current.getDate() + 1)
    }
    return dias
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ color: TEXT_MUTED }}>Cargando...</div>
  }

  if (!taller) {
    return <div className="min-h-screen flex items-center justify-center" style={{ color: TEXT_MUTED }}>Taller no encontrado</div>
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "info", label: "Información", icon: CalendarIcon },
    { key: "participantes", label: "Participantes", icon: UserGroupIcon },
    { key: "pagos", label: "Pagos", icon: Money01Icon },
    { key: "asistencia", label: "Asistencia", icon: CheckmarkCircle01Icon },
  ]

  const inscritosActivos = inscripciones.filter(i => i.estado === "activo")

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: BORDER }}>
        <div className="max-w-[1000px] mx-auto px-6 py-6">
          <button onClick={() => navigate("/talleres")}
            className="inline-flex items-center gap-1.5 text-xs font-medium mb-2 hover:opacity-70" style={{ color: TEXT_MUTED }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />Volver a talleres
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: CHARCOAL }}>{taller.nombre}</h1>
              <p className="text-sm mt-0.5 flex items-center gap-2" style={{ color: TEXT_MUTED }}>
                <span>{formatFecha(taller.fecha)}{taller.fecha_fin ? ` - ${formatFecha(taller.fecha_fin)}` : ""}</span>
                <span>·</span>
                <span>{formatHora(taller.hora_inicio)} - {formatHora(taller.hora_fin)}</span>
                <span>·</span>
                <span>{taller.modalidad?.toUpperCase()}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  backgroundColor: ESTADO_BADGE[taller.estado]?.bg || "oklch(0.95 0 0)",
                  color: ESTADO_BADGE[taller.estado]?.text || TEXT_MUTED,
                }}>
                {taller.estado}
              </span>
              {isAdmin && (<button onClick={() => navigate(`/talleres/${id}/editar`)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: TEXT_MUTED }}>
                <HugeiconsIcon icon={Edit01Icon} size={16} />
              </button>)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b" style={{ borderColor: BORDER }}>
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all"
                style={{
                  borderColor: tab === t.key ? ACCENT : "transparent",
                  color: tab === t.key ? CHARCOAL : TEXT_MUTED,
                }}>
                <HugeiconsIcon icon={t.icon} size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1000px] mx-auto w-full px-6 py-6">
        {tab === "info" && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border p-6" style={{ borderColor: BORDER }}>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-[11px] font-medium mb-1" style={{ color: TEXT_MUTED }}>Instructor</p>
                  <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                    {taller.instructor ? `${taller.instructor.nombres} ${taller.instructor.apellidos}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium mb-1" style={{ color: TEXT_MUTED }}>Fecha</p>
                  <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                    {formatFecha(taller.fecha)}{taller.fecha_fin ? ` - ${formatFecha(taller.fecha_fin)}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium mb-1" style={{ color: TEXT_MUTED }}>Horario</p>
                  <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                    {formatHora(taller.hora_inicio)} - {formatHora(taller.hora_fin)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium mb-1" style={{ color: TEXT_MUTED }}>Modalidad</p>
                  <p className="text-sm font-semibold capitalize" style={{ color: CHARCOAL }}>{taller.modalidad}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium mb-1" style={{ color: TEXT_MUTED }}>Precio</p>
                  <p className="text-sm font-bold" style={{ color: CHARCOAL }}>${Number(taller.precio || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium mb-1" style={{ color: TEXT_MUTED }}>Capacidad</p>
                  <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                    {inscripciones.filter(i => i.estado === "activo").length || "0"}/{taller.capacidad_maxima || "0"}
                  </p>
                </div>
              </div>
              {taller.fecha_fin && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
                  <p className="text-[11px] font-medium mb-2" style={{ color: TEXT_MUTED }}>Horarios por día</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(taller.horarios && taller.horarios.length > 0
                      ? taller.horarios
                      : generarDiasDelRango(taller.fecha!, taller.fecha_fin!, taller.hora_inicio, taller.hora_fin)
                    ).map((h: any) => {
                      const dias = ["", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
                      return (
                        <div key={h.id} className="px-3 py-2 rounded-lg border text-xs" style={{ borderColor: BORDER }}>
                          <span className="font-semibold" style={{ color: ACCENT }}>{dias[h.dia_semana] || h.dia_semana}</span>
                          <span className="ml-2" style={{ color: CHARCOAL }}>{formatHora(h.hora_inicio)} - {formatHora(h.hora_fin)}</span>
                          {h.aula && <span className="ml-2" style={{ color: TEXT_MUTED }}>({h.aula})</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {taller.descripcion && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
                  <p className="text-[11px] font-medium mb-1" style={{ color: TEXT_MUTED }}>Descripción</p>
                  <p className="text-sm" style={{ color: CHARCOAL }}>{taller.descripcion}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "participantes" && (
          <div className="bg-white rounded-xl border" style={{ borderColor: BORDER }}>
            <div className="px-5 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: BORDER }}>
              <div className="relative flex-1 max-w-xs">
                <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
                <input type="text" value={searchParticipantes} onChange={e => setSearchParticipantes(e.target.value)}
                  placeholder="Buscar participante..." className="w-full pl-9 pr-3 py-2 rounded-lg text-xs border outline-none" style={{ borderColor: BORDER }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: TEXT_MUTED }}>{inscritosActivos.length} inscritos</span>
                <button onClick={async () => {
                  try {
                    const activos = inscripciones.filter(i => i.estado === "activo")
                    const mapaFinanciero: Record<string, { monto_abonado: number; monto_total: number; saldo_pendiente: number }> = {}
                    try {
                      const resFin = await financeService.getTallerFinanciero(id!)
                      const data = resFin.datos || resFin.data || resFin
                      const participantesFin = data.participantes || []
                      for (const p of participantesFin) {
                        mapaFinanciero[p.id] = {
                          monto_abonado: Number(p.monto_abonado) || 0,
                          monto_total: Number(p.monto_total) || Number(taller?.precio) || 0,
                          saldo_pendiente: Number(p.saldo_pendiente) || 0,
                        }
                      }
                    } catch { /* usa monto_pagado de inscripcion como fallback */ }
                    const participantes: ParticipanteReporte[] = activos.map(ins => {
                      const fin = mapaFinanciero[ins.id]
                      const pagado = fin ? fin.monto_abonado : (Number(ins.monto_pagado) || 0)
                      const total = fin ? fin.monto_total : (Number(taller?.precio) || 0)
                      return {
                        nombres: ins.nombres,
                        apellidos: ins.apellidos,
                        cedula: ins.cedula,
                        telefono: ins.telefono || "",
                        montoPagado: pagado,
                        saldoPendiente: Math.max(0, total - pagado),
                      }
                    })
                    await generarListadoParticipantesPDF(taller?.nombre || "", participantes)
                    toast.success("PDF descargado")
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "Error desconocido"
                    toast.error(`Error al generar PDF: ${msg}`)
                  }
                }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: BORDER, color: CHARCOAL }}>
                  <HugeiconsIcon icon={Download01Icon} size={14} />PDF
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {loadingInscripciones ? (
                <div className="p-12 text-center text-sm" style={{ color: TEXT_MUTED }}>Cargando...</div>
              ) : inscripciones.length === 0 ? (
                <div className="p-12 text-center text-sm" style={{ color: TEXT_MUTED }}>No hay participantes inscritos</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: BORDER }}>
                      <th className="text-left font-semibold px-5 py-3" style={{ color: TEXT_MUTED }}>Participante</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Cédula</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Correo</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Teléfono</th>
                    <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Pagado / Total</th>
                      <th className="text-right font-semibold px-5 py-3" style={{ color: TEXT_MUTED }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscripciones.filter(i => i.estado !== "retirado").map(ins => (
                      <tr key={ins.id} className="border-b hover:bg-gray-50/50" style={{ borderColor: BORDER }}>
                        <td className="px-5 py-3">
                          <p className="font-semibold" style={{ color: CHARCOAL }}>{ins.nombres} {ins.apellidos}</p>
                        </td>
                        <td className="px-4 py-3" style={{ color: CHARCOAL }}>{ins.cedula}</td>
                        <td className="px-4 py-3" style={{ color: CHARCOAL }}>{ins.correo}</td>
                        <td className="px-4 py-3" style={{ color: CHARCOAL }}>{ins.telefono || "—"}</td>
                        <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: CHARCOAL }}>
                          ${Number(ins.monto_pagado ?? 0).toFixed(2)} / ${Number(taller.precio ?? 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {isAdmin && (<button onClick={() => setDeleteTarget(ins)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: TEXT_MUTED }}>
                            <HugeiconsIcon icon={Delete01Icon} size={14} />
                          </button>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === "pagos" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
  <div
    className="bg-white rounded-xl border p-4"
    style={{ borderColor: BORDER }}
  >
    <p
      className="text-[11px] font-medium mb-1"
      style={{ color: TEXT_MUTED }}
    >
      Total Recaudado
    </p>

    <p className="text-2xl font-bold">
      <span style={{ color: "oklch(0.45 0.12 140)" }}>
        ${Number(financieroData?.totales?.recaudado || 0).toFixed(2)}
      </span>

      <span style={{ color: TEXT_MUTED }}> / </span>

      <span style={{ color: "oklch(0.58 0.18 250)" }}>
        ${Number(financieroData?.totales?.esperado || 0).toFixed(2)}
      </span>
    </p>
  </div>

  <div
    className="bg-white rounded-xl border p-4"
    style={{ borderColor: BORDER }}
  >
    <p
      className="text-[11px] font-medium mb-1"
      style={{ color: TEXT_MUTED }}
    >
      Pagos Verificados
    </p>

    <p
      className="text-2xl font-bold"
      style={{ color: "oklch(0.55 0.18 72)" }}
    >
      {transacciones.filter(t => t.estado_verificacion === "aprobado").length}
    </p>
  </div>
</div>

            <div className="bg-white rounded-xl border" style={{ borderColor: BORDER }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
                <p className="text-xs font-semibold" style={{ color: CHARCOAL }}>Detalle de Pagos</p>
              </div>
              <div className="overflow-x-auto">
                {loadingPagos ? (
                  <div className="p-12 text-center text-sm" style={{ color: TEXT_MUTED }}>Cargando...</div>
                ) : transacciones.length === 0 ? (
                  <div className="p-12 text-center text-sm" style={{ color: TEXT_MUTED }}>Sin pagos registrados</div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b" style={{ borderColor: BORDER }}>
                        <th className="text-left font-semibold px-5 py-3" style={{ color: TEXT_MUTED }}>Participante</th>
                        <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Fecha</th>
                        <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Monto</th>
                        <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Método</th>
                        <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Comprobante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transacciones.map(t => (
                        <tr key={t.id} className="border-b" style={{ borderColor: BORDER }}>
                          <td className="px-5 py-3 font-semibold" style={{ color: CHARCOAL }}>{t.participante_nombre}</td>
                          <td className="px-4 py-3" style={{ color: CHARCOAL }}>
                            {t.fecha_pago ? formatFecha(t.fecha_pago.split(" ")[0]) : "—"}
                          </td>
                          <td className="px-4 py-3 font-semibold" style={{ color: CHARCOAL }}>${Number(t.monto).toFixed(2)}</td>
                          <td className="px-4 py-3 capitalize" style={{ color: CHARCOAL }}>{t.metodo_pago}</td>
                          <td className="px-4 py-3">
                            {t.comprobante_url ? (
                              <button onClick={() => setComprobanteModalUrl(getStorageUrl(t.comprobante_url))}
                                className="inline-flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: ACCENT }}>
                                <HugeiconsIcon icon={Image01Icon} size={13} />Ver
                              </button>
                            ) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {comprobanteModalUrl && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
                onClick={() => setComprobanteModalUrl(null)}>
                <div className="relative flex items-center justify-center p-6" style={{ maxWidth: "min(90vw, 1200px)", maxHeight: "90vh" }}>
                  <button onClick={(e) => { e.stopPropagation(); setComprobanteModalUrl(null); }}
                    className="absolute -top-8 right-0 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">
                    Cerrar [X]
                  </button>
                  <img src={comprobanteModalUrl} alt="Comprobante"
                    className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-xl shadow-2xl" />
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "asistencia" && (
          <div className="space-y-5">
            {inscripciones.length > 0 && (
              <div className="flex justify-end">
                <button onClick={async () => {
                  try {
                    const data = await tallerService.getAsistenciaPDFData(taller?.id || "")
                    await generarListadoAsistenciaPDF({ ...data, tipo: "taller" })
                    toast.success("Listado descargado")
                  } catch { toast.error("Error al generar PDF") }
                }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 transition-all">
                  <HugeiconsIcon icon={Download04Icon} size={12} />Descargar Listado
                </button>
              </div>
            )}
            {taller.asistencias && taller.asistencias.length > 0 ? (
              <div className="space-y-5">
                {cargandoDetalleAsistencia ? (
                  <div className="bg-white rounded-xl border p-12 text-center text-sm" style={{ borderColor: BORDER, color: TEXT_MUTED }}>
                    Cargando detalle de asistencias...
                  </div>
                ) : (
                  taller.asistencias.map(sesion => {
                    const estudiantes = detalleAsistencias[sesion.id] || []
                    const editando = editandoSesionId === sesion.id
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
                                const instructorName = taller?.instructor
                                  ? `${taller.instructor.nombres} ${taller.instructor.apellidos}`
                                  : undefined
                                generarReporteAsistenciaPDF(
                                  taller?.nombre || "",
                                  formatFecha(sesion.fecha_sesion),
                                  reporte,
                                  instructorName,
                                ).then(() => toast.success("Reporte descargado"))
                                  .catch(() => toast.error("Error al generar PDF"))
                              }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                                style={{ borderColor: BORDER, color: ACCENT, backgroundColor: `color-mix(in srgb, ${ACCENT} 8%, transparent)` }}>
                                <HugeiconsIcon icon={Download04Icon} size={12} />Descargar Reporte
                              </button>
                              {(isAdmin || isSecretaria) && !editando && (
                                <button onClick={() => iniciarEdicionAsistencia(sesion.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                                  style={{ borderColor: BORDER, color: ACCENT, backgroundColor: `color-mix(in srgb, ${ACCENT} 8%, transparent)` }}>
                                  <HugeiconsIcon icon={Edit01Icon} size={12} />Editar
                                </button>
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
                                  const key = est.inscripcion_taller_id || `ext-${est.participante_externo_id}`
                                  const edit = editando ? editsLocal[key] : undefined
                                  const estadoActual = edit?.estado || est.estado || (est.asistio ? "presente" : "ausente")
                                  const badge = ESTADO_ASISTENCIA_BADGE[estadoActual] || ESTADO_ASISTENCIA_BADGE.ausente
                                  return (
                                    <tr key={est.id} className="border-b hover:bg-gray-50/50" style={{ borderColor: BORDER }}>
                                      <td className="px-5 py-3 font-semibold whitespace-nowrap" style={{ color: CHARCOAL }}>
                                        {getEstudianteName(est)}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: CHARCOAL }}>
                                        {est.inscripcion_taller?.apellidos || "—"}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: TEXT_MUTED }}>
                                        {getEstudianteCedula(est)}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: TEXT_MUTED }}>
                                        {getEstudianteCiudad(est)}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        {editando ? (
                                          <select
                                            value={estadoActual}
                                            onChange={e => handleCambiarEstado(key, e.target.value)}
                                            className="px-2 py-1 rounded border text-[11px] font-semibold outline-none"
                                            style={{ borderColor: BORDER }}
                                          >
                                            {ESTADO_OPCIONES.map(op => (
                                              <option key={op.value} value={op.value}>{op.label}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold"
                                            style={{ backgroundColor: badge.bg, color: badge.text }}>
                                            {badge.label}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                        {editando && (
                          <div className="px-5 py-3 border-t flex items-center justify-end gap-2" style={{ borderColor: BORDER, backgroundColor: "#fafafa" }}>
                            <button onClick={cancelarEdicionAsistencia}
                              className="px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                              style={{ borderColor: BORDER, color: TEXT_MUTED }}>
                              Cancelar
                            </button>
                            <button onClick={() => guardarEdicionAsistencia(sesion.id)}
                              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-[0.97]"
                              style={{ backgroundColor: ACCENT }}>
                              Guardar Cambios
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border" style={{ borderColor: BORDER }}>
                <div className="p-12 text-center">
                  <p className="text-sm" style={{ color: TEXT_MUTED }}>No hay registros de asistencia</p>
                  <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
                    Registra la asistencia el día del evento
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Eliminar inscripción"
        message={`¿Estás seguro de eliminar la inscripción de "${deleteTarget?.nombres} ${deleteTarget?.apellidos}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={deleting}
        icon="trash"
        isDangerous
        onConfirm={handleDeleteInscripcion}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
