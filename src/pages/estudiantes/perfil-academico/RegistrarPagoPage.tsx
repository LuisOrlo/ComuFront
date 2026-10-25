import { useEffect, useRef, useState, useMemo } from "react"
import { useParams, useNavigate, Link, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Coins02Icon, UploadIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"
import { validarComprobante } from "@/lib/file-validators"
import { financeService } from "@/services/finance.service"
import {
  MetodosPagoSplitInput,
  type MetodoPagoItem,
  type ConceptoDestino,
  type ModalidadComprobante,
} from "@/components/finanzas/MetodosPagoSplitInput"

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
          setMontos(Object.fromEntries(rows.map(linea => [linea.id, ""])))
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
    return () => { active = false }
  }, [matriculaId])

  useEffect(() => () => {
    if (comprobantePreview) URL.revokeObjectURL(comprobantePreview)
  }, [comprobantePreview])

  const sorted = [...lineas].sort((a, b) => a.numero_orden - b.numero_orden)

  const conceptos: ConceptoDestino[] = useMemo(() => {
    return sorted
      .filter(l => l.monto_ajustado - l.monto_abonado > 0)
      .map(l => ({
        id: l.id,
        nombre: l.tipo === "inscripcion" ? "Inscripción / Matrícula" : (l.nombre_modulo || `Módulo ${l.numero_orden}`),
        saldo: Math.max(0, l.monto_ajustado - l.monto_abonado),
      }))
  }, [sorted])

  const handleRegistrar = async () => {
    const pagos = sorted
      .map(lp => ({ lp, monto: Number.parseFloat(montos[lp.id] || "0") }))
      .filter(item => item.monto > 0)
    const total = pagos.reduce((sum, item) => sum + item.monto, 0)
    if (total <= 0) {
      toast.error("Ingresa un monto en al menos un módulo")
      return
    }
    const invalid = pagos.find(({ lp, monto }) => monto > lp.monto_ajustado - lp.monto_abonado + 0.001)
    if (invalid) {
      toast.error(`El monto de ${invalid.lp.nombre_modulo} excede su saldo pendiente`)
      return
    }

    const sumaMetodosCentavos = metodos.reduce((acc, m) => acc + Math.round((parseFloat(m.monto) || 0) * 100), 0)
    if (sumaMetodosCentavos !== Math.round(total * 100)) {
      toast.error(`La suma de los métodos ($${(sumaMetodosCentavos / 100).toFixed(2)}) debe coincidir con el total a pagar ($${total.toFixed(2)})`)
      return
    }

    setSaving(true)
    try {
      let comprobanteUrlGlobal: string | null = null
      const isMultiple = metodos.length > 1
      const porMetodo = isMultiple && modalidadComprobante === "por_metodo"

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
        })
      )

      await financeService.registrarPagosIniciales({
        matricula_id: matriculaId,
        pagos: pagos.map(({ lp, monto }) => ({
          linea_pago_modulo_id: lp.id,
          monto,
          metodo_pago: metodos.find(m => m.linea_pago_modulo_id === lp.id)?.metodo_pago || metodos[0]?.metodo_pago || "efectivo",
          fecha_pago: new Date().toISOString(),
          comprobante_url: comprobanteUrlGlobal || metodosConUrls[0]?.final_comprobante_url || null,
        })),
        metodos_pago: metodosConUrls.map((m) => ({
          linea_pago_modulo_id: m.linea_pago_modulo_id,
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
      const msg = (err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje
      toast.error(msg || "Error al registrar pago")
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validarComprobante(file)
    if (err) { toast.error(err); e.target.value = ""; return }
    setComprobanteFile(file)
    if (comprobantePreview) URL.revokeObjectURL(comprobantePreview)
    setComprobantePreview(URL.createObjectURL(file))
  }

  const totalAdeudado = sorted.reduce((s, l) => s + l.monto_ajustado, 0)
  const totalAbonado = sorted.reduce((s, l) => s + l.monto_abonado, 0)
  const totalPendiente = totalAdeudado - totalAbonado
  const montoPagoNum = Object.values(montos).reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0)

  useEffect(() => {
    setMetodos(prev => {
      if (prev.length === 1 && montoPagoNum > 0) {
        const nuevo = montoPagoNum.toFixed(2)
        if (prev[0].monto !== nuevo) {
          return [{ ...prev[0], monto: nuevo }]
        }
      }
      return prev
    })
  }, [montoPagoNum])

  useEffect(() => {
    const tieneAsignaciones = metodos.some(m => !!m.linea_pago_modulo_id)
    if (tieneAsignaciones) {
      setMontos(prev => {
        const nuevosMontos: Record<string, string> = { ...prev }
        sorted.forEach(l => {
          const metodosDeLinea = metodos.filter(m => m.linea_pago_modulo_id === l.id)
          if (metodosDeLinea.length > 0) {
            const sumLinea = metodosDeLinea.reduce((s, m) => s + (parseFloat(m.monto) || 0), 0)
            nuevosMontos[l.id] = sumLinea > 0 ? sumLinea.toFixed(2) : ""
          }
        })
        return nuevosMontos
      })
    }
  }, [metodos, sorted])

  const cuentaAfectadas = Object.values(montos).filter(value => Number.parseFloat(value) > 0).length
  const hayMontoExcedido = sorted.some(linea => Number.parseFloat(montos[linea.id] || "0") > linea.monto_ajustado - linea.monto_abonado + 0.001)
  const isMultiple = metodos.length > 1

  const handlePagarTodo = () => {
    setMontos(Object.fromEntries(sorted.map(linea => [linea.id, String(Math.max(linea.monto_ajustado - linea.monto_abonado, 0))])))
  }

  return (
    <div className="min-h-[100dvh] md:min-h-0 md:p-6">
      <div className="px-4 py-3 md:p-0 mb-3 md:mb-6">
        <Link
          to={backUrl}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          {volverUrl ? "Volver al curso" : "Volver al perfil académico"}
        </Link>
      </div>

      <div className="mx-auto px-4 md:px-0">
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm md:border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="px-6 py-5 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900">Registrar pago</h2>
                <p className="text-sm text-gray-500 mt-0.5 md:mt-1">{cursoNombre || "Curso"}</p>
                <div className="flex items-center gap-2 mt-1 md:hidden text-xs text-gray-500">
                  <span>{estudianteNombre || "—"}</span>
                  {estudianteCedula && <span className="opacity-60">{estudianteCedula}</span>}
                </div>
              </div>
              <div className="flex gap-4 text-center md:shrink-0">
                <div className="hidden md:block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</span>
                  <p className="text-lg font-black text-gray-900">${totalAdeudado.toLocaleString()}</p>
                </div>
                <div className="hidden md:block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pagado</span>
                  <p className="text-lg font-black text-emerald-600">${totalAbonado.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pendiente</span>
                  <p className={`text-lg font-black ${totalPendiente > 0 ? "text-red-500" : "text-gray-500"}`}>
                    ${totalPendiente.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 md:hidden">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</span>
                <p className="text-base font-black text-gray-900">${totalAdeudado.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pagado</span>
                <p className="text-base font-black text-emerald-600">${totalAbonado.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pendiente</span>
                <p className={`text-base font-black ${totalPendiente > 0 ? "text-red-500" : "text-gray-500"}`}>
                  ${totalPendiente.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3 p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Estudiante</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{estudianteNombre || "—"}</p>
                {estudianteCedula && <p className="text-xs text-gray-500">{estudianteCedula}</p>}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Curso</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{cursoNombre || "—"}</p>
                <p className="text-xs text-gray-500">{sorted.length} módulo{sorted.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Distribuir por módulo</span>
                  {totalPendiente > 0 && (
                    <button onClick={handlePagarTodo}
                      className="inline-flex items-center px-3 py-2 rounded-lg border border-orange-300 text-xs font-bold text-orange-700 hover:bg-orange-50 transition-colors">
                      Pagar todo: ${totalPendiente.toLocaleString()}
                    </button>
                  )}
                </div>

                {loadingLineas ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="size-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    <span className="ml-3 text-sm text-gray-500">Cargando módulos...</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {sorted.map((linea) => {
                      const pagado = linea.monto_abonado >= linea.monto_ajustado
                      const esInscripcion = linea.tipo === "inscripcion"
                      const saldo = linea.monto_ajustado - linea.monto_abonado
                      const montoModulo = Number.parseFloat(montos[linea.id] || "0")
                      const montoExcedido = montoModulo > saldo + 0.001
                      return (
                        <div key={linea.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white min-h-[52px] md:min-h-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="size-7 md:size-8 shrink-0 rounded-lg flex items-center justify-center text-[10px] md:text-xs font-black text-white"
                              style={{ backgroundColor: pagado ? "#10b981" : COLORS.ACCENT }}
                            >
                              {esInscripcion ? "Insc" : (linea.numero_orden ?? "—")}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs md:text-sm font-semibold text-gray-800 truncate">
                                {esInscripcion ? "Inscripción / Matrícula" : (linea.nombre_modulo || "")}
                              </p>
                              <p className="text-[10px] md:text-[11px] text-gray-400">
                                ${linea.monto_ajustado.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 ml-2 text-right">
                            {pagado ? (
                              <span className="text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 uppercase">
                                Pagado
                              </span>
                            ) : linea.monto_abonado > 0 ? (
                              <div className="text-right">
                                <span className="text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-700 uppercase">
                                  Abonado
                                </span>
                                <p className="text-[10px] text-gray-600 font-semibold mt-1">${linea.monto_abonado.toLocaleString()} / ${linea.monto_ajustado.toLocaleString()} pagado</p>
                              </div>
                            ) : (
                              <div className="text-right">
                                <span className="text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-500 uppercase">
                                  Pendiente
                                </span>
                                <p className="text-[10px] text-red-700 font-semibold mt-1">Pendiente: ${saldo.toLocaleString()}</p>
                              </div>
                            )}
                            {saldo > 0 && <>
                              <label htmlFor={`monto-${linea.id}`} className="sr-only">Monto para {linea.nombre_modulo}</label>
                              <div className="relative mt-2 w-32 ml-auto">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                <input id={`monto-${linea.id}`} type="number" min="0" max={saldo} step="0.01"
                                  value={montos[linea.id] || ""}
                                  onChange={e => setMontos(prev => ({ ...prev, [linea.id]: e.target.value }))}
                                  placeholder={saldo.toFixed(2)}
                                  aria-invalid={montoExcedido}
                                  className={`w-full pl-5 pr-2 py-1.5 rounded-lg border text-xs font-bold text-right outline-none focus:ring-2 transition-colors ${montoExcedido ? "border-red-500 bg-red-50 text-red-700 focus:border-red-600 focus:ring-red-500/20" : "border-blue-200 focus:border-blue-500 focus:ring-blue-500/10"}`} />
                              </div>
                              <div className="flex justify-end mt-0.5 w-32 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => setMontos(prev => ({ ...prev, [linea.id]: saldo.toFixed(2) }))}
                                  className="text-[10px] text-orange-600 hover:text-orange-800 font-semibold hover:underline cursor-pointer"
                                >
                                  Llenar (${saldo.toFixed(2)})
                                </button>
                              </div>
                              {montoExcedido && <p className="mt-1 max-w-[180px] ml-auto text-[10px] leading-tight text-red-700 font-semibold">El valor ingresado para este módulo supera el saldo pendiente de ${saldo.toLocaleString()}.</p>}
                              <div className="mt-2 w-32 ml-auto h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${Math.min((linea.monto_abonado / linea.monto_ajustado) * 100, 100)}%` }} />
                              </div>
                            </>}
                        </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="p-4 rounded-xl border-2 border-blue-100 bg-blue-50/40 space-y-2">
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total del pago</label>
                  <p className="text-xs text-gray-500">Ingresa cuánto deseas aplicar a cada módulo.</p>
                  <p className={`text-sm font-bold ${montoPagoNum > totalPendiente ? "text-red-700" : "text-blue-700"}`}>
                    ${montoPagoNum.toLocaleString()} de ${totalPendiente.toLocaleString()} pendiente · {cuentaAfectadas} módulo(s)
                  </p>
                  {montoPagoNum > totalPendiente && <p className="text-xs text-red-700 font-medium">El total excede el saldo pendiente.</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
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

                {/* Comprobante general (solo cuando la modalidad es 'unico' o cuando es método único) */}
                {(!isMultiple || modalidadComprobante === "unico") && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">
                      Comprobante de pago {isMultiple ? "(Comprobante único para todos los métodos)" : ""}
                    </label>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    {comprobantePreview ? (
                      <div className="rounded-xl border overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <img
                          src={comprobantePreview}
                          alt="Comprobante"
                          className="w-full max-h-[280px] object-contain bg-gray-50"
                        />
                        <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-t bg-gray-50/50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          <span className="text-xs text-gray-600 truncate min-w-0">{comprobanteFile?.name || "Comprobante seleccionado"}</span>
                          <div className="flex gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
                            >
                              Cambiar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); if (comprobantePreview) URL.revokeObjectURL(comprobantePreview); setComprobanteFile(null); setComprobantePreview(null) }}
                              className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-3 p-4 min-h-[44px] border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                      >
                        <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={UploadIcon} size={20} className="text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-600">Subir foto del comprobante</p>
                          <p className="text-xs text-gray-400">Máximo 5MB, JPG o PNG</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <Link
                to={backUrl}
                className="flex items-center justify-center px-6 py-3 min-h-[44px] rounded-xl md:rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="button"
                onClick={handleRegistrar}
                disabled={saving || montoPagoNum <= 0 || hayMontoExcedido}
                className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl md:rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <HugeiconsIcon icon={Coins02Icon} size={16} />
                {saving
                  ? "Registrando..."
                  : montoPagoNum > 0
                    ? `Pagar $${montoPagoNum.toLocaleString()}`
                    : "Registrar pago"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
