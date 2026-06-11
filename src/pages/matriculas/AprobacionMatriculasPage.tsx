import { useState, useEffect, useRef, useMemo } from "react"
import axios from "axios"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle04Icon,
  Cancel01Icon,
  UserIcon,
  BookOpenIcon,
  PaymentIcon,
  CalendarIcon,
  MailIcon,
  CallIcon,
  SearchIcon,
  Image01Icon,
  Edit01Icon,
  Upload05Icon,
  FilterIcon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { RejectModal } from "@/components/RejectModal"
import { cursosService, type CatalogoCurso, type CursoAbierto } from "@/services/cursos.service"
import { toast } from "sonner"

export function AprobacionMatriculasPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selected, setSelected] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState("pendiente_validacion")
  const [searchTerm, setSearchTerm] = useState("")

  const [confirmAction, setConfirmAction] = useState<{ type: "aprobar" | "rechazar"; id: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [expandedComprobante, setExpandedComprobante] = useState(false)
  const [uploadingCedula, setUploadingCedula] = useState(false)
  const cedulaRef = useRef<HTMLInputElement>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Edición de pago
  const [editPagoField, setEditPagoField] = useState<string | null>(null)
  const [editPagoVal, setEditPagoVal] = useState("")
  const [savingPagoEdit, setSavingPagoEdit] = useState(false)

  // Edición de curso
  const [editCursoField, setEditCursoField] = useState<string | null>(null)
  const [editCursoVal, setEditCursoVal] = useState("")
  const [savingCursoEdit, setSavingCursoEdit] = useState(false)
  const [cursosAbiertosList, setCursosAbiertosList] = useState<CursoAbierto[]>([])

  // Upload comprobante
  const [uploadingComprobante, setUploadingComprobante] = useState(false)
  const comprobanteRef = useRef<HTMLInputElement>(null)

  // Filtros solo para aprobadas
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("")
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("")
  const [filtroCursoId, setFiltroCursoId] = useState("")
  const [catalogosFiltro, setCatalogosFiltro] = useState<CatalogoCurso[]>([])

  // Edición inline
  const [editField, setEditField] = useState<string | null>(null)
  const [editVal, setEditVal] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  const cargarSolicitudes = async () => {
    setLoading(true)
    try {
      const res = await cursosService.getSolicitudesInscripcion({ estado: filtroEstado || undefined, per_page: 50 })
      setSolicitudes(((res as Record<string, unknown>).data as Record<string, unknown>[]) || [])
    } catch { toast.error("Error al cargar solicitudes") }
    finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargarSolicitudes() }, [filtroEstado])

  useEffect(() => {
    if (filtroEstado === "matricula_creada") {
      cursosService.getCatalogos().then(res => setCatalogosFiltro(res.data || [])).catch(() => {})
    }
  }, [filtroEstado])

  const viewDetail = async (id: string) => {
    if (selectedId === id) { setSelectedId(null); setSelected(null); return }
    setSelectedId(id)
    setLoadingDetail(true)
    setExpandedComprobante(false)
    try {
      const detalle = await cursosService.getSolicitudInscripcionById(id)
      setSelected(detalle)
    } catch { toast.error("Error al cargar detalle") }
    finally { setLoadingDetail(false) }
  }

  const refreshDetail = async () => {
    if (!selectedId) return
    setRefreshing(true)
    try {
      const detalle = await cursosService.getSolicitudInscripcionById(selectedId)
      setSelected(detalle)
    } catch { /* silent */ }
    setTimeout(() => setRefreshing(false), 400)
  }

  const startEdit = (field: string, value: string) => { setEditField(field); setEditVal(value) }
  const cancelEdit = () => { setEditField(null); setEditVal("") }
  
  const saveEdit = async () => {
    if (!selectedId || !editField || editVal === "") return
    setSavingEdit(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data[editField] = editVal
      await cursosService.actualizarEstudiante(selectedId, data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelected((prev: any) => {
        if (!prev) return prev
        const updated = { ...prev }
        if (updated.solicitante?.datos) {
          updated.solicitante = { ...updated.solicitante, datos: { ...updated.solicitante.datos, [editField]: editVal } }
        }
        return updated
      })
      toast.success("Dato actualizado correctamente")
      setEditField(null)
      setEditVal("")
      refreshDetail()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al guardar cambio")
    } finally {
      setSavingEdit(false)
    }
  }

  const handleUploadCedula = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedId) return
    setUploadingCedula(true)
    try {
      const form = new FormData()
      form.append("archivo", file)
      const token = localStorage.getItem("auth_token")
      const base = import.meta.env.VITE_API_URL
      const res = await axios.post(`${base}/academic/solicitudes-inscripcion/${selectedId}/cedula`, form, {
        headers: { Accept: "application/json", Authorization: token ? `Bearer ${token}` : "" },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, cedula_url: res.data.data.cedula_url } } }))
      toast.success("Cédula subida")
    } catch { toast.error("Error al subir cédula") }
    finally { setUploadingCedula(false) }
  }

  const savePagoEdit = async () => {
    if (!selectedId || !editPagoField) return
    setSavingPagoEdit(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {}
      if (editPagoField === "pago_monto") {
        data.monto_solicitado = parseFloat(editPagoVal)
      } else if (editPagoField === "pago_fecha") {
        data.fecha_pago_declarada = editPagoVal
      } else {
        data.tipo_pago = editPagoVal
      }
      await cursosService.actualizarPago(selectedId, data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelected((prev: any) => {
        if (!prev?.pago) return prev
        const updated = { ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago.comprobante } } }
        if (editPagoField === "pago_monto") updated.pago.monto_solicitado = parseFloat(editPagoVal)
        else if (editPagoField === "pago_fecha") updated.pago.comprobante.fecha_pago_declarada = editPagoVal
        else updated.pago.tipo_pago = editPagoVal
        return updated
      })
      toast.success("Dato de pago actualizado")
      setEditPagoField(null); setEditPagoVal("")
      refreshDetail()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al guardar pago")
    } finally {
      setSavingPagoEdit(false)
    }
  }

  const saveCursoEdit = async () => {
    if (!selectedId || !editCursoField) return
    setSavingCursoEdit(true)
    try {
      await cursosService.actualizarCurso(selectedId, { curso_abierto_id: editCursoVal })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cursoNombre = cursosAbiertosList.find((c: any) => c.id === editCursoVal)?.catalogo?.nombre || editCursoVal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelected((prev: any) => {
        if (!prev) return prev
        return { ...prev, curso: { ...prev.curso, nombre: cursoNombre, id: editCursoVal } }
      })
      toast.success("Curso actualizado")
      setEditCursoField(null); setEditCursoVal("")
      refreshDetail()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al guardar curso")
    } finally {
      setSavingCursoEdit(false)
    }
  }

  const loadCursosAbiertos = async () => {
    try {
      const res = await cursosService.getCursos({}, 1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCursosAbiertosList((res as any).data || [])
    } catch { /* silent */ }
  }

  const handleUploadComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedId) return
    setUploadingComprobante(true)
    try {
      const form = new FormData()
      form.append("archivo", file)
      const token = localStorage.getItem("auth_token")
      const base = import.meta.env.VITE_API_URL
      const res = await axios.post(`${base}/academic/solicitudes-inscripcion/${selectedId}/comprobante`, form, {
        headers: { Accept: "application/json", Authorization: token ? `Bearer ${token}` : "" },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, url: res.data.data.comprobante_url } } }))
      toast.success("Comprobante subido")
    } catch { toast.error("Error al subir comprobante") }
    finally { setUploadingComprobante(false) }
  }

  const handleApprove = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    try {
      await cursosService.aprobarSolicitudInscripcion(confirmAction.id)
      toast.success("Matrícula aprobada")
      setConfirmAction(null); setSelectedId(null); setSelected(null)
      cargarSolicitudes()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al aprobar")
    } finally { setActionLoading(false) }
  }

  const handleReject = async (motivo: string) => {
    if (!confirmAction) return
    setActionLoading(true)
    try {
      await cursosService.rechazarSolicitudInscripcion(confirmAction.id, motivo)
      toast.success("Solicitud rechazada")
      setConfirmAction(null); setSelectedId(null); setSelected(null)
      cargarSolicitudes()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al rechazar")
    } finally { setActionLoading(false) }
  }

  const filtered = useMemo(() => {
    const items = solicitudes.filter(s => {
      const nombre = s.estudiante?.nombres || s.participante_externo?.nombres || ""
      const apellido = s.estudiante?.apellidos || s.participante_externo?.apellidos || ""
      const curso = s.curso_abierto?.catalogo?.nombre || ""
      const matchesSearch = !searchTerm || `${nombre} ${apellido} ${curso}`.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false
      if (filtroEstado !== "matricula_creada") return true
      if (filtroCursoId && s.curso_abierto?.catalogo_curso_id !== filtroCursoId) return false
      if (filtroFechaDesde) {
        const d = new Date(s.created_at || s.fecha_creacion)
        if (isNaN(d.getTime()) || d < new Date(filtroFechaDesde)) return false
      }
      if (filtroFechaHasta) {
        const d = new Date(s.created_at || s.fecha_creacion)
        if (isNaN(d.getTime())) return false
        const hasta = new Date(filtroFechaHasta)
        hasta.setHours(23, 59, 59, 999)
        if (d > hasta) return false
      }
      return true
    })
    return items
  }, [solicitudes, searchTerm, filtroEstado, filtroCursoId, filtroFechaDesde, filtroFechaHasta])

  const pendientesAgrupadas = useMemo(() => {
    if (filtroEstado !== "pendiente_validacion") return null
    const grupos: { dateKey: string; label: string; items: any[] }[] = []
    const map = new Map<string, any[]>()
    for (const s of filtered) {
      const rawDate = s.created_at || s.fecha_creacion
      if (!rawDate) continue
      const d = new Date(rawDate)
      if (isNaN(d.getTime())) continue
      const key = d.toISOString().slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    for (const [key, items] of map) {
      const d = new Date(key)
      const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
      const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
      const label = `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`
      grupos.push({ dateKey: key, label, items })
    }
    grupos.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    return grupos
  }, [filtered, filtroEstado])

  const totalPendientes = solicitudes.filter(s => s.estado === "pendiente_validacion").length

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
       <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
         <div className="max-w-[1000px] mx-auto px-6 py-6">
           <h1 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>Aprobación de Matrículas</h1>
           <p className="text-sm mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>{totalPendientes} pendiente{totalPendientes !== 1 ? "s" : ""} de revisión</p>
         </div>
       </div>

      <main className="flex-1">
        <div className="max-w-[1000px] mx-auto px-6 py-6 space-y-4">
           <div className="flex flex-wrap items-center gap-3">
             <div className="relative flex-1 max-w-sm">
               <HugeiconsIcon icon={SearchIcon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.TEXT_MUTED }} />
               <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs outline-none bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
             </div>
              <div className="flex gap-1 rounded-xl border p-0.5 bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {[{ value: "", label: "Todos" }, { value: "pendiente_validacion", label: "Pendientes" }, { value: "matricula_creada", label: "Aprobadas" }, { value: "rechazado", label: "Rechazados" }].map(f => (
                  <button key={f.value || "todos"} onClick={() => { setFiltroEstado(f.value); setFiltroCursoId(""); setFiltroFechaDesde(""); setFiltroFechaHasta("") }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ backgroundColor: filtroEstado === f.value ? COLORS.CHARCOAL : "transparent", color: filtroEstado === f.value ? "white" : COLORS.TEXT_MUTED }}>
                    {f.label}
                  </button>
               ))}
             </div>
           </div>

           {/* Filtros extra solo para Aprobadas */}
           {filtroEstado === "matricula_creada" && (
             <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
               <HugeiconsIcon icon={FilterIcon} size={14} style={{ color: COLORS.TEXT_MUTED }} />
               <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                 <span>Curso:</span>
                 <select value={filtroCursoId} onChange={e => setFiltroCursoId(e.target.value)}
                   className="px-3 py-1.5 rounded-lg border text-xs outline-none bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                   <option value="">Todos</option>
                   {catalogosFiltro.map(c => (
                     <option key={c.id} value={c.id}>{c.nombre}</option>
                   ))}
                 </select>
               </div>
               <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                 <span>Desde:</span>
                 <input type="date" value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)}
                   className="px-3 py-1.5 rounded-lg border text-xs outline-none bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
               </div>
               <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                 <span>Hasta:</span>
                 <input type="date" value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)}
                   className="px-3 py-1.5 rounded-lg border text-xs outline-none bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
               </div>
               {(filtroCursoId || filtroFechaDesde || filtroFechaHasta) && (
                 <button onClick={() => { setFiltroCursoId(""); setFiltroFechaDesde(""); setFiltroFechaHasta("") }}
                   className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50"
                   style={{ color: "oklch(0.50 0.15 10)" }}>Limpiar</button>
               )}
             </div>
           )}

           {loading ? (
            <div className="p-20 text-center" style={{ color: COLORS.TEXT_MUTED }}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>No hay solicitudes</p>
            </div>
          ) : filtroEstado === "pendiente_validacion" && pendientesAgrupadas ? (
            <div className="space-y-6">
              {pendientesAgrupadas.map(grupo => (
                <div key={grupo.dateKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <HugeiconsIcon icon={Calendar03Icon} size={14} style={{ color: COLORS.TEXT_MUTED }} />
                    <h3 className="text-sm font-bold capitalize" style={{ color: COLORS.CHARCOAL }}>{grupo.label}</h3>
                    <span className="text-[10px] font-medium opacity-40">{grupo.items.length} solicitud{grupo.items.length !== 1 ? "es" : ""}</span>
                  </div>
                  <div className="space-y-3">
                    {grupo.items.map(s => {
                      const isSelected = selectedId === s.id
                      return (
                        <div key={s.id} className="bg-white rounded-2xl border overflow-hidden transition-all" style={{ borderColor: isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE }}>
                          <button onClick={() => viewDetail(s.id)} className="w-full text-left p-5 flex items-center gap-4">
                            <div className="size-12 rounded-xl flex items-center justify-center shrink-0 text-base font-bold"
                              style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`, color: COLORS.ACCENT }}>
                              {(s.estudiante?.nombres || s.participante_externo?.nombres || "?")[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                                {s.estudiante?.nombres || s.participante_externo?.nombres || "—"} {s.estudiante?.apellidos || s.participante_externo?.apellidos || ""}
                              </p>
                              <p className="text-xs truncate mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                                {s.curso_abierto?.catalogo?.nombre || "Sin curso"} · {s.estudiante?.cedula || s.participante_externo?.cedula || "—"}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Tag color={COLORS.ACCENT}>${s.monto_solicitado}</Tag>
                                <Tag>{s.tipo_pago}</Tag>
                              </div>
                            </div>
                            <HugeiconsIcon icon={isSelected ? Cancel01Icon : CheckmarkCircle04Icon} size={18}
                              style={{ color: isSelected ? COLORS.TEXT_MUTED : COLORS.ACCENT }} />
                          </button>
                           {isSelected && (
                              <div className={cn("border-t px-5 py-5 space-y-5 transition-opacity duration-200 relative", refreshing && "opacity-60")} style={{ borderColor: COLORS.BORDER_SUBTLE, background: "oklch(0.985 0 0)" }}>
                               {refreshing && (
                                 <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
                               )}
                              {loadingDetail ? (
                                <div className="p-4 text-center text-xs" style={{ color: COLORS.TEXT_MUTED }}>Cargando detalle...</div>
                              ) : selected ? (
                                <>
                                  <Section title="Datos del Estudiante" icon={UserIcon}>
                                    <div className="grid grid-cols-2 gap-3">
                                      <EF icon={UserIcon} label="Nombres" field="nombres" data={selected.solicitante?.datos}
                                        editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                      <EF icon={UserIcon} label="Apellidos" field="apellidos" data={selected.solicitante?.datos}
                                        editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                      <EF icon={SearchIcon} label="Cédula" field="cedula" data={selected.solicitante?.datos} bold
                                        editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                      <EF icon={MailIcon} label="Correo" field="correo" data={selected.solicitante?.datos}
                                        editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                      <EF icon={CallIcon} label="Teléfono" field="celular" data={selected.solicitante?.datos}
                                        editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                    </div>
                                  </Section>
                                   <Section title="Curso" icon={BookOpenIcon}>
                                     <div className="grid grid-cols-2 gap-3">
                                       {editCursoField === "curso" ? (
                                         <div className="col-span-2 space-y-2">
                                           <div className="flex items-center gap-2 text-xs">
                                             <HugeiconsIcon icon={BookOpenIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                             <span style={{ color: COLORS.TEXT_MUTED }}>Seleccionar curso:</span>
                                           </div>
                                           <select value={editCursoVal} onChange={e => setEditCursoVal(e.target.value)}
                                             className="w-full px-3 py-2 text-xs border rounded-lg outline-none bg-white" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={savingCursoEdit}>
                                             <option value="">Seleccionar...</option>
                                             {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {cursosAbiertosList.map((c: any) => (
                                               <option key={c.id} value={c.id}>{c.catalogo?.nombre || c.id} {c.fecha_inicio ? `(${c.fecha_inicio.split("T")[0]})` : ""}</option>
                                             ))}
                                           </select>
                                           <div className="flex gap-2">
                                             <button onClick={saveCursoEdit} disabled={savingCursoEdit} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingCursoEdit ? 0.6 : 1 }}>
                                               {savingCursoEdit ? "..." : "Guardar"}
                                             </button>
                                             <button onClick={() => { setEditCursoField(null); setEditCursoVal("") }} disabled={savingCursoEdit} className="text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>
                                               Cancelar
                                             </button>
                                           </div>
                                         </div>
                                       ) : (
                                         <>
                                           <div className="flex items-center gap-2 text-xs group col-span-2">
                                             <HugeiconsIcon icon={BookOpenIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                             <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">Curso</span>
                                             <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: 700 }}>{selected.curso?.nombre || "—"}</span>
                                             <button onClick={() => { setEditCursoField("curso"); setEditCursoVal(selected.curso?.id || ""); loadCursosAbiertos() }}
                                               className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                                               <HugeiconsIcon icon={Edit01Icon} size={14} />
                                             </button>
                                           </div>
                                           <InfoItem icon={CalendarIcon} label="Inicio" value={selected.curso?.fechas?.inicio?.split("T")[0] || "—"} />
                                           <InfoItem icon={PaymentIcon} label="Precio" value={`$${selected.curso?.precio_base || 0}`} bold />
                                         </>
                                       )}
                                     </div>
                                   </Section>
                                   <Section title="Pago" icon={PaymentIcon}>
                                     <div className="grid grid-cols-2 gap-3">
                                       {editPagoField === "pago_monto" ? (
                                         <div className="flex items-center gap-2 col-span-2">
                                           <HugeiconsIcon icon={PaymentIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                           <span className="shrink-0 text-xs" style={{ color: COLORS.TEXT_MUTED }}>Monto:</span>
                                           <input type="number" step="0.01" value={editPagoVal} onChange={e => setEditPagoVal(e.target.value)}
                                             className="flex-1 px-2 py-1.5 text-xs border rounded-lg outline-none" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={savingPagoEdit} />
                                           <button onClick={savePagoEdit} disabled={savingPagoEdit} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingPagoEdit ? 0.6 : 1 }}>
                                             {savingPagoEdit ? "..." : "Guardar"}
                                           </button>
                                           <button onClick={() => { setEditPagoField(null); setEditPagoVal("") }} disabled={savingPagoEdit} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>
                                             Cancelar
                                           </button>
                                         </div>
                                       ) : (
                                         <div className="flex items-center gap-2 text-xs group">
                                           <HugeiconsIcon icon={PaymentIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                           <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">Monto</span>
                                           <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: 700 }}>${selected.pago?.monto_solicitado}</span>
                                           <button onClick={() => { setEditPagoField("pago_monto"); setEditPagoVal(String(selected.pago?.monto_solicitado || "")) }}
                                             className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                                             <HugeiconsIcon icon={Edit01Icon} size={14} />
                                           </button>
                                         </div>
                                       )}
                                       {editPagoField === "pago_tipo" ? (
                                         <div className="flex items-center gap-2 col-span-2">
                                           <HugeiconsIcon icon={PaymentIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                           <span className="shrink-0 text-xs" style={{ color: COLORS.TEXT_MUTED }}>Tipo:</span>
                                           <select value={editPagoVal} onChange={e => setEditPagoVal(e.target.value)}
                                             className="flex-1 px-2 py-1.5 text-xs border rounded-lg outline-none bg-white" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={savingPagoEdit}>
                                             <option value="transferencia">Transferencia</option>
                                             <option value="deposito">Depósito</option>
                                             <option value="efectivo">Efectivo</option>
                                           </select>
                                           <button onClick={savePagoEdit} disabled={savingPagoEdit} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingPagoEdit ? 0.6 : 1 }}>
                                             {savingPagoEdit ? "..." : "Guardar"}
                                           </button>
                                           <button onClick={() => { setEditPagoField(null); setEditPagoVal("") }} disabled={savingPagoEdit} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>
                                             Cancelar
                                           </button>
                                         </div>
                                       ) : (
                                         <div className="flex items-center gap-2 text-xs group">
                                           <HugeiconsIcon icon={PaymentIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                           <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">Tipo</span>
                                           <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: 500 }}>{selected.pago?.tipo_pago || "—"}</span>
                                           <button onClick={() => { setEditPagoField("pago_tipo"); setEditPagoVal(selected.pago?.tipo_pago || "") }}
                                             className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                                             <HugeiconsIcon icon={Edit01Icon} size={14} />
                                           </button>
                                         </div>
                                       )}
                                       {editPagoField === "pago_fecha" ? (
                                         <div className="flex items-center gap-2 col-span-2">
                                           <HugeiconsIcon icon={CalendarIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                           <span className="shrink-0 text-xs" style={{ color: COLORS.TEXT_MUTED }}>Fecha:</span>
                                           <input type="date" value={editPagoVal} onChange={e => setEditPagoVal(e.target.value)}
                                             className="flex-1 px-2 py-1.5 text-xs border rounded-lg outline-none" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={savingPagoEdit} />
                                           <button onClick={savePagoEdit} disabled={savingPagoEdit} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingPagoEdit ? 0.6 : 1 }}>
                                             {savingPagoEdit ? "..." : "Guardar"}
                                           </button>
                                           <button onClick={() => { setEditPagoField(null); setEditPagoVal("") }} disabled={savingPagoEdit} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>
                                             Cancelar
                                           </button>
                                         </div>
                                       ) : (
                                         <div className="flex items-center gap-2 text-xs group">
                                           <HugeiconsIcon icon={CalendarIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                           <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">Fecha</span>
                                           <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: 500 }}>{selected.pago?.comprobante?.fecha_pago_declarada?.split?.("T")?.[0] || "—"}</span>
                                           <button onClick={() => { setEditPagoField("pago_fecha"); setEditPagoVal(selected.pago?.comprobante?.fecha_pago_declarada?.split?.("T")?.[0] || "") }}
                                             className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                                             <HugeiconsIcon icon={Edit01Icon} size={14} />
                                           </button>
                                         </div>
                                       )}
                                       <InfoItem icon={PaymentIcon} label="Comprobante" value={selected.pago?.comprobante?.tipo || "—"} />
                                     </div>
                                     <div className="mt-3 space-y-2">
                                       <div className="flex gap-2">
                                         <input ref={comprobanteRef} type="file" accept="image/*" className="hidden" onChange={handleUploadComprobante} />
                                         <button onClick={() => comprobanteRef.current?.click()} disabled={uploadingComprobante}
                                           className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold hover:bg-white transition-colors"
                                           style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT, opacity: uploadingComprobante ? 0.6 : 1 }}>
                                           <HugeiconsIcon icon={Upload05Icon} size={16} />
                                           {uploadingComprobante ? "Subiendo..." : selected.pago?.comprobante?.url ? "Cambiar comprobante" : "Subir comprobante"}
                                         </button>
                                         {selected.pago?.comprobante?.url && (
                                           <button onClick={() => setExpandedComprobante(!expandedComprobante)}
                                             className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold hover:bg-white transition-colors"
                                             style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}>
                                             <HugeiconsIcon icon={Image01Icon} size={16} />
                                             {expandedComprobante ? "Ocultar" : "Ver"}
                                           </button>
                                         )}
                                       </div>
                                       {expandedComprobante && selected.pago?.comprobante?.url && (
                                         <div className="rounded-xl border overflow-hidden bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                           <img src={fixImageUrl(selected.pago.comprobante.url)} alt="Comprobante"
                                             className="w-full object-contain max-h-[400px]" />
                                         </div>
                                       )}
                                     </div>
                                   </Section>
                                   <Section title="Documento de Identidad" icon={Image01Icon}>
                                     {selected.pago?.comprobante?.cedula_url ? (
                                       <div>
                                         <div className="flex items-center justify-between mb-2">
                                           <span className="text-[10px] font-medium opacity-40">Imagen actual</span>
                                           <button onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
                                             className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: COLORS.ACCENT }}>
                                             <HugeiconsIcon icon={Edit01Icon} size={12} />Cambiar
                                           </button>
                                         </div>
                                         <img src={fixImageUrl(selected.pago.comprobante.cedula_url)} alt="Cédula"
                                           className="w-full object-contain max-h-[400px] rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                                       </div>
                                     ) : (
                                       <div className="p-5 rounded-xl border border-dashed text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                         <p className="text-xs mb-3" style={{ color: COLORS.TEXT_MUTED }}>No se ha subido la foto de cédula</p>
                                         <input ref={cedulaRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCedula} />
                                         <button type="button" onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
                                           className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-[0.97]"
                                           style={{ backgroundColor: COLORS.ACCENT, opacity: uploadingCedula ? 0.6 : 1 }}>
                                           <HugeiconsIcon icon={Upload05Icon} size={14} className="inline mr-1.5" />
                                           {uploadingCedula ? "Subiendo..." : "Subir foto de cédula"}
                                         </button>
                                       </div>
                                     )}
                                     <input ref={cedulaRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCedula} />
                                   </Section>
                                  <div className="flex gap-3 pt-3">
                                    <button onClick={() => setConfirmAction({ type: "rechazar", id: selected.id })}
                                      className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-red-50 active:scale-[0.97]"
                                      style={{ borderColor: "oklch(0.50 0.15 10 / 0.3)", color: "oklch(0.50 0.15 10)" }}>
                                      <HugeiconsIcon icon={Cancel01Icon} size={16} className="inline mr-1.5" />Rechazar
                                    </button>
                                    <button onClick={() => setConfirmAction({ type: "aprobar", id: selected.id })}
                                      className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
                                      style={{ backgroundColor: COLORS.ACCENT }}>
                                      <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />Aprobar Matrícula
                                    </button>
                                  </div>
                                </>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(s => {
                const isSelected = selectedId === s.id
                return (
                  <div key={s.id} className="bg-white rounded-2xl border overflow-hidden transition-all" style={{ borderColor: isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE }}>
                    <button onClick={() => viewDetail(s.id)} className="w-full text-left p-5 flex items-center gap-4">
                      <div className="size-12 rounded-xl flex items-center justify-center shrink-0 text-base font-bold"
                        style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`, color: COLORS.ACCENT }}>
                        {(s.estudiante?.nombres || s.participante_externo?.nombres || "?")[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                          {s.estudiante?.nombres || s.participante_externo?.nombres || "—"} {s.estudiante?.apellidos || s.participante_externo?.apellidos || ""}
                        </p>
                        <p className="text-xs truncate mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                          {s.curso_abierto?.catalogo?.nombre || "Sin curso"} · {s.estudiante?.cedula || s.participante_externo?.cedula || "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Tag color={COLORS.ACCENT}>${s.monto_solicitado}</Tag>
                          <Tag>{s.tipo_pago}</Tag>
                          <Tag color={s.estado === "pendiente_validacion" ? "oklch(0.55 0.12 90)" : s.estado === "matricula_creada" ? "oklch(0.50 0.10 140)" : "oklch(0.50 0.15 10)"}>
                            {s.estado === "pendiente_validacion" ? "Pendiente" : s.estado === "matricula_creada" ? "Aprobada" : "Rechazada"}
                          </Tag>
                        </div>
                      </div>
                      <HugeiconsIcon icon={isSelected ? Cancel01Icon : CheckmarkCircle04Icon} size={18}
                        style={{ color: isSelected ? COLORS.TEXT_MUTED : COLORS.ACCENT }} />
                    </button>

                     {isSelected && (
                       <div className={cn("border-t px-5 py-5 space-y-5 transition-opacity duration-200 relative", refreshing && "opacity-60")} style={{ borderColor: COLORS.BORDER_SUBTLE, background: "oklch(0.985 0 0)" }}>
                         {refreshing && (
                           <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
                         )}
                        {loadingDetail ? (
                          <div className="p-4 text-center text-xs" style={{ color: COLORS.TEXT_MUTED }}>Cargando detalle...</div>
                        ) : selected ? (
                          <>
                            <Section title="Datos del Estudiante" icon={UserIcon}>
                              <div className="grid grid-cols-2 gap-3">
                                <EF icon={UserIcon} label="Nombres" field="nombres" data={selected.solicitante?.datos}
                                  editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                <EF icon={UserIcon} label="Apellidos" field="apellidos" data={selected.solicitante?.datos}
                                  editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                 <EF icon={SearchIcon} label="Cédula" field="cedula" data={selected.solicitante?.datos} bold
                                   editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                 <EF icon={MailIcon} label="Correo" field="correo" data={selected.solicitante?.datos}
                                   editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                 <EF icon={CallIcon} label="Teléfono" field="celular" data={selected.solicitante?.datos}
                                   editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                              </div>
                            </Section>

                             <Section title="Curso" icon={BookOpenIcon}>
                               <div className="grid grid-cols-2 gap-3">
                                 {editCursoField === "curso" ? (
                                   <div className="col-span-2 space-y-2">
                                     <div className="flex items-center gap-2 text-xs">
                                       <HugeiconsIcon icon={BookOpenIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                       <span style={{ color: COLORS.TEXT_MUTED }}>Seleccionar curso:</span>
                                     </div>
                                     <select value={editCursoVal} onChange={e => setEditCursoVal(e.target.value)}
                                       className="w-full px-3 py-2 text-xs border rounded-lg outline-none bg-white" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={savingCursoEdit}>
                                       <option value="">Seleccionar...</option>
                                       {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {cursosAbiertosList.map((c: any) => (
                                         <option key={c.id} value={c.id}>{c.catalogo?.nombre || c.id} {c.fecha_inicio ? `(${c.fecha_inicio.split("T")[0]})` : ""}</option>
                                       ))}
                                     </select>
                                     <div className="flex gap-2">
                                       <button onClick={saveCursoEdit} disabled={savingCursoEdit} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingCursoEdit ? 0.6 : 1 }}>
                                         {savingCursoEdit ? "..." : "Guardar"}
                                       </button>
                                       <button onClick={() => { setEditCursoField(null); setEditCursoVal("") }} disabled={savingCursoEdit} className="text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>
                                         Cancelar
                                       </button>
                                     </div>
                                   </div>
                                 ) : (
                                   <>
                                     <div className="flex items-center gap-2 text-xs group col-span-2">
                                       <HugeiconsIcon icon={BookOpenIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                       <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">Curso</span>
                                       <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: 700 }}>{selected.curso?.nombre || "—"}</span>
                                       <button onClick={() => { setEditCursoField("curso"); setEditCursoVal(selected.curso?.id || ""); loadCursosAbiertos() }}
                                         className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                                         <HugeiconsIcon icon={Edit01Icon} size={14} />
                                       </button>
                                     </div>
                                     <InfoItem icon={CalendarIcon} label="Inicio" value={selected.curso?.fechas?.inicio?.split("T")[0] || "—"} />
                                     <InfoItem icon={PaymentIcon} label="Precio" value={`$${selected.curso?.precio_base || 0}`} bold />
                                   </>
                                 )}
                               </div>
                             </Section>

                            <Section title="Pago" icon={PaymentIcon}>
                              <div className="grid grid-cols-2 gap-3">
                                {editPagoField === "pago_monto" ? (
                                  <div className="flex items-center gap-2 col-span-2">
                                    <HugeiconsIcon icon={PaymentIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                    <span className="shrink-0 text-xs" style={{ color: COLORS.TEXT_MUTED }}>Monto:</span>
                                    <input type="number" step="0.01" value={editPagoVal} onChange={e => setEditPagoVal(e.target.value)}
                                      className="flex-1 px-2 py-1.5 text-xs border rounded-lg outline-none" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={savingPagoEdit} />
                                    <button onClick={savePagoEdit} disabled={savingPagoEdit} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingPagoEdit ? 0.6 : 1 }}>
                                      {savingPagoEdit ? "..." : "Guardar"}
                                    </button>
                                    <button onClick={() => { setEditPagoField(null); setEditPagoVal("") }} disabled={savingPagoEdit} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-xs group">
                                    <HugeiconsIcon icon={PaymentIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                    <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">Monto</span>
                                    <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: 700 }}>${selected.pago?.monto_solicitado}</span>
                                    <button onClick={() => { setEditPagoField("pago_monto"); setEditPagoVal(String(selected.pago?.monto_solicitado || "")) }}
                                      className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                                      <HugeiconsIcon icon={Edit01Icon} size={14} />
                                    </button>
                                  </div>
                                )}
                                {editPagoField === "pago_tipo" ? (
                                  <div className="flex items-center gap-2 col-span-2">
                                    <HugeiconsIcon icon={PaymentIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                    <span className="shrink-0 text-xs" style={{ color: COLORS.TEXT_MUTED }}>Tipo:</span>
                                    <select value={editPagoVal} onChange={e => setEditPagoVal(e.target.value)}
                                      className="flex-1 px-2 py-1.5 text-xs border rounded-lg outline-none bg-white" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={savingPagoEdit}>
                                      <option value="transferencia">Transferencia</option>
                                      <option value="deposito">Depósito</option>
                                      <option value="efectivo">Efectivo</option>
                                    </select>
                                    <button onClick={savePagoEdit} disabled={savingPagoEdit} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingPagoEdit ? 0.6 : 1 }}>
                                      {savingPagoEdit ? "..." : "Guardar"}
                                    </button>
                                    <button onClick={() => { setEditPagoField(null); setEditPagoVal("") }} disabled={savingPagoEdit} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-xs group">
                                    <HugeiconsIcon icon={PaymentIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                    <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">Tipo</span>
                                    <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: 500 }}>{selected.pago?.tipo_pago || "—"}</span>
                                    <button onClick={() => { setEditPagoField("pago_tipo"); setEditPagoVal(selected.pago?.tipo_pago || "") }}
                                      className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                                      <HugeiconsIcon icon={Edit01Icon} size={14} />
                                    </button>
                                  </div>
                                )}
                                 {editPagoField === "pago_fecha" ? (
                                   <div className="flex items-center gap-2 col-span-2">
                                     <HugeiconsIcon icon={CalendarIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                     <span className="shrink-0 text-xs" style={{ color: COLORS.TEXT_MUTED }}>Fecha:</span>
                                     <input type="date" value={editPagoVal} onChange={e => setEditPagoVal(e.target.value)}
                                       className="flex-1 px-2 py-1.5 text-xs border rounded-lg outline-none" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={savingPagoEdit} />
                                     <button onClick={savePagoEdit} disabled={savingPagoEdit} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingPagoEdit ? 0.6 : 1 }}>
                                       {savingPagoEdit ? "..." : "Guardar"}
                                     </button>
                                     <button onClick={() => { setEditPagoField(null); setEditPagoVal("") }} disabled={savingPagoEdit} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>
                                       Cancelar
                                     </button>
                                   </div>
                                 ) : (
                                   <div className="flex items-center gap-2 text-xs group">
                                     <HugeiconsIcon icon={CalendarIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                     <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">Fecha</span>
                                      <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: 500 }}>{selected.pago?.comprobante?.fecha_pago_declarada?.split?.("T")?.[0] || "—"}</span>
                                      <button onClick={() => { setEditPagoField("pago_fecha"); setEditPagoVal(selected.pago?.comprobante?.fecha_pago_declarada?.split?.("T")?.[0] || "") }}
                                       className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                                       <HugeiconsIcon icon={Edit01Icon} size={14} />
                                     </button>
                                   </div>
                                 )}
                                 <InfoItem icon={PaymentIcon} label="Comprobante" value={selected.pago?.comprobante?.tipo || "—"} />
                               </div>
                              <div className="mt-3 space-y-2">
                                <div className="flex gap-2">
                                  <input ref={comprobanteRef} type="file" accept="image/*" className="hidden" onChange={handleUploadComprobante} />
                                  <button onClick={() => comprobanteRef.current?.click()} disabled={uploadingComprobante}
                                    className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold hover:bg-white transition-colors"
                                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT, opacity: uploadingComprobante ? 0.6 : 1 }}>
                                    <HugeiconsIcon icon={Upload05Icon} size={16} />
                                       {uploadingComprobante ? "Subiendo..." : selected.pago?.comprobante?.url ? "Cambiar comprobante" : "Subir comprobante"}
                                  </button>
                                  {selected.pago?.comprobante?.url && (
                                    <button onClick={() => setExpandedComprobante(!expandedComprobante)}
                                      className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold hover:bg-white transition-colors"
                                      style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}>
                                      <HugeiconsIcon icon={Image01Icon} size={16} />
                                      {expandedComprobante ? "Ocultar" : "Ver"}
                                    </button>
                                  )}
                                </div>
                                {expandedComprobante && selected.pago?.comprobante?.url && (
                                  <div className="rounded-xl border overflow-hidden bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                    <img src={fixImageUrl(selected.pago.comprobante.url)} alt="Comprobante"
                                      className="w-full object-contain max-h-[400px]" />
                                  </div>
                                )}
                              </div>
                            </Section>

                             <Section title="Documento de Identidad" icon={Image01Icon}>
                               {selected.pago?.comprobante?.cedula_url ? (
                                 <div>
                                   <div className="flex items-center justify-between mb-2">
                                     <span className="text-[10px] font-medium opacity-40">Imagen actual</span>
                                     <button onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
                                       className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: COLORS.ACCENT }}>
                                       <HugeiconsIcon icon={Edit01Icon} size={12} />Cambiar
                                     </button>
                                   </div>
                                   <img src={fixImageUrl(selected.pago.comprobante.cedula_url)} alt="Cédula"
                                     className="w-full object-contain max-h-[400px] rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                                 </div>
                               ) : (
                                 <div className="p-5 rounded-xl border border-dashed text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                   <p className="text-xs mb-3" style={{ color: COLORS.TEXT_MUTED }}>No se ha subido la foto de cédula</p>
                                   <input ref={cedulaRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCedula} />
                                   <button type="button" onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
                                     className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-[0.97]"
                                     style={{ backgroundColor: COLORS.ACCENT, opacity: uploadingCedula ? 0.6 : 1 }}>
                                     <HugeiconsIcon icon={Upload05Icon} size={14} className="inline mr-1.5" />
                                     {uploadingCedula ? "Subiendo..." : "Subir foto de cédula"}
                                   </button>
                                 </div>
                               )}
                               <input ref={cedulaRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCedula} />
                             </Section>

                            {s.estado === "pendiente_validacion" && (
                              <div className="flex gap-3 pt-3">
                                <button onClick={() => setConfirmAction({ type: "rechazar", id: selected.id })}
                                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-red-50 active:scale-[0.97]"
                                  style={{ borderColor: "oklch(0.50 0.15 10 / 0.3)", color: "oklch(0.50 0.15 10)" }}>
                                  <HugeiconsIcon icon={Cancel01Icon} size={16} className="inline mr-1.5" />Rechazar
                                </button>
                                <button onClick={() => setConfirmAction({ type: "aprobar", id: selected.id })}
                                  className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
                                  style={{ backgroundColor: COLORS.ACCENT }}>
                                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />Aprobar Matrícula
                                </button>
                              </div>
                            )}
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <ConfirmationModal
        isOpen={confirmAction?.type === "aprobar" && !!confirmAction}
        title="Aprobar Matrícula"
        message="Se creará la matrícula del estudiante."
        confirmText="Aprobar"
        cancelText="Cancelar"
        isLoading={actionLoading}
        icon="info"
        onConfirm={handleApprove}
        onCancel={() => setConfirmAction(null)}
      />

      <RejectModal
        isOpen={confirmAction?.type === "rechazar" && !!confirmAction}
        isLoading={actionLoading}
        onConfirm={handleReject}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <HugeiconsIcon icon={icon} size={14} style={{ color: COLORS.ACCENT }} />
        <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>{title}</h4>
      </div>
      {children}
    </div>
  )
}

