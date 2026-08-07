/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import { PaymentIcon, CalendarIcon, Upload05Icon, Image01Icon, PencilEdit01Icon, CheckmarkCircle02Icon, CancelCircleIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Section, SubCategory, EF } from "../../AprobacionHelpers"
import { fixImageUrl } from "../../AprobacionUtils"
import { PagoPreAprobacionSection, type PagoPreAprobacionRef } from "../../PagoPreAprobacionSection"

interface SolicitudPagoTabProps {
  selected: any
  yaProcesada: boolean
  editPagoField: string | null
  editPagoVal: string
  startEditPago: (field: string, value: string) => void
  setEditPagoVal: (val: string) => void
  saveEditPago: () => void
  cancelEditPago: () => void
  savingPagoEdit: boolean
  comprobanteRef: React.RefObject<HTMLInputElement | null>
  handleUploadComprobante: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploadingComprobante: boolean
  expandedComprobante: boolean
  setExpandedComprobante: (val: boolean) => void
  setDeleteArchivoModal: (val: { type: "comprobante" | "cedula"; label: string } | null) => void
  deletingComprobante: boolean
  setExpandedImageUrl: (url: string | null) => void
  pagoRef: React.RefObject<PagoPreAprobacionRef | null>
  getCursoNombre: () => string
  setMontoValido: (val: boolean) => void
  setTotalPrecioModulos: (val: number) => void
  handleApprove: (pagos: any[], metodoPago: string, inscripcion?: { total: number; cubierto: number }) => void
  setSelected: (updater: (prev: any) => any) => void
  editingLineaId: string | null
  editingLineaVal: string
  startEditLinea: (lineaId: string, value: string) => void
  setEditLineaVal: (val: string) => void
  saveEditLinea: () => void
  cancelEditLinea: () => void
  savingLineaEdit: boolean
}

