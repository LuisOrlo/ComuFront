import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { CiudadBadge } from "./CiudadBadge"
import { ModalidadBadge } from "@/pages/estudiantes/components/Badges"
import type { Curso } from "@/services/cursos.service"

export function CourseCard({
  curso,
  onView,
}: {
  curso: Curso
  onView?: (id: string) => void
}) {
  const pct = Math.round(((curso.estudiantes || 0) / (curso.capacidad || 1)) * 100)
  const modPct = Math.min(
    100,
    Math.round(((curso.moduloActual || 0) / (curso.totalModulos || 1)) * 100)
  )

  return (
    <article
      className="group rounded-2xl border border-slate-200/80 bg-white overflow-hidden select-none transition-all duration-200 hover:shadow-lg hover:border-slate-300 flex flex-col justify-between"
    >
      <div>
        {/* Banner con gradiente e indicativo de estado */}
        <div
          className="relative h-28 overflow-hidden p-3 flex flex-col justify-between"
          style={{
            background: curso.colorCatalogo
              ? `linear-gradient(135deg, ${curso.colorCatalogo}dd, ${curso.colorCatalogo})`
              : "linear-gradient(135deg, #f97316, #ea580c)",
          }}
        >
          {/* Fondo decorativo sutil */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

          {/* Fila superior: Estado */}
          <div className="relative z-10 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase shadow-2xs backdrop-blur-md ${
                curso.estado === "en_progreso"
                  ? "bg-white/90 text-amber-800"
                  : curso.estado === "completado"
                    ? "bg-white/90 text-emerald-800"
                    : "bg-white/90 text-slate-700"
              }`}
            >
              {curso.estado === "en_progreso" && (
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
              {curso.estado === "en_progreso"
                ? "En curso"
                : curso.estado === "completado"
                  ? "Finalizado"
                  : "Por iniciar"}
            </span>

            {curso.tipo && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/20 text-white backdrop-blur-xs">
                {curso.tipo}
              </span>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-3">
          {/* Modalidad y Ciudad (Sin aula) */}
          <div className="flex items-center flex-wrap gap-1.5">
            <ModalidadBadge modalidad={curso.modalidad} />
            {curso.ciudad && <CiudadBadge ciudad={curso.ciudad} />}
          </div>

          {/* Título */}
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-[#fd761a] transition-colors line-clamp-2 leading-snug">
              {curso.nombre}
            </h3>
          </div>

          {/* Docente */}
          <div className="flex items-center gap-2 pt-0.5">
            <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold shrink-0">
              {curso.instructor && curso.instructor !== "Sin asignar" && curso.instructor !== "Por designar" ? (
                curso.instructor.slice(0, 2).toUpperCase()
              ) : (
                <HugeiconsIcon icon={UserIcon} size={12} className="text-slate-400" />
              )}
            </div>
            <span className="text-xs font-semibold text-slate-600 truncate">
              {curso.instructor || "Sin asignar"}
            </span>
          </div>

          {/* Progreso del curso */}
          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Progreso del curso</span>
              <span className="text-slate-500 font-medium text-[11px]">
                Mód. {curso.moduloActual || 0} de {curso.totalModulos || 0}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  curso.estado === "completado"
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-amber-400 to-[#fd761a]"
                }`}
                style={{ width: `${modPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer del card: Ocupación y Botón */}
      <div className="p-4 pt-0 space-y-3">
        {/* Aforo / Cupos */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-500 text-[11px]">Aforo ({pct}%)</span>
            <span className="font-mono text-slate-800">
              {curso.estudiantes}/{curso.capacidad}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct >= 100
                  ? "bg-rose-500"
                  : pct >= 80
                    ? "bg-amber-500"
                    : "bg-[#fd761a]"
              }`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>

        {/* Botón Ver Curso */}
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={() => onView?.(curso.id)}
            aria-label={`Ver detalle de ${curso.nombre}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#fd761a] hover:underline cursor-pointer"
          >
            <span>Ver curso</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </button>
        </div>
      </div>
    </article>
  )
}
