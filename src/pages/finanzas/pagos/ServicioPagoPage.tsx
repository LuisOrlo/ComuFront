/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo } from "react"
import { useLocation, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, Money01Icon, UserIcon, UploadIcon, Tick02Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn, getStorageUrl } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { validarComprobante } from "@/lib/file-validators"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const BORDER = COLORS.BORDER_SUBTLE

export function ServicioPagoPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as any

  const esPagoDirecto = state?.tipo && state?.servicioId
  const esPagoPorCuenta = state?.cuentaId

  const [monto, setMonto] = useState("")
  const [metodoPago, setMetodoPago] = useState("efectivo")
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0])
  const [saving, setSaving] = useState(false)
  const [transacciones, setTransacciones] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [cuentaValida, setCuentaValida] = useState<boolean | null>(null)
  const [saldoActual, setSaldoActual] = useState(state?.montoSaldo ?? 0)
  const [montoTotalCuenta, setMontoTotalCuenta] = useState(state?.montoTotal ?? 0)

  const transaccionesAgrupadas = useMemo(() => {
    if (!transacciones || transacciones.length === 0) return []

    const groups: Record<string, any> = {}

    transacciones.forEach((t: any) => {
      const compKey = t.comprobante_url ? String(t.comprobante_url).trim() : null
      const createdKey = t.created_at ? String(t.created_at).substring(0, 16) : ""
      const key = compKey
        ? `comp_${compKey}`
        : `tx_${t.fecha_pago || ''}_${t.metodo_pago || ''}_${createdKey}`

      if (!groups[key]) {
        groups[key] = {
          id: t.id,
          monto: 0,
          metodo_pago: t.metodo_pago,
          comprobante_url: t.comprobante_url,
          fecha_pago: t.fecha_pago,
          estado_verificacion: t.estado_verificacion,
          observaciones: t.observaciones,
          count: 0,
        }
      }

      groups[key].monto += Number(t.monto || 0)
      groups[key].count += 1
      if (t.estado_verificacion === "aprobado") {
        groups[key].estado_verificacion = "aprobado"
      }
    })

    return Object.values(groups)
  }, [transacciones])

  useEffect(() => {
    if (esPagoPorCuenta && state?.cuentaId) {
      let cancelled = false
      ;(async () => {
        try {
          const res = await financeService.getCuentaDetalle(state.cuentaId!)
          if (cancelled) return
          const d = (res as any)?.datos
          setSaldoActual(Number(d?.saldo_pendiente ?? 0))
          setMontoTotalCuenta(Number(d?.monto_total ?? 0))
          if (Array.isArray((res as any)?.transacciones)) {
            setTransacciones((res as any).transacciones)
          }
          setCuentaValida(true)
        } catch {
          if (!cancelled) setCuentaValida(false)
        }
      })()
      financeService.getTransacciones({ cuenta_cobrar_id: state.cuentaId, per_page: 50 })
        .then((res: any) => {
          if (!cancelled && Array.isArray(res.data) && res.data.length > 0) {
            setTransacciones(res.data)
          }
        })
        .catch(() => {})
      return () => { cancelled = true }
    } else if (esPagoDirecto) {
      ;(async () => {
        try {
          const res = await financeService.getServicioFinanciero(state.tipo, state.servicioId)
          const d = (res as any)?.datos || res
          setSaldoActual(Number(d?.saldo_pendiente ?? state.montoSaldo ?? 0))
          setMontoTotalCuenta(Number(d?.monto_total ?? state.montoTotal ?? 0))
        } catch {
          // no cuenta yet, fallback to state values
        }
        setCuentaValida(true)
      })()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.cuentaId, esPagoPorCuenta, esPagoDirecto, state?.montoSaldo])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  if (!state || (!esPagoPorCuenta && !esPagoDirecto)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-sm font-bold" style={{ color: CHARCOAL }}>No hay cuenta para este servicio</p>
        <p className="text-xs opacity-40 max-w-xs">Este servicio no tiene una cuenta por cobrar. Registra el pago desde el módulo del servicio.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: ACCENT }}
        >
          Volver
        </button>
      </div>
    )
  }

  if (cuentaValida === false) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-sm font-bold" style={{ color: CHARCOAL }}>La cuenta no existe</p>
        <p className="text-xs opacity-40 max-w-xs">El ID de cuenta proporcionado no es válido o la cuenta ha sido eliminada.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ backgroundColor: ACCENT }}
        >
          Volver
        </button>
      </div>
    )
  }

  if (cuentaValida === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-sm opacity-40">Verificando cuenta...</p>
      </div>
    )
  }

  const { nombre, nombreServicio } = state

  const montoNum = parseFloat(monto || "0")
  const montoValido = !isNaN(montoNum) && montoNum > 0 && montoNum <= saldoActual
  const comprobanteValido = !!comprobanteFile
  const formularioValido = montoValido && comprobanteValido && !!fechaPago && !!metodoPago
  const saldoRestante = Math.max(0, saldoActual - montoNum)

  const handleFileSelect = () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen (JPG, PNG, WEBP)")
      if (fileRef.current) fileRef.current.value = ""
      return
    }
    const err = validarComprobante(file)
    if (err) { toast.error(err); if (fileRef.current) fileRef.current.value = ""; return }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setComprobanteFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }



  const handlePagar = async () => {
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0) { toast.error("Ingresa un monto válido"); return }
    if (montoNum > saldoActual) { toast.error("El monto supera el saldo pendiente"); return }
    if (!comprobanteFile) { toast.error("Debes subir el comprobante de pago"); return }
    if (!fechaPago) { toast.error("Selecciona la fecha de pago"); return }
    if (!metodoPago) { toast.error("Selecciona el método de pago"); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("archivo", comprobanteFile)
      const res = await financeService.uploadComprobantePago(fd)
      const comprobanteUrl = res.data?.url || res.url || ""
      if (esPagoDirecto) {
        await financeService.pagarServicio(state.tipo, state.servicioId, {
          monto: montoNum,
          metodo_pago: metodoPago,
          comprobante_url: comprobanteUrl || undefined,
          fecha_pago: fechaPago,
        })
      } else {
        await financeService.registrarPago({
          cuenta_cobrar_id: state.cuentaId,
          monto: montoNum,
          metodo_pago: metodoPago,
          comprobante_url: comprobanteUrl || null,
          fecha_pago: fechaPago,
        })
      }
      toast.success("Pago registrado exitosamente")
      navigate("/finanzas/pagos/cuentas/servicios")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.mensaje || "Error al registrar pago")
    } finally {
      setSaving(false)
    }
  }

  const abonadoPrevio = Math.max(0, montoTotalCuenta - saldoActual)
  const pctPagado = montoTotalCuenta > 0 ? Math.min(100, Math.round(((abonadoPrevio + montoNum) / montoTotalCuenta) * 100)) : 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all"
        style={{ color: COLORS.CHARCOAL }}
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
        Volver
      </button>

      <div className="rounded-2xl border bg-white p-4 sm:p-6" style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div
            className="size-10 sm:size-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "oklch(0.95 0.01 45)" }}
          >
            <HugeiconsIcon icon={UserIcon} size={20} style={{ color: ACCENT }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black truncate" style={{ color: CHARCOAL }}>
              {nombre || "Cliente"}
            </h2>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              {nombreServicio || (state?.concepto || "Servicio")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-xl" style={{ backgroundColor: "oklch(0.97 0 0)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Total</p>
            <p className="text-base sm:text-lg font-black mt-0.5" style={{ color: CHARCOAL }}>
              ${montoTotalCuenta.toLocaleString()}
            </p>
          </div>
          <div className="p-3 sm:p-4 rounded-xl" style={{ backgroundColor: "oklch(0.97 0 0)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Pagado</p>
            <p className="text-base sm:text-lg font-black mt-0.5" style={{ color: "oklch(0.5 0.15 150)" }}>
              ${(montoTotalCuenta - saldoActual).toLocaleString()}
            </p>
          </div>
          <div className="p-3 sm:p-4 rounded-xl" style={{ backgroundColor: "oklch(0.97 0 0)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Saldo</p>
            <p className="text-base sm:text-lg font-black mt-0.5" style={{ color: saldoActual > 0 ? "oklch(0.5 0.15 20)" : "oklch(0.5 0.15 150)" }}>
              {saldoActual > 0 ? `$${saldoActual.toLocaleString()}` : "$0"}
            </p>
          </div>
          <div className="p-3 sm:p-4 rounded-xl" style={{ backgroundColor: "oklch(0.97 0 0)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Estado</p>
            <p className="text-base sm:text-lg font-black mt-0.5" style={{ color: saldoActual <= 0 ? "oklch(0.5 0.15 150)" : "oklch(0.65 0.15 75)" }}>
              {saldoActual <= 0 ? "Pagado" : "Pendiente"}
            </p>
          </div>
        </div>
      </div>

      {saldoActual <= 0 ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-2xl border bg-emerald-50/50 border-emerald-100 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <HugeiconsIcon icon={Tick02Icon} size={24} />
            </div>
            <h3 className="text-base font-black text-emerald-800">Servicio Pagado por Completo</h3>
            <p className="text-xs text-emerald-600 max-w-sm">No existen saldos pendientes para este servicio. A continuación puedes ver el historial completo de pagos y comprobantes asociados.</p>
          </div>

          <div className="rounded-2xl border bg-white p-4 sm:p-6" style={{ borderColor: BORDER }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 sm:mb-5" style={{ color: COLORS.TEXT_MUTED }}>
              Historial de Pagos ({transaccionesAgrupadas.length})
            </h3>
            {transaccionesAgrupadas.length > 0 ? (
              <div className="space-y-3">
                {transaccionesAgrupadas.map((t: any, idx: number) => (
                  <div key={t.id || idx} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border" style={{ borderColor: BORDER, backgroundColor: "oklch(0.99 0 0)" }}>
                    <div
                      className="size-9 sm:size-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor:
                          t.estado_verificacion === "aprobado" ? "oklch(0.9 0.1 150 / 0.3)" :
                          t.estado_verificacion === "rechazado" ? "oklch(0.9 0.1 20 / 0.3)" :
                          "oklch(0.9 0.1 75 / 0.3)",
                      }}
                    >
                      <HugeiconsIcon
                        icon={Money01Icon}
                        size={16}
                        style={{
                          color:
                            t.estado_verificacion === "aprobado" ? "oklch(0.5 0.15 150)" :
                            t.estado_verificacion === "rechazado" ? "oklch(0.5 0.15 20)" :
                            "oklch(0.65 0.15 75)",
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black" style={{ color: CHARCOAL }}>
                          ${Number(t.monto || 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                        </span>
                        {t.count > 1 && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                            {t.count} ítems
                          </span>
                        )}
                        <span className={cn(
                          "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
                          t.estado_verificacion === "aprobado" ? "bg-green-100 text-green-700" :
                          t.estado_verificacion === "rechazado" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {t.estado_verificacion === "aprobado" ? "Verificado" :
                           t.estado_verificacion === "rechazado" ? "Rechazado" : "Pendiente"}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                        {t.fecha_pago ? new Date(t.fecha_pago).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                        {t.metodo_pago ? ` · ${t.metodo_pago}` : ""}
                      </p>
                    </div>
                    {t.comprobante_url && (
                      <button
                        onClick={() => setModalImage(getStorageUrl(t.comprobante_url))}
                        className="inline-flex items-center gap-1 text-[10px] font-bold shrink-0 hover:underline"
                        style={{ color: ACCENT }}
                      >
                        <HugeiconsIcon icon={Tick02Icon} size={12} />
                        Ver comp.
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center opacity-40 py-4">No hay transacciones registradas.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            <div className="rounded-2xl border bg-white p-4 sm:p-6 space-y-4 sm:space-y-5" style={{ borderColor: BORDER }}>
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: COLORS.TEXT_MUTED }}>
                <HugeiconsIcon icon={Money01Icon} size={14} />
                Registrar Pago
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                  Monto a pagar
                </label>
                <div className="relative flex items-center border rounded-xl bg-white px-4 py-3.5"
                  style={{
                    borderColor: monto && !montoValido ? "#dc2626" : BORDER,
                  }}>
                  <span className="text-lg font-bold font-mono mr-2 select-none" style={{ color: COLORS.TEXT_MUTED }}>$</span>
                  <input
                    type="number"
                    value={monto}
                    onChange={e => setMonto(e.target.value)}
                    onBlur={() => {
                      const v = parseFloat(monto)
                      if (!isNaN(v)) {
                        if (v < 0) setMonto("0")
                        else if (v > saldoActual) setMonto(saldoActual.toString())
                      }
                    }}
                    min={0}
                    max={saldoActual}
                    step="0.01"
                    placeholder={`0.00 (máx $${saldoActual.toLocaleString()})`}
                    className="w-full text-base sm:text-lg font-bold font-mono outline-none p-0 border-0"
                    style={{
                      MozAppearance: "textfield",
                    }}
                  />
                </div>
                {monto && !montoValido && (
                  <p className="text-[11px] text-red-600 mt-1.5 font-medium">
                    {montoNum <= 0
                      ? "Debe ser mayor a 0"
                      : montoNum > saldoActual
                        ? `Supera el saldo pendiente ($${saldoActual.toFixed(2)})`
                        : "Monto inválido"}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                  Fecha de pago
                </label>
                <input
                  type="date"
                  value={fechaPago}
                  onChange={e => setFechaPago(e.target.value)}
                  className="w-full px-4 py-3 sm:py-3.5 rounded-xl border text-sm outline-none transition-all focus:border-charcoal bg-white"
                  style={{ borderColor: BORDER }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                  Método de pago
                </label>
                <select
                  value={metodoPago}
                  onChange={e => setMetodoPago(e.target.value)}
                  className="w-full px-4 py-3 sm:py-3.5 rounded-xl border text-sm outline-none transition-all focus:border-charcoal bg-white"
                  style={{ borderColor: BORDER }}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia / Depósito</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                  Comprobante de pago (Requerido)
                </label>
                <input
                  type="file"
                  ref={fileRef}
                  onChange={handleFileSelect}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
                {previewUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: BORDER }}>
                      <img
                        src={previewUrl}
                        alt="Vista previa del comprobante"
                        className="w-full max-h-40 sm:max-h-48 object-contain bg-gray-50"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Tick02Icon} size={14} style={{ color: "oklch(0.5 0.15 150)" }} />
                      <span className="text-xs font-medium" style={{ color: "oklch(0.5 0.15 150)" }}>
                        {comprobanteFile?.name}
                      </span>
                      <button
                        onClick={() => {
                          setComprobanteFile(null)
                          if (previewUrl) URL.revokeObjectURL(previewUrl)
                          setPreviewUrl(null)
                          if (fileRef.current) fileRef.current.value = ""
                        }}
                        className="ml-auto text-[10px] font-bold opacity-40 hover:opacity-100 transition-all"
                        style={{ color: CHARCOAL }}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-3.5 sm:py-4 rounded-xl border-2 border-dashed text-sm font-semibold transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
                    style={{ borderColor: BORDER, color: COLORS.TEXT_MUTED }}
                  >
                    <HugeiconsIcon icon={UploadIcon} size={16} />
                    Subir comprobante
                  </button>
                )}
                {!comprobanteValido && montoValido && (
                  <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                    El comprobante es obligatorio *
                  </p>
                )}
              </div>
            </div>

            {esPagoPorCuenta && transaccionesAgrupadas.length > 0 && (
              <div className="rounded-2xl border bg-white p-4 sm:p-6" style={{ borderColor: BORDER }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4 sm:mb-5" style={{ color: COLORS.TEXT_MUTED }}>
                  Historial de Pagos ({transaccionesAgrupadas.length})
                </h3>
                <div className="space-y-3">
                  {transaccionesAgrupadas.map((t: any, idx: number) => (
                    <div key={t.id || idx} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border" style={{ borderColor: BORDER, backgroundColor: "oklch(0.99 0 0)" }}>
                      <div
                        className="size-9 sm:size-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor:
                            t.estado_verificacion === "aprobado" ? "oklch(0.9 0.1 150 / 0.3)" :
                            t.estado_verificacion === "rechazado" ? "oklch(0.9 0.1 20 / 0.3)" :
                            "oklch(0.9 0.1 75 / 0.3)",
                        }}
                      >
                        <HugeiconsIcon
                          icon={Money01Icon}
                          size={16}
                          style={{
                            color:
                              t.estado_verificacion === "aprobado" ? "oklch(0.5 0.15 150)" :
                              t.estado_verificacion === "rechazado" ? "oklch(0.5 0.15 20)" :
                              "oklch(0.65 0.15 75)",
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black" style={{ color: CHARCOAL }}>
                            ${Number(t.monto || 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                          </span>
                          {t.count > 1 && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                              {t.count} ítems
                            </span>
                          )}
                          <span className={cn(
                            "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
                            t.estado_verificacion === "aprobado" ? "bg-green-100 text-green-700" :
                            t.estado_verificacion === "rechazado" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          )}>
                            {t.estado_verificacion === "aprobado" ? "Verificado" :
                             t.estado_verificacion === "rechazado" ? "Rechazado" : "Pendiente"}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                          {t.fecha_pago ? new Date(t.fecha_pago).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                          {t.metodo_pago ? ` · ${t.metodo_pago}` : ""}
                        </p>
                      </div>
                      {t.comprobante_url && (
                        <button
                          onClick={() => setModalImage(getStorageUrl(t.comprobante_url))}
                          className="inline-flex items-center gap-1 text-[10px] font-bold shrink-0 hover:underline"
                          style={{ color: ACCENT }}
                        >
                          <HugeiconsIcon icon={Tick02Icon} size={12} />
                          Ver comp.
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div className="rounded-2xl border bg-white p-4 sm:p-6 space-y-4 h-fit" style={{ borderColor: BORDER }}>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                Resumen
              </h3>

              <div className="p-4 rounded-xl" style={{ backgroundColor: "oklch(0.97 0 0)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                  Monto a pagar
                </p>
                <p className="text-xl sm:text-2xl font-black mt-1" style={{ color: ACCENT }}>
                  ${montoNum > 0 ? montoNum.toFixed(2) : "0.00"}
                </p>
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: "oklch(0.97 0 0)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                  Saldo restante
                </p>
                <p className="text-xl sm:text-2xl font-black mt-1" style={{ color: saldoRestante > 0 ? "oklch(0.5 0.15 20)" : "oklch(0.5 0.15 150)" }}>
                  {saldoRestante > 0 ? `$${saldoRestante.toFixed(2)}` : "$0.00"}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span style={{ color: COLORS.TEXT_MUTED }}>Progreso</span>
                  <span className="font-bold" style={{ color: CHARCOAL }}>{pctPagado}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "oklch(0.92 0 0)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pctPagado}%`,
                      backgroundColor: pctPagado >= 100 ? "oklch(0.5 0.15 150)" : ACCENT,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handlePagar}
                disabled={saving || !formularioValido}
                className="w-full py-3.5 sm:py-4 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: ACCENT }}
                title={!formularioValido ? "Completa todos los campos requeridos para registrar el pago" : "Registrar pago"}
              >
                <HugeiconsIcon icon={Money01Icon} size={16} />
                {saving ? "Registrando..." : "Registrar Pago"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative flex items-center justify-center" style={{ maxWidth: "min(90vw, 1200px)", maxHeight: "90vh" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setModalImage(null) }}
              className="absolute -top-8 right-0 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cerrar [X]
            </button>
            <img
              src={modalImage}
              alt="Comprobante"
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
