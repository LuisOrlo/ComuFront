import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  ClockIcon,
  UserGroupIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons"
import { Building2, Sparkles } from "lucide-react"
import { ModalidadBadge, EstadoBadge, CiudadBadge } from "@/pages/estudiantes/components/Badges"
import type { Taller } from "@/services/taller.service"

function formatFecha(f?: string): string {
  if (!f) return "—"
  try {
    const d = new Date(f.includes("T") ? f : f + "T00:00:00")
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return f
  }
}

function formatHora(h?: string): string {
  return h ? h.substring(0, 5) : "—"
}

function getCiudadNombre(t?: Taller | null): string {
  if (!t) return ""
  if (typeof t.ciudad === "object" && t.ciudad !== null) {
    return t.ciudad.nombre || ""
  }
  if (typeof t.ciudad === "string") {
    return t.ciudad
  }
  return ""
}

interface Props {
  taller: Taller
  inscritosActivos: number
}

export function TallerInfo({ taller, inscritosActivos }: Props) {
  const capacidad = taller.capacidad_maxima || 0
  const cuposDisponibles = Math.max(0, capacidad - inscritosActivos)
  const pctOcupacion = capacidad > 0 ? Math.round((inscritosActivos / capacidad) * 100) : 0
  const esMultiDia = Boolean(taller.fecha_fin && taller.fecha_fin !== taller.fecha)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Información Académica (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Resumen General y Ubicación */}
          <section className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e5eeff] shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eeff]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0b1c30]">
                  Información de la Jornada
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Datos de modalidad, ubicación y parámetros de impartición
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ModalidadBadge modalidad={taller.modalidad} />
                <EstadoBadge estado={taller.estado} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="size-9 rounded-xl bg-orange-50 text-[#fd761a] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Calendar03Icon} size={16} />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    {esMultiDia ? "Período de Ejecución" : "Fecha del Taller"}
                  </span>
                  <p className="text-sm font-bold text-[#0b1c30] mt-0.5">
                    {formatFecha(taller.fecha)}
                    {esMultiDia ? ` hasta ${formatFecha(taller.fecha_fin || undefined)}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={ClockIcon} size={16} />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Horario Oficial
                  </span>
                  <p className="text-sm font-bold text-[#0b1c30] mt-0.5 font-mono">
                    {formatHora(taller.hora_inicio)} - {formatHora(taller.hora_fin)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Location01Icon} size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Ciudad / Sede
                  </span>
                  <div className="mt-1">
                    <CiudadBadge ciudad={getCiudadNombre(taller) || "Presencial"} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="size-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Building2 size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Modalidad / Entorno
                  </span>
                  <p className="text-xs font-bold text-[#0b1c30] mt-0.5 truncate">
                    {taller.modalidad === "virtual"
                      ? "Campus Virtual / Enlace en línea"
                      : "Sede Presencial Institucional"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Card 2: Descripción del Taller */}
          <section className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e5eeff] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#e5eeff]">
              <h3 className="text-sm font-bold text-[#0b1c30]">
                Descripción del Taller
              </h3>
            </div>

            {taller.descripcion ? (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {taller.descripcion}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No se ha registrado una descripción detallada para este taller.
              </p>
            )}
          </section>
        </div>

        {/* Columna Derecha: Capacidad de Participantes */}
        <div className="space-y-6">
          {/* Card: Capacidad y Ocupación */}
          <section className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e5eeff] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5eeff]">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-orange-50 text-[#fd761a] flex items-center justify-center">
                  <HugeiconsIcon icon={UserGroupIcon} size={16} />
                </div>
                <h3 className="text-sm font-bold text-[#0b1c30]">
                  Cupo de Alumnos
                </h3>
              </div>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                  cuposDisponibles === 0
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {cuposDisponibles === 0 ? "Cupo Lleno" : `${cuposDisponibles} disponibles`}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">Inscritos Activos:</span>
                <span className="text-2xl font-black text-[#0b1c30] font-mono">
                  {inscritosActivos}
                  <span className="text-sm text-slate-400 font-normal"> / {capacidad || "—"}</span>
                </span>
              </div>

              {/* Barra de progreso */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
                  <span>Porcentaje de cupo</span>
                  <span className="font-bold text-slate-800 font-mono">{pctOcupacion}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#e5eeff] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pctOcupacion >= 100 ? "bg-rose-500" : "bg-[#fd761a]"
                    }`}
                    style={{ width: `${Math.min(100, pctOcupacion)}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
                <Sparkles size={14} className="text-[#fd761a] shrink-0" />
                <span>
                  Los alumnos confirmados tienen su registro y asistencia disponible en las pestañas superiores.
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
