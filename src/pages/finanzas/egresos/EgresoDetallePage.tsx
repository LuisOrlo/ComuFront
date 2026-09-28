import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  InvoiceIcon,
  Calendar03Icon,
  Payment02Icon,
  Image01Icon,
  UserIcon,
  AiFolderIcon,
  PackageIcon,
  SettingsIcon,
  Edit01Icon,
  BanknoteArrowDownIcon,
  Delete02Icon,
  CheckmarkCircle04Icon,
} from "@hugeicons/core-free-icons"
import {
  Trash2,
  ExternalLink,
  Eye,
  FileText,
  AlertCircle,
} from "lucide-react"
import { getStorageUrl, cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { ImageZoom } from "@/pages/matriculas/ImageZoom"
import { toast } from "sonner"

const CAT_CONFIG: Record<
  string,
  { label: string; icon: typeof UserIcon; color: string; bg: string; border: string }
> = {
  Personal: {
    label: "Personal & Docencia",
    icon: UserIcon,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  Servicios: {
    label: "Servicios Básicos & Locales",
    icon: AiFolderIcon,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  Equipos: {
    label: "Equipamiento & Tecnología",
    icon: SettingsIcon,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  Varios: {
    label: "Gastos Operativos Varios",
    icon: PackageIcon,
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
}

export function EgresoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)

  // Modales
  const [zoomImg, setZoomImg] = useState<string | null>(null)
  const [deleteReceiptModal, setDeleteReceiptModal] = useState(false)
  const [deletingReceipt, setDeletingReceipt] = useState(false)
  const [comprobanteEliminado, setComprobanteEliminado] = useState(false)

  const [deleteEgresoModal, setDeleteEgresoModal] = useState(false)
  const [deletingEgreso, setDeletingEgreso] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    financeService
      .getEgreso(id)
      .then((res) => setData(res.data))
      .catch(() => {
        toast.error("Error al cargar el detalle del egreso")
        navigate("/finanzas/egresos")
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleDeleteComprobante = async () => {
    if (!id) return
    setDeletingReceipt(true)
    try {
      await financeService.deleteComprobante(id, "egreso")
      toast.success("Comprobante eliminado del almacenamiento")
      setComprobanteEliminado(true)
      setData((prev: unknown) =>
        prev && typeof prev === "object" ? { ...prev, comprobante_url: null } : prev,
      )
    } catch {
      toast.error("Error al eliminar el comprobante")
    } finally {
      setDeletingReceipt(false)
      setDeleteReceiptModal(false)
    }
  }

  const handleDeleteEgreso = async () => {
    if (!id) return
    setDeletingEgreso(true)
    try {
      await financeService.deleteEgreso(id)
      toast.success("Egreso eliminado correctamente")
      navigate("/finanzas/egresos")
    } catch {
      toast.error("Error al eliminar el egreso")
    } finally {
      setDeletingEgreso(false)
      setDeleteEgresoModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center py-32 bg-[#f8f9ff] text-slate-400 space-y-3">
        <div className="animate-spin size-9 border-[3px] border-t-transparent rounded-full border-rose-500" />
        <p className="text-xs font-semibold text-slate-500">
          Cargando detalle del egreso...
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center py-32 px-4 bg-[#f8f9ff] text-center">
        <div className="size-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <HugeiconsIcon icon={InvoiceIcon} size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Egreso no encontrado
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
          El registro solicitado no existe o fue removido de los libros contables.
        </p>
        <button
          onClick={() => navigate("/finanzas/egresos")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={15} />
          <span>Volver a Egresos</span>
        </button>
      </div>
    )
  }

  const catLabel = data.categoria_nombre || data.categoria || "Varios"
  const catConfig =
    CAT_CONFIG[catLabel] || CAT_CONFIG.Varios
  const CatIconComponent = catConfig.icon

  // Formato estricto de sólo fecha (sin hora)
  const fechaPagoFormateada = data.fecha_pago
    ? new Date(data.fecha_pago + "T00:00:00").toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—"

  const comprobanteUrl = data.comprobante_url ? getStorageUrl(data.comprobante_url) : null

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16 flex flex-col">
      {/* Header Sticky Contextual */}
      <header className="shrink-0 px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={() => navigate("/finanzas/egresos")}
              title="Volver a Egresos"
              className="size-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs transition-all active:scale-[0.98] shrink-0 cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={18} className="text-slate-500" />
            </button>

            <div className="size-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={BanknoteArrowDownIcon} size={22} />
            </div>

            <div className="min-w-0">
              
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate mt-0.5">
                Comprobante de Egreso
              </h1>
            </div>
          </div>

          {/* Action Cluster Header */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
            {/* Categoría Badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs",
                catConfig.bg,
                catConfig.color,
                catConfig.border,
              )}
            >
              <HugeiconsIcon icon={CatIconComponent} size={14} />
              <span>{catConfig.label}</span>
            </span>

            {/* Imprimir */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <FileText size={14} className="text-slate-500" />
              <span>Imprimir</span>
            </button>

            {/* Editar */}
            <button
              type="button"
              onClick={() => navigate(`/finanzas/egresos/${data.id}/editar`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <HugeiconsIcon icon={Edit01Icon} size={14} className="text-slate-500" />
              <span>Editar</span>
            </button>

            {/* Eliminar Egreso */}
            <button
              type="button"
              onClick={() => setDeleteEgresoModal(true)}
              className="inline-flex items-center justify-center size-9 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
              title="Eliminar este egreso"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Hero Card: Monto & Resumen Principal */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-5">
            <div className="size-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
              <HugeiconsIcon icon={BanknoteArrowDownIcon} size={32} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Monto Egresado
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Desembolso Oficial
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-rose-600 tracking-tight mt-1">
                -${Number(data.monto || 0).toLocaleString("es-EC", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs font-semibold text-slate-600 mt-1 capitalize">
                Método: {data.metodo_pago || "No especificado"}
                {data.proveedor_beneficiario && (
                  <span className="normal-case text-slate-500 font-medium ml-2">
                    · Beneficiario:{" "}
                    <strong className="text-slate-800 font-bold">
                      {data.proveedor_beneficiario}
                    </strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Classification & Accounting meta */}
          <div className="flex flex-col md:items-end justify-center pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 text-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Contabilización
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="text-emerald-600" />
              <span>Egreso Registrado</span>
            </div>
            {data.registrado_por && (
              <p className="text-[11px] text-slate-400">
                Registrado por:{" "}
                <span className="text-slate-700 font-semibold">{data.registrado_por}</span>
              </p>
            )}
          </div>
        </section>

        {/* 2-Column Grid: Details & Comprobante */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Detalle y Descripción (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card: Detalle del Desembolso */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <HugeiconsIcon icon={InvoiceIcon} size={15} className="text-rose-500" />
                  <span>Información del Desembolso</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {data.id?.substring(0, 13)}...
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                {/* Beneficiario / Proveedor */}
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HugeiconsIcon icon={UserIcon} size={13} className="text-slate-400" />
                    <span>Proveedor / Beneficiario</span>
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {data.proveedor_beneficiario || "—"}
                  </p>
                </div>

                {/* Fecha del Pago (sin hora) */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HugeiconsIcon icon={Calendar03Icon} size={13} className="text-slate-400" />
                    <span>Fecha de Pago</span>
                  </p>
                  <p className="font-semibold text-slate-800 capitalize">
                    {fechaPagoFormateada}
                  </p>
                </div>

                {/* Método de Pago */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HugeiconsIcon icon={Payment02Icon} size={13} className="text-slate-400" />
                    <span>Método de Pago</span>
                  </p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold capitalize bg-slate-100 text-slate-800">
                    {data.metodo_pago || "No registrado"}
                  </span>
                </div>

                {/* Categoría */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Categoría
                  </p>
                  <p className="font-bold text-slate-800">{catLabel}</p>
                </div>

                {/* Subcategoría */}
                {data.subcategoria && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <HugeiconsIcon icon={PackageIcon} size={13} className="text-slate-400" />
                      <span>Subcategoría</span>
                    </p>
                    <p className="font-semibold text-slate-800">{data.subcategoria}</p>
                  </div>
                )}

                {/* Registrado por */}
                <div className="space-y-1 pt-2 border-t border-slate-100 sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Usuario que registró el movimiento
                  </p>
                  <p className="font-semibold text-slate-700">
                    {data.registrado_por || "Sistema / Automático"}
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <div className="pt-3 border-t border-slate-100 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Descripción o Concepto del Gasto
                </p>
                <p className="text-xs sm:text-sm text-slate-800 bg-slate-50/70 p-4 rounded-xl border border-slate-100 leading-relaxed font-medium">
                  {data.descripcion || "Sin descripción proporcionada."}
                </p>
              </div>

              {/* Notas Adicionales */}
              {data.notas && (
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Notas y Observaciones Internas
                  </p>
                  <p className="text-xs text-slate-600 bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/60 leading-relaxed">
                    {data.notas}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Comprobante Digital (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <HugeiconsIcon icon={Image01Icon} size={15} className="text-rose-500" />
                  <span>Comprobante Digital</span>
                </h3>
                {comprobanteUrl && !comprobanteEliminado && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Archivo Disponible
                  </span>
                )}
              </div>

              {comprobanteUrl && !comprobanteEliminado ? (
                <div className="space-y-3">
                  <div
                    onClick={() => setZoomImg(comprobanteUrl)}
                    className="relative group rounded-xl border border-slate-200/90 overflow-hidden bg-slate-50/60 cursor-pointer flex items-center justify-center min-h-[260px] max-h-[380px] transition-all hover:border-rose-300"
                  >
                    <img
                      src={comprobanteUrl}
                      alt="Comprobante de egreso"
                      className="w-full h-full object-contain max-h-[360px] transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md">
                        <Eye size={14} />
                        <span>Ampliar Imagen</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoomImg(comprobanteUrl)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <HugeiconsIcon icon={Image01Icon} size={14} />
                      <span>Ver Completo</span>
                    </button>

                    <a
                      href={comprobanteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center size-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all active:scale-[0.98]"
                      title="Abrir en pestaña nueva"
                    >
                      <ExternalLink size={15} />
                    </a>

                    <button
                      type="button"
                      onClick={() => setDeleteReceiptModal(true)}
                      className="inline-flex items-center justify-center size-9 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                      title="Eliminar archivo del almacenamiento"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={15} />
                    </button>
                  </div>
                </div>
              ) : comprobanteEliminado ? (
                <div className="p-8 rounded-xl border border-rose-200 bg-rose-50/50 text-center space-y-2">
                  <div className="size-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertCircle size={20} />
                  </div>
                  <p className="text-xs font-bold text-rose-900">
                    Comprobante eliminado del almacenamiento
                  </p>
                  <p className="text-[11px] text-rose-700 max-w-xs mx-auto">
                    La imagen fue eliminada pero el registro contable histórico del egreso se mantiene intacto.
                  </p>
                </div>
              ) : (
                <div className="p-10 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2">
                  <div className="size-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <HugeiconsIcon icon={Image01Icon} size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Sin Comprobante Adjunto</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    No se adjuntó un recibo o factura escaneada al momento de registrar este egreso.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Confirmation Modal: Delete Receipt */}
      <ConfirmationModal
        isOpen={deleteReceiptModal}
        title="Eliminar Comprobante Digital"
        message="¿Estás seguro de que deseas eliminar la imagen del comprobante de los servidores de almacenamiento? El registro histórico del egreso se conservará intacto en finanzas."
        confirmText="Eliminar Archivo"
        cancelText="Conservar"
        isDangerous={true}
        isLoading={deletingReceipt}
        icon="trash"
        onConfirm={handleDeleteComprobante}
        onCancel={() => setDeleteReceiptModal(false)}
      />

      {/* Confirmation Modal: Delete Entire Egreso */}
      <ConfirmationModal
        isOpen={deleteEgresoModal}
        title="Eliminar Registro de Egreso"
        message={`¿Estás seguro de que deseas eliminar permanentemente este egreso por $${Number(data.monto || 0).toFixed(2)} a favor de "${data.proveedor_beneficiario || "beneficiario"}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Egreso"
        cancelText="Conservar"
        isDangerous={true}
        isLoading={deletingEgreso}
        icon="trash"
        onConfirm={handleDeleteEgreso}
        onCancel={() => setDeleteEgresoModal(false)}
      />

      {/* Lightbox Zoom */}
      {zoomImg && <ImageZoom url={zoomImg} onClose={() => setZoomImg(null)} />}
    </div>
  )
}
