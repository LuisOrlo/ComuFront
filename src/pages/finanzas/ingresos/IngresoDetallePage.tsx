import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  Money02Icon,
  Calendar03Icon,
  UserIcon,
  InvoiceIcon,
  Payment02Icon,
  BanknoteArrowDownIcon,
  AiFolderIcon,
  Image01Icon,
  CheckmarkCircle04Icon,
  Alert02Icon,
  Clock01Icon,
  Copy01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import {
  ExternalLink,
  Eye,
  ShieldCheck,
  Layers,
  FileText,
  AlertCircle,
} from "lucide-react"
import { getStorageUrl } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { ImageZoom } from "@/pages/matriculas/ImageZoom"
import { toast } from "sonner"

export function IngresoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [zoomImg, setZoomImg] = useState<string | null>(null)
  const [copiedRef, setCopiedRef] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    financeService
      .getTransaccionDetalle(id)
      .then((res) => setData(res.datos || res.data || res))
      .catch(() => toast.error("Error al cargar detalle del ingreso"))
      .finally(() => setLoading(false))
  }, [id])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedRef(true)
    toast.success("Referencia copiada al portapapeles")
    setTimeout(() => setCopiedRef(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center py-32 bg-[#f8f9ff] text-slate-400 space-y-3">
        <div className="animate-spin size-9 border-[3px] border-t-transparent rounded-full border-emerald-500" />
        <p className="text-xs font-semibold text-slate-500">
          Cargando comprobante de ingreso...
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
          Registro no encontrado
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
          No pudimos localizar la transacción solicitada o ha sido removida del sistema contable.
        </p>
        <button
          onClick={() => navigate("/finanzas/ingresos")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={15} />
          <span>Volver a Ingresos</span>
        </button>
      </div>
    )
  }

  const estado = data.estado_verificacion
  const isVerificado = estado === "verificado" || estado === "aprobado"
  const isRechazado = estado === "rechazado"
  const isPendiente = !isVerificado && !isRechazado

  const fechaPagoFormateada = data.fecha_pago
    ? new Date(data.fecha_pago).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—"

  const comprobanteUrl = data.comprobante_url ? getStorageUrl(data.comprobante_url) : null

  const getTitularNombre = () => {
    if (data?.estudiante_nombre) return data.estudiante_nombre
    const cp = data?.cuenta_por_cobrar
    if (!cp) return "—"
    const candidates = [
      cp.matricula?.estudiante,
      cp.solicitud_inscripcion?.estudiante,
      cp.solicitud_inscripcion?.participante_externo,
      cp.inscripcion_taller,
      cp.reserva_podcast?.persona,
      cp.reserva_podcast?.cliente_externo,
      cp.reserva_aula?.persona,
      cp.reserva_aula?.cliente_externo,
      cp.alquiler_equipo?.persona,
      cp.alquiler_equipo?.cliente_externo,
      cp.reserva_radio?.persona,
      cp.reserva_radio?.cliente_externo,
      cp.edicion_video?.cliente,
      cp.edicion_video?.cliente_externo,
    ]
    for (const c of candidates) {
      if (c?.nombre_mostrado) return c.nombre_mostrado
      if (c?.nombre_empresa && c?.tipo_cliente === "empresa") return c.nombre_empresa
      if (c?.nombres || c?.apellidos) return `${c.nombres || ""} ${c.apellidos || ""}`.trim()
    }
    return "—"
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16 flex flex-col">
      {/* Header Sticky Contextual */}
      <header className="shrink-0 px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={() => navigate("/finanzas/ingresos")}
              title="Volver a Ingresos"
              className="size-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs transition-all active:scale-[0.98] shrink-0 cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={18} className="text-slate-500" />
            </button>

            <div className="size-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Money02Icon} size={22} />
            </div>

            <div className="min-w-0">
              
              
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate mt-0.5">
                Comprobante de Ingreso
              </h1>
            </div>
          </div>

          {/* Action & Verification Status Badge */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
            {isVerificado && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={15} className="text-emerald-600" />
                <span>Verificado</span>
              </span>
            )}
            {isPendiente && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                <HugeiconsIcon icon={Clock01Icon} size={15} className="text-amber-600" />
                <span>Pendiente de Verificación</span>
              </span>
            )}
            {isRechazado && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                <HugeiconsIcon icon={Alert02Icon} size={15} className="text-rose-600" />
                <span>Rechazado</span>
              </span>
            )}

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <FileText size={14} className="text-slate-500" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Banner if Rejected */}
        {isRechazado && data.motivo_rechazo && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-900 shadow-2xs">
            <div className="size-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <HugeiconsIcon icon={Alert02Icon} size={18} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Motivo del Rechazo</p>
              <p className="text-xs text-rose-800 mt-0.5 leading-relaxed font-medium">
                {data.motivo_rechazo}
              </p>
            </div>
          </div>
        )}

        {/* Hero Card: Monto & Resumen Principal */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-5">
            <div className="size-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
              <HugeiconsIcon icon={BanknoteArrowDownIcon} size={32} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Monto Recaudado
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ingreso Efectivo
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
                ${Number(data.monto || 0).toLocaleString("es-EC", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1 capitalize">
                Método: {data.metodo_pago || "No especificado"}
                {data.referencia_pago && (
                  <span className="normal-case text-slate-400 font-normal ml-2">
                    · Ref: <span className="font-mono font-medium text-slate-600">{data.referencia_pago}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Verification meta */}
          <div className="flex flex-col md:items-end justify-center pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 text-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Estado de Auditoría
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              {isVerificado ? (
                <>
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Aprobado en tesorería</span>
                </>
              ) : isRechazado ? (
                <>
                  <AlertCircle size={16} className="text-rose-600" />
                  <span className="text-rose-600">Rechazado</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Clock01Icon} size={16} className="text-amber-500" />
                  <span className="text-amber-700">En revisión</span>
                </>
              )}
            </div>
            {data.verificado_por && (
              <p className="text-[11px] text-slate-400">
                Por: <span className="text-slate-600 font-semibold">{data.verificado_por}</span>
                {data.fecha_verificacion && ` · ${new Date(data.fecha_verificacion).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}`}
              </p>
            )}
          </div>
        </section>

        {/* 2-Column Grid: Details & Comprobante */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Detalle y Desglose (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card: Detalle del Pago */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <HugeiconsIcon icon={InvoiceIcon} size={15} className="text-orange-500" />
                  <span>Información del Ingreso</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {data.id?.substring(0, 13)}...
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                {/* Estudiante / Titular */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HugeiconsIcon icon={UserIcon} size={13} className="text-slate-400" />
                    <span>Estudiante / Cliente</span>
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {getTitularNombre()}
                  </p>
                </div>

                {/* Concepto / Curso */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HugeiconsIcon icon={InvoiceIcon} size={13} className="text-slate-400" />
                    <span>Concepto / Actividad</span>
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {data.curso_nombre || data.concepto || data.taller_nombre || "Servicio general"}
                  </p>
                  {data.modulo_nombre && !data.tiene_multiples_modulos && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Módulo: {data.modulo_nombre}
                    </p>
                  )}
                </div>

                {/* Fecha de Pago */}
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

                {/* Referencia de Pago */}
                {data.referencia_pago && (
                  <div className="sm:col-span-2 space-y-1 pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Referencia / Comprobante Bancario
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-bold font-mono bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200">
                        {data.referencia_pago}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(data.referencia_pago)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                        title="Copiar referencia"
                      >
                        <HugeiconsIcon
                          icon={copiedRef ? Tick02Icon : Copy01Icon}
                          size={13}
                          className={copiedRef ? "text-emerald-600" : "text-slate-400"}
                        />
                        <span>{copiedRef ? "Copiado" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Registrado Por */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HugeiconsIcon icon={AiFolderIcon} size={13} className="text-slate-400" />
                    <span>Registrado en Sistema Por</span>
                  </p>
                  <p className="font-semibold text-slate-700">
                    {data.registrado_por || "Sistema / Automático"}
                  </p>
                </div>

                {/* Tipo de Registro */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Categoría de Transacción
                  </p>
                  <p className="font-semibold text-slate-700">
                    {data.cuenta_por_cobrar ? "Abono a Cuenta por Cobrar" : "Pago Directo"}
                  </p>
                </div>
              </div>

              {/* Observaciones adicionales */}
              {data.observaciones && (
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Notas y Observaciones
                  </p>
                  <p className="text-xs text-slate-600 bg-slate-50/60 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {data.observaciones}
                  </p>
                </div>
              )}
            </section>

            {/* Desglose de Módulos (si incluye múltiples conceptos) */}
            {data.tiene_multiples_modulos && data.modulos && data.modulos.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-[#fd761a]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Desglose de Conceptos Cubiertos
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#fd761a] border border-orange-200">
                    {data.modulos.length} conceptos
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="pb-2">Concepto / Módulo</th>
                        <th className="pb-2">Tipo</th>
                        <th className="pb-2 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {data.modulos.map((m: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-semibold text-slate-800">
                            {m.nombre || m.modulo_nombre || "Concepto académico"}
                          </td>
                          <td className="py-2.5">
                            <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 capitalize">
                              {m.tipo || "módulo"}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-bold text-slate-900">
                            ${Number(m.monto || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 font-bold text-slate-900">
                        <td colSpan={2} className="pt-3 text-right">
                          Total Liquidado:
                        </td>
                        <td className="pt-3 text-right text-sm font-black text-emerald-600">
                          ${Number(data.monto || 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Comprobante Digital (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <HugeiconsIcon icon={Image01Icon} size={15} className="text-blue-500" />
                  <span>Comprobante Adjunto</span>
                </h3>
                {comprobanteUrl && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Archivo Disponible
                  </span>
                )}
              </div>

              {comprobanteUrl ? (
                <div className="space-y-3">
                  <div
                    onClick={() => setZoomImg(comprobanteUrl)}
                    className="relative group rounded-xl border border-slate-200/90 overflow-hidden bg-slate-50/60 cursor-pointer flex items-center justify-center min-h-[260px] max-h-[360px] transition-all hover:border-orange-300"
                  >
                    <img
                      src={comprobanteUrl}
                      alt="Comprobante de ingreso"
                      className="w-full h-full object-contain max-h-[340px] transition-transform duration-300 group-hover:scale-[1.02]"
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
                  </div>
                </div>
              ) : data.comprobante_purgado ? (
                <div className="p-8 rounded-xl border border-amber-200 bg-amber-50/50 text-center space-y-2">
                  <div className="size-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertCircle size={20} />
                  </div>
                  <p className="text-xs font-bold text-amber-900">Comprobante Archivado</p>
                  <p className="text-[11px] text-amber-700 max-w-xs mx-auto">
                    El archivo digital fue purgado de los servidores cumpliendo con la política de retención de archivos.
                  </p>
                </div>
              ) : (
                <div className="p-10 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2">
                  <div className="size-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <HugeiconsIcon icon={Image01Icon} size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Sin Comprobante Adjunto</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    No se subió una captura o recibo digital durante el registro de esta transacción.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Modal Zoom */}
      {zoomImg && <ImageZoom url={zoomImg} onClose={() => setZoomImg(null)} />}
    </div>
  )
}
