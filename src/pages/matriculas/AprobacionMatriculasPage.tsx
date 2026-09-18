/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle04Icon,
  SearchIcon,
  FilterIcon,
  Calendar03Icon,
  Delete01Icon,
  Cancel01Icon,
  Clock01Icon,
  GraduationCapIcon,
  Alert02Icon,
} from "@hugeicons/core-free-icons"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { cursosService, type CatalogoCurso } from "@/services/cursos.service"
import { tallerService } from "@/services/taller.service"
import { CiudadBadge, ModalidadBadge } from "../estudiantes/components/Badges"
import { toast } from "sonner"

function getInitials(nombres?: string, apellidos?: string): string {
  const n = (nombres || "").trim()
  const a = (apellidos || "").trim()
  const first = n ? n[0] : ""
  const second = a ? a[0] : (n.length > 1 ? n[1] : "")
  return (first + second).toUpperCase() || "?"
}

function getRelativeDateLabel(dateStr: string): { label: string; badge?: string } {
  if (!dateStr) return { label: "Fecha no especificada" }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { label: "Fecha no especificada" }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffTime = today.getTime() - itemDate.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

  const fullLabel = `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`

  if (diffDays === 0) {
    return { label: fullLabel, badge: "Hoy" }
  } else if (diffDays === 1) {
    return { label: fullLabel, badge: "Ayer" }
  } else {
    return { label: fullLabel }
  }
}

