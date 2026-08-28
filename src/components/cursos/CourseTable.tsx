import { HugeiconsIcon } from "@hugeicons/react"
import { ViewIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { type CSSProperties } from "react"
import { StatusBadge } from "./StatusBadge"
import { CiudadBadge } from "./CiudadBadge"
import type { Curso } from "@/services/cursos.service"

export type { Curso }

export function CourseTable({ cursos, onView }: {
  cursos: Curso[]
  onView?: (id: string) => void
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
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
                        {c.modalidad === "presencial" ? "Presencial" : "Virtual"}
                      </span>
                      {c.ciudad && <CiudadBadge ciudad={c.ciudad} />}
                    </div>
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
                        aria-label={`Ver detalle de ${c.nombre}`}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors duration-150 text-xs font-medium"
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
                        <HugeiconsIcon icon={ViewIcon} size={13} />
                        Ver detalle
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
