import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Edit01Icon,
  SearchIcon,
  InformationCircleIcon,
  Home02Icon,
} from "@hugeicons/core-free-icons"
import { Trash2, X, Plus } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { equiposService, type Equipo, type AlquilerEquipo } from "@/services/equipos.service"
import { personasService, type Persona } from "@/services/personas.service"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"
import { Link } from "react-router"

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
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [equipoForm, setEquipoForm] = useState<Partial<Equipo>>({ nombre: "", descripcion: "", foto_url: "", precio_diario: 0 })
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  const [alquilerModalOpen, setAlquilerModalOpen] = useState(false)
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [clientes, setClientes] = useState<ClienteExterno[]>([])
  const [clienteSearch, setClienteSearch] = useState("")
  const [creandoCliente, setCreandoCliente] = useState(false)
  const [nuevoClienteForm, setNuevoClienteForm] = useState({ nombres: "", apellidos: "", cedula: "", correo: "", celular: "" })
  const [selectedClienteId, setSelectedClienteId] = useState("")
  const [alquilerForm, setAlquilerForm] = useState({ fecha_entrega: new Date().toISOString().slice(0, 16), fecha_devolucion_esperada: "", foto_salida_url: "", observaciones: "", persona_id: "", tipo: "interno" as "interno" | "externo" })
  const [fotoSalidaFile, setFotoSalidaFile] = useState<File | null>(null)
  const [fotoSalidaPreview, setFotoSalidaPreview] = useState<string | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detalleAlquileres, setDetalleAlquileres] = useState<AlquilerEquipo[]>([])

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

  const loadPersonasClientes = async () => {
    try {
      const [pr, cr] = await Promise.all([
        personasService.getPersonas({ page: 1 }),
        clientesService.getClientes({ per_page: 50 }),
      ])
      setPersonas(pr.data)
      setClientes(cr.data)
    } catch { /* silent */ }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEquipos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filtroEstado])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (alquilerModalOpen) loadPersonasClientes()
  }, [alquilerModalOpen])

  useEffect(() => {
    if (clienteSearch) {
      const t = setTimeout(() => {
        clientesService.getClientes({ search: clienteSearch, per_page: 50 }).then(r => setClientes(r.data))
      }, 300)
      return () => clearTimeout(t)
    } else {
      clientesService.getClientes({ per_page: 50 }).then(r => setClientes(r.data)).catch(() => {})
    }
  }, [clienteSearch])

  const handleSaveEquipo = async () => {
    try {
      if (equipoForm.id) {
        const form = new FormData()
        form.append("nombre", equipoForm.nombre || "")
        if (equipoForm.descripcion) form.append("descripcion", equipoForm.descripcion)
        form.append("precio_diario", String(equipoForm.precio_diario || 0))
        if (equipoForm.estado) form.append("estado", equipoForm.estado)
        if (fotoFile) form.append("foto", fotoFile)
        await equiposService.updateEquipo(equipoForm.id, form)
        toast.success("Equipo actualizado")
      } else {
        const form = new FormData()
        form.append("nombre", equipoForm.nombre || "")
        if (equipoForm.descripcion) form.append("descripcion", equipoForm.descripcion)
        form.append("precio_diario", String(equipoForm.precio_diario || 0))
        if (equipoForm.estado) form.append("estado", equipoForm.estado)
        if (fotoFile) form.append("foto", fotoFile)
        await equiposService.createEquipo(form)
        toast.success("Equipo creado")
      }
      setModalOpen(false)
      setFotoFile(null)
      setFotoPreview(null)
      loadEquipos()
    } catch { toast.error("Error al guardar equipo") }
  }

  const handleDeleteEquipo = async (id: string) => {
    if (!confirm("¿Eliminar este equipo?")) return
    try { await equiposService.deleteEquipo(id); toast.success("Equipo eliminado"); loadEquipos() }
    catch { toast.error("Error al eliminar") }
  }

  const handleCreateAlquiler = async () => {
    try {
      if (!selectedEquipo) return
      const form = new FormData()
      form.append("equipo_id", selectedEquipo.id)
      form.append("fecha_entrega", new Date(alquilerForm.fecha_entrega).toISOString())
      form.append("fecha_devolucion_esperada", new Date(alquilerForm.fecha_devolucion_esperada).toISOString())
      form.append("precio_total", String(calcularPrecio()))
      if (alquilerForm.observaciones) form.append("observaciones", alquilerForm.observaciones)
      if (fotoSalidaFile) form.append("foto_salida", fotoSalidaFile)

      if (alquilerForm.tipo === "interno") form.append("persona_id", alquilerForm.persona_id || personas[0]?.id || "")
      else {
        if (!selectedClienteId) { toast.error("Seleccione o registre un cliente"); return }
        form.append("cliente_externo_id", selectedClienteId)
      }

      await equiposService.createAlquiler(form)
      toast.success("Alquiler registrado")
      setAlquilerModalOpen(false)
      setSelectedClienteId("")
      setFotoSalidaFile(null)
      setFotoSalidaPreview(null)
      loadEquipos()
    } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al crear alquiler") }
  }

  const handleCreateCliente = async () => {
    try {
      if (!nuevoClienteForm.nombres.trim()) { toast.error("Nombre obligatorio"); return }
      const nuevo = await clientesService.createCliente(nuevoClienteForm)
      toast.success("Cliente registrado")
      setClientes(prev => [nuevo, ...prev])
      setSelectedClienteId(nuevo.id)
      setCreandoCliente(false)
      setNuevoClienteForm({ nombres: "", apellidos: "", cedula: "", correo: "", celular: "" })
    } catch { toast.error("Error al crear cliente") }
  }

  const calcularPrecio = () => {
    if (!selectedEquipo || !alquilerForm.fecha_entrega || !alquilerForm.fecha_devolucion_esperada) return 0
    const inicio = new Date(alquilerForm.fecha_entrega)
    const fin = new Date(alquilerForm.fecha_devolucion_esperada)
    const dias = Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)))
    return dias * selectedEquipo.precio_diario
  }

  const openDetail = async (equipo: Equipo) => {
    try {
      const alquileres = await equiposService.getAlquileres({ equipo_id: equipo.id })
      setDetalleAlquileres(alquileres)
      setSelectedEquipo(equipo)
      setDetailOpen(true)
    } catch { toast.error("Error al cargar historial") }
  }

  const openAlquilerModal = (equipo: Equipo) => {
    setSelectedEquipo(equipo)
    setAlquilerForm({ fecha_entrega: new Date().toISOString().slice(0, 16), fecha_devolucion_esperada: "", foto_salida_url: "", observaciones: "", persona_id: "", tipo: "interno" })
    setCreandoCliente(false)
    setSelectedClienteId("")
    setFotoSalidaFile(null)
    setFotoSalidaPreview(null)
    setAlquilerModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>Servicios · Infraestructura</div>
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>Alquiler de Equipos</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/servicios/equipos/alquileres" className="px-4 py-3 rounded-2xl bg-white border text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <HugeiconsIcon icon={Calendar03Icon} size={15} /> Ver Alquileres
            </Link>
            <button onClick={() => { setEquipoForm({ nombre: "", descripcion: "", foto_url: "", precio_diario: 0 }); setFotoFile(null); setFotoPreview(null); setModalOpen(true) }} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 hover:opacity-90 active:scale-[0.97]">
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
                    <img src={eq.foto_url} alt={eq.nombre} className="w-full h-full object-cover" />
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
                      <button onClick={() => { setEquipoForm(eq); setFotoFile(null); setFotoPreview(null); setModalOpen(true) }} className="size-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10" title="Editar"><HugeiconsIcon icon={Edit01Icon} size={12} /></button>
                      <button onClick={() => handleDeleteEquipo(eq.id)} className="size-7 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100" title="Eliminar"><Trash2 size={12} className="text-red-500" /></button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => openDetail(eq)} className="flex-1 py-2 rounded-xl text-[10px] font-bold border hover:bg-gray-50 transition-colors" style={{ borderColor: COLORS.BORDER_SUBTLE }}>Historial</button>
                    <button onClick={() => openAlquilerModal(eq)} disabled={eq.estado !== "disponible"} className={cn("flex-1 py-2 rounded-xl text-[10px] font-bold text-white transition-all", eq.estado === "disponible" ? "bg-amber-500 hover:bg-amber-600" : "bg-gray-300 cursor-not-allowed")}>Alquilar</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Equipo */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div><h2 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>{equipoForm.id ? "Editar Equipo" : "Nuevo Equipo"}</h2><p className="text-xs opacity-40 mt-0.5">Catálogo de equipos</p></div>
                <button onClick={() => setModalOpen(false)} className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Nombre</label><input type="text" value={equipoForm.nombre} onChange={e => setEquipoForm({ ...equipoForm, nombre: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20" style={{ borderColor: COLORS.BORDER_SUBTLE }} /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Descripción</label><textarea value={equipoForm.descripcion || ""} onChange={e => setEquipoForm({ ...equipoForm, descripcion: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 resize-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Precio diario ($)</label><input type="number" value={equipoForm.precio_diario} onChange={e => setEquipoForm({ ...equipoForm, precio_diario: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20" style={{ borderColor: COLORS.BORDER_SUBTLE }} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Foto</label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer">
                        <div className="px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none hover:bg-gray-100 transition-colors text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          {fotoFile ? fotoFile.name : equipoForm.foto_url ? "Cambiar foto" : "Seleccionar archivo"}
                        </div>
                        <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { setFotoFile(file); setFotoPreview(URL.createObjectURL(file)) } }} />
                      </label>
                      {(fotoPreview || equipoForm.foto_url) && (
                        <div className="size-12 rounded-xl overflow-hidden shrink-0 border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          <img src={fotoPreview || equipoForm.foto_url} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    {equipoForm.foto_url && !fotoFile && <p className="text-[9px] opacity-40 mt-1">Foto actual</p>}
                  </div>
                </div>
                {equipoForm.id && <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Estado</label><select value={equipoForm.estado || "disponible"} onChange={e => setEquipoForm({ ...equipoForm, estado: e.target.value as Equipo["estado"] })} className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }}><option value="disponible">Disponible</option><option value="alquilado">Alquilado</option><option value="mantenimiento">En mantenimiento</option></select></div>}
              </div>
              <div className="px-6 py-5 bg-gray-50 border-t flex justify-end gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button onClick={() => setModalOpen(false)} className="px-6 py-3 rounded-xl bg-black/5 text-sm font-bold text-charcoal/60 hover:bg-black/10">Cancelar</button>
                <button onClick={handleSaveEquipo} className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20">Guardar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Alquiler */}
      <AnimatePresence>
        {alquilerModalOpen && selectedEquipo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAlquilerModalOpen(false)} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-3xl w-full max-w-2xl overflow-y-auto shadow-2xl max-h-[90vh] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="shrink-0 p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div><h2 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Nuevo Alquiler</h2><p className="text-xs opacity-40 mt-0.5">{selectedEquipo.nombre} · ${selectedEquipo.precio_diario}/día</p></div>
                <button onClick={() => setAlquilerModalOpen(false)} className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Fecha entrega</label><input type="datetime-local" value={alquilerForm.fecha_entrega} onChange={e => setAlquilerForm({ ...alquilerForm, fecha_entrega: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-amber-500/20" style={{ borderColor: COLORS.BORDER_SUBTLE }} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Devolución esperada</label><input type="datetime-local" value={alquilerForm.fecha_devolucion_esperada} onChange={e => setAlquilerForm({ ...alquilerForm, fecha_devolucion_esperada: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-amber-500/20" style={{ borderColor: COLORS.BORDER_SUBTLE }} /></div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">Precio estimado</span>
                  <span className="text-lg font-black text-amber-700">${calcularPrecio().toFixed(2)}</span>
                </div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Foto salida</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none hover:bg-gray-100 transition-colors text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        {fotoSalidaFile ? fotoSalidaFile.name : "Seleccionar archivo"}
                      </div>
                      <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { setFotoSalidaFile(file); setFotoSalidaPreview(URL.createObjectURL(file)) } }} />
                    </label>
                    {fotoSalidaPreview && (
                      <div className="size-14 rounded-xl overflow-hidden shrink-0 border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <img src={fotoSalidaPreview} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Observaciones</label><textarea value={alquilerForm.observaciones} onChange={e => setAlquilerForm({ ...alquilerForm, observaciones: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 resize-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} /></div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Responsable</label>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                    {["interno", "externo"].map(t => (
                      <button key={t} onClick={() => setAlquilerForm({ ...alquilerForm, tipo: t as "interno" | "externo" })} className={cn("flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all", alquilerForm.tipo === t ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40")}>{t === "interno" ? "Staff" : "Externo"}</button>
                    ))}
                  </div>
                  {alquilerForm.tipo === "interno" ? (
                    <select value={alquilerForm.persona_id} onChange={e => setAlquilerForm({ ...alquilerForm, persona_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }}><option value="">Seleccionar...</option>{personas.map(p => <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>)}</select>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2"><input type="text" value={clienteSearch} onChange={e => setClienteSearch(e.target.value)} placeholder="Buscar cliente..." className="flex-1 px-4 py-2.5 rounded-xl border bg-gray-50 text-xs outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                        <button onClick={() => { setCreandoCliente(!creandoCliente); if (!creandoCliente) setNuevoClienteForm({ nombres: "", apellidos: "", cedula: "", correo: "", celular: "" }) }} className="px-3 py-2.5 rounded-xl border text-[10px] font-bold hover:bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>Nuevo</button>
                      </div>
                      {creandoCliente && (
                        <div className="space-y-2 p-3 bg-gray-50 rounded-xl border">
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" value={nuevoClienteForm.nombres} onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, nombres: e.target.value })} placeholder="Nombres *" className="w-full px-3 py-2 rounded-lg border bg-white text-xs outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                            <input type="text" value={nuevoClienteForm.apellidos} onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, apellidos: e.target.value })} placeholder="Apellidos" className="w-full px-3 py-2 rounded-lg border bg-white text-xs outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                          </div>
                          <button onClick={handleCreateCliente} className="w-full py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">Registrar Cliente</button>
                        </div>
                      )}
                      <div className="max-h-32 overflow-y-auto divide-y border rounded-xl bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        {clientes.map(c => (
                          <button key={c.id} onClick={() => { setSelectedClienteId(c.id); setClienteSearch("") }} className={cn("w-full text-left px-4 py-2.5 hover:bg-gray-50 text-xs font-medium", selectedClienteId === c.id && "bg-emerald-50 border-l-2 border-emerald-500")}>{c.nombres} {c.apellidos} {c.cedula && `· ${c.cedula}`}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="shrink-0 px-6 py-5 bg-gray-50 border-t flex justify-end gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button onClick={() => setAlquilerModalOpen(false)} className="px-6 py-3 rounded-xl bg-black/5 text-sm font-bold text-charcoal/60 hover:bg-black/10">Cancelar</button>
                <button onClick={handleCreateAlquiler} className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20">Registrar Alquiler</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal detalle equipo */}
      <AnimatePresence>
        {detailOpen && selectedEquipo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailOpen(false)} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
              <div className="p-6 border-b flex justify-between items-center shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div><h2 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>{selectedEquipo.nombre}</h2><p className="text-xs opacity-40 mt-0.5">{selectedEquipo.descripcion || "Sin descripción"}</p></div>
                <button onClick={() => setDetailOpen(false)} className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {selectedEquipo.foto_url && (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100"><img src={selectedEquipo.foto_url} alt={selectedEquipo.nombre} className="w-full h-full object-cover" /></div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-gray-50"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precio diario</p><p className="text-lg font-black" style={{ color: COLORS.ACCENT }}>${selectedEquipo.precio_diario}</p></div>
                  <div className="p-4 rounded-2xl bg-gray-50"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Estado</p><span className={cn("inline-block mt-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border", STATUS_COLORS[selectedEquipo.estado])}>{STATUS_LABELS[selectedEquipo.estado]}</span></div>
                </div>
                <div><p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Historial de alquileres ({detalleAlquileres.length})</p>
                  {detalleAlquileres.length === 0 ? (
                    <p className="text-xs opacity-30 py-4 text-center">Sin alquileres registrados</p>
                  ) : (
                    <div className="space-y-2">
                      {detalleAlquileres.map(a => (
                        <div key={a.id} className={cn("p-4 rounded-2xl border", a.estado === "activo" ? "bg-amber-50 border-amber-200" : a.estado === "vencido" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200")}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>{new Date(a.fecha_entrega).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                              <p className="text-[10px] opacity-50 mt-0.5">Hasta: {new Date(a.fecha_devolucion_esperada).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</p>
                            </div>
                            <span className={cn("text-[9px] font-bold uppercase px-2 py-1 rounded-lg", a.estado === "activo" ? "bg-amber-200 text-amber-800" : a.estado === "vencido" ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800")}>{a.estado}</span>
                          </div>
                          {a.foto_salida_url && a.foto_retorno_url && (
                            <div className="mt-3 pt-3 border-t border-black/10 grid grid-cols-2 gap-2">
                              <div><p className="text-[8px] opacity-40 uppercase tracking-wider mb-1">Salida</p><img src={a.foto_salida_url} className="w-full aspect-square object-cover rounded-lg" /></div>
                              <div><p className="text-[8px] opacity-40 uppercase tracking-wider mb-1">Retorno</p><img src={a.foto_retorno_url} className="w-full aspect-square object-cover rounded-lg" /></div>
                            </div>
                          )}
                          <p className="text-xs font-bold mt-2 text-right" style={{ color: COLORS.CHARCOAL }}>${Number(a.precio_total).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
