import { useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon, GraduationCapIcon, BookOpen01Icon, Calendar01Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { CursoAbierto } from "@/services/cursos.service"
import type { Taller, HorarioTaller } from "@/services/taller.service"

interface PagoFormProps {
  metodoPago: string
  comprobanteFile: File | null
  comprobantePreview: string | null
  paymentErrors: Record<string, string>
  paymentTouched: Record<string, boolean>
  esTaller: boolean
  tallerSel: Taller | undefined
  curso: CursoAbierto | undefined
  loadingSubmit: boolean
  canSubmit: boolean
  metodosPago: Array<{ key: string; label: string }>
  onMetodoPagoChange: (key: string) => void
  onComprobanteChange: (file: File | null) => void
  onQuitarComprobante: () => void
  onSubmit: () => void
  onBack: () => void
}

const FULL_DAY_NAMES: Record<number, string> = {
  1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves",
  5: "Viernes", 6: "Sábado", 7: "Domingo",
}

function formatDateRange(start: string | null, end: string | null): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
  const s = start ? new Date(start).toLocaleDateString("es-ES", opts) : null
  const e = end ? new Date(end).toLocaleDateString("es-ES", opts) : null
  if (!s) return "—"
  if (!e || s === e) return s
  return `${s} → ${e}`
}

