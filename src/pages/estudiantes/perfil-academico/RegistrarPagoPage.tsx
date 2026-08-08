import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate, Link, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Coins02Icon, UploadIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"
import { validarComprobante } from "@/lib/file-validators"
import api from "@/services/auth.service"

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

  const [montoPago, setMontoPago] = useState("")
  const [metodoPago, setMetodoPago] = useState("efectivo")
  const [saving, setSaving] = useState(false)
  const [lineas, setLineas] = useState<LineaPagoData[]>([])
  const [loadingLineas, setLoadingLineas] = useState(true)

  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!matriculaId) return
    let active = true
    const load = async () => {
      try {
        const res = await api.get(`/finanzas/matriculas/${matriculaId}/lineas-pago`)
        if (active) {
          setLineas((res.data.datos?.lineas ?? res.data.datos) || [])
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

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleRegistrar = async () => {
    const total = parseFloat(montoPago || "0")
    if (total <= 0) {
      toast.error("Ingresa un monto para registrar el pago")
      return
    }
    setSaving(true)
    try {
      const comprobanteUrl = comprobanteFile ? await toBase64(comprobanteFile) : null

      const sorted = [...lineas].sort((a, b) => a.numero_orden - b.numero_orden)
      const pendientes = sorted.filter(l => l.monto_abonado < l.monto_ajustado)

      let restante = total
      const pagos: Record<string, unknown>[] = []
      for (const lp of pendientes) {
        if (restante <= 0) break
        const saldo = lp.monto_ajustado - lp.monto_abonado
        const monto = Math.min(restante, saldo)
        pagos.push({
          linea_pago_modulo_id: lp.id,
          monto,
          metodo_pago: metodoPago,
          fecha_pago: new Date().toISOString(),
          comprobante_url: comprobanteUrl,
        })
        restante -= monto
      }

      if (pagos.length === 0) {
        toast.error("Todos los módulos ya están pagados")
        setSaving(false)
        return
      }

      await api.post("/finanzas/pagos-iniciales", {
        matricula_id: matriculaId,
        pagos,
      })

      toast.success("Pago registrado exitosamente")
      navigate(`/estudiantes/${estudianteId}/academico?tab=financiero`)
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
    setComprobantePreview(URL.createObjectURL(file))
  }

  const sorted = [...lineas].sort((a, b) => a.numero_orden - b.numero_orden)
  const totalAdeudado = sorted.reduce((s, l) => s + l.monto_ajustado, 0)
  const totalAbonado = sorted.reduce((s, l) => s + l.monto_abonado, 0)
  const totalPendiente = totalAdeudado - totalAbonado
  const montoPagoNum = parseFloat(montoPago || "0")

  const cuentaAfectadas = (() => {
    let count = 0
    let resto = montoPagoNum
    for (const lp of sorted) {
      const saldo = lp.monto_ajustado - lp.monto_abonado
      if (saldo > 0 && resto > 0) { count++; resto -= Math.min(resto, saldo) }
    }
    return count
  })()

  const handlePagarTodo = () => {
    setMontoPago(String(totalPendiente))
  }

  return (
    <div className="min-h-[100dvh] md:min-h-0 md:p-6">
      <div className="px-4 py-3 md:p-0 mb-3 md:mb-6">
        <Link
          to={`/estudiantes/${estudianteId}/academico?tab=financiero`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          Volver al perfil académico
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

            <div className="md:grid md:grid-cols-[1.2fr_1fr] gap-6 space-y-5 md:space-y-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Distribuir por módulo</span>
                  {totalPendiente > 0 && (
                    <button onClick={handlePagarTodo}
                      className="text-[10px] font-bold text-orange-500 hover:text-orange-600 hover:underline transition-colors">
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
                          <div className="shrink-0 ml-2">
                            {pagado ? (
                              <span className="text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 uppercase">
                                Pagado
                              </span>
                            ) : linea.monto_abonado > 0 ? (
                              <div className="text-right">
                                <span className="text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-700 uppercase">
                                  Abonado
                                </span>
                                <p className="text-[9px] text-red-500 font-bold mt-0.5">${saldo.toLocaleString()}</p>
                              </div>
                            ) : (
                              <div className="text-right">
                                <span className="text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-500 uppercase">
                                  Pendiente
                                </span>
                                <p className="text-[9px] text-red-500 font-bold mt-0.5">${saldo.toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="p-4 rounded-xl border-2 border-blue-100 bg-blue-50/40 space-y-2">
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Monto a pagar</label>
                  <div className="relative">
                    <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-base md:text-lg">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={totalPendiente}
                      placeholder={`0.00 (máx $${totalPendiente.toLocaleString()})`}
                      value={montoPago}
                      onChange={e => setMontoPago(e.target.value)}
                      className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-3 md:py-3.5 min-h-[44px] border-2 border-blue-200 rounded-xl md:rounded-2xl text-base md:text-lg font-black font-mono outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-white"
                    />
                  </div>
                  {montoPagoNum > totalPendiente && (
                    <p className="text-xs text-red-500 font-medium">El monto excede el saldo pendiente (${totalPendiente.toLocaleString()})</p>
                  )}
                  {montoPagoNum > 0 && montoPagoNum <= totalPendiente && (
                    <p className="text-xs text-emerald-600 font-medium">
                      Se aplicará a {cuentaAfectadas} módulo(s)
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">
                    Método de pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={e => setMetodoPago(e.target.value)}
                    className="w-full px-4 py-3 min-h-[44px] border border-gray-200 rounded-xl md:rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all bg-white"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="deposito">Depósito</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">
                    Comprobante de pago
                  </label>
                  {comprobantePreview ? (
                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <img
                        src={comprobantePreview}
                        alt="Comprobante"
                        className="w-full max-h-[280px] object-contain bg-gray-50"
                      />
                      <div className="flex items-center justify-between px-4 py-2.5 border-t bg-gray-50/50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">{comprobanteFile?.name}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
                          >
                            Cambiar
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setComprobanteFile(null); setComprobantePreview(null) }}
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
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
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
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <Link
                to={`/estudiantes/${estudianteId}/academico?tab=financiero`}
                className="flex items-center justify-center px-6 py-3 min-h-[44px] rounded-xl md:rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="button"
                onClick={handleRegistrar}
                disabled={saving || montoPagoNum <= 0}
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
