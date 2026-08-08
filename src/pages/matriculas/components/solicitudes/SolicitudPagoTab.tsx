/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import { PaymentIcon, CalendarIcon, Upload05Icon, Image01Icon, PencilEdit01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
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
  editandoMontos: boolean
  editMontosValues: Record<string, string>
  onStartEditMontos: () => void
  onCancelMontos: () => void
  onEditMontoChange: (lineaId: string, val: string) => void
  onSaveMontos: () => void
  savingMontos: boolean
}

export function SolicitudPagoTab(props: SolicitudPagoTabProps) {
  const { selected, yaProcesada, editPagoField, editPagoVal, startEditPago, setEditPagoVal,
    saveEditPago, cancelEditPago, savingPagoEdit, comprobanteRef, handleUploadComprobante, uploadingComprobante,
    expandedComprobante, setExpandedComprobante, setDeleteArchivoModal,
    deletingComprobante, setExpandedImageUrl, pagoRef, getCursoNombre,
    setMontoValido, setTotalPrecioModulos, handleApprove, setSelected,
    editandoMontos, editMontosValues, onStartEditMontos, onCancelMontos,
    onEditMontoChange, onSaveMontos, savingMontos } = props

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
          <div className="flex items-center gap-4">
            <input ref={comprobanteRef} type="file" accept="image/*" className="hidden" onChange={handleUploadComprobante} />
            <button onClick={() => comprobanteRef.current?.click()} disabled={uploadingComprobante}
              className="inline-flex items-center gap-1 text-xs font-medium hover:underline transition-colors"
              style={{ color: COLORS.ACCENT, opacity: uploadingComprobante ? 0.6 : 1 }}>
              <HugeiconsIcon icon={Upload05Icon} size={14} />
              {uploadingComprobante ? "Subiendo..." : selected.pago?.comprobante?.url ? "Cambiar comprobante" : "Subir comprobante"}
            </button>
            {selected.pago?.comprobante?.url && !selected.pago?.comprobante?.comprobante_purgado && (
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

        {(selected?.lineas_pago?.modulos?.length > 0 || selected?.lineas_pago?.inscripcion) && (() => {
          const modulos = selected.lineas_pago.modulos || []
          const inscripcion = selected.lineas_pago.inscripcion || null
          const lineas: { id: string; nombre: string; monto_ajustado: number; monto_abonado: number; estado: string }[] = [
            ...modulos.map((m: any) => ({ id: m.id, nombre: m.modulo_nombre, monto_ajustado: m.monto_ajustado, monto_abonado: m.monto_abonado, estado: m.estado })),
            ...(inscripcion ? [{ id: inscripcion.id, nombre: "Inscripción", monto_ajustado: inscripcion.monto_ajustado, monto_abonado: inscripcion.monto_abonado, estado: inscripcion.estado }] : []),
          ]

          const cambiosCount = editandoMontos
            ? lineas.filter(lp => parseFloat(editMontosValues[lp.id] ?? "") !== lp.monto_abonado).length
            : 0

          const nuevoTotalAbonado = editandoMontos
            ? lineas.reduce((sum, lp) => sum + (parseFloat(editMontosValues[lp.id]) || 0), 0)
            : selected.lineas_pago.total_abonado

          return (
          <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.97 0 0)" }}>
            {editandoMontos ? (
              <div className="flex items-center justify-between px-3 py-2 -mx-1 rounded-lg" style={{ backgroundColor: COLORS.ACCENT }}>
                <span className="text-xs font-bold text-white">
                  Editando montos{cambiosCount > 0 ? ` — ${cambiosCount} cambio${cambiosCount > 1 ? "s" : ""} sin guardar` : ""}
                </span>
                <button onClick={onCancelMontos}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/30 text-white hover:bg-white/10 transition-colors">
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Resumen de pagos</span>
                <div className="flex items-center gap-3">
                  {yaProcesada && (
                    <button onClick={onStartEditMontos}
                      className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                      style={{ color: COLORS.ACCENT }}>
                      <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                      Editar Pago
                    </button>
                  )}
                  <span className="text-xs font-bold" style={{ color: COLORS.ACCENT }}>
                    {selected.lineas_pago.modulos_pagados}/{selected.lineas_pago.modulos_count} módulos pagados
                  </span>
                </div>
              </div>
            )}

            <div className={cn(
              "grid gap-3 text-[10px] font-bold uppercase tracking-wider pb-1 border-b",
              editandoMontos ? "grid-cols-[1.8fr_0.8fr_1.2fr_0.8fr]" : "grid-cols-[1.5fr_0.8fr_0.9fr_0.8fr_0.7fr]"
            )} style={{ color: COLORS.TEXT_MUTED, borderColor: COLORS.BORDER_SUBTLE }}>
              <span>Módulo</span>
              <span className="text-right">Precio</span>
              <span className="text-right">Pagado</span>
              {!editandoMontos && <span className="text-right">Saldo</span>}
              <span className="text-right">Estado</span>
            </div>

            {lineas.map((lp) => {
              const editVal = editMontosValues[lp.id]
              const changed = editandoMontos && editVal !== undefined && parseFloat(editVal) !== lp.monto_abonado
              const saldoLive = editandoMontos ? (lp.monto_ajustado || 0) - (parseFloat(editVal) || 0) : 0
              const saldoSaved = (lp.monto_ajustado || 0) - (lp.monto_abonado || 0)

              return (
                <div key={lp.id} className={cn(
                  "grid gap-3 items-center text-sm py-1",
                  editandoMontos ? "grid-cols-[1.8fr_0.8fr_1.2fr_0.8fr]" : "grid-cols-[1.5fr_0.8fr_0.9fr_0.8fr_0.7fr]",
                  changed && "border-l-2 pl-2 -ml-[10px] rounded"
                )} style={changed ? {
                  borderLeftColor: COLORS.ACCENT,
                  backgroundColor: "oklch(0.65 0.15 45 / 0.04)",
                } : undefined}>
                  <span className="truncate font-medium self-center" style={{ color: COLORS.CHARCOAL }}>{lp.nombre}</span>
                  <span className="text-right self-center" style={{ color: COLORS.CHARCOAL }}>${lp.monto_ajustado.toLocaleString()}</span>

                  {editandoMontos ? (
                    <div className="flex flex-col gap-0.5 items-end">
                      <div className="relative w-[110px]">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-mono pointer-events-none" style={{ color: COLORS.TEXT_MUTED }}>$</span>
                        <input
                          type="text" inputMode="decimal"
                          value={editVal ?? String(lp.monto_abonado)}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9.]/g, "")
                            if ((val.match(/\./g) || []).length <= 1) {
                              onEditMontoChange(lp.id, val)
                            }
                          }}
                          onWheel={e => (e.target as HTMLElement).blur()}
                          className="w-full pl-7 pr-2 py-1 text-right text-sm font-mono outline-none bg-white rounded-md border"
                          style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        />
                      </div>
                      <span className="text-[10px] leading-tight" style={{ color: saldoLive < 0 ? "oklch(0.5 0.15 20)" : saldoLive > 0 ? "oklch(0.5 0.15 20)" : "oklch(0.55 0.15 150)" }}>
                        {saldoLive < 0 ? `excede en $${Math.abs(saldoLive).toLocaleString()}` : `saldo: $${saldoLive.toLocaleString()}`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 justify-end self-center">
                      <span className="text-right font-medium" style={{ color: lp.monto_abonado > 0 ? "oklch(0.55 0.15 150)" : "oklch(0.5 0.15 20)" }}>
                        ${lp.monto_abonado.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {!editandoMontos && (
                    <span className="text-right font-medium self-center" style={{ color: saldoSaved > 0 ? "oklch(0.5 0.15 20)" : "oklch(0.55 0.15 150)" }}>
                      {saldoSaved > 0 ? `$${saldoSaved.toLocaleString()}` : "—"}
                    </span>
                  )}

                  <div className="flex justify-end self-center">
                    <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                      lp.estado === "pagado" ? "bg-green-100 text-green-700" :
                      lp.estado === "abonado" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    )}>{lp.estado === "pagado" ? "Pagado" : lp.estado === "abonado" ? "Parcial" : "Pendiente"}</span>
                  </div>
                </div>
              )
            })}

            {editandoMontos ? (
              <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>Total abonado después de guardar</span>
                  <span className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                    ${nuevoTotalAbonado.toLocaleString()} de ${selected.lineas_pago.total_esperado.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={onCancelMontos}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-gray-100"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
                    Cancelar
                  </button>
                  <button onClick={onSaveMontos} disabled={savingMontos || cambiosCount === 0}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                    Guardar{cambiosCount > 0 ? ` ${cambiosCount} cambio${cambiosCount > 1 ? "s" : ""}` : ""}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t pt-2 flex justify-between text-sm font-bold" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <span style={{ color: COLORS.CHARCOAL }}>Total abonado</span>
                <span style={{ color: "oklch(0.55 0.15 150)" }}>
                  ${selected.lineas_pago.total_abonado.toLocaleString()} de ${selected.lineas_pago.total_esperado.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          )
        })()}
      </div>
    </Section>
  )
}
