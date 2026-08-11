import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon, SearchIcon, UserIcon, Home02Icon,
  Alert02Icon, ArrowLeft02Icon, CheckmarkCircle04Icon,
  Money01Icon, Clock01Icon, ArrowUp01Icon, ArrowDown01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { X } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { equiposService, type AlquilerEquipo } from "@/services/equipos.service"
import { toast } from "sonner"
import { Link, useNavigate, useSearchParams } from "react-router"

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

type SortField = "entrega" | "devolucion" | "precio"

function SortHeader({ field, label, sortField, sortDir, onSort }: {
  field: SortField
  label: string
  sortField: SortField | null
  sortDir: "asc" | "desc"
  onSort: (field: SortField) => void
}) {
  return (
    <th
      className="p-3 text-left text-[9px] font-bold uppercase tracking-widest opacity-40 cursor-pointer select-none hover:opacity-70"
      style={{ color: COLORS.CHARCOAL }}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className="inline-flex flex-col leading-none ml-0.5">
          <HugeiconsIcon icon={ArrowUp01Icon} size={9} className={sortField === field && sortDir === "asc" ? "opacity-100" : "opacity-20"} />
          <HugeiconsIcon icon={ArrowDown01Icon} size={9} className={sortField === field && sortDir === "desc" ? "opacity-100" : "opacity-20"} />
        </span>
      </div>
    </th>
  )
}

