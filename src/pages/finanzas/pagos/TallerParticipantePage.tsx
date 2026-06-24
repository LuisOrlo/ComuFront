/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  UserIcon,
  Calendar02Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useParams, useNavigate, NavLink } from "react-router"

export function TallerParticipantePage() {
  const { id: tallerId, pid: participanteId } = useParams<{ id: string; pid: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [modalImage, setModalImage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!tallerId || !participanteId) return
      try {
        const res = await financeService.getHistorialParticipanteTaller(tallerId, participanteId)
        setData(res.datos || res.data || res)
      } catch {
        toast.error("Error al cargar datos del participante")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tallerId, participanteId])

  const badgeEstado = (estado: string) => {
    if (estado === "aprobado") return "bg-green-100 text-green-700"
    if (estado === "rechazado") return "bg-red-100 text-red-700"
    return "bg-amber-100 text-amber-700"
  }

  const estadoColor = (estado: string) => {
    if (estado === "aprobado") return "oklch(0.55 0.15 150)"
    if (estado === "rechazado") return "oklch(0.5 0.15 20)"
    return "oklch(0.65 0.15 75)"
  }

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium opacity-40" style={{ color: COLORS.CHARCOAL }}>
            Cargando datos del participante...
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium opacity-40" style={{ color: COLORS.CHARCOAL }}>
            Participante no encontrado
          </div>
        </div>
      </div>
    )
  }

  const participante = data.participante || data
  const transacciones = data.transacciones || data.historial || []
  const tallerNombre = data.taller_nombre || data.taller?.nombre || "Taller"
  const nombreParticipante = participante.nombres && participante.apellidos
    ? `${participante.nombres} ${participante.apellidos}`.trim()
    : data.nombre_participante || "—"

  return (
    <div className="px-8 py-6">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-3" style={{ color: COLORS.CHARCOAL }}>
        <NavLink to="/finanzas/pagos" className="hover:underline">Finanzas</NavLink>
        <span className="size-1 rounded-full bg-current opacity-50" />
        <NavLink to="/finanzas/pagos/cuentas/talleres" className="hover:underline">Talleres</NavLink>
        <span className="size-1 rounded-full bg-current opacity-50" />
        <NavLink to={`/finanzas/pagos/cuentas/talleres/${tallerId}`} className="hover:underline">{tallerNombre}</NavLink>
        <span className="size-1 rounded-full bg-current opacity-50" />
        <span>{nombreParticipante}</span>
      </div>

      <button
        onClick={() => navigate(`/finanzas/pagos/cuentas/talleres/${tallerId}`)}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all mb-4"
        style={{ color: COLORS.CHARCOAL }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver al Taller
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl space-y-6"
      >
        <div
          className="rounded-2xl border bg-white p-6"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="size-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "oklch(0.5 0.1 240 / 0.1)" }}
            >
              <HugeiconsIcon icon={UserIcon} size={22} style={{ color: "oklch(0.5 0.1 240)" }} />
            </div>
            <div>
              <h2 className="text-xl font-black" style={{ color: COLORS.CHARCOAL }}>
                {nombreParticipante}
              </h2>
              <p className="text-xs opacity-40">{tallerNombre}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl" style={{ backgroundColor: "oklch(0.97 0 0)" }}>
            <div>
              <p className="text-[10px] font-bold uppercase opacity-40">Precio</p>
              <p className="text-lg font-black" style={{ color: COLORS.CHARCOAL }}>
                ${Number(data.precio_taller || data.monto_total || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase opacity-40">Pagado</p>
              <p className="text-lg font-black text-green-600">
                ${Number(data.total_pagado || data.monto_abonado || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase opacity-40">Saldo</p>
              <p className="text-lg font-black" style={{ color: (data.saldo || data.saldo_pendiente || 0) > 0 ? "oklch(0.5 0.15 20)" : "oklch(0.55 0.15 150)" }}>
                ${Number(data.saldo || data.saldo_pendiente || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase opacity-40">Estado</p>
              <p className="text-lg font-black" style={{ color: (data.saldo || data.saldo_pendiente || 0) <= 0 ? "oklch(0.55 0.15 150)" : "oklch(0.65 0.15 75)" }}>
                {(data.saldo || data.saldo_pendiente || 0) <= 0 ? "Pagado" : "Pendiente"}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border bg-white p-6"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <h3 className="text-base font-black mb-6" style={{ color: COLORS.CHARCOAL }}>
            Historial de Transacciones
          </h3>

          {transacciones.length === 0 ? (
            <p className="text-center text-sm opacity-40 py-8" style={{ color: COLORS.CHARCOAL }}>
              No hay transacciones registradas
            </p>
          ) : (
            <div className="relative">
              <div
                className="absolute left-[15px] top-2 bottom-2 w-px"
                style={{ backgroundColor: COLORS.BORDER_SUBTLE }}
              />

              <div className="space-y-4">
                {transacciones.map((t: any, idx: number) => (
                  <div key={t.id || idx} className="relative pl-10">
                    <div
                      className="absolute left-[10px] top-1.5 size-[11px] rounded-full border-2 border-white ring-2"
                      style={{ backgroundColor: estadoColor(t.estado_verificacion) }}
                    />
                    <div
                      className="p-4 rounded-xl border"
                      style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.99 0 0)" }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-black" style={{ color: COLORS.CHARCOAL }}>
                            ${Number(t.monto || 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] opacity-40 flex items-center gap-1.5 mt-0.5">
                            <HugeiconsIcon icon={Calendar02Icon} size={10} />
                            {new Date(t.fecha_pago || t.created_at).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <span
                          className={cn("px-2 py-0.5 rounded-full text-[8px] font-bold uppercase", badgeEstado(t.estado_verificacion))}
                        >
                          {t.estado_verificacion}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-40 capitalize">{t.metodo_pago}</p>

                      {t.comprobante_url && (
                        <div className="mt-3">
                          <div
                            className="rounded-lg border overflow-hidden cursor-pointer inline-block"
                            style={{ borderColor: COLORS.BORDER_SUBTLE }}
                            onClick={() => setModalImage(t.comprobante_url)}
                          >
                            <img
                              src={t.comprobante_url}
                              alt="Comprobante"
                              className="max-h-32 object-contain hover:opacity-80 transition-opacity"
                            />
                          </div>
                        </div>
                      )}
                      {t.observaciones && (
                        <p className="text-[10px] italic opacity-40 mt-2">{t.observaciones}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setModalImage(null)}
        >
          <div className="relative flex items-center justify-center p-6" style={{ maxWidth: "min(90vw, 1200px)", maxHeight: "90vh" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setModalImage(null); }}
              className="absolute -top-8 right-0 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cerrar [X]
            </button>
            <img
              src={modalImage}
              alt="Comprobante"
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
