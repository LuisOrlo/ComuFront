/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar02Icon,
  ArrowRight01Icon,
  InvoiceIcon,
  ImageIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"

export function HistorialPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [transacciones, setTransacciones] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadHistorial = async (p: number = 1) => {
    setLoading(true)
    try {
      const res = await financeService.getHistorial({ page: p, per_page: 30 })
      setTransacciones(res.data || [])
      setTotalPages(res.last_page || 1)
      setPage(res.current_page || p)
    } catch {
      toast.error("Error al cargar historial")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistorial()
  }, [])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, any[]> = {}
    transacciones.forEach((t) => {
      const dateKey = new Date(t.fecha_pago || t.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(t)
    })
    return Object.entries(groups)
  }, [transacciones])

  const getNombreEstudiante = (t: any) => {
    const cp = t.cuenta_por_cobrar
    const m = cp?.matricula
    const s = cp?.solicitud_inscripcion
    const it = cp?.inscripcion_taller
    if (m?.estudiante) return `${m.estudiante.nombres || ""} ${m.estudiante.apellidos || ""}`.trim()
    if (s?.estudiante) return `${s.estudiante.nombres || ""} ${s.estudiante.apellidos || ""}`.trim()
    if (s?.participante_externo) return `${s.participante_externo.nombres || ""} ${s.participante_externo.apellidos || ""}`.trim()
    if (it?.participante) return `${it.participante.nombres || ""} ${it.participante.apellidos || ""}`.trim()
    return t.estudiante_nombre || "—"
  }

  const getCursoNombre = (t: any) => {
    const cp = t.cuenta_por_cobrar
    const m = cp?.matricula
    const s = cp?.solicitud_inscripcion
    const it = cp?.inscripcion_taller
    if (it?.taller?.nombre) return it.taller.nombre
    if (m?.curso_abierto?.nombre_instancia) return m.curso_abierto.nombre_instancia
    if (m?.curso_abierto?.catalogo?.nombre) return m.curso_abierto.catalogo.nombre
    if (s?.curso_abierto?.nombre_instancia) return s.curso_abierto.nombre_instancia
    if (s?.curso_abierto?.catalogo?.nombre) return s.curso_abierto.catalogo.nombre
    return t.curso_nombre || ""
  }

  const metodoIcon = (metodo: string) => {
    const lower = (metodo || "").toLowerCase()
    if (lower === "efectivo") return "E"
    if (lower.includes("transfer")) return "T"
    if (lower.includes("deposito")) return "D"
    if (lower.includes("tarjeta")) return "TC"
    return "O"
  }

  const methodColor = (metodo: string) => {
    const lower = (metodo || "").toLowerCase()
    if (lower === "efectivo") return "#0891b2"
    if (lower.includes("transfer")) return "#4f46e5"
    if (lower.includes("deposito")) return "#7c3aed"
    if (lower.includes("tarjeta")) return "#059669"
    return "#6b7280"
  }

  const badgeEstado = (estado: string) => {
    if (estado === "aprobado") return "bg-green-100 text-green-700"
    if (estado === "rechazado") return "bg-red-100 text-red-700"
    return "bg-amber-100 text-amber-700"
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
          <h2 className="text-lg font-black flex items-center gap-3" style={{ color: COLORS.CHARCOAL }}>
            <HugeiconsIcon icon={InvoiceIcon} size={22} style={{ color: COLORS.ACCENT }} />
            Historial de Movimientos
            {transacciones.length > 0 && (
              <span className="text-sm font-bold opacity-40">({transacciones.length})</span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="p-20 text-center opacity-40 font-medium" style={{ color: COLORS.CHARCOAL }}>
            Cargando historial...
          </div>
        ) : groupedByDate.length === 0 ? (
          <div className="p-20 text-center">
            <p className="font-medium text-sm opacity-30" style={{ color: COLORS.CHARCOAL }}>
              No hay movimientos registrados aún
            </p>
            <p className="text-xs mt-1 opacity-20">Los pagos y abonos aparecerán aquí una vez registrados</p>
          </div>
        ) : (
          <div className="px-8 py-6">
            <div className="relative">
              <div
                className="absolute left-[19px] top-0 bottom-0 w-px"
                style={{ backgroundColor: COLORS.BORDER_SUBTLE }}
              />

              <div className="space-y-8">
                {groupedByDate.map(([date, items]) => (
                  <div key={date} className="relative">
                    <div className="flex items-center gap-3 mb-4 pl-12">
                      <div
                        className="absolute left-[14px] size-[11px] rounded-full border-2 border-white ring-2"
                        style={{ backgroundColor: COLORS.ACCENT, boxShadow: `0 0 0 2px ${COLORS.ACCENT}30` }}
                      />
                      <HugeiconsIcon icon={Calendar02Icon} size={16} style={{ color: COLORS.ACCENT }} />
                      <h3
                        className="text-sm font-black uppercase tracking-wider"
                        style={{ color: COLORS.CHARCOAL }}
                      >
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
                          whileHover={{ x: 4 }}
                          onClick={() => navigate(`/finanzas/pagos/historial/${t.id}`)}
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
                                {getCursoNombre(t) || t.metodo_pago}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-black" style={{ color: "oklch(0.55 0.15 150)" }}>
                                +${Number(t.monto || 0).toLocaleString()}
                              </p>
                              <p className="text-[10px] opacity-40 capitalize">{t.metodo_pago}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {t.comprobante_url && (
                                <HugeiconsIcon icon={ImageIcon} size={14} className="opacity-30" />
                              )}
                              <span
                                className={cn("px-2 py-0.5 rounded-full text-[8px] font-bold uppercase", badgeEstado(t.estado_verificacion))}
                              >
                                {t.estado_verificacion}
                              </span>
                              <HugeiconsIcon
                                icon={ArrowRight01Icon}
                                size={16}
                                className="opacity-0 group-hover:opacity-40 transition-opacity"
                              />
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 pt-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button
                  disabled={page <= 1}
                  onClick={() => loadHistorial(page - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
                  style={{ color: COLORS.CHARCOAL, backgroundColor: "oklch(0.95 0 0)" }}
                >
                  Anterior
                </button>
                <span className="text-xs font-bold opacity-40 mx-2">
                  Página {page} de {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => loadHistorial(page + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
                  style={{ color: COLORS.CHARCOAL, backgroundColor: "oklch(0.95 0 0)" }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
