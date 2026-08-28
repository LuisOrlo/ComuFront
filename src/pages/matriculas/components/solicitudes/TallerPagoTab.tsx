/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import { PaymentIcon, CalendarIcon, Upload05Icon, Image01Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Section, SubCategory, EF } from "../../AprobacionHelpers"
import { fixImageUrl } from "../../AprobacionUtils"
import { PagoPreAprobacionTallerSection, type PagoTallerPreAprobacionRef } from "../../PagoPreAprobacionTallerSection"

interface TallerPagoTabProps {
  selected: any
  yaProcesada: boolean
  editField: string | null
  editVal: string
  startEdit: (field: string, value: string) => void
  setEditVal: (value: string) => void
  saveEdit: () => void
  cancelEdit: () => void
  savingEdit: boolean
  comprobanteRef: React.RefObject<HTMLInputElement | null>
  handleUploadComprobante: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploadingComprobante: boolean
  expandedComprobante: boolean
  setExpandedComprobante: (val: boolean) => void
  setDeleteArchivoModal: (val: { type: "comprobante" | "cedula"; label: string } | null) => void
  deletingComprobante: boolean
  setExpandedImageUrl: (url: string | null) => void
  pagoRef: React.RefObject<PagoTallerPreAprobacionRef | null>
  precioBase: number
  getTallerNombre: () => string
}

