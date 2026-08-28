import { MapPinIcon, Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Users, User } from "lucide-react"
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
  const pct = curso.totalModulos > 0
    ? Math.round((curso.moduloActual / curso.totalModulos) * 100)
    : 0
  const ocupacion = curso.capacidad > 0
    ? Math.round((curso.estudiantes / curso.capacidad) * 100)
    : 0
  const docenteInicial = curso.instructor && curso.instructor !== "Sin asignar"
    ? curso.instructor.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")
    : "—"

  const diasSemana = curso.horario?.diasSemana?.map((d) => d.dia_semana) ?? []

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-2xl border bg-white overflow-hidden transition-all duration-200 ease-out flex flex-col",
        isSelected ? "shadow-lg ring-2 ring-offset-1" : "hover:shadow-md hover:-translate-y-0.5"
      )}
      style={{
        borderColor: COLORS.BORDER_SUBTLE,
        borderLeftColor: isSelected ? accent : COLORS.BORDER_SUBTLE,
        borderLeftWidth: isSelected ? 3 : 1,
        ["--tw-ring-color" as string]: isSelected ? accent : "transparent",
      }}
    >
      <div className="p-4 flex-1 flex flex-col gap-3">
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
              {curso.tipo && curso.tipo !== "regular" && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>
                  {curso.tipo}
                </span>
              )}
            </div>
            <p className="text-sm font-bold line-clamp-2" style={{ color: COLORS.CHARCOAL }}>
              {curso.nombre}
            </p>
          </div>
          <span className="text-sm font-extrabold shrink-0" style={{ color: accent }}>
            ${curso.precioBase}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] truncate" style={{ color: COLORS.TEXT_MUTED }}>
          <User size={11} />
          <span className="truncate">{curso.instructor || "Sin asignar"}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[10px] mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
          <div className="flex items-center gap-1 min-w-0">
            <HugeiconsIcon icon={MapPinIcon} size={11} />
            <span className="truncate">{curso.ciudad}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={11} />
            <span>{curso.estudiantes}/{curso.capacidad}</span>
          </div>
          {diasSemana.length > 0 ? (
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={Clock01Icon} size={11} />
              <span className="truncate">{diasSemana.map((d) => DIAS_CORTO[d] || d).filter(Boolean).join("·")}</span>
            </div>
          ) : curso.horario?.hora_inicio ? (
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={Clock01Icon} size={11} />
              <span>{curso.horario.hora_inicio.slice(0, 5)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={Clock01Icon} size={11} />
              <span className="truncate">{curso.horaInicio?.slice(0, 5)}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5 mt-auto">
          <div className="flex justify-between text-[10px]">
            <span style={{ color: COLORS.TEXT_MUTED }}>Módulos</span>
            <span className="font-bold" style={{ color: accent }}>
              {curso.moduloActual}/{curso.totalModulos}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(pct, 100)}%`,
                background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 85%, white))`,
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="px-4 py-2.5 border-t flex items-center gap-2.5"
        style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.97 0 0)" }}
      >
        <span
          className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
            color: accent,
          }}
        >
          {docenteInicial}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold truncate block" style={{ color: COLORS.CHARCOAL }}>
            {curso.instructor || "Sin asignar"}
          </span>
          <span className="text-[10px] font-semibold capitalize" style={{ color: COLORS.TEXT_MUTED }}>
            {ocupacion}% ocupado
          </span>
        </div>
        {curso.fechaInicio && (
          <span className="text-[10px] shrink-0" style={{ color: COLORS.TEXT_MUTED }}>
            {curso.fechaInicio.slice(0, 10)}
          </span>
        )}
      </div>
    </button>
  )
}
