import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckCircle, GraduationCapIcon, BookOpen01Icon,
  Calendar01Icon, Clock01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { CursoAbierto } from "@/services/cursos.service"
import type { Taller, HorarioTaller } from "@/services/taller.service"

const DAY_MAP: Record<number, string> = {
  1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 7: "Dom",
}

function formatSchedule(days: string[], hourStart: string, hourEnd: string): string {
  const time = `${hourStart.substring(0, 5)} - ${hourEnd.substring(0, 5)}`
  return `${days.join(" · ")}  ·  ${time}`
}

const DAY_NAMES: Record<number, string> = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 7: "Dom" }

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

function formatDateRange(start: string | null, end: string | null): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
  const s = start ? new Date(start).toLocaleDateString("es-ES", opts) : null
  const e = end ? new Date(end).toLocaleDateString("es-ES", opts) : null
  if (!s) return "—"
  if (!e || s === e) return s
  return `${s}  →  ${e}`
}

interface ListaStepProps {
  talleres: Taller[]
  cursosAbiertos: CursoAbierto[]
  selectedCourseId: string
  selectedTipo: string
  selectedCatalogoNombre: string
  loadingCursos: boolean
  onSelect: (id: string) => void
  onSwitchToTaller: () => void
  onBack: () => void
}

export function ListaStep({ talleres, cursosAbiertos, selectedCourseId, selectedTipo, selectedCatalogoNombre, loadingCursos, onSelect, onSwitchToTaller, onBack }: ListaStepProps) {
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
        {selectedTipo === "taller" ? (
          <>
            <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Tipo:</span>
            <span className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>Taller</span>
            <button onClick={onBack} className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors hover:bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>Cambiar</button>
          </>
        ) : (
          <>
            <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Tipo de curso selecionado:</span>
            <span className="text-sm font-bold" style={{ color: COLORS.ACCENT }}>{selectedCatalogoNombre}</span>
            <button onClick={onBack} className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors hover:bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>Cambiar</button>
          </>
        )}
      </div>
      {loadingCursos ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-lg bg-gray-50 border animate-pulse" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
          ))}
        </div>
      ) : (() => {
        const items: { tipo: "curso" | "taller"; id: string }[] = []
        if (selectedTipo === "taller") {
          items.push(...talleres.map(t => ({ tipo: "taller" as const, id: t.id })))
        } else {
          items.push(...cursosAbiertos.map(c => ({ tipo: "curso" as const, id: c.id })))
        }

        if (items.length === 0) {
          return (
            <div className="col-span-full py-8 text-center space-y-3">
              <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                No hay {selectedTipo === "curso" ? "cursos" : selectedTipo === "taller" ? "talleres" : "cursos personalizados"} disponibles
              </p>
              {selectedTipo === "curso" && talleres.length > 0 && (
                <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                  Hay {talleres.length} taller(es) disponible(s).{" "}
                  <button onClick={onSwitchToTaller}
                    className="font-semibold underline" style={{ color: COLORS.ACCENT }}>
                    Ver talleres
                  </button>
                </p>
              )}
            </div>
          )
        }

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {items.map(item => {
              const selected = selectedCourseId === item.id
              if (item.tipo === "taller") {
                const t = talleres.find(ta => ta.id === item.id)
                if (!t) return null
                return (
                  <div key={t.id} onClick={() => onSelect(t.id)}
                    className="rounded-lg border p-3.5 cursor-pointer transition-all shadow-sm hover:shadow-md relative active:scale-[0.98] hover-orange"
                    style={{ borderColor: selected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selected ? `color-mix(in srgb, ${COLORS.ACCENT} 4%, transparent)` : "white", borderLeft: `3px solid ${selected ? COLORS.ACCENT : "#e5e7eb"}` }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="size-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "oklch(0.92 0.05 80)" }}>
                        <HugeiconsIcon icon={BookOpen01Icon} size={12} style={{ color: "oklch(0.55 0.12 70)" }} />
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "oklch(0.92 0.05 80)", color: "oklch(0.55 0.12 70)" }}>Taller</span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug mb-2" style={{ color: selected ? COLORS.ACCENT : COLORS.CHARCOAL }}>{t.nombre}</h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <HugeiconsIcon icon={Calendar01Icon} size={13} style={{ color: COLORS.ACCENT }} />
                        <span style={{ color: COLORS.CHARCOAL }}>{formatDateRange(t.fecha ?? null, t.fecha_fin ?? null)}</span>
                      </div>
                      {(() => {
                        const horarioStr = agruparHorariosTaller(t.horarios)
                        if (horarioStr) {
                          return (
                            <div className="flex items-start gap-1.5">
                               <HugeiconsIcon icon={Clock01Icon} size={13} style={{ color: "oklch(0.55 0.15 220)" }} className="mt-0.5 shrink-0" />
                              <span style={{ color: COLORS.CHARCOAL }}>{horarioStr}</span>
                            </div>
                          )
                        }
                        if (t.hora_inicio && t.hora_fin) {
                          return (
                            <div className="flex items-center gap-1.5">
                              <HugeiconsIcon icon={Clock01Icon} size={13} style={{ color: "oklch(0.55 0.15 220)" }} />
                              <span style={{ color: COLORS.CHARCOAL }}>{t.hora_inicio.substring(0, 5)} - {t.hora_fin.substring(0, 5)}</span>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                    {selected && <div className="absolute top-1.5 right-1.5"><HugeiconsIcon icon={CheckCircle} size={14} style={{ color: COLORS.ACCENT }} /></div>}
                  </div>
                )
              }
              const ca = cursosAbiertos.find(c => c.id === item.id)
              if (!ca) return null
              return (
                <div key={ca.id} onClick={() => onSelect(ca.id)}
                  className="rounded-lg border p-3.5 cursor-pointer transition-all shadow-sm hover:shadow-md relative active:scale-[0.98] hover-orange"
                  style={{ borderColor: selected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selected ? `color-mix(in srgb, ${COLORS.ACCENT} 4%, transparent)` : "white", borderLeft: `3px solid ${selected ? COLORS.ACCENT : "#e5e7eb"}` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="size-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "oklch(0.92 0.08 220)" }}>
                      <HugeiconsIcon icon={GraduationCapIcon} size={12} style={{ color: "oklch(0.45 0.12 220)" }} />
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "oklch(0.92 0.08 220)", color: "oklch(0.45 0.12 220)" }}>Curso</span>
                  </div>
                  <h3 className="text-sm font-bold leading-snug mb-2" style={{ color: selected ? COLORS.ACCENT : COLORS.CHARCOAL }}>{ca.nombre_instancia || ca.catalogo?.nombre}</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={Calendar01Icon} size={13} style={{ color: COLORS.ACCENT }} />
                      <span style={{ color: COLORS.CHARCOAL }}>{formatDateRange(ca.fecha_inicio, ca.fecha_fin)}</span>
                    </div>
                    {(() => {
                      const horarioStr = agruparHorariosCurso(ca.horario)
                      if (horarioStr) {
                        return (
                          <div className="flex items-start gap-1.5">
                            <HugeiconsIcon icon={Clock01Icon} size={13} style={{ color: "oklch(0.55 0.15 220)" }} className="mt-0.5 shrink-0" />
                            <span style={{ color: COLORS.CHARCOAL }}>{horarioStr}</span>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                  {selected && <div className="absolute top-1.5 right-1.5"><HugeiconsIcon icon={CheckCircle} size={14} style={{ color: COLORS.ACCENT }} /></div>}
                </div>
              )
            })}
          </div>
        )
      })()}
    </motion.div>
  )
}

