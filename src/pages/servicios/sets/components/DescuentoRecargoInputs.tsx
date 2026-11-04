import { useState } from "react"
import { Tag, PlusCircle } from "lucide-react"

interface Props {
  precioBase: number
  horas: number
  descuento: number
  motivoDescuento: string
  recargo: number
  motivoRecargo: string
  onDescuentoChange: (val: number, motivo: string) => void
  onRecargoChange: (val: number, motivo: string) => void
}

export function DescuentoRecargoInputs({
  precioBase,
  horas,
  descuento,
  motivoDescuento,
  recargo,
  motivoRecargo,
  onDescuentoChange,
  onRecargoChange,
}: Props) {
  const [showDescuento, setShowDescuento] = useState(descuento > 0)
  const [showRecargo, setShowRecargo] = useState(recargo > 0)

  const [descText, setDescText] = useState(descuento > 0 ? String(descuento) : "")
  const [recText, setRecText] = useState(recargo > 0 ? String(recargo) : "")

  const handleDescChange = (val: string) => {
    if (val === "" || /^\d*(\.\d{0,2})?$/.test(val)) {
      setDescText(val)
      onDescuentoChange(parseFloat(val) || 0, motivoDescuento)
    }
  }

  const handleRecChange = (val: string) => {
    if (val === "" || /^\d*(\.\d{0,2})?$/.test(val)) {
      setRecText(val)
      onRecargoChange(parseFloat(val) || 0, motivoRecargo)
    }
  }

  const subtotal = Math.round(precioBase * horas * 100) / 100
  const total = Math.max(0, Math.round((subtotal - descuento + recargo) * 100) / 100)

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      {/* Botones para activar Descuento o Recargo */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const next = !showDescuento
            setShowDescuento(next)
            if (!next) {
              setDescText("")
              onDescuentoChange(0, "")
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
            showDescuento
              ? "bg-amber-100 border-amber-300 text-amber-900"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Tag size={14} />
          <span>{showDescuento ? "Quitar Descuento" : "+ Añadir Descuento"}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            const next = !showRecargo
            setShowRecargo(next)
            if (!next) {
              setRecText("")
              onRecargoChange(0, "")
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
            showRecargo
              ? "bg-purple-100 border-purple-300 text-purple-900"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <PlusCircle size={14} />
          <span>{showRecargo ? "Quitar Recargo" : "+ Añadir Recargo / Extra"}</span>
        </button>
      </div>

      {/* Inputs Descuento */}
      {showDescuento && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-amber-50/70 border border-amber-200">
          <div>
            <label className="block text-[11px] font-bold text-amber-950 mb-1">Monto de Descuento ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={descText}
                onChange={(e) => handleDescChange(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-amber-300 bg-white pl-7 pr-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-amber-950 mb-1">Motivo del Descuento</label>
            <input
              type="text"
              maxLength={255}
              value={motivoDescuento}
              onChange={(e) => onDescuentoChange(parseFloat(descText) || 0, e.target.value)}
              placeholder="Ej: Convenio especial, pronto pago..."
              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>
      )}

      {/* Inputs Recargo */}
      {showRecargo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-purple-50/70 border border-purple-200">
          <div>
            <label className="block text-[11px] font-bold text-purple-950 mb-1">Monto de Recargo / Extra ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-600">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={recText}
                onChange={(e) => handleRecChange(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-purple-300 bg-white pl-7 pr-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-purple-950 mb-1">Motivo del Recargo</label>
            <input
              type="text"
              maxLength={255}
              value={motivoRecargo}
              onChange={(e) => onRecargoChange(parseFloat(recText) || 0, e.target.value)}
              placeholder="Ej: Horario nocturno, uso de luces adicionales..."
              className="w-full rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>
      )}

      {/* Resumen de Cálculo */}
      <div className="pt-2 border-t border-slate-200/80 space-y-1 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal base ({horas} hora{horas !== 1 ? "s" : ""} × ${precioBase.toFixed(2)}):</span>
          <span className="font-semibold">${subtotal.toFixed(2)}</span>
        </div>
        {descuento > 0 && (
          <div className="flex justify-between text-amber-700 font-medium">
            <span>Descuento aplicado:</span>
            <span>-${descuento.toFixed(2)}</span>
          </div>
        )}
        {recargo > 0 && (
          <div className="flex justify-between text-purple-700 font-medium">
            <span>Recargo adicional:</span>
            <span>+${recargo.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
          <span>Total a Pagar:</span>
          <span className="text-[#fd761a]">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