export function AprobacionMatriculasPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [mainTab, setMainTab] = useState<"cursos" | "personalizados" | "talleres">(() => {
    const tab = searchParams.get("tab")
    return tab === "personalizados" || tab === "talleres" ? tab : "cursos"
  })

  const [statusFilter, setStatusFilter] = useState<"todos" | "pendientes" | "aprobados" | "rechazados">(() => {
    const status = searchParams.get("status")
    return status === "todos" || status === "aprobados" || status === "rechazados" ? status : "pendientes"
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [filtroProgramaId, setFiltroProgramaId] = useState("")
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("")
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("")

  const [catalogosFiltro, setCatalogosFiltro] = useState<CatalogoCurso[]>([])
  const [talleresFiltro, setTalleresFiltro] = useState<any[]>([])

  const [ventanaActual, setVentanaActual] = useState(1)
  const [tallerVentanaActual, setTallerVentanaActual] = useState(1)

  // Reject Modal State
  const [rejectTarget, setRejectTarget] = useState<{
    id: string
    nombre: string
    programa: string
    origen: "curso" | "taller"
  } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectLoading, setRejectLoading] = useState(false)

  // Permanent Delete Modal State (for rejected records)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string; origen: "curso" | "taller" } | null>(null)
  const [deletingRejected, setDeletingRejected] = useState(false)

  // Synchronize URL parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (mainTab !== "cursos") params.set("tab", mainTab)
    if (statusFilter !== "pendientes") params.set("status", statusFilter)
    setSearchParams(params, { replace: true })
  }, [mainTab, statusFilter, setSearchParams])

  // Reset pagination on tab changes
  useEffect(() => {
    if (mainTab === "talleres") setTallerVentanaActual(1)
    else setVentanaActual(1)
    setFiltroProgramaId("")
  }, [mainTab])

  // Fetch filter options for courses or workshops
  useEffect(() => {
    if (mainTab === "talleres") {
      tallerService.listar({ per_page: 100 })
        .then((res: any) => setTalleresFiltro(res.data || res.datos || []))
        .catch(() => {})
    } else {
      cursosService.getCatalogos()
        .then((res: any) => setCatalogosFiltro(res.data || []))
        .catch(() => {})
    }
  }, [mainTab])

  // Queries for Solicitudes (Cursos / Personalizados)
  const estadoSolicitud = statusFilter === "todos"
    ? undefined
    : statusFilter === "pendientes"
      ? "pendiente_validacion"
      : statusFilter === "aprobados"
        ? "matricula_creada"
        : "rechazado"

  const categoria = mainTab === "cursos" ? "regular" : "personalizado"

  const solicitudesQuery = useQuery({
    queryKey: [
      "solicitudes-inscripcion",
      categoria,
      estadoSolicitud,
      searchTerm,
      filtroProgramaId,
      filtroFechaDesde,
      filtroFechaHasta,
      ventanaActual,
    ],
    queryFn: () => cursosService.getSolicitudesInscripcion({
      per_page: 20,
      page: ventanaActual,
      estado: estadoSolicitud,
      categoria,
      search: searchTerm || undefined,
      curso_abierto_id: filtroProgramaId || undefined,
      fecha_desde: filtroFechaDesde || undefined,
      fecha_hasta: filtroFechaHasta || undefined,
    } as Record<string, string | number | undefined>),
    enabled: mainTab !== "talleres",
    placeholderData: previous => previous,
  })

  // Queries for Talleres
  const talleresParams = useMemo(() => {
    if (statusFilter === "todos") return {}
    if (statusFilter === "pendientes") return { estado: "activo", pago_verificado: "false" }
    if (statusFilter === "aprobados") return { pago_verificado: "true" }
    return { estado: "retirado" }
  }, [statusFilter])

  const talleresQuery = useQuery({
    queryKey: [
      "talleres-inscripciones-pendientes",
      talleresParams,
      searchTerm,
      filtroProgramaId,
      filtroFechaDesde,
      filtroFechaHasta,
      tallerVentanaActual,
    ],
    queryFn: () => tallerService.listarInscripcionesPendientes({
      per_page: 20,
      page: tallerVentanaActual,
      search: searchTerm || undefined,
      taller_id: filtroProgramaId || undefined,
      fecha_desde: filtroFechaDesde || undefined,
      fecha_hasta: filtroFechaHasta || undefined,
      ...talleresParams,
    }),
    enabled: mainTab === "talleres",
    placeholderData: previous => previous,
  })

  // Lightweight queries for Category Tab Badges (pending counts)
  const cursosCountQuery = useQuery({
    queryKey: ["count-cursos-pendientes"],
    queryFn: () => cursosService.getSolicitudesInscripcion({ categoria: "regular", estado: "pendiente_validacion", per_page: 1 }),
    staleTime: 60 * 1000,
  })
  const personalizadosCountQuery = useQuery({
    queryKey: ["count-personalizados-pendientes"],
    queryFn: () => cursosService.getSolicitudesInscripcion({ categoria: "personalizado", estado: "pendiente_validacion", per_page: 1 }),
    staleTime: 60 * 1000,
  })
  const talleresCountQuery = useQuery({
    queryKey: ["count-talleres-pendientes"],
    queryFn: () => tallerService.listarInscripcionesPendientes({ estado: "activo", pago_verificado: "false", per_page: 1 }),
    staleTime: 60 * 1000,
  })

  const countCursos = (cursosCountQuery.data as any)?.meta?.total ?? 0
  const countPersonalizados = (personalizadosCountQuery.data as any)?.meta?.total ?? 0
  const countTalleres = (talleresCountQuery.data as any)?.total ?? (talleresCountQuery.data as any)?.meta?.total ?? 0

  // Solicitudes data & stats
  const solicitudesRaw: any[] = useMemo(() => {
    return ((solicitudesQuery.data as Record<string, unknown> | undefined)?.data as any[]) ?? []
  }, [solicitudesQuery.data])

  const tallerInscripcionesRaw: any[] = useMemo(() => {
    const response = talleresQuery.data as Record<string, unknown> | undefined
    return (response?.data || response?.datos || []) as any[]
  }, [talleresQuery.data])

  const solicitudesStats = (solicitudesQuery.data as any)?.stats ?? { todos: 0, pendientes: 0, aprobados: 0, rechazados: 0 }
  const talleresStats = (talleresQuery.data as any)?.stats ?? { todos: 0, pendientes: 0, aprobados: 0, rechazados: 0 }
  const activeStats = mainTab === "talleres" ? talleresStats : solicitudesStats

  const loading = mainTab === "talleres" ? talleresQuery.isLoading : solicitudesQuery.isLoading
  const isError = mainTab === "talleres" ? talleresQuery.isError : solicitudesQuery.isError

  const solicitudesMeta = ((solicitudesQuery.data as Record<string, unknown> | undefined)?.meta ?? {}) as { total?: number; last_page?: number }
  const talleresMeta = ((talleresQuery.data as Record<string, unknown> | undefined)?.meta ?? (talleresQuery.data as any) ?? {}) as { total?: number; last_page?: number }
