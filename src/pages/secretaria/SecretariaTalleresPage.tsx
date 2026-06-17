import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SearchIcon,
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  UserCheckIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { secretariaService } from "@/services/secretaria.service"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

interface Taller {
  id: string
  nombre: string
  descripcion?: string
  fecha_inicio?: string
  fecha_fin?: string
  capacidad?: number
  duracion_horas?: number
  costo?: number
  estado?: string
  inscripciones_count?: number
  horarios?: Array<{ dia_semana: string; hora_inicio: string; hora_fin: string }>
}

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
      {Array.from({ length: 7 }).map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "oklch(0.9 0 0)", width: j === 0 ? "85%" : "50%" }} />
        </td>
      ))}
    </tr>
  ))
}

const DIAS: Record<string, string> = {
  "1": "Lun", "2": "Mar", "3": "Mie", "4": "Jue", "5": "Vie", "6": "Sab", "7": "Dom",
}

function formatHora(hora: string) {
  return hora ? hora.substring(0, 5) : "—"
}

export function SecretariaTalleresPage() {
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const params: Record<string, unknown> = { per_page: 50 }
    if (search) params.search = search
    secretariaService.getTalleres(params)
      .then((res) => setTalleres(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search])

  const activos = talleres.filter((t) => t.estado === "activo" || t.estado === "pendiente").length
  const totalInscritos = talleres.reduce((sum, t) => sum + (t.inscripciones_count ?? 0), 0)

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4 bg-white" style={{ borderColor: BORDER }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Talleres</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Consulta de talleres e inscripciones</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: `${ACCENT}18` }}>
              <HugeiconsIcon icon={BookOpenIcon} size={22} style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Total talleres</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{talleres.length}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)" }}>
              <HugeiconsIcon icon={UserCheckIcon} size={22} style={{ color: "oklch(0.58 0.16 145)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Activos</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{activos}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.62 0.16 245 / 0.1)" }}>
              <HugeiconsIcon icon={UserGroupIcon} size={22} style={{ color: "oklch(0.62 0.16 245)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Inscritos</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{totalInscritos}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.62 0.14 85 / 0.12)" }}>
              <HugeiconsIcon icon={CalendarIcon} size={22} style={{ color: "oklch(0.62 0.14 85)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Próximos</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>
                {talleres.filter((t) => t.fecha_inicio && new Date(t.fecha_inicio) >= new Date()).length}
              </p>
            </div>
          </article>
        </div>

        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: BORDER }}>
            <div className="relative flex-1 max-w-xs">
              <HugeiconsIcon icon={SearchIcon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
              <input
                type="text"
                placeholder="Buscar taller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border bg-transparent outline-none transition-colors focus:border-[--focus]"
                style={{ borderColor: BORDER, "--focus": ACCENT } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.96 0 0)", borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Taller</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Fechas</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Horario</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Inscritos</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Costo</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Duración</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : talleres.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center justify-center size-14 rounded-2xl" style={{ backgroundColor: "oklch(0.96 0 0)" }}>
                          <HugeiconsIcon icon={BookOpenIcon} size={26} style={{ color: "oklch(0.8 0 0)" }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: CHARCOAL }}>No se encontraron talleres</p>
                        <p className="text-xs max-w-xs text-center" style={{ color: MUTED }}>
                          {search ? "Intenta con otro término de búsqueda" : "Aún no hay talleres registrados"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : talleres.map((t) => {
                  const horarios = t.horarios?.slice(0, 2) ?? []
                  return (
                    <tr key={t.id} className="group transition-colors hover:bg-gray-50/60" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>{t.nombre}</p>
                        {t.descripcion && (
                          <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: MUTED }}>{t.descripcion}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-sm" style={{ color: CHARCOAL }}>
                          <HugeiconsIcon icon={CalendarIcon} size={13} style={{ color: MUTED }} />
                          <span>{formatDate(t.fecha_inicio)}</span>
                          {t.fecha_fin && <span className="mx-1" style={{ color: MUTED }}>-</span>}
                          {t.fecha_fin && <span>{formatDate(t.fecha_fin)}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {horarios.length > 0 ? (
                          <div className="space-y-0.5">
                            {horarios.map((h, i) => (
                              <p key={i} className="text-xs flex items-center gap-1" style={{ color: MUTED }}>
                                <HugeiconsIcon icon={ClockIcon} size={11} style={{ color: MUTED }} />
                                {DIAS[h.dia_semana] ?? h.dia_semana} {formatHora(h.hora_inicio)}-{formatHora(h.hora_fin)}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs italic" style={{ color: "oklch(0.75 0 0)" }}>Sin horario</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium tabular-nums" style={{ color: CHARCOAL }}>
                          {t.inscripciones_count ?? 0}{t.capacidad ? `/${t.capacidad}` : ""}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold tabular-nums" style={{ color: t.costo ? CHARCOAL : MUTED }}>
                          {t.costo ? `$${t.costo.toFixed(2)}` : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: MUTED }}>
                          {t.duracion_horas ? `${t.duracion_horas}h` : "—"}
                        </span>
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
