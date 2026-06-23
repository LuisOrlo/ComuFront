import { HugeiconsIcon } from "@hugeicons/react"
import { ViewIcon, Edit01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { type CSSProperties } from "react"
import { StatusBadge } from "./StatusBadge"
import type { Curso } from "@/services/cursos.service"

export type { Curso }

export function CourseTable({ cursos, onView, onEdit, onDelete }: {
  cursos: Curso[]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              {["Nombre del curso", "Modalidad / Ciudad", "Instructor", "Progreso", "Estudiantes", "Estado", ""].map(
                (h, i) => (
                  <th
                    key={`course-table-h-${i}`}
                    className="py-3 px-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: COLORS.TEXT_MUTED }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE } as CSSProperties}>
            {cursos.map((c) => {
              const pct = Math.round((c.estudiantes / c.capacidad) * 100)
              return (
                <tr
                  key={c.id}
                  className="group transition-colors duration-150"
                  style={{ ["--hover-bg" as string]: "oklch(0.98 0 0)" } as React.CSSProperties}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "oklch(0.98 0 0)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td
                    className="py-3 px-4 text-sm font-semibold"
                    style={{
                      color: COLORS.CHARCOAL,
                      borderLeft: c.colorCatalogo ? `3px solid ${c.colorCatalogo}` : undefined,
                    }}
                  >
                    {c.nombre}
                  </td>
                 
                  <td className="py-3 px-4">
                    <span className="text-sm" style={{ color: COLORS.CHARCOAL }}>
                      {c.modalidad === "presencial" ? "Presencial" : "Virtual"}
                    </span>
                    {c.ciudad && (
                      <span className="block text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>
                        {c.ciudad}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm" style={{ color: COLORS.CHARCOAL }}>
                    {c.instructor}
                  </td>
                  <td className="py-3 px-4 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    Mód. {c.moduloActual} / {c.totalModulos}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 w-24">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: COLORS.CHARCOAL }}>
                          {c.estudiantes}/{c.capacidad}
                        </span>
                        <span className="font-medium" style={{ color: COLORS.ACCENT }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${COLORS.ACCENT}, color-mix(in srgb, ${COLORS.ACCENT} 85%, white))`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge estado={c.estado} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); onView?.(c.id) }}
                        className="size-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                        style={{ color: COLORS.TEXT_MUTED }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = COLORS.ACCENT
                          e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = COLORS.TEXT_MUTED
                          e.currentTarget.style.backgroundColor = "transparent"
                        }}
                      >
                        <HugeiconsIcon icon={ViewIcon} size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(c.id) }}
                        className="size-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                        style={{ color: COLORS.TEXT_MUTED }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "oklch(0.50 0.12 250)"
                          e.currentTarget.style.backgroundColor = "oklch(0.50 0.12 250 / 0.10)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = COLORS.TEXT_MUTED
                          e.currentTarget.style.backgroundColor = "transparent"
                        }}
                      >
                        <HugeiconsIcon icon={Edit01Icon} size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(c.id) }}
                        className="size-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                        style={{ color: COLORS.TEXT_MUTED }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "oklch(0.50 0.12 10)"
                          e.currentTarget.style.backgroundColor = "oklch(0.50 0.12 10 / 0.10)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = COLORS.TEXT_MUTED
                          e.currentTarget.style.backgroundColor = "transparent"
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
