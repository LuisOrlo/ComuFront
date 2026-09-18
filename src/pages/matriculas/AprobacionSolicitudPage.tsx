/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle04Icon,
  Cancel01Icon,
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  UserIcon,
  BookOpenIcon,
  PaymentIcon,
  Image01Icon,
  DashboardSquareIcon,
  Alert02Icon,
} from "@hugeicons/core-free-icons"
import { cursosService, type CursoAbierto } from "@/services/cursos.service"
import { type PagoPreAprobacionRef } from "./PagoPreAprobacionSection"
import { validarImagen } from "./AprobacionUtils"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { RejectModal } from "@/components/RejectModal"
import { ImageZoom } from "./ImageZoom"
import { SolicitudResumenTab } from "./components/solicitudes/SolicitudResumenTab"
import { SolicitudEstudianteTab } from "./components/solicitudes/SolicitudEstudianteTab"
import { SolicitudCursoTab } from "./components/solicitudes/SolicitudCursoTab"
import { SolicitudPagoTab } from "./components/solicitudes/SolicitudPagoTab"
import { SolicitudDocumentoTab } from "./components/solicitudes/SolicitudDocumentoTab"
import { ModalReconciliacionCurso } from "./components/ModalReconciliacionCurso"
import { CiudadBadge, ModalidadBadge } from "../estudiantes/components/Badges"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

type TabId = "resumen" | "estudiante" | "curso" | "pago" | "documento"

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "resumen", label: "Resumen", icon: DashboardSquareIcon },
  { id: "estudiante", label: "Estudiante", icon: UserIcon },
  { id: "curso", label: "Curso", icon: BookOpenIcon },
  { id: "pago", label: "Pago", icon: PaymentIcon },
  { id: "documento", label: "C.Cédula", icon: Image01Icon },
]

