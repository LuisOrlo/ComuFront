/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo } from "react"
import { useParams, useNavigate } from "react-router"
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
  CustomerService01Icon,
  BookOpen01Icon,
} from "@hugeicons/core-free-icons"
import { Loader2, AlertCircle } from "lucide-react"
import { cn, getStorageUrl } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { validarComprobante } from "@/lib/file-validators"

function getInitials(name?: string) {
  if (!name) return "PA"
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

export function TallerParticipantePage() {
  const { id: tallerId, pid: participanteId } = useParams<{ id: string; pid: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [savingPago, setSavingPago] = useState(false)
  const [data, setData] = useState<any>(null)

  // Campos del formulario de cobro
  const [montoPago, setMontoPago] = useState("")
  const [metodoPago, setMetodoPago] = useState("transferencia")
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0])
  const [observaciones, setObservaciones] = useState("")

  // Comprobante
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [modalImage, setModalImage] = useState<string | null>(null)

  const comprobanteRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)

  // Carga inicial
  useEffect(() => {
    const load = async () => {
      if (!tallerId || !participanteId) return
      try {
        const res = await financeService.getHistorialParticipanteTaller(tallerId, participanteId)
        const d = res.datos || res.data || res
        setData(d)

        const saldoInicial = Number(d?.saldo_pendiente ?? d?.saldo ?? 0)
        if (saldoInicial > 0) {
          setMontoPago(saldoInicial.toFixed(2))
        }
      } catch {
        toast.error("Error al cargar datos financieros del participante")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tallerId, participanteId])

  // Limpieza de URLs blob
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  // Tecla Escape para modal Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalImage(null)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const recargarDatos = async () => {
    if (!tallerId || !participanteId) return
    try {
      const res = await financeService.getHistorialParticipanteTaller(tallerId, participanteId)
      const d = res.datos || res.data || res
      setData(d)
      const nuevoSaldo = Number(d?.saldo_pendiente ?? d?.saldo ?? 0)
      setMontoPago(nuevoSaldo > 0 ? nuevoSaldo.toFixed(2) : "")
    } catch {
      /* silent */
    }
  }

  // Cálculos financieros
  const participante = data?.participante || data || {}
  const transacciones: any[] = data?.transacciones || data?.historial || []
  const tallerNombre = data?.taller_nombre || data?.taller?.nombre || "Taller"
  const nombreParticipante =
    participante.nombres && participante.apellidos
      ? `${participante.nombres} ${participante.apellidos}`.trim()
      : data?.nombre_participante || "Participante"

  const precioTaller = Number(data?.precio_taller || 0)
  const montoTotal = Number(data?.monto_total || precioTaller || 0)
  const totalAbonado = Number(data?.total_pagado || data?.monto_abonado || 0)
  const saldoPendiente = Number(data?.saldo_pendiente ?? data?.saldo ?? Math.max(0, montoTotal - totalAbonado))

  const montoNum = parseFloat(montoPago) || 0

  // Validaciones en tiempo real
  const montoError = useMemo(() => {
    if (!montoPago.trim()) return null
    if (isNaN(montoNum) || montoNum <= 0) {
      return "El monto a pagar debe ser mayor a $0.00"
    }
    if (montoNum > saldoPendiente + 0.001) {
      return `El valor ingresado ($${montoNum.toFixed(2)}) supera el saldo pendiente ($${saldoPendiente.toFixed(2)})`
    }
    return null
  }, [montoPago, montoNum, saldoPendiente])

  const comprobanteValido = !!comprobanteFile

  const formularioValido = useMemo(() => {
    return (
      saldoPendiente > 0 &&
      montoPago.trim() !== "" &&
      montoNum > 0 &&
      montoNum <= saldoPendiente + 0.001 &&
      !montoError &&
      comprobanteValido
    )
  }, [saldoPendiente, montoPago, montoNum, montoError, comprobanteValido])

  const disabledReason = useMemo(() => {
    if (saldoPendiente <= 0) return "El taller ya se encuentra pagado en su totalidad."
    if (!montoPago.trim()) return "Ingresa el monto a pagar."
    if (montoNum <= 0) return "El monto debe ser mayor a $0.00."
    if (montoNum > saldoPendiente + 0.001) {
      return `El monto ingresado ($${montoNum.toFixed(2)}) supera el saldo pendiente ($${saldoPendiente.toFixed(2)}).`
    }
    if (!comprobanteValido) return "Debes adjuntar una imagen del comprobante de pago antes de continuar."
    return null
  }, [saldoPendiente, montoPago, montoNum, comprobanteValido])

  const saldoRestanteProyectado = Math.max(
    0,
    saldoPendiente - (montoNum > 0 && montoNum <= saldoPendiente ? montoNum : 0)
  )

  const pctPagado = useMemo(() => {
    if (montoTotal <= 0) return 100
    const abonadoProyectado =
      totalAbonado + (montoNum > 0 && montoNum <= saldoPendiente ? montoNum : 0)
    return Math.min(100, Math.round((abonadoProyectado / montoTotal) * 100))
  }, [montoTotal, totalAbonado, montoNum, saldoPendiente])

  // Drag and drop comprobante
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen (JPG, PNG, WEBP)")
      if (comprobanteRef.current) comprobanteRef.current.value = ""
      return
    }
    const err = validarComprobante(file)
    if (err) {
      toast.error(err)
      if (comprobanteRef.current) comprobanteRef.current.value = ""
      return
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setComprobantePreview(url)
    setComprobanteFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0])
    }
  }

  const handleComprobante = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleFileProcess(file)
  }

  const handleRemoveComprobante = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    setComprobantePreview(null)
    setComprobanteFile(null)
    if (comprobanteRef.current) comprobanteRef.current.value = ""
  }

  // Registrar Pago
  const handleRegistrarPago = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!formularioValido) {
      if (disabledReason) toast.error(disabledReason)
      return
    }

    if (!data?.cuenta_id) {
      toast.error("No se encontró la cuenta por cobrar asociada al participante")
      return
    }

    setSavingPago(true)
    try {
      let comprobanteUrl: string | null = null
      if (comprobanteFile) {
        const form = new FormData()
        form.append("archivo", comprobanteFile)
        const uploadRes = await financeService.uploadComprobantePago(form)
        comprobanteUrl = uploadRes?.data?.url || uploadRes?.url || null
      }

      await financeService.registrarPago({
        cuenta_cobrar_id: data.cuenta_id,
        monto: montoNum,
        metodo_pago: metodoPago,
        fecha_pago: fechaPago,
        comprobante_url: comprobanteUrl,
        observaciones: observaciones.trim() || undefined,
      })

      toast.success("Pago registrado exitosamente")
      handleRemoveComprobante()
      setObservaciones("")
      await recargarDatos()
    } catch (err: any) {
      toast.error(err?.response?.data?.mensaje || err?.response?.data?.message || "Error al registrar el pago")
    } finally {
      setSavingPago(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center space-y-3">
        <Loader2 size={32} className="animate-spin text-[#fd761a]" />
        <p className="text-xs font-medium text-slate-500">Cargando estado financiero del participante...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center space-y-4">
        <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertCircle size={24} />
        </div>
        <p className="text-sm font-semibold text-slate-700">Participante no encontrado</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-xs font-bold text-[#fd761a] hover:underline"
        >
          Volver a la lista
        </button>
      </div>
    )
  }

  const inscripcionTag = participanteId ? participanteId.substring(0, 8).toUpperCase() : "INS"
  const cedula = participante.cedula || data.cedula
  const correo = participante.correo || data.correo
  const telefono = participante.telefono || data.telefono
  const ciudad = participante.ciudad || data.ciudad

  return (
    <div className="w-full min-h-screen bg-slate-50/50 pb-16">
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
        {/* Top Breadcrumb / Return Action */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#fd761a] transition-colors py-1 group cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Volver a Participantes / Taller</span>
          </button>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
            Inscripción: #{inscripcionTag}
          </span>
        </div>

        {/* Client / Concept Header & 4-Column Financial Summary Strip */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Person & Context Banner */}
          <div className="p-5 sm:p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <div className="size-11 sm:size-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm sm:text-base shrink-0 shadow-xs">
                {getInitials(nombreParticipante)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                    {nombreParticipante}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                      saldoPendiente <= 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : totalAbonado > 0
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        saldoPendiente <= 0 ? "bg-emerald-500" : totalAbonado > 0 ? "bg-amber-500" : "bg-red-500"
                      )}
                    />
                    {saldoPendiente <= 0 ? "Al día (Pagado)" : totalAbonado > 0 ? "Abono Parcial" : "Pendiente"}
                  </span>
                  {data.motivo_ajuste && (
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 font-medium">
                      Ajuste: {data.motivo_ajuste}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <HugeiconsIcon icon={BookOpen01Icon} size={14} className="text-slate-400 shrink-0" />
                    <span>Taller:</span>
                    <span className="text-slate-900 font-medium">{tallerNombre}</span>
                  </span>
                  {cedula && <span className="text-slate-400 font-medium">· CI: {cedula}</span>}
                  {correo && <span className="text-slate-400 font-medium hidden md:inline">· {correo}</span>}
                  {telefono && <span className="text-slate-400 font-medium hidden md:inline">· {telefono}</span>}
                  {ciudad && <span className="text-slate-400 font-medium hidden md:inline">· {ciudad}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <span
                className={cn(
                  "text-xs font-semibold px-3 py-1.5 rounded-lg border",
                  saldoPendiente <= 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-200/80"
                )}
              >
                {saldoPendiente <= 0 ? "Sin deuda pendiente" : `Saldo pendiente: $${saldoPendiente.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Compact 4-Column Financial Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50">
            {/* 1. Total */}
            <div className="p-4 sm:px-6 sm:py-3.5 flex flex-col justify-center bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Taller</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                {precioTaller > 0 && precioTaller !== montoTotal && (
                  <span className="text-xs line-through text-slate-400 tabular-nums">
                    ${precioTaller.toFixed(2)}
                  </span>
                )}
                <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight tabular-nums">
                  $ {montoTotal.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            {/* 2. Pagado */}
            <div className="p-4 sm:px-6 sm:py-3.5 flex flex-col justify-center bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Abonado</span>
              <span className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5 tracking-tight tabular-nums">
                $ {totalAbonado.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {/* 3. Saldo */}
            <div className="p-4 sm:px-6 sm:py-3.5 flex flex-col justify-center bg-white">
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  saldoPendiente > 0 ? "text-red-500" : "text-emerald-600"
                )}
              >
                Saldo Pendiente
              </span>
              <span
                className={cn(
                  "text-base sm:text-lg font-bold mt-0.5 tracking-tight tabular-nums",
                  saldoPendiente > 0 ? "text-red-600" : "text-emerald-600"
                )}
              >
                $ {saldoPendiente.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {/* 4. Estado */}
            <div className="p-4 sm:px-6 sm:py-3.5 flex flex-col justify-center bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    saldoPendiente <= 0 ? "bg-emerald-500" : totalAbonado > 0 ? "bg-amber-500" : "bg-[#fd761a]"
                  )}
                />
                <span className="text-xs font-bold text-slate-800">
                  {saldoPendiente <= 0 ? "Pagado completo" : totalAbonado > 0 ? "Abono parcial" : "Pendiente de pago"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic State: Paid vs Form */}
        {saldoPendiente <= 0 ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-7 sm:p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
              <div className="size-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={28} />
              </div>
              <h2 className="text-lg font-bold text-emerald-950 tracking-tight">El participante ha completado el pago del taller</h2>
              <p className="text-xs text-emerald-800/80 max-w-md leading-relaxed">
                Este participante se encuentra al día con la totalidad del arancel del taller. No existen saldos pendientes por recaudar.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Volver a la lista de participantes
                </button>
              </div>
            </div>

            {/* Historial de transacciones registradas */}
            {transacciones.length > 0 && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Historial de Pagos Registrados ({transacciones.length})
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                    Total abonado: ${totalAbonado.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {transacciones.map((t: any, idx: number) => (
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
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                                t.estado_verificacion === "rechazado"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : t.estado_verificacion === "pendiente"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              )}
                            >
                              {t.estado_verificacion || "Aprobado"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {formatFechaLarga(t.fecha_pago)} · <span className="capitalize">{t.metodo_pago}</span>
                            {t.observaciones && <span className="italic"> · {t.observaciones}</span>}
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
          /* Two-Column Layout (70% Form / 30% Sticky Summary) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: 70% Payment Form (8 cols on lg) */}
            <section className="lg:col-span-8 flex flex-col gap-6">
              <form
                id="tallerPaymentForm"
                onSubmit={handleRegistrarPago}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 flex flex-col gap-6"
              >
                {/* Form Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Registrar pago de taller</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ingresa el monto a recaudar, método de pago y adjunta la evidencia bancaria para este taller.
                    </p>
                  </div>
                  <div className="size-10 rounded-xl bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Money01Icon} size={20} />
                  </div>
                </div>

                {/* Concepto & Monto Section Card */}
                <div className="rounded-xl border border-slate-200/90 p-4 sm:p-5 bg-white space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 tracking-tight">
                          {tallerNombre}
                        </span>
                        {data.motivo_ajuste && (
                          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                            Ajuste: {data.motivo_ajuste}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Precio total:{" "}
                        <span className="font-semibold text-slate-700">${montoTotal.toFixed(2)}</span>
                        {" · "}
                        Abonado:{" "}
                        <span className="font-semibold text-emerald-600">${totalAbonado.toFixed(2)}</span>
                        {" · "}
                        Saldo pendiente:{" "}
                        <span className="font-bold text-red-600 tabular-nums">
                          ${saldoPendiente.toFixed(2)}
                        </span>
                      </p>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border shrink-0",
                        saldoPendiente <= 0
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : totalAbonado > 0
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                      )}
                    >
                      {saldoPendiente <= 0 ? "Pagado" : totalAbonado > 0 ? "Parcial" : "Pendiente"}
                    </span>
                  </div>

                  {/* Campo de Monto a Pagar con Botón Saldo Total */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="montoPagoInput" className="font-semibold text-slate-700">
                        Monto a recaudar en este pago <span className="text-red-500">*</span>
                      </label>
                      <span className="text-slate-400">
                        Máx permitido: <b className="text-slate-700">${saldoPendiente.toFixed(2)}</b>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                          $
                        </span>
                        <input
                          id="montoPagoInput"
                          type="number"
                          min="0.01"
                          max={saldoPendiente}
                          step="0.01"
                          value={montoPago}
                          onChange={(e) => setMontoPago(e.target.value)}
                          onBlur={() => {
                            const v = parseFloat(montoPago || "0")
                            if (!isNaN(v) && v > 0) {
                              if (v > saldoPendiente) {
                                setMontoPago(saldoPendiente.toFixed(2))
                              } else {
                                setMontoPago(v.toFixed(2))
                              }
                            }
                          }}
                          onWheel={(e) => (e.target as HTMLElement).blur()}
                          disabled={savingPago}
                          className={cn(
                            "w-full h-11 pl-8 pr-3.5 rounded-xl text-sm font-bold font-mono outline-none border transition-all tabular-nums",
                            montoError
                              ? "border-red-400 bg-red-50/30 text-red-900 focus:ring-2 focus:ring-red-400/20"
                              : "border-slate-200 bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                          )}
                          placeholder={saldoPendiente.toFixed(2)}
                          required
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setMontoPago(saldoPendiente.toFixed(2))}
                        disabled={savingPago}
                        className="h-11 px-3.5 rounded-xl bg-orange-50 hover:bg-[#fd761a] hover:text-white text-[#fd761a] border border-orange-200/80 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
                        title="Aplicar el saldo completo pendiente de este taller"
                      >
                        <HugeiconsIcon icon={CheckmarkCircle04Icon} size={15} />
                        <span>Saldo total (${saldoPendiente.toFixed(2)})</span>
                      </button>
                    </div>

                    {/* Mensaje de validación en tiempo real */}
                    {montoError && (
                      <p className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mt-1">
                        <AlertCircle size={14} className="shrink-0 text-red-500" />
                        <span>{montoError}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Date & Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Fecha de Pago */}
                  <div className="space-y-1.5">
                    <label htmlFor="fechaPago" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>Fecha de pago <span className="text-red-500">*</span></span>
                    </label>
                    <div className="relative">
                      <input
                        id="fechaPago"
                        type="date"
                        value={fechaPago}
                        onChange={(e) => setFechaPago(e.target.value)}
                        disabled={savingPago}
                        className="w-full h-11 px-3.5 pl-10 bg-slate-50/80 rounded-xl text-slate-900 text-xs font-semibold outline-none border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all cursor-pointer"
                        required
                      />
                      <HugeiconsIcon
                        icon={Calendar01Icon}
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">Día en que se acreditó la transacción</span>
                  </div>

                  {/* Método de Pago */}
                  <div className="space-y-1.5">
                    <label htmlFor="metodoPago" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Método de pago <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="metodoPago"
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value)}
                        disabled={savingPago}
                        className="w-full h-11 px-3.5 bg-slate-50/80 rounded-xl text-slate-900 text-xs font-semibold outline-none border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all cursor-pointer"
                        required
                      >
                        <option value="transferencia">Transferencia Bancaria Directa</option>
                        <option value="efectivo">Efectivo en Recepción</option>
                        <option value="deposito">Depósito Bancario</option>
                        <option value="tarjeta">Tarjeta Débito / Crédito</option>
                      </select>
                    </div>
                    <span className="text-[11px] text-slate-400">Canal utilizado para la recaudación</span>
                  </div>
                </div>

                {/* Comprobante de Pago (Requerido) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span>Comprobante de pago</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold border border-red-100">
                        Requerido
                      </span>
                    </label>
                    <span className="text-[11px] text-slate-400">Formatos: JPG, PNG o WEBP (máx 10MB)</span>
                  </div>

                  <input
                    type="file"
                    ref={comprobanteRef}
                    onChange={handleComprobante}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                  />

                  {comprobantePreview && comprobanteFile ? (
                    /* Uploaded Evidence Block (Matching EjemplosDiseño/code.html) */
                    <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-4">
                      {/* Thumbnail preview with zoom overlay */}
                      <div
                        onClick={() => setModalImage(comprobantePreview)}
                        className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-lg overflow-hidden bg-slate-200 shrink-0 shadow-xs group cursor-pointer border border-slate-200"
                        title="Haga clic para ver en tamaño completo"
                      >
                        <img
                          src={comprobantePreview}
                          alt="Comprobante cargado"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <HugeiconsIcon icon={ViewIcon} size={20} />
                        </div>
                      </div>

                      {/* Metadata & Verification */}
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
                              <span>Legible</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                            {formatFileSize(comprobanteFile.size)} · Subido hace un momento
                          </p>
                          <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                            <HugeiconsIcon icon={CheckmarkCircle04Icon} size={13} />
                            <span>Evidencia lista para validación y conciliación de taller</span>
                          </p>
                        </div>

                        {/* Secondary Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => comprobanteRef.current?.click()}
                            disabled={savingPago}
                            className="h-8 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                          >
                            <HugeiconsIcon icon={Upload01Icon} size={14} />
                            <span>Cambiar</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveComprobante}
                            disabled={savingPago}
                            className="h-8 px-3 rounded-lg bg-red-50 text-red-600 font-semibold text-xs hover:bg-red-100 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={14} />
                            <span>Quitar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Dropzone when no file selected */
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => comprobanteRef.current?.click()}
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
                        Haga clic para subir comprobante o arrastra la imagen aquí
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Comprobante de depósito o transferencia bancaria (PNG, JPG, WEBP)
                      </span>
                    </div>
                  )}

                  {!comprobanteValido && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <HugeiconsIcon icon={InformationCircleIcon} size={13} className="text-slate-400" />
                      <span>El comprobante de pago es indispensable para validar y asentar el abono.</span>
                    </p>
                  )}
                </div>

                {/* Observaciones opcionales */}
                <div className="space-y-1.5 pt-1">
                  <label htmlFor="notasTaller" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span>Notas u observaciones administrativas</span>
                    <span className="text-[11px] text-slate-400 font-normal lowercase">(opcional)</span>
                  </label>
                  <textarea
                    id="notasTaller"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    disabled={savingPago}
                    rows={2}
                    placeholder="Ej. Transferencia confirmada por secretaría vía Banco Pichincha, número de referencia..."
                    className="w-full p-3 bg-slate-50/80 rounded-xl text-slate-900 text-xs font-medium outline-none border border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all resize-none"
                  />
                </div>
              </form>

              {/* Historial previo de transacciones registradas */}
              {transacciones.length > 0 && (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Historial de Pagos Registrados ({transacciones.length})
                    </h3>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                      Total pagado: ${totalAbonado.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {transacciones.map((t: any, idx: number) => (
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
                              <span
                                className={cn(
                                  "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                                  t.estado_verificacion === "rechazado"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : t.estado_verificacion === "pendiente"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                )}
                              >
                                {t.estado_verificacion || "Aprobado"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {formatFechaLarga(t.fecha_pago)} · <span className="capitalize">{t.metodo_pago}</span>
                              {t.observaciones && <span className="italic"> · {t.observaciones}</span>}
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

            {/* RIGHT: 30% Sticky Summary (4 cols on lg) */}
            <aside className="lg:col-span-4 sticky top-6 flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Resumen de liquidación</h3>
                  <div className="size-8 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center">
                    <HugeiconsIcon icon={Invoice01Icon} size={16} />
                  </div>
                </div>

                {/* Financial Breakdown Items */}
                <div className="flex flex-col gap-2.5 mb-4 text-xs">
                  <div className="flex items-center justify-between py-1 text-slate-500">
                    <span>Total del taller</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      $ {montoTotal.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 text-slate-500">
                    <span>Abonado histórico</span>
                    <span className="font-semibold text-emerald-600 tabular-nums">
                      $ {totalAbonado.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 text-slate-500">
                    <span>Saldo pendiente actual</span>
                    <span className="font-bold text-red-600 tabular-nums">
                      $ {saldoPendiente.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-b border-slate-100">
                    <span className="text-slate-700 font-bold">Monto a pagar ahora</span>
                    <span className="text-xl font-black text-[#fd761a] tabular-nums">
                      $ {montoNum > 0 ? montoNum.toFixed(2) : "0.00"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 text-slate-500">
                    <span>Saldo restante del taller</span>
                    <span
                      className={cn(
                        "font-bold tabular-nums",
                        saldoRestanteProyectado > 0 ? "text-red-600" : "text-emerald-600"
                      )}
                    >
                      $ {saldoRestanteProyectado.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Coverage Progress Bar (Clean meter) */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 mb-5 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Cobertura del taller</span>
                    <span className="font-bold text-[#fd761a] tabular-nums">
                      {pctPagado}% cubierto
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
                    form="tallerPaymentForm"
                    disabled={savingPago || !formularioValido}
                    className="w-full h-11 bg-[#fd761a] hover:bg-[#e06512] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    title={disabledReason || "Registrar pago"}
                  >
                    {savingPago ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Guardando pago...</span>
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} />
                        <span>Registrar pago</span>
                      </>
                    )}
                  </button>

                  {/* Feedback visible de por qué está deshabilitado */}
                  {!formularioValido && disabledReason && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-1.5 leading-tight">
                      <AlertCircle size={14} className="shrink-0 text-amber-600 mt-0.5" />
                      <span>{disabledReason}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full h-10 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer"
                  >
                    Cancelar operación
                  </button>
                </div>

                {/* Administrative Audit Note */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-2 text-slate-400">
                  <HugeiconsIcon icon={InformationCircleIcon} size={15} className="shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Se generará el registro contable y la transacción se conciliará en la cuenta de inscripción del participante en el taller.
                  </p>
                </div>
              </div>

              {/* Quick Help Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3 text-slate-600">
                <div className="size-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  <HugeiconsIcon icon={CustomerService01Icon} size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800">¿Dudas con la conciliación?</p>
                  <p className="text-[11px] text-slate-500 truncate">Consulte con secretaría o el departamento contable.</p>
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
