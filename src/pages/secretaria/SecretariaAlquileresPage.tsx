import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircleIcon, ArrowLeftIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { secretariaService, type Alquiler } from "@/services/secretaria.service"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

export function SecretariaAlquileresPage() {
  const [alquileres, setAlquileres] = useState<Alquiler[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    secretariaService.getAlquileres({ per_page: 50 })
      .then((res) => setAlquileres(res.data ?? []))
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [])

  const handleEntregar = async (id: string) => {
    try {
      await secretariaService.entregarEquipo(id)
      setAlquileres((prev) => prev.map((a) => a.id === id ? { ...a, fecha_entrega: new Date().toISOString() } : a))
      toast.success("Equipo entregado")
    } catch { toast.error("Error al entregar") }
  }

  const handleDevolver = async (id: string) => {
    try {
      await secretariaService.devolverEquipo(id)
      setAlquileres((prev) => prev.map((a) => a.id === id ? { ...a, fecha_devolucion: new Date().toISOString() } : a))
      toast.success("Devolución registrada")
    } catch { toast.error("Error al devolver") }
  }

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4" style={{ borderColor: BORDER, backgroundColor: "white" }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Alquiler de Equipos</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Gestión de préstamos y devoluciones</p>
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
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Equipo</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Fecha préstamo</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alquileres.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: MUTED }}>No hay alquileres registrados</td></tr>
                  ) : alquileres.map((a: Alquiler) => {
                    const devuelto = !!a.fecha_devolucion
                    return (
                      <tr key={a.id} className="transition-colors hover:bg-gray-50/40" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-5 py-3.5"><p className="text-sm font-medium" style={{ color: CHARCOAL }}>{a.cliente_nombre ?? "—"}</p></td>
                        <td className="px-5 py-3.5"><span className="text-sm" style={{ color: MUTED }}>{a.equipo?.nombre ?? "—"}</span></td>
                        <td className="px-5 py-3.5"><span className="text-sm" style={{ color: MUTED }}>{a.fecha_prestamo ?? a.created_at}</span></td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: devuelto ? "oklch(0.58 0.16 145 / 0.1)" : "oklch(0.62 0.14 85 / 0.12)", color: devuelto ? "oklch(0.58 0.16 145)" : "oklch(0.62 0.14 85)" }}>
                            {devuelto ? "Devuelto" : "Prestado"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!a.fecha_entrega && (
                              <button onClick={() => handleEntregar(a.id)}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                                style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}>
                                <HugeiconsIcon icon={CheckmarkCircleIcon} size={12} /> Entregar
                              </button>
                            )}
                            {a.fecha_entrega && !devuelto && (
                              <button onClick={() => handleDevolver(a.id)}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                                style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)", color: "oklch(0.58 0.16 145)" }}>
                                <HugeiconsIcon icon={ArrowLeftIcon} size={12} /> Devolver
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
          )}
        </div>
      </main>
    </div>
  )
}