export function SolicitudPagoTab(props: SolicitudPagoTabProps) {
  const { selected, yaProcesada, editPagoField, editPagoVal, startEditPago, setEditPagoVal,
    saveEditPago, cancelEditPago, savingPagoEdit, comprobanteRef, handleUploadComprobante, uploadingComprobante,
    expandedComprobante, setExpandedComprobante, setDeleteArchivoModal,
    deletingComprobante, setExpandedImageUrl, pagoRef, getCursoNombre,
    setMontoValido, setTotalPrecioModulos, handleApprove, setSelected,
    editingLineaId, editingLineaVal, startEditLinea, setEditLineaVal,
    saveEditLinea, cancelEditLinea, savingLineaEdit } = props

  return (
    <Section title="Pago" icon={PaymentIcon}>
      <div className="space-y-5">
        <SubCategory title="Datos del Comprobante">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: COLORS.TEXT_MUTED }}>Tipo de pago</span>
            {selected.pago?.tipo_pago && Number(selected.pago?.monto_solicitado) > 0 ? (
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: "oklch(0.55 0.15 240 / 0.12)", color: "oklch(0.55 0.15 240)", boxShadow: "0 1px 2px oklch(0 0 0 / 0.06)" }}>
                {(selected.pago.tipo_pago).toUpperCase()}
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
              {(selected.pago?.comprobante?.tipo || "—").toUpperCase()}
            </span>
          </div>
          <EF icon={CalendarIcon} label="Fecha" field="fecha_pago_declarada" data={selected.pago?.comprobante}
            editField={editPagoField} editVal={editPagoVal} onEdit={startEditPago} onChange={setEditPagoVal}
            onSave={saveEditPago} onCancel={cancelEditPago} saving={savingPagoEdit}
            inputType="date" validator={() => null} />
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: COLORS.TEXT_MUTED }}>Monto declarado</span>
            {Number(selected.pago?.monto_solicitado) > 0 ? (
              <span className="font-bold text-sm" style={{ color: COLORS.CHARCOAL }}>${Number(selected.pago.monto_solicitado).toLocaleString()}</span>
            ) : (
              <span className="italic text-sm opacity-50" style={{ color: COLORS.TEXT_MUTED }}>No especificado</span>
            )}
          </div>
        </SubCategory>

        <div className="space-y-2">
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
                onError={() => setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, comprobante_purgado: true } } }))}
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

        {!yaProcesada && selected?.curso?.id && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "oklch(0.65 0.15 75)" }}>
              Asignar montos a módulos
            </p>
            <p className="text-xs mb-3" style={{ color: COLORS.TEXT_MUTED }}>
              Distribuye el monto del comprobante entre los módulos del curso. El valor que ingreses en cada módulo será el monto registrado como pago.
            </p>
            <PagoPreAprobacionSection
              ref={pagoRef}
              cursoAbiertoId={selected.curso.id}
              cursoNombre={getCursoNombre()}
              metodoPagoInicial={selected.pago?.comprobante?.tipo || "efectivo"}
              onMontoValidoChange={setMontoValido}
              onTotalPrecioChange={setTotalPrecioModulos}
              onSubmit={(pagos, metodoPago, inscripcion) => handleApprove(pagos, metodoPago, inscripcion)}
            />
          </div>
        )}

        {(selected?.lineas_pago?.modulos?.length > 0 || selected?.lineas_pago?.inscripcion) && (
          <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.97 0 0)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Resumen de pagos</span>
              <span className="text-xs font-bold" style={{ color: COLORS.ACCENT }}>
                {selected.lineas_pago.modulos_pagados}/{selected.lineas_pago.modulos_count} módulos pagados
              </span>
            </div>

            <div className="grid grid-cols-[1fr_90px_90px_80px_75px] gap-2 text-[10px] font-bold uppercase tracking-wider pb-1 border-b" style={{ color: COLORS.TEXT_MUTED, borderColor: COLORS.BORDER_SUBTLE }}>
              <span>Módulo</span>
              <span className="text-right">Precio</span>
              <span className="text-right">Pagado</span>
              <span className="text-right">Saldo</span>
              <span className="text-right">Estado</span>
            </div>

            {selected.lineas_pago.modulos.map((lp: any, i: number) => {
              const isEditing = editingLineaId === lp.id
              const saldo = (lp.monto_ajustado || 0) - (lp.monto_abonado || 0)
              return (
                <div key={i} className="grid grid-cols-[1fr_90px_90px_80px_75px] gap-2 items-center text-sm py-1">
                  <span className="truncate font-medium" style={{ color: COLORS.CHARCOAL }}>{lp.modulo_nombre}</span>
                  <span className="text-right" style={{ color: COLORS.CHARCOAL }}>${lp.monto_ajustado.toLocaleString()}</span>

                  {isEditing ? (
                    <div className="flex items-center gap-1 justify-end">
                      <input
                        type="number" min="0" step="0.01"
                        max={lp.monto_ajustado}
                        value={editingLineaVal}
                        onChange={e => setEditLineaVal(e.target.value)}
                        onWheel={e => (e.target as HTMLElement).blur()}
                        className="w-[70px] px-1.5 py-0.5 border rounded-md text-xs font-mono outline-none focus:border-blue-500 bg-white text-right"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                      />
                      <button onClick={saveEditLinea} disabled={savingLineaEdit}
                        className="size-5 flex items-center justify-center rounded hover:bg-green-50 transition-colors disabled:opacity-50"
                        style={{ color: "oklch(0.55 0.15 150)" }}>
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
                      </button>
                      <button onClick={cancelEditLinea} disabled={savingLineaEdit}
                        className="size-5 flex items-center justify-center rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                        style={{ color: "oklch(0.5 0.15 20)" }}>
                        <HugeiconsIcon icon={CancelCircleIcon} size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 justify-end">
                      <span className="text-right font-medium" style={{ color: lp.monto_abonado > 0 ? "oklch(0.55 0.15 150)" : "oklch(0.5 0.15 20)" }}>
                        ${lp.monto_abonado.toLocaleString()}
                      </span>
                      {yaProcesada && (
                        <button
                          onClick={() => startEditLinea(lp.id, String(lp.monto_abonado))}
                          className="size-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                          style={{ color: COLORS.TEXT_MUTED }}
                          title="Editar monto pagado">
                          <HugeiconsIcon icon={PencilEdit01Icon} size={11} />
                        </button>
                      )}
                    </div>
                  )}

                  <span className="text-right font-medium" style={{ color: saldo > 0 ? "oklch(0.5 0.15 20)" : "oklch(0.55 0.15 150)" }}>
                    ${saldo.toLocaleString()}
                  </span>

                  <div className="flex justify-end">
                    <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                      lp.estado === "pagado" ? "bg-green-100 text-green-700" :
                      lp.estado === "abonado" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    )}>{lp.estado === "pagado" ? "Pagado" : lp.estado === "abonado" ? "Parcial" : "Pendiente"}</span>
                  </div>
                </div>
              )
            })}

            {selected.lineas_pago.inscripcion && (() => {
              const ins = selected.lineas_pago.inscripcion
              const isEditing = editingLineaId === ins.id
              const saldoIns = (ins.monto_ajustado || 0) - (ins.monto_abonado || 0)
              return (
                <div className="border-t pt-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  {isEditing && (
                    <div className="grid grid-cols-[1fr_90px_90px_80px_75px] gap-2 items-center text-sm py-1">
                      <span className="truncate font-medium" style={{ color: COLORS.CHARCOAL }}>Inscripción</span>
                      <span className="text-right" style={{ color: COLORS.CHARCOAL }}>${ins.monto_ajustado.toLocaleString()}</span>
                      <div className="flex items-center gap-1 justify-end">
                        <input
                          type="number" min="0" step="0.01"
                          max={ins.monto_ajustado}
                          value={editingLineaVal}
                          onChange={e => setEditLineaVal(e.target.value)}
                          onWheel={e => (e.target as HTMLElement).blur()}
                          className="w-[70px] px-1.5 py-0.5 border rounded-md text-xs font-mono outline-none focus:border-blue-500 bg-white text-right"
                          style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        />
                        <button onClick={saveEditLinea} disabled={savingLineaEdit}
                          className="size-5 flex items-center justify-center rounded hover:bg-green-50 transition-colors disabled:opacity-50"
                          style={{ color: "oklch(0.55 0.15 150)" }}>
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
                        </button>
                        <button onClick={cancelEditLinea} disabled={savingLineaEdit}
                          className="size-5 flex items-center justify-center rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                          style={{ color: "oklch(0.5 0.15 20)" }}>
                          <HugeiconsIcon icon={CancelCircleIcon} size={12} />
                        </button>
                      </div>
                      <span />
                      <span />
                    </div>
                  )}
                  {!isEditing && (
                    <div className="grid grid-cols-[1fr_90px_90px_80px_75px] gap-2 items-center text-sm py-1">
                      <span className="truncate font-medium" style={{ color: COLORS.CHARCOAL }}>Inscripción</span>
                      <span className="text-right" style={{ color: COLORS.CHARCOAL }}>${ins.monto_ajustado.toLocaleString()}</span>
                      <div className="flex items-center gap-0.5 justify-end">
                        <span className="text-right font-medium" style={{ color: ins.monto_abonado > 0 ? "oklch(0.55 0.15 150)" : "oklch(0.5 0.15 20)" }}>
                          ${ins.monto_abonado.toLocaleString()}
                        </span>
                        {yaProcesada && (
                          <button
                            onClick={() => startEditLinea(ins.id, String(ins.monto_abonado))}
                            className="size-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                            style={{ color: COLORS.TEXT_MUTED }}
                            title="Editar monto pagado">
                            <HugeiconsIcon icon={PencilEdit01Icon} size={11} />
                          </button>
                        )}
                      </div>
                      <span className="text-right font-medium" style={{ color: saldoIns > 0 ? "oklch(0.5 0.15 20)" : "oklch(0.55 0.15 150)" }}>
                        {saldoIns > 0 ? `$${saldoIns.toLocaleString()}` : "—"}
                      </span>
                      <div className="flex justify-end">
                        <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                          ins.estado === "pagado" ? "bg-green-100 text-green-700" :
                          ins.estado === "abonado" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        )}>{ins.estado === "pagado" ? "Pagado" : ins.estado === "abonado" ? "Parcial" : "Pendiente"}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="border-t pt-2 flex justify-between text-sm font-bold" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span style={{ color: COLORS.CHARCOAL }}>Total abonado</span>
              <span style={{ color: "oklch(0.55 0.15 150)" }}>
                ${selected.lineas_pago.total_abonado.toLocaleString()} de ${selected.lineas_pago.total_esperado.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}
