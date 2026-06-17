import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircleIcon, ArrowLeftIcon, AiFolderIcon, ClockIcon, UserCheckIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { formatDate, getStatus } from "@/lib/utils"
import { secretariaService, type Alquiler } from "@/services/secretaria.service"
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
          <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "oklch(0.9 0 0)", width: j === 0 ? "80%" : "50%" }} />
        </td>
      ))}
    </tr>
  ))
}

export function SecretariaAlquileresPage() {
  const [alquileres, setAlquileres] = useState<Alquiler[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    secretariaService.getAlquileres({ per_page: 50 })
      .then((res) => setAlquileres(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleEntregar = async (id: string) => {
    try {
      await secretariaService.entregarEquipo(id)
      setAlquileres((prev) => prev.map((a) => a.id === id ? { ...a, fecha_entrega: new Date().toISOString() } : a))
      toast.success("Equipo marcado como entregado")
    } catch { toast.error("Error al entregar equipo") }
  }

  const handleDevolver = async (id: string) => {
    try {
      await secretariaService.devolverEquipo(id)
      setAlquileres((prev) => prev.map((a) => a.id === id ? { ...a, fecha_devolucion: new Date().toISOString() } : a))
      toast.success("Devolución registrada exitosamente")
    } catch { toast.error("Error al registrar devolución") }
  }

  const prestados = alquileres.filter((a) => !a.fecha_devolucion).length
  const devueltos = alquileres.filter((a) => !!a.fecha_devolucion).length
  const pendientesEntrega = alquileres.filter((a) => !a.fecha_entrega).length

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4 bg-white" style={{ borderColor: BORDER }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Alquiler de Equipos</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Gestión de préstamos, entregas y devoluciones</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.62 0.16 245 / 0.1)" }}>
              <HugeiconsIcon icon={AiFolderIcon} size={22} style={{ color: "oklch(0.62 0.16 245)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Total alquileres</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{alquileres.length}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.62 0.14 85 / 0.12)" }}>
              <HugeiconsIcon icon={ClockIcon} size={22} style={{ color: "oklch(0.62 0.14 85)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>En préstamo</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{prestados}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)" }}>
              <HugeiconsIcon icon={UserCheckIcon} size={22} style={{ color: "oklch(0.58 0.16 145)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Devueltos</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{devueltos}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: `${ACCENT}18` }}>
              <HugeiconsIcon icon={CheckmarkCircleIcon} size={22} style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Pend. entrega</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{pendientesEntrega}</p>
            </div>
          </article>
        </div>

        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.96 0 0)", borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Cliente</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Equipo</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Fecha préstamo</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Devolución</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : alquileres.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center justify-center size-14 rounded-2xl" style={{ backgroundColor: "oklch(0.96 0 0)" }}>
                          <HugeiconsIcon icon={AiFolderIcon} size={26} style={{ color: "oklch(0.8 0 0)" }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: CHARCOAL }}>No hay alquileres registrados</p>
                        <p className="text-xs max-w-xs text-center" style={{ color: MUTED }}>
                          Aún no se han registrado préstamos de equipos
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : alquileres.map((a) => {
                  const devuelto = !!a.fecha_devolucion
                  const entregado = !!a.fecha_entrega

                  let estado: string
                  if (devuelto) estado = "devuelto"
                  else if (entregado) estado = "prestado"
                  else estado = "pendiente"

                  const st = getStatus(estado)

                  return (
                    <tr key={a.id} className="group transition-colors hover:bg-gray-50/60" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center size-7 rounded-full shrink-0 text-[11px] font-semibold" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
                            {(a.cliente_nombre ?? "?").charAt(0)}
                          </div>
                          <span className="text-sm font-medium" style={{ color: CHARCOAL }}>{a.cliente_nombre ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: CHARCOAL }}>{a.equipo?.nombre ?? "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: MUTED }}>{formatDate(a.fecha_prestamo ?? a.created_at)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: devuelto ? "oklch(0.58 0.16 145)" : MUTED }}>
                          {devuelto ? formatDate(a.fecha_devolucion) : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!entregado && (
                            <button
                              onClick={() => handleEntregar(a.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                              style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}
                            >
                              <HugeiconsIcon icon={CheckmarkCircleIcon} size={12} /> Entregar
                            </button>
                          )}
                          {entregado && !devuelto && (
                            <button
                              onClick={() => handleDevolver(a.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                              style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)", color: "oklch(0.58 0.16 145)" }}
                            >
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
        </div>
      </main>
    </div>
  )
}
