import { useState, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle04Icon,
  Cancel01Icon,
  UserIcon,
  BookOpenIcon,
  PaymentIcon,
  CalendarIcon,
  MailIcon,
  CallIcon,
  SearchIcon,
  Image01Icon,
  Upload05Icon,
  Calendar03Icon,
  Edit01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService } from "@/services/taller.service"
import { Section, InfoItem, EF } from "./AprobacionHelpers"
import { fixImageUrl } from "./AprobacionUtils"
import { toast } from "sonner"

export function TallerInscripcionCard({ ins, isExpanded, puedeVerificar, editTallerField, editTallerVal, savingTallerEdit, onToggle, onEdit, onChange, onSave, onCancel, onApprove, onReject, onExpandImage, onAfterMutate }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ins: any; isExpanded: boolean; puedeVerificar: boolean
  editTallerField: string | null; editTallerVal: string; savingTallerEdit: boolean
  onToggle: () => void; onEdit: (f: string, v: string) => void; onChange: (v: string) => void
  onSave: () => void; onCancel: () => void; onApprove: (monto: number, tipoPago: string, metodoPago: string, precioAjustado: number) => void; onReject: () => void
  onExpandImage?: (url: string) => void
  onAfterMutate?: () => void
}) {
  const cedulaRef = useRef<HTMLInputElement>(null)
  const comprobanteRef = useRef<HTMLInputElement>(null)
  const [uploadingCedula, setUploadingCedula] = useState(false)
  const [uploadingComprobante, setUploadingComprobante] = useState(false)
  const [expandedComprobante, setExpandedComprobante] = useState(false)

  const [, forceUpdate] = useState(0)
  const precioBase = Number(ins.taller?.precio || 0)
  // Si la inscripcion ya fue aprobada, monto_pagado contiene el precio ajustado
  const [precioAjustado, setPrecioAjustado] = useState(
    ins.pago_verificado && ins.monto_pagado > 0 ? Number(ins.monto_pagado) : precioBase
  )
  const [editingPrecio, setEditingPrecio] = useState(false)
  const [precioInput, setPrecioInput] = useState("")
  const [motivoAjuste, setMotivoAjuste] = useState("")
  const [savingPrecio, setSavingPrecio] = useState(false)

  const [tallerMonto, setTallerMonto] = useState(Number(ins.monto_pagado || precioBase || 0))
  const [editingMonto, setEditingMonto] = useState(false)
  const [montoInput, setMontoInput] = useState("")
  const [savingMonto, setSavingMonto] = useState(false)

  const precioEfectivo = precioAjustado || precioBase
  const tipoPagoActual = tallerMonto >= precioEfectivo ? "completo" : "abono"

  const handleStartEditPrecio = () => {
    setPrecioInput(String(precioEfectivo))
    setMotivoAjuste("")
    setEditingPrecio(true)
  }

  const handleConfirmAjuste = async () => {
    const nuevo = parseFloat(precioInput) || 0
    const final = nuevo > 0 ? nuevo : precioBase
    setSavingPrecio(true)
    try {
      await tallerService.actualizarInscripcion(ins.id, {
        metodo_pago: ins.metodo_pago || "efectivo",
      })
      setPrecioAjustado(final)
      toast.success("Precio ajustado correctamente")
      setEditingPrecio(false)
    } catch { toast.error("Error al ajustar precio") }
    finally { setSavingPrecio(false) }
  }

  const handleCancelEditPrecio = () => {
    setEditingPrecio(false)
  }

  const handleStartEditMonto = () => {
    setMontoInput(String(tallerMonto))
    setEditingMonto(true)
  }

  const handleSaveMonto = async () => {
    const nuevoMonto = parseFloat(montoInput) || 0
    const maxVal = precioEfectivo
    const montoFinal = nuevoMonto > maxVal ? maxVal : nuevoMonto
    const tipoFinal = montoFinal >= maxVal ? "completo" : "abono"
    setSavingMonto(true)
    try {
      await tallerService.actualizarInscripcion(ins.id, {
        monto_pagado: montoFinal,
        tipo_pago: tipoFinal,
        metodo_pago: ins.metodo_pago || "efectivo",
        fecha_pago: new Date().toISOString().split("T")[0],
      })
      setTallerMonto(montoFinal)
      toast.success("Monto actualizado")
      setEditingMonto(false)
    } catch { toast.error("Error al actualizar monto") }
    finally { setSavingMonto(false) }
  }

  const handleCancelEditMonto = () => {
    setEditingMonto(false)
  }

  const handleUploadCedula = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCedula(true)
    try {
      await tallerService.subirCedula(ins.id, file)
      toast.success("Cédula subida")
      forceUpdate(n => n + 1)
      onAfterMutate?.()
    } catch { toast.error("Error al subir cédula") }
    finally { setUploadingCedula(false) }
  }

  const handleUploadComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingComprobante(true)
    try {
      await tallerService.subirComprobante(ins.id, file)
      toast.success("Comprobante subido")
      forceUpdate(n => n + 1)
      onAfterMutate?.()
    } catch { toast.error("Error al subir comprobante") }
    finally { setUploadingComprobante(false) }
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : "—"

  return (
    <div className="bg-white rounded-2xl overflow-hidden transition-all border"
      style={{ borderTopColor: isExpanded ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, borderRightColor: isExpanded ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, borderBottomColor: isExpanded ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, borderLeft: `3px solid ${COLORS.ACCENT}` }}>
      <button onClick={onToggle} className="w-full text-left p-5 flex items-center gap-4">
        <div className="size-12 rounded-xl flex items-center justify-center shrink-0 text-base font-bold"
          style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`, color: COLORS.ACCENT }}>
          {(ins.nombres || "?")[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{ins.nombres} {ins.apellidos}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
            {ins.cedula} · {ins.correo} · {ins.taller?.nombre || "Taller"}
          </p>
        </div>
        <HugeiconsIcon icon={isExpanded ? Cancel01Icon : CheckmarkCircle04Icon} size={18}
          style={{ color: isExpanded ? COLORS.TEXT_MUTED : COLORS.ACCENT }} />
      </button>
      {isExpanded && (
        <div className="border-t px-5 py-5 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE, background: "oklch(0.985 0 0)" }}>
          <Section title="Datos del Participante" icon={UserIcon}>
            <div className="grid grid-cols-2 gap-3">
              <EF icon={UserIcon} label="Nombres" field="nombres" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
              <EF icon={UserIcon} label="Apellidos" field="apellidos" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
              <EF icon={SearchIcon} label="Cédula" field="cedula" data={ins} bold
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
              <EF icon={MailIcon} label="Correo" field="correo" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
              <EF icon={CallIcon} label="Teléfono" field="telefono" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
              <EF icon={UserIcon} label="Ocupación" field="ocupacion" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
               <EF icon={UserIcon} label="Dirección" field="direccion" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
               <EF icon={UserIcon} label="Ciudad" field="ciudad" data={ins}
                 editField={editTallerField} editVal={editTallerVal}
                 onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
              <EF icon={UserIcon} label="Estado Civil" field="estado_civil" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
              <InfoItem icon={Calendar03Icon} label="Fecha Nacimiento" value={formatDate(ins.fecha_nacimiento)} />
              <InfoItem icon={Calendar03Icon} label="Edad" value={ins.edad ? `${ins.edad} años` : "—"} />
            </div>
          </Section>
          <Section title="Taller" icon={BookOpenIcon}>
            <InfoItem icon={BookOpenIcon} label="Taller" value={ins.taller?.nombre || "—"} bold />
            <InfoItem icon={CalendarIcon} label="Fecha" value={ins.taller?.fecha ? new Date(ins.taller.fecha).toLocaleDateString('es-ES') : "—"} />
            <InfoItem icon={PaymentIcon} label="Precio" value={ins.taller?.precio ? `$${Number(ins.taller.precio).toFixed(2)}` : "—"} bold />
          </Section>
          <Section title="Pago" icon={PaymentIcon}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs group">
                <HugeiconsIcon icon={PaymentIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">Precio taller</span>
                <span className="font-bold" style={{ color: COLORS.CHARCOAL }}>${precioEfectivo.toFixed(2)}</span>
                {precioAjustado !== precioBase && (
                  <span className="text-[10px] line-through opacity-40">${precioBase.toFixed(2)}</span>
                )}
                <button type="button" onClick={handleStartEditPrecio}
                  className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                  <HugeiconsIcon icon={Edit01Icon} size={14} />
                </button>
              </div>
              {editingPrecio && (
                <div
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                  className="p-3 rounded-xl border space-y-2"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.97 0 0)" }}
                >
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                      Nuevo precio para este alumno
                    </label>
                    <div className="relative mt-1">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm"
                        style={{ pointerEvents: "none" }}
                      >$</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={precioInput}
                        onChange={e => setPrecioInput(e.target.value)}
                        onWheel={e => (e.target as HTMLElement).blur()}
                        onKeyDown={e => e.stopPropagation()}
                        disabled={savingPrecio}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2 border rounded-xl text-sm font-mono outline-none bg-white"
                        style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                      Motivo del ajuste
                    </label>
                    <input
                      type="text"
                      value={motivoAjuste}
                      onChange={e => setMotivoAjuste(e.target.value)}
                      disabled={savingPrecio}
                      placeholder="Ej: descuento por pronto pago"
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none mt-1 bg-white"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleConfirmAjuste} disabled={savingPrecio}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
                      style={{ backgroundColor: COLORS.ACCENT, opacity: savingPrecio ? 0.6 : 1 }}>
                      {savingPrecio ? "..." : "Confirmar ajuste"}
                    </button>
                    <button onClick={handleCancelEditPrecio} disabled={savingPrecio}
                      className="px-4 py-2 rounded-xl text-xs font-medium hover:text-gray-700 transition-colors"
                      style={{ color: COLORS.TEXT_MUTED }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              {editingMonto ? (
                <div
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                >
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: COLORS.TEXT_MUTED }}>
                    Monto a cobrar
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm"
                      style={{ pointerEvents: "none" }}
                    >$</span>
                    <input
                      type="number"
                      min={0}
                       max={precioEfectivo || undefined}
                      step="0.01"
                      value={montoInput}
                      onChange={e => setMontoInput(e.target.value)}
                      onWheel={e => (e.target as HTMLElement).blur()}
                      onKeyDown={e => e.stopPropagation()}
                      placeholder="0.00"
                      disabled={savingMonto}
                      className="w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm font-mono outline-none bg-white"
                      style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleSaveMonto} disabled={savingMonto}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                      style={{ backgroundColor: COLORS.ACCENT, opacity: savingMonto ? 0.6 : 1 }}>
                      {savingMonto ? "..." : "Guardar"}
                    </button>
                    <button onClick={handleCancelEditMonto} disabled={savingMonto}
                      className="text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 border"
                      style={{ color: COLORS.TEXT_MUTED, borderColor: COLORS.BORDER_SUBTLE }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs group">
                  <HugeiconsIcon icon={PaymentIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                  <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">Monto a cobrar</span>
                  <span className="font-bold" style={{ color: COLORS.CHARCOAL }}>${tallerMonto.toFixed(2)}</span>
                  <button type="button" onClick={handleStartEditMonto}
                    className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={Edit01Icon} size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: COLORS.TEXT_MUTED }}>Tipo de pago</span>
                <span
                  className="text-xs font-bold px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: tipoPagoActual === "completo" ? "oklch(0.55 0.15 150 / 0.12)" : "oklch(0.65 0.15 75 / 0.12)",
                    color: tipoPagoActual === "completo" ? "oklch(0.55 0.15 150)" : "oklch(0.65 0.15 75)",
                  }}
                >
                  {tipoPagoActual === "completo" ? "COMPLETO" : "ABONO"}
                </span>
              </div>
              <InfoItem icon={PaymentIcon} label="Método de pago" value={ins.metodo_pago || "—"} />
              <InfoItem icon={CalendarIcon} label="Fecha de Pago" value={formatDate(ins.fecha_pago)} />
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input ref={comprobanteRef} type="file" accept="image/*" className="hidden" onChange={handleUploadComprobante} />
                <button onClick={() => comprobanteRef.current?.click()} disabled={uploadingComprobante}
                  className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold hover:bg-white transition-colors"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT, opacity: uploadingComprobante ? 0.6 : 1 }}>
                  <HugeiconsIcon icon={Upload05Icon} size={16} />
                  {uploadingComprobante ? "Subiendo..." : ins.comprobante_url ? "Cambiar comprobante" : "Subir comprobante"}
                </button>
                {ins.comprobante_url && (
                  <button onClick={() => setExpandedComprobante(!expandedComprobante)}
                    className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold hover:bg-white transition-colors"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={Image01Icon} size={16} />
                    {expandedComprobante ? "Ocultar" : "Ver"}
                  </button>
                )}
              </div>
              {expandedComprobante && ins.comprobante_url && (
                <div className="rounded-xl border overflow-hidden bg-gray-50 cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <img src={fixImageUrl(ins.comprobante_url)} alt="Comprobante" className="w-full object-contain max-h-[400px]"
                    onClick={() => onExpandImage?.(fixImageUrl(ins.comprobante_url))} />
                </div>
              )}
            </div>
          </Section>
          <Section title="Documento de Identidad" icon={Image01Icon}>
            {ins.cedula_url ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium opacity-40">Imagen actual</span>
                  <button onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
                    className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={Edit01Icon} size={12} />Cambiar
                  </button>
                </div>
                <img src={fixImageUrl(ins.cedula_url)} alt="Cédula" className="w-full object-contain max-h-[400px] rounded-xl border cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  onClick={() => onExpandImage?.(fixImageUrl(ins.cedula_url))} />
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-dashed text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <p className="text-xs mb-3" style={{ color: COLORS.TEXT_MUTED }}>No se ha subido la foto de cédula</p>
                <input ref={cedulaRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCedula} />
                <button type="button" onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-[0.97]"
                  style={{ backgroundColor: COLORS.ACCENT, opacity: uploadingCedula ? 0.6 : 1 }}>
                  <HugeiconsIcon icon={Upload05Icon} size={14} className="inline mr-1.5" />
                  {uploadingCedula ? "Subiendo..." : "Subir foto de cédula"}
                </button>
              </div>
            )}
            <input ref={cedulaRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCedula} />
          </Section>
          {puedeVerificar && (
            <div className="flex gap-3 pt-3">
              <button onClick={onReject}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-red-50 active:scale-[0.97]"
                style={{ borderColor: "oklch(0.50 0.15 10 / 0.3)", color: "oklch(0.50 0.15 10)" }}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} className="inline mr-1.5" />Rechazar
              </button>
              <button onClick={() => onApprove(tallerMonto, tipoPagoActual, ins.metodo_pago || "efectivo", precioEfectivo)}
                className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
                style={{ backgroundColor: COLORS.ACCENT }}>
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />Aprobar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
