/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Edit01Icon, Delete01Icon, Download01Icon,
  UserGroupIcon, CalendarIcon, Money01Icon, CheckmarkCircle01Icon,
  CheckmarkCircle04Icon, Cancel01Icon, Image01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService, type Taller, type InscripcionTaller } from "@/services/taller.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  const { isAdmin } = usePermission()
  const [taller, setTaller] = useState<Taller | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("info")
  const [searchParticipantes, setSearchParticipantes] = useState("")
  const [inscripciones, setInscripciones] = useState<InscripcionTaller[]>([])
  const [loadingInscripciones, setLoadingInscripciones] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<InscripcionTaller | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

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

  const togglePago = async (insc: InscripcionTaller) => {
    try {
      await tallerService.verificarPago(insc.id)
      setInscripciones(prev => prev.map(i =>
        i.id === insc.id ? { ...i, pago_verificado: !i.pago_verificado } : i
      ))
      toast.success(insc.pago_verificado ? "Pago pendiente" : "Pago verificado")
    } catch { toast.error("Error al cambiar estado de pago") }
  }

  const handleExport = async () => {
    if (!id) return
    try {
      const res = await tallerService.exportarParticipantes(id)
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = res.filename || "participantes.csv"; a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exportados ${res.total} participantes`)
    } catch { toast.error("Error al exportar") }
  }

  const formatFecha = (f?: string) => {
    if (!f) return "—"
    try {
      const d = new Date(f)
      const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
      return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
    } catch { return f }
  }

  const formatHora = (h?: string) => h ? h.substring(0, 5) : "—"

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
  const totalIngresos = inscripciones.reduce((s, i) => s + Number(i.monto_pagado || 0), 0)
  const pagosVerificados = inscripciones.filter(i => i.pago_verificado).length

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
                {!taller.fecha_fin && (
                  <>
                    <span>·</span>
                    <span>{formatHora(taller.hora_inicio)} - {formatHora(taller.hora_fin)}</span>
                  </>
                )}
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
                {!taller.fecha_fin && (
                  <div>
                    <p className="text-[11px] font-medium mb-1" style={{ color: TEXT_MUTED }}>Horario</p>
                    <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                      {formatHora(taller.hora_inicio)} - {formatHora(taller.hora_fin)}
                    </p>
                  </div>
                )}
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
              {taller.fecha_fin && taller.horarios && taller.horarios.length > 0 && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
                  <p className="text-[11px] font-medium mb-2" style={{ color: TEXT_MUTED }}>Horarios por día</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {taller.horarios.map((h: any) => {
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
                <button onClick={handleExport}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: BORDER, color: CHARCOAL }}>
                  <HugeiconsIcon icon={Download01Icon} size={14} />CSV
                </button>
                <button onClick={async () => {
                  if (!id) return
                  try {
                    const blob = await tallerService.exportarParticipantesPdf(id)
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a"); a.href = url; a.download = "participantes.pdf"; a.click()
                    URL.revokeObjectURL(url)
                    toast.success("PDF descargado")
                  } catch { toast.error("Error al exportar PDF") }
                }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border hover:bg-gray-50 transition-colors"
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
                    <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Tipo Pago</th>
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
                        <td className="px-4 py-3 capitalize">
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold",
                            ins.tipo_pago === "completo" && "text-green-700 bg-green-50",
                            ins.tipo_pago === "abono" && "text-amber-700 bg-amber-50",
                          )}>
                            {ins.tipo_pago === "completo" ? "Completo" : ins.tipo_pago === "abono" ? "Abono" : "—"}
                          </span>
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
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Recaudado", value: `$${totalIngresos.toFixed(2)}`, color: "oklch(0.45 0.12 140)" },
                { label: "Pagos Verificados", value: pagosVerificados, color: "oklch(0.55 0.18 72)" },
                { label: "Pendientes", value: inscripciones.filter(i => !i.pago_verificado).length, color: "oklch(0.55 0.15 20)" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border p-4" style={{ borderColor: BORDER }}>
                  <p className="text-[11px] font-medium mb-1" style={{ color: TEXT_MUTED }}>{s.label}</p>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border" style={{ borderColor: BORDER }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
                <p className="text-xs font-semibold" style={{ color: CHARCOAL }}>Detalle de Pagos</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: BORDER }}>
                      <th className="text-left font-semibold px-5 py-3" style={{ color: TEXT_MUTED }}>Participante</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Tipo</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Monto</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Método</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Comprobante</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscripciones.filter(i => i.monto_pagado).map(ins => (
                      <tr key={ins.id} className="border-b" style={{ borderColor: BORDER }}>
                        <td className="px-5 py-3 font-semibold" style={{ color: CHARCOAL }}>{ins.nombres} {ins.apellidos}</td>
                        <td className="px-4 py-3 capitalize" style={{ color: CHARCOAL }}>{ins.tipo_pago}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: CHARCOAL }}>${Number(ins.monto_pagado).toFixed(2)}</td>
                        <td className="px-4 py-3 capitalize" style={{ color: CHARCOAL }}>{ins.metodo_pago || "—"}</td>
                        <td className="px-4 py-3">
                          {ins.comprobante_url ? (
                            <a href={ins.comprobante_url} target="_blank" rel="noreferrer"
                              className="text-xs font-semibold hover:underline" style={{ color: ACCENT }}>
                              <HugeiconsIcon icon={Image01Icon} size={13} className="inline mr-1" />Ver
                            </a>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => togglePago(ins)}
                            className="inline-flex items-center gap-1 text-xs font-semibold"
                            style={{ color: ins.pago_verificado ? "oklch(0.45 0.12 140)" : "oklch(0.55 0.15 20)" }}>
                            <HugeiconsIcon icon={ins.pago_verificado ? CheckmarkCircle04Icon : Cancel01Icon} size={13} />
                            {ins.pago_verificado ? "Verificado" : "Pendiente"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {inscripciones.filter(i => i.monto_pagado).length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-sm" style={{ color: TEXT_MUTED }}>Sin pagos registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "asistencia" && (
          <div className="bg-white rounded-xl border" style={{ borderColor: BORDER }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
              <p className="text-xs font-semibold" style={{ color: CHARCOAL }}>Registro de Asistencia</p>
            </div>
            <div className="p-5">
              {taller.asistencias && taller.asistencias.length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: BORDER }}>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Fecha</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Asistieron</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Capacidad</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>%</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taller.asistencias.map(a => (
                      <tr key={a.id} className="border-b" style={{ borderColor: BORDER }}>
                        <td className="px-4 py-3" style={{ color: CHARCOAL }}>{formatFecha(a.fecha_sesion)}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: CHARCOAL }}>{a.asistentes}</td>
                        <td className="px-4 py-3" style={{ color: CHARCOAL }}>{a.capacidad_registrada}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: a.capacidad_registrada > 0 ? "oklch(0.45 0.12 140)" : TEXT_MUTED }}>
                          {a.capacidad_registrada > 0 ? Math.round((a.asistentes / a.capacidad_registrada) * 100) + "%" : "—"}
                        </td>
                        <td className="px-4 py-3" style={{ color: TEXT_MUTED }}>{a.observaciones || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: TEXT_MUTED }}>No hay registros de asistencia</p>
                  <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
                    La asistencia se registra el día del evento desde el panel del instructor
                  </p>
                </div>
              )}
            </div>
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