function InfoItem({ icon, label, value, bold }: { icon: any; label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <HugeiconsIcon icon={icon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
      <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">{label}</span>
      <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  )
}

function EF({ icon, label, field, data, editField, editVal, onEdit, onChange, onSave, onCancel, bold, saving }: {
  icon: any; label: string; field: string; data: any
  editField: string | null; editVal: string
  onEdit: (f: string, v: string) => void; onChange: (v: string) => void; onSave: () => void; onCancel: () => void
  bold?: boolean; saving?: boolean
}) {
  const value = data?.[field] || "—"
  if (editField === field) {
    return (
      <div className="flex items-center gap-2 col-span-2">
        <HugeiconsIcon icon={icon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
        <span className="shrink-0 text-xs" style={{ color: COLORS.TEXT_MUTED }}>{label}:</span>
        <input value={editVal} onChange={e => onChange(e.target.value)}
          className="flex-1 px-2 py-1.5 text-xs border rounded-lg outline-none" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={saving} />
        <button onClick={onSave} disabled={saving} className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: saving ? 0.6 : 1 }}>
          {saving ? "..." : "Guardar"}
        </button>
        <button onClick={onCancel} disabled={saving} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED, opacity: saving ? 0.6 : 1 }}>
          Cancelar
        </button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-xs group">
      <HugeiconsIcon icon={icon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
      <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">{label}</span>
      <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: bold ? 700 : 500 }}>{value}</span>
      <button type="button" onClick={() => onEdit(field, value !== "—" ? value : "")}
        className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
        <HugeiconsIcon icon={Edit01Icon} size={14} />
      </button>
    </div>
  )
}

function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: color ? `color-mix(in srgb, ${color} 12%, transparent)` : "oklch(0.96 0 0)", color: color || COLORS.TEXT_MUTED }}>
      {children}
    </span>
  )
}

function fixImageUrl(url: string): string {
  if (!url) return url
  return url.replace(/^https?:\/\/localhost(?::\d+)?/, "")
}
