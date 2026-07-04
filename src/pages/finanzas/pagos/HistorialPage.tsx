/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar02Icon,
  ArrowRight01Icon,
  InvoiceIcon,
  ImageIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"

const DEBOUNCE_MS = 350

export function HistorialPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [allTransacciones, setAllTransacciones] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      try {
        const params: Record<string, any> = { per_page: 200 }
        if (fechaDesde) params.fecha_desde = fechaDesde
        if (fechaHasta) params.fecha_hasta = fechaHasta
        const res = await financeService.getHistorial(params)
        if (controller.signal.aborted) return
        setAllTransacciones(res.data || [])
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
  }, [fechaDesde, fechaHasta])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  function getNombreEstudiante(t: any): string {
    if (t.tipo_movimiento === "egreso") return t.estudiante_nombre || "—"
    if (t.modulo_nombre || t.linea_pago_modulo) return t.estudiante_nombre || "—"
    const cp = t.cuenta_por_cobrar
    if (!cp) return t.estudiante_nombre || "—"
    const candidates = [
      cp.matricula?.estudiante, cp.solicitud_inscripcion?.estudiante,
      cp.solicitud_inscripcion?.participante_externo, cp.inscripcion_taller?.participante,
      cp.reserva_podcast?.persona, cp.reserva_podcast?.cliente_externo,
      cp.reserva_aula?.persona, cp.reserva_aula?.cliente_externo,
    ]
    for (const c of candidates) {
      if (c?.nombres || c?.apellidos) return `${c.nombres || ""} ${c.apellidos || ""}`.trim()
    }
    return t.estudiante_nombre || "—"
  }

  function getCursoNombre(t: any): string {
    if (t.tipo_movimiento === "egreso") return t.categoria_nombre || t.curso_nombre || ""
    if (t.modulo_nombre || t.linea_pago_modulo) return t.curso_nombre || ""
    const cp = t.cuenta_por_cobrar
    if (!cp) return t.curso_nombre || ""
    const name = cp.matricula?.curso_abierto?.nombre_instancia
      || cp.matricula?.curso_abierto?.catalogo?.nombre
      || cp.solicitud_inscripcion?.curso_abierto?.nombre_instancia
      || cp.solicitud_inscripcion?.curso_abierto?.catalogo?.nombre
      || cp.inscripcion_taller?.taller?.nombre
    if (name) return name
    if (cp.reserva_podcast_id) return cp.reserva_podcast?.titulo || cp.reserva_podcast?.paquete?.nombre || "Podcast"
    if (cp.reserva_aula_id) return cp.reserva_aula?.aula?.nombre || "Aula"
    if (cp.alquiler_equipo_id) return cp.alquiler_equipo?.equipo?.nombre || "Equipo"
    if (cp.edicion_video_id) return "Edición de Video"
    if (cp.reserva_radio_id) return "Radio"
    return t.curso_nombre || ""
  }

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
  }, [allTransacciones, search])

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
              {hasResults && <span className="text-sm font-bold opacity-40">({clientFiltered.length})</span>}
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
                                  navigate(`/finanzas/egresos/${t.id}/editar`)
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
                                  {t.comprobante_url && <HugeiconsIcon icon={ImageIcon} size={14} className="opacity-30" />}
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
        )}
      </motion.div>
    </div>
  )
}
