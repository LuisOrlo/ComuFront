/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle04Icon, Cancel01Icon, ArrowLeft01Icon, ArrowLeft02Icon, ArrowRight02Icon,
  UserIcon, BookOpenIcon, PaymentIcon, Image01Icon, DashboardSquareIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
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
import { toast } from "sonner"
import axios from "axios"

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
    try {
      const [detalle, data] = await Promise.all([
        cursosService.getSolicitudInscripcionById(targetId),
        cursosService.getSolicitudAdjacent(targetId, filtros),
      ])
      setSelected(detalle)
      setAdjacent(data)
      window.history.replaceState(null, "", `/matriculas/aprobacion/solicitud/${targetId}${searchStr}`)
    } catch {
      toast.error("Error al cargar solicitud")
    }
  }, [filtros, searchStr])

  useEffect(() => { fetchDetail(); fetchAdjacent() }, [fetchDetail, fetchAdjacent])

  const loadCursosAbiertos = useCallback(async () => {
    try {
      const res = await cursosService.getCursos({ per_page: 100 }, 1)
      setCursosAbiertosList((res as any).data || [])
    } catch { /* silent */ }
  }, [])

  const getCursoNombre = useCallback(() => selected?.curso?.nombre || "—", [selected])

  const filteredCursosAbiertos = useMemo(() => {
    if (!searchCursoQuery.trim()) return cursosAbiertosList
    const query = searchCursoQuery.toLowerCase()
    return cursosAbiertosList.filter((c: any) => (c.nombre || c.id || "").toLowerCase().includes(query))
  }, [cursosAbiertosList, searchCursoQuery])

  const cursoInicio = selected?.curso?.fechas?.inicio?.split("T")[0] || "—"
  const cursoPrecio = selected?.curso?.precio_base || 0
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

  const startEditPago = (field: string, value: string) => {
    setEditPagoField(field)
    setEditPagoVal(value.includes("T") ? value.split("T")[0] : value)
  }
  const cancelEditPago = () => { setEditPagoField(null); setEditPagoVal("") }

  const saveEditPago = async () => {
    if (!id || editPagoField !== "fecha_pago_declarada" || !editPagoVal) return
    setSavingPagoEdit(true)
    try {
      await cursosService.actualizarPago(id, { fecha_pago_declarada: editPagoVal })
      setSelected((prev: any) => prev ? { ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, fecha_pago_declarada: editPagoVal } } } : prev)
      toast.success("Fecha de pago actualizada")
      setEditPagoField(null); setEditPagoVal("")
      fetchDetail()
    } catch (err) {
      toast.error((err as any)?.response?.data?.mensaje || "Error al guardar fecha")
    } finally { setSavingPagoEdit(false) }
  }

  const handleUploadCedula = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    const error = validarImagen(file, 2)
    if (error) { toast.error(error); return }
    setUploadingCedula(true)
    try {
      const form = new FormData(); form.append("archivo", file)
      const token = localStorage.getItem("auth_token")
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/academic/solicitudes-inscripcion/${id}/cedula`, form,
        { headers: { Accept: "application/json", Authorization: token ? `Bearer ${token}` : "" } })
      setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, cedula_url: res.data.data.cedula_url } } }))
      toast.success("Cédula subida")
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
      const form = new FormData(); form.append("archivo", file)
      const token = localStorage.getItem("auth_token")
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/academic/solicitudes-inscripcion/${id}/comprobante`, form,
        { headers: { Accept: "application/json", Authorization: token ? `Bearer ${token}` : "" } })
      setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, url: res.data.data.comprobante_url } } }))
      toast.success("Comprobante subido")
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

  const advanceOrReturn = () => {
    if (adjacent.next_id) navigateTo(adjacent.next_id)
    else navigate(`/matriculas${searchStr}`)
  }

  const handleApprove = async (pagos: any[], metodoPago: string, inscripcion?: { total: number; cubierto: number }) => {
    if (!id) return
    setActionLoading(true)
    try {
      const payload: Record<string, unknown> = { pagos, metodo_pago: metodoPago }
      if (inscripcion && inscripcion.total > 0) { payload.precio_inscripcion = inscripcion.total; payload.inscripcion_cubierta = inscripcion.cubierto }
      await cursosService.aprobarSolicitudInscripcion(id, payload)
      toast.success(inscripcion && inscripcion.total > 0 ? "Matrícula aprobada. El cargo de inscripción queda pendiente de pago." : "Matrícula aprobada y pago registrado")
      advanceOrReturn()
    } catch (err) {
      toast.error((err as any)?.response?.data?.mensaje || "Error al aprobar")
    } finally { setActionLoading(false) }
  }

  const handleReject = async (motivo: string) => {
    if (!id) return
    setActionLoading(true)
    try {
      await cursosService.rechazarSolicitudInscripcion(id, motivo)
      toast.success("Solicitud rechazada")
      advanceOrReturn()
    } catch (err) {
      toast.error((err as any)?.response?.data?.mensaje || "Error al rechazar")
    } finally { setActionLoading(false) }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
        <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="max-w-[900px] mx-auto px-6 py-6">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/matriculas")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} style={{ color: COLORS.CHARCOAL }} />
              </button>
              <h1 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>Detalle de Solicitud</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
        <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="max-w-[900px] mx-auto px-6 py-6">
            <button onClick={() => navigate("/matriculas")} className="flex items-center gap-2 text-sm font-medium" style={{ color: COLORS.ACCENT }}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />Volver
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>No se encontró la solicitud</p>
        </div>
      </div>
    )
  }

  const estadoValor = selected?.estado?.valor
  const yaProcesada = estadoValor === "matricula_creada" || estadoValor === "aprobado" || estadoValor === "rechazado" || estadoValor === "cancelado"

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[900px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/matriculas${searchStr}`)} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} style={{ color: COLORS.CHARCOAL }} />
              </button>
              <div>
                <h1 className="text-base font-bold" style={{ color: COLORS.CHARCOAL }}>
                  {selected.solicitante?.datos?.nombres || "—"} {selected.solicitante?.datos?.apellidos || ""}
                </h1>
                <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>{getCursoNombre()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              <span className="font-semibold whitespace-nowrap" style={{ color: COLORS.CHARCOAL }}>
                Solicitud {adjacent.position} de {adjacent.total}
              </span>
              <div className="flex gap-1">
                <button onClick={() => adjacent.prev_id && navigateTo(adjacent.prev_id)} disabled={!adjacent.prev_id}
                  className="size-7 flex items-center justify-center rounded-lg border hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <HugeiconsIcon icon={ArrowLeft02Icon} size={14} style={{ color: COLORS.CHARCOAL }} />
                </button>
                <button onClick={() => adjacent.next_id && navigateTo(adjacent.next_id)} disabled={!adjacent.next_id}
                  className="size-7 flex items-center justify-center rounded-lg border hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <HugeiconsIcon icon={ArrowRight02Icon} size={14} style={{ color: COLORS.CHARCOAL }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {adjacent.stale && (
        <div className="bg-amber-50 border-b" style={{ borderColor: "oklch(0.85 0.12 80)" }}>
          <div className="max-w-[900px] mx-auto px-6 py-3 flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: "oklch(0.5 0.1 70)" }}>
              Esta solicitud ya fue procesada — Estado: <span className="font-bold capitalize">{adjacent.stale_estado?.replace(/_/g, " ") || "—"}</span>
            </span>
            {adjacent.first_id && (
              <button onClick={() => navigateTo(adjacent.first_id!)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-amber-100"
                style={{ borderColor: "oklch(0.85 0.12 80)", color: "oklch(0.5 0.1 70)" }}>
                Ir a siguiente pendiente
              </button>
            )}
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[900px] mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all"
                style={{ borderColor: activeTab === tab.id ? COLORS.ACCENT : "transparent", color: activeTab === tab.id ? COLORS.CHARCOAL : COLORS.TEXT_MUTED }}>
                <HugeiconsIcon icon={tab.icon} size={14} />{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[900px] mx-auto w-full px-6 py-6">
          <div className="bg-white rounded-2xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="p-6">
              {activeTab === "resumen" && (
                <SolicitudResumenTab selected={selected} getCursoNombre={getCursoNombre}
                  setExpandedImageUrl={setExpandedImageUrl} cursoCatalogo={cursoCatalogo}
                  cursoPrecio={cursoPrecio} cursoModalidad={cursoModalidad} cursoCiudad={cursoCiudad} cursoHorario={cursoHorario} />
              )}
              {activeTab === "estudiante" && (
                <SolicitudEstudianteTab selected={selected} editField={editField} editVal={editVal}
                  startEdit={startEdit} setEditVal={setEditVal} saveEdit={saveEdit} cancelEdit={cancelEdit} savingEdit={savingEdit} />
              )}
              {activeTab === "curso" && (
                <SolicitudCursoTab selected={selected} getCursoNombre={getCursoNombre}
                  cursosAbiertosList={cursosAbiertosList} filteredCursosAbiertos={filteredCursosAbiertos}
                  searchCursoQuery={searchCursoQuery} setSearchCursoQuery={setSearchCursoQuery}
                  editCursoField={editCursoField} editCursoVal={editCursoVal}
                  setEditCursoField={setEditCursoField} setEditCursoVal={setEditCursoVal}
                  saveCursoEdit={saveCursoEdit} savingCursoEdit={savingCursoEdit} loadCursosAbiertos={loadCursosAbiertos}
                  cursoCatalogo={cursoCatalogo} cursoModalidad={cursoModalidad} cursoDocente={cursoDocente}
                  cursoCiudad={cursoCiudad} cursoHorario={cursoHorario} cursoInicio={cursoInicio} cursoFin={cursoFin} cursoPrecio={cursoPrecio} />
              )}
              {activeTab === "pago" && (
                <SolicitudPagoTab selected={selected} yaProcesada={yaProcesada}
                  editPagoField={editPagoField} editPagoVal={editPagoVal}
                  startEditPago={startEditPago} setEditPagoVal={setEditPagoVal}
                  saveEditPago={saveEditPago} cancelEditPago={cancelEditPago} savingPagoEdit={savingPagoEdit}
                  comprobanteRef={comprobanteRef} handleUploadComprobante={handleUploadComprobante}
                  uploadingComprobante={uploadingComprobante} expandedComprobante={expandedComprobante}
                  setExpandedComprobante={setExpandedComprobante}
                  setDeleteArchivoModal={setDeleteArchivoModal} deletingComprobante={deletingComprobante}
                  setExpandedImageUrl={setExpandedImageUrl} pagoRef={pagoRef} getCursoNombre={getCursoNombre}
                  setMontoValido={setMontoValido}
                  setTotalPrecioModulos={setTotalPrecioModulos} handleApprove={handleApprove} setSelected={setSelected} />
              )}
              {activeTab === "documento" && (
                <SolicitudDocumentoTab selected={selected} cedulaRef={cedulaRef}
                  handleUploadCedula={handleUploadCedula} uploadingCedula={uploadingCedula}
                  deletingCedula={deletingCedula} setDeleteArchivoModal={setDeleteArchivoModal}
                  setExpandedImageUrl={setExpandedImageUrl} />
              )}
            </div>
          </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t z-10" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[900px] mx-auto px-6 py-4">
          <div className="flex gap-3">
            <button onClick={() => setConfirmReject(true)} disabled={yaProcesada}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-red-50 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: "oklch(0.50 0.15 10 / 0.3)", color: "oklch(0.50 0.15 10)" }}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} className="inline mr-1.5" />Rechazar
            </button>
            <button onClick={() => pagoRef.current?.submit()}
              disabled={actionLoading || !montoValido || yaProcesada}
              className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-60"
              style={{ backgroundColor: COLORS.ACCENT }}>
              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />Aprobar
            </button>
          </div>
        </div>
      </div>

      <RejectModal isOpen={confirmReject} isLoading={actionLoading} onConfirm={handleReject} onCancel={() => setConfirmReject(false)} />
      <ConfirmationModal isOpen={deleteArchivoModal !== null} title="Eliminar archivo del almacenamiento"
        message={`¿Eliminar la imagen de la ${deleteArchivoModal?.label} del almacenamiento? El registro se conservará como constancia histórica. Esta acción es irreversible.`}
        confirmText="Eliminar archivo" cancelText="Cancelar"
        isLoading={deleteArchivoModal?.type === "comprobante" ? deletingComprobante : deletingCedula}
        icon="danger" onConfirm={() => deleteArchivoModal?.type === "comprobante" ? handleDeleteComprobante() : handleDeleteCedula()}
        onCancel={() => setDeleteArchivoModal(null)} />
      {expandedImageUrl && <ImageZoom url={expandedImageUrl} onClose={() => setExpandedImageUrl(null)} />}
    </div>
  )
}
