/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { motion } from "motion/react"
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
  Tick02Icon,
  CallIcon,
  Mail01Icon,
  IdIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn, getStorageUrl } from "@/lib/utils"
import { toast } from "sonner"
import { financeService } from "@/services/finance.service"
import { generarCuentaServicioPDF } from "@/lib/generarPagosCuentaPDF"
import { HealthBar } from "./sections/HealthBar"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

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
  "Podcast": "bg-blue-50 text-blue-700",
  "Aula": "bg-violet-50 text-violet-700",
  "Equipo": "bg-amber-50 text-amber-700",
  "Edición de Video": "bg-orange-50 text-orange-700",
  "Radio": "bg-pink-50 text-pink-700",
  "Streaming": "bg-teal-50 text-teal-700",
  "Producción": "bg-lime-50 text-lime-700",
  "Clase Extra": "bg-cyan-50 text-cyan-700",
  "Asesoría": "bg-yellow-50 text-yellow-700",
  "Servicio": "bg-gray-50 text-gray-700",
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
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <p className="text-sm font-medium opacity-40" style={{ color: CHARCOAL }}>
            Servicio no encontrado
          </p>
        </div>
      </div>
    )
  }

  const { tipo, name, cliente, total, cobrado, saldo } = state
  const puedePagar = Boolean(cuentaId || infoServicio)
  const pagado = Number(saldo || 0) <= 0
  const nombreServicio = name && name !== "—" ? name : tipo || "Servicio"
  const contacto = getClienteContacto(entry)

  const handleRegistrarPago = () => {
    if (cuentaId) {
      navigate(`/finanzas/pagos/cuentas/servicios/pago/${cuentaId}`, {
        state: { cuentaId, nombre: cliente, montoTotal: total, montoSaldo: saldo, nombreServicio: nombreServicio },
      })
    } else if (infoServicio) {
      navigate(`/finanzas/pagos/cuentas/servicios/pago/${infoServicio.servicioId}`, {
        state: { tipo: infoServicio.tipo, servicioId: infoServicio.servicioId, nombre: cliente, montoTotal: total, montoSaldo: saldo, nombreServicio: nombreServicio },
      })
    }
  }

  const handleExportPDF = () => {
    try {
      generarCuentaServicioPDF({ nombre: nombreServicio, cliente, total, cobrado, saldo, transacciones })
      toast.success("PDF exportado")
    } catch {
      toast.error("Error al exportar PDF")
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
    <div className="px-8 py-6">
      <button
        onClick={() => navigate("/finanzas/pagos/cuentas/servicios")}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all mb-4"
        style={{ color: CHARCOAL }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver a Servicios
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div
          className="rounded-2xl border bg-white p-6"
          style={{ borderColor: BORDER }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.95 0.01 45)" }}>
                <HugeiconsIcon icon={AiFolderIcon} size={22} style={{ color: ACCENT }} />
              </div>
              <div className="min-w-0">
                <span className={cn(
                  "inline-block text-[10px] font-bold px-2 py-0.5 rounded mb-1",
                  TIPO_BADGE[tipo || "Servicio"] || "bg-gray-50 text-gray-700"
                )}>
                  {tipo || "Servicio"}
                </span>
                <h2 className="text-xl font-black truncate" style={{ color: CHARCOAL }}>
                  {nombreServicio}
                </h2>
                <p className="text-xs opacity-50 mt-0.5 flex items-center gap-1.5">
                  <HugeiconsIcon icon={UserIcon} size={12} style={{ color: MUTED }} />
                  {cliente || "Cliente"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}
              >
                <HugeiconsIcon icon={Download01Icon} size={14} />
                Exportar PDF
              </button>
              {isAdmin && puedePagar && (
                <button
                  onClick={handleRegistrarPago}
                  disabled={pagado}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                  style={{ backgroundColor: ACCENT }}
                >
                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} />
                  Registrar pago
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <InfoBadge icon={Money02Icon} label="Total esperado" value={`$${(total || 0).toLocaleString()}`} />
            <InfoBadge icon={CheckmarkCircle04Icon} label="Abonado" value={`$${(cobrado || 0).toLocaleString()}`} />
            <InfoBadge icon={Clock01Icon} label="Saldo pendiente" value={`$${(saldo || 0).toLocaleString()}`} />
            <EstadoBadge saldo={Number(saldo || 0)} cobrado={Number(cobrado || 0)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>
                Avance de cobro
              </p>
              <span className="text-[10px] font-bold" style={{ color: CHARCOAL }}>
                {Math.round((Number(total || 0) > 0 ? (Number(cobrado || 0) / Number(total)) * 100 : 0))}%
              </span>
            </div>
            <HealthBar recaudado={Number(cobrado || 0)} total={Number(total || 0)} />
          </div>
        </div>

        <div
          className="rounded-2xl border bg-white p-4 sm:p-6"
          style={{ borderColor: BORDER }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4 sm:mb-5 flex items-center gap-2" style={{ color: MUTED }}>
            <HugeiconsIcon icon={Money01Icon} size={14} />
            Historial de Pagos
          </h3>
          {loadingHist ? (
            <p className="text-xs font-medium opacity-50 py-6 text-center" style={{ color: CHARCOAL }}>
              Cargando pagos...
            </p>
          ) : transacciones.length > 0 ? (
            <div className="space-y-3">
              {transacciones.map((t: any, idx: number) => (
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
                        ${Number(t.monto || 0).toLocaleString()}
                      </span>
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
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <HugeiconsIcon icon={Money01Icon} size={18} style={{ color: MUTED }} />
              <p className="text-xs font-medium opacity-50 mt-2" style={{ color: CHARCOAL }}>
                Sin pagos registrados
              </p>
              <p className="text-[10px] opacity-40 mt-0.5" style={{ color: CHARCOAL }}>
                Los pagos de este servicio aparecerán aquí.
              </p>
            </div>
          )}
        </div>

        <div
          className="rounded-2xl border bg-white p-4 sm:p-6"
          style={{ borderColor: BORDER }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4 sm:mb-5 flex items-center gap-2" style={{ color: MUTED }}>
            <HugeiconsIcon icon={UserIcon} size={14} />
            Información del cliente
          </h3>
          {tieneContacto ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {itemsContacto.map((item) => (
                <div key={item.label} className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.95 0.01 45)" }}>
                    <HugeiconsIcon icon={item.icon} size={15} style={{ color: ACCENT }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase opacity-40">{item.label}</p>
                    <p className="text-xs font-bold truncate" style={{ color: CHARCOAL }}>
                      {item.value || "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <HugeiconsIcon icon={UserIcon} size={18} style={{ color: MUTED }} />
              <p className="text-xs font-medium opacity-50 mt-2" style={{ color: CHARCOAL }}>
                Sin datos de contacto
              </p>
            </div>
          )}
        </div>
      </motion.div>

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

function InfoBadge({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: CHARCOAL }}>
      <HugeiconsIcon icon={Icon} size={14} style={{ color: MUTED }} />
      <div>
        <p className="text-[9px] font-bold uppercase opacity-40">{label}</p>
        <p className="text-xs font-bold">{value}</p>
      </div>
    </div>
  )
}

function EstadoBadge({ saldo, cobrado }: { saldo: number; cobrado: number }) {
  const pagado = saldo <= 0
  return (
    <div className="flex items-center gap-2" style={{ color: CHARCOAL }}>
      <span className={cn(
        "size-2 rounded-full shrink-0",
        pagado ? "bg-green-500" : cobrado > 0 ? "bg-amber-500" : "bg-red-500"
      )} />
      <div>
        <p className="text-[9px] font-bold uppercase opacity-40">Estado</p>
        <span className={cn(
          "text-xs font-bold",
          pagado ? "text-green-700" : cobrado > 0 ? "text-amber-700" : "text-red-700"
        )}>
          {pagado ? "Pagado" : cobrado > 0 ? "Parcial" : "Pendiente"}
        </span>
      </div>
    </div>
  )
}
