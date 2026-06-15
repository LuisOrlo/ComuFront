import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircleIcon, DollarCircleIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { secretariaService, type TrabajoEdicion } from "@/services/secretaria.service"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

export function SecretariaEdicionVideoPage() {
  const [trabajos, setTrabajos] = useState<TrabajoEdicion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    secretariaService.getTrabajosEdicion({ per_page: 50 })
      .then((res) => setTrabajos(res.data ?? []))
      .catch(() => { /* ignore */ })
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
      toast.success("Cobro registrado")
    } catch { toast.error("Error al registrar cobro") }
  }

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4" style={{ borderColor: BORDER, backgroundColor: "white" }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Edición de Video</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Gestión de trabajos de edición</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ACCENT }} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Cliente</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Descripción</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Pago</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {trabajos.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: MUTED }}>No hay trabajos de edición</td></tr>
                  ) : trabajos.map((t: TrabajoEdicion) => (
                    <tr key={t.id} className="transition-colors hover:bg-gray-50/40" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-3.5"><p className="text-sm font-medium" style={{ color: CHARCOAL }}>{t.cliente_nombre ?? "—"}</p></td>
                      <td className="px-5 py-3.5"><span className="text-sm" style={{ color: MUTED }}>{t.descripcion ?? "—"}</span></td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: t.estado === "entregado" ? "oklch(0.58 0.16 145 / 0.1)" : "oklch(0.62 0.14 85 / 0.12)", color: t.estado === "entregado" ? "oklch(0.58 0.16 145)" : "oklch(0.62 0.14 85)" }}>
                          {t.estado}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: t.pagado ? "oklch(0.58 0.16 145)" : "oklch(0.55 0.18 15)" }}>
                          {t.pagado ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {t.estado !== "entregado" && (
                            <button onClick={() => handleEntregar(t.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                              style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}>
                              <HugeiconsIcon icon={CheckmarkCircleIcon} size={12} /> Entregar
                            </button>
                          )}
                          {!t.pagado && (
                            <button onClick={() => handleCobro(t.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                              style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)", color: "oklch(0.58 0.16 145)" }}>
                              <HugeiconsIcon icon={DollarCircleIcon} size={12} /> Cobrar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
