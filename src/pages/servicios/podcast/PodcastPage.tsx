import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Link, useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PackageIcon, Calendar03Icon, MatrixIcon, ArrowLeft02Icon, ArrowRight02Icon, Download02Icon, Clock01Icon, ArrowDown01Icon, Search01Icon, Cancel01Icon, CheckmarkCircle04Icon, Edit01Icon, Delete01Icon } from "@hugeicons/core-free-icons"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { podcastService, type ReservaPodcast, type PaquetePodcast } from "@/services/podcast.service"
import { toast } from "sonner"
import html2canvas from "html2canvas-pro"
import { jsPDF } from "jspdf"
import { PodcastKPIs } from "./components/PodcastKPIs"
import { PodcastCalendar } from "./components/PodcastCalendar"
import { getWeekRange, getWeekDays } from "./components/podcast-calendar.utils"
import { ReservaModal } from "./components/ReservaModal"
import { DetalleReservaModal } from "./components/DetalleReservaModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"

const hours = Array.from({ length: 14 }, (_, i) => i + 7)

export function PodcastPage() {
  const navigate = useNavigate()
  const [paquetes, setPaquetes] = useState<PaquetePodcast[]>([])
  const [loading, setLoading] = useState(true)
  const [reservas, setReservas] = useState<ReservaPodcast[]>([])

  const [vista, setVista] = useState<"calendario" | "lista">("calendario")
  const [fechaRef, setFechaRef] = useState(() => new Date())
  const [filtroEstado, setFiltroEstado] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const [reservaModalOpen, setReservaModalOpen] = useState(false)
  const [editingReserva, setEditingReserva] = useState<ReservaPodcast | null>(null)
  const [detalleReserva, setDetalleReserva] = useState<ReservaPodcast | null>(null)
  const [detalleOpen, setDetalleOpen] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const { monday, sunday } = useMemo(() => getWeekRange(fechaRef), [fechaRef])
  const weekDays = useMemo(() => getWeekDays(monday), [monday])

  const loadReservas = useCallback(async () => {
    try {
      const filters: Record<string, string> = {}
      if (filtroEstado) filters.estado = filtroEstado
      setReservas(await podcastService.getReservas(filters))
    } catch { toast.error("Error al cargar reservas") }
  }, [filtroEstado])

  useEffect(() => {
    Promise.all([
      podcastService.getPaquetes()
        .then(setPaquetes)
        .catch(() => toast.error("Error al cargar paquetes")),
      (() => {
        const filters: Record<string, string> = {}
        if (filtroEstado) filters.estado = filtroEstado
        return podcastService.getReservas(filters)
          .then(setReservas)
          .catch(() => toast.error("Error al cargar reservas"))
      })(),
    ]).finally(() => setLoading(false))
  }, [filtroEstado])

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (searchQuery && vista === "calendario") setVista("lista")
  }, [searchQuery, vista])

  const filtered = useMemo(() => {
    let list = reservas
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(r => {
        const nombre = r.cliente_externo
          ? `${r.cliente_externo.nombres} ${r.cliente_externo.apellidos || ""}`.toLowerCase()
          : r.persona ? `${r.persona.nombres} ${r.persona.apellidos}`.toLowerCase() : ""
        const titulo = (r.titulo || r.paquete?.nombre || "").toLowerCase()
        return nombre.includes(q) || titulo.includes(q)
      })
    }
    return list
  }, [reservas, searchQuery])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ReservaPodcast[]> = {}
    filtered
      .slice()
      .sort((a, b) => new Date(b.fecha_reserva).getTime() - new Date(a.fecha_reserva).getTime())
      .forEach(r => {
        const dateKey = new Date(r.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", {
          year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
        })
        if (!groups[dateKey]) groups[dateKey] = []
        groups[dateKey].push(r)
      })
    return Object.entries(groups)
  }, [filtered])

  useEffect(() => {
    if (Object.keys(expandedGroups).length === 0 && groupedByDate.length > 0) {
      setExpandedGroups({ [groupedByDate[0][0]]: true })
    }
  }, [groupedByDate, expandedGroups])

  const handleEdit = (r: ReservaPodcast) => {
    setEditingReserva(r)
    setReservaModalOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setDeletingItem(true)
    try {
      await podcastService.deleteReserva(deleteConfirm.id)
      toast.success("Reserva anulada")
      setDeleteConfirm(null)
      loadReservas()
    } catch { toast.error("Error al anular reserva") }
    finally { setDeletingItem(false) }
  }

  const handleRegistrarPago = async (id: string) => {
    try {
      await podcastService.registrarPago(id)
      toast.success("Pago registrado")
      loadReservas()
    } catch { toast.error("Error al registrar pago") }
  }

  const toggleGroup = (date: string) => {
    setExpandedGroups(prev => ({ ...prev, [date]: !prev[date] }))
  }

  const ESTADO_COLORS: Record<string, string> = {
    pendiente: "bg-blue-100 text-blue-700 border-blue-200",
    confirmado: "bg-amber-100 text-amber-700 border-amber-200",
    en_progreso: "bg-indigo-100 text-indigo-700 border-indigo-200",
    completado: "bg-green-100 text-green-700 border-green-200",
    cancelado: "bg-red-100 text-red-700 border-red-200",
  }

  const handleReservaSaved = () => {
    loadReservas()
  }

  const handleDownloadPDF = async () => {
  if (!contentRef.current) return
  setDownloading(true)
  const el = contentRef.current
  const originalOverflow = el.style.overflow
  el.style.overflow = "visible"

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: false,
      logging: false,
      onclone: (doc) => {
        if (vista === "lista") {
          const s = doc.createElement("style")
          s.textContent =
            "table th:last-child, table td:last-child { display: none !important; }"
          doc.head.appendChild(s)
        }
      },
    })

    const imgData = canvas.toDataURL("image/png")

    // ── Configuración del PDF ──
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
    const pageWidth = pdf.internal.pageSize.getWidth()   // 297mm
    const pageHeight = pdf.internal.pageSize.getHeight() // 210mm
    const margin = 10 // mm

    // ── Título principal ──
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(30, 30, 30)
    const titulo = vista === "calendario" ? "Horario de Podcast" : "Lista de Reservas - Podcast"
    // text(text, x, y) — "center" como align hace que x sea el centro
    pdf.text(titulo, pageWidth / 2, margin + 8, { align: "center" })

    // ── Subtítulo con rango de semana (solo en vista calendario) ──
    if (vista === "calendario") {
      const formatFecha = (d: Date) =>
        d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
      const subtitulo = `Semana del ${formatFecha(monday)} al ${formatFecha(sunday)}`
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(100, 100, 100)
      pdf.text(subtitulo, pageWidth / 2, margin + 15, { align: "center" })
    }

    // ── Imagen centrada debajo del header ──
    const headerHeight = vista === "calendario" ? margin + 20 : margin + 14 // espacio para textos
    const availableWidth = pageWidth - margin * 2
    const availableHeight = pageHeight - headerHeight - margin

    // Calcular dimensiones manteniendo aspect ratio
    const canvasRatio = canvas.height / canvas.width
    let imgWidth = availableWidth
    let imgHeight = imgWidth * canvasRatio

    // Si se pasa del alto disponible, ajustar por alto
    if (imgHeight > availableHeight) {
      imgHeight = availableHeight
      imgWidth = imgHeight / canvasRatio
    }

    // Centrar horizontalmente
    const xPos = (pageWidth - imgWidth) / 2
    const yPos = headerHeight

    pdf.addImage(imgData, "PNG", xPos, yPos, imgWidth, imgHeight)

    const label = vista === "calendario" ? "horario" : "lista"
    pdf.save(`reservas-podcast-${label}.pdf`)
    toast.success("PDF descargado")
  } catch (e) {
    console.error("Error al generar PDF:", e)
    toast.error("Error al generar PDF")
  } finally {
    el.style.overflow = originalOverflow
    setDownloading(false)
  }
}

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            
            <h1 className="text-3xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Reservas de Podcast
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/servicios/podcast/historial"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold border transition-all active:scale-[0.97] hover:bg-gray-50"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
            >
              <HugeiconsIcon icon={Clock01Icon} size={14} />
              Historial
            </Link>
            <Link
              to="/servicios/podcast/paquetes"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all active:scale-[0.97]"
              style={{ color: COLORS.CHARCOAL, backgroundColor: "oklch(0.95 0 0)" }}
            >
              <HugeiconsIcon icon={PackageIcon} size={14} />
              Gestiona tus paquetes
            </Link>
            <button
              onClick={() => navigate("/servicios/podcast/nueva")}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-xl shadow-violet-500/20"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              <Plus size={18} strokeWidth={2.5} color="white" />
              Nueva Reserva
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-6 lg:p-8 gap-6 min-h-0 overflow-y-auto">
        <PodcastKPIs reservas={reservas} />

        <main className="bg-white rounded-[2.5rem] border shadow-2xl shadow-black/5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="shrink-0 px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 bg-gray-50/50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 p-0.5 bg-gray-200/70 rounded-xl">
                {([
                  { k: "calendario" as const, label: "Calendario", icon: Calendar03Icon },
                  { k: "lista" as const, label: "Lista", icon: MatrixIcon },
                ]).map(({ k, label, icon }) => (
                  <button
                    key={k}
                    onClick={() => setVista(k)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-xs font-bold transition-all",
                      vista === k ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40 hover:text-charcoal/60"
                    )}
                  >
                    <HugeiconsIcon icon={icon} size={14} />
                    {label}
                  </button>
                ))}
              </div>

              {vista === "calendario" && (
                <>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => { const d = new Date(fechaRef); d.setDate(d.getDate() - 7); setFechaRef(d) }}
                      className="size-7 flex items-center justify-center rounded-full hover:bg-black/5">
                      <HugeiconsIcon icon={ArrowLeft02Icon} size={14} className="opacity-50" />
                    </button>
                    <button onClick={() => setFechaRef(new Date())}
                      className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-black/5 hover:bg-black/10 transition-all opacity-60 hover:opacity-100">
                      Hoy
                    </button>
                    <span className="text-[11px] font-bold opacity-60 min-w-[120px] text-center">
                      {monday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – {sunday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </span>
                    <button onClick={() => { const d = new Date(fechaRef); d.setDate(d.getDate() + 7); setFechaRef(d) }}
                      className="size-7 flex items-center justify-center rounded-full hover:bg-black/5">
                      <HugeiconsIcon icon={ArrowRight02Icon} size={14} className="opacity-50" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 ml-4 text-[10px] font-medium opacity-40">
                    <span className="flex items-center gap-1"><span className="size-2 rounded bg-blue-100 border border-blue-200" /> Pendiente</span>
                    <span className="flex items-center gap-1"><span className="size-2 rounded bg-amber-100 border border-amber-200" /> Confirmado</span>
                    <span className="flex items-center gap-1"><span className="size-2 rounded bg-indigo-100 border border-indigo-200" /> En progreso</span>
                    <span className="flex items-center gap-1"><span className="size-2 rounded bg-green-100 border border-green-200" /> Completado</span>
                    <span className="flex items-center gap-1"><span className="size-2 rounded bg-red-100 border border-red-200" /> Cancelado</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-52">
                <HugeiconsIcon icon={Search01Icon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Buscar cliente o reserva..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border bg-gray-50/60 text-[10px] font-semibold outline-none"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                />
                {searchInput && (
                  <button onClick={() => { setSearchInput(""); setSearchQuery("") }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-35 hover:opacity-100">
                    <HugeiconsIcon icon={Cancel01Icon} size={11} />
                  </button>
                )}
              </div>
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="px-3 py-2 rounded-xl border bg-gray-50 text-[10px] font-medium outline-none"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="en_progreso">En progreso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-gray-50 text-[10px] font-bold transition-all active:scale-[0.97] disabled:opacity-50"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
              >
                <HugeiconsIcon icon={Download02Icon} size={14} />
                {downloading ? "Generando…" : "PDF"}
              </button>
            </div>
          </div>

          <div ref={contentRef}>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="space-y-3 w-full max-w-lg px-8">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : vista === "calendario" ? (
              <PodcastCalendar
                weekDays={weekDays}
                horas={hours}
                reservas={reservas}
                onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }}
              />
            ) : (
              <div className="p-6 space-y-4">
                {groupedByDate.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-sm font-bold opacity-30" style={{ color: COLORS.CHARCOAL }}>
                      {searchQuery ? `Sin resultados para "${searchQuery}"` : "No hay reservas registradas"}
                    </p>
                  </div>
                ) : (
                  groupedByDate.map(([date, items]) => {
                    const isOpen = !!expandedGroups[date]
                    const dayTotal = items.reduce((s, r) => s + Number(r.precio_total || 0), 0)
                    return (
                      <div key={date} className="border rounded-2xl bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <div onClick={() => toggleGroup(date)}
                          className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-black/[0.01] transition-colors select-none">
                          <div className="flex items-center gap-3">
                            <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                              <HugeiconsIcon icon={ArrowDown01Icon} size={15} className="opacity-40" />
                            </motion.div>
                            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: COLORS.CHARCOAL }}>{date}</h3>
                            <span className="text-[10px] opacity-40 font-bold">({items.length})</span>
                          </div>
                          <span className="text-xs font-bold" style={{ color: "oklch(0.55 0.15 150)" }}>
                            Total: ${dayTotal.toLocaleString()}
                          </span>
                        </div>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                              <div className="divide-y border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                {items.map(r => {
                                  const color = ESTADO_COLORS[r.estado] || "bg-gray-100 text-gray-600 border-gray-200"
                                  return (
                                    <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                      onClick={() => { setDetalleReserva(r); setDetalleOpen(true) }}>
                                      <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", r.estado === "pendiente" ? "bg-blue-100" : r.estado === "confirmado" ? "bg-amber-100" : r.estado === "en_progreso" ? "bg-indigo-100" : r.estado === "completado" ? "bg-green-100" : "bg-red-100")}>
                                        <HugeiconsIcon icon={r.estado === "completado" ? CheckmarkCircle04Icon : Clock01Icon} size={14}
                                          className={r.estado === "pendiente" ? "text-blue-600" : r.estado === "confirmado" ? "text-amber-600" : r.estado === "en_progreso" ? "text-indigo-600" : r.estado === "completado" ? "text-green-600" : "text-red-600"} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-extrabold truncate" style={{ color: COLORS.CHARCOAL }}>
                                          {r.cliente_externo ? `${r.cliente_externo.nombres} ${r.cliente_externo.apellidos || ""}`.trim() :
                                           r.persona ? `${r.persona.nombres} ${r.persona.apellidos}` : "—"}
                                        </p>
                                        <p className="text-[10px] opacity-45 font-bold truncate">
                                          {r.titulo || r.paquete?.nombre || "Sin título"}
                                          {" · "}{r.hora_inicio?.substring(0, 5)} – {r.hora_fin?.substring(0, 5)}
                                        </p>
                                      </div>
                                      <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase shrink-0", color)}>
                                        {r.estado}
                                      </span>
                                      <span className="text-xs font-bold w-20 text-right shrink-0" style={{ color: COLORS.CHARCOAL }}>
                                        ${Number(r.precio_total).toLocaleString()}
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                        {!r.pago_registrado && (
                                          <button onClick={() => handleRegistrarPago(r.id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
                                            style={{ backgroundColor: COLORS.ACCENT }}>
                                            <HugeiconsIcon icon={CheckmarkCircle04Icon} size={11} />
                                            Pago
                                          </button>
                                        )}
                                        <button onClick={() => handleEdit(r)}
                                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: COLORS.TEXT_MUTED }}>
                                          <HugeiconsIcon icon={Edit01Icon} size={13} />
                                        </button>
                                        <button onClick={() => handleDelete(r.id, r.titulo || r.paquete?.nombre || "Sin título")}
                                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: COLORS.TEXT_MUTED }}>
                                          <HugeiconsIcon icon={Delete01Icon} size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <ReservaModal
        key={editingReserva?.id || "edit"}
        isOpen={reservaModalOpen}
        onClose={() => { setReservaModalOpen(false); setEditingReserva(null) }}
        paquetes={paquetes}
        editingReserva={editingReserva}
        onSaved={handleReservaSaved}
      />

      <DetalleReservaModal
        isOpen={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        reserva={detalleReserva}
      />

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Anular Reserva"
        message={`¿Anular la reserva de "${deleteConfirm?.name}"?`}
        confirmText="Anular"
        cancelText="Cancelar"
        isDangerous
        isLoading={deletingItem}
        icon="trash"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
