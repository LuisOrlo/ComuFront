import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  UserIcon,
  InvoiceIcon,
  BanknoteArrowDownIcon,
  PaymentIcon,
  CalendarIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"

const CHARCOAL = COLORS.CHARCOAL
const BORDER = COLORS.BORDER_SUBTLE

const TIPO_BADGE: Record<string, { bg: string; text: string }> = {
  instructor: { bg: `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)`, text: COLORS.ACCENT },
  staff: { bg: "oklch(0.55 0.05 250 / 0.12)", text: "oklch(0.50 0.12 250)" },
  admin: { bg: "oklch(0.55 0.15 340 / 0.12)", text: "oklch(0.55 0.18 340)" },
  secretaria: { bg: "oklch(0.55 0.1 160 / 0.12)", text: "oklch(0.5 0.12 160)" },
}

export function PagosPersonaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [prevId, setPrevId] = useState(id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)

  if (id !== prevId) {
    setPrevId(id)
    setLoading(true)
  }

  useEffect(() => {
    if (!id) return
    financeService.getPagosPersonal(id)
      .then(res => setData(res))
      .catch(() => toast.error("Error al cargar pagos"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm font-medium opacity-40" style={{ color: CHARCOAL }}>Cargando...</p>
      </div>
    )
  }

  if (!data) return null

  const { persona, totales, data: pagos } = data

  return (
    <div className="px-8 py-6 max-w-4xl mx-auto">
      <button onClick={() => navigate("/personas")}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 mb-6 transition-opacity"
        style={{ color: CHARCOAL }}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver a personas
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` }}>
            <HugeiconsIcon icon={UserIcon} size={24} style={{ color: COLORS.ACCENT }} />
          </div>
          <div>
            <h2 className="text-lg font-black flex items-center gap-2" style={{ color: CHARCOAL }}>
              <HugeiconsIcon icon={BanknoteArrowDownIcon} size={20} style={{ color: "oklch(0.55 0.15 30)" }} />
              Pagos a {persona?.nombre_completo}
            </h2>
            {persona?.tipo && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: TIPO_BADGE[persona.tipo]?.bg || "oklch(0.85 0 0)", color: TIPO_BADGE[persona.tipo]?.text || COLORS.TEXT_MUTED }}>
                {persona.tipo}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-white p-4" style={{ borderColor: BORDER }}>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Total pagado</p>
          <p className="text-2xl font-black" style={{ color: "oklch(0.55 0.15 30)" }}>
            -${totales?.total_pagado?.toLocaleString("es-ES", { minimumFractionDigits: 2 }) || "0.00"}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-xl border bg-white p-4" style={{ borderColor: BORDER }}>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Cantidad de pagos</p>
          <p className="text-2xl font-black" style={{ color: CHARCOAL }}>
            {totales?.cantidad_pagos || 0}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl border bg-white p-4" style={{ borderColor: BORDER }}>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Último pago</p>
          <p className="text-2xl font-black" style={{ color: CHARCOAL }}>
            {totales?.ultimo_pago ? new Date(totales.ultimo_pago + "T00:00:00").toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) : "—"}
          </p>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: BORDER }}>
                <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest opacity-40">
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={CalendarIcon} size={10} />
                    Fecha
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest opacity-40">
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={InvoiceIcon} size={10} />
                    Descripción
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest opacity-40">Categoría</th>
                <th className="text-right px-4 py-3 text-[9px] font-bold uppercase tracking-widest opacity-40">Monto</th>
                <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest opacity-40">
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={PaymentIcon} size={10} />
                    Método
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {(!pagos || pagos.length === 0) ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <HugeiconsIcon icon={BanknoteArrowDownIcon} size={32} className="opacity-20" />
                      <p className="text-sm opacity-40">Sin pagos registrados para esta persona</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagos.map((pago: { id: string; fecha_pago?: string; descripcion?: string; categoria_nombre?: string; monto?: number; metodo_pago?: string }) => (
                  <tr key={pago.id}
                    className="border-b cursor-pointer transition-colors hover:bg-gray-50/80"
                    style={{ borderColor: BORDER }}
                    onClick={() => navigate(`/finanzas/egresos/${pago.id}`)}>
                    <td className="px-4 py-3 font-medium" style={{ color: CHARCOAL }}>
                      {pago.fecha_pago ? new Date(pago.fecha_pago + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 opacity-80">{pago.descripcion || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: "oklch(0.55 0.15 30 / 0.1)",
                          color: "oklch(0.55 0.15 30)",
                        }}>
                        {pago.categoria_nombre || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: "oklch(0.55 0.15 30)" }}>
                      -${pago.monto?.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 capitalize opacity-80">{pago.metodo_pago || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {data.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs opacity-40">
          <span>Página {data.current_page} de {data.last_page}</span>
          <span>{data.total} registros</span>
        </div>
      )}
    </div>
  )
}