export function AprobacionSolicitudPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const filtros = useMemo(() => ({
    estado: searchParams.get("estado") || "",
    search: searchParams.get("search") || "",
    curso_abierto_id: searchParams.get("curso_abierto_id") || "",
    fecha_desde: searchParams.get("fecha_desde") || "",
    fecha_hasta: searchParams.get("fecha_hasta") || "",
  }), [searchParams])

  const searchStr = searchParams.toString() ? `?${searchParams.toString()}` : ""

  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("resumen")

  const [adjacent, setAdjacent] = useState<{
    prev_id: string | null; next_id: string | null; first_id: string | null
    position: number; total: number; stale: boolean; stale_estado?: string
  }>({ prev_id: null, next_id: null, first_id: null, position: 1, total: 0, stale: false })

  const [editField, setEditField] = useState<string | null>(null)
  const [editVal, setEditVal] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  const [editPagoField, setEditPagoField] = useState<string | null>(null)
  const [editPagoVal, setEditPagoVal] = useState("")
  const [savingPagoEdit, setSavingPagoEdit] = useState(false)

  const [editCursoField, setEditCursoField] = useState<string | null>(null)
  const [editCursoVal, setEditCursoVal] = useState("")
  const [savingCursoEdit, setSavingCursoEdit] = useState(false)
  const [cursosAbiertosList, setCursosAbiertosList] = useState<CursoAbierto[]>([])
  const [searchCursoQuery, setSearchCursoQuery] = useState("")

  const [expandedComprobante, setExpandedComprobante] = useState(false)
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null)
  const [uploadingCedula, setUploadingCedula] = useState(false)
  const [uploadingComprobante, setUploadingComprobante] = useState(false)
  const [deletingComprobante, setDeletingComprobante] = useState(false)
  const [deletingCedula, setDeletingCedula] = useState(false)
  const [deleteArchivoModal, setDeleteArchivoModal] = useState<{ type: "comprobante" | "cedula"; label: string } | null>(null)
  const cedulaRef = useRef<HTMLInputElement>(null)
  const comprobanteRef = useRef<HTMLInputElement>(null)

  const pagoRef = useRef<PagoPreAprobacionRef>(null)
  const [montoValido, setMontoValido] = useState(false)
  const [, setTotalPrecioModulos] = useState(-1)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)

  const [editandoMontos, setEditandoMontos] = useState(false)
  const [editMontosValues, setEditMontosValues] = useState<Record<string, string>>({})
  const [editPreciosValues, setEditPreciosValues] = useState<Record<string, string>>({})
  const [editMotivosValues, setEditMotivosValues] = useState<Record<string, string>>({})
  const [savingMontos, setSavingMontos] = useState(false)

  const [modalReconciliacionOpen, setModalReconciliacionOpen] = useState(false)
  const [cursoIdPropuesto, setCursoIdPropuesto] = useState<string | null>(null)
  const [reconciliando, setReconciliando] = useState(false)
  const [nuevosModulos, setNuevosModulos] = useState<any[]>([])
  const [nuevoCursoNombre, setNuevoCursoNombre] = useState("")
  const montoInscripcion = Number(selected?.lineas_pago?.inscripcion?.monto_ajustado) || 0

  useEffect(() => {
    if (!modalReconciliacionOpen || !cursoIdPropuesto) return
    const loadModulos = async () => {
      try {
        const rawModulos = await cursosService.getModulosPorCurso(cursoIdPropuesto) as any[]
        const precioInscripcion = montoInscripcion || 0
        if (precioInscripcion > 0) {
          rawModulos.push({
            id: null,
            nombre_modulo: "Inscripción / Matrícula",
            tipo: "inscripcion",
            precio_base: precioInscripcion,
          })
        }
        setNuevosModulos(rawModulos)
        const selCurso = cursosAbiertosList.find((c: any) => c.id === cursoIdPropuesto)
        setNuevoCursoNombre(selCurso?.nombre_instancia || selCurso?.catalogo?.nombre || "Nuevo curso")
      } catch {
        toast.error("Error al cargar módulos del nuevo curso")
        setModalReconciliacionOpen(false)
      }
    }
    loadModulos()
  }, [modalReconciliacionOpen, cursoIdPropuesto, cursosAbiertosList, montoInscripcion])

  const fetchDetail = useCallback(async (targetId?: string) => {
    const fetchId = targetId || id
    if (!fetchId) return
    setLoading(true)
    try {
      const detalle = await cursosService.getSolicitudInscripcionById(fetchId)
      setSelected(detalle)
    } catch {
      toast.error("Error al cargar detalle")
      if (targetId) navigate(`/matriculas${searchStr}`)
    } finally {
      setLoading(false)
    }
  }, [id, navigate, searchStr])

  const fetchAdjacent = useCallback(async (targetId?: string) => {
    const fetchId = targetId || id
    if (!fetchId) return
    try {
      const data = await cursosService.getSolicitudAdjacent(fetchId, filtros)
      setAdjacent(data)
    } catch { /* silent */ }
  }, [id, filtros])

  const navigateTo = useCallback(async (targetId: string) => {
    navigate(`/matriculas/aprobacion/solicitud/${targetId}${searchStr}`, { replace: true })
  }, [navigate, searchStr])

  useEffect(() => {
    fetchDetail()
    fetchAdjacent()
  }, [fetchDetail, fetchAdjacent])

  const loadCursosAbiertos = useCallback(async () => {
    try {
      const res = await cursosService.getCursos({ per_page: 100, dias_desde_inicio: 7 }, 1)
      setCursosAbiertosList((res as any).data || [])
    } catch { /* silent */ }
  }, [])

  const getCursoNombre = useCallback(() => selected?.curso?.nombre || "—", [selected])

  const filteredCursosAbiertos = useMemo(() => {
    if (!searchCursoQuery.trim()) return cursosAbiertosList
    const query = searchCursoQuery.toLowerCase().trim()
    return cursosAbiertosList.filter((c: any) => (c.nombre || c.id || "").toLowerCase().includes(query))
  }, [cursosAbiertosList, searchCursoQuery])

  const cursoInicio = selected?.curso?.fechas?.inicio?.split("T")[0] || "—"
  const cursoPrecio = Number(selected?.curso?.precio_base || 0)
  const cursoModalidad = selected?.curso?.modalidad ? selected.curso.modalidad.charAt(0).toUpperCase() + selected.curso.modalidad.slice(1) : "—"
  const cursoCatalogo = selected?.curso?.nombre_catalogo || "—"
  const cursoDocente = selected?.curso?.docente?.nombre || "—"
  const cursoCiudad = selected?.curso?.ciudad || "—"
  const cursoHorario = selected?.curso?.horario?.descripcion || "—"
  const cursoFin = selected?.curso?.fechas?.fin_estimada?.split("T")[0] || "—"

  const startEdit = (field: string, value: string) => { setEditField(field); setEditVal(value) }
  const cancelEdit = () => { setEditField(null); setEditVal("") }

  const saveEdit = async () => {
    if (!id || !editField || editVal === "") return
    setSavingEdit(true)
    try {
      const data: any = { [editField]: editVal }
      await cursosService.actualizarEstudiante(id, data)
      setSelected((prev: any) => {
        if (!prev) return prev
        const updated = { ...prev }
        if (updated.solicitante?.datos) {
          const datos = { ...updated.solicitante.datos }
          if (datos.perfil_estudiante) datos.perfil_estudiante = { ...datos.perfil_estudiante, [editField]: editVal }
          else datos[editField] = editVal
          updated.solicitante = { ...updated.solicitante, datos }
        }
        return updated
      })
      toast.success("Dato actualizado correctamente")
      setEditField(null); setEditVal("")
      fetchDetail()
    } catch (err) {
      toast.error((err as any)?.response?.data?.mensaje || "Error al guardar cambio")
    } finally { setSavingEdit(false) }
  }

  const saveCursoEdit = async () => {
    if (!id || !editCursoField) return
    const yaAprobada = selected?.estado?.valor === "matricula_creada"
    if (yaAprobada) {
      setCursoIdPropuesto(editCursoVal)
      setModalReconciliacionOpen(true)
      return
    }
    setSavingCursoEdit(true)
    try {
      await cursosService.actualizarCurso(id, { curso_abierto_id: editCursoVal })
      const selCurso = cursosAbiertosList.find((c: any) => c.id === editCursoVal)
      const cursoNombre = selCurso?.nombre_instancia || selCurso?.catalogo?.nombre || editCursoVal
      setSelected((prev: any) => prev ? { ...prev, curso: { ...prev.curso, nombre: cursoNombre, id: editCursoVal } } : prev)
      toast.success("Curso actualizado")
      setEditCursoField(null); setEditCursoVal("")
      fetchDetail()
    } catch (err) {
      toast.error((err as any)?.response?.data?.mensaje || "Error al guardar curso")
    } finally { setSavingCursoEdit(false) }
  }

  const handleReconciliarCurso = async (lineas: { modulo_id: string | null; tipo: string; monto_abonado: number; monto_ajustado: number }[]) => {
    if (!id || !cursoIdPropuesto) return
    setReconciliando(true)
    try {
      await cursosService.reconciliarCurso(id, { curso_abierto_id: cursoIdPropuesto, lineas })
      toast.success("Curso actualizado y pagos reconciliados correctamente")
      setModalReconciliacionOpen(false)
      setCursoIdPropuesto(null)
      setEditCursoField(null); setEditCursoVal("")
      fetchDetail()
    } catch (err) {
      toast.error((err as any)?.response?.data?.mensaje || "Error al reconciliar curso")
    } finally { setReconciliando(false) }
  }

  const startEditPago = (field: string, value: string) => {
    setEditPagoField(field)
    setEditPagoVal(value.includes("T") ? value.split("T")[0] : value)
  }
  const cancelEditPago = () => { setEditPagoField(null); setEditPagoVal("") }

  const saveEditPago = async () => {
    if (!id || !editPagoField || !editPagoVal) return
    setSavingPagoEdit(true)
    try {
      if (editPagoField === "fecha_pago_declarada") {
        await cursosService.actualizarPago(id, { fecha_pago_declarada: editPagoVal })
        setSelected((prev: any) =>
          prev
            ? {
                ...prev,
                pago: {
                  ...prev.pago,
                  comprobante: { ...prev.pago?.comprobante, fecha_pago_declarada: editPagoVal },
                },
              }
            : prev
        )
        toast.success("Fecha de pago actualizada")
      } else if (editPagoField === "tipo_pago" || editPagoField === "tipo_comprobante") {
        await cursosService.actualizarPago(id, { tipo_comprobante: editPagoVal })
        setSelected((prev: any) =>
          prev
            ? {
                ...prev,
                pago: {
                  ...prev.pago,
                  comprobante: { ...prev.pago?.comprobante, tipo: editPagoVal },
                },
              }
            : prev
        )
        toast.success("Tipo de pago actualizado")
      }
      setEditPagoField(null)
      setEditPagoVal("")
      fetchDetail()
    } catch (err) {
      toast.error((err as any)?.response?.data?.mensaje || "Error al guardar datos de pago")
    } finally {
      setSavingPagoEdit(false)
    }
  }

  const handleUploadCedula = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    const error = validarImagen(file, 2)
    if (error) { toast.error(error); return }
    setUploadingCedula(true)
    try {
      const res = await cursosService.uploadSolicitudArchivo(id, "cedula", file)
      setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, cedula_url: res.data?.cedula_url || res.cedula_url } } }))
      toast.success("Cédula subida correctamente")
    } catch { toast.error("Error al subir cédula") }
    finally { setUploadingCedula(false) }
  }

  const handleUploadComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    const error = validarImagen(file, 5)
    if (error) { toast.error(error); return }
    setUploadingComprobante(true)
    try {
      const res = await cursosService.uploadSolicitudArchivo(id, "comprobante", file)
      setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, url: res.data?.comprobante_url || res.comprobante_url } } }))
      toast.success("Comprobante subido correctamente")
    } catch { toast.error("Error al subir comprobante") }
    finally { setUploadingComprobante(false) }
  }

  const handleDeleteComprobante = async () => {
    setDeleteArchivoModal(null)
    if (!id) return
    setDeletingComprobante(true)
    try {
      await cursosService.deleteArchivoSolicitud(id, "archivo_comprobante_url")
      toast.success("Comprobante eliminado")
      setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, url: null, comprobante_purgado: true } } }))
    } catch { toast.error("Error al eliminar comprobante") }
    finally { setDeletingComprobante(false) }
  }

  const handleDeleteCedula = async () => {
    setDeleteArchivoModal(null)
    if (!id) return
    setDeletingCedula(true)
    try {
      await cursosService.deleteArchivoSolicitud(id, "archivo_cedula_url")
      toast.success("Cédula eliminada")
      setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, cedula_url: null, cedula_purgado: true } } }))
    } catch { toast.error("Error al eliminar cédula") }
    finally { setDeletingCedula(false) }
  }

  const handleApprove = async (pagos: any[], metodoPago: string, inscripcion?: { total: number; cubierto: number; motivo_ajuste?: string }) => {
    if (!id) return
    setActionLoading(true)
    try {
      const payload: Record<string, unknown> = { pagos, metodo_pago: metodoPago }
      if (inscripcion && inscripcion.total > 0) {
        payload.precio_inscripcion = inscripcion.total
        payload.inscripcion_cubierta = inscripcion.cubierto
        if (inscripcion.motivo_ajuste) payload.motivo_ajuste = inscripcion.motivo_ajuste
      }
      await cursosService.aprobarSolicitudInscripcion(id, payload)
      setSelected((prev: any) => prev ? { ...prev, estado: { valor: "matricula_creada", descripcion: "Matrícula creada" } } : prev)
      setActionLoading(false)
      toast.success("Matrícula aprobada exitosamente")
      queryClient.invalidateQueries({ queryKey: ["solicitudes-inscripcion"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      navigate(`/matriculas?tab=${selected?.curso?.es_personalizado ? "personalizados" : "cursos"}&status=aprobados`)
    } catch (err) {
      setActionLoading(false)
      toast.error((err as any)?.response?.data?.mensaje || "Error al aprobar")
    }
  }

  const handleReject = async (motivo: string) => {
    if (!id) return
    setActionLoading(true)
    try {
      await cursosService.rechazarSolicitudInscripcion(id, motivo)
      toast.success("Solicitud rechazada")
      setActionLoading(false)
      queryClient.invalidateQueries({ queryKey: ["solicitudes-inscripcion"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      navigate("/matriculas?tab=cursos&status=rechazados")
    } catch (err) {
      toast.error((err as any)?.response?.data?.mensaje || "Error al rechazar")
      setActionLoading(false)
    }
  }

  const startEditMontos = () => {
    const montosValues: Record<string, string> = {}
    const preciosValues: Record<string, string> = {}
    const motivosValues: Record<string, string> = {}
    selected.lineas_pago?.modulos?.forEach((lp: any) => {
      montosValues[lp.id] = String(lp.monto_abonado)
      preciosValues[lp.id] = String(lp.monto_ajustado)
    })
    if (selected.lineas_pago?.inscripcion) {
      const ins = selected.lineas_pago.inscripcion
      montosValues[ins.id] = String(ins.monto_abonado)
      preciosValues[ins.id] = String(ins.monto_ajustado)
    }
    setEditMontosValues(montosValues)
    setEditPreciosValues(preciosValues)
    setEditMotivosValues(motivosValues)
    setEditandoMontos(true)
  }

  const cancelEditMontos = () => {
    setEditMontosValues({})
    setEditPreciosValues({})
    setEditMotivosValues({})
    setEditandoMontos(false)
  }

  const editMontoChange = (lineaId: string, val: string) => {
    setEditMontosValues(prev => ({ ...prev, [lineaId]: val }))
  }

  const editPrecioChange = (lineaId: string, nuevoPrecio: string, motivo: string) => {
    setEditPreciosValues(prev => ({ ...prev, [lineaId]: nuevoPrecio }))
    setEditMotivosValues(prev => ({ ...prev, [lineaId]: motivo }))

    const precioNum = parseFloat(nuevoPrecio) || 0
    setEditMontosValues(prev => {
      const abonadoActual = parseFloat(prev[lineaId] || "0")
      if (abonadoActual > precioNum && precioNum > 0) {
        return { ...prev, [lineaId]: String(precioNum) }
      }
      return prev
    })
  }

  const saveEditMontos = async () => {
    if (!id) return
    setSavingMontos(true)
    try {
      const originalValues: Record<string, { abonado: number; precio: number }> = {}
      selected.lineas_pago?.modulos?.forEach((lp: any) => {
        originalValues[lp.id] = { abonado: lp.monto_abonado, precio: lp.monto_ajustado }
      })
      if (selected.lineas_pago?.inscripcion) {
        const ins = selected.lineas_pago.inscripcion
        originalValues[ins.id] = { abonado: ins.monto_abonado, precio: ins.monto_ajustado }
      }

      const allIds = Array.from(new Set([...Object.keys(editMontosValues), ...Object.keys(editPreciosValues)]))
      const changedLines = allIds
        .filter(lineaId => {
          const orig = originalValues[lineaId] || { abonado: 0, precio: 0 }
          const curAbonado = parseFloat(editMontosValues[lineaId] ?? String(orig.abonado)) || 0
          const curPrecio = parseFloat(editPreciosValues[lineaId] ?? String(orig.precio)) || 0
          return Math.abs(curAbonado - orig.abonado) > 0.001 || Math.abs(curPrecio - orig.precio) > 0.001
        })
        .map(lineaId => {
          const orig = originalValues[lineaId] || { abonado: 0, precio: 0 }
          return {
            id: lineaId,
            monto_abonado: parseFloat(editMontosValues[lineaId] ?? String(orig.abonado)) || 0,
            monto_ajustado: editPreciosValues[lineaId] !== undefined ? (parseFloat(editPreciosValues[lineaId]) || 0) : orig.precio,
            motivo_ajuste: editMotivosValues[lineaId] || undefined,
          }
        })

      if (changedLines.length === 0) {
        toast.info("No hay cambios que guardar")
        cancelEditMontos()
        return
      }

      await cursosService.actualizarLineasPago(id, changedLines)
      toast.success(`${changedLines.length} línea${changedLines.length > 1 ? "s" : ""} de pago actualizada${changedLines.length > 1 ? "s" : ""} correctamente`)
      cancelEditMontos()
      fetchDetail(id)
    } catch (err) {
      toast.error((err as any)?.response?.data?.mensaje || "Error al actualizar montos")
    } finally { setSavingMontos(false) }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#f8fafc] items-center justify-center p-6">
        <div className="w-10 h-10 rounded-full border-3 border-[#fd761a] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Cargando expediente de la solicitud...</p>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#f8fafc] items-center justify-center p-6 text-center">
        <HugeiconsIcon icon={Alert02Icon} size={36} className="text-rose-500 mb-2" />
        <h2 className="text-lg font-bold text-slate-900">No se encontró la solicitud</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Es posible que la solicitud haya sido eliminada o ya no esté disponible.
        </p>
        <button
          onClick={() => navigate("/matriculas")}
          className="mt-4 px-4 py-2 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-sm"
        >
          Volver a la bandeja
        </button>
      </div>
    )
  }

  const estadoValor = selected?.estado?.valor
  const yaProcesada = estadoValor === "matricula_creada" || estadoValor === "aprobado" || estadoValor === "rechazado" || estadoValor === "cancelado"
  const isAprobado = estadoValor === "matricula_creada" || estadoValor === "aprobado"

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f8fafc] text-slate-900 antialiased selection:bg-[#fd761a] selection:text-white">
      {/* 1. Header & Adjacent Navigation (Design from code.html) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(`/matriculas${searchStr}`)}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
              title="Volver a la bandeja"
              type="button"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  {selected.solicitante?.datos?.nombres || "—"} {selected.solicitante?.datos?.apellidos || ""}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isAprobado
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : estadoValor === "rechazado" || estadoValor === "cancelado"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200/70"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isAprobado
                      ? "bg-emerald-500"
                      : estadoValor === "rechazado" || estadoValor === "cancelado"
                        ? "bg-rose-500"
                        : "bg-amber-500"
                  }`} />
                  {isAprobado
                    ? "Aprobada"
                    : estadoValor === "rechazado" || estadoValor === "cancelado"
                      ? "Rechazada"
                      : "Pendiente"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{getCursoNombre()}</span>
                <span>•</span>
                <CiudadBadge ciudad={cursoCiudad} />
                <ModalidadBadge modalidad={cursoModalidad} />
              </div>
            </div>
          </div>

          {/* Adjacent Pagination controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <span className="text-xs font-semibold text-slate-600 px-2 whitespace-nowrap">
                Solicitud {adjacent.position} de {adjacent.total || 1}
              </span>
              <button
                onClick={() => adjacent.prev_id && navigateTo(adjacent.prev_id)}
                disabled={!adjacent.prev_id}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Solicitud anterior"
                type="button"
              >
                <HugeiconsIcon icon={ArrowLeft02Icon} size={15} />
              </button>
              <button
                onClick={() => adjacent.next_id && navigateTo(adjacent.next_id)}
                disabled={!adjacent.next_id}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Siguiente solicitud"
                type="button"
              >
                <HugeiconsIcon icon={ArrowRight02Icon} size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {adjacent.stale && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between text-xs sm:text-sm text-amber-900 font-medium">
            <span>
              Esta solicitud ya fue procesada anteriormente — Estado: <strong className="capitalize">{adjacent.stale_estado?.replace(/_/g, " ") || "—"}</strong>
            </span>
            {adjacent.first_id && (
              <button
                onClick={() => navigateTo(adjacent.first_id!)}
                className="px-3 py-1 rounded-lg text-xs font-bold border border-amber-300 bg-white hover:bg-amber-100 transition-colors cursor-pointer"
              >
                Ir a siguiente pendiente
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Sticky Persistent Tabs Bar */}
      <aside className="sticky top-[61px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Pestañas de solicitud" className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pt-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={`relative flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer border-b-2 font-bold ${
                    isActive
                      ? "text-[#fd761a] border-[#fd761a]"
                      : "text-slate-500 hover:text-slate-900 border-transparent font-semibold"
                  }`}
                >
                  <HugeiconsIcon icon={tab.icon} size={17} />
                  <span>{tab.label}</span>
                  {tab.id === "pago" && !isAprobado && (
                    <span className="w-2 h-2 rounded-full bg-[#fd761a]" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-8">
        {activeTab === "resumen" && (
          <SolicitudResumenTab
            selected={selected}
            getCursoNombre={getCursoNombre}
            setExpandedImageUrl={setExpandedImageUrl}
            cursoCatalogo={cursoCatalogo}
            cursoPrecio={cursoPrecio}
            cursoModalidad={cursoModalidad}
            cursoCiudad={cursoCiudad}
            cursoHorario={cursoHorario}
            onSelectTab={(t) => setActiveTab(t)}
          />
        )}

        {activeTab === "estudiante" && (
          <SolicitudEstudianteTab
            selected={selected}
            editField={editField}
            editVal={editVal}
            startEdit={startEdit}
            setEditVal={setEditVal}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            savingEdit={savingEdit}
          />
        )}

        {activeTab === "curso" && (
          <SolicitudCursoTab
            selected={selected}
            getCursoNombre={getCursoNombre}
            cursosAbiertosList={cursosAbiertosList}
            filteredCursosAbiertos={filteredCursosAbiertos}
            searchCursoQuery={searchCursoQuery}
            setSearchCursoQuery={setSearchCursoQuery}
            editCursoField={editCursoField}
            editCursoVal={editCursoVal}
            setEditCursoField={setEditCursoField}
            setEditCursoVal={setEditCursoVal}
            saveCursoEdit={saveCursoEdit}
            savingCursoEdit={savingCursoEdit}
            loadCursosAbiertos={loadCursosAbiertos}
            cursoCatalogo={cursoCatalogo}
            cursoModalidad={cursoModalidad}
            cursoDocente={cursoDocente}
            cursoCiudad={cursoCiudad}
            cursoHorario={cursoHorario}
            cursoInicio={cursoInicio}
            cursoFin={cursoFin}
            cursoPrecio={cursoPrecio}
            yaProcesada={yaProcesada}
            totalAbonado={selected?.lineas_pago?.total_abonado || 0}
          />
        )}

        {activeTab === "pago" && (
          <SolicitudPagoTab
            selected={selected}
            yaProcesada={yaProcesada}
            editPagoField={editPagoField}
            editPagoVal={editPagoVal}
            startEditPago={startEditPago}
            setEditPagoVal={setEditPagoVal}
            saveEditPago={saveEditPago}
            cancelEditPago={cancelEditPago}
            savingPagoEdit={savingPagoEdit}
            comprobanteRef={comprobanteRef}
            handleUploadComprobante={handleUploadComprobante}
            uploadingComprobante={uploadingComprobante}
            expandedComprobante={expandedComprobante}
            setExpandedComprobante={setExpandedComprobante}
            setDeleteArchivoModal={setDeleteArchivoModal}
            deletingComprobante={deletingComprobante}
            setExpandedImageUrl={setExpandedImageUrl}
            pagoRef={pagoRef}
            getCursoNombre={getCursoNombre}
            setMontoValido={setMontoValido}
            setTotalPrecioModulos={setTotalPrecioModulos}
            handleApprove={handleApprove}
            setSelected={setSelected}
            editandoMontos={editandoMontos}
            editMontosValues={editMontosValues}
            editPreciosValues={editPreciosValues}
            editMotivosValues={editMotivosValues}
            onStartEditMontos={startEditMontos}
            onCancelMontos={cancelEditMontos}
            onEditMontoChange={editMontoChange}
            onEditPrecioChange={editPrecioChange}
            onSaveMontos={saveEditMontos}
            savingMontos={savingMontos}
          />
        )}

        {activeTab === "documento" && (
          <SolicitudDocumentoTab
            selected={selected}
            cedulaRef={cedulaRef}
            handleUploadCedula={handleUploadCedula}
            uploadingCedula={uploadingCedula}
            deletingCedula={deletingCedula}
            setDeleteArchivoModal={setDeleteArchivoModal}
            setExpandedImageUrl={setExpandedImageUrl}
          />
        )}
      </main>

      {/* 4. Sticky Bottom Approval Bar (Persistent across all tabs) */}
      <footer className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Validation Checklist Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} className="text-emerald-600" />
              Estudiante verificado
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-900 border border-orange-200 whitespace-nowrap">
              <HugeiconsIcon icon={PaymentIcon} size={14} className="text-[#fd761a]" />
              {montoValido ? `Distribución: $${Number(selected.pago?.monto_solicitado || 0).toFixed(2)}` : "Configurar distribución"}
            </span>

            {selected.pago?.comprobante?.cedula_url && !selected.pago?.comprobante?.cedula_purgado ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} className="text-emerald-600" />
                Cédula adjunta
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                Cédula no adjunta
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setConfirmReject(true)}
              disabled={actionLoading || yaProcesada}
              type="button"
              className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={17} />
              <span>Rechazar matrícula</span>
            </button>

            <button
              onClick={() => pagoRef.current?.submit()}
              disabled={actionLoading || !montoValido || yaProcesada}
              type="button"
              className="px-6 py-2.5 rounded-xl bg-[#fd761a] hover:bg-[#ea580c] active:scale-[0.99] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md shadow-orange-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={18} />
                  <span>
                    {yaProcesada ? "Matrícula procesada" : "Aprobar matrícula"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RejectModal
        isOpen={confirmReject}
        isLoading={actionLoading}
        onConfirm={handleReject}
        onCancel={() => setConfirmReject(false)}
      />

      <ConfirmationModal
        isOpen={deleteArchivoModal !== null}
        title="Eliminar archivo del almacenamiento"
        message={`¿Eliminar la imagen de la ${deleteArchivoModal?.label} del almacenamiento? El registro se conservará como constancia histórica. Esta acción es irreversible.`}
        confirmText="Eliminar archivo"
        cancelText="Cancelar"
        isLoading={deleteArchivoModal?.type === "comprobante" ? deletingComprobante : deletingCedula}
        icon="danger"
        onConfirm={() => deleteArchivoModal?.type === "comprobante" ? handleDeleteComprobante() : handleDeleteCedula()}
        onCancel={() => setDeleteArchivoModal(null)}
      />

      {expandedImageUrl && (
        <ImageZoom url={expandedImageUrl} onClose={() => setExpandedImageUrl(null)} />
      )}

      <ModalReconciliacionCurso
        isOpen={modalReconciliacionOpen}
        oldCursoNombre={getCursoNombre()}
        newCursoNombre={nuevoCursoNombre}
        modulosNuevoCurso={nuevosModulos.map((m: any) => ({
          id: m.id || null,
          nombre: m.nombre_modulo || m.nombre || `Módulo ${m.orden || "—"}`,
          tipo: m.tipo || "modulo",
          monto_ajustado: Number(m.monto_ajustado || m.precio_base || 0),
        }))}
        totalAbonadoActual={selected?.lineas_pago?.total_abonado || 0}
        oldMontosAbonados={[
          ...(selected?.lineas_pago?.modulos || []).map((m: any) => m.monto_abonado || 0),
          ...(selected?.lineas_pago?.inscripcion ? [selected.lineas_pago.inscripcion.monto_abonado || 0] : []),
        ]}
        onConfirm={handleReconciliarCurso}
        onCancel={() => { setModalReconciliacionOpen(false); setCursoIdPropuesto(null) }}
        loading={reconciliando}
      />
    </div>
  )
}
