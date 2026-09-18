import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PaymentIcon,
  CalendarIcon,
  Upload05Icon,
  Image01Icon,
  PencilEdit01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  Delete01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { fixImageUrl } from "../../AprobacionUtils"
import { PagoPreAprobacionSection, type PagoPreAprobacionRef } from "../../PagoPreAprobacionSection"
import { AjustePrecioPanel } from "./AjustePrecioPanel"

interface ModuloLineaPago {
  id: string
  modulo_nombre: string
  monto_ajustado: number
  monto_abonado: number
  monto_original?: number
  estado: string
}

interface SolicitudSeleccionada {
  pago?: {
    tipo_pago?: string
    monto_solicitado?: number
    comprobante?: {
      tipo?: string
      url?: string
      fecha_pago_declarada?: string
      comprobante_purgado?: boolean
    }
  }
  curso?: { id?: string; nombre?: string; es_personalizado?: boolean; precio_base?: number }
  lineas_pago?: {
    modulos?: ModuloLineaPago[]
    inscripcion?: { id: string; monto_ajustado: number; monto_abonado: number; estado: string }
    total_abonado: number
    total_esperado: number
    modulos_pagados: number
    modulos_count: number
  }
}

interface SolicitudPagoTabProps {
  selected: SolicitudSeleccionada
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
  handleApprove: (pagos: Record<string, unknown>[], metodoPago: string, inscripcion?: { total: number; cubierto: number; motivo_ajuste?: string }) => void
  setSelected: (updater: (prev: SolicitudSeleccionada) => SolicitudSeleccionada) => void
  editandoMontos: boolean
  editMontosValues: Record<string, string>
  editPreciosValues?: Record<string, string>
  editMotivosValues?: Record<string, string>
  onStartEditMontos: () => void
  onCancelMontos: () => void
  onEditMontoChange: (lineaId: string, val: string) => void
  onEditPrecioChange?: (lineaId: string, nuevoPrecio: string, motivo: string) => void
  onSaveMontos: () => void
  savingMontos: boolean
}

