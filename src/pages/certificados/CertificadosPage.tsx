/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon, BadgeCheckIcon } from "@hugeicons/core-free-icons"
import { X, Trash2, FileText, Eye, MoreHorizontal, Download } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { certificadosService, type Certificado, type EstudiantePanel } from "@/services/certificados.service"
import { toast } from "sonner"

const GREEN = "#0F9F6E"
const AMBER = "#D97706"
const BLUE = "#2563EB"
const GRAY = "#6B7280"
const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL

const ESTADO_CERT_STYLES: Record<string, string> = {
  generado: "text-emerald-700 border-emerald-200",
  entregado: "text-blue-700 border-blue-200",
  borrado: "text-gray-500 border-gray-200",
}
const ESTADO_CERT_BG: Record<string, string> = {
  generado: "bg-emerald-50", entregado: "bg-blue-50", borrado: "bg-gray-50",
}
const ESTADO_CERT_LABELS: Record<string, string> = {
  generado: "Emitido", entregado: "Entregado", borrado: "Borrado",
}

const TAB_CONFIG = [
  { key: "", label: "Todos", color: CHARCOAL },
  { key: "pendiente", label: "Pendientes", color: AMBER },
  { key: "generado", label: "Emitidos", color: GREEN },
  { key: "entregado", label: "Entregados", color: BLUE },
  { key: "borrado", label: "Borrados", color: GRAY },
]

const SORT_OPTIONS = [
  { k: "recientes", l: "Más recientes" },
  { k: "az", l: "A — Z" },
  { k: "pendientes", l: "Pendientes primero" },
]

