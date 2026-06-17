import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SearchIcon,
  GraduationCapIcon,
  UserGroupIcon,
  CalendarIcon,
  BookOpenIcon,
  ClockIcon,
  UserIcon,
  Cancel01Icon,
  AiLearningIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { formatDate, getStatus } from "@/lib/utils"
import { secretariaService, type Curso } from "@/services/secretaria.service"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function SkeletonRows({ cols }: { cols: number }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "oklch(0.9 0 0)", width: j === 0 ? "100%" : "60%" }} />
        </td>
      ))}
    </tr>
  ))
}

interface CursoDetail {
  id: string
  nombre: string
  catalogo?: { nombre: string }
  fecha_inicio: string
  fecha_fin?: string
  instructor?: { nombres: string; apellidos: string }
  capacidad: number
  matriculas_count?: number
  estado: string
  horarios?: Array<{ dia_semana: string; hora_inicio: string; hora_fin: string; aula?: string }>
  modulos_count?: number
}

const DIAS: Record<string, string> = {
  "1": "Lun", "2": "Mar", "3": "Mie", "4": "Jue",
  "5": "Vie", "6": "Sab", "7": "Dom",
}

function formatHora(hora: string) {
  return hora ? hora.substring(0, 5) : "—"
}

export function SecretariaCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Curso | null>(null)
  const [detail, setDetail] = useState<CursoDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    secretariaService.getCursos({ search, per_page: 50 })
      .then((res) => setCursos(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search])

  const handleSelect = async (curso: Curso) => {
    if (selected?.id === curso.id) {
      setSelected(null)
      setDetail(null)
      return
    }
    setSelected(curso)
    setDetailLoading(true)
    try {
      const res = await secretariaService.getCurso(curso.id)
      setDetail(res.datos ?? res.data ?? res)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const activos = cursos.filter((c) => c.estado === "activo").length
  const totalInscritos = cursos.reduce((sum, c) => sum + (c.matriculas_count ?? 0), 0)
  const ocupacion = cursos.length > 0
    ? Math.round(cursos.reduce((sum, c) => sum + ((c.matriculas_count ?? 0) / Math.max(c.capacidad ?? 0, 1)), 0) / cursos.length * 100)
    : 0

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4 bg-white" style={{ borderColor: BORDER }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Cursos</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Consulta de cursos activos y matrículas</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)" }}>
              <HugeiconsIcon icon={GraduationCapIcon} size={22} style={{ color: "oklch(0.58 0.16 145)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Total cursos</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{cursos.length}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: `${ACCENT}18` }}>
              <HugeiconsIcon icon={BookOpenIcon} size={22} style={{ color: ACCENT }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Activos</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{activos}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.62 0.16 245 / 0.1)" }}>
              <HugeiconsIcon icon={UserGroupIcon} size={22} style={{ color: "oklch(0.62 0.16 245)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Matriculados</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{totalInscritos}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.62 0.14 85 / 0.12)" }}>
              <HugeiconsIcon icon={CalendarIcon} size={22} style={{ color: "oklch(0.62 0.14 85)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Ocupación</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{ocupacion}%</p>
            </div>
          </article>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 min-w-0 rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: BORDER }}>
              <div className="relative flex-1 max-w-xs">
                <HugeiconsIcon icon={SearchIcon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
                <input
                  type="text"
                  placeholder="Buscar curso..."
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
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Curso</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Inicio</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Instructor</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Matriculados</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows cols={5} />
                  ) : cursos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center justify-center size-14 rounded-2xl" style={{ backgroundColor: "oklch(0.96 0 0)" }}>
                            <HugeiconsIcon icon={GraduationCapIcon} size={26} style={{ color: "oklch(0.8 0 0)" }} />
                          </div>
                          <p className="text-sm font-medium" style={{ color: CHARCOAL }}>No se encontraron cursos</p>
                          <p className="text-xs max-w-xs text-center" style={{ color: MUTED }}>
                            {search ? "Intenta con otro término de búsqueda" : "Aún no hay cursos registrados en el sistema"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : cursos.map((c) => {
                    const st = getStatus(c.estado)
                    const ratio = (c.matriculas_count ?? 0) / Math.max(c.capacidad ?? 0, 1)
                    const ratioPct = Math.round(ratio * 100)
                    const ratioColor = ratio >= 0.85 ? "oklch(0.55 0.18 15)" : ratio >= 0.6 ? ACCENT : "oklch(0.58 0.16 145)"
                    const instructor = c.instructor ? `${c.instructor.nombres} ${c.instructor.apellidos}` : null
                    const isSelected = selected?.id === c.id

                    return (
                      <tr
                        key={c.id}
                        onClick={() => handleSelect(c)}
                        className={`group transition-colors hover:bg-gray-50/60 cursor-pointer ${isSelected ? "bg-gray-50/80" : ""}`}
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                            {c.catalogo?.nombre ?? c.nombre}
                          </p>
                          {c.catalogo?.nombre && c.nombre && c.nombre !== c.catalogo.nombre && (
                            <p className="text-xs mt-0.5" style={{ color: MUTED }}>{c.nombre}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm" style={{ color: CHARCOAL }}>{formatDate(c.fecha_inicio)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {instructor ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center size-7 rounded-full shrink-0 text-[11px] font-semibold" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
                                {instructor.charAt(0)}
                              </div>
                              <span className="text-sm" style={{ color: CHARCOAL }}>{instructor}</span>
                            </div>
                          ) : (
                            <span className="text-sm italic" style={{ color: "oklch(0.75 0 0)" }}>Sin asignar</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "oklch(0.9 0 0)" }}>
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${ratioPct}%`, backgroundColor: ratioColor }}
                              />
                            </div>
                            <span className="text-xs font-semibold tabular-nums" style={{ color: CHARCOAL }}>
                              {c.matriculas_count ?? 0}/{c.capacidad ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: st.bg, color: st.color }}
                          >
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <aside className="w-80 shrink-0 rounded-xl border bg-white" style={{ borderColor: BORDER }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
                <h3 className="text-sm font-semibold" style={{ color: CHARCOAL }}>Detalle del curso</h3>
                <button
                  onClick={() => { setSelected(null); setDetail(null) }}
                  className="flex items-center justify-center size-7 rounded-lg transition-colors hover:bg-gray-100"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} style={{ color: MUTED }} />
                </button>
              </div>

              {detailLoading ? (
                <div className="px-5 py-8 space-y-3">
                  <div className="h-4 rounded animate-pulse w-3/4" style={{ backgroundColor: "oklch(0.9 0 0)" }} />
                  <div className="h-4 rounded animate-pulse w-1/2" style={{ backgroundColor: "oklch(0.93 0 0)" }} />
                  <div className="h-16 rounded animate-pulse mt-3" style={{ backgroundColor: "oklch(0.96 0 0)" }} />
                </div>
              ) : (
                <div className="px-5 py-4 space-y-4">
                  <div>
                    <p className="text-base font-semibold" style={{ color: CHARCOAL }}>
                      {detail?.catalogo?.nombre ?? detail?.nombre ?? selected.catalogo?.nombre ?? selected.nombre}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                      Inicio: {formatDate(detail?.fecha_inicio ?? selected.fecha_inicio)}
                      {detail?.fecha_fin && ` — Fin: ${formatDate(detail.fecha_fin)}`}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <HugeiconsIcon icon={UserIcon} size={14} style={{ color: MUTED }} />
                      <span className="text-sm" style={{ color: CHARCOAL }}>
                        {detail?.instructor
                          ? `${detail.instructor.nombres} ${detail.instructor.apellidos}`
                          : selected.instructor
                            ? `${selected.instructor.nombres} ${selected.instructor.apellidos}`
                            : "Sin instructor asignado"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <HugeiconsIcon icon={UserGroupIcon} size={14} style={{ color: MUTED }} />
                      <span className="text-sm" style={{ color: CHARCOAL }}>
                        {(detail?.matriculas_count ?? selected.matriculas_count ?? 0)} matriculados
                        {" "}de {detail?.capacidad ?? selected.capacidad} cupos
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <HugeiconsIcon icon={AiLearningIcon} size={14} style={{ color: MUTED }} />
                      <span className="text-sm" style={{ color: CHARCOAL }}>
                        {detail?.modulos_count != null ? `${detail.modulos_count} módulos` : "—"}
                      </span>
                    </div>
                  </div>

                  {detail?.horarios && detail.horarios.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>Horarios</p>
                      <div className="space-y-1.5">
                        {detail.horarios.map((h, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5"
                            style={{ backgroundColor: "oklch(0.96 0 0)" }}>
                            <HugeiconsIcon icon={ClockIcon} size={12} style={{ color: ACCENT }} />
                            <span style={{ color: CHARCOAL }}>
                              {DIAS[h.dia_semana] ?? h.dia_semana} {formatHora(h.hora_inicio)} - {formatHora(h.hora_fin)}
                            </span>
                            {h.aula && <span className="ml-auto" style={{ color: MUTED }}>{h.aula}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t" style={{ borderColor: BORDER }}>
                    <button
                      onClick={() => setSelected(null)}
                      className="w-full text-xs font-semibold py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: "oklch(0.96 0 0)", color: MUTED }}
                    >
                      Cerrar detalle
                    </button>
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
      </main>
    </div>
  )
}