export function TallerPagoTab({ selected, yaProcesada, editField, editVal,
  startEdit, setEditVal, saveEdit, cancelEdit, savingEdit,
  comprobanteRef, handleUploadComprobante, uploadingComprobante,
  expandedComprobante, setExpandedComprobante, setDeleteArchivoModal,
  deletingComprobante, setExpandedImageUrl, pagoRef,
  precioBase, getTallerNombre }: TallerPagoTabProps) {

  const monto = Number(selected.monto_pagado) || 0
  const tipoPago = selected.tipo_pago || (monto >= precioBase ? "completo" : "abono")
  const metodo = selected.metodo_pago || "efectivo"

  return (
    <Section title="Pago" icon={PaymentIcon}>
      <div className="space-y-5">
        <SubCategory title="Datos del Comprobante">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: COLORS.TEXT_MUTED }}>Tipo de pago</span>
            {tipoPago && monto > 0 ? (
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: "oklch(0.55 0.15 240 / 0.12)", color: "oklch(0.55 0.15 240)", boxShadow: "0 1px 2px oklch(0 0 0 / 0.06)" }}>
                {(tipoPago).toUpperCase()}
              </span>
            ) : (
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: "oklch(0.5 0 0 / 0.08)", color: "oklch(0.5 0 0)" }}>
                NO ESPECIFICADO
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: COLORS.TEXT_MUTED }}>Comprobante</span>
            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: "oklch(0.55 0.15 240 / 0.12)", color: "oklch(0.55 0.15 240)", boxShadow: "0 1px 2px oklch(0 0 0 / 0.06)" }}>
              {(metodo || "—").toUpperCase()}
            </span>
          </div>
          <EF icon={CalendarIcon} label="Fecha" field="fecha_pago" data={selected}
            editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal}
            onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit}
            inputType="date" validator={() => null} />
          <EF icon={PaymentIcon} label="Monto pagado" field="monto_pagado" data={selected}
            editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal}
            onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit}
            inputType="number" validator={() => null} />
        </SubCategory>

        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <input ref={comprobanteRef} type="file" accept="image/*" className="hidden" onChange={handleUploadComprobante} />
            <button onClick={() => comprobanteRef.current?.click()} disabled={uploadingComprobante}
              className="inline-flex items-center gap-1 text-xs font-medium hover:underline transition-colors"
              style={{ color: COLORS.ACCENT, opacity: uploadingComprobante ? 0.6 : 1 }}>
              <HugeiconsIcon icon={Upload05Icon} size={14} />
              {uploadingComprobante ? "Subiendo..." : selected.comprobante_url ? "Cambiar comprobante" : "Subir comprobante"}
            </button>
            {selected.comprobante_url && !selected.comprobante_purgado && (
              <>
                <button onClick={() => setExpandedComprobante(!expandedComprobante)}
                  className="inline-flex items-center gap-1 text-xs font-medium hover:underline transition-colors"
                  style={{ color: "oklch(0.55 0.15 240)" }}>
                  <HugeiconsIcon icon={Image01Icon} size={14} />
                  {expandedComprobante ? "Ocultar" : "Ver"}
                </button>
                <button onClick={() => setDeleteArchivoModal({ type: "comprobante", label: "comprobante de pago" })} disabled={deletingComprobante}
                  className="inline-flex items-center gap-1 text-xs font-medium hover:underline transition-colors disabled:opacity-50"
                  style={{ color: "oklch(0.5 0.15 10)" }}>
                  Eliminar
                </button>
              </>
            )}
          </div>
          {expandedComprobante && selected.comprobante_url && !selected.comprobante_purgado && (
            <div className="rounded-xl border overflow-hidden bg-gray-50 cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <img src={fixImageUrl(selected.comprobante_url)} alt="Comprobante"
                className="w-full object-contain max-h-[400px]"
                onClick={() => setExpandedImageUrl(fixImageUrl(selected.comprobante_url))} />
            </div>
          )}
          {selected.comprobante_purgado && (
            <div className="p-3 rounded-xl border text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                <HugeiconsIcon icon={Image01Icon} size={12} />
                Comprobante eliminado del almacenamiento
              </span>
            </div>
          )}
        </div>

        {!yaProcesada && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "oklch(0.65 0.15 75)" }}>
              Asignar pago al taller
            </p>
            <p className="text-xs mb-3" style={{ color: COLORS.TEXT_MUTED }}>
              Registra el monto a cobrar, el tipo y método de pago antes de aprobar la inscripción.
            </p>
            <PagoPreAprobacionTallerSection
              ref={pagoRef}
              inscripcionId={selected.id}
              precioBase={precioBase}
              montoInicial={monto}
              tipoPagoInicial={tipoPago}
              metodoInicial={metodo}
              onSaved={undefined}
            />
          </div>
        )}

        {yaProcesada && (
          <div className="p-4 rounded-xl border space-y-3 bg-white shadow-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Resumen de pago del Taller</span>
              <div className="flex items-center gap-3">
                <button onClick={() => startEdit("monto_pagado", String(monto))}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-gray-100 transition-all shadow-sm"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}>
                  <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                  <span>Editar Pago</span>
                </button>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border" style={{
                  backgroundColor: monto >= precioBase ? "oklch(0.55 0.15 150 / 0.08)" : "oklch(0.65 0.15 75 / 0.08)",
                  color: monto >= precioBase ? "oklch(0.40 0.16 150)" : "oklch(0.40 0.16 75)",
                  borderColor: monto >= precioBase ? "oklch(0.55 0.15 150 / 0.2)" : "oklch(0.65 0.15 75 / 0.2)"
                }}>
                  {monto >= precioBase ? "Taller pagado completo" : "Pago parcial"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[1.5fr_0.8fr_0.9fr_0.8fr_0.7fr] gap-3 text-[10px] font-bold uppercase tracking-wider pb-2 border-b" style={{ color: COLORS.TEXT_MUTED, borderColor: COLORS.BORDER_SUBTLE }}>
              <span>Concepto</span>
              <span className="text-right">Precio</span>
              <span className="text-right">Pagado</span>
              <span className="text-right">Saldo</span>
              <span className="text-right">Estado</span>
            </div>

            <div className="grid grid-cols-[1.5fr_0.8fr_0.9fr_0.8fr_0.7fr] gap-3 items-center text-sm py-1.5 font-mono">
              <span className="truncate font-medium font-sans" style={{ color: COLORS.CHARCOAL }}>{getTallerNombre()}</span>
              <span className="text-right" style={{ color: COLORS.CHARCOAL }}>${precioBase.toLocaleString("es-EC", { minimumFractionDigits: 2 })}</span>
              <div className="flex items-center gap-0.5 justify-end">
                <span className="text-right font-medium" style={{ color: monto > 0 ? "oklch(0.55 0.15 150)" : "oklch(0.5 0.15 20)" }}>
                  ${monto.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-right font-medium" style={{ color: precioBase - monto > 0 ? "oklch(0.5 0.15 20)" : "oklch(0.55 0.15 150)" }}>
                {precioBase - monto > 0 ? `$${(precioBase - monto).toLocaleString("es-EC", { minimumFractionDigits: 2 })}` : "—"}
              </span>
              <div className="flex justify-end font-sans">
                <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full transition-colors",
                  monto >= precioBase ? "bg-green-100 text-green-700" :
                  monto > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                )}>{monto >= precioBase ? "Pagado" : monto > 0 ? "Parcial" : "Pendiente"}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm" style={{ backgroundColor: "oklch(0.55 0.15 150 / 0.08)", borderColor: "oklch(0.55 0.15 150 / 0.25)" }}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: "oklch(0.40 0.16 150)" }}>
                  Total Ingresado
                </span>
                <span className="text-xs font-medium opacity-80 block mt-0.5" style={{ color: "oklch(0.35 0.14 150)" }}>
                  {monto >= precioBase ? "Cobro completo del taller" : `Cobro parcial · Saldo pendiente $${(precioBase - monto).toFixed(2)}`}
                </span>
              </div>
              <span className="text-xl font-black font-mono" style={{ color: "oklch(0.35 0.18 150)" }}>
                ${monto.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}
