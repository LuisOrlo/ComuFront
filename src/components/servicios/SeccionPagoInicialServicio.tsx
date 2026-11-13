import { useState, useEffect, useRef } from "react"
import {
  CreditCard,
  Wallet,
  Landmark,
  Plus,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
  Coins,
  Receipt,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"

export type TipoMetodoPago = "efectivo" | "transferencia" | "deposito" | "tarjeta" | "otro"

export interface MetodoPagoRow {
  id: string
  metodo_pago: TipoMetodoPago
  monto: string
  comprobante_urls: string[]
  uploading?: boolean
}

export interface PagoInicialData {
  tipo_cobertura: "total" | "abono"
  monto_total: number
  metodos_pago: {
    metodo_pago: TipoMetodoPago
    monto: number
    referencia_pago?: string | null
    comprobante_url?: string | null
    comprobante_urls?: string[]
    fecha_pago?: string
  }[]
  observaciones?: string
}

interface SeccionPagoInicialServicioProps {
  precioTotalNeto: number
  onChange: (data: PagoInicialData | null) => void
  disabled?: boolean
  isBatch?: boolean
  labelServicio?: string
}

const METODO_OPTIONS: { value: TipoMetodoPago; label: string; icon: typeof Wallet }[] = [
  { value: "efectivo", label: "Efectivo", icon: Coins },
  { value: "transferencia", label: "Transferencia bancaria", icon: Landmark },
  { value: "deposito", label: "Depósito bancario", icon: CreditCard },
  { value: "tarjeta", label: "Tarjeta débito / crédito", icon: CreditCard },
  { value: "otro", label: "Otro método", icon: Wallet },
]

export function SeccionPagoInicialServicio({
  precioTotalNeto,
  onChange,
  disabled = false,
  isBatch = false,
}: SeccionPagoInicialServicioProps) {
  const [activo, setActivo] = useState(false)
  const [tipoCobertura, setTipoCobertura] = useState<"total" | "abono">("abono")
  const [filas, setFilas] = useState<MetodoPagoRow[]>([
    {
      id: crypto.randomUUID(),
      metodo_pago: "efectivo",
      monto: "0",
      comprobante_urls: [],
      uploading: false,
    },
  ])
  const [observaciones, setObservaciones] = useState("")
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0])
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({})

  // Redondeo seguro a 2 decimales
  const precioNetoRedondeado = Math.max(0, Math.round(precioTotalNeto * 100) / 100)

  // Sincronización reactiva si el precio neto cambia: solo recortar si la suma excede el nuevo precio
  useEffect(() => {
    if (!activo) return

    setFilas((prev) => {
      const sumaActual = prev.reduce((acc, f) => acc + (parseFloat(f.monto) || 0), 0)
      if (sumaActual > precioNetoRedondeado && precioNetoRedondeado > 0) {
        toast.warning(
          `El total neto cambió a $${precioNetoRedondeado.toFixed(2)}. Se ajustó el monto para no excederlo.`
        )
        return [
          {
            ...prev[0],
            monto: precioNetoRedondeado.toFixed(2),
          },
        ]
      }
      return prev
    })
  }, [precioNetoRedondeado, activo])

  // Calcular totales actuales
  const sumaPagosCentavos = filas.reduce((acc, f) => {
    const val = parseFloat(f.monto) || 0
    return acc + Math.round(val * 100)
  }, 0)
  const sumaPagos = Math.round(sumaPagosCentavos) / 100
  const saldoPendienteCentavos = Math.round(precioNetoRedondeado * 100) - sumaPagosCentavos
  const saldoPendiente = Math.max(0, Math.round(saldoPendienteCentavos) / 100)
  const excedeTotal = sumaPagosCentavos > Math.round(precioNetoRedondeado * 100)

  // Emitir cambios hacia el formulario padre
  useEffect(() => {
    if (!activo || precioNetoRedondeado <= 0) {
      onChange(null)
      return
    }

    // Validar que todas las filas tengan monto > 0 y no exceda
    const validas = filas.filter((f) => (parseFloat(f.monto) || 0) > 0)
    if (validas.length === 0 || excedeTotal) {
      onChange(null)
      return
    }

    const data: PagoInicialData = {
      tipo_cobertura: tipoCobertura,
      monto_total: sumaPagos,
      metodos_pago: validas.map((f) => ({
        metodo_pago: f.metodo_pago,
        monto: Math.round((parseFloat(f.monto) || 0) * 100) / 100,
        comprobante_urls: f.comprobante_urls,
        comprobante_url: f.comprobante_urls.length > 0 ? f.comprobante_urls[0] : null,
        fecha_pago: fechaPago,
      })),
      observaciones: observaciones.trim() || undefined,
    }

    onChange(data)
  }, [activo, tipoCobertura, filas, observaciones, fechaPago, precioNetoRedondeado, sumaPagos, excedeTotal, onChange])

  const handleToggleActivo = () => {
    const nuevo = !activo
    setActivo(nuevo)
    if (nuevo) {
      setTipoCobertura("abono")
      setFilas([
        {
          id: crypto.randomUUID(),
          metodo_pago: "efectivo",
          monto: "0",
          comprobante_urls: [],
          uploading: false,
        },
      ])
    }
  }

  const handleSeleccionarCobertura = (tipo: "total" | "abono") => {
    setTipoCobertura(tipo)
    if (tipo === "total") {
      setFilas([
        {
          id: crypto.randomUUID(),
          metodo_pago: filas[0]?.metodo_pago || "efectivo",
          monto: precioNetoRedondeado > 0 ? precioNetoRedondeado.toFixed(2) : "0",
          comprobante_urls: filas[0]?.comprobante_urls || [],
          uploading: false,
        },
      ])
    }
  }

  const handleAgregarFila = () => {
    setFilas((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        metodo_pago: "transferencia",
        monto: "0",
        comprobante_urls: [],
        uploading: false,
      },
    ])
  }

  const handleEliminarFila = (id: string) => {
    if (filas.length <= 1) return
    setFilas((prev) => prev.filter((f) => f.id !== id))
  }

  const handleActualizarFila = (id: string, updates: Partial<MetodoPagoRow>) => {
    setFilas((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  // Carga de imágenes de comprobante (SOLO IMÁGENES, PROHIBIDO PDF)
  const handleArchivosSeleccionados = async (filaId: string, files: FileList | File[]) => {
    const filesArray = Array.from(files)
    if (filesArray.length === 0) return

    // Validar tipo: SOLO IMÁGENES
    for (const file of filesArray) {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        toast.error("No se permiten archivos PDF. Solo se admiten imágenes (JPG, PNG, WEBP).")
        return
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`El archivo "${file.name}" no es una imagen válida (JPG, PNG, WEBP).`)
        return
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`La imagen "${file.name}" supera el tamaño máximo permitido (15MB).`)
        return
      }
    }

    handleActualizarFila(filaId, { uploading: true })
    const nuevasUrls: string[] = []

    try {
      for (const file of filesArray) {
        const fd = new FormData()
        fd.append("archivo", file)
        const res = await financeService.uploadComprobantePago(fd)
        const url = res.data?.url || res.url || ""
        if (url) {
          nuevasUrls.push(url)
        }
      }

      setFilas((prev) =>
        prev.map((f) =>
          f.id === filaId
            ? { ...f, comprobante_urls: [...f.comprobante_urls, ...nuevasUrls], uploading: false }
            : f
        )
      )
      toast.success(
        `${nuevasUrls.length} imagen${nuevasUrls.length === 1 ? "" : "es"} de comprobante subida${nuevasUrls.length === 1 ? "" : "s"}`
      )
    } catch {
      toast.error("Error al subir comprobante. Intenta nuevamente.")
      handleActualizarFila(filaId, { uploading: false })
    }
  }

  const handleRemoverComprobante = (filaId: string, indexToRemove: number) => {
    setFilas((prev) =>
      prev.map((f) =>
        f.id === filaId
          ? { ...f, comprobante_urls: f.comprobante_urls.filter((_, idx) => idx !== indexToRemove) }
          : f
      )
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all sm:p-5">
      {/* Encabezado con Interruptor */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
              activo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            )}
          >
            <Receipt size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Registrar Pago o Abono Inicial
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                Opcional
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {isBatch
                ? "Asienta el pago o anticipo completo para este grupo de reservas en una sola operación."
                : "Si el cliente ya canceló o dejó un anticipo, regístralo aquí sin ir al módulo de cobros."}
            </p>
          </div>
        </div>

        {/* Switch */}
        <label className="relative inline-flex cursor-pointer items-center self-start sm:self-auto">
          <input
            type="checkbox"
            checked={activo}
            onChange={handleToggleActivo}
            disabled={disabled || precioNetoRedondeado <= 0}
            className="peer sr-only"
          />
          <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
          <span className="ml-2.5 text-xs font-semibold text-slate-700">
            {activo ? "Cobro activado" : "Sin pago inicial"}
          </span>
        </label>
      </div>

      {/* Contenido Expandido */}
      {activo && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          {/* Selector de Cobertura */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleSeleccionarCobertura("total")}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-xl border p-3 text-left transition-all",
                tipoCobertura === "total"
                  ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60"
              )}
            >
              <div>
                <span className="text-xs font-bold text-slate-900">Pago Total (100%)</span>
                <p className="text-[11px] text-slate-500">
                  Cubre la totalidad de la reserva y la marca como pagada.
                </p>
              </div>
              <span className="text-sm font-bold text-emerald-700">
                ${precioNetoRedondeado.toFixed(2)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSeleccionarCobertura("abono")}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-xl border p-3 text-left transition-all",
                tipoCobertura === "abono"
                  ? "border-amber-600 bg-amber-50/50 shadow-xs"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60"
              )}
            >
              <div>
                <span className="text-xs font-bold text-slate-900">Abono / Anticipo</span>
                <p className="text-[11px] text-slate-500">
                  Ingresa un monto parcial; el saldo quedará pendiente de cobro.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-amber-700">Monto flexible</span>
            </button>
          </div>

          {/* Fecha de Pago */}
          <div className="flex flex-col gap-1 sm:max-w-xs">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Fecha de Cobro
            </label>
            <input
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 outline-none transition-colors focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Filas de Métodos de Pago (Soporte Mixto) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Método(s) de Pago
              </span>
              <button
                type="button"
                onClick={handleAgregarFila}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#fd761a] transition-colors hover:text-[#d95c0b] cursor-pointer"
              >
                <Plus size={14} />
                <span>Agregar pago mixto</span>
              </button>
            </div>

            {filas.map((fila, index) => {
              const esEfectivo = fila.metodo_pago === "efectivo"
              return (
                <div
                  key={fila.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-3 transition-colors hover:border-slate-300"
                >
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    {/* Selector de Método */}
                    <div className="flex-1 sm:max-w-xs">
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                        Método #{index + 1}
                      </label>
                      <select
                        value={fila.metodo_pago}
                        onChange={(e) =>
                          handleActualizarFila(fila.id, {
                            metodo_pago: e.target.value as TipoMetodoPago,
                          })
                        }
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 outline-none transition-colors focus:border-slate-400"
                      >
                        {METODO_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Input de Monto */}
                    <div className="flex-1 sm:max-w-xs">
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                        Monto ($)
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={precioNetoRedondeado}
                          value={fila.monto}
                          onFocus={(e) => {
                            if (e.target.value === "0") e.target.select()
                          }}
                          onChange={(e) => {
                            const val = e.target.value
                            handleActualizarFila(fila.id, { monto: val })
                            const valNum = parseFloat(val) || 0
                            if (valNum >= precioNetoRedondeado && precioNetoRedondeado > 0) {
                              setTipoCobertura("total")
                            } else {
                              setTipoCobertura("abono")
                            }
                          }}
                          placeholder="0.00"
                          className={cn(
                            "h-9 w-full rounded-lg border bg-white pl-7 pr-3 text-xs font-bold text-slate-900 outline-none transition-colors",
                            excedeTotal ? "border-red-400 focus:ring-1 focus:ring-red-400" : "border-slate-200 focus:border-slate-400"
                          )}
                        />
                      </div>
                    </div>

                    {/* Botón Eliminar Fila */}
                    {filas.length > 1 && (
                      <div className="self-end sm:self-auto sm:pt-4">
                        <button
                          type="button"
                          onClick={() => handleEliminarFila(fila.id)}
                          className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          title="Eliminar este método de pago"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Subida de Comprobante(s): SOLO IMÁGENES (No PDF) */}
                  <div className="rounded-lg border border-dashed border-slate-200 bg-white p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <ImageIcon size={16} className="text-slate-400" />
                        <span className="font-semibold">
                          Foto / Comprobante de respaldo
                        </span>
                        {esEfectivo ? (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                            Opcional en efectivo
                          </span>
                        ) : (
                          <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                            Solo imágenes (JPG, PNG, WEBP)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          ref={(el) => {
                            fileInputsRef.current[fila.id] = el
                          }}
                          type="file"
                          multiple
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleArchivosSeleccionados(fila.id, e.target.files)
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={fila.uploading}
                          onClick={() => fileInputsRef.current[fila.id]?.click()}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                        >
                          {fila.uploading ? (
                            <Loader2 size={13} className="animate-spin text-[#fd761a]" />
                          ) : (
                            <Upload size={13} />
                          )}
                          <span>
                            {fila.comprobante_urls.length > 0 ? "Agregar más imágenes" : "Subir imagen(es)"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Previsualización de Imágenes Subidas */}
                    {fila.comprobante_urls.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                        {fila.comprobante_urls.map((url, imgIdx) => (
                          <div
                            key={imgIdx}
                            className="group relative size-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-2xs"
                          >
                            <img
                              src={url}
                              alt={`Comprobante ${imgIdx + 1}`}
                              className="size-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoverComprobante(fila.id, imgIdx)}
                              className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-slate-900/80 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                              title="Remover imagen"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Observaciones Generales del Cobro */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Observaciones del Cobro (Opcional)
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej. Anticipo recibido en ventanilla para asegurar el espacio..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Tarjeta de Balance Financiero en Vivo */}
          <div
            className={cn(
              "rounded-xl border p-3.5 transition-colors",
              excedeTotal
                ? "border-red-200 bg-red-50/60"
                : saldoPendiente === 0
                ? "border-emerald-200 bg-emerald-50/50"
                : "border-amber-200 bg-amber-50/50"
            )}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900">Resumen del Cobro Inicial:</span>
                <p className="text-[11px] text-slate-600">
                  {excedeTotal ? (
                    <span className="font-bold text-red-600">
                      ⚠️ La suma de pagos (${sumaPagos.toFixed(2)}) supera el precio neto total (${precioNetoRedondeado.toFixed(2)}).
                    </span>
                  ) : saldoPendiente === 0 ? (
                    <span className="font-semibold text-emerald-700">
                      ✓ Pago total liquidado. La reserva quedará confirmada y pagada.
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-700">
                      Abono parcial registrado. La reserva quedará confirmada con saldo pendiente.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 font-mono">
                <div className="text-right">
                  <span className="block text-[10px] uppercase text-slate-400">Total a Pagar</span>
                  <span className="font-bold text-slate-800">${precioNetoRedondeado.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase text-slate-400">Abonando Hoy</span>
                  <span className="font-bold text-emerald-700">${sumaPagos.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase text-slate-400">Saldo Restante</span>
                  <span
                    className={cn(
                      "font-bold",
                      saldoPendiente === 0 ? "text-slate-500" : "text-amber-700"
                    )}
                  >
                    ${saldoPendiente.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
