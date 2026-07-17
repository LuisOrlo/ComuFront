import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Edit01Icon,
  SearchIcon,
  InformationCircleIcon,
  Home02Icon,
} from "@hugeicons/core-free-icons"
import { Trash2, Plus } from "lucide-react"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { COLORS } from "@/lib/constants"
import { cn, getStorageUrl } from "@/lib/utils"
import { equiposService, type Equipo } from "@/services/equipos.service"
import { toast } from "sonner"
import { Link, useNavigate } from "react-router"

const STATUS_COLORS: Record<string, string> = {
  disponible: "bg-emerald-100 text-emerald-700 border-emerald-200",
  alquilado: "bg-amber-100 text-amber-700 border-amber-200",
  mantenimiento: "bg-red-100 text-red-700 border-red-200",
}

const STATUS_LABELS: Record<string, string> = {
  disponible: "Disponible",
  alquilado: "Alquilado",
  mantenimiento: "En mantenimiento",
}

export function EquiposPage() {
  const navigate = useNavigate()
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadEquipos = async () => {
    try {
      setLoading(true)
      const params: { search?: string; estado?: string } = {}
      if (search) params.search = search
      if (filtroEstado) params.estado = filtroEstado
      const data = await equiposService.getEquipos(params)
      setEquipos(data)
    } catch { toast.error("Error al cargar equipos") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEquipos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filtroEstado])

  const confirmDeleteEquipo = async () => {
    const id = deleteConfirm
    if (!id) return
    setDeleteConfirm(null)
    try {
      await equiposService.deleteEquipo(id)
      toast.success("Equipo eliminado")
      loadEquipos()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al eliminar equipo"
      toast.error(msg)
    }
  }

  const openDetail = (equipo: Equipo) => {
    navigate(`/servicios/equipos/${equipo.id}/historial`)
  }

  const openAlquiler = (equipo: Equipo) => {
    navigate(`/servicios/equipos/nuevo-alquiler/${equipo.id}`)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>Alquiler de Equipos</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/servicios/equipos/alquileres" className="px-4 py-3 rounded-2xl bg-white border text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <HugeiconsIcon icon={Calendar03Icon} size={15} /> Ver Alquileres
            </Link>
            <button onClick={() => navigate("/servicios/equipos/nuevo")} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 hover:opacity-90 active:scale-[0.97]">
              <Plus size={16} /> Registrar Equipo
            </button>
          </div>
        </div>
      </header>

      <div className="shrink-0 px-8 py-3 border-b bg-white/50 flex items-center gap-3 flex-wrap" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <HugeiconsIcon icon={SearchIcon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar equipo..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-gray-50 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="px-4 py-2.5 rounded-xl border bg-gray-50 text-xs font-medium outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <option value="">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="alquilado">Alquilado</option>
          <option value="mantenimiento">Mantenimiento</option>
        </select>
        <span className="text-[10px] font-bold opacity-40">{equipos.length} equipo{equipos.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center py-32"><p className="text-sm font-medium opacity-30 animate-pulse">Cargando catálogo...</p></div>
        ) : equipos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
            <div className="size-20 rounded-2xl bg-gray-100 flex items-center justify-center"><HugeiconsIcon icon={InformationCircleIcon} size={36} className="opacity-15" style={{ color: COLORS.CHARCOAL }} /></div>
            <p className="text-sm font-bold opacity-30">No hay equipos registrados</p>
            <p className="text-xs opacity-20 max-w-[280px]">Registra equipos para comenzar a gestionar alquileres.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {equipos.map((eq, i) => (
              <motion.div key={eq.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all group" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  {eq.foto_url ? (
                    <img src={getStorageUrl(eq.foto_url)} alt={eq.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><HugeiconsIcon icon={Home02Icon} size={40} className="opacity-15" style={{ color: COLORS.CHARCOAL }} /></div>
                  )}
                  <span className={cn("absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border", STATUS_COLORS[eq.estado] || "bg-gray-100")}>
                    {STATUS_LABELS[eq.estado] || eq.estado}
                    {eq.estado === "disponible" && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-emerald-500" />}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>{eq.nombre}</h3>
                    {eq.descripcion && <p className="text-[10px] opacity-40 mt-0.5 line-clamp-2">{eq.descripcion}</p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black" style={{ color: COLORS.ACCENT }}>${eq.precio_diario}<span className="text-[10px] font-medium opacity-50">/día</span></span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigate(`/servicios/equipos/${eq.id}/editar`)} className="size-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10" title="Editar"><HugeiconsIcon icon={Edit01Icon} size={12} /></button>
                      <button onClick={() => setDeleteConfirm(eq.id)} className="size-7 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100" title="Eliminar"><Trash2 size={12} className="text-red-500" /></button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => openDetail(eq)} className="flex-1 py-2 rounded-xl text-[10px] font-bold border hover:bg-gray-50 transition-colors" style={{ borderColor: COLORS.BORDER_SUBTLE }}>Historial</button>
                    <button onClick={() => openAlquiler(eq)} disabled={eq.estado !== "disponible"} className={cn("flex-1 py-2 rounded-xl text-[10px] font-bold text-white transition-all", eq.estado === "disponible" ? "bg-amber-500 hover:bg-amber-600" : "bg-gray-300 cursor-not-allowed")}>Alquilar</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Equipo"
        message={`¿Eliminar el equipo "${deleteConfirm ? equipos.find(e => e.id === deleteConfirm)?.nombre : ""}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        icon="trash"
        onConfirm={confirmDeleteEquipo}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
