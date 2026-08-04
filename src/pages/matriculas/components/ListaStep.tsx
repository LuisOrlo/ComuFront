import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckCircle, GraduationCapIcon, BookOpen01Icon,
  Calendar01Icon, Clock01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { iconMap } from "@/pages/catalogos/components/catalog-icons"

const SEL = "oklch(0.55 0.16 145)"
import type { CursoAbierto } from "@/services/cursos.service"
import type { Taller, HorarioTaller } from "@/services/taller.service"

const DAY_MAP: Record<number, string> = {
  1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado", 7: "Domingo",
}

function formatSchedule(days: string[], hourStart: string, hourEnd: string): string {
  const time = `${hourStart.substring(0, 5)} - ${hourEnd.substring(0, 5)}`
  return `${days.join(" · ")}  ·  ${time}`
}

const DAY_NAMES: Record<number, string> = { 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado", 7: "Domingo" }

function agruparHorariosCurso(horario: CursoAbierto["horario"]): string {
  if (!horario) return ""
  let days: string[] | undefined
  if (horario.dia_semana && horario.dia_semana.length > 0) {
    days = horario.dia_semana.map(d => DAY_NAMES[d] || `D${d}`)
  } else if (horario.dias_semana && horario.dias_semana.length > 0) {
    days = horario.dias_semana.map(d => DAY_NAMES[d.dia_semana] || `D${d.dia_semana}`)
  }
  const hs = horario.hora_inicio?.substring(0, 5)
  const he = horario.hora_fin?.substring(0, 5)
  if (!hs || !he) return ""
  if (!days) return `${hs} - ${he}`
  return formatSchedule(days, hs, he)
}

function agruparHorariosTaller(horarios: HorarioTaller[] | undefined): string {
  if (!horarios || horarios.length === 0) return ""
  const groups = new Map<string, string[]>()
  for (const h of horarios) {
    const key = `${h.hora_inicio?.substring(0, 5)}-${h.hora_fin?.substring(0, 5)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(DAY_MAP[h.dia_semana] || `D${h.dia_semana}`)
  }
  return Array.from(groups.entries())
    .map(([key, days]) => {
      const [hs, he] = key.split("-")
      return formatSchedule(days, hs, he)
    })
    .join(" | ")
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
  return new Date(dateStr).toLocaleDateString("es-ES", opts)
}

function parseHorario(horarioStr: string) {
  const idx = horarioStr.lastIndexOf("  ·  ")
  const days = idx >= 0 ? horarioStr.substring(0, idx) : ""
  const time = idx >= 0 ? horarioStr.substring(idx + 5) : horarioStr
  return { days, time, hasDays: days.length > 0 }
}

interface ListaStepProps {
  talleres: Taller[]
  cursosAbiertos: CursoAbierto[]
  selectedCourseId: string
  loadingCursos: boolean
  onSelect: (id: string) => void
  onBack: () => void
}

export function ListaStep({ talleres, cursosAbiertos, selectedCourseId, loadingCursos, onSelect, onBack }: ListaStepProps) {
  const items: { tipo: "curso" | "taller"; id: string }[] = [
    ...cursosAbiertos.map(c => ({ tipo: "curso" as const, id: c.id })),
    ...talleres.map(t => ({ tipo: "taller" as const, id: t.id })),
  ]

  const totalItems = cursosAbiertos.length + talleres.length

  return (
    <motion.div
      key="lista"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>
          {totalItems} disponible{totalItems !== 1 ? "s" : ""}
        </span>
        <button onClick={onBack} className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors hover:bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>Cambiar</button>
      </div>
      {loadingCursos ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-lg bg-gray-50 border animate-pulse" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="col-span-full py-8 text-center">
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
            No hay cursos ni talleres disponibles
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {items.map(item => {
            const selected = selectedCourseId === item.id
            if (item.tipo === "taller") {
              const t = talleres.find(ta => ta.id === item.id)
              if (!t) return null
              const hasFechaFin = t.fecha_fin && t.fecha_fin !== t.fecha
              const horarioStr = agruparHorariosTaller(t.horarios)
              const fallbackHora = !horarioStr && t.hora_inicio && t.hora_fin
              return (
                <div key={t.id} onClick={() => onSelect(t.id)}
                  className="rounded-lg border p-3.5 cursor-pointer transition-all shadow-sm hover:shadow-md relative active:scale-[0.98] hover-orange"
                  style={{ borderColor: selected ? SEL : COLORS.BORDER_SUBTLE, backgroundColor: selected ? `color-mix(in srgb, ${SEL} 4%, transparent)` : "white", borderLeft: `3px solid ${selected ? SEL : "#e5e7eb"}` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="size-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "oklch(0.92 0.05 80)" }}>
                      <HugeiconsIcon icon={BookOpen01Icon} size={12} style={{ color: "oklch(0.55 0.12 70)" }} />
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "oklch(0.92 0.05 80)", color: "oklch(0.55 0.12 70)" }}>Taller</span>
                  </div>
                  <h3 className="text-sm font-bold leading-snug mb-2" style={{ color: selected ? SEL : COLORS.CHARCOAL }}>{t.nombre}</h3>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <HugeiconsIcon icon={Calendar01Icon} size={13} className="shrink-0" style={{ color: SEL }} />
                      <div className="min-w-0">
                        <span style={{ color: COLORS.TEXT_MUTED }}>Inicio:</span>
                        <span className="ml-0.5" style={{ color: COLORS.CHARCOAL }}>{formatDate(t.fecha ?? null)}</span>
                      </div>
                    </div>
                    {horarioStr ? (() => {
                      const { days, time, hasDays } = parseHorario(horarioStr)
                      return (
                        <div className="flex items-start gap-1.5 min-w-0">
                          <HugeiconsIcon icon={Clock01Icon} size={13} className="mt-0.5 shrink-0" style={{ color: "oklch(0.55 0.15 220)" }} />
                          <div className="min-w-0">
                            {hasDays && <div className="truncate"><span style={{ color: COLORS.TEXT_MUTED }}>Horario: </span><span style={{ color: COLORS.CHARCOAL }}>{days}</span></div>}
                            <div><span style={{ color: COLORS.TEXT_MUTED }}>Hora: </span><span style={{ color: COLORS.CHARCOAL }}>{time}</span></div>
                          </div>
                        </div>
                      )
                    })() : fallbackHora ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <HugeiconsIcon icon={Clock01Icon} size={13} className="shrink-0" style={{ color: "oklch(0.55 0.15 220)" }} />
                        <div className="min-w-0">
                          <span style={{ color: COLORS.TEXT_MUTED }}>Hora: </span>
                          <span style={{ color: COLORS.CHARCOAL }}>{t.hora_inicio!.substring(0, 5)} - {t.hora_fin!.substring(0, 5)}</span>
                        </div>
                      </div>
                    ) : null}
                    {hasFechaFin && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <HugeiconsIcon icon={Calendar01Icon} size={13} className="shrink-0" style={{ color: "oklch(0.55 0.15 220)" }} />
                        <div className="min-w-0">
                          <span style={{ color: COLORS.TEXT_MUTED }}>Fin:</span>
                          <span className="ml-0.5" style={{ color: COLORS.CHARCOAL }}>{formatDate(t.fecha_fin ?? null)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {selected && <div className="absolute top-1.5 right-1.5"><HugeiconsIcon icon={CheckCircle} size={14} style={{ color: SEL }} /></div>}
                </div>
              )
            }
            const ca = cursosAbiertos.find(c => c.id === item.id)
            if (!ca) return null
            const catColor = ca.catalogo?.color || "oklch(0.45 0.08 280)"
            const catIcon = ca.catalogo?.imagen && iconMap[ca.catalogo.imagen]
            const hasFechaFin = ca.fecha_fin && ca.fecha_fin !== ca.fecha_inicio
            const horarioCursoStr = agruparHorariosCurso(ca.horario)
            return (
                <div key={ca.id} onClick={() => onSelect(ca.id)}
                  className="rounded-lg border p-3.5 cursor-pointer transition-all shadow-sm hover:shadow-md relative active:scale-[0.98] hover-orange"
                  style={{ borderColor: selected ? SEL : COLORS.BORDER_SUBTLE, backgroundColor: selected ? `color-mix(in srgb, ${SEL} 4%, transparent)` : "white", borderLeft: `3px solid ${selected ? SEL : "#e5e7eb"}` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="size-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "oklch(0.92 0.08 220)" }}>
                      <HugeiconsIcon icon={GraduationCapIcon} size={12} style={{ color: "oklch(0.45 0.12 220)" }} />
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "oklch(0.92 0.08 220)", color: "oklch(0.45 0.12 220)" }}>Curso</span>
                    {ca.catalogo?.nombre && (
                      <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1"
                        style={{ backgroundColor: `color-mix(in srgb, ${catColor} 20%, transparent)`, color: catColor }}>
                        {catIcon && <HugeiconsIcon icon={catIcon} size={16} />}
                        {ca.catalogo.nombre}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold leading-snug mb-2" style={{ color: selected ? SEL : COLORS.CHARCOAL }}>{ca.nombre_instancia || ca.catalogo?.nombre}</h3>
                  {ca.catalogo?.descripcion && (
                    <p className="text-[11px] mb-2 line-clamp-2" style={{ color: COLORS.TEXT_MUTED }}>{ca.catalogo.descripcion}</p>
                  )}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <HugeiconsIcon icon={Calendar01Icon} size={13} className="shrink-0" style={{ color: SEL }} />
                      <div className="min-w-0">
                        <span style={{ color: COLORS.TEXT_MUTED }}>Inicio:</span>
                        <span className="ml-0.5" style={{ color: COLORS.CHARCOAL }}>{formatDate(ca.fecha_inicio)}</span>
                      </div>
                    </div>
                    {horarioCursoStr ? (() => {
                      const { days, time, hasDays } = parseHorario(horarioCursoStr)
                      return (
                        <div className="flex items-start gap-1.5 min-w-0">
                          <HugeiconsIcon icon={Clock01Icon} size={13} className="mt-0.5 shrink-0" style={{ color: "oklch(0.55 0.15 220)" }} />
                          <div className="min-w-0">
                            {hasDays && <div className="truncate"><span style={{ color: COLORS.TEXT_MUTED }}>Horario: </span><span style={{ color: COLORS.CHARCOAL }}>{days}</span></div>}
                            <div><span style={{ color: COLORS.TEXT_MUTED }}>Hora: </span><span style={{ color: COLORS.CHARCOAL }}>{time}</span></div>
                          </div>
                        </div>
                      )
                    })() : null}
                    {hasFechaFin && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <HugeiconsIcon icon={Calendar01Icon} size={13} className="shrink-0" style={{ color: "oklch(0.55 0.15 220)" }} />
                        <div className="min-w-0">
                          <span style={{ color: COLORS.TEXT_MUTED }}>Fin:</span>
                          <span className="ml-0.5" style={{ color: COLORS.CHARCOAL }}>{formatDate(ca.fecha_fin)}</span>
                        </div>
                      </div>
                    )}
                </div>
                {selected && <div className="absolute top-1.5 right-1.5"><HugeiconsIcon icon={CheckCircle} size={14} style={{ color: SEL }} /></div>}
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
