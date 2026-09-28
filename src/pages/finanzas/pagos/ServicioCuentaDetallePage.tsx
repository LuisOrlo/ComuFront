/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useLocation, useNavigate } from "react-router"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  AiFolderIcon,
  Money02Icon,
  Money01Icon,
  Clock01Icon,
  CheckmarkCircle04Icon,
  Download01Icon,
  UserIcon,
  CallIcon,
  Mail01Icon,
  IdIcon,
  Location01Icon,
  EyeIcon,
  Cancel01Icon,
  Calendar02Icon,
} from "@hugeicons/core-free-icons"
import { cn, getStorageUrl } from "@/lib/utils"
import { toast } from "sonner"
import { financeService } from "@/services/finance.service"
import { generarCuentaServicioPDF } from "@/lib/generarPagosCuentaPDF"

const SERVICIO_FKS = [
  "reserva_podcast_id",
  "reserva_aula_id",
  "alquiler_equipo_id",
  "edicion_video_id",
  "reserva_radio_id",
]

const FK_TO_TIPO: Record<string, string> = {
  reserva_podcast_id: "podcast",
  reserva_aula_id: "aula",
  alquiler_equipo_id: "equipo",
  edicion_video_id: "edicion",
  reserva_radio_id: "radio",
}

const TIPO_TO_BACKEND: Record<string, string> = {
  aula: "aula",
  podcast: "podcast",
  equipo: "equipo",
  edicion: "edicion",
  radio: "radio",
}

const TIPO_BADGE: Record<string, string> = {
  "Podcast": "bg-blue-50 text-blue-700 border-blue-200/60",
  "Aula": "bg-violet-50 text-violet-700 border-violet-200/60",
  "Equipo": "bg-amber-50 text-amber-700 border-amber-200/60",
  "Edición de Video": "bg-orange-50 text-orange-700 border-orange-200/60",
  "Radio": "bg-pink-50 text-pink-700 border-pink-200/60",
  "Streaming": "bg-teal-50 text-teal-700 border-teal-200/60",
  "Producción": "bg-lime-50 text-lime-700 border-lime-200/60",
  "Clase Extra": "bg-cyan-50 text-cyan-700 border-cyan-200/60",
  "Asesoría": "bg-yellow-50 text-yellow-700 border-yellow-200/60",
  "Servicio": "bg-slate-50 text-slate-700 border-slate-200",
}

function getInfoServicio(entry: any): { tipo: string; servicioId: string } | null {
  for (const fk of SERVICIO_FKS) {
    if (entry[fk]) return { tipo: FK_TO_TIPO[fk], servicioId: entry[fk] }
  }
  if (entry.tipo && entry.id && TIPO_TO_BACKEND[entry.tipo]) {
    return { tipo: TIPO_TO_BACKEND[entry.tipo], servicioId: entry.id }
  }
  return null
}

function getEntidadCliente(entry: any): { persona?: any; clienteExterno?: any } | null {
  if (!entry) return null
  for (const k of ["reserva_podcast", "reserva_aula", "alquiler_equipo", "reserva_radio"]) {
    const rel = entry[k]
    if (rel?.persona || rel?.cliente_externo) {
      return { persona: rel.persona, clienteExterno: rel.cliente_externo }
    }
  }
  if (entry.edicion_video?.cliente || entry.edicion_video?.cliente_externo) {
    return { persona: entry.edicion_video.cliente, clienteExterno: entry.edicion_video.cliente_externo }
  }
  if (entry.persona || entry.cliente_externo) {
    return { persona: entry.persona, clienteExterno: entry.cliente_externo }
  }
  return null
}

function getClienteContacto(entry: any) {
  const ent = getEntidadCliente(entry)
  const p = ent?.persona
  const c = ent?.clienteExterno
  return {
    telefono: p?.celular || c?.celular || "",
    email: p?.correo || c?.correo || "",
    cedula: p?.cedula || c?.cedula || "",
    ciudad: p?.ciudad || c?.ciudad || "",
    direccion: c?.direccion || "",
  }
}

