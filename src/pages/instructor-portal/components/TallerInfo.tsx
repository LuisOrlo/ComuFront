import { HugeiconsIcon } from "@hugeicons/react"
import { UserIcon, Calendar03Icon, ClockIcon, Money01Icon, UserGroupIcon, Note03Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { Taller } from "@/services/taller.service"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function formatFecha(f?: string): string {
  if (!f) return "—"
  try {
    const d = new Date(f.substring(0, 10) + "T12:00:00")
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
  } catch { return f }
}

function formatHora(h?: string): string {
  return h ? h.substring(0, 5) : "—"
}

function generarDiasDelRango(fechaInicio: string, fechaFin: string, horaInicio?: string, horaFin?: string) {
  const dias = []
  const start = new Date(fechaInicio + "T12:00:00")
  const end = new Date(fechaFin + "T12:00:00")
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dias.push({
      id: d.toISOString(),
      dia_semana: d.getDay() === 0 ? 7 : d.getDay(),
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    })
  }
  return dias
}

const DIAS_NOMBRE: Record<number, string> = {
  1: "Lun", 2: "Mar", 3: "Mie", 4: "Jue", 5: "Vie", 6: "Sab", 7: "Dom",
}

interface Props {
  taller: Taller
  inscritosActivos: number
}

export function TallerInfo({ taller, inscritosActivos }: Props) {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: BORDER }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${ACCENT} 10%, transparent)` }}>
              <HugeiconsIcon icon={UserIcon} size={16} style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: TEXT_MUTED }}>Instructor</p>
              <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                {taller.instructor ? `${taller.instructor.nombres} ${taller.instructor.apellidos}` : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${ACCENT} 10%, transparent)` }}>
              <HugeiconsIcon icon={Calendar03Icon} size={16} style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: TEXT_MUTED }}>Fecha</p>
              <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                {formatFecha(taller.fecha)}{taller.fecha_fin ? ` - ${formatFecha(taller.fecha_fin)}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${ACCENT} 10%, transparent)` }}>
              <HugeiconsIcon icon={ClockIcon} size={16} style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: TEXT_MUTED }}>Horario</p>
              <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                {formatHora(taller.hora_inicio)} - {formatHora(taller.hora_fin)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${ACCENT} 10%, transparent)` }}>
              <HugeiconsIcon icon={Note03Icon} size={16} style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: TEXT_MUTED }}>Modalidad</p>
              <p className="text-sm font-semibold capitalize" style={{ color: CHARCOAL }}>{taller.modalidad || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${ACCENT} 10%, transparent)` }}>
              <HugeiconsIcon icon={Money01Icon} size={16} style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: TEXT_MUTED }}>Precio</p>
              <p className="text-sm font-bold" style={{ color: CHARCOAL }}>${Number(taller.precio || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${ACCENT} 10%, transparent)` }}>
              <HugeiconsIcon icon={UserGroupIcon} size={16} style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: TEXT_MUTED }}>Capacidad</p>
              <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                {inscritosActivos}/{taller.capacidad_maxima || "0"}
              </p>
            </div>
          </div>
        </div>

        {taller.fecha_fin && (
          <div className="mt-5 pt-5 border-t" style={{ borderColor: BORDER }}>
            <p className="text-[11px] font-medium mb-3" style={{ color: TEXT_MUTED }}>Horarios por día</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(taller.horarios && taller.horarios.length > 0
                ? taller.horarios
                : generarDiasDelRango(taller.fecha!, taller.fecha_fin!, taller.hora_inicio, taller.hora_fin)
              ).map((h: { id: string; dia_semana: number; hora_inicio?: string; hora_fin?: string; aula?: string }) => (
                <div key={h.id} className="px-3 py-2 rounded-lg border text-xs" style={{ borderColor: BORDER }}>
                  <span className="font-semibold" style={{ color: ACCENT }}>{DIAS_NOMBRE[h.dia_semana] || h.dia_semana}</span>
                  <span className="ml-2" style={{ color: CHARCOAL }}>{formatHora(h.hora_inicio)} - {formatHora(h.hora_fin)}</span>
                  {h.aula && <span className="ml-2" style={{ color: TEXT_MUTED }}>({h.aula})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {taller.descripcion && (
          <div className="mt-5 pt-5 border-t" style={{ borderColor: BORDER }}>
            <p className="text-[11px] font-medium mb-1" style={{ color: TEXT_MUTED }}>Descripción</p>
            <p className="text-sm leading-relaxed" style={{ color: CHARCOAL }}>{taller.descripcion}</p>
          </div>
        )}
      </div>
    </div>
  )
}
