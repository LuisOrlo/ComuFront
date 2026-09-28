import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BadgeCheckIcon,
  UserGroupIcon,
  Clock04Icon,
  CertificateIcon,
  Cancel01Icon,
  FileUploadIcon,
  RefreshIcon,
  AlertCircleIcon,
  File01Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons"
import { X, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { certificadosService } from "@/services/certificados.service"
import type { Certificado, EstudiantePanel, HistorialItem } from "@/services/certificados.service"
import { CertificadosTable } from "./components/CertificadosTable"
import { CERT_STATUS_LABELS } from "./certStatus"
import { toast } from "sonner"

const PANEL_BATCH = 500

const ESTADO_CERT_STYLES: Record<string, string> = {
  generado: "text-emerald-700 border-emerald-200/80 bg-emerald-50",
  entregado: "text-blue-700 border-blue-200/80 bg-blue-50",
  borrado: "text-gray-600 border-gray-200 bg-gray-50",
}

const TAB_CONFIG = [
  { key: "", label: "Todos los registros", icon: UserGroupIcon },
  { key: "pendiente", label: "Pendientes", icon: Clock04Icon },
  { key: "generado", label: "Emitidos", icon: CertificateIcon },
  { key: "entregado", label: "Entregados", icon: BadgeCheckIcon },
  { key: "borrado", label: "Borrados", icon: Cancel01Icon },
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
    } catch {
      toast.error("Error al cargar datos de certificados")
    } finally {
      setLoading(false)
    }
  }, [filtroCert])

  useEffect(() => {
    loadPanel()
  }, [loadPanel])

  const tabCounts: Record<string, number> = {
    "": rows.length,
    pendiente: rows.filter((r) => !r.certificado_id).length,
    generado: rows.filter((r) => r.estado_certificado === "generado").length,
    entregado: rows.filter((r) => r.estado_certificado === "entregado").length,
    borrado: rows.filter((r) => r.estado_certificado === "borrado").length,
  }

  const handleEmitir = (row: EstudiantePanel) => {
    if (!row.matricula_id) {
      toast.error("El estudiante no tiene matrícula activa")
      return
    }
    if (row.certificado_id) {
      toast.error("Ya tiene un certificado emitido")
      return
    }
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf,application/pdf"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (file.size > 512 * 1024) {
        toast.error("El PDF no debe superar los 500 KB")
        return
      }
      setEmitirRow(row)
      setEmitirFile(file)
      setEmitirPreview(URL.createObjectURL(file))
    }
    input.click()
  }

  const closeEmitir = () => {
    setEmitirRow(null)
    setEmitirFile(null)
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
    } catch {
      toast.error("Error al emitir el certificado")
    } finally {
      setEmitirSubmitting(false)
    }
  }

  const openDeleteModal = (row: EstudiantePanel) => {
    setDeleteModal({
      id: row.certificado_id!,
      nombre: `${row.nombres} ${row.apellidos}`,
      curso: row.catalogo_nombre,
    })
  }

  const confirmDelete = async () => {
    if (!deleteModal) return
    try {
      setDeleteSubmitting(true)
      await certificadosService.removePdf(deleteModal.id)
      toast.success("PDF eliminado del almacenamiento (registro histórico conservado)")
      setDeleteModal(null)
      loadPanel()
    } catch {
      toast.error("Error al borrar el archivo del certificado")
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const handleDescargar = (certId: string) => certificadosService.descargarPdf(certId)

  const handleMarcarEntregado = async (certId: string) => {
    try {
      await certificadosService.marcarEntregado(certId, {
        fecha_entrega: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" }).format(new Date()),
      })
      toast.success("Certificado marcado como entregado con éxito")
      loadPanel()
    } catch {
      toast.error("Error al marcar como entregado")
    }
  }

  const handleReuploadPdf = (row: EstudiantePanel) => {
    if (!row.certificado_id) {
      toast.error("El estudiante no tiene certificado registrado")
      return
    }
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf,application/pdf"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (file.size > 512 * 1024) {
        toast.error("El PDF no debe superar los 500 KB")
        return
      }
      try {
        const form = new FormData()
        form.append("pdf", file)
        await certificadosService.uploadPdf(row.certificado_id!, form)
        toast.success("PDF re-subido correctamente")
        loadPanel()
      } catch {
        toast.error("Error al re-subir el PDF")
      }
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
    } catch {
      toast.error("Error al cargar el detalle del certificado")
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden bg-[#f8f9ff]">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Cabecera Principal y Acciones */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-[30px] font-bold tracking-tight text-[#0b1c30]">
                Certificados
              </h1>
              <p className="text-xs sm:text-sm text-[#45464d]">
                Gestión y emisión de certificados académicos, control de entregas e historial de documentos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={loadPanel}
                disabled={loading}
                className="h-10 px-3.5 rounded-xl bg-white text-[#0b1c30] text-xs font-semibold shadow-xs hover:bg-[#eff4ff] transition-all flex items-center gap-2 cursor-pointer border border-[#c6c6cd]/30 disabled:opacity-60"
                title="Actualizar datos"
              >
                <HugeiconsIcon
                  icon={RefreshIcon}
                  size={16}
                  className={loading ? "animate-spin text-[#fd761a]" : "text-[#76777d]"}
                />
                <span className="hidden sm:inline">Actualizar</span>
              </button>

              <Link
                to="/verificar-certificados"
                target="_blank"
                rel="noreferrer"
                className="h-10 px-4 rounded-xl bg-white text-[#0b1c30] text-xs font-semibold shadow-xs hover:bg-[#eff4ff] transition-all flex items-center gap-2 cursor-pointer border border-[#c6c6cd]/30 select-none"
                title="Abrir verificador público de certificados"
              >
                <HugeiconsIcon icon={BadgeCheckIcon} size={16} className="text-[#009668]" />
                <span>Verificador público</span>
              </Link>

              <Link
                to="/certificados/carga-masiva"
                className="h-10 px-4 sm:px-5 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer shadow-[0_2px_8px_rgba(253,118,26,0.25)] select-none"
              >
                <HugeiconsIcon icon={FileUploadIcon} size={16} />
                <span>Carga masiva</span>
              </Link>
            </div>
          </header>

          {/* Tarjetas KPI de Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* KPI 1: Total */}
            <div
              onClick={() => setFiltroCert("")}
              className={`p-4 sm:p-5 rounded-2xl bg-white shadow-xs border transition-all cursor-pointer ${
                filtroCert === ""
                  ? "border-[#fd761a] ring-2 ring-[#fd761a]/15"
                  : "border-[#c6c6cd]/25 hover:border-[#c6c6cd]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#76777d]">
                  Estudiantes
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#eff4ff] text-[#0b1c30] flex items-center justify-center">
                  <HugeiconsIcon icon={UserGroupIcon} size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0b1c30] mt-2">
                {total}
              </div>
              <span className="text-[11px] text-[#45464d] mt-1 block">
                Total evaluados
              </span>
            </div>

            {/* KPI 2: Pendientes */}
            <div
              onClick={() => setFiltroCert("pendiente")}
              className={`p-4 sm:p-5 rounded-2xl bg-white shadow-xs border transition-all cursor-pointer ${
                filtroCert === "pendiente"
                  ? "border-amber-500 ring-2 ring-amber-500/15"
                  : "border-[#c6c6cd]/25 hover:border-[#c6c6cd]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Pendientes
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <HugeiconsIcon icon={Clock04Icon} size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-700 mt-2">
                {tabCounts.pendiente}
              </div>
              <span className="text-[11px] text-[#45464d] mt-1 block">
                Por emitir
              </span>
            </div>

            {/* KPI 3: Emitidos */}
            <div
              onClick={() => setFiltroCert("generado")}
              className={`p-4 sm:p-5 rounded-2xl bg-white shadow-xs border transition-all cursor-pointer ${
                filtroCert === "generado"
                  ? "border-emerald-500 ring-2 ring-emerald-500/15"
                  : "border-[#c6c6cd]/25 hover:border-[#c6c6cd]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Emitidos
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <HugeiconsIcon icon={CertificateIcon} size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2">
                {tabCounts.generado}
              </div>
              <span className="text-[11px] text-[#45464d] mt-1 block">
                Listos con PDF
              </span>
            </div>

            {/* KPI 4: Entregados */}
            <div
              onClick={() => setFiltroCert("entregado")}
              className={`p-4 sm:p-5 rounded-2xl bg-white shadow-xs border transition-all cursor-pointer ${
                filtroCert === "entregado"
                  ? "border-blue-500 ring-2 ring-blue-500/15"
                  : "border-[#c6c6cd]/25 hover:border-[#c6c6cd]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Entregados
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <HugeiconsIcon icon={BadgeCheckIcon} size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-700 mt-2">
                {tabCounts.entregado}
              </div>
              <span className="text-[11px] text-[#45464d] mt-1 block">
                En manos del alumno
              </span>
            </div>

            {/* KPI 5: Borrados */}
            <div
              onClick={() => setFiltroCert("borrado")}
              className={`p-4 sm:p-5 rounded-2xl bg-white shadow-xs border transition-all cursor-pointer ${
                filtroCert === "borrado"
                  ? "border-gray-500 ring-2 ring-gray-500/15"
                  : "border-[#c6c6cd]/25 hover:border-[#c6c6cd]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                  Borrados
                </span>
                <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-700 mt-2">
                {tabCounts.borrado}
              </div>
              <span className="text-[11px] text-[#45464d] mt-1 block">
                Archivo purgado
              </span>
            </div>
          </div>

          {/* Filtros por Pestañas (Pill Stepper) */}
          <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-[#c6c6cd]/25 shadow-xs overflow-x-auto">
            {TAB_CONFIG.map((t) => {
              const isSelected = filtroCert === t.key
              const count = tabCounts[t.key] ?? rows.length

              return (
                <button
                  key={t.key || "todos"}
                  type="button"
                  onClick={() => setFiltroCert(t.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-[#0b1c30] text-white shadow-xs"
                      : "text-[#76777d] hover:text-[#0b1c30] hover:bg-[#eff4ff]/60"
                  }`}
                >
                  <HugeiconsIcon icon={t.icon} size={15} />
                  <span>{t.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-[#76777d]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Contenedor Principal de la Tabla */}
          <div className="bg-white rounded-2xl border border-[#c6c6cd]/25 shadow-xs p-5 space-y-4">
            {loading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 border border-[#c6c6cd]/15"
                  >
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-4 w-36 hidden sm:block" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#eff4ff] text-[#fd761a] flex items-center justify-center">
                  <HugeiconsIcon icon={CertificateIcon} size={32} />
                </div>
                <h3 className="text-[#0b1c30] font-bold text-base">
                  No se encontraron certificados
                </h3>
                <p className="text-xs text-[#45464d] max-w-sm">
                  {filtroCert
                    ? "No hay registros con el estado seleccionado. Prueba con otra pestaña o limpia los filtros."
                    : "Aún no hay estudiantes registrados para emisión de certificados en los cursos abiertos."}
                </p>
                {filtroCert && (
                  <button
                    type="button"
                    onClick={() => setFiltroCert("")}
                    className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-[#fd761a] bg-[#eff4ff] hover:bg-[#dce9ff] transition-colors cursor-pointer"
                  >
                    Ver todos los registros
                  </button>
                )}
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
        </div>
      </main>

      {/* Modal 1: Emitir certificado */}
      <AnimatePresence>
        {Boolean(emitirRow && emitirFile) && (
          <ModalOverlay onClose={closeEmitir}>
            {/* Header del modal */}
            <div className="p-6 border-b border-[#c6c6cd]/20 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#009668] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={BadgeCheckIcon} size={22} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0b1c30]">
                    Emitir Certificado Académico
                  </h2>
                  <p className="text-xs text-[#76777d]">
                    Valida los datos antes de emitir y registrar el documento oficial.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEmitir}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#76777d] hover:text-[#0b1c30] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido en 2 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#c6c6cd]/20">
              {/* Columna Izquierda: Datos del estudiante y curso */}
              <div className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#76777d]">
                  Datos de la Certificación
                </h3>
                <div className="space-y-3">
                  <Ficha
                    label="Estudiante"
                    value={`${emitirRow?.nombres} ${emitirRow?.apellidos}`}
                  />
                  <Ficha label="Cédula de Identidad" value={emitirRow?.cedula} />
                  <Ficha
                    label="Curso / Cohorte"
                    value={emitirRow?.nombre_instancia || emitirRow?.catalogo_nombre || "—"}
                  />
                  <Ficha
                    label="Fecha de Emisión Oficial"
                    value={new Date().toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  />
                </div>
              </div>

              {/* Columna Derecha: Vista previa del PDF */}
              <div className="p-6 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#76777d]">
                    Vista Previa del Archivo
                  </p>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    PDF Válido (≤ 500 KB)
                  </span>
                </div>
                <div className="flex-1 rounded-xl border border-[#c6c6cd]/30 bg-gray-50 overflow-hidden min-h-[220px]">
                  {emitirPreview && (
                    <iframe
                      src={emitirPreview}
                      className="w-full h-full min-h-[220px]"
                      title="Vista previa del PDF"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-[#45464d] bg-[#eff4ff]/60 px-3 py-2 rounded-xl border border-[#c6c6cd]/20">
                  <HugeiconsIcon icon={File01Icon} size={15} className="text-[#fd761a]" />
                  <span className="truncate font-medium">{emitirFile?.name}</span>
                </div>
              </div>
            </div>

            {/* Footer de acciones */}
            <div className="px-6 py-4 bg-gray-50/70 border-t border-[#c6c6cd]/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEmitir}
                disabled={emitirSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border border-[#c6c6cd]/30 bg-white text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmEmitir}
                disabled={emitirSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {emitirSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Emitiendo documento...</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={BadgeCheckIcon} size={16} />
                    <span>Confirmar y Emitir</span>
                  </>
                )}
              </button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Modal 2: Detalle e historial */}
      <AnimatePresence>
        {detailOpen && detailCert && (
          <ModalOverlay onClose={() => setDetailOpen(false)}>
            <div className="p-6 border-b border-[#c6c6cd]/20 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#fd761a] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={CertificateIcon} size={22} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0b1c30]">
                    {detailCert.codigo_certificado}
                  </h2>
                  <p className="text-xs text-[#76777d]">
                    Detalles, estado y trazabilidad histórica del certificado.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#76777d] hover:text-[#0b1c30] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              {/* Fichas informativas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Ficha
                  label="Estudiante"
                  value={`${detailCert.estudiante?.nombres} ${detailCert.estudiante?.apellidos}`}
                />
                <Ficha label="Cédula Impresa" value={detailCert.cedula_impresa} />
                <Ficha
                  label="Fecha de Emisión"
                  value={
                    detailCert.fecha_emision
                      ? new Date(detailCert.fecha_emision).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"
                  }
                />
                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-[#c6c6cd]/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#76777d] mb-1">
                    Estado Actual
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border",
                      ESTADO_CERT_STYLES[detailCert.estado]
                    )}
                  >
                    {CERT_STATUS_LABELS[detailCert.estado]}
                  </span>
                </div>
              </div>

              {/* Historial de Trazabilidad */}
              {historial.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#76777d]">
                    Línea de Tiempo / Historial
                  </h4>
                  <div className="relative pl-6 border-l-2 border-[#eff4ff] space-y-4 ml-2">
                    {historial.map((h, i) => {
                      const isDeleted = h.accion.includes("Archivo eliminado")
                      const isRestored = h.accion === "Archivo restaurado"
                      const isDelivered = h.accion === "Entregado"

                      return (
                        <div key={i} className="relative flex items-start gap-3">
                          <div
                            className={`w-3.5 h-3.5 rounded-full border-2 border-white absolute -left-[31px] top-0.5 shadow-xs ${
                              isDeleted
                                ? "bg-red-500"
                                : isRestored
                                ? "bg-amber-500"
                                : isDelivered
                                ? "bg-blue-600"
                                : "bg-emerald-600"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#0b1c30]">{h.accion}</p>
                            <p className="text-[11px] text-[#76777d] mt-0.5">
                              {h.fecha}
                              {h.detalle ? ` · ${h.detalle}` : ""}
                              {h.usuario ? ` · ${h.usuario}` : ""}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Botón de Descarga / Re-subida */}
              {detailCert.archivo_pdf_url && !detailPurgado && (
                <button
                  type="button"
                  onClick={() => certificadosService.descargarPdf(detailCert.id)}
                  className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <Eye size={16} />
                  <span>Ver y Descargar Archivo PDF</span>
                </button>
              )}

              {detailPurgado && (
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement("input")
                    input.type = "file"
                    input.accept = ".pdf,application/pdf"
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (!file) return
                      if (file.size > 512 * 1024) {
                        toast.error("El PDF no debe superar los 500 KB")
                        return
                      }
                      try {
                        const form = new FormData()
                        form.append("pdf", file)
                        await certificadosService.uploadPdf(detailCert.id, form)
                        toast.success("PDF re-subido correctamente")
                        setDetailPurgado(false)
                        loadPanel()
                      } catch {
                        toast.error("Error al re-subir el PDF")
                      }
                    }
                    input.click()
                  }}
                  className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon icon={Upload04Icon} size={16} />
                  <span>Re-subir PDF Reemplazo</span>
                </button>
              )}
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Modal 3: Eliminar PDF */}
      <AnimatePresence>
        {deleteModal && (
          <ModalOverlay onClose={() => setDeleteModal(null)}>
            <div className="p-6 border-b border-[#c6c6cd]/20 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#ba1a1a] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={AlertCircleIcon} size={22} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0b1c30]">
                    Eliminar Archivo PDF del Certificado
                  </h2>
                  <p className="text-xs text-[#76777d]">
                    El registro legal y código del certificado permanecerán en el sistema.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#76777d] hover:text-[#0b1c30] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs sm:text-sm">
              <p className="text-[#0b1c30] font-medium leading-relaxed">
                ¿Estás seguro de que deseas eliminar el archivo PDF del certificado emitido a{" "}
                <strong className="font-bold text-[#ba1a1a]">{deleteModal.nombre}</strong> en el curso{" "}
                <strong>{deleteModal.curso}</strong>?
              </p>
              <div className="p-3.5 rounded-xl bg-gray-50 border border-[#c6c6cd]/20 text-xs text-[#45464d] leading-relaxed">
                El archivo físico se eliminará del servidor de almacenamiento para optimizar espacio. El registro histórico y el enlace original de verificación pública se conservarán como constancia. Podrás volver a subir un PDF cuando sea necesario.
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50/70 border-t border-[#c6c6cd]/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={deleteSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border border-[#c6c6cd]/30 bg-white text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {deleteSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Eliminando archivo...</span>
                  </>
                ) : (
                  <span>Eliminar archivo PDF</span>
                )}
              </button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  )
}

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#c6c6cd]/25"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

function Ficha({ label, value }: { label: string; value?: string }) {
  return (
    <div className="p-3.5 rounded-xl bg-gray-50/70 border border-[#c6c6cd]/20">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#76777d] mb-0.5">
        {label}
      </p>
      <p className="text-xs sm:text-sm font-bold text-[#0b1c30] truncate">
        {value || "—"}
      </p>
    </div>
  )
}