export function ServicioCuentaDetallePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdmin } = usePermission()
  const state = location.state as any

  const [transacciones, setTransacciones] = useState<any[]>([])
  const [loadingHist, setLoadingHist] = useState(false)
  const [modalImage, setModalImage] = useState<string | null>(null)

  const entry = state?.entry
  const esCuentaCobrar = entry?._origen === "cuenta_cobrar" || Boolean(entry?.cuenta_cobrar_id)
  const cuentaId = esCuentaCobrar ? (entry?.cuenta_cobrar_id || entry?.id) : null
  const infoServicio = !cuentaId ? getInfoServicio(entry) : null

  useEffect(() => {
    if (!cuentaId) return
    let active = true
    setLoadingHist(true)
    financeService
      .getCuentaDetalle(cuentaId)
      .then((res) => {
        if (active) setTransacciones(res?.transacciones ?? [])
      })
      .catch(() => {
        if (active) toast.error("Error al cargar el historial de pagos")
      })
      .finally(() => {
        if (active) setLoadingHist(false)
      })
    return () => {
      active = false
    }
  }, [cuentaId])

  if (!state || !entry) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate("/finanzas/pagos/cuentas/servicios")}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
          <span>Volver a Servicios</span>
        </button>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <p className="text-sm font-medium text-slate-400">
            Servicio no encontrado o enlace caducado
          </p>
        </div>
      </div>
    )
  }

  const { tipo, name, cliente, total, cobrado, saldo } = state
  const puedePagar = Boolean(cuentaId || infoServicio)
  const numTotal = Number(total || 0)
  const numCobrado = Number(cobrado || 0)
  const numSaldo = Number(saldo || 0)
  const pagado = numSaldo <= 0
  const pctCobrado = numTotal > 0 ? (numCobrado / numTotal) * 100 : 0
  const nombreServicio = name && name !== "—" ? name : tipo || "Servicio"
  const contacto = getClienteContacto(entry)

  const handleRegistrarPago = () => {
    if (cuentaId) {
      navigate(`/finanzas/pagos/cuentas/servicios/pago/${cuentaId}`, {
        state: { cuentaId, nombre: cliente, montoTotal: total, montoSaldo: saldo, nombreServicio },
      })
    } else if (infoServicio) {
      navigate(`/finanzas/pagos/cuentas/servicios/pago/${infoServicio.servicioId}`, {
        state: { tipo: infoServicio.tipo, servicioId: infoServicio.servicioId, nombre: cliente, montoTotal: total, montoSaldo: saldo, nombreServicio },
      })
    }
  }

  const handleExportPDF = () => {
    try {
      generarCuentaServicioPDF({
        nombre: nombreServicio,
        tipo,
        cliente,
        contacto,
        total,
        cobrado,
        saldo,
        transacciones,
      })
      toast.success("PDF exportado correctamente")
    } catch {
      toast.error("Error al exportar el PDF")
    }
  }

  const itemsContacto = [
    { label: "Teléfono", value: contacto.telefono, icon: CallIcon },
    { label: "Correo electrónico", value: contacto.email, icon: Mail01Icon },
    { label: "Cédula", value: contacto.cedula, icon: IdIcon },
    { label: "Ciudad", value: contacto.ciudad, icon: Location01Icon },
    { label: "Dirección", value: contacto.direccion, icon: Location01Icon },
  ]
  const tieneContacto = itemsContacto.some((i) => i.value)

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <button
        type="button"
        onClick={() => navigate("/finanzas/pagos/cuentas/servicios")}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
        <span>Volver a Servicios</span>
      </button>

      {/* Ficha Principal del Servicio */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-6"
      >
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fd761a] shrink-0">
              <HugeiconsIcon icon={AiFolderIcon} size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={cn(
                    "inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md border",
                    TIPO_BADGE[tipo || "Servicio"] || "bg-slate-50 text-slate-700 border-slate-200"
                  )}
                >
                  {tipo || "Servicio"}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                  <HugeiconsIcon icon={UserIcon} size={13} className="text-slate-400" />
                  {cliente || "Cliente no especificado"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {nombreServicio}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-xs active:scale-[0.98]"
            >
              <HugeiconsIcon icon={Download01Icon} size={15} className="text-slate-500" />
              <span>Exportar PDF</span>
            </button>
            {isAdmin && puedePagar && (
              <button
                type="button"
                onClick={handleRegistrarPago}
                disabled={pagado}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#e06512] transition-all shadow-xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={15} />
                <span>{pagado ? "Cuenta Saldada" : "Registrar cobro"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Desglose Financiero */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-xs">
              <HugeiconsIcon icon={Money02Icon} size={17} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Esperado</p>
              <p className="text-sm sm:text-base font-black text-slate-900">${numTotal.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={17} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80">Cobrado / Abonado</p>
              <p className="text-sm sm:text-base font-black text-emerald-700">${numCobrado.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-100/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
              <HugeiconsIcon icon={Clock01Icon} size={17} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600/80">Saldo Pendiente</p>
              <p className="text-sm sm:text-base font-black text-rose-700">${numSaldo.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  pagado
                    ? "bg-emerald-500 ring-2 ring-emerald-200"
                    : numCobrado > 0
                    ? "bg-amber-500 ring-2 ring-amber-200"
                    : "bg-rose-500 ring-2 ring-rose-200"
                )}
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado de Cuenta</p>
              <p
                className={cn(
                  "text-xs sm:text-sm font-black",
                  pagado ? "text-emerald-700" : numCobrado > 0 ? "text-amber-700" : "text-rose-700"
                )}
              >
                {pagado ? "Completamente Pagado" : numCobrado > 0 ? "Cobro Parcial" : "Pendiente de Pago"}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Progreso de Recaudación */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-semibold">Avance de recaudación</span>
            <div className="flex items-center gap-2 font-bold">
              <span className="text-slate-900">{Math.round(pctCobrado)}%</span>
              <span className="text-slate-400 font-normal">
                (${numCobrado.toLocaleString()} de ${numTotal.toLocaleString()})
              </span>
            </div>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                pctCobrado >= 100
                  ? "bg-emerald-500"
                  : pctCobrado >= 50
                  ? "bg-amber-500"
                  : "bg-[#fd761a]"
              )}
              style={{ width: `${Math.min(pctCobrado, 100)}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Grid de 2 Columnas: Datos del Cliente e Historial de Pagos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Cliente (1 Columna) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center">
              <HugeiconsIcon icon={UserIcon} size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Información del Cliente</h3>
              <p className="text-[11px] text-slate-400">Datos de contacto registrados</p>
            </div>
          </div>

          {tieneContacto ? (
            <div className="space-y-3.5 pt-1">
              {itemsContacto.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                    <HugeiconsIcon icon={item.icon} size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                    <p className="text-xs font-semibold text-slate-800 break-words">{item.value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <HugeiconsIcon icon={UserIcon} size={18} />
              </div>
              <p className="text-xs font-semibold text-slate-600">Sin datos de contacto</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No se especificó teléfono ni dirección</p>
            </div>
          )}
        </motion.div>

        {/* Historial de Pagos (2 Columnas) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HugeiconsIcon icon={Money01Icon} size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Historial de Pagos</h3>
                <p className="text-[11px] text-slate-400">Transacciones y comprobantes recibidos</p>
              </div>
            </div>
            {transacciones.length > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {transacciones.length} pago{transacciones.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loadingHist ? (
            <div className="py-12 text-center text-xs font-medium text-slate-400">
              Cargando historial de pagos...
            </div>
          ) : transacciones.length > 0 ? (
            <div className="space-y-2.5">
              {transacciones.map((t: any, idx: number) => {
                const esAprobado = t.estado_verificacion === "aprobado"
                const esRechazado = t.estado_verificacion === "rechazado"
                return (
                  <div
                    key={t.id || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                          esAprobado
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                            : esRechazado
                            ? "bg-rose-50 border-rose-200 text-rose-600"
                            : "bg-amber-50 border-amber-200 text-amber-600"
                        )}
                      >
                        <HugeiconsIcon icon={Money01Icon} size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-slate-900">
                            ${Number(t.monto || 0).toLocaleString()}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                              esAprobado
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : esRechazado
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            )}
                          >
                            {esAprobado ? "Verificado" : esRechazado ? "Rechazado" : "Pendiente"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <HugeiconsIcon icon={Calendar02Icon} size={12} className="text-slate-400" />
                            {t.fecha_pago
                              ? new Date(t.fecha_pago).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "Fecha no registrada"}
                          </span>
                          {t.metodo_pago && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="font-medium text-slate-600">{t.metodo_pago}</span>
                            </>
                          )}
                          {t.referencia && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400 font-mono text-[11px]">Ref: {t.referencia}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {t.comprobante_url && (
                      <button
                        type="button"
                        onClick={() => setModalImage(getStorageUrl(t.comprobante_url))}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all shrink-0 self-start sm:self-center shadow-xs"
                      >
                        <HugeiconsIcon icon={EyeIcon} size={14} className="text-slate-500" />
                        <span>Ver comprobante</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <HugeiconsIcon icon={Money01Icon} size={18} />
              </div>
              <p className="text-xs font-semibold text-slate-600">Sin pagos registrados</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Los pagos y abonos registrados para este servicio aparecerán aquí
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal de Comprobante de Pago */}
      <AnimatePresence>
        {modalImage && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setModalImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                <h4 className="text-sm font-bold text-slate-900">Comprobante de Pago</h4>
                <button
                  type="button"
                  onClick={() => setModalImage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>
              <div className="p-4 flex items-center justify-center bg-slate-900/5 max-h-[80vh] overflow-auto">
                <img
                  src={modalImage}
                  alt="Comprobante de pago"
                  className="max-w-full max-h-[72vh] w-auto h-auto object-contain rounded-lg shadow-xs"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
