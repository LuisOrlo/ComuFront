/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle04Icon,
  Cancel01Icon,
  ArrowLeft01Icon,
  UserIcon,
  BookOpenIcon,
  PaymentIcon,
  CalendarIcon,
  MailIcon,
  CallIcon,
  SearchIcon,
  Image01Icon,
  Edit01Icon,
  Upload05Icon,
  Calendar03Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService } from "@/services/taller.service"
import { Section, SubCategory, InfoItem, EF } from "./AprobacionHelpers"
import { fixImageUrl, validarImagen } from "./AprobacionUtils"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { RejectModal } from "@/components/RejectModal"
import { ImageZoom } from "./ImageZoom"
import { toast } from "sonner"

type TabId = "participante" | "taller" | "pago" | "documento"

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "participante", label: "Participante", icon: UserIcon },
  { id: "taller", label: "Taller", icon: BookOpenIcon },
  { id: "pago", label: "Pago", icon: PaymentIcon },
  { id: "documento", label: "Cedula", icon: Image01Icon },
]

export function AprobacionTallerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ins, setIns] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("participante")

  const [editField, setEditField] = useState<string | null>(null)
  const [editVal, setEditVal] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  const [expandedComprobante, setExpandedComprobante] = useState(false)
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null)
  const [uploadingCedula, setUploadingCedula] = useState(false)
  const [uploadingComprobante, setUploadingComprobante] = useState(false)
  const cedulaRef = useRef<HTMLInputElement>(null)
  const comprobanteRef = useRef<HTMLInputElement>(null)

  const [actionLoading, setActionLoading] = useState(false)

  const [confirmReject, setConfirmReject] = useState(false)
  const [confirmApprove, setConfirmApprove] = useState(false)

  const [, forceUpdate] = useState(0)
  const precioBase = Number(ins?.taller?.precio || 0)
  const [precioAjustado, setPrecioAjustado] = useState(
    ins?.pago_verificado && ins?.monto_pagado > 0 ? Number(ins?.monto_pagado) : precioBase
  )
  const [editingPrecio, setEditingPrecio] = useState(false)
  const [precioInput, setPrecioInput] = useState("")
  const [motivoAjuste, setMotivoAjuste] = useState("")
  const [savingPrecio, setSavingPrecio] = useState(false)

  const [tallerMonto, setTallerMonto] = useState(Number(ins?.monto_pagado || precioBase || 0))
  const [editingMonto, setEditingMonto] = useState(false)
  const [montoInput, setMontoInput] = useState("")
  const [savingMonto, setSavingMonto] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchInscripcion = async () => {
      setLoading(true)
      try {
        const res = await tallerService.getInscripcionById(id)
        const data = (res as any).data || res
        setIns(data)
        setPrecioAjustado(data.pago_verificado && data.monto_pagado > 0 ? Number(data.monto_pagado) : Number(data.taller?.precio || 0))
        setTallerMonto(Number(data.monto_pagado || data.taller?.precio || 0))
      } catch {
        toast.error("Error al cargar inscripción")
      } finally {
        setLoading(false)
      }
    }
    fetchInscripcion()
  }, [id])

  const precioEfectivo = precioAjustado || precioBase
  const tipoPagoActual = tallerMonto >= precioEfectivo ? "completo" : "abono"

  const handleStartEditPrecio = () => {
    setPrecioInput(String(precioEfectivo))
    setMotivoAjuste("")
    setEditingPrecio(true)
  }

  const handleConfirmAjuste = async () => {
    if (!id) return
    const nuevo = parseFloat(precioInput) || 0
    const final = nuevo > 0 ? nuevo : precioBase
    setSavingPrecio(true)
    try {
      await tallerService.actualizarInscripcion(id, {
        metodo_pago: ins?.metodo_pago || "efectivo",
        precio_ajustado: final,
        motivo_ajuste: motivoAjuste,
      })
      setPrecioAjustado(final)
      toast.success("Precio ajustado correctamente")
      setEditingPrecio(false)
    } catch { toast.error("Error al ajustar precio") }
    finally { setSavingPrecio(false) }
  }

  const handleCancelEditPrecio = () => setEditingPrecio(false)

  const handleStartEditMonto = () => {
    setMontoInput(String(tallerMonto))
    setEditingMonto(true)
  }

  const handleSaveMonto = async () => {
    if (!id) return
    const nuevoMonto = parseFloat(montoInput) || 0
    const maxVal = precioEfectivo
    const montoFinal = nuevoMonto > maxVal ? maxVal : nuevoMonto
    const tipoFinal = montoFinal >= maxVal ? "completo" : "abono"
    setSavingMonto(true)
    try {
      await tallerService.actualizarInscripcion(id, {
        monto_pagado: montoFinal,
        tipo_pago: tipoFinal,
        metodo_pago: ins?.metodo_pago || "efectivo",
        fecha_pago: new Date().toISOString().split("T")[0],
      })
      setTallerMonto(montoFinal)
      toast.success("Monto actualizado")
      setEditingMonto(false)
    } catch { toast.error("Error al actualizar monto") }
    finally { setSavingMonto(false) }
  }

  const handleCancelEditMonto = () => setEditingMonto(false)

  const startEdit = (field: string, value: string) => { setEditField(field); setEditVal(value) }
  const cancelEdit = () => { setEditField(null); setEditVal("") }

  const saveEdit = async () => {
    if (!id || !editField || editVal === "") return
    setSavingEdit(true)
    try {
      const data: any = { [editField]: editVal }
      await tallerService.actualizarInscripcion(id, data)
      setIns((prev: any) => ({ ...prev, [editField]: editVal }))
      toast.success("Dato actualizado correctamente")
      setEditField(null); setEditVal("")
    } catch { toast.error("Error al actualizar") }
    finally { setSavingEdit(false) }
  }

  const handleUploadCedula = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    const error = validarImagen(file, 2)
    if (error) { toast.error(error); return }
    setUploadingCedula(true)
    try {
      await tallerService.subirCedula(id, file)
      toast.success("Cédula subida")
      forceUpdate(n => n + 1)
    } catch { toast.error("Error al subir cédula") }
    finally { setUploadingCedula(false) }
  }

  const handleUploadComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    const error = validarImagen(file, 5)
    if (error) { toast.error(error); return }
    setUploadingComprobante(true)
    try {
      await tallerService.subirComprobante(id, file)
      toast.success("Comprobante subido")
      forceUpdate(n => n + 1)
    } catch { toast.error("Error al subir comprobante") }
    finally { setUploadingComprobante(false) }
  }

  const handleApprove = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await tallerService.verificarPago(id, {
        precio_ajustado: precioAjustado,
        monto_pagado: tallerMonto,
        tipo_pago: tipoPagoActual,
        metodo_pago: ins?.metodo_pago || "efectivo",
        fecha_pago: new Date().toISOString().split("T")[0],
        motivo_ajuste: motivoAjuste,
      })
      toast.success("Inscripción aprobada")
      navigate("/matriculas")
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al aprobar")
    } finally { setActionLoading(false); setConfirmApprove(false) }
  }

  const handleReject = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await tallerService.cambiarEstadoInscripcion(id, "retirado")
      toast.success("Inscripción rechazada")
      navigate("/matriculas")
    } catch {
      toast.error("Error al rechazar")
    } finally { setActionLoading(false) }
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : "—"

  const AZUL = "oklch(0.55 0.15 240)"
  const VERDE = "oklch(0.55 0.15 160)"
  const PURPURA = "oklch(0.55 0.12 300)"
  const AMBAR = "oklch(0.65 0.15 75)"

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
        <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="max-w-[900px] mx-auto px-6 py-6">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/matriculas")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} style={{ color: COLORS.CHARCOAL }} />
              </button>
              <h1 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>Detalle de Inscripción</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!ins) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
        <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="max-w-[900px] mx-auto px-6 py-6">
            <button onClick={() => navigate("/matriculas")} className="flex items-center gap-2 text-sm font-medium" style={{ color: COLORS.ACCENT }}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />Volver
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>No se encontró la inscripción</p>
        </div>
      </div>
    )
  }

  const yaProcesadaTaller = ins.pago_verificado || ins.estado !== "activo"

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[900px] mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/matriculas")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} style={{ color: COLORS.CHARCOAL }} />
            </button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>
                {ins.nombres} {ins.apellidos}
              </h1>
              <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                {ins.taller?.nombre || "Taller"} · {ins.cedula}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[900px] mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all"
                style={{
                  borderColor: activeTab === tab.id ? COLORS.ACCENT : "transparent",
                  color: activeTab === tab.id ? COLORS.ACCENT : COLORS.TEXT_MUTED,
                }}>
                <HugeiconsIcon icon={tab.icon} size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[900px] mx-auto w-full px-6 py-6">
        <div className="bg-white rounded-2xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="p-6">
            {activeTab === "participante" && (
              <Section title="Datos del Participante" icon={UserIcon}>
                <div className="space-y-3">
                  <SubCategory title="Información Personal" color={AZUL}>
                    <EF icon={UserIcon} label="Nombres" field="nombres" data={ins}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
                    <EF icon={UserIcon} label="Apellidos" field="apellidos" data={ins}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
                    <EF icon={SearchIcon} label="Cédula" field="cedula" data={ins} bold
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
                    <EF icon={Calendar03Icon} label="Fecha Nacimiento" field="fecha_nacimiento" data={ins}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} inputType="date" groupColor={AZUL} />
                    <InfoItem icon={Calendar03Icon} label="Edad" value={ins.edad ? `${ins.edad} años` : "—"} groupColor={AZUL} />
                    <EF icon={UserIcon} label="Ocupación" field="ocupacion" data={ins}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
                    <EF icon={UserIcon} label="Estado Civil" field="estado_civil" data={ins}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
                  </SubCategory>
                  <SubCategory title="Contacto" color={VERDE}>
                    <EF icon={MailIcon} label="Correo" field="correo" data={ins}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={VERDE} />
                    <EF icon={CallIcon} label="Teléfono" field="telefono" data={ins}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={VERDE} />
                  </SubCategory>
                  <SubCategory title="Ubicación" color={PURPURA}>
                    <EF icon={Location01Icon} label="Dirección" field="direccion" data={ins}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={PURPURA} />
                    <EF icon={Location01Icon} label="Ciudad" field="ciudad" data={ins}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={PURPURA} />
                  </SubCategory>
                </div>
              </Section>
            )}

            {activeTab === "taller" && (
              <Section title="Taller" icon={BookOpenIcon}>
                <div className="p-4 rounded-xl space-y-2" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 6%, transparent)`, borderLeft: `3px solid ${COLORS.ACCENT}` }}>
                  <InfoItem icon={BookOpenIcon} label="Taller" value={ins.taller?.nombre || "—"} bold groupColor={COLORS.ACCENT} />
                  <InfoItem icon={CalendarIcon} label="Fecha" value={ins.taller?.fecha ? new Date(ins.taller.fecha).toLocaleDateString('es-ES') : "—"} groupColor={COLORS.ACCENT} />
                  <InfoItem icon={PaymentIcon} label="Precio base" value={ins.taller?.precio ? `$${Number(ins.taller.precio).toFixed(2)}` : "—"} bold groupColor={COLORS.ACCENT} />
                </div>
              </Section>
            )}

            {activeTab === "pago" && (
              <Section title="Pago" icon={PaymentIcon}>
                <div className="space-y-4">
                  <SubCategory title="Detalles del Precio" color={AMBAR}>
                    <div className="flex items-center gap-2 text-sm group">
                      <HugeiconsIcon icon={PaymentIcon} size={14} className="shrink-0" style={{ color: AMBAR }} />
                      <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0 text-sm">Precio taller</span>
                      <span className="font-bold text-sm" style={{ color: COLORS.CHARCOAL }}>${precioEfectivo.toFixed(2)}</span>
                      {precioAjustado !== precioBase && (
                        <span className="text-xs line-through opacity-40">${precioBase.toFixed(2)}</span>
                      )}
                      <button type="button" onClick={handleStartEditPrecio}
                        className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                        <HugeiconsIcon icon={Edit01Icon} size={14} />
                      </button>
                    </div>
                    {editingPrecio && (
                      <div className="p-3 rounded-xl border space-y-2" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.97 0 0)" }}>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                            Nuevo precio para este alumno
                          </label>
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm" style={{ pointerEvents: "none" }}>$</span>
                            <input type="number" min={0} step="0.01" value={precioInput} onChange={e => setPrecioInput(e.target.value)}
                              onWheel={e => (e.target as HTMLElement).blur()} onKeyDown={e => e.stopPropagation()}
                              disabled={savingPrecio} placeholder="0.00"
                              className="w-full pl-8 pr-4 py-2 border rounded-xl text-sm font-mono outline-none bg-white"
                              style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Motivo del ajuste</label>
                          <input type="text" value={motivoAjuste} onChange={e => setMotivoAjuste(e.target.value)}
                            disabled={savingPrecio} placeholder="Ej: descuento por pronto pago"
                            className="w-full px-3 py-2 border rounded-xl text-sm outline-none mt-1 bg-white"
                            style={{ borderColor: COLORS.BORDER_SUBTLE }} />
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
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: COLORS.TEXT_MUTED }}>
                          Monto a cobrar
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm" style={{ pointerEvents: "none" }}>$</span>
                          <input type="number" min={0} max={precioEfectivo || undefined} step="0.01"
                            value={montoInput} onChange={e => setMontoInput(e.target.value)}
                            onWheel={e => (e.target as HTMLElement).blur()} onKeyDown={e => e.stopPropagation()}
                            placeholder="0.00" disabled={savingMonto}
                            className="w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm font-mono outline-none bg-white"
                            style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }} />
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
                      <div className="flex items-center gap-2 text-sm group">
                        <HugeiconsIcon icon={PaymentIcon} size={14} className="shrink-0" style={{ color: AMBAR }} />
                        <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0 text-sm">Monto a cobrar</span>
                        {tallerMonto > 0 ? (
                          <span className="font-bold text-sm" style={{ color: COLORS.CHARCOAL }}>${tallerMonto.toFixed(2)}</span>
                        ) : (
                          <span className="italic text-sm opacity-50" style={{ color: COLORS.TEXT_MUTED }}>Por registrar</span>
                        )}
                        <button type="button" onClick={handleStartEditMonto}
                          className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                          <HugeiconsIcon icon={Edit01Icon} size={14} />
                        </button>
                      </div>
                    )}
                  </SubCategory>

                  <SubCategory title="Información del Pago" color={AMBAR}>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: COLORS.TEXT_MUTED }}>Tipo de pago</span>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg"
                        style={{
                          backgroundColor: tallerMonto === 0 ? "oklch(0.5 0 0 / 0.08)" : (tipoPagoActual === "completo" ? "oklch(0.55 0.15 150 / 0.12)" : "oklch(0.65 0.15 75 / 0.12)"),
                          color: tallerMonto === 0 ? "oklch(0.5 0 0)" : (tipoPagoActual === "completo" ? "oklch(0.55 0.15 150)" : "oklch(0.65 0.15 75)"),
                        }}>
                        {tallerMonto === 0 ? "AUN NO REGISTRADO" : (tipoPagoActual === "completo" ? "COMPLETO" : "ABONO")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: COLORS.TEXT_MUTED }}>Método de pago</span>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ backgroundColor: "oklch(0.55 0.15 240 / 0.12)", color: "oklch(0.55 0.15 240)", boxShadow: "0 1px 2px oklch(0 0 0 / 0.06)" }}>
                        {(ins.metodo_pago || "—").toUpperCase()}
                      </span>
                    </div>
                    <InfoItem icon={CalendarIcon} label="Fecha de Pago" value={formatDate(ins.fecha_pago)} groupColor={AMBAR} />
                  </SubCategory>

                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2">
                      <input ref={comprobanteRef} type="file" accept="image/*" className="hidden" onChange={handleUploadComprobante} />
                      <button onClick={() => comprobanteRef.current?.click()} disabled={uploadingComprobante}
                        className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold hover:bg-white transition-colors"
                        style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT, opacity: uploadingComprobante ? 0.6 : 1 }}>
                        <HugeiconsIcon icon={Upload05Icon} size={16} />
                        {uploadingComprobante ? "Subiendo..." : ins.comprobante_url ? "Cambiar comprobante" : "Subir comprobante"}
                      </button>
                      {ins.comprobante_url && (
                        <button onClick={() => setExpandedComprobante(!expandedComprobante)}
                          className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold hover:bg-white transition-colors"
                          style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}>
                          <HugeiconsIcon icon={Image01Icon} size={16} />
                          {expandedComprobante ? "Ocultar" : "Ver"}
                        </button>
                      )}
                    </div>
                    {expandedComprobante && ins.comprobante_url && (
                      <div className="rounded-xl border overflow-hidden bg-gray-50 cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <img src={fixImageUrl(ins.comprobante_url)} alt="Comprobante"
                          className="w-full object-contain max-h-[400px]"
                          onClick={() => setExpandedImageUrl(fixImageUrl(ins.comprobante_url))} />
                      </div>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {activeTab === "documento" && (
              <Section title="Documento de Identidad" icon={Image01Icon}>
                <div className="p-4 rounded-xl" style={{ backgroundColor: `color-mix(in srgb, ${PURPURA} 6%, transparent)`, borderLeft: `3px solid ${PURPURA}` }}>
                  {ins.cedula_url ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium opacity-40">Imagen actual</span>
                        <button onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
                          className="flex items-center gap-1 text-xs font-semibold" style={{ color: COLORS.ACCENT }}>
                          <HugeiconsIcon icon={Edit01Icon} size={12} />Cambiar
                        </button>
                      </div>
                      <img src={fixImageUrl(ins.cedula_url)} alt="Cédula"
                        className="w-full object-contain max-h-[400px] rounded-xl border cursor-pointer"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        onClick={() => setExpandedImageUrl(fixImageUrl(ins.cedula_url))} />
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl border border-dashed text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <p className="text-sm mb-3" style={{ color: COLORS.TEXT_MUTED }}>No se ha subido la foto de cédula</p>
                      <button type="button" onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all active:scale-[0.97]"
                        style={{ backgroundColor: COLORS.ACCENT, opacity: uploadingCedula ? 0.6 : 1 }}>
                        <HugeiconsIcon icon={Upload05Icon} size={14} className="inline mr-1.5" />
                        {uploadingCedula ? "Subiendo..." : "Subir foto de cédula"}
                      </button>
                    </div>
                  )}
                  <input ref={cedulaRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCedula} />
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t z-10" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[900px] mx-auto px-6 py-4">
          <div className="flex gap-3">
            <button onClick={() => setConfirmReject(true)}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-red-50 active:scale-[0.97]"
              style={{ borderColor: "oklch(0.50 0.15 10 / 0.3)", color: "oklch(0.50 0.15 10)" }}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} className="inline mr-1.5" />Rechazar
            </button>
            <button onClick={() => setConfirmApprove(true)}
              disabled={actionLoading || yaProcesadaTaller}
              className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-60"
              style={{ backgroundColor: COLORS.ACCENT }}>
              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />Aprobar
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmApprove}
        title="Aprobar Inscripción a Taller"
        message="Se aprobará la inscripción del participante en el taller."
        confirmText="Aprobar"
        cancelText="Cancelar"
        isLoading={actionLoading}
        icon="info"
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(false)}
      />

      <RejectModal
        isOpen={confirmReject}
        isLoading={actionLoading}
        onConfirm={handleReject}
        onCancel={() => setConfirmReject(false)}
      />

      {expandedImageUrl && (
        <ImageZoom url={expandedImageUrl} onClose={() => setExpandedImageUrl(null)} />
      )}
    </div>
  )
}
