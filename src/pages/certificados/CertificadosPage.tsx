import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { BadgeCheckIcon, UserGroupIcon, Clock04Icon, CertificateIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { X, FileText, Eye, Upload } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { certificadosService } from "@/services/certificados.service"
import type { Certificado, EstudiantePanel, HistorialItem } from "@/services/certificados.service"
import { CertificadosTable } from "./components/CertificadosTable"
import { CERT_STATUS_LABELS } from "./certStatus"
import { toast } from "sonner"

const GREEN = "#0F9F6E"
const AMBER = "#D97706"
const BLUE = "#2563EB"
const GRAY = "#6B7280"
const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL

const PANEL_BATCH = 500

const ESTADO_CERT_STYLES: Record<string, string> = {
  generado: "text-emerald-700 border-emerald-200",
  entregado: "text-blue-700 border-blue-200",
  borrado: "text-gray-500 border-gray-200",
}
const ESTADO_CERT_BG: Record<string, string> = {
  generado: "bg-emerald-50", entregado: "bg-blue-50", borrado: "bg-gray-50",
}

const TAB_CONFIG = [
  { key: "", label: "Todos", color: CHARCOAL, icon: UserGroupIcon },
  { key: "pendiente", label: "Pendientes", color: AMBER, icon: Clock04Icon },
  { key: "generado", label: "Emitidos", color: GREEN, icon: CertificateIcon },
  { key: "entregado", label: "Entregados", color: BLUE, icon: BadgeCheckIcon },
  { key: "borrado", label: "Borrados", color: GRAY, icon: Cancel01Icon },
]

export function CertificadosPage() {
  const [rows, setRows] = useState<EstudiantePanel[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroCert, setFiltroCert] = useState("")
  const [total, setTotal] = useState(0)

  const [detailCert, setDetailCert] = useState<Certificado | null>(null)
  const [detailPurgado, setDetailPurgado] = useState(false)
  const [historial, setHistorial] = useState<HistorialItem[]>([])
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
      const params: Record<string, string | number> = { per_page: PANEL_BATCH }
      if (filtroCert) params.estado_certificado = filtroCert
      const res = await certificadosService.getPanelEstudiantes(params)
      setRows(res.data)
      setTotal(res.total || res.data.length)
    } catch { toast.error("Error al cargar datos") }
    finally { setLoading(false) }
  }, [filtroCert])

  useEffect(() => {

    loadPanel()
  }, [loadPanel])

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

  const closeEmitir = () => {
    setEmitirRow(null); setEmitirFile(null)
    if (emitirPreview) URL.revokeObjectURL(emitirPreview)
    setEmitirPreview(null)
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
      closeEmitir()
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
      toast.success("PDF eliminado del almacenamiento (registro histórico conservado)")
      setDeleteModal(null)
      loadPanel()
    } catch { toast.error("Error al borrar certificado") }
    finally { setDeleteSubmitting(false) }
  }

  const handleDescargar = (certId: string) => certificadosService.descargarPdf(certId)

  const handleMarcarEntregado = async (certId: string) => {
    try {
      await certificadosService.marcarEntregado(certId, { fecha_entrega: new Date().toISOString().split("T")[0] })
      toast.success("Certificado marcado como entregado")
      loadPanel()
    } catch { toast.error("Error al marcar como entregado") }
  }

  const handleReuploadPdf = (row: EstudiantePanel) => {
    if (!row.certificado_id) { toast.error("El estudiante no tiene certificado"); return }
    const input = document.createElement("input")
    input.type = "file"; input.accept = ".pdf,application/pdf"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (file.size > 512 * 1024) { toast.error("El PDF no debe superar los 500 KB"); return }
      try {
        const form = new FormData()
        form.append("pdf", file)
        await certificadosService.uploadPdf(row.certificado_id!, form)
        toast.success("PDF re-subido correctamente")
        loadPanel()
      } catch { toast.error("Error al re-subir PDF") }
    }
    input.click()
  }

  const openDetail = async (certId: string) => {
    try {
      const [cert, hist] = await Promise.all([
        certificadosService.getCertificado(certId),
        certificadosService.getHistorial(certId),
      ])
      setDetailCert(cert)
      setDetailPurgado(cert.archivo_purgado === true)
      setHistorial(hist || [])
      setDetailOpen(true)
    } catch { toast.error("Error al cargar detalle") }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="shrink-0 px-8 pt-8 pb-4 bg-white border-b" style={{ borderColor: BORDER }}>
        <h1 className="text-3xl font-bold tracking-tighter" style={{ color: CHARCOAL }}>Certificados</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm" style={{ color: CHARCOAL }}>
          <span>{total} estudiantes</span>
          <span className="opacity-30">·</span>
          <span style={{ color: conCert > 0 ? GREEN : "inherit" }}>{conCert} emitidos</span>
          <span className="opacity-30">·</span>
          <span style={{ color: sinCert > 0 ? AMBER : "inherit" }}>{sinCert} pendientes</span>
        </div>
      </header>

      <div className="shrink-0 px-8 pt-3 bg-white border-b" style={{ borderColor: BORDER }}>
        <div className="flex gap-1 border-b" style={{ borderColor: BORDER }}>
          {TAB_CONFIG.map(t => (
            <button key={t.key || "todos"} onClick={() => setFiltroCert(t.key)}
              className="flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all"
              style={{
                borderColor: filtroCert === t.key ? COLORS.ACCENT : "transparent",
                color: filtroCert === t.key ? CHARCOAL : COLORS.TEXT_MUTED,
              }}>
              <HugeiconsIcon icon={t.icon} size={14} />
              {t.label}
              <span className="text-xs opacity-50">({tabCounts[t.key] ?? rows.length})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 lg:p-8">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white border" style={{ borderColor: BORDER }}>
                <div className="space-y-2 flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center space-y-3">
            <div className="size-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${AMBER}10` }}>
              <HugeiconsIcon icon={BadgeCheckIcon} size={28} opacity={0.3} color={AMBER} />
            </div>
            <p className="text-sm font-bold opacity-30">Sin resultados</p>
            <p className="text-xs opacity-20">Ajusta los filtros o emite nuevos certificados</p>
          </motion.div>
        ) : (
          <CertificadosTable
            key={filtroCert}
            rows={rows}
            onEmitir={handleEmitir}
            onDescargar={handleDescargar}
            onReupload={handleReuploadPdf}
            onMarcarEntregado={handleMarcarEntregado}
            onOpenDetail={openDetail}
            onOpenDelete={openDeleteModal}
          />
        )}
      </div>

      {/* Emitir modal - 2 columns */}
      <AnimatePresence>
        {!!(emitirRow && emitirFile) && (
          <ModalOverlay onClose={closeEmitir}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: CHARCOAL }}>
                  <HugeiconsIcon icon={BadgeCheckIcon} size={20} style={{ color: GREEN }} />
                  Emitir certificado
                </h2>
                <p className="text-xs opacity-40 mt-0.5">Confirma los datos antes de emitir el documento</p>
              </div>
              <button onClick={closeEmitir}
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
              <button onClick={closeEmitir}
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
                    {CERT_STATUS_LABELS[detailCert.estado]}
                  </span>
                </div>
              </div>
              {historial.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-3">Historial</p>
                  <div className="relative pl-8 border-l-2 space-y-4" style={{ borderColor: `${COLORS.ACCENT}20` }}>
                    {historial.map((h, i) => {
                      const dotColor = h.accion.includes("Archivo eliminado") ? "#EF4444"
                        : h.accion === "Archivo restaurado" ? AMBER
                        : h.accion === "Borrado" ? GRAY
                        : h.accion === "Entregado" ? BLUE : GREEN
                      return (
                      <div key={i} className="relative -left-[33px] flex items-start gap-3">
                        <div className="size-3 rounded-full border-2 border-white shrink-0 mt-0.5" style={{ backgroundColor: dotColor }} />
                        <div>
                          <p className="text-xs font-bold">{h.accion}</p>
                          <p className="text-[10px] opacity-50">{h.fecha}{h.detalle ? ` · ${h.detalle}` : ""}{h.usuario ? ` · ${h.usuario}` : ""}</p>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {detailCert.archivo_pdf_url && !detailPurgado && (
                <button onClick={() => certificadosService.descargarPdf(detailCert.id)}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  style={{ color: GREEN, backgroundColor: `${GREEN}10` }}>
                  <Eye size={15} /> Ver y descargar PDF
                </button>
              )}
              {detailPurgado && (
                <button onClick={() => {
                  const input = document.createElement("input")
                  input.type = "file"; input.accept = ".pdf,application/pdf"
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (!file) return
                    if (file.size > 512 * 1024) { toast.error("El PDF no debe superar los 500 KB"); return }
                    try {
                      const form = new FormData()
                      form.append("pdf", file)
                      await certificadosService.uploadPdf(detailCert.id, form)
                      toast.success("PDF re-subido correctamente")
                      setDetailPurgado(false)
                      loadPanel()
                    } catch { toast.error("Error al re-subir PDF") }
                  }
                  input.click()
                }}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  style={{ color: AMBER, backgroundColor: `${AMBER}10` }}>
                  <Upload size={15} /> Re-subir PDF
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
              <h2 className="text-xl font-bold" style={{ color: CHARCOAL }}>Eliminar PDF del certificado</h2>
              <button onClick={() => setDeleteModal(null)} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <p style={{ color: CHARCOAL }}>¿Eliminar el archivo PDF del certificado de <strong>{deleteModal.nombre}</strong> — {deleteModal.curso}?</p>
              <p className="opacity-50">El archivo físico se eliminará del almacenamiento. El registro histórico del certificado y el enlace original se conservarán como constancia. Puede volver a subir un PDF posteriormente.</p>
            </div>
            <div className="px-6 py-5 bg-gray-50/80 border-t flex justify-end gap-3" style={{ borderColor: BORDER }}>
              <button onClick={() => setDeleteModal(null)} className="px-6 py-3 rounded-xl text-sm font-bold opacity-50">Cancelar</button>
              <button onClick={confirmDelete} disabled={deleteSubmitting}
                className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 disabled:opacity-50">
                {deleteSubmitting ? "Eliminando..." : "Eliminar PDF"}</button>
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
        className="relative bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
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
