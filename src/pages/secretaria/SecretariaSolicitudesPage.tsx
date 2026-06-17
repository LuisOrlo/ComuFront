import { useState, useEffect, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircleIcon,
  Cancel01Icon,
  ClockIcon,
  UserCheckIcon,
  File02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { formatDate, getStatus } from "@/lib/utils"
import { secretariaService, type SolicitudInscripcion } from "@/services/secretaria.service"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
      {Array.from({ length: 7 }).map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "oklch(0.9 0 0)", width: j === 0 ? "90%" : "50%" }} />
        </td>
      ))}
    </tr>
  ))
}

export function SecretariaSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudInscripcion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")

  const fetchSolicitudes = useCallback(() => {
    const params: Record<string, unknown> = { per_page: 50 }
    if (filter) params.estado = filter
    secretariaService.getSolicitudes(params)
      .then((res) => setSolicitudes(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { fetchSolicitudes() }, [fetchSolicitudes])

  const handleAprobar = async (id: string) => {
    try {
      await secretariaService.aprobarSolicitud(id)
      toast.success("Solicitud aprobada exitosamente")
      fetchSolicitudes()
    } catch { toast.error("Error al aprobar solicitud") }
  }

  const handleRechazar = async (id: string) => {
    try {
      await secretariaService.rechazarSolicitud(id)
      toast.success("Solicitud rechazada")
      fetchSolicitudes()
    } catch { toast.error("Error al rechazar solicitud") }
  }

  const pendientes = solicitudes.filter((s) => s.estado === "pendiente").length
  const aprobadas = solicitudes.filter((s) => s.estado === "aprobado").length
  const rechazadas = solicitudes.filter((s) => s.estado === "rechazado").length

  function getSolicitante(s: SolicitudInscripcion): string {
    if (s.estudiante) return `${s.estudiante.nombres} ${s.estudiante.apellidos}`
    if (s.participante_externo) return `${s.participante_externo.nombres} ${s.participante_externo.apellidos}`
    return "—"
  }

  function getCurso(s: SolicitudInscripcion): string {
    return s.curso_abierto?.catalogo?.nombre ?? "—"
  }

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4 bg-white" style={{ borderColor: BORDER }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Solicitudes de Inscripción</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Validación y aprobación de solicitudes de estudiantes</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Aprobadas</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{aprobadas}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.1)" }}>
              <HugeiconsIcon icon={Cancel01Icon} size={22} style={{ color: "oklch(0.55 0.18 15)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Rechazadas</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{rechazadas}</p>
            </div>
          </article>
        </div>

        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: BORDER }}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-lg border bg-white outline-none transition-colors focus:border-[--focus]"
              style={{ borderColor: BORDER, color: CHARCOAL, "--focus": ACCENT } as React.CSSProperties}
            >
              <option value="">Todas las solicitudes</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobadas</option>
              <option value="rechazado">Rechazadas</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.96 0 0)", borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Solicitante</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Curso o Taller</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Fecha</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Comprobante</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center justify-center size-14 rounded-2xl" style={{ backgroundColor: "oklch(0.96 0 0)" }}>
                          <HugeiconsIcon icon={UserGroupIcon} size={26} style={{ color: "oklch(0.8 0 0)" }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: CHARCOAL }}>No se encontraron solicitudes</p>
                        <p className="text-xs max-w-xs text-center" style={{ color: MUTED }}>
                          {filter ? "No hay solicitudes con ese estado" : "Aún no hay solicitudes de inscripción pendientes"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : solicitudes.map((s) => {
                  const st = getStatus(s.estado)
                  const nombre = getSolicitante(s)
                  const curso = getCurso(s)
                  const initial = nombre !== "—" ? nombre.charAt(0) : "?"

                  return (
                    <tr key={s.id} className="group transition-colors hover:bg-gray-50/60" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center size-7 rounded-full shrink-0 text-[11px] font-semibold" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
                            {initial}
                          </div>
                          <span className="text-sm font-medium" style={{ color: CHARCOAL }}>{nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: CHARCOAL }}>{curso}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: MUTED }}>{formatDate(s.created_at)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {(s as SolicitudInscripcion & { comprobante_url?: string }).comprobante_url ? (
                          <a
                            href={(s as SolicitudInscripcion & { comprobante_url?: string }).comprobante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                            style={{ backgroundColor: "oklch(0.62 0.16 245 / 0.1)", color: "oklch(0.62 0.16 245)" }}
                          >
                            <HugeiconsIcon icon={File02Icon} size={12} /> Ver
                          </a>
                        ) : (
                          <span className="text-xs italic" style={{ color: "oklch(0.75 0 0)" }}>Sin comprobante</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {s.estado === "pendiente" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAprobar(s.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                              style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)", color: "oklch(0.58 0.16 145)" }}
                            >
                              <HugeiconsIcon icon={CheckmarkCircleIcon} size={12} /> Aprobar
                            </button>
                            <button
                              onClick={() => handleRechazar(s.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                              style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.1)", color: "oklch(0.55 0.18 15)" }}
                            >
                              <HugeiconsIcon icon={Cancel01Icon} size={12} /> Rechazar
                            </button>
                          </div>
                        )}
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