export function SolicitudPagoTab(props: SolicitudPagoTabProps) {
  const {
    selected,
    yaProcesada,
    editPagoField,
    editPagoVal,
    startEditPago,
    setEditPagoVal,
    saveEditPago,
    cancelEditPago,
    savingPagoEdit,
    comprobanteRef,
    handleUploadComprobante,
    uploadingComprobante,
    expandedComprobante,
    setExpandedComprobante,
    setDeleteArchivoModal,
    deletingComprobante,
    setExpandedImageUrl,
    pagoRef,
    getCursoNombre,
    setMontoValido,
    setTotalPrecioModulos,
    handleApprove,
    setSelected,
    editandoMontos,
    editMontosValues,
    editPreciosValues = {},
    editMotivosValues = {},
    onStartEditMontos,
    onCancelMontos,
    onEditMontoChange,
    onEditPrecioChange,
    onSaveMontos,
    savingMontos,
  } = props

  const [expandedAjustes, setExpandedAjustes] = useState<Record<string, boolean>>({})
  const esPersonalizado = selected?.curso?.es_personalizado === true

  // Normalización de tipo de pago (solo dos opciones válidas: 'transferencia' o 'efectivo')
  const rawTipo = (selected.pago?.comprobante?.tipo || "").toLowerCase()
  const tipoPagoNormalizado = rawTipo === "efectivo" ? "efectivo" : rawTipo ? "transferencia" : ""

  const rawFecha = selected.pago?.comprobante?.fecha_pago_declarada || ""
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
              {yaProcesada ? "Matrícula procesada" : "Pendiente de registro"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {yaProcesada
              ? "Resumen de montos cobrados, abonados y saldos de los módulos"
              : ""}
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

      {/* Sección 1: Datos de la transacción (Tipo de pago, Fecha, Monto) */}
      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
          <HugeiconsIcon icon={PaymentIcon} size={18} className="text-[#fd761a]" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
            1. Datos de la transacción
          </h3>
        </div>

        {/* 3 Info Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Tipo de Pago (Editable: Transferencia/Depósito o Efectivo) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tipo de pago
              </span>
              {editPagoField !== "tipo_pago" && (
                <button
                  type="button"
                  onClick={() => startEditPago("tipo_pago", tipoPagoNormalizado || "transferencia")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#fd761a] hover:bg-orange-50 transition-colors cursor-pointer"
                  title="Editar tipo de pago"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                </button>
              )}
            </div>

            {editPagoField === "tipo_pago" ? (
              <div className="space-y-2.5 mt-1">
                <select
                  value={editPagoVal}
                  onChange={(e) => setEditPagoVal(e.target.value)}
                  disabled={savingPagoEdit}
                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fd761a]/30 focus:border-[#fd761a]"
                >
                  <option value="transferencia">Transferencia / Depósito</option>
                  <option value="efectivo">Efectivo</option>
                </select>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveEditPago}
                    disabled={savingPagoEdit}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#fd761a] hover:bg-[#ea580c] disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {savingPagoEdit ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditPago}
                    disabled={savingPagoEdit}
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

          {/* 2. Fecha declarada (Editable) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Fecha declarada
              </span>
              {editPagoField !== "fecha_pago_declarada" && (
                <button
                  type="button"
                  onClick={() => startEditPago("fecha_pago_declarada", fechaDisplay)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#fd761a] hover:bg-orange-50 transition-colors cursor-pointer"
                  title="Editar fecha declarada"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                </button>
              )}
            </div>

            {editPagoField === "fecha_pago_declarada" ? (
              <div className="space-y-2.5 mt-1">
                <input
                  type="date"
                  value={editPagoVal}
                  onChange={(e) => setEditPagoVal(e.target.value)}
                  disabled={savingPagoEdit}
                  className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fd761a]/30 focus:border-[#fd761a]"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveEditPago}
                    disabled={savingPagoEdit || !editPagoVal}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#fd761a] hover:bg-[#ea580c] disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {savingPagoEdit ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditPago}
                    disabled={savingPagoEdit}
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

          {/* 3. Monto declarado */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Monto declarado
            </span>
            <div>
              {Number(selected.pago?.monto_solicitado) > 0 ? (
                <span className="text-xl font-black text-slate-900 font-mono">
                  ${Number(selected.pago!.monto_solicitado).toLocaleString("es-EC", { minimumFractionDigits: 2 })} USD
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
                  {selected.pago?.comprobante?.url && !selected.pago?.comprobante?.comprobante_purgado
                    ? "Comprobante_Pago_Adjunto.jpg"
                    : selected.pago?.comprobante?.comprobante_purgado
                      ? "Comprobante purgado"
                      : "Sin comprobante adjunto"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {selected.pago?.comprobante?.url && !selected.pago?.comprobante?.comprobante_purgado
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
                    : selected.pago?.comprobante?.url
                      ? "Cambiar comprobante"
                      : "Subir comprobante"}
                </span>
              </button>

              {selected.pago?.comprobante?.url && !selected.pago?.comprobante?.comprobante_purgado && (
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
          {expandedComprobante && selected.pago?.comprobante?.url && !selected.pago?.comprobante?.comprobante_purgado && (
            <div className="mt-3 rounded-2xl border border-slate-200 overflow-hidden bg-slate-900/5 p-2 text-center">
              <img
                src={fixImageUrl(selected.pago.comprobante.url)}
                alt="Comprobante"
                className="w-full object-contain max-h-[420px] rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                onError={() =>
                  setSelected((prev) => ({
                    ...prev,
                    pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, comprobante_purgado: true } },
                  }))
                }
                onClick={() => setExpandedImageUrl(fixImageUrl(selected.pago!.comprobante!.url!))}
              />
              <p className="text-[11px] text-slate-400 mt-1">Haz clic sobre la imagen para ampliar</p>
            </div>
          )}

          {selected.pago?.comprobante?.comprobante_purgado && (
            <div className="mt-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700">
                <HugeiconsIcon icon={Image01Icon} size={13} />
                Comprobante eliminado del almacenamiento
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sección 2: Distribución del pago entre módulos */}
      {!yaProcesada && selected?.curso?.id && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={PaymentIcon} size={18} className="text-[#fd761a]" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                {esPersonalizado ? "2. Pago inicial del curso personalizado" : "2. Distribución del pago entre módulos"}
              </h3>
            </div>
            {!esPersonalizado && <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
              Configuración individual
            </span>}
          </div>
          <p className="text-xs text-slate-500">
            {esPersonalizado
              ? "Registra el pago inicial que se aplicará al precio total del curso cuando se apruebe la matrícula."
              : "Distribuye el monto del comprobante entre los módulos del curso. El valor que ingreses en cada módulo será el monto registrado como pago al confirmar la matrícula."}
          </p>

          <PagoPreAprobacionSection
            ref={pagoRef}
            cursoAbiertoId={selected.curso.id}
            cursoNombre={getCursoNombre()}
            esPersonalizado={esPersonalizado}
            precioCurso={Number(selected.curso.precio_base || 0)}
            metodoPagoInicial={tipoPagoNormalizado || "efectivo"}
            onMontoValidoChange={setMontoValido}
            onTotalPrecioChange={setTotalPrecioModulos}
            onSubmit={(pagos, metodoPago, inscripcion) => handleApprove(pagos, metodoPago, inscripcion)}
          />
        </div>
      )}

      {/* Resumen de pagos y módulos (Post-Aprobación o Reconciliación) */}
      {((selected?.lineas_pago?.modulos?.length ?? 0) > 0 || selected?.lineas_pago?.inscripcion) && (() => {
        const modulos = selected.lineas_pago!.modulos || []
        const inscripcion = selected.lineas_pago!.inscripcion || null
        const lineas: {
          id: string
          nombre: string
          monto_ajustado: number
          monto_abonado: number
          monto_original?: number
          estado: string
        }[] = [
          ...modulos.map((m: ModuloLineaPago) => ({
            id: m.id,
            nombre: m.modulo_nombre,
            monto_ajustado: m.monto_ajustado,
            monto_abonado: m.monto_abonado,
            monto_original: m.monto_original,
            estado: m.estado,
          })),
          ...(inscripcion
            ? [
                {
                  id: inscripcion.id,
                  nombre: "Inscripción",
                  monto_ajustado: inscripcion.monto_ajustado,
                  monto_abonado: inscripcion.monto_abonado,
                  estado: inscripcion.estado,
                },
              ]
            : []),
        ]

        const cambiosCount = editandoMontos
          ? lineas.filter((lp) => {
              const editVal = editMontosValues[lp.id]
              const editPrecioVal = editPreciosValues[lp.id]
              const abonadoChanged =
                editVal !== undefined && Math.abs((parseFloat(editVal) || 0) - lp.monto_abonado) > 0.001
              const precioChanged =
                editPrecioVal !== undefined && Math.abs((parseFloat(editPrecioVal) || 0) - lp.monto_ajustado) > 0.001
              return abonadoChanged || precioChanged
            }).length
          : 0

        const nuevoTotalAbonado = editandoMontos
          ? lineas.reduce((sum, lp) => {
              const editVal = editMontosValues[lp.id]
              const abonadoLive = editVal !== undefined ? parseFloat(editVal) || 0 : lp.monto_abonado
              return sum + abonadoLive
            }, 0)
          : selected.lineas_pago!.total_abonado

        const nuevoTotalEsperado = editandoMontos
          ? lineas.reduce((sum, lp) => {
              const editPrecioVal = editPreciosValues[lp.id]
              const precioLive = editPrecioVal !== undefined ? parseFloat(editPrecioVal) || 0 : lp.monto_ajustado
              return sum + precioLive
            }, 0)
          : selected.lineas_pago!.total_esperado

        return (
          <div className="p-5 rounded-2xl border border-slate-200/80 space-y-4 bg-white shadow-xs">
            {editandoMontos ? (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70">
                <span className="text-xs font-bold text-blue-900">
                  Editando montos{cambiosCount > 0 ? ` — ${cambiosCount} cambio${cambiosCount > 1 ? "s" : ""} sin guardar` : ""}
                </span>
                <button
                  onClick={onCancelMontos}
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={PaymentIcon} size={17} className="text-[#fd761a]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Resumen de pagos por concepto
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {yaProcesada && (
                    <button
                      onClick={onStartEditMontos}
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[#fd761a] transition-all shadow-2xs cursor-pointer"
                    >
                      <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                      <span>Editar Pago</span>
                    </button>
                  )}
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                    {selected.lineas_pago!.modulos_pagados}/{selected.lineas_pago!.modulos_count} módulos pagados
                  </span>
                </div>
              </div>
            )}

            <div
              className={cn(
                "grid gap-3 text-[10px] font-bold uppercase tracking-wider pb-2 border-b border-slate-200 text-slate-400",
                editandoMontos ? "grid-cols-[1.2fr_1.3fr_1.1fr_0.7fr]" : "grid-cols-[1.5fr_0.8fr_0.9fr_0.8fr_0.7fr]"
              )}
            >
              <span>Concepto</span>
              <span className="text-right">Precio</span>
              <span className="text-right">Pagado</span>
              {!editandoMontos && <span className="text-right">Saldo</span>}
              <span className="text-right">Estado</span>
            </div>

            {lineas.map((lp) => {
              const editVal = editMontosValues[lp.id]
              const editPrecioVal = editPreciosValues[lp.id]
              const abonadoLive = editandoMontos ? parseFloat(editVal ?? String(lp.monto_abonado)) || 0 : lp.monto_abonado
              const precioOriginal = lp.monto_original || lp.monto_ajustado || 0
              const precioLive =
                editandoMontos && editPrecioVal !== undefined ? parseFloat(editPrecioVal) || 0 : lp.monto_ajustado

              const changed =
                editandoMontos &&
                ((editVal !== undefined && parseFloat(editVal) !== lp.monto_abonado) ||
                  (editPrecioVal !== undefined && Math.abs(parseFloat(editPrecioVal) - lp.monto_ajustado) > 0.001))
              const saldoLive = editandoMontos ? precioLive - abonadoLive : 0
              const saldoSaved = (lp.monto_ajustado || 0) - (lp.monto_abonado || 0)

              let estadoLive = lp.estado
              if (editandoMontos) {
                if (abonadoLive >= precioLive && precioLive > 0) {
                  estadoLive = "pagado"
                } else if (abonadoLive > 0) {
                  estadoLive = "abonado"
                } else {
                  estadoLive = "pendiente"
                }
              }

              return (
                <div
                  key={lp.id}
                  className={cn(
                    "grid gap-3 items-center text-sm py-2.5 transition-colors border-b border-slate-100 last:border-0",
                    editandoMontos ? "grid-cols-[1.2fr_1.3fr_1.1fr_0.7fr]" : "grid-cols-[1.5fr_0.8fr_0.9fr_0.8fr_0.7fr]",
                    changed && "bg-orange-50/50 -mx-2 px-2 rounded-xl"
                  )}
                >
                  <span className="truncate font-semibold text-slate-900 self-center">{lp.nombre}</span>

                  {editandoMontos ? (
                    <div className="flex justify-end self-center">
                      <AjustePrecioPanel
                        precioOriginal={precioOriginal}
                        precioActual={precioLive}
                        motivoActual={editMotivosValues[lp.id] ?? ""}
                        expandido={Boolean(expandedAjustes[lp.id])}
                        onConfirmar={(nuevoPrecio, motivo) => {
                          onEditPrecioChange?.(lp.id, String(nuevoPrecio), motivo)
                          setExpandedAjustes((prev) => ({ ...prev, [lp.id]: false }))
                        }}
                        onCancelar={() => {
                          setExpandedAjustes((prev) => ({ ...prev, [lp.id]: false }))
                        }}
                        onToggleExpandir={() => {
                          setExpandedAjustes((prev) => ({ ...prev, [lp.id]: !prev[lp.id] }))
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-right font-mono text-slate-700 self-center">
                      ${lp.monto_ajustado.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                    </span>
                  )}

                  {editandoMontos ? (
                    <div className="flex flex-col gap-0.5 items-end">
                      <div className="relative w-full max-w-[110px]">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-400 pointer-events-none">
                          $
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editVal ?? String(lp.monto_abonado)}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "")
                            if ((val.match(/\./g) || []).length <= 1) {
                              const numVal = parseFloat(val) || 0
                              if (numVal > precioLive && precioLive > 0) {
                                onEditMontoChange(lp.id, String(precioLive))
                                toast.warning(
                                  `El pago abonado no puede exceder el precio ($${precioLive.toLocaleString("es-EC", { minimumFractionDigits: 2 })})`
                                )
                              } else {
                                onEditMontoChange(lp.id, val)
                              }
                            }
                          }}
                          onWheel={(e) => (e.target as HTMLElement).blur()}
                          className="w-full pl-7 pr-2 py-1 text-right text-sm font-mono outline-none bg-white rounded-lg border border-slate-300 focus:border-[#fd761a] transition-all"
                        />
                      </div>
                      <span
                        className={cn(
                          "text-[10px] leading-tight font-mono",
                          saldoLive > 0 ? "text-amber-600" : saldoLive < 0 ? "text-rose-600" : "text-emerald-600"
                        )}
                      >
                        {saldoLive < 0 ? `excede: $${Math.abs(saldoLive).toFixed(2)}` : `saldo: $${saldoLive.toFixed(2)}`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 justify-end self-center font-mono">
                      <span
                        className={cn(
                          "text-right font-semibold",
                          lp.monto_abonado > 0 ? "text-emerald-600" : "text-slate-400"
                        )}
                      >
                        ${lp.monto_abonado.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {!editandoMontos && (
                    <span
                      className={cn(
                        "text-right font-mono self-center font-medium",
                        saldoSaved > 0 ? "text-amber-600" : "text-emerald-600"
                      )}
                    >
                      {saldoSaved > 0 ? `$${saldoSaved.toLocaleString("es-EC", { minimumFractionDigits: 2 })}` : "—"}
                    </span>
                  )}

                  <div className="flex justify-end self-center">
                    <span
                      className={cn(
                        "text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full transition-colors",
                        estadoLive === "pagado"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : estadoLive === "abonado"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                      )}
                    >
                      {estadoLive === "pagado" ? "Pagado" : estadoLive === "abonado" ? "Parcial" : "Pendiente"}
                    </span>
                  </div>
                </div>
              )
            })}

            {editandoMontos ? (
              <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-slate-500">Total abonado después de guardar</span>
                  <span className="text-base font-extrabold font-mono text-slate-900">
                    ${nuevoTotalAbonado.toLocaleString("es-EC", { minimumFractionDigits: 2 })} de ${nuevoTotalEsperado.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={onCancelMontos}
                    type="button"
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={onSaveMontos}
                    disabled={savingMontos || cambiosCount === 0}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#ea580c] transition-all shadow-xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                    <span>Guardar{cambiosCount > 0 ? ` ${cambiosCount} cambio${cambiosCount > 1 ? "s" : ""}` : ""}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-sm font-bold">
                <span className="text-slate-700">Total abonado</span>
                <span className="font-mono text-base font-extrabold text-emerald-600">
                  ${selected.lineas_pago!.total_abonado.toLocaleString("es-EC", { minimumFractionDigits: 2 })} de ${selected.lineas_pago!.total_esperado.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
