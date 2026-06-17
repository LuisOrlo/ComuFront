import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SearchIcon,
  UserGroupIcon,
  UserCheckIcon,
  UserIcon,
  ArrowRight01Icon,
  CallIcon,
  Mail02Icon,
  Location01Icon,
  GraduationCapIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { secretariaService } from "@/services/secretaria.service"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

interface Estudiante {
  id: string
  tipo?: string
  nombres: string
  apellidos: string
  cedula: string
  correo?: string
  celular?: string
  ciudad?: { nombre: string } | null
  es_activo: boolean
  total_cursos?: number
  estado_pago?: string
  saldo_pendiente?: number
}

function SkeletonRows() {
  return Array.from({ length: 6 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
      {Array.from({ length: 7 }).map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "oklch(0.9 0 0)", width: j === 0 ? "90%" : "50%" }} />
        </td>
      ))}
    </tr>
  ))
}

export function SecretariaEstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Estudiante | null>(null)

  useEffect(() => {
    const params: Record<string, unknown> = { por_pagina: 50 }
    if (search) params.buscar = search
    secretariaService.getEstudiantes(params)
      .then((res) => setEstudiantes(res.datos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search])

  const activos = estudiantes.filter((e) => e.es_activo).length
  const total = estudiantes.length

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4 bg-white" style={{ borderColor: BORDER }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Estudiantes</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Registro y consulta de estudiantes</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: `${ACCENT}18` }}>
              <HugeiconsIcon icon={UserGroupIcon} size={22} style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Total estudiantes</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{total}</p>
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
              <HugeiconsIcon icon={GraduationCapIcon} size={22} style={{ color: "oklch(0.62 0.16 245)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Inscripciones</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>
                {estudiantes.reduce((s, e) => s + (e.total_cursos ?? 0), 0)}
              </p>
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
                  placeholder="Buscar por nombre o cédula..."
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
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estudiante</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Cédula</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Contacto</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado pago</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows />
                  ) : estudiantes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center justify-center size-14 rounded-2xl" style={{ backgroundColor: "oklch(0.96 0 0)" }}>
                            <HugeiconsIcon icon={UserGroupIcon} size={26} style={{ color: "oklch(0.8 0 0)" }} />
                          </div>
                          <p className="text-sm font-medium" style={{ color: CHARCOAL }}>No se encontraron estudiantes</p>
                          <p className="text-xs max-w-xs text-center" style={{ color: MUTED }}>
                            {search ? "Intenta con otro término de búsqueda" : "Aún no hay estudiantes registrados"}
                          </p>
                        </div>
                      </td>
                    </tr>
                    ) : estudiantes.map((e) => {
                      const pagoLabels: Record<string, string> = {
                        al_dia: "Al día", deudor: "Deudor", abonado: "Abonado", ninguno: "Ninguno"
                      }
                      const pagoColors: Record<string, string> = {
                        al_dia: "oklch(0.58 0.16 145)", deudor: "oklch(0.55 0.18 15)",
                        abonado: "oklch(0.62 0.14 85)", ninguno: MUTED
                      }
                      const pagoColor = pagoColors[e.estado_pago ?? 'ninguno'] ?? MUTED
                      const pagoLabel = pagoLabels[e.estado_pago ?? 'ninguno'] ?? '—'
                      const pagoBg = pagoColor + ' / 0.1'

                      return (
                      <tr
                        key={e.id}
                        onClick={() => setSelected(selected?.id === e.id ? null : e)}
                        className={`group transition-colors hover:bg-gray-50/60 cursor-pointer ${selected?.id === e.id ? "bg-gray-50/80" : ""}`}
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center size-8 rounded-full shrink-0 text-xs font-semibold" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
                              {e.nombres.charAt(0)}{(e.apellidos ?? '').charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>{e.nombres} {e.apellidos}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-mono tabular-nums" style={{ color: MUTED }}>{e.cedula}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {e.correo && (
                              <span className="text-xs flex items-center gap-1" style={{ color: MUTED }}>
                                <HugeiconsIcon icon={Mail02Icon} size={11} /> {e.correo}
                              </span>
                            )}
                            {e.celular && (
                              <span className="text-xs flex items-center gap-1" style={{ color: MUTED }}>
                                <HugeiconsIcon icon={CallIcon} size={11} /> {e.celular}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: pagoBg, color: pagoColor }}>
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: pagoColor }} />
                            {pagoLabel}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <button
                            className="flex items-center justify-center size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: "oklch(0.96 0 0)" }}
                          >
                            <HugeiconsIcon icon={ArrowRight01Icon} size={14} style={{ color: ACCENT }} />
                          </button>
                        </td>
                      </tr>
                    )})}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <aside className="w-80 shrink-0 rounded-xl border bg-white p-5" style={{ borderColor: BORDER }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold" style={{ color: CHARCOAL }}>Detalle del estudiante</h3>
                <button onClick={() => setSelected(null)} className="text-xs" style={{ color: MUTED }}>Cerrar</button>
              </div>

              <div className="flex flex-col items-center mb-5">
                <div className="flex items-center justify-center size-16 rounded-full text-lg font-bold mb-3" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
                  {selected.nombres.charAt(0)}{selected.apellidos.charAt(0)}
                </div>
                <p className="text-sm font-semibold text-center" style={{ color: CHARCOAL }}>
                  {selected.nombres} {selected.apellidos}
                </p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>{selected.cedula}</p>
              </div>

              <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                  <HugeiconsIcon icon={UserIcon} size={14} style={{ color: MUTED }} />
                  <span className="text-sm" style={{ color: CHARCOAL }}>
                    {selected.total_cursos ?? 0} curso(s) inscrito(s)
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <HugeiconsIcon icon={Location01Icon} size={14} style={{ color: MUTED }} />
                  <span className="text-sm" style={{ color: CHARCOAL }}>
                    Pago: {selected.estado_pago === 'al_dia' ? 'Al día' : selected.estado_pago === 'deudor' ? 'Deudor' : selected.estado_pago === 'abonado' ? 'Abonado' : 'Ninguno'}
                  </span>
                </div>
                {selected.correo && (
                  <div className="flex items-center gap-2.5">
                    <HugeiconsIcon icon={Mail02Icon} size={14} style={{ color: MUTED }} />
                    <span className="text-sm break-all" style={{ color: CHARCOAL }}>{selected.correo}</span>
                  </div>
                )}
                {selected.celular && (
                  <div className="flex items-center gap-2.5">
                    <HugeiconsIcon icon={CallIcon} size={14} style={{ color: MUTED }} />
                    <span className="text-sm" style={{ color: CHARCOAL }}>{selected.celular}</span>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  )
}
