/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar02Icon,
  ArrowRight01Icon,
  InvoiceIcon,
  ImageIcon,
  Cancel01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"
import { useNavigate } from "react-router"

const DEBOUNCE_MS = 350

export function HistorialPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null)
  const [deleteModalData, setDeleteModalData] = useState<{ items: any[]; date: string } | null>(null)
  const [allTransacciones, setAllTransacciones] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const PER_PAGE = 50

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      try {
        const params: Record<string, any> = { per_page: PER_PAGE, page }
        if (fechaDesde) params.fecha_desde = fechaDesde
        if (fechaHasta) params.fecha_hasta = fechaHasta
        const res = await financeService.getHistorial(params)
        if (controller.signal.aborted) return
        setAllTransacciones(res.data || [])
        setTotalPages(res.last_page || 1)
        setTotalItems(res.total || 0)
      } catch (err: any) {
        if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
          toast.error("Error al cargar historial")
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    run()
    return () => controller.abort()
  }, [page, fechaDesde, fechaHasta])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1) }, [fechaDesde, fechaHasta])

  const getNombreEstudiante = useCallback((t: any): string => {
    if (t.tipo_movimiento === "egreso") return t.estudiante_nombre || "—"
    if (t.modulo_nombre || t.linea_pago_modulo) return t.estudiante_nombre || "—"
    const cp = t.cuenta_por_cobrar
    if (!cp) return t.estudiante_nombre || "—"
    const candidates = [
      cp.matricula?.estudiante, cp.solicitud_inscripcion?.estudiante,
      cp.solicitud_inscripcion?.participante_externo, cp.inscripcion_taller,
      cp.reserva_podcast?.persona, cp.reserva_podcast?.cliente_externo,
      cp.reserva_aula?.persona, cp.reserva_aula?.cliente_externo,
      cp.alquiler_equipo?.persona, cp.alquiler_equipo?.cliente_externo,
      cp.reserva_radio?.persona, cp.reserva_radio?.cliente_externo,
    ]
    for (const c of candidates) {
      if (c?.nombres || c?.apellidos) return `${c.nombres || ""} ${c.apellidos || ""}`.trim()
    }
    return t.estudiante_nombre || "—"
  }, [])

  const getCursoNombre = useCallback((t: any): string => {
    if (t.tipo_movimiento === "egreso") return t.categoria_nombre || t.curso_nombre || ""
    if (t.modulo_nombre || t.linea_pago_modulo) return t.curso_nombre || ""
    const cp = t.cuenta_por_cobrar
    if (!cp) return t.curso_nombre || ""
    return nombreDesdeCuentaCobrar(cp) || t.curso_nombre || ""
  }, [])

  function esPagoPorModulo(t: any): boolean {
    return !!(t.modulo_nombre || t.linea_pago_modulo)
  }

  const esEgreso = (t: any) => t.tipo_movimiento === "egreso"

  const clientFiltered = useMemo(() => {
    if (!search) return allTransacciones
    const q = search.toLowerCase().trim()
    return allTransacciones.filter((t) => {
      const nombre = getNombreEstudiante(t)
      const curso = getCursoNombre(t)
      const cedula = t.cedula || t.estudiante_cedula || ""
      return [nombre, curso, cedula, t.metodo_pago, t.estado_verificacion]
        .some(f => f?.toLowerCase().includes(q))
    })
  }, [allTransacciones, search, getNombreEstudiante, getCursoNombre])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, any[]> = {}
    clientFiltered.forEach((t) => {
      const dateKey = new Date(t.fecha_pago || t.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(t)
    })
    return Object.entries(groups)
  }, [clientFiltered])

  const ICONS: Record<string, string> = { efectivo: "E", transfer: "T", deposito: "D", tarjeta: "TC" }
  const COLORS_MAP: Record<string, string> = { efectivo: "#0891b2", transfer: "#4f46e5", deposito: "#7c3aed", tarjeta: "#059669" }
  const ESTADO_CLASSES: Record<string, string> = { aprobado: "bg-green-100 text-green-700", rechazado: "bg-red-100 text-red-700" }

  const metodoIcon = (metodo: string) => {
    const lower = (metodo || "").toLowerCase()
    return Object.entries(ICONS).find(([k]) => lower === k || lower.includes(k))?.[1] || "O"
  }

  const methodColor = (metodo: string) => {
    const lower = (metodo || "").toLowerCase()
    return Object.entries(COLORS_MAP).find(([k]) => lower === k || lower.includes(k))?.[1] || "#6b7280"
  }

  const badgeEstado = (estado: string) => ESTADO_CLASSES[estado] || "bg-amber-100 text-amber-700"

  const hasResults = groupedByDate.length > 0

  const handleDeleteGroupComprobantes = async () => {
    if (!deleteModalData) return
    const { items, date } = deleteModalData
    setDeleteModalData(null)
    const conComprobante = items.filter((t: any) => t.comprobante_url && !t.deleting)
    if (conComprobante.length === 0) {
      toast.error("No hay comprobantes para eliminar en este grupo")
      return
    }
    setDeletingGroup(date)
    try {
      await Promise.all(conComprobante.map((t: any) =>
        financeService.deleteComprobante(t.id, t.tipo_movimiento === "egreso" ? "egreso" : "ingreso")
      ))
      toast.success(`${conComprobante.length} comprobante(s) eliminados`)
      setAllTransacciones(prev => prev.map(t => {
        if (conComprobante.find((c: any) => c.id === t.id)) return { ...t, comprobante_url: null, comprobante_purgado: true }
        return t
      }))
    } catch { toast.error("Error al eliminar comprobantes") }
    finally { setDeletingGroup(null) }
  }

  const handleDeleteSingleComprobante = async (t: any, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await financeService.deleteComprobante(t.id, t.tipo_movimiento === "egreso" ? "egreso" : "ingreso")
      toast.success("Comprobante eliminado")
      setAllTransacciones(prev => prev.map(item =>
        item.id === t.id ? { ...item, comprobante_url: null, comprobante_purgado: true } : item
      ))
    } catch { toast.error("Error al eliminar comprobante") }
  }

  return (
    <div className="px-8 py-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-white overflow-hidden"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
      >
        <div className="p-6 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-black flex items-center gap-3" style={{ color: COLORS.CHARCOAL }}>
              <HugeiconsIcon icon={InvoiceIcon} size={22} style={{ color: COLORS.ACCENT }} />
              Historial de Movimientos
              {hasResults && <span className="text-sm font-bold opacity-40">({totalItems})</span>}
            </h2>
            <div className="flex items-center gap-2">
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                className="px-3 py-2 rounded-xl border bg-gray-50/50 text-[10px] font-medium w-[140px] outline-none focus:ring-2 focus:ring-violet-500/10"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }} />
              <span className="text-[10px] opacity-30">—</span>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                className="px-3 py-2 rounded-xl border bg-gray-50/50 text-[10px] font-medium w-[140px] outline-none focus:ring-2 focus:ring-violet-500/10"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }} />
              <div className="relative w-48">
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-4 pr-9 py-2 rounded-xl border bg-gray-50/60 text-xs font-medium outline-none focus:ring-2 focus:ring-violet-500/10"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
                />
                {searchInput && (
                  <button onClick={() => { setSearchInput(""); setSearch("") }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100">
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center opacity-40 font-medium" style={{ color: COLORS.CHARCOAL }}>
            Cargando historial...
          </div>
        ) : !hasResults ? (
          <div className="p-20 text-center">
            <p className="font-medium text-sm opacity-30" style={{ color: COLORS.CHARCOAL }}>
              {search ? `Sin resultados para "${search}"` : "No hay movimientos registrados aún"}
            </p>
            <p className="text-xs mt-1 opacity-20">
              {search ? "Intenta con otros términos de búsqueda" : "Los pagos y abonos aparecerán aquí una vez registrados"}
            </p>
          </div>
        ) : (
          <>
          <div className="px-8 py-6 relative">
            <div className="relative">
              <div
                className="absolute left-[19px] top-0 bottom-0 w-px"
                style={{ backgroundColor: COLORS.BORDER_SUBTLE }}
              />
              <div className="space-y-8">
                  {groupedByDate.map(([date, items]) => (
                    <motion.div
                      key={date}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="relative"
                    >
                      <div className="flex items-center gap-3 mb-4 pl-12">
                        <div
                          className="absolute left-[14px] size-[11px] rounded-full border-2 border-white ring-2"
                          style={{ backgroundColor: COLORS.ACCENT, boxShadow: `0 0 0 2px ${COLORS.ACCENT}30` }}
                        />
                        <HugeiconsIcon icon={Calendar02Icon} size={16} style={{ color: COLORS.ACCENT }} />
                        <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: COLORS.CHARCOAL }}>
                          {date}
                        </h3>
                        <span className="text-xs opacity-30">
                          {items.length} movimiento{items.length !== 1 ? "s" : ""}
                        </span>
                        {items.some((t: any) => t.comprobante_url && !t.comprobante_purgado) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteModalData({ items, date }) }}
                            disabled={deletingGroup === date}
                            className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={12} />
                            {deletingGroup === date ? "Eliminando..." : "Eliminar comprobantes"}
                          </button>
                        )}
                      </div>
                      <div className="space-y-2 pl-12">
                          {items.map((t: any) => (
                            <motion.button
                              key={t.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              whileHover={{ x: 4 }}
                              onClick={() => {
                                if (esEgreso(t)) {
                                  navigate(`/finanzas/egresos/${t.id}`)
                                } else {
                                  navigate(`/finanzas/pagos/historial/${t.id}`)
                                }
                              }}
                              className="w-full text-left p-4 rounded-xl border transition-all hover:shadow-sm flex items-center justify-between gap-4 group"
                              style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.99 0 0)" }}
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <div
                                  className="size-9 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-black text-white"
                                  style={{ backgroundColor: methodColor(t.metodo_pago) }}
                                >
                                  {metodoIcon(t.metodo_pago)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                                    {getNombreEstudiante(t)}
                                  </p>
                                  <p className="text-[10px] opacity-40 truncate">
                                    {esEgreso(t)
                                      ? `${getCursoNombre(t) || t.metodo_pago}`
                                      : esPagoPorModulo(t) && t.modulo_nombre
                                        ? `${getCursoNombre(t) || t.metodo_pago} — ${t.modulo_nombre}`
                                        : (getCursoNombre(t) || t.metodo_pago)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                  <p className="text-sm font-black" style={{ color: esEgreso(t) ? "oklch(0.55 0.15 30)" : "oklch(0.55 0.15 150)" }}>
                                    {esEgreso(t) ? "-" : "+"}${Number(t.monto || 0).toLocaleString()}
                                  </p>
                                  <p className="text-[10px] opacity-40 capitalize">{t.metodo_pago}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {t.comprobante_url && !t.comprobante_purgado && (
                                    <>
                                      <HugeiconsIcon icon={ImageIcon} size={14} className="opacity-30" />
                                      <span
                                        onClick={(e) => handleDeleteSingleComprobante(t, e)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDeleteSingleComprobante(t, e as any) }}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors bg-white cursor-pointer"
                                        title="Eliminar comprobante"
                                      >
                                        ✕
                                      </span>
                                    </>
                                  )}
                                  {t.comprobante_purgado && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                      <HugeiconsIcon icon={ImageIcon} size={10} /> Eliminado
                                    </span>
                                  )}
                                  {esEgreso(t) ? (
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase bg-red-100 text-red-700">
                                      Egreso
                                    </span>
                                  ) : esPagoPorModulo(t) ? (
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase bg-purple-100 text-purple-700">
                                      Módulo
                                    </span>
                                  ) : null}
                                  <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-bold uppercase", badgeEstado(t.estado_verificacion))}>
                                    {t.estado_verificacion}
                                  </span>
                                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                                </div>
                              </div>
                            </motion.button>
                          ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-8 py-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span className="text-xs opacity-40">
                Página {page} de {totalPages} ({totalItems} movimientos)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  Anterior
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </motion.div>

      <ConfirmationModal
        isOpen={deleteModalData !== null}
        title="Eliminar comprobantes del almacenamiento"
        message={`¿Eliminar ${deleteModalData?.items.filter((t: any) => t.comprobante_url).length || 0} comprobante(s) del almacenamiento? Los registros históricos se conservarán. Esta acción es irreversible.`}
        confirmText="Eliminar comprobantes"
        cancelText="Cancelar"
        isLoading={false}
        icon="danger"
        onConfirm={handleDeleteGroupComprobantes}
        onCancel={() => setDeleteModalData(null)}
      />
    </div>
  )
}

function nombreServicio(cp: any): string {
  const servicio: Array<[string, string]> = [
    ["reserva_podcast_id", cp.reserva_podcast?.titulo || cp.reserva_podcast?.paquete?.nombre || "Podcast"],
    ["reserva_aula_id", cp.reserva_aula?.aula?.nombre || "Aula"],
    ["alquiler_equipo_id", cp.alquiler_equipo?.equipo?.nombre || "Equipo"],
    ["edicion_video_id", "Edición de Video"],
    ["reserva_radio_id", "Radio"],
  ]
  for (const [idField, label] of servicio) {
    if (cp[idField]) return label
  }
  return ""
}

function nombreDesdeCuentaCobrar(cp: any): string {
  const academia = cp.matricula?.curso_abierto?.nombre_instancia
    || cp.matricula?.curso_abierto?.catalogo?.nombre
    || cp.solicitud_inscripcion?.curso_abierto?.nombre_instancia
    || cp.solicitud_inscripcion?.curso_abierto?.catalogo?.nombre
    || cp.inscripcion_taller?.taller?.nombre
  if (academia) return academia
  return nombreServicio(cp)
}
