/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Edit01Icon,
  Upload05Icon,
  Calendar03Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { PagoPreAprobacionSection, type PagoPreAprobacionRef } from "./PagoPreAprobacionSection"
import { Section, SubCategory, InfoItem, EF } from "./AprobacionHelpers"
import { getFieldValue, fixImageUrl } from "./AprobacionUtils"

interface SolicitudCursoDetailProps {
  selected: any
  solicitudRaw: any
  loadingDetail: boolean
  refreshing: boolean
  editField: string | null
  editVal: string
  savingEdit: boolean
  startEdit: (f: string, v: string) => void
  setEditVal: (v: string) => void
  saveEdit: () => void
  cancelEdit: () => void
  editPagoField: string | null
  editPagoVal: string
  savingPagoEdit: boolean
  setEditPagoField: (f: string | null) => void
  setEditPagoVal: (v: string) => void
  savePagoEdit: () => void
  editCursoField: string | null
  editCursoVal: string
  savingCursoEdit: boolean
  setEditCursoField: (f: string | null) => void
  setEditCursoVal: (v: string) => void
  searchCursoQuery: string
  setSearchCursoQuery: (v: string) => void
  filteredCursosAbiertos: any[]
  saveCursoEdit: () => void
  loadCursosAbiertos: () => void
  getCursoNombre: () => string
  expandedComprobante: boolean
  setExpandedComprobante: (v: boolean) => void
  setExpandedImageUrl: (url: string | null) => void
  uploadingCedula: boolean
  uploadingComprobante: boolean
  deletingComprobante: boolean
  deletingCedula: boolean
  cedulaRef: React.RefObject<HTMLInputElement | null>
  comprobanteRef: React.RefObject<HTMLInputElement | null>
  handleUploadCedula: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleUploadComprobante: (e: React.ChangeEvent<HTMLInputElement>) => void
  setDeleteArchivoModal: (v: { type: "comprobante" | "cedula"; label: string } | null) => void
  setSelected: (v: any) => void
  pagoRef: React.RefObject<PagoPreAprobacionRef | null>
  montoModulo1Valido: boolean
  setMontoModulo1Valido: (v: boolean) => void
  handleApproveWithPayment: (pagos: any[], metodoPago: string) => void
  actionLoading: boolean
  setConfirmAction: (v: any) => void
  showLineasPago: boolean
  cursoInicio: string
  cursoPrecio: number
  totalPrecioModulos: number
  setTotalPrecioModulos: (v: number) => void
}

