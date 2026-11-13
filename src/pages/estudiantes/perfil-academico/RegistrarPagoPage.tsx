import { useEffect, useRef, useState, useMemo } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router"
import {
  ArrowLeft,
  Coins,
  Upload,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Wallet,
  FileText,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { validarComprobante } from "@/lib/file-validators"
import { financeService } from "@/services/finance.service"
import {
  MetodosPagoSplitInput,
  type MetodoPagoItem,
  type ConceptoDestino,
  type ModalidadComprobante,
} from "@/components/finanzas/MetodosPagoSplitInput"

const CARD_SHADOW = "shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]"

interface LineaPagoData {
  id: string
  modulo_id: string
  nombre_modulo: string
  numero_orden: number
  monto_original: number
  monto_ajustado: number
  monto_abonado: number
  tipo?: string
}

function getInitials(name?: string) {
  if (!name) return "ES"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "ES"
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function RegistrarPagoPage() {
  const { id: estudianteId, matriculaId } = useParams<{ id: string; matriculaId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const cursoNombre = searchParams.get("curso") || ""
  const estudianteNombre = searchParams.get("nombre") || ""
  const estudianteCedula = searchParams.get("cedula") || ""
  const volverUrl = searchParams.get("volver") || ""
  const defaultBackUrl = `/estudiantes/${estudianteId}/academico?tab=financiero`
  const backUrl = volverUrl || defaultBackUrl

  const [montos, setMontos] = useState<Record<string, string>>({})
  const [grupoPagoId] = useState(() => crypto.randomUUID())
  const [metodos, setMetodos] = useState<MetodoPagoItem[]>(() => [
    {
      id: "reg-pago-1",
      metodo_pago: "efectivo",
      monto: "",
    },
  ])
  const [saving, setSaving] = useState(false)
  const [lineas, setLineas] = useState<LineaPagoData[]>([])
  const [loadingLineas, setLoadingLineas] = useState(true)

  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null)
  const [modalidadComprobante, setModalidadComprobante] = useState<ModalidadComprobante>("unico")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!matriculaId) return
    let active = true
    const load = async () => {
      try {
        const res = await financeService.getLineasPagoPorMatricula(matriculaId)
        if (active) {
          const rows = (res.datos?.lineas ?? res.datos ?? res.data ?? []) as LineaPagoData[]
          setLineas(rows)
          setMontos(Object.fromEntries(rows.map((linea) => [linea.id, ""])))
        }
      } catch {
        if (active) {
          toast.error("Error al cargar los módulos")
        }
      } finally {
        if (active) setLoadingLineas(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [matriculaId])

  useEffect(() => () => {
    if (comprobantePreview) URL.revokeObjectURL(comprobantePreview)
  }, [comprobantePreview])

  const sorted = useMemo(() => {
    return [...lineas].sort((a, b) => a.numero_orden - b.numero_orden)
  }, [lineas])

  const conceptos: ConceptoDestino[] = useMemo(() => {
    return sorted
      .filter((l) => l.monto_ajustado - l.monto_abonado > 0)
      .map((l) => ({
        id: l.id,
        nombre:
          l.tipo === "inscripcion"
            ? "Inscripción / Matrícula"
            : l.nombre_modulo || `Módulo ${l.numero_orden}`,
        saldo: Math.max(0, l.monto_ajustado - l.monto_abonado),
        montoACobrar: Number.parseFloat(montos[l.id] || "0"),
      }))
  }, [sorted, montos])

  const totalAdeudado = sorted.reduce((s, l) => s + l.monto_ajustado, 0)
  const totalAbonado = sorted.reduce((s, l) => s + l.monto_abonado, 0)
  const totalPendiente = Math.max(0, totalAdeudado - totalAbonado)
  const montoPagoNum = Object.values(montos).reduce(
    (sum, value) => sum + (Number.parseFloat(value) || 0),
    0,
  )

  useEffect(() => {
    setMetodos((prev) => {
      if (prev.length === 1 && montoPagoNum > 0) {
        const nuevo = montoPagoNum.toFixed(2)
        if (prev[0].monto !== nuevo) {
          return [{ ...prev[0], monto: nuevo }]
        }
      }
      return prev
    })
  }, [montoPagoNum])

  const cuentaAfectadas = Object.values(montos).filter(
    (value) => Number.parseFloat(value) > 0,
  ).length
  const hayMontoExcedido = sorted.some(
    (linea) =>
      Number.parseFloat(montos[linea.id] || "0") >
      linea.monto_ajustado - linea.monto_abonado + 0.001,
  )
  const isMultiple = metodos.length > 1
  const porMetodo = isMultiple && modalidadComprobante === "por_metodo"
  const metodosActivos = metodos.filter((m) => (parseFloat(m.monto) || 0) > 0)
  const tieneMetodoNoEfectivo = metodosActivos.some((m) => m.metodo_pago !== "efectivo")

  const tieneComprobante = porMetodo
    ? metodosActivos.length > 0 &&
      metodosActivos.every(
        (m) => m.metodo_pago === "efectivo" || !!m.comprobante_file || !!m.comprobante_url,
      )
    : !tieneMetodoNoEfectivo || !!comprobanteFile

  const sumaMetodosCentavos = useMemo(() => {
    return metodos.reduce(
      (acc, m) => acc + Math.round((parseFloat(m.monto) || 0) * 100),
      0,
    )
  }, [metodos])

  const metodosCuadran =
    montoPagoNum > 0 && sumaMetodosCentavos === Math.round(montoPagoNum * 100)

  const saldoRestanteProyectado = Math.max(0, totalPendiente - montoPagoNum)
  const pctPagado =
    totalAdeudado > 0
      ? Math.min(100, Math.round(((totalAbonado + montoPagoNum) / totalAdeudado) * 100))
      : 0

  const puedePagar =
    !saving &&
    montoPagoNum > 0 &&
    !hayMontoExcedido &&
    tieneComprobante &&
    metodosCuadran

  const handlePagarTodo = () => {
    setMontos(
      Object.fromEntries(
        sorted.map((linea) => [
          linea.id,
          String(Math.max(linea.monto_ajustado - linea.monto_abonado, 0)),
        ]),
      ),
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validarComprobante(file)
    if (err) {
      toast.error(err)
      e.target.value = "";
      return
    }
    setComprobanteFile(file)
    if (comprobantePreview) URL.revokeObjectURL(comprobantePreview)
    setComprobantePreview(URL.createObjectURL(file))
  }

  const handleRegistrar = async () => {
    const pagos = sorted
      .map((lp) => ({ lp, monto: Number.parseFloat(montos[lp.id] || "0") }))
      .filter((item) => item.monto > 0)
    const total = pagos.reduce((sum, item) => sum + item.monto, 0)
    if (total <= 0) {
      toast.error("Ingresa un monto en al menos un módulo")
      return
    }
    const invalid = pagos.find(
      ({ lp, monto }) => monto > lp.monto_ajustado - lp.monto_abonado + 0.001,
    )
    if (invalid) {
      toast.error(`El monto de ${invalid.lp.nombre_modulo} excede su saldo pendiente`)
      return
    }

    if (sumaMetodosCentavos !== Math.round(total * 100)) {
      toast.error(
        `La suma de los métodos ($${(sumaMetodosCentavos / 100).toFixed(2)}) debe coincidir con el total a pagar ($${total.toFixed(2)})`,
      )
      return
    }

    setSaving(true)
    try {
      let comprobanteUrlGlobal: string | null = null

      if (!porMetodo && comprobanteFile) {
        const form = new FormData()
        form.append("archivo", comprobanteFile)
        const upload = await financeService.uploadComprobantePago(form)
        comprobanteUrlGlobal = upload?.data?.url || upload?.url || null
      }

      // Si es por método, subimos los archivos individuales que tenga cada método
      const metodosConUrls = await Promise.all(
        metodos.map(async (m) => {
          let urlMetodo = m.comprobante_url || null
          if (porMetodo && m.comprobante_file) {
            const fd = new FormData()
            fd.append("archivo", m.comprobante_file)
            const upload = await financeService.uploadComprobantePago(fd)
            urlMetodo = upload?.data?.url || upload?.url || null
          }
          return {
            ...m,
            final_comprobante_url: porMetodo ? urlMetodo : comprobanteUrlGlobal,
          }
        }),
      )

      await financeService.registrarPagosIniciales({
        matricula_id: matriculaId,
        pagos: pagos.map(({ lp, monto }) => ({
          linea_pago_modulo_id: lp.id,
          monto,
          metodo_pago:
            metodos.find((m) => m.linea_pago_modulo_id === lp.id)?.metodo_pago ||
            metodos[0]?.metodo_pago ||
            "efectivo",
          fecha_pago: new Date().toISOString(),
          comprobante_url:
            comprobanteUrlGlobal || metodosConUrls[0]?.final_comprobante_url || null,
        })),
        metodos_pago: metodosConUrls.map((m) => ({
          linea_pago_modulo_id: m.linea_pago_modulo_id || null,
          metodo_pago: m.metodo_pago,
          monto: parseFloat(m.monto) || 0,
          comprobante_url: m.final_comprobante_url,
          fecha_pago: new Date().toISOString(),
        })),
        grupo_pago_id: grupoPagoId,
        pago_unificado: pagos.length > 1 || metodos.length > 1,
      })

      toast.success("Pago registrado exitosamente")
      navigate(backUrl)
    } catch (err: unknown) {
      const responseData = (err as {
        response?: { data?: { mensaje?: string; ya_procesado?: boolean } }
      })?.response?.data
      const status = (err as { response?: { status?: number } })?.response?.status

      if (responseData?.ya_procesado || status === 409) {
        toast.success("El pago ya fue registrado exitosamente")
        navigate(backUrl)
        return
      }

      const msg = responseData?.mensaje
      toast.error(msg || "Error al registrar pago")
    } finally {
      setSaving(false)
    }
  }

  const modulosConSaldo = sorted.filter((l) => l.monto_ajustado - l.monto_abonado > 0)

  if (loadingLineas) {
    return (
      <div className="flex h-full min-h-[450px] items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">Cargando estado financiero del curso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8fafc] pb-16 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Barra superior de navegación */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(backUrl)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#fd761a] transition-colors py-1 group cursor-pointer"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            <span>{volverUrl ? "Volver al curso" : "Volver al perfil académico"}</span>
          </button>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
            Matrícula: #{matriculaId ? matriculaId.substring(0, 8).toUpperCase() : "MAT"}
          </span>
        </div>

        {/* Ficha del Estudiante y Curso + Tira Financiera de 4 Columnas */}
        <section className={cn("bg-white rounded-2xl border border-slate-200/80 overflow-hidden", CARD_SHADOW)}>
          <div className="p-5 sm:p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <div className="size-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                {getInitials(estudianteNombre)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">
                    {estudianteNombre || "Estudiante"}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                      totalPendiente <= 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : totalAbonado > 0
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        totalPendiente <= 0
                          ? "bg-emerald-500"
                          : totalAbonado > 0
                            ? "bg-amber-500"
                            : "bg-red-500",
                      )}
                    />
                    {totalPendiente <= 0
                      ? "Al día (Pagado)"
                      : totalAbonado > 0
                        ? "Abono Parcial"
                        : "Pendiente de pago"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 truncate">
                  <BookOpen size={14} className="text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">Curso:</span>
                  <span className="truncate">{cursoNombre || "Curso Académico"}</span>
                  {estudianteCedula && (
                    <span className="text-slate-400 font-medium">· CI: {estudianteCedula}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60">
                {modulosConSaldo.length} {modulosConSaldo.length === 1 ? "módulo con saldo" : "módulos con saldo"}
              </span>
            </div>
          </div>

          {/* Franja de Métricas Financieras (4 Columnas Bento) */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50">
            <div className="p-4 sm:px-6 sm:py-3.5 flex flex-col justify-center bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Curso</span>
              <span className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 tracking-tight tabular-nums">
                ${totalAdeudado.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-4 sm:px-6 sm:py-3.5 flex flex-col justify-center bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Abonado</span>
              <span className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5 tracking-tight tabular-nums">
                ${totalAbonado.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-4 sm:px-6 sm:py-3.5 flex flex-col justify-center bg-white">
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  totalPendiente > 0 ? "text-red-500" : "text-emerald-600",
                )}
              >
                Saldo Pendiente
              </span>
              <span
                className={cn(
                  "text-base sm:text-lg font-bold mt-0.5 tracking-tight tabular-nums",
                  totalPendiente > 0 ? "text-red-600" : "text-emerald-600",
                )}
              >
                ${totalPendiente.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-4 sm:px-6 sm:py-3.5 flex flex-col justify-center bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    totalPendiente <= 0
                      ? "bg-emerald-500"
                      : totalAbonado > 0
                        ? "bg-amber-500"
                        : "bg-[#fd761a]",
                  )}
                />
                <span className="text-xs font-bold text-slate-800">
                  {totalPendiente <= 0
                    ? "Pagado completo"
                    : totalAbonado > 0
                      ? "Abono parcial"
                      : "Pendiente de pago"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Estado: Todos los módulos pagados vs Formulario de pago */}
        {totalPendiente <= 0 && sorted.length > 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
            <div className="size-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="text-lg font-bold text-emerald-950 tracking-tight">
              Todos los módulos están completamente pagados
            </h2>
            <p className="text-xs text-emerald-800/80 max-w-md leading-relaxed">
              Este estudiante se encuentra al día con todas las cuotas y módulos del curso. No existen saldos pendientes por recaudar.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate(backUrl)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Volver al perfil académico
              </button>
            </div>
          </div>
        ) : (
          /* Layout de 2 Columnas (65% Formulario / 35% Sidebar Sticky) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda: Módulos, Split de Pago y Comprobante */}
            <div className="lg:col-span-8 space-y-6">
              {/* Sección 1: Distribución por Módulo */}
              <div className={cn("rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 space-y-4", CARD_SHADOW)}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                      Módulos y Conceptos del Curso
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ingresa el valor a pagar en cada módulo según corresponda.
                    </p>
                  </div>
                  {totalPendiente > 0 && (
                    <button
                      type="button"
                      onClick={handlePagarTodo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-xs font-semibold text-[#fd761a] hover:bg-orange-100 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
                    >
                      <Coins size={14} />
                      <span>Pagar todo: ${totalPendiente.toFixed(2)}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {sorted.map((linea) => {
                    const pagado = linea.monto_abonado >= linea.monto_ajustado
                    const esInscripcion = linea.tipo === "inscripcion"
                    const saldo = Math.max(0, linea.monto_ajustado - linea.monto_abonado)
                    const montoModulo = Number.parseFloat(montos[linea.id] || "0")
                    const montoExcedido = montoModulo > saldo + 0.001
                    const tieneMontoIngresado = montoModulo > 0

                    return (
                      <div
                        key={linea.id}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-all",
                          montoExcedido
                            ? "border-red-300 bg-red-50/30"
                            : tieneMontoIngresado
                              ? "border-orange-200 bg-orange-50/20"
                              : "border-slate-200/80 bg-white hover:border-slate-300",
                        )}
                      >
                        {/* Info del módulo */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "size-9 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-2xs",
                              pagado
                                ? "bg-emerald-600"
                                : esInscripcion
                                  ? "bg-slate-900"
                                  : "bg-[#fd761a]",
                            )}
                          >
                            {esInscripcion ? "Insc" : (linea.numero_orden ?? "—")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {esInscripcion ? "Inscripción / Matrícula" : (linea.nombre_modulo || `Módulo ${linea.numero_orden}`)}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>Monto fijado: <strong>${linea.monto_ajustado.toFixed(2)}</strong></span>
                              {linea.monto_abonado > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="text-emerald-700">Abonado: ${linea.monto_abonado.toFixed(2)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Input y Estado */}
                        <div className="shrink-0 flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div>
                            {pagado ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} />
                                Pagado
                              </span>
                            ) : linea.monto_abonado > 0 ? (
                              <div className="text-left sm:text-right">
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 uppercase">
                                  Abonado
                                </span>
                                <p className="text-[10px] font-semibold text-slate-600 mt-0.5">
                                  Saldo: ${saldo.toFixed(2)}
                                </p>
                              </div>
                            ) : (
                              <div className="text-left sm:text-right">
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200/80 uppercase">
                                  Pendiente
                                </span>
                                <p className="text-[10px] font-semibold text-red-600 mt-0.5">
                                  Saldo: ${saldo.toFixed(2)}
                                </p>
                              </div>
                            )}
                          </div>

                          {saldo > 0 && (
                            <div className="flex flex-col items-end">
                              <div className="relative w-28 sm:w-32">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max={saldo}
                                  step="0.01"
                                  value={montos[linea.id] || ""}
                                  onChange={(e) =>
                                    setMontos((prev) => ({ ...prev, [linea.id]: e.target.value }))
                                  }
                                  placeholder={saldo.toFixed(2)}
                                  className={cn(
                                    "w-full rounded-lg border pl-6 pr-2.5 py-1.5 text-xs font-bold text-right outline-none transition-all",
                                    montoExcedido
                                      ? "border-red-400 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-400/20"
                                      : "border-slate-200 bg-slate-50 text-slate-900 focus:border-[#fd761a] focus:bg-white focus:ring-2 focus:ring-[#fd761a]/15",
                                  )}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setMontos((prev) => ({ ...prev, [linea.id]: saldo.toFixed(2) }))
                                }
                                className="mt-1 text-[10px] font-semibold text-[#fd761a] hover:text-[#9d4300] transition-colors cursor-pointer"
                              >
                                Llenar (${saldo.toFixed(2)})
                              </button>

                              {montoExcedido && (
                                <p className="mt-1 max-w-[140px] text-right text-[10px] leading-tight font-semibold text-red-600">
                                  Excede saldo de ${saldo.toFixed(2)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Sección 2: Métodos de Pago */}
              <div className={cn("rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 space-y-4", CARD_SHADOW)}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Métodos de Pago
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Especifica cómo se realizó el pago (efectivo, transferencia, depósito u otros).
                  </p>
                </div>

                <MetodosPagoSplitInput
                  totalEsperado={montoPagoNum}
                  metodos={metodos}
                  onChange={setMetodos}
                  conceptos={conceptos}
                  disabled={saving}
                  permitirComprobantePorMetodo={true}
                  modalidadComprobante={modalidadComprobante}
                  onModalidadComprobanteChange={setModalidadComprobante}
                />
              </div>

              {/* Sección 3: Comprobante General (cuando es modalidad única) */}
              {(!isMultiple || modalidadComprobante === "unico") && (
                <div className={cn("rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 space-y-3", CARD_SHADOW)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                        Comprobante de Pago
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isMultiple
                          ? "Comprobante único para todos los métodos ingresados"
                          : !tieneMetodoNoEfectivo
                            ? "Opcional para pagos en efectivo"
                            : "Adjunta la imagen del comprobante de transferencia o depósito"}
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {comprobantePreview ? (
                    <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50">
                      <img
                        src={comprobantePreview}
                        alt="Comprobante de pago"
                        className="w-full max-h-[300px] object-contain bg-slate-900/5 p-2"
                      />
                      <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-t border-slate-200 bg-white">
                        <span className="text-xs font-semibold text-slate-700 truncate min-w-0">
                          {comprobanteFile?.name || "Comprobante adjuntado"}
                        </span>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            Cambiar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (comprobantePreview) URL.revokeObjectURL(comprobantePreview)
                              setComprobanteFile(null)
                              setComprobantePreview(null)
                            }}
                            className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col sm:flex-row items-center gap-3 p-5 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[#fd761a] hover:bg-orange-50/20 transition-all text-center sm:text-left"
                    >
                      <div className="size-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <Upload size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">
                          Haz clic para subir la imagen del comprobante
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Formatos aceptados: JPG, PNG o WEBP. Máximo 20MB.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Columna Derecha: Sidebar Sticky de Resumen y Confirmación */}
            <div className="lg:col-span-4 sticky top-6 space-y-4">
              <div className={cn("rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 space-y-5", CARD_SHADOW)}>
                {/* Header del resumen */}
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#fd761a] border border-orange-100">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Resumen del Cobro
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Verificación en tiempo real
                    </p>
                  </div>
                </div>

                {/* Importe a pagar */}
                <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total a Registrar
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
                      ${montoPagoNum.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Distribuido en {cuentaAfectadas} {cuentaAfectadas === 1 ? "módulo" : "módulos"}
                  </p>
                </div>

                {/* Estado de balance / cuadre */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Saldo pendiente actual:</span>
                    <span className="font-semibold text-slate-900">${totalPendiente.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Saldo restante proyectado:</span>
                    <span className="font-bold text-slate-900">${saldoRestanteProyectado.toFixed(2)}</span>
                  </div>

                  {/* Barra de progreso global */}
                  <div className="pt-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                      <span>Progreso de pago del curso</span>
                      <span className="font-bold text-slate-900">{pctPagado}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${pctPagado}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Cuadre de métodos de pago */}
                <div className="rounded-xl border p-3 text-xs space-y-1.5 bg-slate-50/50">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-500">Suma de métodos:</span>
                    <span
                      className={cn(
                        "tabular-nums font-bold",
                        metodosCuadran ? "text-emerald-700" : "text-amber-700",
                      )}
                    >
                      ${(sumaMetodosCentavos / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    {metodosCuadran ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 size={13} />
                        Métodos balanceados correctamente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                        <AlertCircle size={13} />
                        Diferencia: ${(montoPagoNum - sumaMetodosCentavos / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Avisos contextuales */}
                <div className="text-xs">
                  {montoPagoNum <= 0 ? (
                    <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 p-2.5 text-amber-800 border border-amber-200/70">
                      <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                      <span>Ingresa el monto a pagar en al menos un módulo</span>
                    </div>
                  ) : hayMontoExcedido ? (
                    <div className="flex items-start gap-1.5 rounded-lg bg-red-50 p-2.5 text-red-800 border border-red-200/70">
                      <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-600" />
                      <span>Un monto ingresado supera el saldo pendiente</span>
                    </div>
                  ) : !tieneComprobante ? (
                    <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 p-2.5 text-amber-800 border border-amber-200/70">
                      <FileText size={14} className="shrink-0 mt-0.5 text-amber-600" />
                      <span>Debes adjuntar la imagen del comprobante de pago</span>
                    </div>
                  ) : !metodosCuadran ? (
                    <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 p-2.5 text-amber-800 border border-amber-200/70">
                      <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                      <span>La suma de métodos debe coincidir con el total a pagar</span>
                    </div>
                  ) : null}
                </div>

                {/* Botones de acción */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleRegistrar}
                    disabled={!puedePagar}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#fd761a] px-4 py-3 text-xs font-bold text-white shadow-xs transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Registrando pago...</span>
                      </>
                    ) : (
                      <>
                        <Coins size={16} />
                        <span>
                          {montoPagoNum > 0
                            ? `Registrar Pago: $${montoPagoNum.toFixed(2)}`
                            : "Registrar Pago"}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(backUrl)}
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
