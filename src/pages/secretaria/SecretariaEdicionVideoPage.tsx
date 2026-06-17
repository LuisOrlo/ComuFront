import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircleIcon, DollarCircleIcon, VideoIcon, ClockIcon, UserCheckIcon, MoneyIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { getStatus } from "@/lib/utils"
import { secretariaService, type TrabajoEdicion } from "@/services/secretaria.service"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
      {Array.from({ length: 6 }).map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "oklch(0.9 0 0)", width: j === 0 ? "85%" : "50%" }} />
        </td>
      ))}
    </tr>
  ))
}

export function SecretariaEdicionVideoPage() {
  const [trabajos, setTrabajos] = useState<TrabajoEdicion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    secretariaService.getTrabajosEdicion({ per_page: 50 })
      .then((res) => setTrabajos(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleEntregar = async (id: string) => {
    try {
      await secretariaService.entregarTrabajoEdicion(id)
      setTrabajos((prev) => prev.map((t) => t.id === id ? { ...t, estado: "entregado" } : t))
      toast.success("Trabajo marcado como entregado")
    } catch { toast.error("Error al entregar") }
  }

  const handleCobro = async (id: string) => {
    try {
      await secretariaService.cobrarTrabajoEdicion(id)
      setTrabajos((prev) => prev.map((t) => t.id === id ? { ...t, pagado: true } : t))
      toast.success("Cobro registrado exitosamente")
    } catch { toast.error("Error al registrar cobro") }
  }

  const pendientes = trabajos.filter((t) => t.estado !== "entregado").length
  const entregados = trabajos.filter((t) => t.estado === "entregado").length
  const sinPago = trabajos.filter((t) => !t.pagado).length

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4 bg-white" style={{ borderColor: BORDER }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Edición de Video</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Gestión de trabajos de edición y cobros</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.62 0.16 245 / 0.1)" }}>
              <HugeiconsIcon icon={VideoIcon} size={22} style={{ color: "oklch(0.62 0.16 245)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Total trabajos</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{trabajos.length}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.62 0.14 85 / 0.12)" }}>
              <HugeiconsIcon icon={ClockIcon} size={22} style={{ color: "oklch(0.62 0.14 85)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Pendientes</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{pendientes}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)" }}>
              <HugeiconsIcon icon={UserCheckIcon} size={22} style={{ color: "oklch(0.58 0.16 145)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Entregados</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{entregados}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.1)" }}>
              <HugeiconsIcon icon={MoneyIcon} size={22} style={{ color: "oklch(0.55 0.18 15)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Sin cobrar</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{sinPago}</p>
            </div>
          </article>
        </div>

        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.96 0 0)", borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Cliente</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Descripción</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Pago</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : trabajos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center justify-center size-14 rounded-2xl" style={{ backgroundColor: "oklch(0.96 0 0)" }}>
                          <HugeiconsIcon icon={VideoIcon} size={26} style={{ color: "oklch(0.8 0 0)" }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: CHARCOAL }}>No hay trabajos de edición</p>
                        <p className="text-xs max-w-xs text-center" style={{ color: MUTED }}>
                          Aún no se han registrado trabajos de edición de video
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : trabajos.map((t) => {
                  const st = getStatus(t.estado)
                  return (
                    <tr key={t.id} className="group transition-colors hover:bg-gray-50/60" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center size-7 rounded-full shrink-0 text-[11px] font-semibold" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
                            {(t.cliente_nombre ?? "?").charAt(0)}
                          </div>
                          <span className="text-sm font-medium" style={{ color: CHARCOAL }}>{t.cliente_nombre ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-sm truncate" style={{ color: CHARCOAL }}>{t.descripcion ?? "—"}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full`}
                          style={{
                            backgroundColor: t.pagado ? "oklch(0.58 0.16 145 / 0.1)" : "oklch(0.55 0.18 15 / 0.1)",
                            color: t.pagado ? "oklch(0.58 0.16 145)" : "oklch(0.55 0.18 15)",
                          }}>
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: t.pagado ? "oklch(0.58 0.16 145)" : "oklch(0.55 0.18 15)" }} />
                          {t.pagado ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.estado !== "entregado" && (
                            <button
                              onClick={() => handleEntregar(t.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                              style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}
                            >
                              <HugeiconsIcon icon={CheckmarkCircleIcon} size={12} /> Entregar
                            </button>
                          )}
                          {!t.pagado && (
                            <button
                              onClick={() => handleCobro(t.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                              style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)", color: "oklch(0.58 0.16 145)" }}
                            >
                              <HugeiconsIcon icon={DollarCircleIcon} size={12} /> Cobrar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
