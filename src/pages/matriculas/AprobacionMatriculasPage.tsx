/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
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
import { tallerService } from "@/services/taller.service"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"

function ImageZoom({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose() }}
      tabIndex={0}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 size-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <img
        src={url}
        alt="Imagen ampliada"
        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}

export function AprobacionMatriculasPage() {
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [mainTab, setMainTab] = useState<"cursos" | "personalizados" | "talleres">("cursos")
  const [statusFilter, setStatusFilter] = useState<"pendientes" | "aprobados" | "rechazados">("pendientes")
  const [searchTerm, setSearchTerm] = useState("")

  const [tallerInscripciones, setTallerInscripciones] = useState<any[]>([])
  const [loadingTalleres, setLoadingTalleres] = useState(false)
  const [tallerSelectedId, setTallerSelectedId] = useState<string | null>(null)
  const [editTallerField, setEditTallerField] = useState<string | null>(null)
  const [editTallerVal, setEditTallerVal] = useState("")
  const [savingTallerEdit, setSavingTallerEdit] = useState(false)
  const [tallerEditId, setTallerEditId] = useState<string | null>(null)

  const saveTallerEdit = async () => {
    if (!tallerEditId || !editTallerField || editTallerVal === "") return
    setSavingTallerEdit(true)
    try {
      const updated = await tallerService.actualizarInscripcion(tallerEditId, { [editTallerField]: editTallerVal })
      setTallerInscripciones(prev => prev.map(i => i.id === tallerEditId ? { ...i, ...(updated.data || updated) } : i))
      toast.success("Dato actualizado correctamente")
      setEditTallerField(null); setEditTallerVal(""); setTallerEditId(null)
    } catch { toast.error("Error al actualizar") }
    finally { setSavingTallerEdit(false) }
  }

  const startTallerEdit = (field: string, value: string, insId: string) => {
    setEditTallerField(field); setEditTallerVal(value); setTallerEditId(insId)
  }

  const cancelTallerEdit = () => {
    setEditTallerField(null); setEditTallerVal(""); setTallerEditId(null)
  }

  const [confirmAction, setConfirmAction] = useState<{ type: "aprobar" | "rechazar"; id: string; origen?: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [expandedComprobante, setExpandedComprobante] = useState(false)
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null)
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
  const [searchCursoQuery, setSearchCursoQuery] = useState("")

  const getCursoNombre = useCallback(() => {
    if (!selected?.curso?.id) return selected?.curso?.nombre || "—"
    const found = cursosAbiertosList.find((c: any) => c.id === selected.curso.id) as any
    return found?.nombre || selected.curso?.nombre || "—"
  }, [selected, cursosAbiertosList])

  const filteredCursosAbiertos = useMemo(() => {
    if (!searchCursoQuery.trim()) return cursosAbiertosList
    const query = searchCursoQuery.toLowerCase()
    return cursosAbiertosList.filter((c: any) => {
      const nombre = (c.nombre || c.id || "").toLowerCase()
      return nombre.includes(query)
    })
  }, [cursosAbiertosList, searchCursoQuery])

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
      const res = await cursosService.getSolicitudesInscripcion({ per_page: 200 })
      setSolicitudes(((res as Record<string, unknown>).data as Record<string, unknown>[]) || [])
    } catch { toast.error("Error al cargar solicitudes") }
    finally { setLoading(false) }
  }

  const cargarTallerInscripciones = async () => {
    setLoadingTalleres(true)
    try {
      const res = await tallerService.listarInscripcionesPendientes({ per_page: 200 })
      setTallerInscripciones((res as any).data || [])
    } catch { setTallerInscripciones([]) }
    finally { setLoadingTalleres(false) }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (mainTab === "talleres") {
      cargarTallerInscripciones()
    } else {
      cargarSolicitudes()
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [mainTab])

  useEffect(() => {
    if (mainTab !== "talleres" && statusFilter === "aprobados") {
      cursosService.getCatalogos().then(res => setCatalogosFiltro(res.data || [])).catch(() => {})
    }
  }, [mainTab, statusFilter])

  const tallerAgrupadas = useMemo(() => {
    if (mainTab !== "talleres") return null
    const filtradas = tallerInscripciones.filter(ins => {
      if (statusFilter === "pendientes") return ins.estado === "activo" && !ins.pago_verificado
      if (statusFilter === "aprobados") return ins.pago_verificado
      if (statusFilter === "rechazados") return ins.estado === "retirado"
      return true
    })
    const grupos: { dateKey: string; label: string; items: any[] }[] = []
    const map = new Map<string, any[]>()
    for (const s of filtradas) {
      const rawDate = s.fecha_inscripcion || s.created_at
      if (!rawDate) continue
      const d = new Date(rawDate)
      if (isNaN(d.getTime())) continue
      const key = d.toISOString().slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    for (const [key, items] of map) {
      const d = new Date(key)
      const label = `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`
      grupos.push({ dateKey: key, label, items })
    }
    grupos.sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    return grupos
  }, [tallerInscripciones, statusFilter, mainTab])

  const viewDetail = async (id: string) => {
    if (selectedId === id) { setSelectedId(null); setSelected(null); return }
    setSelectedId(id)
    setLoadingDetail(true)
    setExpandedComprobante(false)
    try {
      const detalle = await cursosService.getSolicitudInscripcionById(id)
      setSelected(detalle)
      if (cursosAbiertosList.length === 0) loadCursosAbiertos()
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
      const data: any = {}
      data[editField] = editVal
      await cursosService.actualizarEstudiante(selectedId, data)
      setSelected((prev: any) => {
        if (!prev) return prev
        const updated = { ...prev }
        if (updated.solicitante?.datos) {
          const datos = { ...updated.solicitante.datos }
          if (datos.perfil_estudiante) {
            datos.perfil_estudiante = { ...datos.perfil_estudiante, [editField]: editVal }
          } else {
            datos[editField] = editVal
          }
          updated.solicitante = { ...updated.solicitante, datos }
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
      setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, cedula_url: res.data.data.cedula_url } } }))
      toast.success("Cédula subida")
    } catch { toast.error("Error al subir cédula") }
    finally { setUploadingCedula(false) }
  }

  const savePagoEdit = async () => {
    if (!selectedId || !editPagoField) return
    setSavingPagoEdit(true)
    try {
      const data: any = {}
      let autoTipo: string | null = null
      if (editPagoField === "pago_monto") {
        const monto = parseFloat(editPagoVal)
        data.monto_solicitado = monto
        const precioBase = selected?.curso?.precio_base
        if (precioBase) {
          autoTipo = monto >= precioBase ? "completo" : "abono"
          data.tipo_pago = autoTipo
        }
      } else if (editPagoField === "pago_fecha") {
        data.fecha_pago_declarada = editPagoVal
      } else if (editPagoField === "pago_comprobante") {
        data.tipo_comprobante = editPagoVal
      } else {
        data.tipo_pago = editPagoVal
      }
      await cursosService.actualizarPago(selectedId, data)
      setSelected((prev: any) => {
        if (!prev?.pago) return prev
        const updated = { ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago.comprobante } } }
        if (editPagoField === "pago_monto") {
          updated.pago.monto_solicitado = parseFloat(editPagoVal)
          if (autoTipo) {
            updated.pago.tipo_pago = autoTipo
            updated.pago.comprobante.tipo = autoTipo
          }
        } else if (editPagoField === "pago_fecha") {
          updated.pago.comprobante.fecha_pago_declarada = editPagoVal
        } else if (editPagoField === "pago_comprobante") {
          updated.pago.comprobante.tipo = editPagoVal
        } else {
          updated.pago.tipo_pago = editPagoVal
          updated.pago.comprobante.tipo = editPagoVal
        }
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
      const selectedCurso = cursosAbiertosList.find((c: any) => c.id === editCursoVal)
      const cursoNombre = selectedCurso?.nombre_instancia || selectedCurso?.catalogo?.nombre || editCursoVal
      setSelected((prev: any) => {
        if (!prev) return prev
        return { ...prev, curso: { ...prev.curso, nombre: cursoNombre, id: editCursoVal } }
      })
      toast.success("Curso actualizado")
      setEditCursoField(null); setEditCursoVal("")
      await cargarSolicitudes()
      await refreshDetail()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al guardar curso")
    } finally {
      setSavingCursoEdit(false)
    }
  }

  const loadCursosAbiertos = async () => {
    try {
      const res = await cursosService.getCursos({ per_page: 100 }, 1)
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
      setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, url: res.data.data.comprobante_url } } }))
      toast.success("Comprobante subido")
    } catch { toast.error("Error al subir comprobante") }
    finally { setUploadingComprobante(false) }
  }

  const handleApprove = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    try {
      if (confirmAction.origen === "taller") {
        await tallerService.verificarPago(confirmAction.id)
        toast.success("Pago de taller verificado correctamente")
        setConfirmAction(null)
        cargarTallerInscripciones()
        return
      }

      await cursosService.aprobarSolicitudInscripcion(confirmAction.id)

      // Auto-registrar pago aprobado
      if (selected?.pago?.monto_solicitado) {
        try {
          const cuentasRes = await financeService.getCuentas({ per_page: 100 })
          const cuentas: any[] = cuentasRes.data || []
          const cuenta = cuentas.find((c: any) =>
            c.solicitud_inscripcion_id === confirmAction.id ||
            c.solicitud_inscripcion?.id === confirmAction.id
          )
          if (cuenta?.id) {
            await financeService.registrarPago({
              cuenta_cobrar_id: cuenta.id,
              monto: Number(selected.pago.monto_solicitado),
              metodo_pago: selected.pago.tipo_pago || "transferencia",
              fecha_pago: selected.pago.comprobante?.fecha_pago_declarada?.split("T")[0] || new Date().toISOString().split("T")[0],
            })
          }
        } catch {
          // No bloquea la aprobación si falla el auto-registro de pago
        }
      }

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
      if (confirmAction.origen === "taller") {
        await tallerService.cambiarEstadoInscripcion(confirmAction.id, "retirado")
        toast.success("Inscripción a taller rechazada")
        setConfirmAction(null)
        cargarTallerInscripciones()
        return
      }

      await cursosService.rechazarSolicitudInscripcion(confirmAction.id, motivo)
      toast.success("Solicitud rechazada")
      setConfirmAction(null); setSelectedId(null); setSelected(null)
      cargarSolicitudes()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al rechazar")
    } finally { setActionLoading(false) }
  }

  const solicitudesFiltradas = useMemo(() => {
    if (mainTab === "talleres") return []

    const categoria = mainTab === "cursos" ? "regular" : "personalizado"
    let items = solicitudes.filter(s => s.curso_abierto?.catalogo?.categoria === categoria)

    items = items.filter(s => {
      if (statusFilter === "pendientes") return s.estado === "pendiente_validacion"
      if (statusFilter === "aprobados") return s.estado === "matricula_creada"
      if (statusFilter === "rechazados") return s.estado === "rechazado"
      return true
    })

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      items = items.filter(s => {
        const nombre = s.estudiante?.nombres || s.participante_externo?.nombres || ""
        const apellido = s.estudiante?.apellidos || s.participante_externo?.apellidos || ""
        const curso = s.curso_abierto?.catalogo?.nombre || ""
        return `${nombre} ${apellido} ${curso}`.toLowerCase().includes(q)
      })
    }

    if (statusFilter === "aprobados") {
      if (filtroCursoId) {
        items = items.filter(s => s.curso_abierto?.catalogo_curso_id === filtroCursoId)
      }
      if (filtroFechaDesde) {
        const desde = new Date(filtroFechaDesde)
        items = items.filter(s => {
          const d = new Date(s.created_at || s.fecha_creacion)
          return !isNaN(d.getTime()) && d >= desde
        })
      }
      if (filtroFechaHasta) {
        const hasta = new Date(filtroFechaHasta)
        hasta.setHours(23, 59, 59, 999)
        items = items.filter(s => {
          const d = new Date(s.created_at || s.fecha_creacion)
          return !isNaN(d.getTime()) && d <= hasta
        })
      }
    }

    return items
  }, [solicitudes, mainTab, statusFilter, searchTerm, filtroCursoId, filtroFechaDesde, filtroFechaHasta])

  const solicitudesAgrupadas = useMemo(() => {
    if (mainTab === "talleres" || statusFilter === "rechazados") return null
    const grupos: { dateKey: string; label: string; items: any[] }[] = []
    const map = new Map<string, any[]>()
    for (const s of solicitudesFiltradas) {
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
    grupos.sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    return grupos
  }, [solicitudesFiltradas, statusFilter, mainTab])

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
                {[{ value: "cursos" as const, label: "Cursos" }, { value: "personalizados" as const, label: "Personalizados" }, { value: "talleres" as const, label: "Talleres" }].map(f => (
                  <button key={f.value} onClick={() => { setMainTab(f.value); setStatusFilter("pendientes"); setFiltroCursoId(""); setFiltroFechaDesde(""); setFiltroFechaHasta("") }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ backgroundColor: mainTab === f.value ? COLORS.CHARCOAL : "transparent", color: mainTab === f.value ? "white" : COLORS.TEXT_MUTED }}>
                    {f.label}
                  </button>
                ))}
              </div>
           </div>

           {/* Secondary status filter */}
           <div className="flex gap-1 rounded-lg border p-0.5 bg-white inline-flex" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
             {[{ value: "pendientes" as const, label: "Pendientes" }, { value: "aprobados" as const, label: "Aprobados" }, { value: "rechazados" as const, label: "Rechazados" }].map(f => (
               <button key={f.value} onClick={() => { setStatusFilter(f.value); setFiltroCursoId(""); setFiltroFechaDesde(""); setFiltroFechaHasta("") }}
                 className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                 style={{
                   backgroundColor: statusFilter === f.value ? COLORS.CHARCOAL : "transparent",
                   color: statusFilter === f.value ? "white" : COLORS.TEXT_MUTED,
                 }}>{f.label}</button>
             ))}
           </div>

           {/* Filtros extra solo para Aprobadas */}
            {mainTab !== "talleres" && statusFilter === "aprobados" && (
              <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
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

            {mainTab === "talleres" ? (
              <div className="space-y-4">
                {loadingTalleres ? (
                  <div className="p-16 text-center" style={{ color: COLORS.TEXT_MUTED }}>Cargando...</div>
                ) : !tallerAgrupadas || tallerAgrupadas.length === 0 ? (
                  <div className="p-16 text-center bg-white rounded-2xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>No hay inscripciones a talleres {statusFilter === "aprobados" ? "verificadas" : statusFilter === "rechazados" ? "rechazadas" : "pendientes"}</p>
                  </div>
                ) : tallerAgrupadas.map(grupo => (
                  <div key={grupo.dateKey}>
                    <div className="flex items-center gap-2 mb-3">
                      <HugeiconsIcon icon={Calendar03Icon} size={14} style={{ color: COLORS.TEXT_MUTED }} />
                      <h3 className="text-sm font-bold capitalize" style={{ color: COLORS.CHARCOAL }}>{grupo.label}</h3>
                      <span className="text-[10px] font-medium opacity-40">{grupo.items.length} inscripción{grupo.items.length !== 1 ? "es" : ""}</span>
                    </div>
                    <div className="space-y-3">
                      {grupo.items.map(ins => (
                         <TallerInscripcionCard key={ins.id} ins={ins}
                           isExpanded={tallerSelectedId === ins.id}
                           puedeVerificar={statusFilter === "pendientes"}
                           editTallerField={editTallerField} editTallerVal={editTallerVal}
                           savingTallerEdit={savingTallerEdit}
                           onToggle={() => setTallerSelectedId(tallerSelectedId === ins.id ? null : ins.id)}
                           onEdit={(f, v) => startTallerEdit(f, v, ins.id)}
                           onChange={setEditTallerVal} onSave={saveTallerEdit}
                           onCancel={cancelTallerEdit}
                           onApprove={() => setConfirmAction({ type: "aprobar", id: ins.id, origen: "taller" })}
                           onReject={() => setConfirmAction({ type: "rechazar", id: ins.id, origen: "taller" })}
                           onExpandImage={setExpandedImageUrl}
                         />
                      ))}
                    </div>
                  </div>
                 ))}
             </div>
           ) : loading ? (
              <div className="p-20 text-center" style={{ color: COLORS.TEXT_MUTED }}>Cargando...</div>
           ) : solicitudesFiltradas.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>No hay solicitudes</p>
            </div>
           ) : statusFilter !== "rechazados" && solicitudesAgrupadas ? (
            <div className="space-y-6">
              {solicitudesAgrupadas.map(grupo => (
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
                        <div key={s.id} className="bg-white rounded-xl border overflow-hidden transition-all"
                          style={{
                            borderColor: isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                            borderLeft: s.curso_abierto?.catalogo?.color ? `3px solid ${s.curso_abierto.catalogo.color}` : undefined,
                          }}>
                          <button onClick={() => viewDetail(s.id)} className="w-full text-left p-5 flex items-center gap-4">
                            <div className="size-12 rounded-lg flex items-center justify-center shrink-0 text-base font-bold"
                              style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`, color: COLORS.ACCENT }}>
                              {(s.estudiante?.nombres || s.participante_externo?.nombres || "?")[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                                {s.estudiante?.nombres || s.participante_externo?.nombres || "—"} {s.estudiante?.apellidos || s.participante_externo?.apellidos || ""}
                              </p>
                              <p className="text-xs truncate mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                                {s.curso_abierto?.nombre_instancia || s.curso_abierto?.catalogo?.nombre || "Sin curso"}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Tag color={COLORS.ACCENT}>${s.monto_solicitado}</Tag>
                                <Tag>{(s.tipo_pago || "").toUpperCase()}</Tag>
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
                                        <InfoItem icon={Calendar03Icon} label="Edad" value={getFieldValue(selected.solicitante?.datos, "edad")} />
                                        <EF icon={UserIcon} label="Ocupación" field="ocupacion" data={selected.solicitante?.datos}
                                          editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                        <EF icon={UserIcon} label="Estado Civil" field="estado_civil" data={selected.solicitante?.datos}
                                          editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                        <EF icon={UserIcon} label="Dirección" field="direccion" data={selected.solicitante?.datos}
                                          editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                        <EF icon={UserIcon} label="Ciudad" field="ciudad" data={selected.solicitante?.datos}
                                          editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                        <EF icon={Calendar03Icon} label="Fecha Nacimiento" field="fecha_nacimiento" data={selected.solicitante?.datos}
                                          editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} inputType="date" />
                                       </div>
                                   </Section>
                                    <Section title="Curso" icon={BookOpenIcon}>
                                      <div className="grid grid-cols-2 gap-3">
                                        {editCursoField === "curso" ? (
                                         <div className="col-span-2 space-y-2.5">
                                           <div className="flex items-center gap-2 text-xs">
                                             <HugeiconsIcon icon={BookOpenIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                             <span style={{ color: COLORS.TEXT_MUTED }}>Buscar y seleccionar curso:</span>
                                           </div>
                                           <input
                                             type="text"
                                             placeholder="Escribe el nombre del curso..."
                                             value={searchCursoQuery}
                                             onChange={e => setSearchCursoQuery(e.target.value)}
                                             className="w-full px-3 py-2 text-xs border rounded-lg outline-none bg-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500"
                                             style={{ borderColor: COLORS.BORDER_SUBTLE }}
                                             disabled={savingCursoEdit}
                                           />
                                           <div className="max-h-40 overflow-y-auto border rounded-lg divide-y bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                             {filteredCursosAbiertos.length === 0 ? (
                                               <div className="p-3 text-xs text-center text-gray-500">No se encontraron cursos</div>
                                             ) : (
                                               filteredCursosAbiertos.map((c: any) => {
                                                 const isSelected = editCursoVal === c.id
                                                 return (
                                                   <button
                                                     key={c.id}
                                                     type="button"
                                                     onClick={() => setEditCursoVal(c.id)}
                                                     className={cn(
                                                       "w-full text-left p-2.5 text-xs flex flex-col gap-0.5 hover:bg-gray-50 transition-colors",
                                                       isSelected && "bg-blue-50/50 hover:bg-blue-50 font-semibold"
                                                     )}
                                                     style={isSelected ? { borderLeft: `3px solid ${COLORS.ACCENT}` } : {}}
                                                   >
                                                     <div className="flex justify-between items-center gap-2">
                                                       <span style={{ color: COLORS.CHARCOAL }}>{c.nombre || c.id}</span>
                                                       {isSelected && <span className="text-[10px] text-blue-600 font-bold shrink-0">Seleccionado</span>}
                                                     </div>
                                                     <div className="flex gap-2 text-[10px] opacity-60">
                                                        {c.semestre && <span>Sem.: {c.semestre}</span>}
                                                        {c.fechaInicio && <span>Inicio: {c.fechaInicio}</span>}
                                                        {c.precioBase && <span>${c.precioBase}</span>}
                                                     </div>
                                                   </button>
                                                 )
                                               })
                                             )}
                                           </div>
                                           <div className="flex gap-2">
                                             <button onClick={saveCursoEdit} disabled={savingCursoEdit} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingCursoEdit ? 0.6 : 1 }}>
                                               {savingCursoEdit ? "Guardando..." : "Confirmar curso"}
                                             </button>
                                             <button onClick={() => { setEditCursoField(null); setEditCursoVal("") }} disabled={savingCursoEdit} className="text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 border" style={{ color: COLORS.TEXT_MUTED, borderColor: COLORS.BORDER_SUBTLE }}>
                                               Cancelar
                                             </button>
                                           </div>
                                         </div>
                                       ) : (
                                         <>
                                           <div className="flex items-center gap-2 text-xs group col-span-2">
                                             <HugeiconsIcon icon={BookOpenIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                             <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">Curso</span>
                                              <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: 700 }}>{getCursoNombre()}</span>
                                             <button onClick={() => { setEditCursoField("curso"); setEditCursoVal(selected.curso?.id || ""); setSearchCursoQuery(""); loadCursosAbiertos() }}
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
                                            <input type="number" step="0.01" value={editPagoVal} onChange={e => setEditPagoVal(e.target.value)} placeholder="0.00"
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
                                             <option value="abono">Abono</option>
                                             <option value="completo">Completo</option>
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
                                            <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: 500 }}>{(selected.pago?.tipo_pago || "—").toUpperCase()}</span>
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
                                        {editPagoField === "pago_comprobante" ? (
                                          <div className="flex items-center gap-2 col-span-2">
                                            <HugeiconsIcon icon={PaymentIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                            <span className="shrink-0 text-xs" style={{ color: COLORS.TEXT_MUTED }}>Comprobante:</span>
                                            <select value={editPagoVal} onChange={e => setEditPagoVal(e.target.value)}
                                              className="flex-1 px-2 py-1.5 text-xs border rounded-lg outline-none bg-white" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={savingPagoEdit}>
                                              <option value="transferencia">Transferencia / Depósito</option>
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
                                            <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">Comprobante</span>
                                            <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: 500 }}>{(selected.pago?.comprobante?.tipo || "—").toUpperCase()}</span>
                                            <button onClick={() => { setEditPagoField("pago_comprobante"); setEditPagoVal(selected.pago?.comprobante?.tipo || "") }}
                                              className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                                              <HugeiconsIcon icon={Edit01Icon} size={14} />
                                            </button>
                                          </div>
                                        )}
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
                                          <div className="rounded-xl border overflow-hidden bg-gray-50 cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                            <img src={fixImageUrl(selected.pago.comprobante.url)} alt="Comprobante"
                                              className="w-full object-contain max-h-[400px]"
                                              onClick={() => setExpandedImageUrl(fixImageUrl(selected.pago.comprobante.url))} />
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
                                            className="w-full object-contain max-h-[400px] rounded-xl border cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}
                                            onClick={() => setExpandedImageUrl(fixImageUrl(selected.pago.comprobante.cedula_url))} />
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
              {solicitudesFiltradas.map(s => {
                const isSelected = selectedId === s.id
                return (
                    <div key={s.id} className="bg-white rounded-xl border overflow-hidden transition-all"
                      style={{
                        borderColor: isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                        borderLeft: s.curso_abierto?.catalogo?.color ? `3px solid ${s.curso_abierto.catalogo.color}` : undefined,
                      }}>
                      <button onClick={() => viewDetail(s.id)} className="w-full text-left p-5 flex items-center gap-4">
                        <div className="size-12 rounded-lg flex items-center justify-center shrink-0 text-base font-bold"
                          style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`, color: COLORS.ACCENT }}>
                          {(s.estudiante?.nombres || s.participante_externo?.nombres || "?")[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                            {s.estudiante?.nombres || s.participante_externo?.nombres || "—"} {s.estudiante?.apellidos || s.participante_externo?.apellidos || ""}
                          </p>
                          <p className="text-xs truncate mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                            {s.curso_abierto?.nombre_instancia || s.curso_abierto?.catalogo?.nombre || "Sin curso"}
                          </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Tag color={COLORS.ACCENT}>${s.monto_solicitado}</Tag>
                          <Tag>{(s.tipo_pago || "").toUpperCase()}</Tag>
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
                                    <InfoItem icon={Calendar03Icon} label="Edad" value={getFieldValue(selected.solicitante?.datos, "edad")} />
                                    <EF icon={UserIcon} label="Ocupación" field="ocupacion" data={selected.solicitante?.datos}
                                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                    <EF icon={UserIcon} label="Estado Civil" field="estado_civil" data={selected.solicitante?.datos}
                                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                    <EF icon={UserIcon} label="Dirección" field="direccion" data={selected.solicitante?.datos}
                                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                    <EF icon={UserIcon} label="Ciudad" field="ciudad" data={selected.solicitante?.datos}
                                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
                                    <EF icon={Calendar03Icon} label="Fecha Nacimiento" field="fecha_nacimiento" data={selected.solicitante?.datos}
                                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} inputType="date" />
                                 </div>
                              </Section>

                               <Section title="Curso" icon={BookOpenIcon}>
                                 <div className="grid grid-cols-2 gap-3">
                                   {editCursoField === "curso" ? (
                                    <div className="col-span-2 space-y-2.5">
                                      <div className="flex items-center gap-2 text-xs">
                                        <HugeiconsIcon icon={BookOpenIcon} size={13} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                                        <span style={{ color: COLORS.TEXT_MUTED }}>Buscar y seleccionar curso:</span>
                                      </div>
                                      <input
                                        type="text"
                                        placeholder="Escribe el nombre del curso..."
                                        value={searchCursoQuery}
                                        onChange={e => setSearchCursoQuery(e.target.value)}
                                        className="w-full px-3 py-2 text-xs border rounded-lg outline-none bg-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500"
                                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                                        disabled={savingCursoEdit}
                                      />
                                      <div className="max-h-40 overflow-y-auto border rounded-lg divide-y bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                        {filteredCursosAbiertos.length === 0 ? (
                                          <div className="p-3 text-xs text-center text-gray-500">No se encontraron cursos</div>
                                        ) : (
                                          filteredCursosAbiertos.map((c: any) => {
                                            const isSelected = editCursoVal === c.id
                                            return (
                                              <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => setEditCursoVal(c.id)}
                                                className={cn(
                                                  "w-full text-left p-2.5 text-xs flex flex-col gap-0.5 hover:bg-gray-50 transition-colors",
                                                  isSelected && "bg-blue-50/50 hover:bg-blue-50 font-semibold"
                                                )}
                                                style={isSelected ? { borderLeft: `3px solid ${COLORS.ACCENT}` } : {}}
                                              >
                                                <div className="flex justify-between items-center gap-2">
                                                  <span style={{ color: COLORS.CHARCOAL }}>{c.nombre || c.id}</span>
                                                  {isSelected && <span className="text-[10px] text-blue-600 font-bold shrink-0">Seleccionado</span>}
                                                </div>
                                                <div className="flex gap-2 text-[10px] opacity-60">
                                                  {c.semestre && <span>Sem.: {c.semestre}</span>}
                                                  {c.fecha_inicio && <span>Inicio: {c.fecha_inicio.split("T")[0]}</span>}
                                                  {c.precio_base && <span>${c.precio_base}</span>}
                                                </div>
                                              </button>
                                            )
                                          })
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        <button onClick={saveCursoEdit} disabled={savingCursoEdit} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingCursoEdit ? 0.6 : 1 }}>
                                          {savingCursoEdit ? "Guardando..." : "Confirmar curso"}
                                        </button>
                                        <button onClick={() => { setEditCursoField(null); setEditCursoVal("") }} disabled={savingCursoEdit} className="text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 border" style={{ color: COLORS.TEXT_MUTED, borderColor: COLORS.BORDER_SUBTLE }}>
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
                                        <button onClick={() => { setEditCursoField("curso"); setEditCursoVal(selected.curso?.id || ""); setSearchCursoQuery(""); loadCursosAbiertos() }}
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
                                      <input type="number" step="0.01" value={editPagoVal} onChange={e => setEditPagoVal(e.target.value)} placeholder="0.00"
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
                                      <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: 500 }}>{(selected.pago?.tipo_pago || "—").toUpperCase()}</span>
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
                                  <InfoItem icon={PaymentIcon} label="Comprobante" value={(selected.pago?.comprobante?.tipo || "—").toUpperCase()} />
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
                                    <div className="rounded-xl border overflow-hidden bg-gray-50 cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                      <img src={fixImageUrl(selected.pago.comprobante.url)} alt="Comprobante"
                                        className="w-full object-contain max-h-[400px]"
                                        onClick={() => setExpandedImageUrl(fixImageUrl(selected.pago.comprobante.url))} />
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
                                       className="w-full object-contain max-h-[400px] rounded-xl border cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}
                                       onClick={() => setExpandedImageUrl(fixImageUrl(selected.pago.comprobante.cedula_url))} />
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

      {expandedImageUrl && (
        <ImageZoom url={expandedImageUrl} onClose={() => setExpandedImageUrl(null)} />
      )}

      <ConfirmationModal
        isOpen={confirmAction?.type === "aprobar" && !!confirmAction}
        title={confirmAction?.origen === "taller" ? "Verificar Pago de Taller" : "Aprobar Matrícula"}
        message={confirmAction?.origen === "taller" ? "Se confirmará el pago del participante en el taller." : "Se creará la matrícula del estudiante."}
        confirmText={confirmAction?.origen === "taller" ? "Verificar Pago" : "Aprobar"}
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

function TallerInscripcionCard({ ins, isExpanded, puedeVerificar, editTallerField, editTallerVal, savingTallerEdit, onToggle, onEdit, onChange, onSave, onCancel, onApprove, onReject, onExpandImage }: {
  ins: any; isExpanded: boolean; puedeVerificar: boolean
  editTallerField: string | null; editTallerVal: string; savingTallerEdit: boolean
  onToggle: () => void; onEdit: (f: string, v: string) => void; onChange: (v: string) => void
  onSave: () => void; onCancel: () => void; onApprove: () => void; onReject: () => void
  onExpandImage?: (url: string) => void
}) {
  const cedulaRef = useRef<HTMLInputElement>(null)
  const comprobanteRef = useRef<HTMLInputElement>(null)
  const [uploadingCedula, setUploadingCedula] = useState(false)
  const [uploadingComprobante, setUploadingComprobante] = useState(false)
  const [expandedComprobante, setExpandedComprobante] = useState(false)

  const [, forceUpdate] = useState(0)

  const handleUploadCedula = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCedula(true)
    try {
      await tallerService.subirCedula(ins.id, file)
      toast.success("Cédula subida")
      forceUpdate(n => n + 1)
    } catch { toast.error("Error al subir cédula") }
    finally { setUploadingCedula(false) }
  }

  const handleUploadComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingComprobante(true)
    try {
      await tallerService.subirComprobante(ins.id, file)
      toast.success("Comprobante subido")
      forceUpdate(n => n + 1)
    } catch { toast.error("Error al subir comprobante") }
    finally { setUploadingComprobante(false) }
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : "—"

  return (
    <div className="bg-white rounded-2xl border overflow-hidden transition-all"
      style={{ borderColor: isExpanded ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, borderLeft: `3px solid ${COLORS.ACCENT}` }}>
      <button onClick={onToggle} className="w-full text-left p-5 flex items-center gap-4">
        <div className="size-12 rounded-xl flex items-center justify-center shrink-0 text-base font-bold"
          style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`, color: COLORS.ACCENT }}>
          {(ins.nombres || "?")[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{ins.nombres} {ins.apellidos}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
            {ins.cedula} · {ins.correo} · {ins.taller?.nombre || "Taller"}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Tag color={COLORS.ACCENT}>${Number(ins.monto_pagado || 0).toFixed(2)}</Tag>
            <Tag>{ins.tipo_pago}</Tag>
            <Tag color={ins.pago_verificado ? "oklch(0.50 0.10 140)" : "oklch(0.55 0.12 90)"}>
              {ins.pago_verificado ? "Pagado" : "Pendiente"}
            </Tag>
          </div>
        </div>
        <HugeiconsIcon icon={isExpanded ? Cancel01Icon : CheckmarkCircle04Icon} size={18}
          style={{ color: isExpanded ? COLORS.TEXT_MUTED : COLORS.ACCENT }} />
      </button>
      {isExpanded && (
        <div className="border-t px-5 py-5 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE, background: "oklch(0.985 0 0)" }}>
          <Section title="Datos del Participante" icon={UserIcon}>
            <div className="grid grid-cols-2 gap-3">
              <EF icon={UserIcon} label="Nombres" field="nombres" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
              <EF icon={UserIcon} label="Apellidos" field="apellidos" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
              <EF icon={SearchIcon} label="Cédula" field="cedula" data={ins} bold
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
              <EF icon={MailIcon} label="Correo" field="correo" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
              <EF icon={CallIcon} label="Teléfono" field="telefono" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
              <EF icon={UserIcon} label="Ocupación" field="ocupacion" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
               <EF icon={UserIcon} label="Dirección" field="direccion" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
               <InfoItem icon={UserIcon} label="Ciudad" value={ins.ciudad || "—"} />
              <EF icon={UserIcon} label="Estado Civil" field="estado_civil" data={ins}
                editField={editTallerField} editVal={editTallerVal}
                onEdit={onEdit} onChange={onChange} onSave={onSave} onCancel={onCancel} saving={savingTallerEdit} />
              <InfoItem icon={Calendar03Icon} label="Fecha Nacimiento" value={formatDate(ins.fecha_nacimiento)} />
              <InfoItem icon={Calendar03Icon} label="Edad" value={ins.edad ? `${ins.edad} años` : "—"} />
            </div>
          </Section>
          <Section title="Taller" icon={BookOpenIcon}>
            <InfoItem icon={BookOpenIcon} label="Taller" value={ins.taller?.nombre || "—"} bold />
            <InfoItem icon={CalendarIcon} label="Fecha" value={ins.taller?.fecha ? new Date(ins.taller.fecha).toLocaleDateString('es-ES') : "—"} />
            <InfoItem icon={PaymentIcon} label="Precio" value={ins.taller?.precio ? `$${Number(ins.taller.precio).toFixed(2)}` : "—"} bold />
          </Section>
          <Section title="Pago" icon={PaymentIcon}>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem icon={PaymentIcon} label="Monto" value={`$${Number(ins.monto_pagado || 0).toFixed(2)}`} bold />
              <InfoItem icon={PaymentIcon} label="Tipo" value={ins.tipo_pago || "—"} />
              <InfoItem icon={CalendarIcon} label="Fecha de Pago" value={formatDate(ins.fecha_pago)} />
              <InfoItem icon={PaymentIcon} label="Método" value={ins.metodo_pago || "—"} />
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input ref={comprobanteRef} type="file" accept="image/*" className="hidden" onChange={handleUploadComprobante} />
                <button onClick={() => comprobanteRef.current?.click()} disabled={uploadingComprobante}
                  className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold hover:bg-white transition-colors"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT, opacity: uploadingComprobante ? 0.6 : 1 }}>
                  <HugeiconsIcon icon={Upload05Icon} size={16} />
                  {uploadingComprobante ? "Subiendo..." : ins.comprobante_url ? "Cambiar comprobante" : "Subir comprobante"}
                </button>
                {ins.comprobante_url && (
                  <button onClick={() => setExpandedComprobante(!expandedComprobante)}
                    className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold hover:bg-white transition-colors"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={Image01Icon} size={16} />
                    {expandedComprobante ? "Ocultar" : "Ver"}
                  </button>
                )}
              </div>
              {expandedComprobante && ins.comprobante_url && (
                <div className="rounded-xl border overflow-hidden bg-gray-50 cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <img src={fixImageUrl(ins.comprobante_url)} alt="Comprobante" className="w-full object-contain max-h-[400px]"
                    onClick={() => onExpandImage?.(fixImageUrl(ins.comprobante_url))} />
                </div>
              )}
            </div>
          </Section>
          <Section title="Documento de Identidad" icon={Image01Icon}>
            {ins.cedula_url ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium opacity-40">Imagen actual</span>
                  <button onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
                    className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={Edit01Icon} size={12} />Cambiar
                  </button>
                </div>
                <img src={fixImageUrl(ins.cedula_url)} alt="Cédula" className="w-full object-contain max-h-[400px] rounded-xl border cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  onClick={() => onExpandImage?.(fixImageUrl(ins.cedula_url))} />
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
          {puedeVerificar && (
            <div className="flex gap-3 pt-3">
              <button onClick={onReject}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-red-50 active:scale-[0.97]"
                style={{ borderColor: "oklch(0.50 0.15 10 / 0.3)", color: "oklch(0.50 0.15 10)" }}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} className="inline mr-1.5" />Rechazar
              </button>
              <button onClick={onApprove}
                className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
                style={{ backgroundColor: COLORS.ACCENT }}>
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />Verificar Pago
              </button>
            </div>
          )}
        </div>
      )}
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
    <div className="flex items-center gap-2 text-sm">
      <HugeiconsIcon icon={icon} size={14} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
      <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">{label}</span>
      <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  )
}

function EF({ icon, label, field, data, editField, editVal, onEdit, onChange, onSave, onCancel, bold, saving, inputType }: {
  icon: any; label: string; field: string; data: any
  editField: string | null; editVal: string
  onEdit: (f: string, v: string) => void; onChange: (v: string) => void; onSave: () => void; onCancel: () => void
  bold?: boolean; saving?: boolean; inputType?: string
}) {
  const raw = data?.perfil_estudiante?.[field] ?? data?.[field]
  const value = raw ?? "—"
  if (editField === field) {
    return (
      <div className="flex items-center gap-2 col-span-2">
        <HugeiconsIcon icon={icon} size={14} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
        <span className="shrink-0 text-sm" style={{ color: COLORS.TEXT_MUTED }}>{label}:</span>
        <input type={inputType || "text"} value={editVal} onChange={e => onChange(e.target.value)} placeholder={`Ingrese ${label.toLowerCase()}`}
          className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none bg-white shadow-sm focus:ring-2 focus:ring-blue-200 transition-shadow" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={saving} />
        <button onClick={onSave} disabled={saving} className="text-xs font-medium px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: saving ? 0.6 : 1 }}>
          {saving ? "..." : "Guardar"}
        </button>
        <button onClick={onCancel} disabled={saving} className="text-xs px-3 py-2 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED, opacity: saving ? 0.6 : 1 }}>
          Cancelar
        </button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-sm group">
      <HugeiconsIcon icon={icon} size={14} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
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
    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
      style={{ backgroundColor: color ? `color-mix(in srgb, ${color} 12%, transparent)` : "oklch(0.96 0 0)", color: color || COLORS.TEXT_MUTED }}>
      {children}
    </span>
  )
}

function getFieldValue(datos: any, field: string): string {
  if (!datos) return "—"
  const val = datos.perfil_estudiante?.[field] ?? datos[field]
  if (field === "edad" && val != null) return `${val} años`
  return val ?? "—"
}

function fixImageUrl(url: string): string {
  if (!url) return url
  return url.replace(/^https?:\/\/localhost(?::\d+)?/, "")
}
