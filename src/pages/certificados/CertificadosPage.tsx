import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon, CertificateIcon } from "@hugeicons/core-free-icons"
import { X, Plus, Upload, Trash2, Download, Check, Box, FileText } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { certificadosService, type Certificado, type EstudiantePanel } from "@/services/certificados.service"
import { toast } from "sonner"

const ESTADO_MATRICULA_STYLES: Record<string, string> = {
  activo: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100",
  completado: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  retirado: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  reprobado: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100",
}

const ESTADO_MATRICULA_LABELS: Record<string, string> = {
  activo: "Activo",
  completado: "Completado",
  retirado: "Retirado",
  reprobado: "Reprobado",
}

const ESTADO_CERT_STYLES: Record<string, string> = {
  generado: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100",
  entregado: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  borrado: "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100",
}

const ESTADO_CERT_LABELS: Record<string, string> = {
  generado: "Generado",
  entregado: "Entregado",
  borrado: "Borrado",
}

const FILTRO_CERT = [
  { value: "", label: "Todos los cert." },
  { value: "generado", label: "Generado" },
  { value: "entregado", label: "Entregado" },
  { value: "borrado", label: "Borrado" },
  { value: "pendiente", label: "Pendiente" },
]

const FILTRO_MATRICULA = [
  { value: "", label: "Todos los cursos" },
  { value: "activo", label: "Activo" },
  { value: "completado", label: "Completado" },
  { value: "retirado", label: "Retirado" },
  { value: "reprobado", label: "Reprobado" },
]

