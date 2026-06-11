import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon, SearchIcon, UserIcon, Home02Icon,
  Alert02Icon, ArrowLeft02Icon, CheckmarkCircle04Icon,
} from "@hugeicons/core-free-icons"
import { X } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { equiposService, type AlquilerEquipo } from "@/services/equipos.service"
import { toast } from "sonner"
import { Link } from "react-router"

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

export function AlquileresListPage() {
  const [alquileres, setAlquileres] = useState<AlquilerEquipo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")
  const [vencidos, setVencidos] = useState<AlquilerEquipo[]>([])

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedAlquiler, setSelectedAlquiler] = useState<AlquilerEquipo | null>(null)

  const [devolverOpen, setDevolverOpen] = useState(false)
  const [devolverForm, setDevolverForm] = useState({ foto_retorno_url: "", observaciones: "" })
  const [fotoRetornoFile, setFotoRetornoFile] = useState<File | null>(null)
  const [fotoRetornoPreview, setFotoRetornoPreview] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const params: { search?: string; estado?: string } = {}
      if (search) params.search = search
      if (filtroEstado) params.estado = filtroEstado
      const [data, venc] = await Promise.all([
        equiposService.getAlquileres(params),
        equiposService.getVencidos(),
      ])
      setAlquileres(data)
      setVencidos(venc)
    } catch { toast.error("Error al cargar alquileres") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filtroEstado])

  const handleEntregar = async () => {
    if (!selectedAlquiler) return
    try {
      await equiposService.entregarEquipo(selectedAlquiler.id)
      toast.success("Equipo marcado como entregado")
      setDetailOpen(false)
      loadData()
    } catch { toast.error("Error al registrar entrega") }
  }

  const handleDevolver = async () => {
    if (!selectedAlquiler) return
    try {
      const payload = fotoRetornoFile ? (() => {
        const fd = new FormData()
        fd.append("foto_retorno", fotoRetornoFile)
        if (devolverForm.observaciones) fd.append("observaciones", devolverForm.observaciones)
        return fd
      })() : devolverForm
      await equiposService.devolverEquipo(selectedAlquiler.id, payload)
      toast.success("Equipo devuelto correctamente")
      setDevolverOpen(false)
      setDetailOpen(false)
      setFotoRetornoFile(null)
      setFotoRetornoPreview(null)
      loadData()
    } catch { toast.error("Error al registrar devolución") }
  }

  const getResponsable = (a: AlquilerEquipo) => {
    if (a.persona) return `${a.persona.nombres} ${a.persona.apellidos}`
    if (a.cliente_externo) return `${a.cliente_externo.nombres} ${a.cliente_externo.apellidos || ""}`
    return "—"
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-4 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center gap-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <Link to="/servicios/equipos" className="size-9 flex items-center justify-center rounded-full hover:bg-black/5">
          <HugeiconsIcon icon={ArrowLeft02Icon} size={18} className="opacity-50" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Alquileres de Equipos</h1>
          <p className="text-[10px] font-medium opacity-40">Registro general de todos los alquileres</p>
        </div>
      </header>

      {vencidos.length > 0 && (
        <div className="shrink-0 mx-8 mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0"><HugeiconsIcon icon={Alert02Icon} size={20} className="text-red-600" /></div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">¡Atención! {vencidos.length} equipo{vencidos.length !== 1 ? "s" : ""} vencido{vencidos.length !== 1 ? "s" : ""}</p>
            <p className="text-[10px] text-red-600">Estos equipos no han sido devueltos a tiempo</p>
          </div>
        </div>
      )}

      <div className="shrink-0 px-8 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <HugeiconsIcon icon={SearchIcon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por equipo..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-gray-50 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="px-4 py-2.5 rounded-xl border bg-gray-50 text-xs font-medium outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="entregado">Entregado</option>
          <option value="activo">Activo</option>
          <option value="devuelto">Devuelto</option>
          <option value="vencido">Vencido</option>
        </select>
        <span className="text-[10px] font-bold opacity-40">{alquileres.length} alquiler{alquileres.length !== 1 ? "es" : ""}</span>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center py-32"><p className="text-sm font-medium opacity-30 animate-pulse">Cargando alquileres...</p></div>
        ) : alquileres.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
            <div className="size-20 rounded-2xl bg-gray-100 flex items-center justify-center"><HugeiconsIcon icon={Calendar03Icon} size={36} className="opacity-15" style={{ color: COLORS.CHARCOAL }} /></div>
            <p className="text-sm font-bold opacity-30">No hay alquileres registrados</p>
            <Link to="/servicios/equipos" className="text-xs font-bold text-amber-600 hover:underline">Ir al catálogo de equipos</Link>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="overflow-x-auto border rounded-2xl bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <table className="w-full">
                <thead><tr className="bg-gray-50/80">{["Equipo", "Responsable", "Entrega", "Devolución esperada", "Estado", "Precio"].map(h => <th key={h} className="p-3 text-left text-[9px] font-bold uppercase tracking-widest opacity-40 border-r last:border-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{h}</th>)}</tr></thead>
                <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  {alquileres.map(a => {
                    const isOverdue = (a.estado === "activo" || a.estado === "entregado") && new Date(a.fecha_devolucion_esperada) < new Date()
                    const displayEstado = a.estado === "vencido" ? "vencido" : isOverdue ? "vencido" : a.estado
                    return (
                      <tr key={a.id} onClick={() => { setSelectedAlquiler(a); setDetailOpen(true) }} className="cursor-pointer hover:bg-gray-50/60 transition-colors">
                        <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}><div className="flex items-center gap-2"><div className="size-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><HugeiconsIcon icon={Home02Icon} size={14} className="text-amber-600" /></div><span className="text-xs font-bold truncate max-w-[120px]" style={{ color: COLORS.CHARCOAL }}>{a.equipo?.nombre || "—"}</span></div></td>
                        <td className="p-3 border-r text-xs font-medium opacity-70 max-w-[120px] truncate" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{getResponsable(a)}</td>
                        <td className="p-3 border-r text-xs font-mono opacity-60" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{new Date(a.fecha_entrega).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="p-3 border-r text-xs font-mono opacity-60" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{new Date(a.fecha_devolucion_esperada).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}><span className={cn("inline-block px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border", ESTADO_COLORS[displayEstado] || "bg-gray-100")}>{ESTADO_LABELS[displayEstado] || displayEstado}</span></td>
                        <td className="p-3 text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>${Number(a.precio_total).toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal detalle */}
      <AnimatePresence>
        {detailOpen && selectedAlquiler && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailOpen(false)} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-3xl w-full max-w-xl flex flex-col max-h-[85vh] shadow-2xl">
              <div className="shrink-0 p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div><h2 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Detalle de Alquiler</h2><p className="text-xs opacity-40 mt-0.5">{selectedAlquiler.equipo?.nombre}</p></div>
                <button onClick={() => setDetailOpen(false)} className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10"><X size={18} /></button>
              </div>
              <div className="overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-gray-50"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Entrega</p><p className="text-sm font-bold mt-1" style={{ color: COLORS.CHARCOAL }}>{new Date(selectedAlquiler.fecha_entrega).toLocaleDateString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p></div>
                  <div className="p-4 rounded-2xl bg-gray-50"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Devolución esperada</p><p className="text-sm font-bold mt-1" style={{ color: COLORS.CHARCOAL }}>{new Date(selectedAlquiler.fecha_devolucion_esperada).toLocaleDateString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p></div>
                </div>
                {selectedAlquiler.fecha_recepcion && (
                  <div className="p-4 rounded-2xl bg-green-50"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Devuelto</p><p className="text-sm font-bold mt-1 text-green-700">{new Date(selectedAlquiler.fecha_recepcion).toLocaleDateString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p></div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-gray-50"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Estado</p><span className={cn("inline-block mt-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border", ESTADO_COLORS[selectedAlquiler.estado])}>{ESTADO_LABELS[selectedAlquiler.estado]}</span></div>
                  <div className="p-4 rounded-2xl bg-gray-50"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precio</p><p className="text-lg font-black mt-1" style={{ color: COLORS.ACCENT }}>${Number(selectedAlquiler.precio_total).toFixed(2)}</p></div>
                </div>
                {(selectedAlquiler.foto_salida_url || selectedAlquiler.foto_retorno_url) && (
                  <div className={cn("grid gap-3", selectedAlquiler.foto_salida_url && selectedAlquiler.foto_retorno_url ? "grid-cols-2" : "grid-cols-1")}>
                    {selectedAlquiler.foto_salida_url && <div><p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Foto salida</p><img src={selectedAlquiler.foto_salida_url} className="w-full aspect-square object-cover rounded-xl" /></div>}
                    {selectedAlquiler.foto_retorno_url && <div><p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Foto retorno</p><img src={selectedAlquiler.foto_retorno_url} className="w-full aspect-square object-cover rounded-xl" /></div>}
                  </div>
                )}
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Responsable</p>
                  {selectedAlquiler.persona ? (
                    <div className="flex items-center gap-3 mt-2"><div className="size-10 rounded-xl bg-indigo-100 flex items-center justify-center"><HugeiconsIcon icon={UserIcon} size={18} className="text-indigo-600" /></div><div><p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{selectedAlquiler.persona.nombres} {selectedAlquiler.persona.apellidos}</p>{selectedAlquiler.persona.correo && <p className="text-[10px] opacity-50">{selectedAlquiler.persona.correo}</p>}</div></div>
                  ) : selectedAlquiler.cliente_externo ? (
                    <div className="flex items-center gap-3 mt-2"><div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center"><HugeiconsIcon icon={UserIcon} size={18} className="text-emerald-600" /></div><div><p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{selectedAlquiler.cliente_externo.nombres} {selectedAlquiler.cliente_externo.apellidos}</p><div className="flex flex-wrap gap-x-3 text-[10px] opacity-50">{selectedAlquiler.cliente_externo.cedula && <span>{selectedAlquiler.cliente_externo.cedula}</span>}{selectedAlquiler.cliente_externo.correo && <span>{selectedAlquiler.cliente_externo.correo}</span>}{selectedAlquiler.cliente_externo.celular && <span>{selectedAlquiler.cliente_externo.celular}</span>}</div></div></div>
                  ) : <p className="text-xs opacity-30 mt-2">No especificado</p>}
                </div>
                {selectedAlquiler.observaciones && <div className="p-4 rounded-2xl bg-gray-50"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Observaciones</p><p className="text-xs mt-1 opacity-70">{selectedAlquiler.observaciones}</p></div>}
              </div>
              <div className="shrink-0 px-6 py-5 bg-gray-50 border-t flex justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button onClick={() => setDetailOpen(false)} className="px-6 py-3 rounded-xl bg-black/5 text-sm font-bold text-charcoal/60 hover:bg-black/10">Cerrar</button>
                {selectedAlquiler.estado === "pendiente" && (
                  <button onClick={handleEntregar} className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg"><HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />Marcar como Entregado</button>
                )}
                {(selectedAlquiler.estado === "activo" || selectedAlquiler.estado === "vencido" || selectedAlquiler.estado === "entregado") && (
                  <button onClick={() => { setDevolverForm({ foto_retorno_url: "", observaciones: "" }); setFotoRetornoFile(null); setFotoRetornoPreview(null); setDevolverOpen(true) }} className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg">Registrar Devolución</button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal devolver */}
      <AnimatePresence>
        {devolverOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDevolverOpen(false)} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}><h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>Registrar Devolución</h2><button onClick={() => setDevolverOpen(false)} className="size-10 flex items-center justify-center rounded-full bg-black/5"><X size={18} /></button></div>
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
                <button onClick={() => setDevolverOpen(false)} className="px-6 py-3 rounded-xl bg-black/5 text-sm font-bold text-charcoal/60">Cancelar</button>
                <button onClick={handleDevolver} className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700">Confirmar Devolución</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
