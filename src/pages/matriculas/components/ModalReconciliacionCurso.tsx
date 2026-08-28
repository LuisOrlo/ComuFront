import { useState, useEffect, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeftRightIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  UserWarning01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface ModuloReconciliacion {
  id: string | null
  nombre: string
  tipo: string
  monto_ajustado: number
}

interface ModalReconciliacionCursoProps {
  isOpen: boolean
  oldCursoNombre: string
  newCursoNombre: string
  modulosNuevoCurso: ModuloReconciliacion[]
  totalAbonadoActual: number
  oldMontosAbonados?: number[]
  onConfirm: (lineas: { modulo_id: string | null; tipo: string; monto_abonado: number; monto_ajustado: number }[]) => void
  onCancel: () => void
  loading?: boolean
}

export function ModalReconciliacionCurso({
  isOpen, oldCursoNombre, newCursoNombre, modulosNuevoCurso,
  totalAbonadoActual, oldMontosAbonados, onConfirm, onCancel, loading,
}: ModalReconciliacionCursoProps) {
  const [valores, setValores] = useState<Record<number, string>>({})

  const sugerencia = useMemo(() => {
    const result: Record<number, string> = {}
    const old = oldMontosAbonados || []

    // Paso 1: conservar montos viejos en el mismo orden
    modulosNuevoCurso.forEach((m, i) => {
      const viejo = old[i] || 0
      result[i] = String(Math.min(viejo, m.monto_ajustado))
    })

    // Paso 2: distribuir excedente a módulos con espacio disponible
    const asignado = Object.values(result).reduce((s, v) => s + parseFloat(v), 0)
    let restante = totalAbonadoActual - asignado

    for (let i = 0; i < modulosNuevoCurso.length && restante > 0; i++) {
      const actual = parseFloat(result[i]) || 0
      const cap = modulosNuevoCurso[i].monto_ajustado
      const espacio = cap - actual
      if (espacio > 0) {
        const agregar = Math.min(restante, espacio)
        result[i] = String(actual + agregar)
        restante -= agregar
      }
    }

    return result
  }, [modulosNuevoCurso, totalAbonadoActual, oldMontosAbonados])

  useEffect(() => {
    if (isOpen) setValores(sugerencia)
  }, [isOpen, sugerencia])

  const totalAsignado = useMemo(() =>
    Object.values(valores).reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [valores])

  const precioTotalNuevo = useMemo(() =>
    modulosNuevoCurso.reduce((s, m) => s + m.monto_ajustado, 0),
    [modulosNuevoCurso])

  const handleMontoChange = (idx: number, val: string) => {
    const limpio = val.replace(/[^0-9.]/g, "")
    if ((limpio.match(/\./g) || []).length <= 1) {
      setValores(prev => ({ ...prev, [idx]: limpio }))
    }
  }

  const tieneExceso = useMemo(() =>
    modulosNuevoCurso.some((m, i) => (parseFloat(valores[i]) || 0) > m.monto_ajustado),
    [modulosNuevoCurso, valores])

  const handleConfirm = () => {
    onConfirm(modulosNuevoCurso.map((m, i) => ({
      modulo_id: m.id,
      tipo: m.tipo,
      monto_abonado: parseFloat(valores[i]) || 0,
      monto_ajustado: m.monto_ajustado,
    })))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto border z-10" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.65 0.15 75 / 0.12)" }}>
              <HugeiconsIcon icon={ArrowLeftRightIcon} size={20} style={{ color: "oklch(0.65 0.15 75)" }} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider opacity-50" style={{ color: COLORS.CHARCOAL }}>
                Cambio de curso
              </p>
              <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                {oldCursoNombre} → {newCursoNombre}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl border" style={{ borderColor: "oklch(0.65 0.15 75 / 0.3)", backgroundColor: "oklch(0.65 0.15 75 / 0.06)" }}>
            <HugeiconsIcon icon={UserWarning01Icon} size={16} className="shrink-0 mt-0.5" style={{ color: "oklch(0.65 0.15 75)" }} />
            <p className="text-xs font-medium" style={{ color: "oklch(0.5 0.1 75)" }}>
              Puede conservar el valor registrado de cada módulo (<strong>${totalAbonadoActual.toLocaleString()} abonado</strong>) o ajustarlo manualmente antes de confirmar.
            </p>
          </div>

          <div>
            <div className="grid grid-cols-[1.8fr_1fr_0.7fr] gap-3 text-[10px] font-bold uppercase tracking-wider pb-2 border-b" style={{ color: COLORS.TEXT_MUTED, borderColor: COLORS.BORDER_SUBTLE }}>
              <span>Módulo</span>
              <span className="text-right">Monto a asignar</span>
              <span className="text-right">Precio</span>
            </div>
            <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              {modulosNuevoCurso.map((m, i) => {
                const excedeModulo = (parseFloat(valores[i]) || 0) > m.monto_ajustado
                return (
                <div key={i} className="grid grid-cols-[1.8fr_1fr_0.7fr] gap-3 items-center text-sm py-2">
                  <span className="truncate font-medium" style={{ color: COLORS.CHARCOAL }}>{m.nombre}</span>
                  <div className="justify-self-end">
                    <div className="relative w-[110px]">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-mono pointer-events-none" style={{ color: COLORS.TEXT_MUTED }}>$</span>
                      <input
                        type="text" inputMode="decimal"
                        value={valores[i] ?? ""}
                        onChange={e => handleMontoChange(i, e.target.value)}
                        onWheel={e => (e.target as HTMLElement).blur()}
                        className={cn("w-full pl-7 pr-2 py-1 text-right text-sm font-mono outline-none bg-white rounded-md border",
                          excedeModulo ? "border-red-300" : "")}
                        style={{ borderColor: excedeModulo ? undefined : COLORS.BORDER_SUBTLE }}
                      />
                    </div>
                    {excedeModulo && (
                      <p className="text-[9px] font-bold text-red-500 mt-0.5 text-right">
                        Supera el precio del módulo
                      </p>
                    )}
                  </div>
                  <span className="text-right text-xs font-medium opacity-60" style={{ color: COLORS.CHARCOAL }}>
                    ${m.monto_ajustado.toLocaleString()}
                  </span>
                </div>
              )})}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border bg-gray-50"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <span className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>
              ${totalAsignado.toLocaleString()} pagados de ${precioTotalNuevo.toLocaleString()} total
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onCancel} disabled={loading}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors hover:bg-gray-100 disabled:opacity-50"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
              Cancelar
            </button>
            <button onClick={handleConfirm} disabled={loading || tieneExceso}
              className="flex-[2] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: COLORS.ACCENT }}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
              {loading ? "Procesando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
