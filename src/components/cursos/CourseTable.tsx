import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { CiudadBadge } from "./CiudadBadge"
import { ModalidadBadge } from "@/pages/estudiantes/components/Badges"
import type { Curso } from "@/services/cursos.service"

export type { Curso }

export function CourseTable({
  cursos,
  onView,
}: {
  cursos: Curso[]
  onView?: (id: string) => void
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200">
              <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Curso
              </th>
              <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Modalidad / Sede
              </th>
              <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Docente
              </th>
              <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Progreso
              </th>
              <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Aforo y Cupos
              </th>
              <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cursos.map((c) => {
              const pct = Math.round(((c.estudiantes || 0) / (c.capacidad || 1)) * 100)
              const modPct = Math.min(
                100,
                Math.round(((c.moduloActual || 0) / (c.totalModulos || 1)) * 100)
              )

              return (
                <tr
                  key={c.id}
                  className="group hover:bg-slate-50/80 transition-colors"
                >
                  {/* Nombre del curso */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1.5 h-10 rounded-full shrink-0"
                        style={{
                          backgroundColor: c.colorCatalogo || "#fd761a",
                        }}
                      />
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-[#fd761a] transition-colors block truncate max-w-xs sm:max-w-sm">
                          {c.nombre}
                        </span>
                        {c.tipo && (
                          <span className="text-[11px] font-semibold text-slate-400 capitalize">
                            Curso {c.tipo}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Modalidad y Ciudad (Sin aula) */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <ModalidadBadge modalidad={c.modalidad} />
                      {c.ciudad && <CiudadBadge ciudad={c.ciudad} />}
                    </div>
                  </td>

                  {/* Instructor */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {c.instructor && c.instructor !== "Sin asignar" && c.instructor !== "Por designar" ? (
                          c.instructor.slice(0, 2).toUpperCase()
                        ) : (
                          <HugeiconsIcon icon={UserIcon} size={13} className="text-slate-400" />
                        )}
                      </div>
                      <span className="text-sm font-semibold text-slate-800 truncate max-w-[150px]">
                        {c.instructor || "Sin asignar"}
                      </span>
                    </div>
                  </td>

                  {/* Progreso y Estado Integrados (Sin columna Estado separada) */}
                  <td className="py-4 px-4">
                    <div className="space-y-1.5 min-w-[140px] max-w-[170px]">
                      <div className="flex items-center justify-between text-xs gap-1.5">
                        <span className="font-bold text-slate-800">
                          Mód. {c.moduloActual} de {c.totalModulos}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            c.estado === "en_progreso"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/70"
                              : c.estado === "completado"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {c.estado === "en_progreso"
                            ? "En curso"
                            : c.estado === "completado"
                              ? "Finalizado"
                              : "Por iniciar"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            c.estado === "completado"
                              ? "bg-emerald-500"
                              : "bg-gradient-to-r from-amber-400 to-[#fd761a]"
                          }`}
                          style={{ width: `${modPct}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Estudiantes / Aforo */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1.5 w-32">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-slate-800">
                          {c.estudiantes} / {c.capacidad}
                        </span>
                        <span
                          className={`text-[11px] font-extrabold font-mono ${
                            pct >= 100
                              ? "text-rose-600"
                              : pct >= 80
                                ? "text-amber-600"
                                : "text-[#fd761a]"
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 100
                              ? "bg-rose-500"
                              : pct >= 80
                                ? "bg-gradient-to-r from-amber-400 to-orange-500"
                                : "bg-gradient-to-r from-orange-400 to-[#fd761a]"
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Acción Ver Detalle */}
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onView?.(c.id)
                      }}
                      type="button"
                      aria-label={`Ver detalle de ${c.nombre}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs group-hover:bg-[#fd761a] group-hover:text-white cursor-pointer active:scale-95"
                    >
                      <span>Ver curso</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </button>
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
