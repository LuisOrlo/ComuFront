import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Upload, FileText, Check, Loader2, AlertTriangle, SearchIcon, Trash2, ArrowLeft, Eye } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { certificadosService, type EstudianteCertificado } from "@/services/certificados.service"
import { cursosService, type Curso } from "@/services/cursos.service"
import { toast } from "sonner"

interface FileItem {
  id: string
  file: File
  filename: string
  previewUrl: string
  searchTerm: string
  cedula: string | null
  status: "pending" | "searching" | "found" | "multiple" | "not_found" | "manual" | "ready" | "uploading" | "done" | "error"
  match: EstudianteCertificado | null
  matches: EstudianteCertificado[]
  cursoAbiertoId: string
  catalogoId: string
  errorMsg: string | null
}

function parseFilename(filename: string): { searchTerm: string; cedula: string | null } {
  const name = filename.replace(/\.pdf$/i, "").trim()
  const parts = name.split(/[\s_-]+/).filter(Boolean)
  const cedulaPart = parts.find(p => /^\d{6,10}$/.test(p))
  const nameParts = parts.filter(p => !/^\d+$/.test(p))
  return {
    searchTerm: nameParts.length > 0 ? nameParts.join(" ") : name,
    cedula: cedulaPart || null,
  }
}

export function CargaMasivaCertificadosPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [filtroCurso, setFiltroCurso] = useState("")
  const [filtroFinanciero, setFiltroFinanciero] = useState(false)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [cursosLoaded, setCursosLoaded] = useState(false)
  const [manualOpen, setManualOpen] = useState<string | null>(null)
  const [manualSearch, setManualSearch] = useState("")
  const [manualResults, setManualResults] = useState<EstudianteCertificado[]>([])
  const [previewFileId, setPreviewFileId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    cursosService.getCursos({}, 1).then(res => {
      setCursos(res.data)
      setCursosLoaded(true)
    }).catch(() => toast.error("Error al cargar cursos"))
  }, [])

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const pdfs = Array.from(newFiles).filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
    if (pdfs.length === 0) { toast.error("Solo se permiten archivos PDF"); return }
    const oversized = pdfs.filter(f => f.size > 512 * 1024)
    if (oversized.length > 0) { toast.error(`${oversized.length} archivo(s) superan los 500 KB`); return }

    const newItems: FileItem[] = pdfs.map(f => {
      const parsed = parseFilename(f.name)
      return {
        id: crypto.randomUUID(),
        file: f,
        filename: f.name,
        previewUrl: URL.createObjectURL(f),
        searchTerm: parsed.searchTerm,
        cedula: parsed.cedula,
        status: "pending" as const,
        match: null,
        matches: [],
        cursoAbiertoId: filtroCurso,
        catalogoId: "",
        errorMsg: null,
      }
    })
    setFiles(prev => [...prev, ...newItems])
  }, [filtroCurso])

  const searchMatches = useCallback(async (items: FileItem[]) => {
    setFiles(prev => prev.map(f =>
      items.some(i => i.id === f.id) ? { ...f, status: "searching" as const } : f
    ))

    const results = await Promise.all(items.map(async (item) => {
      try {
        const searchQuery = item.cedula || item.searchTerm
        if (!searchQuery || searchQuery.length < 2) return { id: item.id, matches: [], status: "not_found" as const }
        const estudiantes = await certificadosService.buscarEstudiantes(searchQuery)
        return { id: item.id, matches: estudiantes, status: estudiantes.length === 1 ? "found" as const : estudiantes.length > 1 ? "multiple" as const : "not_found" as const }
      } catch {
        return { id: item.id, matches: [], status: "error" as const, errorMsg: "Error al buscar" }
      }
    }))

    setFiles(prev => prev.map(f => {
      const r = results.find(r => r.id === f.id)
      if (!r) return f
      return {
        ...f,
        status: r.status,
        match: r.matches.length === 1 ? r.matches[0] : null,
        matches: r.matches,
        errorMsg: (r as { errorMsg?: string }).errorMsg || null,
      }
    }))
  }, [])

  useEffect(() => {
    const pending = files.filter(f => f.status === "pending")
    if (pending.length === 0) return

    const timeout = setTimeout(() => {
      searchMatches(pending)
    }, 400)
    return () => clearTimeout(timeout)
  }, [files, searchMatches])

  const selectMatch = (fileId: string, estudiante: EstudianteCertificado) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, status: "manual" as const, match: estudiante, matches: [] } : f
    ))
    setManualOpen(null)
  }

  const handleManualSearch = async (query: string) => {
    setManualSearch(query)
    if (query.length < 2) { setManualResults([]); return }
    try {
      const res = await certificadosService.buscarEstudiantes(query)
      setManualResults(res)
    } catch { setManualResults([]) }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const item = prev.find(f => f.id === fileId)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter(f => f.id !== fileId)
    })
  }

  const setCursoForFile = (fileId: string, cursoId: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, cursoAbiertoId: cursoId } : f))
  }

  const setCursoForAll = (cursoId: string) => {
    setFiltroCurso(cursoId)
    setFiles(prev => prev.map(f => ({ ...f, cursoAbiertoId: cursoId })))
  }

  const markReady = (fileId: string) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId && f.match ? { ...f, status: "ready" as const } : f
    ))
  }

  const markAllReady = () => {
    setFiles(prev => prev.map(f =>
      f.match && f.status !== "done" && f.status !== "uploading" ? { ...f, status: "ready" as const } : f
    ))
  }

  const handleConfirmUpload = async () => {
    const readyFiles = files.filter(f => f.status === "ready" && f.match)
    if (readyFiles.length === 0) { toast.error("No hay archivos listos para subir"); return }

    setFiles(prev => prev.map(f =>
      readyFiles.some(r => r.id === f.id) ? { ...f, status: "uploading" as const } : f
    ))

    try {
      const items = readyFiles.map(f => ({
        pdf: f.file,
        estudiante_id: f.match!.id,
        curso_abierto_id: f.cursoAbiertoId,
        catalogo_id: f.catalogoId,
        filename: f.filename,
      }))

      const res = await certificadosService.bulkStore(items)

      setFiles(prev => prev.map(f => {
        const r = res.resultados.find((_, i) => readyFiles[i]?.id === f.id)
        const e = res.errores_detalle.find((_, i) => readyFiles[i]?.id === f.id)
        if (r) return { ...f, status: "done" as const, errorMsg: null }
        if (e) return { ...f, status: "error" as const, errorMsg: e.error }
        return f
      }))

      toast.success(`${res.procesados} certificados creados`)
      if (res.errores > 0) toast.error(`${res.errores} errores`)
    } catch {
      setFiles(prev => prev.map(f =>
        readyFiles.some(r => r.id === f.id) ? { ...f, status: "error" as const, errorMsg: "Error al subir" } : f
      ))
      toast.error("Error en la carga masiva")
    }
  }

  const readyCount = files.filter(f => f.status === "ready").length
  const doneCount = files.filter(f => f.status === "done").length
  const totalCount = files.length

  useEffect(() => {
    return () => files.forEach(f => URL.revokeObjectURL(f.previewUrl))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>Académico · Certificados</p>
            <div className="flex items-center gap-3">
              <a href="/certificados" className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors">
                <ArrowLeft size={18} />
              </a>
              <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>Carga Masiva</h1>
            </div>
            <p className="text-xs opacity-40 mt-2">
              {totalCount > 0 ? `${totalCount} archivos · ${readyCount} listos · ${doneCount} completados` : "Sube múltiples PDFs para asociarlos a estudiantes"}
            </p>
          </div>
        </div>
      </header>

      {totalCount > 0 && (
        <div className="shrink-0 px-8 py-3 border-b bg-white/50 flex items-center gap-3 flex-wrap" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <select
            value={filtroCurso}
            onChange={e => setCursoForAll(e.target.value)}
            className="px-4 py-2 rounded-xl border bg-gray-50 text-xs outline-none"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <option value="">Todos los cursos</option>
            {cursos.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} ({c.estado})</option>
            ))}
          </select>
          <button
            onClick={() => setFiltroFinanciero(!filtroFinanciero)}
            className={cn(
              "px-4 py-2 rounded-xl border text-xs font-medium transition-all",
              filtroFinanciero ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 hover:bg-gray-100"
            )}
            style={{ borderColor: filtroFinanciero ? undefined : COLORS.BORDER_SUBTLE }}
          >
            Pago completo
          </button>
          <div className="flex-1" />
          <button
            onClick={markAllReady}
            className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
            disabled={files.filter(f => f.match).length === 0}
          >
            Marcar todos listos
          </button>
          <button
            onClick={handleConfirmUpload}
            disabled={readyCount === 0}
            className="px-6 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-600/20"
          >
            {readyCount > 0 ? `Confirmar y subir (${readyCount})` : "Confirmar"}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto p-8">
        {totalCount > 0 && (
          <div className="mb-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to right, #f59e0b, #10b981)` }}
              animate={{ width: `${totalCount > 0 ? ((readyCount + doneCount) / totalCount) * 100 : 0}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Drop zone */}
        <div
          ref={dropZoneRef}
          className={cn(
            "relative border-2 border-dashed rounded-3xl transition-all duration-200",
            files.length === 0 ? "p-16" : "p-6 mb-6",
            dragOver ? "border-amber-400 bg-amber-50/50 scale-[1.01]" : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/30"
          )}
          style={{ borderColor: dragOver ? undefined : COLORS.BORDER_SUBTLE }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        >
          <div className={cn("flex flex-col items-center gap-3", files.length > 0 && "flex-row gap-2")}>
            <div className={cn("rounded-2xl flex items-center justify-center", files.length === 0 ? "size-16 bg-gray-100" : "size-10 bg-amber-50")}>
              <Upload size={files.length === 0 ? 24 : 16} className={files.length === 0 ? "opacity-25" : "text-amber-600"} />
            </div>
            <div className="text-center">
              <p className={cn("font-bold", files.length === 0 ? "text-sm opacity-30" : "text-xs opacity-40")}>
                {files.length === 0 ? "Arrastra y suelta archivos PDF aquí" : "Arrastra más PDFs"}
              </p>
              {files.length === 0 && <p className="text-xs opacity-20 mt-1">o haz clic para seleccionar · Máx 500 KB por archivo</p>}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "text-xs font-bold transition-colors",
                files.length === 0 ? "px-5 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600" : "px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200"
              )}
              style={{ color: files.length === 0 ? undefined : COLORS.CHARCOAL }}
            >
              Seleccionar PDFs
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="overflow-auto max-h-[calc(100vh-400px)]">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-sm">
                  <tr className="[&>th]:text-[10px] [&>th]:font-bold [&>th]:uppercase [&>th]:tracking-wider [&>th]:opacity-50 [&>th]:py-3 [&>th]:px-4 [&>th]:text-left">
                    <th className="w-8">#</th>
                    <th>Archivo</th>
                    <th className="w-[250px]">Estudiante</th>
                    <th className="w-[180px]">Curso</th>
                    <th className="w-[80px] text-center">Estado</th>
                    <th className="w-[120px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  {files.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "transition-colors",
                        item.status === "done" && "bg-emerald-50/30",
                        item.status === "error" && "bg-red-50/30",
                        item.status === "not_found" && "bg-amber-50/20",
                      )}
                    >
                      <td className="py-3 px-4 text-xs opacity-30">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPreviewFileId(previewFileId === item.id ? null : item.id)}
                            className="size-8 flex items-center justify-center rounded-lg bg-black/5 hover:bg-black/10 shrink-0"
                          >
                            <Eye size={13} />
                          </button>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate max-w-[300px]" style={{ color: COLORS.CHARCOAL }}>{item.filename}</p>
                            <p className="text-[10px] opacity-40">
                              {(item.file.size / 1024).toFixed(0)} KB
                              {item.cedula && <span className="ml-2 text-amber-600">Cédula: {item.cedula}</span>}
                              {!item.cedula && item.searchTerm && <span className="ml-2 opacity-30">«{item.searchTerm}»</span>}
                            </p>
                          </div>
                          {previewFileId === item.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 120 }}
                              className="absolute mt-24 ml-10 z-10 rounded-xl border bg-white shadow-xl overflow-hidden"
                              style={{ borderColor: COLORS.BORDER_SUBTLE }}
                            >
                              <iframe src={item.previewUrl} className="w-[200px] h-[120px]" title="preview" />
                            </motion.div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {item.status === "searching" ? (
                          <div className="flex items-center gap-2 text-xs opacity-40">
                            <Loader2 size={12} className="animate-spin" /> Buscando...
                          </div>
                        ) : item.status === "not_found" ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                              <AlertTriangle size={10} /> No encontrado
                            </span>
                            <button
                              onClick={() => setManualOpen(item.id)}
                              className="text-[10px] underline opacity-50 hover:opacity-100 text-left"
                            >
                              Buscar manualmente
                            </button>
                          </div>
                        ) : item.status === "multiple" ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                              <AlertTriangle size={10} /> Múltiples ({item.matches.length})
                            </span>
                            <select
                              className="text-[10px] border rounded-lg px-2 py-1"
                              onChange={e => {
                                const match = item.matches.find(m => m.id === e.target.value)
                                if (match) selectMatch(item.id, match)
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>Seleccionar...</option>
                              {item.matches.map(m => (
                                <option key={m.id} value={m.id}>{m.nombres} {m.apellidos} ({m.cedula})</option>
                              ))}
                            </select>
                          </div>
                        ) : item.match ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>
                              {item.match.nombres} {item.match.apellidos}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                              {item.match.cedula}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs opacity-30">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={item.cursoAbiertoId}
                          onChange={e => setCursoForFile(item.id, e.target.value)}
                          className="text-[10px] border rounded-lg px-2 py-1.5 w-full bg-gray-50"
                          style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        >
                          <option value="">Sin asignar</option>
                          {cursos.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.status === "searching" && <Loader2 size={14} className="animate-spin opacity-30 mx-auto" />}
                        {item.status === "not_found" && <span className="text-red-600 text-[10px] font-bold">Falta</span>}
                        {item.status === "multiple" && <span className="text-amber-600 text-[10px] font-bold">Revisar</span>}
                        {item.status === "found" || item.status === "manual" ? (
                          item.match ? (
                            <button
                              onClick={() => markReady(item.id)}
                              className="text-[10px] font-bold text-emerald-600 hover:underline"
                            >
                              Listo ✓
                            </button>
                          ) : (
                            <span className="text-[10px] opacity-30">—</span>
                          )
                        ) : item.status === "ready" && (
                          <span className="text-emerald-600 text-[10px] font-bold">✓ Listo</span>
                        )}
                        {item.status === "uploading" && <Loader2 size={14} className="animate-spin text-amber-500 mx-auto" />}
                        {item.status === "done" && <span className="text-emerald-600 text-[10px] font-bold">✓ Creado</span>}
                        {item.status === "error" && <span className="text-red-600 text-[10px] font-bold">Error</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === "found" && item.match && (
                            <button
                              onClick={() => markReady(item.id)}
                              className="size-8 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100"
                              title="Marcar listo"
                            >
                              <Check size={13} className="text-emerald-600" />
                            </button>
                          )}
                          {item.match && (
                            <button
                              onClick={() => setManualOpen(item.id)}
                              className="size-8 flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100"
                              title="Cambiar estudiante"
                            >
                              <SearchIcon size={13} className="text-amber-600" />
                            </button>
                          )}
                          <button
                            onClick={() => removeFile(item.id)}
                            className="size-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100"
                            title="Eliminar"
                          >
                            <Trash2 size={12} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {files.length === 0 && cursosLoaded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center"
              >
                <div className="size-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FileText size={28} className="opacity-15" style={{ color: COLORS.CHARCOAL }} />
                </div>
                <p className="text-sm font-bold opacity-30">Sin archivos cargados</p>
                <p className="text-xs opacity-20 mt-1 max-w-[320px] mx-auto">
                  Arrastra archivos PDF o haz clic en &quot;Seleccionar PDFs&quot; para comenzar.
                  Los nombres de archivo se usarán para encontrar al estudiante.
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Modal búsqueda manual */}
      <AnimatePresence>
        {manualOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" onClick={() => setManualOpen(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div>
                  <h2 className="text-lg font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Buscar estudiante</h2>
                  <p className="text-xs opacity-40 mt-0.5">Asociar manualmente al archivo</p>
                </div>
                <button onClick={() => setManualOpen(null)} className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Buscar por nombre o cédula</label>
                  <input
                    type="text"
                    value={manualSearch}
                    onChange={e => handleManualSearch(e.target.value)}
                    placeholder="Escriba nombre o cédula..."
                    className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    autoFocus
                  />
                </div>
                {manualResults.length > 0 && (
                  <div className="border rounded-xl bg-white divide-y max-h-60 overflow-y-auto" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    {manualResults.map(e => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => selectMatch(manualOpen, e)}
                        className="w-full text-left px-4 py-3 text-xs hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="font-medium">{e.nombres} {e.apellidos}</span>
                        <span className="text-[10px] opacity-40">{e.cedula}</span>
                      </button>
                    ))}
                  </div>
                )}
                {manualSearch.length >= 2 && manualResults.length === 0 && (
                  <p className="text-xs text-red-500">No se encontraron estudiantes</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
