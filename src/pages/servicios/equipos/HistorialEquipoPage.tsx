import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Home02Icon,
  Calendar03Icon,
  UserIcon,
  Clock01Icon,
  Money01Icon,
  Alert02Icon,
  CheckmarkCircle04Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { equiposService, type Equipo, type AlquilerEquipo } from "@/services/equipos.service"
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

  useEffect(() => {
    if (!id) { navigate("/servicios/equipos"); return }

    Promise.all([
      equiposService.getEquipo(id),
      equiposService.getAlquileres({ equipo_id: id }),
    ])
      .then(([eq, als]) => { setEquipo(eq); setAlquileres(als) })
      .catch(() => toast.error("Error al cargar historial"))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const getResponsable = (a: AlquilerEquipo) => {
    if (a.persona) return `${a.persona.nombres} ${a.persona.apellidos}`
    if (a.cliente_externo) return `${a.cliente_externo.nombres} ${a.cliente_externo.apellidos || ""}`
    return "—"
  }

  const stats = {
    total: alquileres.length,
    activos: alquileres.filter(a => a.estado === "activo").length,
    vencidos: alquileres.filter(a => a.estado === "vencido" || (a.estado === "activo" && new Date(a.fecha_devolucion_esperada) < new Date())).length,
    devueltos: alquileres.filter(a => a.estado === "devuelto").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-amber-50/30">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-amber-600 border-t-transparent rounded-full" />
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
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-amber-50/20">
      <header className="shrink-0 border-b bg-white/90 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/servicios/equipos")}
              className="size-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all active:scale-95">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <HugeiconsIcon icon={Home02Icon} size={20} className="text-white" />
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
            <div className="bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={Home02Icon} size={18} className="opacity-40" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Total</p>
                <p className="text-lg font-black" style={{ color: COLORS.CHARCOAL }}>{stats.total}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={Clock01Icon} size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Activos</p>
                <p className="text-lg font-black text-amber-600">{stats.activos}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={Alert02Icon} size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Vencidos</p>
                <p className="text-lg font-black text-red-600">{stats.vencidos}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Devueltos</p>
                <p className="text-lg font-black text-green-600">{stats.devueltos}</p>
              </div>
            </div>
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
            <div className="space-y-3">
              {alquileres.map(a => {
                const isOverdue = (a.estado === "activo" || a.estado === "entregado") && new Date(a.fecha_devolucion_esperada) < new Date()
                const displayEstado = isOverdue ? "vencido" : a.estado

                return (
                  <div key={a.id}
                    className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden"
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
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                          <div className="size-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={UserIcon} size={14} className="text-indigo-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Responsable</p>
                            <p className="text-xs font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                              {getResponsable(a)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                          <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={Money01Icon} size={14} className="text-emerald-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precio total</p>
                            <p className="text-sm font-black" style={{ color: COLORS.ACCENT }}>
                              ${Number(a.precio_total).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

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
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1.5 flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-amber-500" />
                                Foto salida
                              </p>
                              <img src={a.foto_salida_url} alt="Salida"
                                className="w-full aspect-video object-cover rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                            </div>
                          )}
                          {a.foto_retorno_url && (
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1.5 flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-green-500" />
                                Foto retorno
                              </p>
                              <img src={a.foto_retorno_url} alt="Retorno"
                                className="w-full aspect-video object-cover rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
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
          )}
        </div>
      </div>
    </div>
  )
}
