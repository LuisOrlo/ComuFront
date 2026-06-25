import { useState, useEffect, useRef, useCallback } from "react"
import { Link } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { BellIcon, AiLearningIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cursosService, type NotificacionesResponse } from "@/services/cursos.service"

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
  pendientesCount: number
  onCountChange: (count: number) => void
}

function formatFecha(fechaStr: string): string {
  const fecha = new Date(fechaStr + "T00:00:00")
  const hoy = new Date()
  const ayer = new Date()
  ayer.setDate(ayer.getDate() - 1)

  if (fecha.toDateString() === hoy.toDateString()) return "Hoy"
  if (fecha.toDateString() === ayer.toDateString()) return "Ayer"

  return fecha.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}

export function NotificationDropdown({ isOpen, onClose, anchorRef, pendientesCount, onCountChange }: NotificationDropdownProps) {
  const [data, setData] = useState<NotificacionesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await cursosService.getNotificaciones()
      setData(res)
      onCountChange(res.pendientes)
    } catch {
      // silent fail, keep previous data
    }
  }, [onCountChange])

  useEffect(() => {
    if (!isOpen) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetchData().finally(() => setLoading(false))

    intervalRef.current = setInterval(() => {
      fetchData()
    }, 15000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isOpen, fetchData])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose, anchorRef])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border shadow-2xl shadow-black/10 overflow-hidden z-50"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={BellIcon} size={16} style={{ color: COLORS.ACCENT }} />
              <h3 className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>Notificaciones</h3>
            </div>
            {pendientesCount > 0 && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                {pendientesCount} pendiente{pendientesCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && !data && (
              <div className="flex items-center justify-center py-16">
                <div
                  className="size-6 rounded-full border-2 border-transparent animate-spin"
                  style={{ borderTopColor: COLORS.ACCENT, borderRightColor: COLORS.ACCENT }}
                />
              </div>
            )}

            {!loading && data && data.recientes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="size-12 rounded-2xl bg-black/5 flex items-center justify-center mb-3">
                  <HugeiconsIcon icon={BellIcon} size={22} style={{ color: COLORS.TEXT_MUTED }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>Sin notificaciones</p>
                <p className="text-xs mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                  No hay solicitudes de inscripción pendientes de aprobación.
                </p>
              </div>
            )}

            {data && data.recientes.map((grupo) => (
              <div key={grupo.fecha}>
                <div className="px-4 py-2.5 bg-gray-50/70 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.TEXT_MUTED }}>
                    {formatFecha(grupo.fecha)}
                  </p>
                </div>
                {grupo.items.map((item) => (
                  <Link
                    key={item.id}
                    to={`/matriculas/aprobacion?tab=${item.tipo === "taller" ? "talleres" : "cursos"}&id=${item.id}`}
                    onClick={onClose}
                    className="flex items-start gap-3 px-4 py-3 border-b transition-colors hover:bg-gray-50/60"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  >
                    <span className="size-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                      style={{ backgroundColor: item.color || COLORS.ACCENT }}>
                      {item.estudiante.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: COLORS.CHARCOAL }}>
                        {item.estudiante}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {item.tipo === "taller" && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "oklch(0.92 0.05 80)", color: "oklch(0.55 0.12 70)" }}>Taller</span>
                        )}
                        <p className="text-xs truncate" style={{ color: COLORS.TEXT_MUTED }}>
                          {item.curso}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-medium" style={{ color: COLORS.TEXT_MUTED }}>
                          {item.hora}
                        </span>
                        {item.metodo_pago && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                            backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, white)`,
                            color: COLORS.ACCENT,
                          }}>
                            {item.metodo_pago === "transferencia" ? "Transferencia"
                              : item.metodo_pago === "deposito" ? "Depósito"
                              : item.metodo_pago === "efectivo" ? "Efectivo"
                              : item.metodo_pago}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {data && data.recientes.length > 0 && (
            <div className="p-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <Link
                to="/matriculas/aprobacion"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, white)`,
                  color: COLORS.ACCENT,
                }}
              >
                <HugeiconsIcon icon={AiLearningIcon} size={14} />
                Ver todas las solicitudes
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
