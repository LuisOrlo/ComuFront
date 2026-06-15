import { useState, useEffect, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircleIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { secretariaService, type SolicitudInscripcion } from "@/services/secretaria.service"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

export function SecretariaSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudInscripcion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")

  const fetchSolicitudes = useCallback(() => {
    const params: Record<string, unknown> = { per_page: 50 }
    if (filter) params.estado = filter
    secretariaService.getSolicitudes(params)
      .then((res) => setSolicitudes(res.data ?? []))
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { fetchSolicitudes() }, [fetchSolicitudes])

  const handleAprobar = async (id: string) => {
    try {
      await secretariaService.aprobarSolicitud(id)
      toast.success("Solicitud aprobada")
      fetchSolicitudes()
    } catch { toast.error("Error al aprobar") }
  }

  const handleRechazar = async (id: string) => {
    try {
      await secretariaService.rechazarSolicitud(id)
      toast.success("Solicitud rechazada")
      fetchSolicitudes()
    } catch { toast.error("Error al rechazar") }
  }

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4" style={{ borderColor: BORDER, backgroundColor: "white" }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Solicitudes de Inscripción</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Validación y aprobación de solicitudes</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: BORDER }}>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-lg border bg-white outline-none" style={{ borderColor: BORDER, color: CHARCOAL }}>
              <option value="">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobadas</option>
              <option value="rechazado">Rechazadas</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ACCENT }} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Solicitante</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Curso</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Fecha</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: MUTED }}>No hay solicitudes</td></tr>
                  ) : solicitudes.map((s: SolicitudInscripcion) => (
                    <tr key={s.id} className="transition-colors hover:bg-gray-50/40" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium" style={{ color: CHARCOAL }}>{s.estudiante ? `${s.estudiante.nombres} ${s.estudiante.apellidos}` : s.participante_externo ? `${s.participante_externo.nombres} ${s.participante_externo.apellidos}` : "—"}</p>
                      </td>
                      <td className="px-5 py-3.5"><span className="text-sm" style={{ color: MUTED }}>{s.curso_abierto?.catalogo?.nombre ?? "—"}</span></td>
                      <td className="px-5 py-3.5"><span className="text-sm" style={{ color: MUTED }}>{s.created_at}</span></td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: s.estado === "aprobado" ? "oklch(0.58 0.16 145 / 0.1)" : s.estado === "rechazado" ? "oklch(0.55 0.18 15 / 0.1)" : "oklch(0.62 0.14 85 / 0.12)", color: s.estado === "aprobado" ? "oklch(0.58 0.16 145)" : s.estado === "rechazado" ? "oklch(0.55 0.18 15)" : "oklch(0.62 0.14 85)" }}>
                          {s.estado}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {s.estado === "pendiente" && (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleAprobar(s.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                              style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)", color: "oklch(0.58 0.16 145)" }}>
                              <HugeiconsIcon icon={CheckmarkCircleIcon} size={12} /> Aprobar
                            </button>
                            <button onClick={() => handleRechazar(s.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                              style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.1)", color: "oklch(0.55 0.18 15)" }}>
                              <HugeiconsIcon icon={Cancel01Icon} size={12} /> Rechazar
                            </button>
                          </div>
                        )}
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
