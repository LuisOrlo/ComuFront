import { useState, useEffect } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Home02Icon, Calendar03Icon, UserIcon,
  Clock01Icon, Money01Icon, CheckmarkCircle04Icon,
  ViewIcon, InformationCircleIcon,
  Mail01Icon, CallIcon, IdentificationIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { parseLocalDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { equiposService, type AlquilerEquipo } from "@/services/equipos.service"
import { ImageZoom } from "@/pages/matriculas/ImageZoom"
import { toast } from "sonner"

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-blue-100 text-blue-700 border-blue-200",
  activo: "bg-amber-100 text-amber-700 border-amber-200",
  entregado: "bg-indigo-100 text-indigo-700 border-indigo-200",
  devuelto: "bg-green-100 text-green-700 border-green-200",
  vencido: "bg-red-100 text-red-700 border-red-200",
}

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente", activo: "Activo", entregado: "Entregado", devuelto: "Devuelto", vencido: "Vencido",
}

function formatFechaLarga(f?: string) {
  if (!f) return "—"
  return parseLocalDate(f).toLocaleDateString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
}

export function AlquilerDetallePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const backHref = `/servicios/equipos/alquileres${(() => { const p = new URLSearchParams(); const e = searchParams.get("estado"); const s = searchParams.get("search"); if (e) p.set("estado", e); if (s) p.set("search", s); const qs = p.toString(); return qs ? `?${qs}` : "" })()}`

  const [alquiler, setAlquiler] = useState<AlquilerEquipo | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoomFoto, setZoomFoto] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) { navigate(backHref); return }
    equiposService.getAlquiler(id)
      .then(setAlquiler)
      .catch(() => { toast.error("Error al cargar alquiler"); navigate(backHref) })
      .finally(() => setLoading(false))
  }, [id, navigate, backHref])

  const handleEntregar = async () => {
    if (!alquiler) return
    setSaving(true)
    try {
      await equiposService.entregarEquipo(alquiler.id)
      toast.success("Equipo marcado como entregado")
      try {
        const pendientes = await equiposService.getAlquileres({ estado: "pendiente" })
        const next = pendientes.find(a => a.id !== alquiler.id)
        if (next) { navigate(`/servicios/equipos/alquileres/${next.id}`, { replace: true }); return }
      } catch { /* sin siguiente */ }
      navigate(backHref)
    } catch { toast.error("Error al registrar entrega") }
    finally { setSaving(false) }
  }

  const handleDevolver = async () => {
    if (!alquiler) return
    setSaving(true)
    try {
      await equiposService.devolverEquipo(alquiler.id, {})
      toast.success("Equipo devuelto correctamente")
      try {
        const pendientes = await equiposService.getAlquileres({ estado: "activo" })
        const next = pendientes.find(a => a.id !== alquiler.id)
        if (next) { navigate(`/servicios/equipos/alquileres/${next.id}`, { replace: true }); return }
      } catch { /* sin siguiente */ }
      navigate(backHref)
    } catch { toast.error("Error al registrar devolución") }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full" style={{ borderColor: COLORS.ACCENT }} />
          <p className="text-xs font-medium opacity-40">Cargando alquiler...</p>
        </div>
      </div>
    )
  }

  if (!alquiler) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm font-medium opacity-40">Alquiler no encontrado</p>
      </div>
    )
  }

  const isOverdue = (alquiler.estado === "activo" || alquiler.estado === "entregado") && new Date(alquiler.fecha_devolucion_esperada) < new Date()
  const displayEstado = alquiler.estado === "vencido" ? "vencido" : isOverdue ? "vencido" : alquiler.estado
  const total = Number(alquiler.cuenta_por_cobrar?.monto_total ?? alquiler.precio_total)
  const abonado = Number(alquiler.cuenta_por_cobrar?.monto_abonado ?? 0)
  const saldo = total - abonado

  const clienteNombre = alquiler.persona
    ? `${alquiler.persona.nombres} ${alquiler.persona.apellidos}`
    : alquiler.cliente_externo
    ? `${alquiler.cliente_externo.nombres} ${alquiler.cliente_externo.apellidos || ""}`
    : "—"

  const clienteCedula = alquiler.cliente_externo?.cedula
  const clienteEmail = alquiler.persona?.correo || alquiler.cliente_externo?.correo
  const clienteTelefono = alquiler.cliente_externo?.celular

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="shrink-0 border-b bg-white sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(backHref)}
              className="size-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all active:scale-95">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-2xl flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: COLORS.ACCENT }}>
                <HugeiconsIcon icon={Home02Icon} size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>
                  Alquiler de {alquiler.equipo?.nombre || "Equipo"}
                </h1>
                <p className="text-xs opacity-40 mt-0.5 truncate">
                  ${Number(alquiler.equipo?.precio_diario ?? 0).toFixed(2)}/día · {formatFechaLarga(alquiler.fecha_entrega)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6 space-y-5">
          {/* Top 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border p-4 space-y-1" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                <HugeiconsIcon icon={Calendar03Icon} size={11} />
                Entrega
              </p>
              <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{formatFechaLarga(alquiler.fecha_entrega)}</p>
            </div>
            <div
              className={cn(
                "bg-white rounded-2xl border p-4 space-y-1",
                displayEstado === "vencido" ? "bg-red-50 border-red-200" : ""
              )}
              style={{ borderColor: displayEstado === "vencido" ? undefined : COLORS.BORDER_SUBTLE }}
            >
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                <HugeiconsIcon icon={Clock01Icon} size={11} />
                Devolución esperada
              </p>
              <p className={cn("text-sm font-bold", displayEstado === "vencido" ? "text-red-700" : "")} style={{ color: displayEstado === "vencido" ? undefined : COLORS.CHARCOAL }}>
                {formatFechaLarga(alquiler.fecha_devolucion_esperada)}
              </p>
              {alquiler.fecha_recepcion && (
                <p className="text-[10px] opacity-50">Devuelto: {formatFechaLarga(alquiler.fecha_recepcion)}</p>
              )}
            </div>
            <div className="bg-white rounded-2xl border p-4 space-y-1" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                <HugeiconsIcon icon={Money01Icon} size={11} />
                Precio
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-lg font-black" style={{ color: COLORS.CHARCOAL }}>${Number(alquiler.precio_total).toFixed(2)}</p>
                {alquiler.monto_descuento && Number(alquiler.monto_descuento) > 0 && (
                  <span className="text-xs text-gray-400 line-through font-semibold">
                    ${(Number(alquiler.precio_original || Number(alquiler.precio_total) + Number(alquiler.monto_descuento))).toFixed(2)}
                  </span>
                )}
              </div>
              {alquiler.motivo_descuento && (
                <p className="text-[11px] text-amber-600 font-medium truncate" title={alquiler.motivo_descuento}>
                  Motivo: "{alquiler.motivo_descuento}"
                </p>
              )}
            </div>
          </div>

          {/* Estado + Pago badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border", ESTADO_COLORS[displayEstado] || "bg-gray-100")}>
              {ESTADO_LABELS[displayEstado] || displayEstado}
            </span>
            <span className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
              saldo <= 0 ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"
            )}>
              {saldo <= 0 ? "Pago completado" : `Saldo pendiente: $${saldo.toFixed(2)}`}
            </span>
          </div>

          {/* Cliente */}
          <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <h3 className="text-xs font-bold flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
              <HugeiconsIcon icon={UserIcon} size={14} className="text-indigo-500" />
              Cliente
            </h3>
            <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{clienteNombre}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs opacity-50">
              {clienteCedula && (
                <span className="flex items-center gap-1">
                  <HugeiconsIcon icon={IdentificationIcon} size={12} />
                  {clienteCedula}
                </span>
              )}
              {clienteEmail && (
                <span className="flex items-center gap-1">
                  <HugeiconsIcon icon={Mail01Icon} size={12} />
                  {clienteEmail}
                </span>
              )}
              {clienteTelefono && (
                <span className="flex items-center gap-1">
                  <HugeiconsIcon icon={CallIcon} size={12} />
                  {clienteTelefono}
                </span>
              )}
              {!clienteCedula && !clienteEmail && !clienteTelefono && (
                <span className="opacity-50">Sin datos de contacto</span>
              )}
            </div>
          </div>

          {/* Fotos */}
          {(alquiler.foto_salida_url || alquiler.foto_retorno_url) && (
            <div className={cn("grid gap-3", alquiler.foto_salida_url && alquiler.foto_retorno_url ? "grid-cols-2" : "grid-cols-1")}>
              {alquiler.foto_salida_url && (
                <button type="button" onClick={() => setZoomFoto(alquiler.foto_salida_url!)}
                  className="flex items-center gap-3 p-4 rounded-2xl border bg-white hover:bg-gray-50/80 transition-colors group text-left"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <div className="size-14 rounded-xl overflow-hidden shrink-0 bg-gray-100" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <img src={alquiler.foto_salida_url} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>Foto de salida</p>
                    <p className="text-[10px] opacity-40 mt-0.5 flex items-center gap-1">
                      <HugeiconsIcon icon={ViewIcon} size={11} />
                      Click para ampliar
                    </p>
                  </div>
                </button>
              )}
              {alquiler.foto_retorno_url && (
                <button type="button" onClick={() => setZoomFoto(alquiler.foto_retorno_url!)}
                  className="flex items-center gap-3 p-4 rounded-2xl border bg-white hover:bg-gray-50/80 transition-colors group text-left"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <div className="size-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <img src={alquiler.foto_retorno_url} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>Foto de retorno</p>
                    <p className="text-[10px] opacity-40 mt-0.5 flex items-center gap-1">
                      <HugeiconsIcon icon={ViewIcon} size={11} />
                      Click para ampliar
                    </p>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Observaciones */}
          {alquiler.observaciones && (
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5 mb-2">
                <HugeiconsIcon icon={InformationCircleIcon} size={11} />
                Observaciones
              </p>
              <p className="text-xs opacity-60">{alquiler.observaciones}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 pb-4">
            {(displayEstado === "pendiente" || displayEstado === "activo" || displayEstado === "entregado" || displayEstado === "vencido") && (
              <>
                {displayEstado === "pendiente" && (
                  <button onClick={handleEntregar} disabled={saving}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                    style={{ backgroundColor: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />
                    {saving ? "Procesando..." : "Marcar como Entregado"}
                  </button>
                )}
                {(displayEstado === "activo" || displayEstado === "entregado" || displayEstado === "vencido") && (
                  <button onClick={handleDevolver} disabled={saving}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                    style={{ backgroundColor: "#059669" }}>
                    <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />
                    {saving ? "Procesando..." : "Registrar Devolución"}
                  </button>
                )}
                {saldo > 0 && (
                  <button onClick={() => navigate(`/finanzas/pagos/cuentas/servicios/pago/${alquiler.id}`, { state: { tipo: "equipo", servicioId: alquiler.id, nombre: clienteNombre, montoTotal: total || 0, montoSaldo: saldo || 0, nombreServicio: `Alquiler de ${alquiler.equipo?.nombre || "Equipo"}` } })} className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all hover:bg-gray-50 active:scale-[0.98]"
                    style={{ borderColor: COLORS.ACCENT, color: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />
                    Registrar pago (${saldo.toFixed(2)})
                  </button>
                )}
              </>
            )}
            {displayEstado === "devuelto" && (
              <p className="text-sm font-medium py-3 opacity-40" style={{ color: COLORS.CHARCOAL }}>Este alquiler ya fue devuelto</p>
            )}
          </div>
        </div>
      </div>

      {zoomFoto && <ImageZoom url={zoomFoto} onClose={() => setZoomFoto(null)} />}
    </div>
  )
}