export function SolicitudCursoDetail(props: SolicitudCursoDetailProps) {
  const {
    selected, solicitudRaw, loadingDetail, refreshing,
    editField, editVal, savingEdit, startEdit, setEditVal, saveEdit, cancelEdit,
    editPagoField, editPagoVal, savingPagoEdit, setEditPagoField, setEditPagoVal, savePagoEdit,
    editCursoField, editCursoVal, savingCursoEdit, setEditCursoField, setEditCursoVal,
    searchCursoQuery, setSearchCursoQuery, filteredCursosAbiertos, saveCursoEdit, loadCursosAbiertos,
    getCursoNombre,
    expandedComprobante, setExpandedComprobante, setExpandedImageUrl,
    uploadingCedula, uploadingComprobante, deletingComprobante, deletingCedula,
    cedulaRef, comprobanteRef,
    handleUploadCedula, handleUploadComprobante, setDeleteArchivoModal, setSelected,
    pagoRef, montoModulo1Valido, setMontoModulo1Valido, handleApproveWithPayment,
    actionLoading, setConfirmAction,
    showLineasPago, cursoInicio, cursoPrecio,
    totalPrecioModulos, setTotalPrecioModulos,
  } = props

  const handleSaveMonto = () => {
    const monto = parseFloat(editPagoVal)
    if (monto < 0) {
      toast.error("El monto no puede ser negativo")
      return
    }
    if (totalPrecioModulos < 0) {
      toast.error("Espera a que carguen los módulos del curso")
      return
    }
    if (monto > totalPrecioModulos) {
      toast.error(`El monto no puede superar el total de los módulos ($${totalPrecioModulos.toLocaleString()})`)
      return
    }
    savePagoEdit()
  }

  if (loadingDetail) {
    return (
      <div className={cn("border-t px-5 py-5 space-y-5 transition-opacity duration-200 relative", refreshing && "opacity-60")} style={{ borderColor: COLORS.BORDER_SUBTLE, background: "oklch(0.985 0 0)" }}>
        {refreshing && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
        )}
        <div className="p-4 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando detalle...</div>
      </div>
    )
  }

  if (!selected) return null

  const AZUL = "oklch(0.55 0.15 240)"
  const VERDE = "oklch(0.55 0.15 160)"
  const PURPURA = "oklch(0.55 0.12 300)"
  const AMBAR = "oklch(0.65 0.15 75)"

  return (
    <div className={cn("border-t px-5 py-5 space-y-5 transition-opacity duration-200 relative", refreshing && "opacity-60")} style={{ borderColor: COLORS.BORDER_SUBTLE, background: "oklch(0.985 0 0)" }}>
      {refreshing && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
      )}
      <Section title="Datos del Estudiante" icon={UserIcon}>
        <div className="space-y-3">
          <SubCategory title="Información Personal" color={AZUL}>
            <EF icon={UserIcon} label="Nombres" field="nombres" data={selected.solicitante?.datos}
              editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
            <EF icon={UserIcon} label="Apellidos" field="apellidos" data={selected.solicitante?.datos}
              editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
            <EF icon={SearchIcon} label="Cédula" field="cedula" data={selected.solicitante?.datos} bold
              editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
            <EF icon={Calendar03Icon} label="Fecha Nacimiento" field="fecha_nacimiento" data={selected.solicitante?.datos}
              editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} inputType="date" groupColor={AZUL} />
            <InfoItem icon={Calendar03Icon} label="Edad" value={getFieldValue(selected.solicitante?.datos, "edad")} groupColor={AZUL} />
            <EF icon={UserIcon} label="Ocupación" field="ocupacion" data={selected.solicitante?.datos}
              editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
            <EF icon={UserIcon} label="Estado Civil" field="estado_civil" data={selected.solicitante?.datos}
              editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
          </SubCategory>

          <SubCategory title="Contacto" color={VERDE}>
            <EF icon={MailIcon} label="Correo" field="correo" data={selected.solicitante?.datos}
              editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={VERDE} />
            <EF icon={CallIcon} label="Teléfono" field="celular" data={selected.solicitante?.datos}
              editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={VERDE} />
          </SubCategory>

          <SubCategory title="Ubicación" color={PURPURA}>
            <EF icon={Location01Icon} label="Dirección" field="direccion" data={selected.solicitante?.datos}
              editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={PURPURA} />
            <EF icon={Location01Icon} label="Ciudad" field="ciudad" data={selected.solicitante?.datos}
              editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={PURPURA} />
          </SubCategory>
        </div>
      </Section>

      <Section title="Curso" icon={BookOpenIcon}>
        <div className="p-3 rounded-xl space-y-2" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 6%, transparent)`, borderLeft: `3px solid ${solicitudRaw.curso_abierto?.catalogo?.color || COLORS.ACCENT}` }}>
          <div className="grid grid-cols-2 gap-2">
            {editCursoField === "curso" ? (
              <div className="col-span-2 space-y-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <HugeiconsIcon icon={BookOpenIcon} size={14} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                  <span style={{ color: COLORS.TEXT_MUTED }}>Buscar y seleccionar curso:</span>
                </div>
                <input
                  type="text"
                  placeholder="Escribe el nombre del curso..."
                  value={searchCursoQuery}
                  onChange={e => setSearchCursoQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg outline-none bg-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  disabled={savingCursoEdit}
                />
                <div className="max-h-40 overflow-y-auto border rounded-lg divide-y bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  {filteredCursosAbiertos.length === 0 ? (
                    <div className="p-3 text-sm text-center text-gray-500">No se encontraron cursos</div>
                  ) : (
                    filteredCursosAbiertos.map((c: any) => {
                      const isSelected = editCursoVal === c.id
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setEditCursoVal(c.id)}
                          className={cn(
                            "w-full text-left p-2.5 text-sm flex flex-col gap-0.5 hover:bg-gray-50 transition-colors",
                            isSelected && "bg-blue-50/50 hover:bg-blue-50 font-semibold"
                          )}
                          style={isSelected ? { borderLeft: `3px solid ${COLORS.ACCENT}` } : {}}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span style={{ color: COLORS.CHARCOAL }}>{c.nombre || c.id}</span>
                            {isSelected && <span className="text-xs text-blue-600 font-bold shrink-0">Seleccionado</span>}
                          </div>
                          <div className="flex gap-2 text-xs opacity-60">
                            {c.semestre && <span>Sem.: {c.semestre}</span>}
                            {c.fecha_inicio && <span>Inicio: {c.fecha_inicio.split("T")[0]}</span>}
                            {c.precio_base && <span>${c.precio_base}</span>}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={saveCursoEdit} disabled={savingCursoEdit} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingCursoEdit ? 0.6 : 1 }}>
                    {savingCursoEdit ? "Guardando..." : "Confirmar curso"}
                  </button>
                  <button onClick={() => { setEditCursoField(null); setEditCursoVal("") }} disabled={savingCursoEdit} className="text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 border" style={{ color: COLORS.TEXT_MUTED, borderColor: COLORS.BORDER_SUBTLE }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm group col-span-2">
                  <HugeiconsIcon icon={BookOpenIcon} size={14} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                  <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0 text-sm">Curso</span>
                  <span className="truncate text-sm" style={{ color: COLORS.CHARCOAL, fontWeight: 700 }}>{getCursoNombre()}</span>
                  <button onClick={() => { setEditCursoField("curso"); setEditCursoVal(selected.curso?.id || ""); setSearchCursoQuery(""); loadCursosAbiertos() }}
                    className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={Edit01Icon} size={14} />
                  </button>
                </div>
                <InfoItem icon={CalendarIcon} label="Inicio" value={cursoInicio} groupColor={COLORS.ACCENT} />
                <InfoItem icon={PaymentIcon} label="Precio" value={`$${cursoPrecio || 0}`} bold groupColor={COLORS.ACCENT} />
              </>
            )}
          </div>
        </div>
      </Section>

      <Section title="Pago" icon={PaymentIcon}>
        <div className="space-y-3">
          <SubCategory title="Detalles del Precio" color={AMBAR}>
            {editPagoField === "pago_monto" ? (
              <div className="flex items-center gap-2 col-span-2">
                <HugeiconsIcon icon={PaymentIcon} size={14} className="shrink-0" style={{ color: AMBAR }} />
                <span className="shrink-0 text-sm" style={{ color: COLORS.TEXT_MUTED }}>Monto:</span>
                <input type="number" step="0.01" value={editPagoVal} onChange={e => setEditPagoVal(e.target.value)} placeholder="0.00"
                  className="flex-1 px-2 py-1.5 text-sm border rounded-lg outline-none" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={savingPagoEdit} />
                <button onClick={handleSaveMonto} disabled={savingPagoEdit} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingPagoEdit ? 0.6 : 1 }}>
                  {savingPagoEdit ? "..." : "Guardar"}
                </button>
                <button onClick={() => { setEditPagoField(null); setEditPagoVal("") }} disabled={savingPagoEdit} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm group">
                <HugeiconsIcon icon={PaymentIcon} size={14} className="shrink-0" style={{ color: AMBAR }} />
                <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0 text-sm">Monto</span>
                {Number(selected.pago?.monto_solicitado) > 0 ? (
                  <span className="font-bold text-sm" style={{ color: COLORS.CHARCOAL }}>${selected.pago?.monto_solicitado}</span>
                ) : (
                  <span className="italic text-sm opacity-50" style={{ color: COLORS.TEXT_MUTED }}>Por registrar</span>
                )}
                <button onClick={() => { setEditPagoField("pago_monto"); setEditPagoVal(String(selected.pago?.monto_solicitado || "")) }}
                  className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                  <HugeiconsIcon icon={Edit01Icon} size={14} />
                </button>
              </div>
            )}
          </SubCategory>

          {selected?.estado?.valor === "pendiente_validacion" && selected?.curso?.id && (
            <PagoPreAprobacionSection
              ref={pagoRef}
              cursoAbiertoId={selected.curso.id}
              cursoNombre={getCursoNombre()}
              metodoPagoInicial={selected.pago?.comprobante?.tipo || "efectivo"}
              montoSolicitado={Number(selected.pago?.monto_solicitado) || 0}
              onMontoModulo1Change={setMontoModulo1Valido}
              onTotalPrecioChange={setTotalPrecioModulos}
              onSubmit={(pagos, metodoPago) => handleApproveWithPayment(pagos, metodoPago)}
            />
          )}

          <SubCategory title="Información del Pago" color={AMBAR}>
            {editPagoField === "pago_tipo" ? (
              <div className="flex items-center gap-2 col-span-2">
                <HugeiconsIcon icon={PaymentIcon} size={14} className="shrink-0" style={{ color: AMBAR }} />
                <span className="shrink-0 text-sm" style={{ color: COLORS.TEXT_MUTED }}>Tipo:</span>
                <select value={editPagoVal} onChange={e => setEditPagoVal(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm border rounded-lg outline-none bg-white" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={savingPagoEdit}>
                  <option value="transferencia">Transferencia</option>
                  <option value="deposito">Depósito</option>
                  <option value="efectivo">Efectivo</option>
                </select>
                <button onClick={savePagoEdit} disabled={savingPagoEdit} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingPagoEdit ? 0.6 : 1 }}>
                  {savingPagoEdit ? "..." : "Guardar"}
                </button>
                <button onClick={() => { setEditPagoField(null); setEditPagoVal("") }} disabled={savingPagoEdit} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: COLORS.TEXT_MUTED }}>Tipo de pago</span>
                {!selected.pago?.monto_solicitado || Number(selected.pago?.monto_solicitado) === 0 ? (
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{
                      backgroundColor: "oklch(0.5 0 0 / 0.08)",
                      color: "oklch(0.5 0 0)",
                    }}
                  >
                    AUN NO REGISTRADO
                  </span>
                ) : (
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{
                      backgroundColor: "oklch(0.55 0.15 240 / 0.12)",
                      color: "oklch(0.55 0.15 240)",
                      boxShadow: "0 1px 2px oklch(0 0 0 / 0.06)",
                    }}
                  >
                    {(selected.pago?.tipo_pago || "—").toUpperCase()}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: COLORS.TEXT_MUTED }}>Comprobante</span>
              <span
                className="text-xs font-bold px-2 py-1 rounded-lg"
                style={{
                  backgroundColor: "oklch(0.55 0.15 240 / 0.12)",
                  color: "oklch(0.55 0.15 240)",
                  boxShadow: "0 1px 2px oklch(0 0 0 / 0.06)",
                }}
              >
                {(selected.pago?.comprobante?.tipo || "—").toUpperCase()}
              </span>
            </div>
            {editPagoField === "pago_fecha" ? (
              <div className="flex items-center gap-2 col-span-2">
                <HugeiconsIcon icon={CalendarIcon} size={14} className="shrink-0" style={{ color: AMBAR }} />
                <span className="shrink-0 text-sm" style={{ color: COLORS.TEXT_MUTED }}>Fecha:</span>
                <input type="date" value={editPagoVal} onChange={e => setEditPagoVal(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm border rounded-lg outline-none" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={savingPagoEdit} />
                <button onClick={savePagoEdit} disabled={savingPagoEdit} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingPagoEdit ? 0.6 : 1 }}>
                  {savingPagoEdit ? "..." : "Guardar"}
                </button>
                <button onClick={() => { setEditPagoField(null); setEditPagoVal("") }} disabled={savingPagoEdit} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <InfoItem icon={CalendarIcon} label="Fecha" value={selected.pago?.comprobante?.fecha_pago_declarada?.split?.("T")?.[0] || "—"} groupColor={AMBAR} />
            )}
          </SubCategory>
          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <input ref={comprobanteRef} type="file" accept="image/*" className="hidden" onChange={handleUploadComprobante} />
              <button onClick={() => comprobanteRef.current?.click()} disabled={uploadingComprobante}
                className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold hover:bg-white transition-colors"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT, opacity: uploadingComprobante ? 0.6 : 1 }}>
                <HugeiconsIcon icon={Upload05Icon} size={16} />
                {uploadingComprobante ? "Subiendo..." : selected.pago?.comprobante?.url ? "Cambiar comprobante" : "Subir comprobante"}
              </button>
              {selected.pago?.comprobante?.url && !selected.pago?.comprobante?.comprobante_purgado && (
                <>
                  <button onClick={() => setExpandedComprobante(!expandedComprobante)}
                    className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold hover:bg-white transition-colors"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={Image01Icon} size={16} />
                    {expandedComprobante ? "Ocultar" : "Ver"}
                  </button>
                  <button onClick={() => setDeleteArchivoModal({ type: "comprobante", label: "comprobante de pago" })} disabled={deletingComprobante}
                    className="p-3 rounded-xl border flex items-center justify-center gap-1 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: "oklch(0.50 0.15 10)" }}>
                    Eliminar
                  </button>
                </>
              )}
            </div>
            {expandedComprobante && selected.pago?.comprobante?.url && !selected.pago?.comprobante?.comprobante_purgado && (
              <div className="rounded-xl border overflow-hidden bg-gray-50 cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <img src={fixImageUrl(selected.pago.comprobante.url)} alt="Comprobante"
                  className="w-full object-contain max-h-[400px]"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, comprobante_purgado: true } } }))
                  }}
                  onClick={() => setExpandedImageUrl(fixImageUrl(selected.pago.comprobante.url))} />
              </div>
            )}
            {selected.pago?.comprobante?.comprobante_purgado && (
              <div className="p-3 rounded-xl border text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                  <HugeiconsIcon icon={Image01Icon} size={12} />
                  Comprobante eliminado del almacenamiento
                </span>
              </div>
            )}
          </div>
          {showLineasPago && selected?.lineas_pago?.modulos?.length > 0 && (
            <div className="p-4 rounded-xl border space-y-2" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.97 0 0)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Resumen de pagos</span>
                <span className="text-xs font-bold" style={{ color: COLORS.ACCENT }}>
                  {selected.lineas_pago.modulos_pagados}/{selected.lineas_pago.modulos_count} módulos pagados
                </span>
              </div>
              {selected.lineas_pago.modulos.map((lp: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span style={{ color: COLORS.CHARCOAL }}>{lp.modulo_nombre}</span>
                  <div className="flex items-center gap-3">
                    <span className="opacity-50 text-sm">${lp.monto_ajustado.toLocaleString()}</span>
                    <span className="font-medium text-sm" style={{ color: lp.monto_abonado > 0 ? "oklch(0.55 0.15 150)" : "oklch(0.5 0.15 20)" }}>
                      ${lp.monto_abonado.toLocaleString()}
                    </span>
                    <span className={cn("text-[10px] font-bold uppercase px-1 py-0.5 rounded-full",
                      lp.estado === "pagado" ? "bg-green-100 text-green-700" :
                      lp.estado === "abonado" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    )}>{lp.estado === "pagado" ? "Pagado" : lp.estado === "abonado" ? "Parcial" : "Pendiente"}</span>
                  </div>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between text-sm font-bold" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <span style={{ color: COLORS.CHARCOAL }}>Total abonado</span>
                <span style={{ color: "oklch(0.55 0.15 150)" }}>
                  ${selected.lineas_pago.total_abonado.toLocaleString()} de ${selected.lineas_pago.total_esperado.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title="Documento de Identidad" icon={Image01Icon}>
        <div className="p-3 rounded-xl" style={{ backgroundColor: `color-mix(in srgb, ${PURPURA} 6%, transparent)`, borderLeft: `3px solid ${PURPURA}` }}>
          {selected.pago?.comprobante?.cedula_url && !selected.pago?.comprobante?.cedula_purgado ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium opacity-40">Imagen actual</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
                    className="flex items-center gap-1 text-xs font-semibold" style={{ color: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={Edit01Icon} size={12} />Cambiar
                  </button>
                  <button onClick={() => setDeleteArchivoModal({ type: "cedula", label: "cédula de identidad" })} disabled={deletingCedula}
                    className="flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
                    style={{ color: "oklch(0.50 0.15 10)" }}>
                    {deletingCedula ? "..." : "✕ Eliminar"}
                  </button>
                </div>
              </div>
              <img src={fixImageUrl(selected.pago.comprobante.cedula_url)} alt="Cédula"
                className="w-full object-contain max-h-[400px] rounded-xl border cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, cedula_purgado: true } } }))
                }}
                onClick={() => setExpandedImageUrl(fixImageUrl(selected.pago.comprobante.cedula_url))} />
            </div>
          ) : selected.pago?.comprobante?.cedula_purgado ? (
            <div className="p-5 rounded-xl border text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                <HugeiconsIcon icon={Image01Icon} size={12} />
                Cédula eliminada del almacenamiento
              </span>
            </div>
          ) : (
            <div className="p-5 rounded-xl border border-dashed text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-sm mb-3" style={{ color: COLORS.TEXT_MUTED }}>No se ha subido la foto de cédula</p>
              <input ref={cedulaRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCedula} />
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

      {solicitudRaw.estado === "pendiente_validacion" ? (
        <div className="flex gap-3 pt-3">
          <button onClick={() => setConfirmAction({ type: "rechazar", id: selected.id })}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-red-50 active:scale-[0.97]"
            style={{ borderColor: "oklch(0.50 0.15 10 / 0.3)", color: "oklch(0.50 0.15 10)" }}>
            <HugeiconsIcon icon={Cancel01Icon} size={16} className="inline mr-1.5" />Rechazar
          </button>
          <button
            onClick={() => pagoRef.current?.submit()}
            disabled={actionLoading || !montoModulo1Valido}
            className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-60"
            style={{ backgroundColor: COLORS.ACCENT }}>
            <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />Aprobar
          </button>
        </div>
      ) : (
        <div className="flex gap-3 pt-3">
          <button onClick={() => setConfirmAction({ type: "rechazar", id: selected.id })}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-red-50 active:scale-[0.97]"
            style={{ borderColor: "oklch(0.50 0.15 10 / 0.3)", color: "oklch(0.50 0.15 10)" }}>
            <HugeiconsIcon icon={Cancel01Icon} size={16} className="inline mr-1.5" />Rechazar
          </button>
        </div>
      )}
    </div>
  )
}