export function CertificadosPage() {
  const [rows, setRows] = useState<EstudiantePanel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroMatricula, setFiltroMatricula] = useState("")
  const [filtroCert, setFiltroCert] = useState("")
  const [filtroPago, setFiltroPago] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [detailCert, setDetailCert] = useState<Certificado | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [quickRow, setQuickRow] = useState<EstudiantePanel | null>(null)
  const [quickFile, setQuickFile] = useState<File | null>(null)
  const [quickPreviewUrl, setQuickPreviewUrl] = useState<string | null>(null)
  const [quickSubmitting, setQuickSubmitting] = useState(false)

  const loadPanel = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number | undefined> = { page, per_page: 15 }
      if (search) params.search = search
      if (filtroMatricula) params.estado_matricula = filtroMatricula
      if (filtroCert) params.estado_certificado = filtroCert
      if (filtroPago) params.pago_completo = "1"
      const res = await certificadosService.getPanelEstudiantes(params)
      setRows(res.data)
      setTotalPages(res.last_page || 1)
      setTotal(res.total || 0)
    } catch {
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }, [search, filtroMatricula, filtroCert, filtroPago, page])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadPanel() }, [loadPanel])

  const handleQuickCreate = (row: EstudiantePanel) => {
    if (!row.matricula_id) { toast.error("El estudiante no tiene matrícula activa"); return }
    if (row.certificado_id) { toast.error("Ya tiene un certificado"); return }
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf,application/pdf"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (file.size > 512 * 1024) { toast.error("El PDF no debe superar los 500 KB"); return }
      setQuickRow(row)
      setQuickFile(file)
      setQuickPreviewUrl(URL.createObjectURL(file))
    }
    input.click()
  }

  const handleQuickConfirm = async () => {
    if (!quickRow || !quickFile) return
    try {
      setQuickSubmitting(true)
      const form = new FormData()
      form.append("matricula_id", quickRow.matricula_id!)
      form.append("curso_abierto_id", quickRow.curso_abierto_id)
      form.append("pdf", quickFile)
      await certificadosService.createCertificado(form)
      toast.success(`Certificado creado para ${quickRow.nombres} ${quickRow.apellidos}`)
      setQuickRow(null); setQuickFile(null)
      if (quickPreviewUrl) URL.revokeObjectURL(quickPreviewUrl)
      setQuickPreviewUrl(null)
      loadPanel()
    } catch { toast.error("Error al crear certificado") }
    finally { setQuickSubmitting(false) }
  }

  const handleQuickCancel = () => {
    setQuickRow(null); setQuickFile(null)
    if (quickPreviewUrl) URL.revokeObjectURL(quickPreviewUrl)
    setQuickPreviewUrl(null)
  }

  const handleRemovePdf = async (id: string) => {
    if (!confirm("¿Eliminar el PDF? El registro del certificado se conservará.")) return
    try {
      await certificadosService.removePdf(id)
      toast.success("PDF eliminado, registro conservado")
      loadPanel()
    } catch { toast.error("Error al eliminar PDF") }
  }

  const handleMarcarEntregado = async (id: string) => {
    try {
      await certificadosService.marcarEntregado(id)
      toast.success("Certificado marcado como entregado")
      loadPanel()
    } catch { toast.error("Error al marcar como entregado") }
  }

  const openDetail = async (certId: string) => {
    try {
      const cert = await certificadosService.getCertificado(certId)
      setDetailCert(cert)
      setDetailOpen(true)
    } catch { toast.error("Error al cargar detalle") }
  }

  const sinCertCount = rows.filter(r => !r.certificado_id).length
  const conCertCount = rows.filter(r => r.certificado_id).length

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            
            <h1 className="text-3xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>Gestión de Certificados</h1>
            <p className="text-xs opacity-40 mt-2">
              {total} estudiantes ·{" "}
              <span className="text-emerald-600 font-medium">{conCertCount} con certificado</span>
              {sinCertCount > 0 && (
                <span className="text-amber-600 font-medium ml-1">· {sinCertCount} pendientes</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/certificados/carga-masiva"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold border bg-white hover:bg-gray-50 transition-all"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
            >
              <Box size={16} /> Carga Masiva
            </a>
            <button
              onClick={() => {
                const input = document.createElement("input")
                input.type = "file"
                input.accept = ".pdf,application/pdf"
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (!file) return
                  if (file.size > 512 * 1024) { toast.error("El PDF no debe superar los 500 KB"); return }
                  const nombre = file.name.replace(/\.pdf$/i, "")
                  const parts = nombre.split(/[\s_-]+/)
                  const posibleCedula = parts.find(p => /^\d{6,10}$/.test(p))
                  if (posibleCedula) {
                    toast.info(`Buscando cédula: ${posibleCedula}`)
                    setSearch(posibleCedula)
                  } else {
                    toast.info(`Buscando nombre: ${nombre}`)
                    setSearch(nombre)
                  }
                }
                input.click()
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 hover:opacity-90 active:scale-[0.97] transition-all"
            >
              <Upload size={16} /> Subir PDF y buscar
            </button>
          </div>
        </div>
      </header>

      <div className="shrink-0 px-8 py-4 border-b bg-white/50 space-y-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <HugeiconsIcon icon={SearchIcon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por nombre, cédula o curso..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border bg-gray-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            />
          </div>
          <select
            value={filtroMatricula}
            onChange={e => { setFiltroMatricula(e.target.value); setPage(1) }}
            className="px-4 py-2 rounded-xl border bg-gray-50 text-xs outline-none"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            {FILTRO_MATRICULA.map((o, i) => (
              <option key={o.value || `matricula-${i}`} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => { setFiltroPago(!filtroPago); setPage(1) }}
            className={cn(
              "px-4 py-2 rounded-xl border text-xs font-medium transition-all",
              filtroPago
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-gray-50 hover:bg-gray-100"
            )}
            style={{ borderColor: filtroPago ? undefined : COLORS.BORDER_SUBTLE }}
          >
            Pago completo
          </button>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {FILTRO_CERT.map(t => (
            <button
              key={t.value || "todos-cert"}
                onClick={() => { setFiltroCert(t.value); setPage(1) }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                filtroCert === t.value
                  ? "bg-white text-charcoal shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center space-y-4"
          >
            <div className="size-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <HugeiconsIcon icon={CertificateIcon} size={28} className="opacity-15" style={{ color: COLORS.CHARCOAL }} />
            </div>
            <p className="text-sm font-bold opacity-30">No hay datos para mostrar</p>
            <p className="text-xs opacity-20 max-w-[280px]">Ajusta los filtros o crea nuevos certificados.</p>
          </motion.div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <Table>
                <TableHeader>
                  <TableRow className="[&>th]:text-[10px] [&>th]:font-bold [&>th]:uppercase [&>th]:tracking-wider [&>th]:opacity-50 [&>th]:py-4">
                    <TableHead>Estudiante</TableHead>
                    <TableHead className="hidden md:table-cell">Cédula</TableHead>
                    <TableHead className="hidden lg:table-cell">Curso</TableHead>
                    <TableHead className="text-center">Estado Curso</TableHead>
                    <TableHead className="text-center">Certificado</TableHead>
                    <TableHead className="text-right w-[160px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.matricula_id}
                      className={cn(
                        "transition-colors",
                        !row.certificado_id && row.estado_matricula === "completado" && "bg-amber-50/40 hover:bg-amber-50/60"
                      )}
                    >
                      <TableCell className="py-3">
                        <button
                          onClick={() => row.certificado_id && openDetail(row.certificado_id)}
                          className={cn("text-sm font-medium text-left", row.certificado_id ? "hover:underline cursor-pointer" : "cursor-default")}
                          style={{ color: COLORS.CHARCOAL }}
                        >
                          {row.nombres} {row.apellidos}
                        </button>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs opacity-50 py-3">{row.cedula}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs py-3 max-w-[200px] truncate">{row.curso_nombre}</TableCell>
                      <TableCell className="text-center py-3">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-bold uppercase tracking-wider border", ESTADO_MATRICULA_STYLES[row.estado_matricula])}
                        >
                          {ESTADO_MATRICULA_LABELS[row.estado_matricula] || row.estado_matricula}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        {row.certificado_id ? (
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] font-bold uppercase tracking-wider border", ESTADO_CERT_STYLES[row.estado_certificado || ""])}
                          >
                            {ESTADO_CERT_LABELS[row.estado_certificado || ""] || row.codigo_certificado}
                          </Badge>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-600 flex items-center justify-center gap-1">
                            <span className="size-1.5 rounded-full bg-amber-500 inline-block" />
                            Pendiente
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {!row.certificado_id && row.estado_matricula === "completado" && (
                            <button
                              onClick={() => handleQuickCreate(row)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                              <Plus size={12} />
                              <span className="hidden xl:inline">Crear</span>
                            </button>
                          )}
                          {!row.certificado_id && row.estado_matricula !== "completado" && (
                            <button
                              onClick={() => handleQuickCreate(row)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                              <Plus size={12} />
                              <span className="hidden xl:inline">Asociar</span>
                            </button>
                          )}
                          {row.certificado_id && row.archivo_pdf_url && (
                            <button
                              onClick={() => certificadosService.descargarPdf(row.certificado_id!)}
                              className="size-8 flex items-center justify-center rounded-lg bg-black/5 hover:bg-black/10 transition-colors"
                              title="Descargar PDF"
                            >
                              <Download size={13} />
                            </button>
                          )}
                          {row.certificado_id && row.estado_certificado !== "entregado" && row.estado_certificado !== "borrado" && (
                            <button
                              onClick={() => handleMarcarEntregado(row.certificado_id!)}
                              className="size-8 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                              title="Marcar como entregado"
                            >
                              <Check size={13} className="text-emerald-600" />
                            </button>
                          )}
                          {row.certificado_id && (
                            <button
                              onClick={() => handleRemovePdf(row.certificado_id!)}
                              className="size-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                              title="Eliminar PDF (conservar registro)"
                            >
                              <Trash2 size={12} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      "size-9 rounded-xl text-xs font-bold border transition-colors",
                      page === i + 1 ? "bg-amber-500 text-white border-amber-500" : "bg-white hover:bg-gray-50"
                    )}
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal detalle certificado */}
      <div className={cn("fixed inset-0 z-[100] flex items-center justify-center p-4", detailOpen ? "" : "hidden")}>
        <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" onClick={() => setDetailOpen(false)} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div>
              <h2 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>{detailCert?.codigo_certificado}</h2>
              <p className="text-xs opacity-40 mt-0.5">Detalle del certificado</p>
            </div>
            <button onClick={() => setDetailOpen(false)} className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10"><X size={18} /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-gray-50">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Estudiante</p>
                <p className="text-sm font-bold mt-1" style={{ color: COLORS.CHARCOAL }}>{detailCert?.estudiante?.nombres} {detailCert?.estudiante?.apellidos}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cédula</p>
                <p className="text-sm font-bold mt-1" style={{ color: COLORS.CHARCOAL }}>{detailCert?.cedula_impresa}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Fecha de Emisión</p>
                <p className="text-sm font-bold mt-1" style={{ color: COLORS.CHARCOAL }}>{detailCert?.fecha_emision ? new Date(detailCert.fecha_emision).toLocaleDateString("es-ES") : ""}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Estado</p>
                <Badge
                  variant="outline"
                  className={cn("mt-1 text-[10px] font-bold uppercase tracking-wider border", ESTADO_CERT_STYLES[detailCert?.estado || ""])}
                >
                  {ESTADO_CERT_LABELS[detailCert?.estado || ""]}
                </Badge>
              </div>
            </div>
            {detailCert?.fecha_entrega && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Fecha de Entrega</p>
                <p className="text-sm font-bold mt-1 text-emerald-700">{new Date(detailCert.fecha_entrega).toLocaleDateString("es-ES")}</p>
              </div>
            )}
            {detailCert?.archivo_pdf_url && (
              <div className="p-4 rounded-2xl bg-gray-50 border flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <span className="text-xs font-medium">PDF disponible</span>
                <button
                  onClick={() => certificadosService.descargarPdf(detailCert!.id)}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1"
                >
                  <Download size={12} /> Descargar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal confirmación rápida */}
      <div className={cn("fixed inset-0 z-[100] flex items-center justify-center p-4", quickRow && quickFile ? "" : "hidden")}>
        <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" onClick={handleQuickCancel} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div>
              <h2 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Crear Certificado</h2>
              <p className="text-xs opacity-40 mt-0.5">Revise los datos antes de confirmar</p>
            </div>
            <button onClick={handleQuickCancel} className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10"><X size={18} /></button>
          </div>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-gray-50">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Estudiante</p>
                <p className="text-sm font-bold mt-1" style={{ color: COLORS.CHARCOAL }}>{quickRow?.nombres} {quickRow?.apellidos}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cédula</p>
                <p className="text-sm font-bold mt-1" style={{ color: COLORS.CHARCOAL }}>{quickRow?.cedula}</p>
              </div>
              <div className="col-span-2 p-4 rounded-2xl bg-gray-50">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Curso</p>
                <p className="text-sm font-bold mt-1" style={{ color: COLORS.CHARCOAL }}>{quickRow?.curso_nombre}</p>
              </div>
            </div>
            <div className="rounded-2xl border bg-gray-50 overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Vista previa del PDF</p>
                <button
                  onClick={() => {
                    if (quickPreviewUrl) URL.revokeObjectURL(quickPreviewUrl)
                    setQuickFile(null)
                    setQuickPreviewUrl(null)
                    const input = document.createElement("input")
                    input.type = "file"
                    input.accept = ".pdf,application/pdf"
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (!file) return
                      if (file.size > 512 * 1024) { toast.error("El PDF no debe superar los 500 KB"); return }
                      setQuickFile(file)
                      setQuickPreviewUrl(URL.createObjectURL(file))
                    }
                    input.click()
                  }}
                  className="text-[10px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <Upload size={12} /> Cambiar
                </button>
              </div>
              {quickPreviewUrl && (
                <iframe src={quickPreviewUrl} className="w-full h-48 bg-white" title="preview" />
              )}
              <div className="p-3 border-t flex items-center gap-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <FileText size={14} className="opacity-40" />
                <span className="text-xs font-medium opacity-60">{quickFile?.name}</span>
                <span className="text-[10px] opacity-30 ml-auto">{quickFile ? (quickFile.size / 1024).toFixed(0) + " KB" : ""}</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-5 bg-gray-50 border-t flex justify-end gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <button onClick={handleQuickCancel} className="px-6 py-3 rounded-xl bg-black/5 text-sm font-bold text-charcoal/60 hover:bg-black/10">Cancelar</button>
            <button
              onClick={handleQuickConfirm}
              disabled={quickSubmitting}
              className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {quickSubmitting ? "Creando..." : "Crear Certificado"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
