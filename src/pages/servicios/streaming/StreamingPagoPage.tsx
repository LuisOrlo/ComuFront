/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  Money01Icon,
  Upload01Icon,
  Tick02Icon,
  CheckmarkCircle04Icon,
  InformationCircleIcon,
  Calendar01Icon,
  Invoice01Icon,
  Delete02Icon,
  ViewIcon,
  CameraVideoIcon,
} from "@hugeicons/core-free-icons"
import { Loader2 } from "lucide-react"
import { cn, getStorageUrl } from "@/lib/utils"
import {
  streamingService,
  type ServicioStreaming,
} from "@/services/streaming.service"
import { financeService } from "@/services/finance.service"
import { validarComprobante } from "@/lib/file-validators"
import { toast } from "sonner"

function getInitials(name?: string) {
  if (!name) return "CL"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatFechaLarga(fechaStr?: string | null) {
  if (!fechaStr) return "—"
  try {
    const d = new Date(fechaStr.includes("T") ? fechaStr : `${fechaStr}T00:00:00`)
    if (isNaN(d.getTime())) return fechaStr
    return d.toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return fechaStr
  }
}

export function StreamingPagoPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [streaming, setStreaming] = useState<ServicioStreaming | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form states
  const [monto, setMonto] = useState("")
  const [metodoPago, setMetodoPago] = useState<string>("transferencia")
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0])

  // Comprobante
  const fileRef = useRef<HTMLInputElement>(null)
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await streamingService.getById(id)
      setStreaming(data)
      const cuenta = data.cuenta_por_cobrar
      const saldo = cuenta
        ? Number(cuenta.saldo_pendiente)
        : data.pago_registrado
          ? 0
          : Number(data.precio_total)
      if (saldo > 0) {
        setMonto(saldo.toFixed(2))
      }
    } catch {
      toast.error("Error al cargar la información del servicio de streaming")
      navigate("/servicios/streaming")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalImage(null)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center space-y-3 min-h-[400px]">
        <Loader2 size={28} className="animate-spin text-[#fd761a]" />
        <p className="text-xs font-medium text-slate-500">Cargando datos de cobro de streaming...</p>
      </div>
    )
  }

  if (!streaming) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-center space-y-4">
        <div className="size-12 rounded-xl bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center mx-auto">
          <HugeiconsIcon icon={InformationCircleIcon} size={24} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Servicio no encontrado</h2>
          <p className="text-xs text-slate-500 mt-1">El registro solicitado no existe o fue eliminado.</p>
        </div>
        <button
          onClick={() => navigate("/servicios/streaming")}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          Volver a Streaming
        </button>
      </div>
    )
  }

  const cuenta = streaming.cuenta_por_cobrar
  const montoTotalCuenta = Number(streaming.precio_total || 0)
  const saldoActual = cuenta
    ? Number(cuenta.saldo_pendiente)
    : streaming.pago_registrado
      ? 0
      : montoTotalCuenta
  const abonadoPrevio = cuenta
    ? Number(cuenta.monto_abonado)
    : streaming.pago_registrado
      ? montoTotalCuenta
      : 0

  const clienteNombre = streaming.cliente_externo
    ? `${streaming.cliente_externo.nombres} ${streaming.cliente_externo.apellidos || ""}`.trim()
    : streaming.persona
      ? `${streaming.persona.nombres} ${streaming.persona.apellidos}`.trim()
      : "Cliente sin asignar"

  const montoNum = parseFloat(monto || "0")
  const montoValido = !isNaN(montoNum) && montoNum > 0 && montoNum <= saldoActual + 0.001
  const comprobanteValido = !!comprobanteFile
  const formularioValido = montoValido && comprobanteValido && !!fechaPago && !!metodoPago
  const saldoRestante = Math.max(0, Math.round((saldoActual - montoNum) * 100) / 100)
  const pctPagado =
    montoTotalCuenta > 0
      ? Math.min(100, Math.round(((abonadoPrevio + (montoValido ? montoNum : 0)) / montoTotalCuenta) * 100))
      : 0

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen (JPG, PNG, WEBP)")
      if (fileRef.current) fileRef.current.value = ""
      return
    }
    const err = validarComprobante(file)
    if (err) {
      toast.error(err)
      if (fileRef.current) fileRef.current.value = ""
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setComprobanteFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleFileSelect = () => {
    const file = fileRef.current?.files?.[0]
    if (file) handleFileProcess(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0])
    }
  }

  const handlePagar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!montoNum || montoNum <= 0) {
      toast.error("Ingresa un monto válido mayor a $0")
      return
    }
    if (montoNum > saldoActual + 0.01) {
      toast.error(`El monto supera el saldo pendiente ($${saldoActual.toFixed(2)})`)
      return
    }
    if (!comprobanteFile) {
      toast.error("Debes adjuntar la foto o captura del comprobante de pago")
      return
    }
    if (!fechaPago) {
      toast.error("Selecciona la fecha de pago")
      return
    }
    if (!metodoPago) {
      toast.error("Selecciona el método de pago")
      return
    }

    setSaving(true)
    try {
      // Subir archivo al endpoint de finanzas
      const fd = new FormData()
      fd.append("archivo", comprobanteFile)
      const uploadRes = await financeService.uploadComprobantePago(fd)
      const comprobanteUrl = uploadRes.data?.url || uploadRes.url || ""

      // Registrar pago del servicio de streaming
      await streamingService.registrarPago(streaming.id, {
        monto: montoNum,
        metodo_pago: metodoPago,
        fecha_pago: fechaPago,
        comprobante_url: comprobanteUrl || undefined,
      })

      toast.success("Pago registrado exitosamente")
      navigate(`/servicios/streaming/${streaming.id}`)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.mensaje ||
        "Error al registrar el pago"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const transacciones = cuenta?.transacciones || []

  return (
    <div className="w-full min-h-screen bg-slate-50/50 pb-16">
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
        {/* Top Breadcrumb / Return Action */}
        <div className="flex items-center justify-between">
          <Link
            to={`/servicios/streaming/${streaming.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#fd761a] transition-colors py-1 group cursor-pointer"
          >
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              size={16}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            <span>Volver a Detalle de Streaming</span>
          </Link>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
            ID Cobertura: #{streaming.id.substring(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Client / Context Header & 4-Column Financial Summary Strip */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Person & Context Banner */}
          <div className="p-5 sm:p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <div className="size-11 sm:size-12 rounded-xl bg-orange-50 text-[#fd761a] border border-orange-200/80 flex items-center justify-center font-bold text-sm sm:text-base shrink-0 shadow-xs">
                {getInitials(clienteNombre)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                    {clienteNombre}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                      saldoActual <= 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : abonadoPrevio > 0
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        saldoActual <= 0
                          ? "bg-emerald-500"
                          : abonadoPrevio > 0
                            ? "bg-amber-500"
                            : "bg-red-500"
                      )}
                    />
                    {saldoActual <= 0
                      ? "Pagado Total"
                      : abonadoPrevio > 0
                        ? "Abono Parcial"
                        : "Pendiente"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 truncate">
                  <HugeiconsIcon
                    icon={CameraVideoIcon}
                    size={14}
                    className="text-slate-400 shrink-0"
                  />
                  <span className="font-semibold text-slate-700">Evento:</span>
                  <span className="truncate">
                    {streaming.titulo || "Cobertura de Streaming en Locación"}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">{streaming.lugar}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/60">
                Fecha Evento: {formatFechaLarga(streaming.fecha_evento)} ({streaming.hora_inicio?.slice(0, 5)} - {streaming.hora_fin?.slice(0, 5)})
              </span>
            </div>
          </div>

          {/* Compact 4-Column Financial Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50">
            {/* 1. Total */}
            <div className="p-4 sm:px-6 sm:py-3.5 flex flex-col justify-center bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Cobertura
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 tracking-tight tabular-nums">
                $ {montoTotalCuenta.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {/* 2. Pagado */}
            <div className="p-4 sm:px-6 sm:py-3.5 flex flex-col justify-center bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Abonado
              </span>
              <span className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5 tracking-tight tabular-nums">
                $ {abonadoPrevio.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {/* 3. Saldo */}
            <div className="p-4 sm:px-6 sm:py-3.5 flex flex-col justify-center bg-white">
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  saldoActual > 0 ? "text-red-500" : "text-emerald-600"
                )}
              >
                Saldo Pendiente
              </span>
              <span
                className={cn(
                  "text-base sm:text-lg font-bold mt-0.5 tracking-tight tabular-nums",
                  saldoActual > 0 ? "text-red-600" : "text-emerald-600"
                )}
              >
                $ {saldoActual.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {/* 4. Estado */}
            <div className="p-4 sm:px-6 sm:py-3.5 flex flex-col justify-center bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Estado Cuenta
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    saldoActual <= 0
                      ? "bg-emerald-500"
                      : abonadoPrevio > 0
                        ? "bg-amber-500"
                        : "bg-[#fd761a]"
                  )}
                />
                <span className="text-xs font-bold text-slate-800">
                  {saldoActual <= 0
                    ? "Pagado completo"
                    : abonadoPrevio > 0
                      ? "Abono parcial"
                      : "Pendiente de cobro"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic State: Paid vs Form */}
        {saldoActual <= 0 ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-7 sm:p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
              <div className="size-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={28} />
              </div>
              <h2 className="text-lg font-bold text-emerald-950 tracking-tight">
                Cobertura Pagada en su Totalidad
              </h2>
              <p className="text-xs text-emerald-800/80 max-w-md leading-relaxed">
                Este servicio de streaming no presenta saldos pendientes por liquidar. La recaudación ha sido conciliada satisfactoriamente en el sistema.
              </p>
              <div className="pt-2">
                <Link
                  to={`/servicios/streaming/${streaming.id}`}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95 inline-block"
                >
                  Volver al Detalle del Servicio
                </Link>
              </div>
            </div>

            {/* Historial de transacciones */}
            {transacciones.length > 0 && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Historial de Pagos Registrados ({transacciones.length})
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                    Total: ${abonadoPrevio.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {transacciones.map((t, idx) => (
                    <div
                      key={t.id || idx}
                      className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={Money01Icon} size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 tracking-tight">
                              ${Number(t.monto || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                              Registrado
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {formatFechaLarga(t.fecha_pago)} · <span className="capitalize">{t.metodo_pago}</span>
                          </p>
                        </div>
                      </div>
                      {t.comprobante_url && (
                        <button
                          type="button"
                          onClick={() => setModalImage(getStorageUrl(t.comprobante_url))}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs shrink-0 cursor-pointer"
                        >
                          <HugeiconsIcon icon={ViewIcon} size={13} />
                          <span>Ver comprobante</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Two-Column Layout (Form / Summary) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Payment Form (8 cols on lg) */}
            <section className="lg:col-span-8 flex flex-col gap-6">
              <form
                id="paymentForm"
                onSubmit={handlePagar}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 flex flex-col gap-6"
              >
                {/* Form Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      Registrar pago de streaming
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ingresa el monto a cobrar y sube la imagen del comprobante de respaldo bancario.
                    </p>
                  </div>
                  <div className="size-10 rounded-xl bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Money01Icon} size={20} />
                  </div>
                </div>

                {/* Monto a Pagar Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="montoInput"
                      className="text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Monto a pagar <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-slate-500">
                      Máximo permitido:{" "}
                      <span className="font-bold text-slate-900 tabular-nums">
                        ${saldoActual.toFixed(2)}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    <div className="sm:col-span-7 relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-base">
                        $
                      </div>
                      <input
                        id="montoInput"
                        type="number"
                        min="0.01"
                        max={saldoActual}
                        step="0.01"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        onBlur={() => {
                          const v = parseFloat(monto)
                          if (!isNaN(v)) {
                            if (v <= 0) setMonto("")
                            else if (v > saldoActual) setMonto(saldoActual.toFixed(2))
                            else setMonto(v.toFixed(2))
                          }
                        }}
                        placeholder={`0.00 (máx $${saldoActual.toFixed(2)})`}
                        className={cn(
                          "w-full h-11 pl-8 pr-3.5 bg-slate-50/80 rounded-xl text-slate-900 text-lg font-bold font-mono tracking-tight outline-none border transition-all tabular-nums",
                          monto && !montoValido
                            ? "border-red-400 focus:ring-2 focus:ring-red-400/20 bg-red-50/20"
                            : "border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                        )}
                        required
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="sm:col-span-5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMonto(saldoActual.toFixed(2))}
                        className="flex-1 h-11 px-3 rounded-xl bg-orange-50 hover:bg-[#fd761a] hover:text-white text-[#fd761a] border border-orange-200/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <HugeiconsIcon icon={CheckmarkCircle04Icon} size={15} />
                        <span>Total (${saldoActual.toFixed(2)})</span>
                      </button>

                      {saldoActual >= 10 && (
                        <button
                          type="button"
                          onClick={() => setMonto((saldoActual / 2).toFixed(2))}
                          className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                          title="Pagar 50% del saldo"
                        >
                          50%
                        </button>
                      )}
                    </div>
                  </div>

                  {monto && !montoValido ? (
                    <p className="text-[11px] text-red-500 font-medium">
                      {montoNum <= 0
                        ? "El monto debe ser mayor a $0.00"
                        : montoNum > saldoActual
                          ? `El monto supera el saldo pendiente de $${saldoActual.toFixed(2)}`
                          : "Ingresa un monto numérico válido"}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      El importe se aplicará directamente como abono o liquidación total del servicio.
                    </p>
                  )}
                </div>

                {/* Date & Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Fecha de Pago */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="fechaPago"
                      className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between"
                    >
                      <span>
                        Fecha de pago <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        id="fechaPago"
                        type="date"
                        value={fechaPago}
                        onChange={(e) => setFechaPago(e.target.value)}
                        className="w-full h-11 px-3.5 pl-10 bg-slate-50/80 rounded-xl text-slate-900 text-xs font-semibold outline-none border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all cursor-pointer"
                        required
                      />
                      <HugeiconsIcon
                        icon={Calendar01Icon}
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Día en que se acreditó la transacción
                    </span>
                  </div>

                  {/* Método de Pago (Sin 'otro medio') */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="metodoPago"
                      className="text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Método de pago <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="metodoPago"
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value)}
                        className="w-full h-11 px-3.5 bg-slate-50/80 rounded-xl text-slate-900 text-xs font-semibold outline-none border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all cursor-pointer"
                        required
                      >
                        <option value="transferencia">Transferencia Bancaria Directa</option>
                        <option value="efectivo">Efectivo en Recepción</option>
                        <option value="tarjeta">Tarjeta Débito / Crédito</option>
                      </select>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Canal utilizado para la liquidación
                    </span>
                  </div>
                </div>

                {/* Subir Comprobante (Requerido) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span>Comprobante de pago</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold border border-red-100">
                        Requerido
                      </span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Formatos: JPG, PNG o WEBP (máx 5MB)
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={fileRef}
                    onChange={handleFileSelect}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                  />

                  {previewUrl && comprobanteFile ? (
                    /* Vista previa del archivo */
                    <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-4">
                      {/* Thumbnail preview */}
                      <div
                        onClick={() => setModalImage(previewUrl)}
                        className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-lg overflow-hidden bg-slate-200 shrink-0 shadow-xs group cursor-pointer border border-slate-200"
                        title="Haga clic para ver en tamaño completo"
                      >
                        <img
                          src={previewUrl}
                          alt="Comprobante cargado"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <HugeiconsIcon icon={ViewIcon} size={20} />
                        </div>
                      </div>

                      {/* Metadata & Actions */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
                        <div>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p
                              className="text-xs font-bold text-slate-900 truncate max-w-[280px]"
                              title={comprobanteFile.name}
                            >
                              {comprobanteFile.name}
                            </p>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <HugeiconsIcon icon={Tick02Icon} size={12} />
                              <span>Listo</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                            {formatFileSize(comprobanteFile.size)} · Evidencia adjunta
                          </p>
                          <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                            <HugeiconsIcon icon={CheckmarkCircle04Icon} size={13} />
                            <span>Evidencia lista para validación y conciliación</span>
                          </p>
                        </div>

                        {/* Secondary Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="h-8 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <HugeiconsIcon icon={Upload01Icon} size={14} />
                            <span>Cambiar imagen</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setComprobanteFile(null)
                              if (previewUrl) URL.revokeObjectURL(previewUrl)
                              setPreviewUrl(null)
                              if (fileRef.current) fileRef.current.value = ""
                            }}
                            className="h-8 px-3 rounded-lg bg-red-50 text-red-600 font-semibold text-xs hover:bg-red-100 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={14} />
                            <span>Quitar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Dropzone sin archivo */
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-6 sm:p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                        dragActive
                          ? "border-[#fd761a] bg-orange-50/40"
                          : "border-slate-200 hover:border-[#fd761a]/60 hover:bg-orange-50/10 bg-slate-50/50"
                      )}
                    >
                      <div className="size-11 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center shadow-2xs mb-2.5">
                        <HugeiconsIcon icon={Upload01Icon} size={20} className="text-[#fd761a]" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Haga clic para subir la imagen del comprobante o arrástrala aquí
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Formatos válidos: JPG, PNG o WEBP (comprobante de depósito o transferencia)
                      </span>
                    </div>
                  )}

                  {!comprobanteValido && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <HugeiconsIcon icon={InformationCircleIcon} size={13} className="text-slate-400" />
                      <span>El comprobante de pago es indispensable para validar el cobro de la cobertura.</span>
                    </p>
                  )}
                </div>
              </form>

              {/* Historial previo de pagos de la cuenta si existen */}
              {transacciones.length > 0 && (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Historial de Pagos Registrados ({transacciones.length})
                    </h3>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                      Abonado: ${abonadoPrevio.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {transacciones.map((t, idx) => (
                      <div
                        key={t.id || idx}
                        className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={Money01Icon} size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-900 tracking-tight">
                                ${Number(t.monto || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                                Registrado
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {formatFechaLarga(t.fecha_pago)} · <span className="capitalize">{t.metodo_pago}</span>
                            </p>
                          </div>
                        </div>
                        {t.comprobante_url && (
                          <button
                            type="button"
                            onClick={() => setModalImage(getStorageUrl(t.comprobante_url))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs shrink-0 cursor-pointer"
                          >
                            <HugeiconsIcon icon={ViewIcon} size={13} />
                            <span>Ver comprobante</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* RIGHT: Sticky Summary (4 cols on lg) */}
            <aside className="lg:col-span-4 sticky top-6 flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Resumen de liquidación
                  </h3>
                  <div className="size-8 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center">
                    <HugeiconsIcon icon={Invoice01Icon} size={16} />
                  </div>
                </div>

                {/* Financial Breakdown Items */}
                <div className="flex flex-col gap-2.5 mb-4 text-xs">
                  <div className="flex items-center justify-between py-1 text-slate-500">
                    <span>Precio total</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      $ {montoTotalCuenta.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 text-slate-500">
                    <span>Abonado previamente</span>
                    <span className="font-semibold text-emerald-600 tabular-nums">
                      $ {abonadoPrevio.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-b border-slate-100">
                    <span className="text-slate-700 font-bold">Monto a registrar</span>
                    <span className="text-xl font-black text-[#fd761a] tabular-nums">
                      $ {montoNum > 0 ? montoNum.toFixed(2) : "0.00"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 text-slate-500">
                    <span>Saldo restante proyectado</span>
                    <span
                      className={cn(
                        "font-bold tabular-nums",
                        saldoRestante > 0 ? "text-red-600" : "text-emerald-600"
                      )}
                    >
                      $ {saldoRestante.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Coverage Progress Bar */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 mb-5 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Cobertura liquidada</span>
                    <span className="font-bold text-[#fd761a] tabular-nums">
                      {pctPagado}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        pctPagado >= 100 ? "bg-emerald-500" : "bg-[#fd761a]"
                      )}
                      style={{ width: `${pctPagado}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2.5">
                  <button
                    type="submit"
                    form="paymentForm"
                    disabled={saving || !formularioValido}
                    className="w-full h-11 bg-[#fd761a] hover:bg-[#e06512] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    title={
                      !formularioValido
                        ? "Completa todos los campos obligatorios y sube el comprobante"
                        : "Registrar pago"
                    }
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Guardando pago...</span>
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} />
                        <span>Confirmar y registrar pago</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/servicios/streaming/${streaming.id}`)}
                    className="w-full h-10 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer"
                  >
                    Cancelar operación
                  </button>
                </div>

                {/* Administrative Note */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-2 text-slate-400">
                  <HugeiconsIcon icon={InformationCircleIcon} size={15} className="shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    El pago se aplicará de forma automática en la cuenta por cobrar y el libro financiero institucional.
                  </p>
                </div>
              </div>

              
            </aside>
          </div>
        )}
      </div>

      {/* Lightbox Modal de Comprobante */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setModalImage(null)}
        >
          <div
            className="relative flex flex-col items-center max-w-4xl max-h-[90vh] bg-white/10 p-2 rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center pb-2 px-1 text-white">
              <span className="text-xs font-semibold">Comprobante de Pago</span>
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cerrar [ESC]
              </button>
            </div>
            <img
              src={modalImage}
              alt="Comprobante en tamaño completo"
              className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded-xl shadow-2xl bg-black"
            />
          </div>
        </div>
      )}
    </div>
  )
}