function descHorarioTaller(horarios: HorarioTaller[] | undefined): string {
  if (!horarios || horarios.length === 0) return ""
  const groups = new Map<string, string[]>()
  for (const h of horarios) {
    const key = `${h.hora_inicio?.substring(0, 5)}-${h.hora_fin?.substring(0, 5)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(FULL_DAY_NAMES[h.dia_semana] || `Día ${h.dia_semana}`)
  }
  return Array.from(groups.entries())
    .map(([key, days]) => { const [hs, he] = key.split("-"); return `${days.join(", ")} | ${hs} - ${he}` })
    .join("  ·  ")
}

function descHorarioCurso(horario: CursoAbierto["horario"]): string {
  if (!horario) return ""
  const days: string[] = []
  if (horario.dia_semana && horario.dia_semana.length > 0)
    days.push(...horario.dia_semana.map(d => FULL_DAY_NAMES[d] || `Día ${d}`))
  else if (horario.dias_semana && horario.dias_semana.length > 0)
    days.push(...horario.dias_semana.map(d => FULL_DAY_NAMES[d.dia_semana] || `Día ${d.dia_semana}`))
  const t = [horario.hora_inicio?.substring(0, 5), horario.hora_fin?.substring(0, 5)].filter(Boolean).join(" - ")
  return [days.join(", "), t].filter(Boolean).join(" | ")
}

export function PagoForm({ metodoPago, comprobanteFile, comprobantePreview, paymentErrors, paymentTouched, esTaller, tallerSel, curso, loadingSubmit, canSubmit, metodosPago, onMetodoPagoChange, onComprobanteChange, onQuitarComprobante, onSubmit, onBack }: PagoFormProps) {
  const comprobanteInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="rounded-xl border p-6 space-y-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <h2 className="text-sm font-semibold flex items-center gap-2"><HugeiconsIcon icon={CreditCardIcon} size={16} style={{ color: COLORS.ACCENT }} />Método de Pago</h2>
      <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Selecciona tu método de pago y sube el comprobante con el pago completo o el adelanto para finalizar tu matrícula. </p>
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-medium mb-1.5">Método de pago</label>
          <div className="grid grid-cols-3 gap-2">
            {metodosPago.map(m => (
              <button key={m.key} onClick={() => onMetodoPagoChange(m.key)}
                className="px-3 py-2.5 rounded-lg text-xs font-medium border transition-all hover-orange"
                style={{ borderColor: metodoPago === m.key ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: metodoPago === m.key ? `color-mix(in srgb, ${COLORS.ACCENT} 8%, transparent)` : "white", color: metodoPago === m.key ? COLORS.ACCENT : "" }}>
                {m.label}
              </button>
            ))}
          </div>
          {paymentTouched.metodoPago && paymentErrors.metodoPago && <p className="text-[11px] mt-1 text-red-500">{paymentErrors.metodoPago}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Comprobante</label>
          <input ref={comprobanteInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) onComprobanteChange(file) }} />
          <div onClick={() => !comprobantePreview && comprobanteInputRef.current?.click()} className="relative rounded-lg border-2 border-dashed p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50" style={{ borderColor: paymentErrors.comprobante ? "#ef4444" : COLORS.BORDER_SUBTLE }}>
            {comprobantePreview ? <img src={comprobantePreview} className="max-h-64 rounded" alt="Comprobante" /> : <div className="text-xs text-gray-400">{comprobanteFile ? comprobanteFile.name : "Subir comprobante"}</div>}
          </div>
          {comprobantePreview && (
            <button type="button" onClick={onQuitarComprobante}
              className="text-[11px] mt-1 font-medium hover:underline" style={{ color: "#ef4444" }}>Quitar comprobante</button>
          )}
          {paymentTouched.comprobante && paymentErrors.comprobante && <p className="text-[11px] mt-1 text-red-500">{paymentErrors.comprobante}</p>}
        </div>
      </div>
      <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: COLORS.TEXT_MUTED }}>
          <HugeiconsIcon icon={esTaller ? BookOpen01Icon : GraduationCapIcon} size={14} style={{ color: COLORS.ACCENT }} />
          Detalle del {esTaller ? "Taller" : "Curso"}
        </h3>

        <div className="flex items-start gap-2.5">
          <div className="size-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: esTaller ? "oklch(0.92 0.05 80)" : "oklch(0.92 0.08 220)" }}>
            <HugeiconsIcon icon={esTaller ? BookOpen01Icon : GraduationCapIcon} size={16}
              style={{ color: esTaller ? "oklch(0.55 0.12 70)" : "oklch(0.45 0.12 220)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-snug" style={{ color: COLORS.CHARCOAL }}>
              {esTaller ? tallerSel?.nombre : (curso?.nombre_instancia || curso?.catalogo?.nombre)}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: esTaller ? "oklch(0.92 0.05 80)" : "oklch(0.92 0.08 220)", color: esTaller ? "oklch(0.55 0.12 70)" : "oklch(0.45 0.12 220)" }}>
                {esTaller ? "Taller" : "Curso"}
              </span>
              <span className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>
                {(esTaller ? (tallerSel?.modalidad || "") : (curso?.modalidad || "")).toUpperCase()}
                {esTaller
                  ? (tallerSel?.ciudad ? ` · ${tallerSel.ciudad.nombre}` : "")
                  : (curso?.modalidad === "presencial" && curso?.ciudad ? ` · ${curso.ciudad.nombre}` : "")
                }
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 text-xs pt-1">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: "oklch(0.92 0.05 80)" }}>
              <HugeiconsIcon icon={Calendar01Icon} size={13} style={{ color: COLORS.ACCENT }} />
            </div>
            <div>
              <p className="text-[10px] font-medium" style={{ color: COLORS.TEXT_MUTED }}>Fecha</p>
              <p className="text-xs font-semibold" style={{ color: COLORS.CHARCOAL }}>
                {esTaller
                  ? formatDateRange(tallerSel?.fecha ?? null, tallerSel?.fecha_fin ?? null)
                  : formatDateRange(curso?.fecha_inicio ?? null, curso?.fecha_fin ?? null)
                }
              </p>
            </div>
          </div>

          {(() => {
            const horarioStr = esTaller
              ? descHorarioTaller(tallerSel?.horarios)
              : descHorarioCurso(curso?.horario)
            if (!horarioStr) return null
            return (
              <div className="flex items-start gap-2">
                <div className="size-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "oklch(0.92 0.08 220)" }}>
                  <HugeiconsIcon icon={Clock01Icon} size={13} style={{ color: "oklch(0.45 0.12 220)" }} />
                </div>
                <div>
                  <p className="text-[10px] font-medium" style={{ color: COLORS.TEXT_MUTED }}>Horario</p>
                  <p className="text-xs font-semibold whitespace-pre-line" style={{ color: COLORS.CHARCOAL }}>{horarioStr}</p>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
      <div className="flex justify-between pt-4"><button onClick={onBack} className="px-5 py-2.5 rounded-lg text-xs font-semibold border">Anterior</button><button onClick={onSubmit} disabled={!canSubmit || loadingSubmit} className="px-8 py-2.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: COLORS.ACCENT }}>{loadingSubmit ? "Enviando..." : "Confirmar Matrícula"}</button></div>
    </div>
  )
}