interface SolicitudItem {
  id: string
  nombres: string
  apellidos: string
  correo: string
  programaNombre: string
  categoriaLabel: string
  modalidad: string
  ciudad: string
  estado: string
  isPendiente: boolean
  isAprobado: boolean
  isRechazado: boolean
  fecha: string
  validador: string
  motivo_rechazo: string
  origen: "curso" | "taller"
  color?: string
}

  const totalVentanas = solicitudesMeta.last_page || 1
  const tallerTotalVentanas = talleresMeta.last_page || 1

  // Map unified items based on active tab
  const unifiedItems: SolicitudItem[] = useMemo(() => {
    if (mainTab === "talleres") {
      return tallerInscripcionesRaw.map((ins: any): SolicitudItem => {
        const isAprobado = Boolean(ins.pago_verificado)
        const isRechazado = ins.estado === "retirado"
        const isPendiente = !isAprobado && !isRechazado
        const estadoFinal = isRechazado ? "rechazado" : (isAprobado ? "matricula_creada" : "pendiente_validacion")

        return {
          id: ins.id,
          nombres: ins.nombres || "—",
          apellidos: ins.apellidos || "",
          correo: ins.correo || "",
          programaNombre: ins.taller?.nombre || "Taller",
          categoriaLabel: "Taller",
          modalidad: ins.taller?.modalidad ? (ins.taller.modalidad.charAt(0).toUpperCase() + ins.taller.modalidad.slice(1)) : "Presencial",
          ciudad: ins.taller?.ciudad?.nombre || ins.ciudad || "",
          estado: estadoFinal,
          isPendiente,
          isAprobado,
          isRechazado,
          fecha: ins.fecha_inscripcion || ins.created_at,
          validador: "",
          motivo_rechazo: ins.observaciones || "",
          origen: "taller",
          color: undefined,
        }
      })
    }

    return solicitudesRaw.map((s: any): SolicitudItem => {
      const isAprobado = s.estado === "matricula_creada" || s.estado === "aprobado"
      const isRechazado = s.estado === "rechazado"
      const isPendiente = s.estado === "pendiente_validacion" || s.estado === "registrado"
      const cat = s.curso_abierto?.es_personalizado === true ? "Personalizado" : "Curso"
      const mod = s.curso_abierto?.modalidad ? (s.curso_abierto.modalidad.charAt(0).toUpperCase() + s.curso_abierto.modalidad.slice(1)) : "Presencial"
      const ciudad = s.curso_abierto?.ciudad?.nombre || s.participante_externo?.ciudad || ""

      return {
        id: s.id,
        nombres: s.estudiante?.nombres || s.participante_externo?.nombres || "—",
        apellidos: s.estudiante?.apellidos || s.participante_externo?.apellidos || "",
        correo: s.estudiante?.correo || s.participante_externo?.correo || "",
        programaNombre: s.curso_abierto?.nombre_instancia || s.curso_abierto?.catalogo?.nombre || "Curso",
        categoriaLabel: cat,
        modalidad: mod,
        ciudad,
        estado: s.estado,
        isPendiente,
        isAprobado,
        isRechazado,
        fecha: s.created_at || s.fecha_creacion,
        validador: s.validador ? `${s.validador.nombres} ${s.validador.apellidos}` : "",
        motivo_rechazo: s.motivo_rechazo || "",
        origen: "curso",
        color: s.curso_abierto?.catalogo?.color,
      }
    })
  }, [mainTab, tallerInscripcionesRaw, solicitudesRaw])

  // Date Grouping for cards
  const gruposPorFecha = useMemo(() => {
    const map = new Map<string, SolicitudItem[]>()

    for (const item of unifiedItems) {
      if (!item.fecha) continue
      const d = new Date(item.fecha)
      if (isNaN(d.getTime())) continue
      const dateKey = String(item.fecha).slice(0, 10)
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(item)
    }

    const grupos: { dateKey: string; label: string; badge?: string; items: SolicitudItem[] }[] = []

    for (const [key, items] of map) {
      const { label, badge } = getRelativeDateLabel(key)
      grupos.push({ dateKey: key, label, badge, items })
    }

    grupos.sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    return grupos
  }, [unifiedItems])

  // Handle Rejection
  const handleOpenReject = (item: typeof unifiedItems[0]) => {
    setRejectTarget({
      id: item.id,
      nombre: `${item.nombres} ${item.apellidos}`.trim(),
      programa: item.programaNombre,
      origen: item.origen,
    })
    setRejectReason("")
  }

  const handleConfirmReject = async () => {
    if (!rejectTarget) return
    setRejectLoading(true)
    try {
      if (rejectTarget.origen === "taller") {
        await tallerService.cambiarEstadoInscripcion(rejectTarget.id, "retirado")
      } else {
        await cursosService.rechazarSolicitudInscripcion(rejectTarget.id, rejectReason || "Rechazada por administración")
      }
      toast.success("Matrícula rechazada correctamente")
      queryClient.invalidateQueries({ queryKey: ["solicitudes-inscripcion"] })
      queryClient.invalidateQueries({ queryKey: ["talleres-inscripciones-pendientes"] })
      queryClient.invalidateQueries({ queryKey: ["count-cursos-pendientes"] })
      queryClient.invalidateQueries({ queryKey: ["count-personalizados-pendientes"] })
      queryClient.invalidateQueries({ queryKey: ["count-talleres-pendientes"] })
      setRejectTarget(null)
      setRejectReason("")
    } catch {
      toast.error("Ocurrió un error al rechazar la matrícula")
    } finally {
      setRejectLoading(false)
    }
  }

  // Handle Permanent Delete of Rejected records
  const handleDeleteRejected = async () => {
    if (!deleteTarget) return
    setDeletingRejected(true)
    try {
      if (deleteTarget.origen === "taller") {
        await tallerService.eliminarInscripcion(deleteTarget.id)
        toast.success("Inscripción eliminada correctamente")
        queryClient.invalidateQueries({ queryKey: ["talleres-inscripciones-pendientes"] })
      } else {
        await cursosService.eliminarSolicitud(deleteTarget.id)
        toast.success("Solicitud eliminada correctamente")
        queryClient.invalidateQueries({ queryKey: ["solicitudes-inscripcion"] })
      }
      queryClient.invalidateQueries({ queryKey: ["count-cursos-pendientes"] })
      queryClient.invalidateQueries({ queryKey: ["count-personalizados-pendientes"] })
      queryClient.invalidateQueries({ queryKey: ["count-talleres-pendientes"] })
      setDeleteTarget(null)
    } catch {
      toast.error("Error al eliminar el registro")
    } finally {
      setDeletingRejected(false)
    }
  }

  // Clear all filters helper
  const handleClearFilters = () => {
    setSearchTerm("")
    setFiltroProgramaId("")
    setFiltroFechaDesde("")
    setFiltroFechaHasta("")
    setVentanaActual(1)
    setTallerVentanaActual(1)
  }

  const hasActiveFilters = Boolean(searchTerm || filtroProgramaId || filtroFechaDesde || filtroFechaHasta)

  // Navigate to approval detail page
  const handleGoToApprove = (item: typeof unifiedItems[0]) => {
    if (item.origen === "taller") {
      navigate(`/matriculas/aprobacion/taller/${item.id}`, {
        state: { nombre: item.nombres, apellido: item.apellidos, cursoNombre: item.programaNombre },
      })
    } else {
      navigate(`/matriculas/aprobacion/solicitud/${item.id}?estado=${item.estado}`, {
        state: { nombre: item.nombres, apellido: item.apellidos, cursoNombre: item.programaNombre },
      })
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f8f9ff]">
      {/* 1. BREADCRUMB & HEADER DE OPERACIÓN */}
      <section className="bg-white border-b border-[#c6c6cd]/30 shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4">
          

          {/* Header & Status Summary Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
                Aprobación de Matrículas
              </h1>
              

              {/* Status Summary Pills Bar */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffdbca] text-[#783200] text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#fd761a] animate-pulse" />
                  <span>{activeStats.pendientes} pendientes de revisión</span>
                </div>
                <span className="text-[#c6c6cd] text-xs">•</span>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} className="text-emerald-600" />
                  <span>{activeStats.aprobados} aprobadas</span>
                </div>
                <span className="text-[#c6c6cd] text-xs">•</span>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-800 text-xs font-semibold">
                  <HugeiconsIcon icon={Cancel01Icon} size={14} className="text-red-600" />
                  <span>{activeStats.rechazados} rechazadas</span>
                </div>
                <span className="text-[#c6c6cd] text-xs">•</span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                  <span>{activeStats.todos} en total</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SELECTOR PRINCIPAL DE PROGRAMA & ESTADO */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-2 rounded-2xl shadow-sm border border-[#c6c6cd]/30">
          {/* Program Origin Tabs */}
          <div aria-label="Tipo de programa" className="flex items-center gap-1 p-1 bg-[#f8f9ff] rounded-xl border border-[#c6c6cd]/20" role="tablist">
            <button
              onClick={() => { setMainTab("cursos"); setVentanaActual(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mainTab === "cursos"
                  ? "bg-white shadow-sm text-[#0b1c30]"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
              type="button"
            >
              <HugeiconsIcon icon={GraduationCapIcon} size={16} className={mainTab === "cursos" ? "text-[#fd761a]" : "text-[#45464d]"} />
              <span>Cursos</span>
              <span className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${
                mainTab === "cursos" ? "bg-[#fd761a] text-white" : "bg-gray-200 text-gray-700"
              }`}>
                {countCursos}
              </span>
            </button>

            <button
              onClick={() => { setMainTab("personalizados"); setVentanaActual(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mainTab === "personalizados"
                  ? "bg-white shadow-sm text-[#0b1c30]"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
              type="button"
            >
              <HugeiconsIcon icon={FilterIcon} size={16} className={mainTab === "personalizados" ? "text-[#fd761a]" : "text-[#45464d]"} />
              <span>Personalizados</span>
              <span className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${
                mainTab === "personalizados" ? "bg-[#fd761a] text-white" : "bg-gray-200 text-gray-700"
              }`}>
                {countPersonalizados}
              </span>
            </button>

            <button
              onClick={() => { setMainTab("talleres"); setTallerVentanaActual(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mainTab === "talleres"
                  ? "bg-white shadow-sm text-[#0b1c30]"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
              type="button"
            >
              <HugeiconsIcon icon={Calendar03Icon} size={16} className={mainTab === "talleres" ? "text-[#fd761a]" : "text-[#45464d]"} />
              <span>Talleres</span>
              <span className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${
                mainTab === "talleres" ? "bg-[#fd761a] text-white" : "bg-gray-200 text-gray-700"
              }`}>
                {countTalleres}
              </span>
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div aria-label="Filtro por estado" className="flex items-center gap-1 p-1 bg-[#f8f9ff] rounded-xl border border-[#c6c6cd]/20" role="tablist">
            <button
              onClick={() => { setStatusFilter("todos"); setVentanaActual(1); setTallerVentanaActual(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "todos"
                  ? "bg-white shadow-sm text-[#0b1c30]"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
              type="button"
            >
              <span>Todos</span>
              <span className="font-mono text-[11px] text-[#45464d] font-medium">
                {activeStats.todos}
              </span>
            </button>

            <button
              onClick={() => { setStatusFilter("pendientes"); setVentanaActual(1); setTallerVentanaActual(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "pendientes"
                  ? "bg-white shadow-sm text-[#783200]"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
              type="button"
            >
              <span className="w-2 h-2 rounded-full bg-[#fd761a]" />
              <span>Pendientes</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${
                statusFilter === "pendientes" ? "bg-[#ffdbca] text-[#783200]" : "bg-gray-200 text-gray-700"
              }`}>
                {activeStats.pendientes}
              </span>
            </button>

            <button
              onClick={() => { setStatusFilter("aprobados"); setVentanaActual(1); setTallerVentanaActual(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "aprobados"
                  ? "bg-white shadow-sm text-emerald-800"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
              type="button"
            >
              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} className="text-emerald-600" />
              <span>Aprobados</span>
              <span className="font-mono text-[11px] text-[#45464d] font-medium">
                {activeStats.aprobados}
              </span>
            </button>

            <button
              onClick={() => { setStatusFilter("rechazados"); setVentanaActual(1); setTallerVentanaActual(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "rechazados"
                  ? "bg-white shadow-sm text-red-800"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
              type="button"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} className="text-red-600" />
              <span>Rechazados</span>
              <span className="font-mono text-[11px] text-[#45464d] font-medium">
                {activeStats.rechazados}
              </span>
            </button>
          </div>
        </div>

        {/* 3. BARRA DE HERRAMIENTAS DE BÚSQUEDA Y FILTROS RÁPIDOS */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#c6c6cd]/30 flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search input with icon & hotkey */}
            <div className="relative flex-1 max-w-lg">
              <HugeiconsIcon
                icon={SearchIcon}
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar por nombre, cédula o email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setVentanaActual(1)
                  setTallerVentanaActual(1)
                }}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f8f9ff] text-[#0b1c30] text-xs font-medium placeholder:text-[#76777d] border border-transparent focus:border-[#c6c6cd] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Course or Workshop instance filter */}
              <div className="relative">
                <select
                  value={filtroProgramaId}
                  onChange={(e) => {
                    setFiltroProgramaId(e.target.value)
                    setVentanaActual(1)
                    setTallerVentanaActual(1)
                  }}
                  className="px-3 py-2 rounded-xl bg-[#f8f9ff] hover:bg-[#e5eeff] text-[#0b1c30] text-xs font-medium border border-transparent focus:border-[#c6c6cd] focus:bg-white focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="">{mainTab === "talleres" ? "Todos los talleres" : "Todos los cursos"}</option>
                  {mainTab === "talleres"
                    ? talleresFiltro.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}
                        </option>
                      ))
                    : catalogosFiltro.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                </select>
              </div>

              {/* Date Filters: Desde & Hasta */}
              <div className="flex items-center gap-1.5 bg-[#f8f9ff] p-1 rounded-xl border border-transparent">
                <span className="text-[11px] text-gray-500 pl-2">Desde:</span>
                <input
                  type="date"
                  value={filtroFechaDesde}
                  onChange={(e) => {
                    setFiltroFechaDesde(e.target.value)
                    setVentanaActual(1)
                    setTallerVentanaActual(1)
                  }}
                  className="px-2 py-1 rounded-lg bg-white text-[11px] text-[#0b1c30] border border-[#c6c6cd]/40 focus:outline-none"
                />
                <span className="text-[11px] text-gray-500">Hasta:</span>
                <input
                  type="date"
                  value={filtroFechaHasta}
                  onChange={(e) => {
                    setFiltroFechaHasta(e.target.value)
                    setVentanaActual(1)
                    setTallerVentanaActual(1)
                  }}
                  className="px-2 py-1 rounded-lg bg-white text-[11px] text-[#0b1c30] border border-[#c6c6cd]/40 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Active Filter Chips & Counter Feedback */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                Filtros activos:
              </span>

              {searchTerm && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-[#0b1c30] text-[11px] font-medium">
                  <span>Búsqueda: "{searchTerm}"</span>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="hover:text-red-500 transition-colors"
                    title="Quitar filtro de búsqueda"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} />
                  </button>
                </div>
              )}

              {filtroProgramaId && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-[#0b1c30] text-[11px] font-medium">
                  <span>
                    {mainTab === "talleres"
                      ? talleresFiltro.find((t: any) => t.id === filtroProgramaId)?.nombre || "Taller seleccionado"
                      : catalogosFiltro.find((c: any) => c.id === filtroProgramaId)?.nombre || "Curso seleccionado"}
                  </span>
                  <button
                    onClick={() => setFiltroProgramaId("")}
                    className="hover:text-red-500 transition-colors"
                    title="Quitar filtro de programa"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} />
                  </button>
                </div>
              )}

              {(filtroFechaDesde || filtroFechaHasta) && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-[#0b1c30] text-[11px] font-medium">
                  <span>Fecha: {filtroFechaDesde || "Inicio"} a {filtroFechaHasta || "Fin"}</span>
                  <button
                    onClick={() => { setFiltroFechaDesde(""); setFiltroFechaHasta(""); }}
                    className="hover:text-red-500 transition-colors"
                    title="Quitar filtro de fecha"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} />
                  </button>
                </div>
              )}

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-[11px] font-semibold text-[#fd761a] hover:text-[#9d4300] transition-colors ml-1 cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="text-xs text-[#45464d] font-medium">
              Mostrando {unifiedItems.length} {statusFilter === "todos" ? "solicitudes" : `solicitudes ${statusFilter}`}
            </div>
          </div>
        </div>

        {/* 4. BANDEJA DE ENTRADA AGRUPADA POR FECHA */}
        {loading ? (
          <div className="p-20 text-center bg-white rounded-2xl border border-[#c6c6cd]/30">
            <div className="w-8 h-8 rounded-full border-2 border-[#fd761a] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#45464d] font-medium">Cargando solicitudes de matrícula...</p>
          </div>
        ) : isError ? (
          <div role="alert" className="p-12 text-center bg-red-50 rounded-2xl border border-red-200">
            <HugeiconsIcon icon={Alert02Icon} size={32} className="text-red-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-800">No se pudieron cargar las solicitudes de matrícula.</p>
            <button
              onClick={() => {
                if (mainTab === "talleres") void talleresQuery.refetch()
                else void solicitudesQuery.refetch()
              }}
              className="mt-3 text-xs font-semibold text-red-700 underline cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : gruposPorFecha.length === 0 ? (
          /* EMPTY STATE CARD (Design from code.html) */
          <div className="w-full bg-white p-12 sm:p-16 rounded-2xl border border-[#c6c6cd]/30 shadow-sm text-center">
            <div className="max-w-md mx-auto flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#ffdbca]/40 flex items-center justify-center text-[#fd761a]">
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={36} />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg sm:text-xl font-bold text-[#0b1c30]">
                  No hay matrículas {statusFilter === "todos" ? "registradas" : statusFilter}
                </h2>
                <p className="text-xs sm:text-sm text-[#45464d]">
                  {statusFilter === "pendientes"
                    ? "Todas las inscripciones recibidas han sido validadas y procesadas oportunamente. Los nuevos registros aparecerán aquí en tiempo real."
                    : "No se encontraron solicitudes que coincidan con los filtros aplicados en este momento."}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                {statusFilter !== "todos" && (
                  <button
                    onClick={() => setStatusFilter("todos")}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0b1c30] text-xs font-semibold transition-colors"
                  >
                    Ver todas las solicitudes
                  </button>
                )}
                <button
                  onClick={() => {
                    if (mainTab === "talleres") void talleresQuery.refetch()
                    else void solicitudesQuery.refetch()
                  }}
                  className="px-4 py-2 rounded-xl bg-[#fd761a] hover:bg-[#e05f0a] text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  Actualizar bandeja
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {gruposPorFecha.map((grupo) => (
              <div key={grupo.dateKey} className="flex flex-col gap-3">
                {/* Date Heading Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-sm sm:text-base font-bold text-[#0b1c30] tracking-tight">
                      {grupo.label}
                    </h2>
                    {grupo.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        grupo.badge === "Hoy"
                          ? "bg-[#ffdbca] text-[#783200]"
                          : "bg-gray-200 text-gray-700"
                      }`}>
                        {grupo.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#45464d] font-medium">
                    {grupo.items.length} {grupo.items.length === 1 ? "solicitud" : "solicitudes"}
                  </span>
                </div>

                {/* Cards List for this date */}
                <div className="flex flex-col gap-3">
                  {grupo.items.map((item) => {
                    const initials = getInitials(item.nombres, item.apellidos)

                    return (
                      <article
                        key={item.id}
                        className="w-full bg-white rounded-2xl shadow-sm border border-[#c6c6cd]/30 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden transition-all hover:shadow-md"
                      >
                        {/* Status Left Indicator Bar */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            item.isPendiente
                              ? "bg-[#fd761a]"
                              : item.isAprobado
                                ? "bg-emerald-500"
                                : "bg-red-500"
                          }`}
                        />

                        {/* Left Column: Student Profile (Only name and email) */}
                        <div className="flex items-start sm:items-center gap-3.5 pl-1.5 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm select-none shadow-sm ${
                                item.isPendiente
                                  ? "bg-[#ffdbca] text-[#783200]"
                                  : item.isAprobado
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {initials}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${
                                item.isPendiente
                                  ? "bg-[#fd761a]"
                                  : item.isAprobado
                                    ? "bg-emerald-500"
                                    : "bg-red-500"
                              }`}
                              title={item.isPendiente ? "Pendiente" : item.isAprobado ? "Aprobada" : "Rechazada"}
                            />
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm sm:text-base text-[#0b1c30] truncate">
                              {item.nombres} {item.apellidos}
                            </span>
                            <span className="text-xs text-[#45464d] truncate mt-0.5">
                              {item.correo || "Sin correo"}
                            </span>
                          </div>
                        </div>

                        {/* Center Column: Program Enrollment Details */}
                        <div className="flex flex-col min-w-0 flex-1 lg:px-6 lg:border-l lg:border-gray-200/80">
                          <span className="font-bold text-sm text-[#0b1c30] truncate">
                            {item.programaNombre}
                          </span>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {item.ciudad && <CiudadBadge ciudad={item.ciudad} />}
                            {item.modalidad && <ModalidadBadge modalidad={item.modalidad} />}
                          </div>

                          {(item.isAprobado || item.isRechazado) && (
                            <div className="flex items-center gap-1.5 text-xs text-[#45464d] mt-1.5">
                              <HugeiconsIcon icon={Clock01Icon} size={13} className="text-gray-400 shrink-0" />
                              {item.isAprobado ? (
                                <span>
                                  Procesada el {item.fecha ? new Date(item.fecha).toLocaleDateString("es-EC") : ""}
                                  {item.validador && ` por ${item.validador}`}
                                </span>
                              ) : (
                                <span className="text-red-700 font-medium">
                                  {item.motivo_rechazo ? `Motivo: ${item.motivo_rechazo}` : "Rechazada por administración"}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right Column: Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 lg:pt-0">
                          {item.isPendiente ? (
                            <>
                              <button
                                onClick={() => handleOpenReject(item)}
                                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                                type="button"
                              >
                                Rechazar
                              </button>

                              <button
                                onClick={() => handleGoToApprove(item)}
                                className="px-4 py-2 rounded-xl bg-[#fd761a] hover:bg-[#e05f0a] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                type="button"
                              >
                                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} />
                                <span>Aprobar</span>
                              </button>
                            </>
                          ) : item.isAprobado ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="text-emerald-600" />
                                <span>Aprobada</span>
                              </span>
                              <button
                                onClick={() => handleGoToApprove(item)}
                                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0b1c30] text-xs font-semibold transition-colors cursor-pointer"
                                type="button"
                              >
                                Ver detalle
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-800 text-xs font-semibold">
                                <HugeiconsIcon icon={Cancel01Icon} size={16} className="text-red-600" />
                                <span>Rechazada</span>
                              </span>
                              <button
                                onClick={() => handleGoToApprove(item)}
                                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0b1c30] text-xs font-semibold transition-colors cursor-pointer"
                                type="button"
                              >
                                Ver detalle
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ id: item.id, nombre: `${item.nombres} ${item.apellidos}`, origen: item.origen })}
                                className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Eliminar registro rechazado permanentemente"
                                type="button"
                              >
                                <HugeiconsIcon icon={Delete01Icon} size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {((mainTab === "talleres" ? tallerTotalVentanas : totalVentanas) > 1) && (
              <div className="flex items-center justify-center gap-3 py-4">
                <button
                  onClick={() => {
                    if (mainTab === "talleres") setTallerVentanaActual((p) => Math.max(1, p - 1))
                    else setVentanaActual((p) => Math.max(1, p - 1))
                  }}
                  disabled={mainTab === "talleres" ? tallerVentanaActual <= 1 : ventanaActual <= 1}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-[#c6c6cd]/40 bg-white text-[#0b1c30] disabled:opacity-30 transition-colors hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  ◀ Anterior
                </button>
                <span className="text-xs font-medium text-[#45464d]">
                  Página {mainTab === "talleres" ? tallerVentanaActual : ventanaActual} de{" "}
                  {mainTab === "talleres" ? tallerTotalVentanas : totalVentanas}
                </span>
                <button
                  onClick={() => {
                    if (mainTab === "talleres") setTallerVentanaActual((p) => Math.min(tallerTotalVentanas, p + 1))
                    else setVentanaActual((p) => Math.min(totalVentanas, p + 1))
                  }}
                  disabled={
                    mainTab === "talleres"
                      ? tallerVentanaActual >= tallerTotalVentanas
                      : ventanaActual >= totalVentanas
                  }
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-[#c6c6cd]/40 bg-white text-[#0b1c30] disabled:opacity-30 transition-colors hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Siguiente ▶
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 5. DIÁLOGO / MODAL DE RECHAZO (DISEÑO code.html) */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/50 backdrop-blur-sm p-4 transition-opacity animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4 border border-[#c6c6cd]/30 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                  <HugeiconsIcon icon={Alert02Icon} size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0b1c30]">
                    Rechazar matrícula
                  </h3>
                  <p className="text-xs text-[#45464d]">
                    Se registrará el motivo del rechazo de la solicitud.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectTarget(null)}
                aria-label="Cerrar modal"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                type="button"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            {/* Applicant Context Card */}
            <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#c6c6cd]/20 flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                Postulante seleccionado
              </span>
              <span className="text-xs font-semibold text-[#0b1c30]">
                {rejectTarget.nombre}
              </span>
              <span className="text-xs text-[#fd761a] font-medium">
                Programa: {rejectTarget.programa}
              </span>
            </div>

            {/* Preset Reasons Chips */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#0b1c30]">
                Selecciona un motivo frecuente:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Documentación incompleta",
                  "Cupo de cohorte lleno",
                  "No cumple requisitos",
                  "Otro motivo administrativo",
                ].map((reason) => {
                  const isSelected = rejectReason === reason
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectReason(reason)}
                      className={`p-2 rounded-xl text-left text-xs font-medium transition-all flex items-center justify-between gap-1.5 cursor-pointer border ${
                        isSelected
                          ? "bg-[#ffdbca] text-[#783200] border-[#fd761a] font-semibold shadow-sm"
                          : "bg-[#f8f9ff] text-gray-700 border-transparent hover:bg-[#eff4ff]"
                      }`}
                    >
                      <span className="truncate">{reason}</span>
                      {isSelected && <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} className="text-[#fd761a] shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Detail TextArea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#0b1c30]" htmlFor="reject-notes">
                Detalle explicativo del rechazo:
              </label>
              <textarea
                id="reject-notes"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Indica la razón o los pasos para subsanar los requisitos..."
                className="w-full p-3 rounded-xl bg-[#f8f9ff] text-xs text-[#0b1c30] border border-[#c6c6cd]/40 focus:bg-white focus:border-[#fd761a] focus:outline-none transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                disabled={rejectLoading}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejectLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {rejectLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                )}
                <span>Confirmar rechazo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DEFINITIVA */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Eliminar solicitud rechazada"
        message={`¿Eliminar definitivamente el registro de "${deleteTarget?.nombre}"? Se borrará el registro de la base de datos. Esta acción es irreversible.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={deletingRejected}
        icon="danger"
        isDangerous
        onConfirm={handleDeleteRejected}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
