import { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight02Icon,
  Search01Icon,
  Cancel01Icon,
  Home02Icon,
  Calendar03Icon,
  UserIcon,
  Clock01Icon,
  Money01Icon,
  Alert02Icon,
  CheckmarkCircle04Icon,
  InformationCircleIcon,
  Image01Icon,
  Edit01Icon,
} from "@hugeicons/core-free-icons"
import { X } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { equiposService, type Equipo, type AlquilerEquipo } from "@/services/equipos.service"
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
  pendiente: "Pendiente",
  activo: "Activo",
  entregado: "Entregado",
  devuelto: "Devuelto",
  vencido: "Vencido",
}

const STRIP_COLORS: Record<string, string> = {
  pendiente: "bg-blue-500",
  activo: "bg-amber-500",
  entregado: "bg-indigo-500",
  devuelto: "bg-green-500",
  vencido: "bg-red-500",
}

export function HistorialEquipoPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [equipo, setEquipo] = useState<Equipo | null>(null)
  const [alquileres, setAlquileres] = useState<AlquilerEquipo[]>([])
  const [loading, setLoading] = useState(true)
  const [zoomFoto, setZoomFoto] = useState<string | null>(null)

  const [cedula, setCedula] = useState("")
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, last_page: 1, current_page: 1, per_page: 5 })

  const [devolverOpen, setDevolverOpen] = useState(false)
  const [alquilerADevolver, setAlquilerADevolver] = useState<AlquilerEquipo | null>(null)
  const [devolverForm, setDevolverForm] = useState({ observaciones: "" })
  const [fotoRetornoFile, setFotoRetornoFile] = useState<File | null>(null)
  const [fotoRetornoPreview, setFotoRetornoPreview] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const params: { equipo_id: string; page: number; per_page: number; cedula?: string } = {
        equipo_id: id,
        page,
        per_page: 5,
      }
      if (cedula.trim()) params.cedula = cedula.trim()
      const [eq, result] = await Promise.all([
        equiposService.getEquipo(id),
        equiposService.getAlquileresConMeta(params),
      ])
      setEquipo(eq)
      setAlquileres(result.data)
      setMeta(result.meta)
    } catch { toast.error("Error al cargar historial") }
    finally { setLoading(false) }
  }, [id, page, cedula])

  useEffect(() => {
    if (!id) { navigate("/servicios/equipos"); return }
    loadData()
  }, [id, navigate, loadData])

  const getResponsable = (a: AlquilerEquipo) => {
    if (a.persona) return `${a.persona.nombres} ${a.persona.apellidos}`
    if (a.cliente_externo) return `${a.cliente_externo.nombres} ${a.cliente_externo.apellidos || ""}`
    return "—"
  }

  const openDevolverModal = (a: AlquilerEquipo) => {
    setAlquilerADevolver(a)
    setDevolverForm({ observaciones: "" })
    setFotoRetornoFile(null)
    setFotoRetornoPreview(null)
    setDevolverOpen(true)
  }

  const handleEntregar = async (id: string) => {
    try {
      await equiposService.entregarEquipo(id)
      toast.success("Equipo marcado como entregado")
      loadData()
    } catch { toast.error("Error al registrar entrega") }
  }

  const handleDevolver = async () => {
    if (!alquilerADevolver) return
    try {
      const payload = fotoRetornoFile ? (() => {
        const fd = new FormData()
        fd.append("foto_retorno", fotoRetornoFile)
        if (devolverForm.observaciones) fd.append("observaciones", devolverForm.observaciones)
        return fd
      })() : devolverForm
      await equiposService.devolverEquipo(alquilerADevolver.id, payload)
      toast.success("Equipo devuelto correctamente")
      setDevolverOpen(false)
      setAlquilerADevolver(null)
      setFotoRetornoFile(null)
      setFotoRetornoPreview(null)
      loadData()
    } catch { toast.error("Error al registrar devolución") }
  }

  const handleSearch = () => { setPage(1) }
  const handleClearSearch = () => { setCedula(""); setPage(1) }

  const stats = {
    total: meta.total,
    activos: alquileres.filter(a => a.estado === "activo").length,
    vencidos: alquileres.filter(a => a.estado === "vencido" || (a.estado === "activo" && new Date(a.fecha_devolucion_esperada) < new Date())).length,
    devueltos: alquileres.filter(a => a.estado === "devuelto").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full" style={{ borderColor: COLORS.ACCENT }} />
          <p className="text-xs font-medium opacity-40">Cargando historial...</p>
        </div>
      </div>
    )
  }

  if (!equipo) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm font-medium opacity-40">Equipo no encontrado</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="shrink-0 border-b bg-white sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/servicios/equipos")}
              className="size-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all active:scale-95">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-2xl flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: COLORS.ACCENT }}>
                <HugeiconsIcon icon={Home02Icon} size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>
                  {equipo.nombre}
                </h1>
                <p className="text-xs opacity-40 mt-0.5 truncate">
                  Historial de alquileres · ${Number(equipo.precio_diario).toFixed(2)}/día
                </p>
              </div>
            </div>
            <span className={cn(
              "ml-auto px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border shrink-0",
              equipo.estado === "disponible" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
              equipo.estado === "alquilado" ? "bg-amber-100 text-amber-700 border-amber-200" :
              "bg-red-100 text-red-700 border-red-200"
            )}>
              {equipo.estado === "disponible" ? "Disponible" : equipo.estado === "alquilado" ? "Alquilado" : "En mantenimiento"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={Home02Icon} size={18} className="opacity-40" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Total</p>
                <p className="text-lg font-black" style={{ color: COLORS.CHARCOAL }}>{stats.total}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={Clock01Icon} size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Activos</p>
                <p className="text-lg font-black text-amber-600">{stats.activos}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={Alert02Icon} size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Vencidos</p>
                <p className="text-lg font-black text-red-600">{stats.vencidos}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Devueltos</p>
                <p className="text-lg font-black text-green-600">{stats.devueltos}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
              <input
                type="text"
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSearch() }}
                placeholder="Buscar por número de cédula..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border bg-gray-50 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              />
              {cedula && (
                <button onClick={handleClearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity">
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              )}
            </div>
            <button onClick={handleSearch} className="px-4 py-2.5 rounded-xl text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95 shrink-0" style={{ backgroundColor: COLORS.ACCENT }}>Buscar</button>
          </div>

          {alquileres.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="size-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                <HugeiconsIcon icon={Calendar03Icon} size={36} className="opacity-15" style={{ color: COLORS.CHARCOAL }} />
              </div>
              <p className="text-sm font-bold opacity-30">Sin alquileres registrados</p>
              <p className="text-xs opacity-20 max-w-[280px]">Este equipo aún no ha sido alquilado.</p>
            </div>
          ) : (
            <>
            <div className="space-y-3">
              {alquileres.map(a => {
                const isOverdue = (a.estado === "activo" || a.estado === "entregado") && new Date(a.fecha_devolucion_esperada) < new Date()
                const displayEstado = isOverdue ? "vencido" : a.estado

                return (
                  <div key={a.id}
                    className="bg-white rounded-2xl border hover:shadow-sm transition-all overflow-hidden"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className={cn("h-1.5 w-full", STRIP_COLORS[displayEstado] || "bg-gray-400")} />

                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0",
                            displayEstado === "activo" ? "bg-amber-100" :
                            displayEstado === "vencido" ? "bg-red-100" :
                            displayEstado === "devuelto" ? "bg-green-100" :
                            displayEstado === "entregado" ? "bg-indigo-100" :
                            "bg-blue-100"
                          )}>
                            <HugeiconsIcon icon={Calendar03Icon} size={16}
                              className={cn(
                                displayEstado === "activo" ? "text-amber-600" :
                                displayEstado === "vencido" ? "text-red-600" :
                                displayEstado === "devuelto" ? "text-green-600" :
                                displayEstado === "entregado" ? "text-indigo-600" :
                                "text-blue-600"
                              )} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                              {new Date(a.fecha_entrega).toLocaleDateString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <p className="text-[10px] opacity-40 mt-0.5">
                              Hasta {new Date(a.fecha_devolucion_esperada).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border",
                          ESTADO_COLORS[displayEstado] || "bg-gray-100"
                        )}>
                          {ESTADO_LABELS[displayEstado] || displayEstado}
                        </span>
                        {(() => {
                          const total = Number(a.cuenta_por_cobrar?.monto_total ?? a.precio_total)
                          const abonado = Number(a.cuenta_por_cobrar?.monto_abonado ?? 0)
                          const saldo = total - abonado
                          return (
                            <span className={cn(
                              "shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border",
                              saldo <= 0
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                            )}>
                              {saldo <= 0 ? "Pago completado" : `Pago pendiente: $${saldo.toFixed(2)}`}
                            </span>
                          )
                        })()}
                        <button onClick={() => navigate(`/servicios/equipos/alquileres/${a.id}/editar`)}
                          className="shrink-0 size-7 flex items-center justify-center rounded-lg border hover:bg-gray-50 transition-colors"
                          style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
                          title="Editar alquiler">
                          <HugeiconsIcon icon={Edit01Icon} size={13} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                          <div className="size-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={UserIcon} size={14} className="text-indigo-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cliente</p>
                            <p className="text-xs font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                              {getResponsable(a)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                          <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={Money01Icon} size={14} className="text-emerald-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precio total</p>
                            <p className="text-sm font-black" style={{ color: COLORS.ACCENT }}>
                              ${Number(a.precio_total).toFixed(2)}
                            </p>
                          </div>
                          {(() => {
                            const total = Number(a.cuenta_por_cobrar?.monto_total ?? a.precio_total)
                            const abonado = Number(a.cuenta_por_cobrar?.monto_abonado ?? 0)
                            const saldo = total - abonado
                            if (saldo <= 0) return null
                            return (
                              <button onClick={() => navigate(`/finanzas/pagos/cuentas/servicios/pago/${a.id}`, { state: { tipo: "equipo", servicioId: a.id, nombre: getResponsable(a), montoTotal: total || 0, montoSaldo: saldo || 0, nombreServicio: `Alquiler de ${equipo.nombre}` } })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap shrink-0" style={{ backgroundColor: COLORS.ACCENT }}>
                                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                                Registrar pago
                              </button>
                            )
                          })()}
                        </div>
                      </div>

                      {(a.estado === "pendiente" || a.estado === "activo" || a.estado === "entregado" || a.estado === "vencido") && (
                        <div className="flex gap-2 pt-1">
                          {a.estado === "pendiente" && (
                            <button onClick={() => handleEntregar(a.id)} className="flex-1 py-2 rounded-xl text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95" style={{ backgroundColor: COLORS.ACCENT }}>
                              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} className="inline mr-1" />
                              Marcar como Entregado
                            </button>
                          )}
                          {(a.estado === "activo" || a.estado === "entregado" || a.estado === "vencido") && (
                            <button onClick={() => openDevolverModal(a)} className="flex-1 py-2 rounded-xl text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95" style={{ backgroundColor: "#059669" }}>
                              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} className="inline mr-1" />
                              Registrar Devolución
                            </button>
                          )}
                        </div>
                      )}

                      {a.fecha_recepcion && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-green-50">
                          <div className="size-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-green-600/60">Devuelto el</p>
                            <p className="text-xs font-bold text-green-700">
                              {new Date(a.fecha_recepcion).toLocaleDateString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      )}

                      {(a.foto_salida_url || a.foto_retorno_url) && (
                        <div className={cn("grid gap-3 pt-2",
                          a.foto_salida_url && a.foto_retorno_url ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                        )}>
                          {a.foto_salida_url && (
                            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50/70">
                              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-amber-500" />
                                Foto salida
                              </p>
                              <button type="button" onClick={() => setZoomFoto(a.foto_salida_url!)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed text-[10px] font-bold bg-white hover:bg-gray-100 hover:border-amber-400/60 transition-all group"
                                style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                <HugeiconsIcon icon={Image01Icon} size={13} className="opacity-40 group-hover:opacity-60 transition-opacity" />
                                <span className="opacity-60 group-hover:opacity-80 transition-opacity">Ver foto de salida</span>
                              </button>
                            </div>
                          )}
                          {a.foto_retorno_url && (
                            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50/70">
                              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-green-500" />
                                Foto retorno
                              </p>
                              <button type="button" onClick={() => setZoomFoto(a.foto_retorno_url!)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed text-[10px] font-bold bg-white hover:bg-gray-100 hover:border-green-400/60 transition-all group"
                                style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                <HugeiconsIcon icon={Image01Icon} size={13} className="opacity-40 group-hover:opacity-60 transition-opacity" />
                                <span className="opacity-60 group-hover:opacity-80 transition-opacity">Ver foto de retorno</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {a.observaciones && (
                        <div className="pt-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                            <HugeiconsIcon icon={InformationCircleIcon} size={11} />
                            Observaciones
                          </p>
                          <p className="text-xs mt-1 opacity-60">{a.observaciones}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {meta.last_page > 1 && (
              <div className="flex items-center justify-between gap-4 pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={13} />
                  Anterior
                </button>
                <span className="text-xs font-medium opacity-40">
                  Página {meta.current_page} de {meta.last_page}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                  disabled={page >= meta.last_page}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  Siguiente
                  <HugeiconsIcon icon={ArrowRight02Icon} size={13} />
                </button>
              </div>
            )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {devolverOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDevolverOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}><h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>Registrar Devolución</h2><button onClick={() => setDevolverOpen(false)} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 border" style={{ borderColor: COLORS.BORDER_SUBTLE }}><X size={18} /></button></div>
              <div className="p-6 space-y-4">
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Foto retorno</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none hover:bg-gray-100 transition-colors text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        {fotoRetornoFile ? fotoRetornoFile.name : "Seleccionar archivo"}
                      </div>
                      <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { setFotoRetornoFile(file); setFotoRetornoPreview(URL.createObjectURL(file)) } }} />
                    </label>
                    {fotoRetornoPreview && (
                      <div className="size-14 rounded-xl overflow-hidden shrink-0 border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <img src={fotoRetornoPreview} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Observaciones</label><textarea value={devolverForm.observaciones} onChange={e => setDevolverForm({ ...devolverForm, observaciones: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none resize-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} /></div>
              </div>
              <div className="px-6 py-5 bg-gray-50 border-t flex justify-end gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button onClick={() => setDevolverOpen(false)} className="px-6 py-3 rounded-xl border text-sm font-bold" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>Cancelar</button>
                <button onClick={handleDevolver} className="px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: COLORS.ACCENT }}>Confirmar Devolución</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {zoomFoto && <ImageZoom url={zoomFoto} onClose={() => setZoomFoto(null)} />}
    </div>
  )
}
