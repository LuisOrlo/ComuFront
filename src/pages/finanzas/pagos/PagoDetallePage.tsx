/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  ArrowLeft,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Receipt,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  Info,
  Camera,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  Paperclip,
  CheckCircle,
} from "lucide-react"
import { cn, getStorageUrl } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"
import { useParams, useNavigate } from "react-router-dom"

function getIniciales(nombre?: string | null) {
  if (!nombre || nombre === "—") return "—"
  const clean = nombre.trim()
  const parts = clean.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return clean.slice(0, 2).toUpperCase()
}

function formatFecha(fecha?: string | null) {
  if (!fecha) return "—"
  try {
    const d = new Date(fecha)
    return d.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return fecha
  }
}

export function PagoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  // Lightbox modal zoom and rotation states
  const [zoomScale, setZoomScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const res = await financeService.getTransaccionDetalle(id)
        setData(res.datos || res.data || res)
      } catch {
        toast.error("Error al cargar detalle de transacción")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleCopyId = () => {
    if (!id) return
    navigator.clipboard.writeText(id)
    setCopiedId(true)
    toast.success("ID de transacción copiado al portapapeles")
    setTimeout(() => setCopiedId(false), 2000)
  }

  const openLightbox = (url: string) => {
    setZoomScale(1)
    setRotation(0)
    setModalImage(url)
  }

  const closeLightbox = () => {
    setModalImage(null)
    setZoomScale(1)
    setRotation(0)
  }

  const zoomIn = () => setZoomScale((prev) => Math.min(prev + 0.25, 3))
  const zoomOut = () => setZoomScale((prev) => Math.max(prev - 0.25, 0.5))
  const resetZoom = () => {
    setZoomScale(1)
    setRotation(0)
  }
  const rotateRight = () => setRotation((prev) => (prev + 90) % 360)

  const getNombreEstudiante = () => {
    if (data?.estudiante_nombre) return data.estudiante_nombre

    const lp = data?.linea_pago_modulo
    if (lp) {
      const m = lp.matricula
      const e = m?.estudiante ?? m?.solicitud_inscripcion?.estudiante ?? m?.solicitud_inscripcion?.participante_externo
      if (e?.nombres) return `${e.nombres || ""} ${e.apellidos || ""}`.trim()
    }

    const cp = data?.cuenta_por_cobrar
    if (!cp) return "—"
    const m = cp.matricula
    const s = cp.solicitud_inscripcion
    const it = cp.inscripcion_taller
    if (m?.estudiante) return `${m.estudiante.nombres || ""} ${m.estudiante.apellidos || ""}`.trim()
    if (s?.estudiante) return `${s.estudiante.nombres || ""} ${s.estudiante.apellidos || ""}`.trim()
    if (s?.participante_externo) return `${s.participante_externo.nombres || ""} ${s.participante_externo.apellidos || ""}`.trim()
    if (it?.nombres) return `${it.nombres || ""} ${it.apellidos || ""}`.trim()
    const rp = cp.reserva_podcast
    if (rp?.persona) return `${rp.persona.nombres || ""} ${rp.persona.apellidos || ""}`.trim()
    if (rp?.cliente_externo) return `${rp.cliente_externo.nombres || ""} ${rp.cliente_externo.apellidos || ""}`.trim()
    const ra = cp.reserva_aula
    if (ra?.persona) return `${ra.persona.nombres || ""} ${ra.persona.apellidos || ""}`.trim()
    if (ra?.cliente_externo) return `${ra.cliente_externo.nombres || ""} ${ra.cliente_externo.apellidos || ""}`.trim()
    const ae = cp.alquiler_equipo
    if (ae?.persona) return `${ae.persona.nombres || ""} ${ae.persona.apellidos || ""}`.trim()
    if (ae?.cliente_externo) return `${ae.cliente_externo.nombres || ""} ${ae.cliente_externo.apellidos || ""}`.trim()
    const rr = cp.reserva_radio
    if (rr?.persona) return `${rr.persona.nombres || ""} ${rr.persona.apellidos || ""}`.trim()
    if (rr?.cliente_externo) return `${rr.cliente_externo.nombres || ""} ${rr.cliente_externo.apellidos || ""}`.trim()
    return "—"
  }

  const getTipoLabel = (): string => {
    const cp = data?.cuenta_por_cobrar
    const lp = data?.linea_pago_modulo

    if (lp || cp?.matricula || cp?.solicitud_inscripcion) return "Curso"
    if (cp?.inscripcion_taller) return "Taller"
    if (cp?.reserva_aula_id) return "Aula"
    if (cp?.reserva_podcast_id) return "Podcast"
    if (cp?.alquiler_equipo_id) return "Equipo"
    if (cp?.reserva_radio_id) return "Radio"
    if (cp?.edicion_video_id) return "Video"
    return "Concepto"
  }

  const getCursoNombre = () => {
    if (data?.curso_nombre) return data.curso_nombre
    if (data?.taller_nombre) return data.taller_nombre

    const lp = data?.linea_pago_modulo
    if (lp) return nombreDesdeLineaPago(lp)

    const cp = data?.cuenta_por_cobrar
    if (!cp) return "—"
    return nombreDesdeCuentaCobrar(cp)
  }

  function nombreDesdeLineaPago(lp: any): string {
    const ca = lp.matricula?.curso_abierto
    return ca?.nombre_instancia ?? ca?.catalogo?.nombre ?? "—"
  }

  function nombreServicio(cp: any): string {
    const servicio = [
      ["reserva_podcast_id", cp.reserva_podcast?.titulo ?? cp.reserva_podcast?.paquete?.nombre ?? "Podcast"],
      ["reserva_aula_id", cp.reserva_aula?.aula?.nombre ?? "Aula"],
      ["alquiler_equipo_id", cp.alquiler_equipo?.equipo?.nombre ?? "Equipo"],
      ["edicion_video_id", "Edición de Video"],
      ["reserva_radio_id", "Radio"],
    ] as const
    for (const [idField, label] of servicio) {
      if (cp[idField]) return label
    }
    return "—"
  }

  function nombreDesdeCuentaCobrar(cp: any): string {
    const academia = cp.matricula?.curso_abierto?.nombre_instancia
      ?? cp.matricula?.curso_abierto?.catalogo?.nombre
      ?? cp.solicitud_inscripcion?.curso_abierto?.nombre_instancia
      ?? cp.solicitud_inscripcion?.curso_abierto?.catalogo?.nombre
      ?? cp.inscripcion_taller?.taller?.nombre
    if (academia) return academia
    return nombreServicio(cp)
  }

  const handleDeleteComprobante = async () => {
    if (!id) return
    setDeleteModalOpen(false)
    setDeleting(true)
    try {
      await financeService.deleteComprobante(id, "ingreso")
      toast.success("Comprobante eliminado del almacenamiento")
      setData((prev: any) => (prev ? { ...prev, comprobante_url: null, comprobante_purgado: true } : prev))
    } catch {
      toast.error("Error al eliminar comprobante")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-[#fd761a] animate-spin" />
          <p className="text-sm font-medium text-slate-500">Cargando detalle de pago...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 max-w-md text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Transacción no encontrada</h2>
          <p className="text-sm text-slate-500 mb-4">No se localizó el comprobante o registro financiero solicitado.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Volver a pagos
          </button>
        </div>
      </div>
    )
  }

  const estado = data.estado_verificacion || "pendiente"
  const registradoPor = data?.registrado_por || "—"
  const verificadoPor = data?.verificado_por || "—"
  const estudianteNombre = getNombreEstudiante()
  const tipoLabel = getTipoLabel()
  const cursoNombre = getCursoNombre()
  const detalleConceptos = data.detalle_conceptos || data.modulos || []

  const estadoConfig = {
    aprobado: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      dot: "bg-emerald-600",
      icon: CheckCircle2,
      label: "Aprobado",
      iconBox: "bg-emerald-500/10 text-emerald-600",
    },
    rechazado: {
      bg: "bg-rose-50 text-rose-700 border-rose-200/80",
      dot: "bg-rose-600",
      icon: XCircle,
      label: "Rechazado",
      iconBox: "bg-rose-500/10 text-rose-600",
    },
    pendiente: {
      bg: "bg-amber-50 text-amber-700 border-amber-200/80",
      dot: "bg-amber-600",
      icon: Clock,
      label: "Pendiente",
      iconBox: "bg-amber-500/10 text-amber-600",
    },
  }[estado as "aprobado" | "rechazado" | "pendiente"] || {
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
    icon: Clock,
    label: estado,
    iconBox: "bg-slate-100 text-slate-600",
  }

  const StatusIcon = estadoConfig.icon

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Navigation Bar: Breadcrumbs & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-[#fd761a] transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver a pagos y cobros</span>
        </button>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {/* Audit ID copy badge */}
          <button
            onClick={handleCopyId}
            title="Copiar ID de transacción"
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer group"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono tracking-tight font-medium">
              {id?.slice(0, 8).toUpperCase()}...
            </span>
            {copiedId ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
            )}
          </button>

          {/* Print voucher proof */}
          <button
            onClick={() => window.print()}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm border border-slate-200/80 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Imprimir constancia</span>
          </button>
        </div>
      </div>

      {/* Page Title & Operational Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pagos y Cobros
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            Liquidación de cuota
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Detalle de comprobante y liquidación de cuota registrada en el sistema.
        </p>
      </div>

      {/* Payment Hero Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-start gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm", estadoConfig.iconBox)}>
            <StatusIcon className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                ${Number(data.monto || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                <span className="text-lg font-normal text-slate-500">USD</span>
              </span>
              <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase border", estadoConfig.bg)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", estadoConfig.dot)} />
                {estadoConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span className="font-semibold text-slate-700">
                Pago #{id?.slice(0, 8).toUpperCase()}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 capitalize font-medium text-slate-700">
                <CreditCard className="w-3.5 h-3.5 text-[#fd761a]" />
                {data.metodo_pago}
              </span>
              {data.tiene_multiples_modulos && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded bg-orange-50 text-[#fd761a] font-semibold text-[11px]">
                    Pago múltiple ({detalleConceptos.length || 2} conceptos)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Metadata Strip */}
        <div className="flex flex-wrap md:flex-col items-start md:items-end justify-between gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[11px] font-bold shrink-0">
              {getIniciales(registradoPor)}
            </div>
            <div className="flex flex-col text-left md:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Registrado por:
              </span>
              <span className="text-xs font-semibold text-slate-800 leading-none">
                {registradoPor}{" "}
                <span className="text-slate-400 font-normal">
                  • {formatFecha(data.fecha_pago || data.created_at)}
                </span>
              </span>
            </div>
          </div>

          {registradoPor !== verificadoPor && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[11px] font-bold shrink-0">
                {getIniciales(verificadoPor)}
              </div>
              <div className="flex flex-col text-left md:text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Verificado por:
                </span>
                <span className="text-xs font-semibold text-slate-800 leading-none">
                  {data.estado_verificacion === "pendiente" ? "Pendiente" : verificadoPor}{" "}
                  {data.fecha_verificacion && (
                    <span className="text-slate-400 font-normal">
                      • {formatFecha(data.fecha_verificacion)}
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Paperclip className="w-3.5 h-3.5 text-[#fd761a]" />
            <span>
              {data.comprobante_purgado
                ? "Comprobante purgado"
                : data.comprobante_url
                ? "Comprobante digital adjunto"
                : "Sin comprobante digital"}
            </span>
            <span
              className={cn(
                "inline-block w-1.5 h-1.5 rounded-full ml-0.5",
                data.comprobante_url && !data.comprobante_purgado
                  ? "bg-[#fd761a]"
                  : "bg-slate-300"
              )}
            />
          </div>
        </div>
      </motion.div>

      {/* Main Grid: Section 1 (Payment Details) & Section 2 (Voucher Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Payment Details Data Sheet (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#fd761a]" />
                <h2 className="text-base font-bold text-slate-900">
                  Información del pago
                </h2>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {data.estado_verificacion === "aprobado" ? "Cotejado" : "En auditoría"}
              </span>
            </div>

            {/* Key-Value Specifications */}
            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  Fecha de pago
                </span>
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formatFecha(data.fecha_pago || data.created_at)}</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  Método de pago
                </span>
                <div className="flex items-center gap-2 text-slate-900 font-medium capitalize">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>{data.metodo_pago}</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Estudiante / Titular
                </span>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-orange-100 text-[#fd761a] font-bold flex items-center justify-center text-xs shrink-0">
                    {getIniciales(estudianteNombre)}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-slate-900 truncate">
                      {estudianteNombre}
                    </span>
                    
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {tipoLabel}
                </span>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 text-sm truncate">
                      {cursoNombre}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-[#fd761a] tracking-wide uppercase shrink-0">
                      {tipoLabel}
                    </span>
                  </div>
                  {data.modulo_nombre && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Módulo: {data.modulo_nombre}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Multiple modules breakdown if applicable */}
              {data.tiene_multiples_modulos && detalleConceptos.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Desglose de conceptos cubiertos
                  </span>
                  <div className="space-y-1.5">
                    {detalleConceptos.map((concepto: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <span className="font-medium text-slate-700 truncate mr-2">
                          {concepto.nombre || concepto.modulo_nombre}
                        </span>
                        <span className="font-bold text-slate-900 shrink-0">
                          ${Number(concepto.monto || 0).toFixed(2)} USD
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observations if available */}
              {data.observaciones && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Observaciones
                  </span>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 font-normal leading-relaxed">
                    {data.observaciones}
                  </div>
                </div>
              )}

              {/* Rejection notice if rejected */}
              {data.motivo_rechazo && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold block uppercase tracking-wider mb-0.5">
                      Motivo de rechazo:
                    </span>
                    <span>{data.motivo_rechazo}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verification note card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3 text-slate-600">
            <Info className="w-5 h-5 text-[#fd761a] shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              La transacción fue procesada a través del módulo de finanzas y asociada al expediente contable del estudiante.
            </p>
          </div>
        </div>

        {/* Right Column: Section 2 - Comprobante de pago (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
            {/* Header and Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#fd761a]" />
                  <h2 className="text-base font-bold text-slate-900">
                    Comprobante de pago
                  </h2>
                </div>
                
              </div>

              {/* Header Action CTAs */}
              {data.comprobante_url && !data.comprobante_purgado && (
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <a
                    href={getStorageUrl(data.comprobante_url)}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#fd761a] hover:bg-[#e06512] text-white font-semibold text-xs transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar</span>
                  </a>
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    disabled={deleting}
                    title="Eliminar solo el archivo adjunto"
                    type="button"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-600 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Eliminar adjunto</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dedicated Receipt Preview Container */}
            {data.comprobante_purgado ? (
              <div className="w-full bg-rose-50/50 rounded-xl p-8 border border-rose-200/80 flex flex-col items-center justify-center text-center gap-3 min-h-[380px]">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-900 mb-1">
                    Comprobante eliminado del almacenamiento
                  </h3>
                  <p className="text-xs text-rose-700/80 max-w-sm">
                    El archivo digital fue depurado. El registro histórico y financiero se conserva íntegramente como constancia de auditoría.
                  </p>
                </div>
              </div>
            ) : data.comprobante_url ? (
              <div className="flex flex-col gap-3">
                <div
                  className="relative group w-full bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-center overflow-hidden min-h-[440px] border border-slate-100 cursor-pointer"
                  onClick={() => openLightbox(getStorageUrl(data.comprobante_url))}
                >
                  {/* Subtle decorative dot pattern */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                  {/* Receipt Photo Card */}
                  <div className="relative transition-transform duration-200 group-hover:scale-[1.01]">
                    <img
                      src={getStorageUrl(data.comprobante_url)}
                      alt="Comprobante de pago"
                      className="w-auto max-w-[280px] sm:max-w-[340px] max-h-[460px] object-contain rounded-lg shadow-md group-hover:shadow-xl transition-shadow bg-white"
                    />

                    {/* Hover Overlay with Zoom Button */}
                    <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 backdrop-blur-[1px] rounded-lg transition-opacity flex items-center justify-center">
                      <span className="px-4 py-2 rounded-full bg-white text-slate-900 font-semibold text-xs shadow-lg flex items-center gap-1.5">
                        <ZoomIn className="w-4 h-4 text-[#fd761a]" />
                        Ver comprobante en detalle
                      </span>
                    </div>
                  </div>

                  {/* Under-preview notification badge */}
                  <div className="mt-4 flex items-center gap-1.5 text-slate-500 text-xs bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Comprobante registrado. Haz clic sobre la imagen para inspeccionar en alta resolución.</span>
                  </div>
                </div>

               
              </div>
            ) : (
              <div className="w-full bg-slate-50 rounded-xl p-8 border border-slate-100 flex flex-col items-center justify-center text-center gap-3 min-h-[380px]">
                <div className="w-12 h-12 rounded-full bg-slate-200/60 text-slate-400 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">
                    Sin comprobante digital adjunto
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Esta transacción fue liquidada directamente o en efectivo, por lo cual no requiere comprobante adjunto.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Lightbox Modal for Full Receipt Inspection (from code.html) */}
      <AnimatePresence>
        {modalImage && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Visor de Comprobante en Alta Resolución
                    </h3>
                    
                  </div>
                </div>

                {/* Zoom and inspection controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                    <button
                      type="button"
                      onClick={zoomIn}
                      title="Acercar"
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-slate-700 transition-colors cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={zoomOut}
                      title="Alejar"
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-slate-700 transition-colors cursor-pointer"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={resetZoom}
                      title="Ajuste original (100%)"
                      className="px-2 h-7 flex items-center justify-center rounded hover:bg-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {Math.round(zoomScale * 100)}%
                    </button>
                    <button
                      type="button"
                      onClick={rotateRight}
                      title="Girar 90°"
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-slate-700 transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={closeLightbox}
                    aria-label="Cerrar modal"
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors ml-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Image Viewport with Pan/Zoom Canvas */}
              <div className="flex-1 bg-slate-100/70 overflow-auto p-4 sm:p-8 flex items-center justify-center relative select-none min-h-[350px]">
                <div
                  className="transition-transform duration-150 ease-out origin-center inline-block"
                  style={{
                    transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={modalImage}
                    alt="Comprobante en detalle"
                    className="max-h-[65vh] w-auto object-contain rounded shadow-lg bg-white"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 shrink-0">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Documento verificado y resguardado en el campus</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={closeLightbox}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cerrar vista previa
                  </button>
                  <a
                    href={modalImage}
                    download={`comprobante_${id?.slice(0, 8)}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-[#fd761a] hover:bg-[#e06512] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar archivo</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete voucher confirmation modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Eliminar comprobante"
        message="¿Deseas eliminar la imagen del comprobante del almacenamiento? El registro histórico y financiero se conservará intacto como constancia de auditoría."
        confirmText="Eliminar adjunto"
        cancelText="Cancelar"
        isLoading={deleting}
        icon="danger"
        onConfirm={handleDeleteComprobante}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  )
}
