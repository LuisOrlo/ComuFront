import { MapPinIcon, Clock01Icon, Calendar03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { User, Users } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { Curso } from "@/services/cursos.service"

const DIAS_CORTO = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

interface CursoCardExpandedProps {
  curso: Curso
  isSelected: boolean
  onSelect: () => void
}

export function CursoCardExpanded({ curso, isSelected, onSelect }: CursoCardExpandedProps) {
  const accent = curso.colorCatalogo || COLORS.ACCENT
  const ocupacion = curso.capacidad > 0
    ? Math.round((curso.estudiantes / curso.capacidad) * 100)
    : 0
  const diasSemana = curso.horario?.diasSemana?.map((d) => d.dia_semana) ?? []
  const estadoLabel = curso.estado === "en_progreso" ? "En progreso" : curso.estado === "completado" ? "Completado" : "Pendiente"

  return (
    <div
      className={cn(
        "w-full text-left rounded-2xl border bg-white overflow-hidden transition-all duration-200 ease-out flex flex-col p-6",
        isSelected ? "shadow-lg ring-2 ring-offset-1" : "hover:shadow-md hover:-translate-y-0.5"
      )}
      style={{
        borderColor: COLORS.BORDER_SUBTLE,
        borderLeftColor: isSelected ? accent : COLORS.BORDER_SUBTLE,
        borderLeftWidth: isSelected ? 3 : 1,
        ["--tw-ring-color" as string]: isSelected ? accent : "transparent",
      }}
    >
      <div className="p-0 flex-1 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                style={{
                  backgroundColor: `color-mix(in srgb, ${accent} 8%, transparent)`,
                  color: accent,
                  borderColor: `color-mix(in srgb, ${accent} 20%, transparent)`,
                }}
              >
                {curso.modalidad === "presencial" ? "Presencial" : "Virtual"}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: COLORS.TEXT_MUTED }}>{estadoLabel}</span>
            </div>
            <p className="text-lg font-bold line-clamp-2" style={{ color: COLORS.CHARCOAL }}>
              {curso.nombre}
            </p>
          </div>
          <span className="text-sm font-extrabold shrink-0" style={{ color: accent }}>
            ${curso.precioBase}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 py-1 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
          <div className="flex items-center gap-2 min-w-0">
            <HugeiconsIcon icon={MapPinIcon} size={17} />
            <div className="flex flex-col min-w-0"><span className="text-[10px]">Sede / ciudad</span><span className="font-semibold truncate" style={{ color: COLORS.CHARCOAL }}>{curso.ciudad || "Virtual"}</span></div>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <HugeiconsIcon icon={Clock01Icon} size={17} />
            <div className="flex flex-col min-w-0"><span className="text-[10px]">Horario</span><span className="font-semibold truncate" style={{ color: COLORS.CHARCOAL }}>{diasSemana.length > 0 ? diasSemana.map((d) => DIAS_CORTO[d] || d).filter(Boolean).join(" · ") : "Por definir"} {curso.horaInicio ? `· ${curso.horaInicio.slice(0, 5)} - ${curso.horaFin.slice(0, 5)}` : ""}</span></div>
          </div>
        </div>

        <div className="p-3 rounded-xl flex items-center gap-2 text-xs" style={{ backgroundColor: "#eff4ff" }}>
          <Users size={16} style={{ color: accent }} />
          <span className="font-semibold" style={{ color: COLORS.CHARCOAL }}>Matrícula: {curso.estudiantes} / {curso.capacidad} estudiantes</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <User size={13} />
            <span className="truncate">{curso.instructor || "Sin asignar"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={13} />
            <span>{ocupacion}% ocupado</span>
          </span>
          {curso.fechaInicio && (
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={Calendar03Icon} size={13} />
              <span>{curso.fechaInicio}</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs pt-1" style={{ color: COLORS.TEXT_MUTED }}>
          <span>{curso.totalModulos} módulos{curso.horasTotales ? ` · ${curso.horasTotales} hrs` : ""} · ${curso.precioBase}</span>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onSelect() }}
            className="px-2.5 py-1.5 rounded-lg font-semibold hover:brightness-90"
            style={{ backgroundColor: "#e5eeff", color: COLORS.CHARCOAL }}
          >
            Ver estudiantes
          </button>
        </div>
      </div>
    </div>
  )
}
