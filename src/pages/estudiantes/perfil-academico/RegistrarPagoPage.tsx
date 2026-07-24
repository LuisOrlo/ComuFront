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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          to={`/estudiantes/${estudianteId}/academico?tab=financiero`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          Volver al perfil académico
        </Link>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b bg-gray-50/50">
          <h2 className="text-xl font-black text-gray-900">Registrar pago</h2>
          <p className="text-sm text-gray-500 mt-1">{cursoNombre || "Curso"}</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
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

          <div className="grid grid-cols-3 gap-4 p-5 rounded-2xl border border-gray-200 bg-white">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</span>
              <p className="text-2xl font-black text-gray-900 mt-1">${totalAdeudado.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pagado</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">${totalAbonado.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pendiente</span>
              <p className={`text-2xl font-black mt-1 ${totalPendiente > 0 ? "text-red-500" : "text-gray-500"}`}>
                ${totalPendiente.toLocaleString()}
              </p>
            </div>
          </div>

          {loadingLineas ? (
            <div className="flex items-center justify-center py-12">
              <div className="size-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <span className="ml-3 text-sm text-gray-500">Cargando módulos...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">Módulos</span>
              {sorted.map((linea) => {
                const pagado = linea.monto_abonado >= linea.monto_ajustado
                const esInscripcion = linea.tipo === "inscripcion"
                return (
                  <div
                    key={linea.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="size-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-black text-white"
                        style={{ backgroundColor: pagado ? "#10b981" : COLORS.ACCENT }}
                      >
                        {esInscripcion ? "Insc" : (linea.numero_orden ?? "—")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {esInscripcion ? "Inscripción / Matrícula" : (linea.nombre_modulo || "")}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          ${linea.monto_ajustado.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${
                        pagado
                          ? "bg-emerald-100 text-emerald-700"
                          : linea.monto_abonado > 0
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {pagado
                        ? "Pagado"
                        : linea.monto_abonado > 0
                          ? `Abonado $${(linea.monto_ajustado - linea.monto_abonado).toLocaleString()}`
                          : `Pendiente $${linea.monto_ajustado.toLocaleString()}`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="p-5 rounded-2xl border-2 border-blue-100 bg-blue-50/40 space-y-3">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Monto a pagar</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                max={totalPendiente}
                placeholder={`0.00 (máx $${totalPendiente.toLocaleString()})`}
                value={montoPago}
                onChange={e => setMontoPago(e.target.value)}
                className="w-full pl-10 pr-4 py-4 border-2 border-blue-200 rounded-2xl text-xl font-black font-mono outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-white"
              />
            </div>
            {montoPagoNum > totalPendiente && (
              <p className="text-xs text-red-500 font-medium">
                El monto excede el saldo pendiente (${totalPendiente.toLocaleString()})
              </p>
            )}
            {montoPagoNum > 0 && montoPagoNum <= totalPendiente && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <span>Se aplicará a{" "}
                  {(() => {
                    let count = 0
                    let resto = montoPagoNum
                    for (const lp of sorted) {
                      const saldo = lp.monto_ajustado - lp.monto_abonado
                      if (saldo > 0 && resto > 0) {
                        count++
                        resto -= Math.min(resto, saldo)
                      }
                    }
                    return count
                  })()}{" "}
                  módulo(s)
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">
              Método de pago
            </label>
            <select
              value={metodoPago}
              onChange={e => setMetodoPago(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all bg-white"
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
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {comprobantePreview ? (
                <>
                  <img src={comprobantePreview} alt="Comprobante" className="size-14 rounded-xl object-cover border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{comprobanteFile?.name}</p>
                    <p className="text-xs text-gray-400">Toca para cambiar archivo</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setComprobanteFile(null); setComprobantePreview(null) }}
                    className="text-xs font-bold text-red-400 hover:text-red-600"
                  >
                    Eliminar
                  </button>
                </>
              ) : (
                <>
                  <div className="size-14 rounded-xl bg-gray-100 flex items-center justify-center">
                    <HugeiconsIcon icon={UploadIcon} size={22} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600">Subir foto del comprobante</p>
                    <p className="text-xs text-gray-400">Máximo 5MB, formato JPG o PNG</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link
              to={`/estudiantes/${estudianteId}/academico?tab=financiero`}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="button"
              onClick={handleRegistrar}
              disabled={saving || montoPagoNum <= 0}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
  )
}