export function AlquileresListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [alquileres, setAlquileres] = useState<AlquilerEquipo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get("estado") || "")
  const [vencidos, setVencidos] = useState<AlquilerEquipo[]>([])

  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedAlquiler, setSelectedAlquiler] = useState<AlquilerEquipo | null>(null)

  const [devolverOpen, setDevolverOpen] = useState(false)
  const [devolverForm, setDevolverForm] = useState({ foto_retorno_url: "", observaciones: "" })
  const [fotoRetornoFile, setFotoRetornoFile] = useState<File | null>(null)
  const [fotoRetornoPreview, setFotoRetornoPreview] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const PER_PAGE = 15

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
      setPage(1)
    } catch { toast.error("Error al cargar alquileres") }
    finally { setLoading(false) }
  }

  useEffect(() => {
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const sorted = useMemo(() => {
    if (!sortField) return alquileres
    return [...alquileres].sort((a, b) => {
      let va: number, vb: number
      if (sortField === "entrega") {
        va = new Date(a.fecha_entrega).getTime()
        vb = new Date(b.fecha_entrega).getTime()
      } else if (sortField === "devolucion") {
        va = new Date(a.fecha_devolucion_esperada).getTime()
        vb = new Date(b.fecha_devolucion_esperada).getTime()
      } else {
        va = Number(a.precio_total)
        vb = Number(b.precio_total)
      }
      return sortDir === "asc" ? va - vb : vb - va
    })
  }, [alquileres, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE))
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const from = sorted.length === 0 ? 0 : (page - 1) * PER_PAGE + 1
  const to = Math.min(page * PER_PAGE, sorted.length)

  const stats = {
    total: sorted.length,
    activos: sorted.filter(a => a.estado === "activo").length,
    vencidos: sorted.filter(a => a.estado === "vencido" || (a.estado === "activo" && new Date(a.fecha_devolucion_esperada) < new Date())).length,
    ingresos: sorted.reduce((sum, a) => sum + Number(a.precio_total), 0),
  }

  const statCards = [
    { label: "Total", value: stats.total, color: "bg-gray-100 text-gray-500", icon: Home02Icon },
    { label: "Activos", value: stats.activos, color: "bg-amber-100 text-amber-600", icon: Clock01Icon },
    { label: "Vencidos", value: stats.vencidos, color: "bg-red-100 text-red-600", icon: Alert02Icon },
    { label: "Ingresos", value: `$${stats.ingresos.toFixed(0)}`, color: "bg-emerald-100 text-emerald-600", icon: Money01Icon },
  ]

  const needsAction = (a: AlquilerEquipo) => {
    const total = Number(a.cuenta_por_cobrar?.monto_total ?? a.precio_total)
    const abonado = Number(a.cuenta_por_cobrar?.monto_abonado ?? 0)
    return a.estado === "entregado" && total - abonado > 0
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="shrink-0 px-8 py-4 border-b bg-white sticky top-0 z-20 flex items-center gap-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <Link to="/servicios/equipos" className="size-9 flex items-center justify-center rounded-full hover:bg-gray-100">
          <HugeiconsIcon icon={ArrowLeft02Icon} size={18} style={{ color: COLORS.TEXT_MUTED }} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Alquileres de Equipos</h1>
          <p className="text-[10px] font-medium" style={{ color: COLORS.TEXT_MUTED }}>Registro general de todos los alquileres</p>
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

      <div className="shrink-0 px-8 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {statCards.map(card => (
            <div key={card.label} className="bg-white rounded-2xl border p-3.5 flex items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", card.color.split(" ")[0])}>
                <HugeiconsIcon icon={card.icon} size={18} className={card.color.split(" ")[1]} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">{card.label}</p>
                <p className="text-lg font-black" style={{ color: COLORS.CHARCOAL }}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <HugeiconsIcon icon={SearchIcon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar equipo o cliente..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-gray-50 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
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
      </div>

      <div className="flex-1 overflow-auto px-8 pb-6">
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
              <table className="w-full [&_td]:border [&_th]:border [&_td]:border-[oklch(0.85_0_0)] [&_th]:border-[oklch(0.85_0_0)]">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="p-3 text-left text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Equipo</th>
                    <th className="p-3 text-left text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Cliente</th>
                    <SortHeader field="entrega" label="Entrega" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader field="devolucion" label="Devolución" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="p-3 text-left text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Estado</th>
                    <SortHeader field="precio" label="Precio" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="p-3 text-left text-[9px] font-bold uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  {paginated.map(a => {
                    const isOverdue = (a.estado === "activo" || a.estado === "entregado") && new Date(a.fecha_devolucion_esperada) < new Date()
                    const displayEstado = a.estado === "vencido" ? "vencido" : isOverdue ? "vencido" : a.estado
                    const clienteNombre = getResponsable(a)
                    const needsAttn = needsAction(a)
                    return (
                      <tr
                        key={a.id}
                        className={cn("transition-colors cursor-pointer", needsAttn ? "bg-amber-50/60 hover:bg-amber-100/60" : "hover:bg-gray-50/60")}
                      >
                        <td className="p-3" onClick={() => { setSelectedAlquiler(a); setDetailOpen(true) }}><div className="flex items-center gap-2"><div className="size-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><HugeiconsIcon icon={Home02Icon} size={14} className="text-amber-600" /></div><span className="text-xs font-bold truncate max-w-[120px]" style={{ color: COLORS.CHARCOAL }}>{a.equipo?.nombre || "—"}</span></div></td>
                        <td className="p-3 text-xs font-medium opacity-70 max-w-[120px] truncate" onClick={() => { setSelectedAlquiler(a); setDetailOpen(true) }}>{clienteNombre}</td>
                        <td className="p-3 text-xs font-mono opacity-60" onClick={() => { setSelectedAlquiler(a); setDetailOpen(true) }}>{new Date(a.fecha_entrega).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="p-3 text-xs font-mono opacity-60" onClick={() => { setSelectedAlquiler(a); setDetailOpen(true) }}>{new Date(a.fecha_devolucion_esperada).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                        <td onClick={() => { setSelectedAlquiler(a); setDetailOpen(true) }}>
                          <div className="flex items-center gap-1.5 flex-wrap p-3">
                            <span className={cn("inline-block px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border", ESTADO_COLORS[displayEstado] || "bg-gray-100")}>{ESTADO_LABELS[displayEstado] || displayEstado}</span>
                            {(() => {
                              const total = Number(a.cuenta_por_cobrar?.monto_total ?? a.precio_total)
                              const abonado = Number(a.cuenta_por_cobrar?.monto_abonado ?? 0)
                              const saldo = total - abonado
                              return (
                                <span className={cn("inline-block px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border", saldo <= 0 ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200")}>
                                  {saldo <= 0 ? "Pago OK" : `Saldo $${saldo.toFixed(2)}`}
                                </span>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="p-3 text-xs font-bold" onClick={() => { setSelectedAlquiler(a); setDetailOpen(true) }} style={{ color: COLORS.CHARCOAL }}>${Number(a.precio_total).toFixed(2)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={(e) => { e.stopPropagation(); const p = new URLSearchParams(); if (search) p.set("search", search); if (filtroEstado) p.set("estado", filtroEstado); const qs = p.toString(); navigate(`/servicios/equipos/alquileres/${a.id}${qs ? `?${qs}` : ""}`) }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold opacity-50 hover:opacity-100 transition-opacity"
                              style={{ color: COLORS.CHARCOAL }}>
                              Ver detalle completo <HugeiconsIcon icon={ArrowRight01Icon} size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {sorted.length > 0 && (
              <div className="flex items-center justify-between gap-4 pt-2">
                <span className="text-xs font-medium opacity-40">
                  Mostrando {from} – {to} de {sorted.length} alquiler{sorted.length !== 1 ? "es" : ""}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  >
                    Anterior
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                    const pageNum = start + i
                    if (pageNum > totalPages) return null
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className="size-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all"
                        style={{
                          backgroundColor: page === pageNum ? COLORS.ACCENT : "transparent",
                          color: page === pageNum ? "white" : COLORS.TEXT_MUTED,
                        }}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal detalle */}
      <AnimatePresence>
        {detailOpen && selectedAlquiler && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-2xl w-full max-w-xl flex flex-col max-h-[85vh] shadow-2xl">
              <div className="shrink-0 p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div><h2 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Detalle de Alquiler</h2><p className="text-xs opacity-40 mt-0.5">{selectedAlquiler.equipo?.nombre}</p></div>
                <button onClick={() => setDetailOpen(false)} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 border" style={{ borderColor: COLORS.BORDER_SUBTLE }}><X size={18} /></button>
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
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cliente</p>
                  {selectedAlquiler.persona ? (
                    <div className="flex items-center gap-3 mt-2"><div className="size-10 rounded-xl bg-indigo-100 flex items-center justify-center"><HugeiconsIcon icon={UserIcon} size={18} className="text-indigo-600" /></div><div><p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{selectedAlquiler.persona.nombres} {selectedAlquiler.persona.apellidos}</p>{selectedAlquiler.persona.correo && <p className="text-[10px] opacity-50">{selectedAlquiler.persona.correo}</p>}</div></div>
                  ) : selectedAlquiler.cliente_externo ? (
                    <div className="flex items-center gap-3 mt-2"><div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center"><HugeiconsIcon icon={UserIcon} size={18} className="text-emerald-600" /></div><div><p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{selectedAlquiler.cliente_externo.nombres} {selectedAlquiler.cliente_externo.apellidos}</p><div className="flex flex-wrap gap-x-3 text-[10px] opacity-50">{selectedAlquiler.cliente_externo.cedula && <span>{selectedAlquiler.cliente_externo.cedula}</span>}{selectedAlquiler.cliente_externo.correo && <span>{selectedAlquiler.cliente_externo.correo}</span>}{selectedAlquiler.cliente_externo.celular && <span>{selectedAlquiler.cliente_externo.celular}</span>}</div></div></div>
                  ) : <p className="text-xs opacity-30 mt-2">No especificado</p>}
                </div>
                {selectedAlquiler.observaciones && <div className="p-4 rounded-2xl bg-gray-50"><p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Observaciones</p><p className="text-xs mt-1 opacity-70">{selectedAlquiler.observaciones}</p></div>}
              </div>
              <div className="shrink-0 px-6 py-5 bg-gray-50 border-t flex justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button onClick={() => setDetailOpen(false)} className="px-6 py-3 rounded-xl border text-sm font-bold transition-colors" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>Cerrar</button>
                {selectedAlquiler.estado === "pendiente" && (
                  <button onClick={handleEntregar} className="px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: COLORS.ACCENT }}><HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />Marcar como Entregado</button>
                )}
                {(selectedAlquiler.estado === "activo" || selectedAlquiler.estado === "vencido" || selectedAlquiler.estado === "entregado") && (
                  <button onClick={() => { setDevolverForm({ foto_retorno_url: "", observaciones: "" }); setFotoRetornoFile(null); setFotoRetornoPreview(null); setDevolverOpen(true) }} className="px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: COLORS.ACCENT }}>Registrar Devolución</button>
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
    </div>
  )
}