export function CertificadosPage() {
  const [rows, setRows] = useState<EstudiantePanel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroCert, setFiltroCert] = useState("")
  const [sort, setSort] = useState("recientes")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [detailCert, setDetailCert] = useState<Certificado | null>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [detailOpen, setDetailOpen] = useState(false)

  const [emitirRow, setEmitirRow] = useState<EstudiantePanel | null>(null)
  const [emitirFile, setEmitirFile] = useState<File | null>(null)
  const [emitirPreview, setEmitirPreview] = useState<string | null>(null)
  const [emitirSubmitting, setEmitirSubmitting] = useState(false)

  const [deleteModal, setDeleteModal] = useState<{ id: string; nombre: string; curso: string } | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const loadPanel = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number | undefined> = { page, per_page: 15 }
      if (search) params.search = search
      if (filtroCert) params.estado_certificado = filtroCert
      const res = await certificadosService.getPanelEstudiantes(params)
      setRows(res.data)
      setTotalPages(res.last_page || 1)
      setTotal(res.total || 0)
    } catch { toast.error("Error al cargar datos") }
    finally { setLoading(false) }
  }, [search, filtroCert, page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPanel()
  }, [loadPanel])

  const sortedRows = [...rows].sort((a, b) => {
    if (sort === "az") return `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`)
    if (sort === "pendientes") return (a.certificado_id ? 1 : 0) - (b.certificado_id ? 1 : 0)
    return 0
  })

  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const menuBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const getIniciales = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  const getAvatarColor = (name: string) => {
    const colors = ["#0F9F6E", "#2563EB", "#7C3AED", "#D97706", "#DC2626"]
    return colors[(name.charCodeAt(0) || 0) % colors.length]
  }

  const STATUS_DOT: Record<string, string> = {
    generado: GREEN, entregado: BLUE, borrado: GRAY, pendiente: AMBER,
  }
  const STATUS_LABEL: Record<string, string> = {
    generado: "Emitido", entregado: "Entregado", borrado: "Borrado", pendiente: "Pendiente",
  }

  const tabCounts: Record<string, number> = {
    "": rows.length,
    pendiente: rows.filter(r => !r.certificado_id).length,
    generado: rows.filter(r => r.estado_certificado === "generado").length,
    entregado: rows.filter(r => r.estado_certificado === "entregado").length,
    borrado: rows.filter(r => r.estado_certificado === "borrado").length,
  }
  const conCert = rows.filter(r => r.certificado_id).length
  const sinCert = rows.filter(r => !r.certificado_id).length

  const handleEmitir = (row: EstudiantePanel) => {
    if (!row.matricula_id) { toast.error("El estudiante no tiene matrícula activa"); return }
    if (row.certificado_id) { toast.error("Ya tiene un certificado"); return }
    const input = document.createElement("input")
    input.type = "file"; input.accept = ".pdf,application/pdf"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (file.size > 512 * 1024) { toast.error("El PDF no debe superar los 500 KB"); return }
      setEmitirRow(row); setEmitirFile(file)
      setEmitirPreview(URL.createObjectURL(file))
    }
    input.click()
  }

  const confirmEmitir = async () => {
    if (!emitirRow || !emitirFile) return
    try {
      setEmitirSubmitting(true)
      const form = new FormData()
      form.append("matricula_id", emitirRow.matricula_id!)
      form.append("curso_abierto_id", emitirRow.curso_abierto_id)
      form.append("pdf", emitirFile)
      await certificadosService.createCertificado(form)
      toast.success(`Certificado emitido para ${emitirRow.nombres} ${emitirRow.apellidos}`)
      setEmitirRow(null); setEmitirFile(null)
      if (emitirPreview) URL.revokeObjectURL(emitirPreview)
      setEmitirPreview(null)
      loadPanel()
    } catch { toast.error("Error al emitir certificado") }
    finally { setEmitirSubmitting(false) }
  }

  const openDeleteModal = (row: EstudiantePanel) => {
    setDeleteModal({ id: row.certificado_id!, nombre: `${row.nombres} ${row.apellidos}`, curso: row.catalogo_nombre })
  }

  const confirmDelete = async () => {
    if (!deleteModal) return
    try {
      setDeleteSubmitting(true)
      await certificadosService.removePdf(deleteModal.id)
      toast.success("Certificado borrado (registro conservado)")
      setDeleteModal(null)
      loadPanel()
    } catch { toast.error("Error al borrar certificado") }
    finally { setDeleteSubmitting(false) }
  }

  const handleBulkDownload = () => {
    const certIds = sortedRows
      .filter(r => r.certificado_id && selectedIds.has(r.matricula_id))
      .map(r => r.certificado_id!)
    if (certIds.length === 0) { toast.error("No hay certificados seleccionados con PDF"); return }
    certIds.forEach(id => certificadosService.descargarPdf(id))
    toast.success(`Descargando ${certIds.length} certificado(s)`)
  }

  const handleBulkDelete = async () => {
    const certIds = sortedRows
      .filter(r => r.certificado_id && selectedIds.has(r.matricula_id))
      .map(r => r.certificado_id!)
    if (certIds.length === 0) { toast.error("No hay certificados seleccionados"); return }
    setBulkDeleting(true)
    try {
      await Promise.all(certIds.map(id => certificadosService.removePdf(id)))
      toast.success(`${certIds.length} certificado(s) borrados`)
      setSelectedIds(new Set())
      loadPanel()
    } catch { toast.error("Error al borrar certificados") }
    finally { setBulkDeleting(false) }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }

  const openDetail = async (certId: string) => {
    try {
      const [cert, hist] = await Promise.all([
        certificadosService.getCertificado(certId),
        certificadosService.getHistorial(certId),
      ])
      setDetailCert(cert)
      setHistorial(hist || [])
      setDetailOpen(true)
    } catch { toast.error("Error al cargar detalle") }
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#FAF8F5" }}>
      <header className="shrink-0 px-8 pt-8 pb-4 bg-white/90 backdrop-blur-md border-b" style={{ borderColor: BORDER }}>
        <h1 className="text-3xl font-bold tracking-tighter" style={{ color: CHARCOAL }}>Certificados</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm" style={{ color: CHARCOAL }}>
          <span>{total} estudiantes</span>
          <span className="opacity-30">·</span>
          <span style={{ color: conCert > 0 ? GREEN : "inherit" }}>{conCert} emitidos</span>
          <span className="opacity-30">·</span>
          <span style={{ color: sinCert > 0 ? AMBER : "inherit" }}>{sinCert} pendientes</span>
        </div>
      </header>

      <div className="shrink-0 px-8 py-3 bg-white/70 border-b space-y-3" style={{ borderColor: BORDER }}>
        <div className="flex gap-0">
          {TAB_CONFIG.map(t => (
            <button key={t.key || "todos"} onClick={() => { setFiltroCert(t.key); setPage(1) }}
              className="px-4 py-2 text-sm font-medium transition-all relative"
              style={{ color: filtroCert === t.key ? CHARCOAL : "oklch(0.7 0 0)" }}>
              {t.label}
              <span className="ml-1 text-xs opacity-50">({tabCounts[t.key] ?? rows.length})</span>
              {filtroCert === t.key && (
                <motion.div layoutId="cert-tab-line" className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full" style={{ backgroundColor: t.color }} />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <HugeiconsIcon icon={SearchIcon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por nombre o cédula..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border bg-gray-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20"
              style={{ borderColor: BORDER }} />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="px-3 py-2 rounded-xl border bg-gray-50 text-xs font-medium outline-none" style={{ borderColor: BORDER }}>
            {SORT_OPTIONS.map(o => <option key={o.k} value={o.k}>{o.l}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 lg:p-8">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white border" style={{ borderColor: BORDER }}>
                <div className="space-y-2 flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : sortedRows.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center space-y-3">
            <div className="size-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${AMBER}10` }}>
              <HugeiconsIcon icon={BadgeCheckIcon} size={28} opacity={0.3} color={AMBER} />
            </div>
            <p className="text-sm font-bold opacity-30">Sin resultados</p>
            <p className="text-xs opacity-20">Ajusta los filtros o emite nuevos certificados</p>
          </motion.div>
        ) : (
          <>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-4 px-6 py-3 bg-green-50/80 border border-green-100 rounded-2xl mb-4">
                <span className="text-sm font-bold text-green-700">
                  {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={handleBulkDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-green-200 text-green-700 hover:bg-green-100 transition-colors">
                    <Download size={14} />
                    Descargar
                  </button>
                  <button onClick={handleBulkDelete} disabled={bulkDeleting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                    <Trash2 size={14} />
                    {bulkDeleting ? "Borrando..." : "Eliminar"}
                  </button>
                  <button onClick={() => setSelectedIds(new Set())}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                    <X size={14} />
                    Deseleccionar
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border" style={{ borderColor: BORDER }}>
              <div className="divide-y" style={{ borderColor: `${BORDER}60` }}>
                {sortedRows.map((row) => {
                  const estado = row.certificado_id ? row.estado_certificado || "generado" : "pendiente"
                  const dotColor = STATUS_DOT[estado] || GRAY
                  const statusLabel = STATUS_LABEL[estado] || estado
                  const nombreCompleto = `${row.nombres} ${row.apellidos}`
                  const initials = getIniciales(nombreCompleto)
                  const avatarColor = getAvatarColor(nombreCompleto)
                  const isSelected = selectedIds.has(row.matricula_id)

                  return (
                    <motion.div
                      key={row.matricula_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-white hover:shadow-sm transition-all relative group"
                    >
                      {row.certificado_id && (
                        <input type="checkbox" checked={isSelected}
                          onChange={() => toggleSelect(row.matricula_id)}
                          className="accent-current rounded shrink-0" style={{ accentColor: GREEN, width: 16, height: 16 }} />
                      )}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="size-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                          style={{ backgroundColor: avatarColor }}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: CHARCOAL }}>{nombreCompleto}</p>
                          <p className="text-xs opacity-40">{row.cedula}</p>
                        </div>
                      </div>

                      <div className="hidden sm:block flex-1 min-w-0">
                        <p className="text-xs font-medium" style={{ color: CHARCOAL }}>{row.nombre_instancia || row.catalogo_nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ color: GREEN, backgroundColor: `${GREEN}08` }}>
                            {row.catalogo_nombre}
                          </span>
                          {row.modalidad && <span className="text-[10px] opacity-30 capitalize">· {row.modalidad}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                          <span className="size-2 rounded-full" style={{ backgroundColor: dotColor }} />
                          <span style={{ color: dotColor }}>{statusLabel}</span>
                        </span>

                        {estado === "pendiente" ? (
                          <button onClick={() => handleEmitir(row)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
                            style={{ backgroundColor: GREEN }}>
                            <HugeiconsIcon icon={BadgeCheckIcon} size={13} /> Emitir
                          </button>
                        ) : row.archivo_pdf_url ? (
                          <button onClick={() => certificadosService.descargarPdf(row.certificado_id!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-90 border"
                            style={{ color: dotColor, borderColor: `${dotColor}40`, backgroundColor: `${dotColor}08` }}>
                            <Download size={13} /> Descargar
                          </button>
                        ) : null}

                        <div className="relative">
                          <button ref={el => { menuBtnRefs.current[row.matricula_id] = el }}
                            onClick={(e) => {
                              if (menuOpen === row.matricula_id) { setMenuOpen(null); return }
                              const rect = e.currentTarget.getBoundingClientRect()
                              setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 })
                              setMenuOpen(row.matricula_id)
                            }}
                            className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-200/60 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i + 1} onClick={() => setPage(i + 1)}
                    className={cn("size-9 rounded-xl text-xs font-bold transition-colors", page === i + 1 ? "text-white shadow-sm" : "bg-white border hover:bg-gray-50")}
                    style={{ backgroundColor: page === i + 1 ? AMBER : undefined, borderColor: BORDER }}>{i + 1}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Context menu (fixed, outside scroll) */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
          <div className="fixed z-50 bg-white rounded-xl shadow-xl border py-1 min-w-[160px]"
            style={{ top: menuPos.top, left: menuPos.left, borderColor: BORDER }}>
            {rows.find(r => r.matricula_id === menuOpen)?.certificado_id && (
              <>
                <button onClick={() => { const certId = rows.find(r => r.matricula_id === menuOpen)?.certificado_id; if (certId) { openDetail(certId); setMenuOpen(null) } }}
                  className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 flex items-center gap-2" style={{ color: CHARCOAL }}>
                  <Eye size={13} /> Ver certificado
                </button>
                {rows.find(r => r.matricula_id === menuOpen)?.archivo_pdf_url && (
                  <button onClick={() => { const certId = rows.find(r => r.matricula_id === menuOpen)?.certificado_id; if (certId) { certificadosService.descargarPdf(certId); setMenuOpen(null) } }}
                    className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 flex items-center gap-2" style={{ color: CHARCOAL }}>
                    <Download size={13} /> Descargar
                  </button>
                )}
                <div className="border-t my-1" style={{ borderColor: BORDER }} />
                <button onClick={() => { const row = rows.find(r => r.matricula_id === menuOpen); if (row) { openDeleteModal(row); setMenuOpen(null) } }}
                  className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-red-50 flex items-center gap-2 text-red-600">
                  <Trash2 size={13} /> Eliminar
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Emitir modal - 2 columns */}
      <AnimatePresence>
        {!!(emitirRow && emitirFile) && (
          <ModalOverlay onClose={() => { setEmitirRow(null); setEmitirFile(null); if (emitirPreview) URL.revokeObjectURL(emitirPreview); setEmitirPreview(null) }}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: CHARCOAL }}>
                  <HugeiconsIcon icon={BadgeCheckIcon} size={20} style={{ color: GREEN }} />
                  Emitir certificado
                </h2>
                <p className="text-xs opacity-40 mt-0.5">Confirma los datos antes de emitir el documento</p>
              </div>
              <button onClick={() => { setEmitirRow(null); setEmitirFile(null); if (emitirPreview) URL.revokeObjectURL(emitirPreview); setEmitirPreview(null) }}
                className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: BORDER }}>
              <div className="p-5 space-y-4">
                <Ficha label="Estudiante" value={`${emitirRow?.nombres} ${emitirRow?.apellidos}`} />
                <Ficha label="Cédula" value={emitirRow?.cedula} />
                <Ficha label="Curso" value={emitirRow?.nombre_instancia || emitirRow?.catalogo_nombre || "—"} />
                <Ficha label="Fecha de emisión" value={new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })} />
              </div>
              <div className="p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Vista previa del PDF</p>
                </div>
                <div className="flex-1 rounded-xl border bg-gray-50 overflow-hidden min-h-[200px]" style={{ borderColor: BORDER }}>
                  {emitirPreview && <iframe src={emitirPreview} className="w-full h-full" title="preview" />}
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs opacity-50">
                  <FileText size={14} /> {emitirFile?.name}
                </div>
              </div>
            </div>
            <div className="px-6 py-5 bg-gray-50/80 border-t flex justify-end gap-3" style={{ borderColor: BORDER }}>
              <button onClick={() => { setEmitirRow(null); setEmitirFile(null); if (emitirPreview) URL.revokeObjectURL(emitirPreview); setEmitirPreview(null) }}
                className="px-6 py-3 rounded-xl text-sm font-bold opacity-50 hover:opacity-100">Cancelar</button>
              <button onClick={confirmEmitir} disabled={emitirSubmitting}
                className="px-8 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50 shadow-lg"
                style={{ backgroundColor: GREEN, boxShadow: `${GREEN}30 0 4px 14px` }}>
                {emitirSubmitting ? "Emitiendo..." : "Emitir certificado"}</button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Detalle */}
      <AnimatePresence>
        {detailOpen && detailCert && (
          <ModalOverlay onClose={() => setDetailOpen(false)}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
              <div>
                <h2 className="text-xl font-bold" style={{ color: CHARCOAL }}>{detailCert.codigo_certificado}</h2>
                <p className="text-xs opacity-40 mt-0.5">Detalle e historial del certificado</p>
              </div>
              <button onClick={() => setDetailOpen(false)} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <Ficha label="Estudiante" value={`${detailCert.estudiante?.nombres} ${detailCert.estudiante?.apellidos}`} />
                <Ficha label="Cédula" value={detailCert.cedula_impresa} />
                <Ficha label="Emitido" value={detailCert.fecha_emision ? new Date(detailCert.fecha_emision).toLocaleDateString("es-ES") : "—"} />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Estado</p>
                  <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", ESTADO_CERT_STYLES[detailCert.estado], ESTADO_CERT_BG[detailCert.estado])}>
                    {ESTADO_CERT_LABELS[detailCert.estado]}
                  </span>
                </div>
              </div>
              {historial.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-3">Historial</p>
                  <div className="relative pl-8 border-l-2 space-y-4" style={{ borderColor: `${COLORS.ACCENT}20` }}>
                    {historial.map((h: any, i: number) => (
                      <div key={i} className="relative -left-[33px] flex items-start gap-3">
                        <div className="size-3 rounded-full border-2 border-white shrink-0 mt-0.5" style={{ backgroundColor: h.accion === "Borrado" ? GRAY : h.accion === "Entregado" ? BLUE : GREEN }} />
                        <div>
                          <p className="text-xs font-bold">{h.accion}</p>
                          <p className="text-[10px] opacity-50">{h.fecha}{h.detalle ? ` · ${h.detalle}` : ""}{h.usuario ? ` · ${h.usuario}` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detailCert.archivo_pdf_url && (
                <button onClick={() => certificadosService.descargarPdf(detailCert.id)}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  style={{ color: GREEN, backgroundColor: `${GREEN}10` }}>
                  <Eye size={15} /> Ver y descargar PDF
                </button>
              )}
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteModal && (
          <ModalOverlay onClose={() => setDeleteModal(null)}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
              <h2 className="text-xl font-bold" style={{ color: CHARCOAL }}>Borrar Certificado</h2>
              <button onClick={() => setDeleteModal(null)} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <p style={{ color: CHARCOAL }}>¿Borrar el certificado de <strong>{deleteModal.nombre}</strong> — {deleteModal.curso}?</p>
              <p className="opacity-50">El certificado pasará a estado <strong>Borrado</strong>. El registro histórico se conservará pero no podrá volver a Generado o Entregado.</p>
            </div>
            <div className="px-6 py-5 bg-gray-50/80 border-t flex justify-end gap-3" style={{ borderColor: BORDER }}>
              <button onClick={() => setDeleteModal(null)} className="px-6 py-3 rounded-xl text-sm font-bold opacity-50">Cancelar</button>
              <button onClick={confirmDelete} disabled={deleteSubmitting}
                className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 disabled:opacity-50">
                {deleteSubmitting ? "Borrando..." : "Borrar certificado"}</button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

    </div>
  )
}

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {children}
      </motion.div>
    </motion.div>
  )
}

function Ficha({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 mb-0.5">{label}</p>
      <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>{value || "—"}</p>
    </div>
  )
}
