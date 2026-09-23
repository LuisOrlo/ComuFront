/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PaymentIcon,
  CalendarIcon,
  Upload05Icon,
  Image01Icon,
  PencilEdit01Icon,
  Alert02Icon,
  Delete01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
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

export function TallerPagoTab({
  selected,
  yaProcesada,
  editField,
  editVal,
  startEdit,
  setEditVal,
  saveEdit,
  cancelEdit,
  savingEdit,
  comprobanteRef,
  handleUploadComprobante,
  uploadingComprobante,
  expandedComprobante,
  setExpandedComprobante,
  setDeleteArchivoModal,
  deletingComprobante,
  setExpandedImageUrl,
  pagoRef,
  precioBase,
  getTallerNombre,
}: TallerPagoTabProps) {
  const monto = Number(selected.monto_pagado) || 0

  const rawMetodo = (selected.metodo_pago || "").toLowerCase()
  const tipoPagoNormalizado = rawMetodo === "efectivo" ? "efectivo" : rawMetodo ? "transferencia" : ""
  const tipoPagoInicial = selected.tipo_pago === "completo" || selected.tipo_pago === "abono"
    ? selected.tipo_pago
    : "abono"

  const rawFecha = selected.fecha_pago || ""
  const fechaDisplay = rawFecha ? (rawFecha.includes("T") ? rawFecha.split("T")[0] : rawFecha) : ""

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {yaProcesada ? "Información del pago" : "Pago por registrar"}
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                yaProcesada
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {yaProcesada ? "Inscripción procesada" : "Pendiente de registro"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {yaProcesada
              ? "Resumen de arancel cobrado y estado de pago del taller"
              : "Registra y valida los datos de cobro antes de aprobar al participante."}
          </p>
        </div>
      </div>

      {/* Strict Business Alert Badge */}
      {!yaProcesada && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300/80 flex items-start gap-3">
          <HugeiconsIcon icon={Alert02Icon} size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
            <strong className="font-bold">⚠️ El pago NO está registrado todavía.</strong>{" "}
            
          </div>
        </div>
      )}

      {/* Sección 1: Datos de la transacción y comprobante */}
      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
          <HugeiconsIcon icon={PaymentIcon} size={18} className="text-[#fd761a]" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
            1. Datos de la transacción
          </h3>
        </div>

        {/* 3 Info Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Tipo de pago (Editable: Transferencia/Depósito o Efectivo) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tipo de pago
              </span>
              {editField !== "metodo_pago" && (
                <button
                  type="button"
                  onClick={() => startEdit("metodo_pago", tipoPagoNormalizado || "transferencia")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#fd761a] hover:bg-orange-50 transition-colors cursor-pointer"
                  title="Editar tipo de pago"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                </button>
              )}
            </div>

            {editField === "metodo_pago" ? (
              <div className="space-y-2.5 mt-1">
                <select
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  disabled={savingEdit}
                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fd761a]/30 focus:border-[#fd761a]"
                >
                  <option value="transferencia">Transferencia / Depósito</option>
                  <option value="efectivo">Efectivo</option>
                </select>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={savingEdit}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#fd761a] hover:bg-[#ea580c] disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {savingEdit ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={savingEdit}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {tipoPagoNormalizado === "efectivo" ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    Efectivo
                  </span>
                ) : tipoPagoNormalizado === "transferencia" ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    Transferencia / Depósito
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
                    No especificado
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 2. Fecha de pago (Editable) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Fecha de pago
              </span>
              {editField !== "fecha_pago" && (
                <button
                  type="button"
                  onClick={() => startEdit("fecha_pago", fechaDisplay)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#fd761a] hover:bg-orange-50 transition-colors cursor-pointer"
                  title="Editar fecha de pago"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                </button>
              )}
            </div>

            {editField === "fecha_pago" ? (
              <div className="space-y-2.5 mt-1">
                <input
                  type="date"
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  disabled={savingEdit}
                  className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fd761a]/30 focus:border-[#fd761a]"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={savingEdit || !editVal}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#fd761a] hover:bg-[#ea580c] disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {savingEdit ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={savingEdit}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <HugeiconsIcon icon={CalendarIcon} size={15} className="text-slate-400" />
                <span>{fechaDisplay || "No especificada"}</span>
              </div>
            )}
          </div>

          {/* 3. Monto registrado */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Monto registrado
            </span>
            <div>
              {monto > 0 ? (
                <span className="text-xl font-black text-slate-900 font-mono">
                  ${monto.toLocaleString("es-EC", { minimumFractionDigits: 2 })} USD
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-400 italic">No especificado</span>
              )}
            </div>
          </div>
        </div>

        {/* Comprobante cargado card */}
        <div className="pt-2">
          <span className="block text-xs font-bold text-slate-700 mb-1.5">Archivo de Comprobante</span>
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#fd761a] flex items-center justify-center shrink-0 border border-orange-100">
                <HugeiconsIcon icon={Image01Icon} size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {selected.comprobante_url && !selected.comprobante_purgado
                    ? "Comprobante_Pago_Taller.jpg"
                    : selected.comprobante_purgado
                      ? "Comprobante purgado"
                      : "Sin comprobante adjunto"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {selected.comprobante_url && !selected.comprobante_purgado
                    ? "Archivo fotográfico de respaldo"
                    : "Pendiente de adjuntar comprobante"}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={comprobanteRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadComprobante}
              />
              <button
                type="button"
                onClick={() => comprobanteRef.current?.click()}
                disabled={uploadingComprobante}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <HugeiconsIcon icon={Upload05Icon} size={14} />
                <span>
                  {uploadingComprobante
                    ? "Subiendo..."
                    : selected.comprobante_url
                      ? "Cambiar comprobante"
                      : "Subir comprobante"}
                </span>
              </button>

              {selected.comprobante_url && !selected.comprobante_purgado && (
                <>
                  <button
                    type="button"
                    onClick={() => setExpandedComprobante(!expandedComprobante)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <HugeiconsIcon icon={Image01Icon} size={14} />
                    <span>{expandedComprobante ? "Ocultar" : "Ver"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteArchivoModal({ type: "comprobante", label: "comprobante de pago" })}
                    disabled={deletingComprobante}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                    title="Eliminar comprobante"
                  >
                    <HugeiconsIcon icon={Delete01Icon} size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Inline preview */}
          {expandedComprobante && selected.comprobante_url && !selected.comprobante_purgado && (
            <div className="mt-3 rounded-2xl border border-slate-200 overflow-hidden bg-slate-900/5 p-2 text-center">
              <img
                src={fixImageUrl(selected.comprobante_url)}
                alt="Comprobante"
                className="w-full object-contain max-h-[420px] rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setExpandedImageUrl(fixImageUrl(selected.comprobante_url))}
              />
              <p className="text-[11px] text-slate-400 mt-1">Haz clic sobre la imagen para ampliar</p>
            </div>
          )}

          {selected.comprobante_purgado && (
            <div className="mt-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700">
                <HugeiconsIcon icon={Image01Icon} size={13} />
                Comprobante eliminado del almacenamiento
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sección 2: Configuración de cobro o Resumen */}
      {!yaProcesada ? (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={PaymentIcon} size={18} className="text-[#fd761a]" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                2. Asignar pago al taller
              </h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
              Arancel oficial: ${precioBase.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Registra el monto a cobrar, el tipo y método de pago antes de aprobar la inscripción al taller.
          </p>

          <PagoPreAprobacionTallerSection
            ref={pagoRef}
            inscripcionId={selected.id}
            precioBase={precioBase}
            montoInicial={monto}
            tipoPagoInicial={tipoPagoInicial}
            metodoInicial={tipoPagoNormalizado || "efectivo"}
            onSaved={undefined}
          />
        </div>
      ) : (
        /* Ya procesada: Resumen post-aprobación */
        <div className="p-5 rounded-2xl border border-slate-200/80 space-y-4 bg-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Resumen de pago del taller
            </span>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  monto >= precioBase
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {monto >= precioBase ? "Taller pagado completo" : "Pago parcial"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[1.5fr_0.8fr_0.9fr_0.8fr_0.7fr] gap-3 text-[10px] font-bold uppercase tracking-wider pb-2 border-b border-slate-200 text-slate-400">
            <span>Concepto</span>
            <span className="text-right">Precio</span>
            <span className="text-right">Pagado</span>
            <span className="text-right">Saldo</span>
            <span className="text-right">Estado</span>
          </div>

          <div className="grid grid-cols-[1.5fr_0.8fr_0.9fr_0.8fr_0.7fr] gap-3 items-center text-sm py-2 font-mono">
            <span className="truncate font-semibold font-sans text-slate-900">{getTallerNombre()}</span>
            <span className="text-right text-slate-700 font-mono">
              ${precioBase.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
            </span>
            <span
              className={cn(
                "text-right font-mono font-semibold",
                monto > 0 ? "text-emerald-600" : "text-slate-400"
              )}
            >
              ${monto.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
            </span>
            <span
              className={cn(
                "text-right font-mono font-medium",
                precioBase - monto > 0 ? "text-amber-600" : "text-emerald-600"
              )}
            >
              {precioBase - monto > 0
                ? `$${(precioBase - monto).toLocaleString("es-EC", { minimumFractionDigits: 2 })}`
                : "—"}
            </span>
            <div className="flex justify-end font-sans">
              <span
                className={cn(
                  "text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full transition-colors",
                  monto >= precioBase
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : monto > 0
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                {monto >= precioBase ? "Pagado" : monto > 0 ? "Parcial" : "Pendiente"}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block text-emerald-900">
                Total Ingresado
              </span>
              <span className="text-xs font-medium text-emerald-700 block mt-0.5">
                {monto >= precioBase
                  ? "Cobro completo del taller verificado"
                  : `Cobro parcial · Saldo pendiente $${(precioBase - monto).toFixed(2)}`}
              </span>
            </div>
            <span className="text-xl font-black font-mono text-emerald-900">
              ${monto.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
