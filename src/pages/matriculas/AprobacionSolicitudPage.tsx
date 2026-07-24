/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useParams, useNavigate, useLocation } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle04Icon,
  Cancel01Icon,
  ArrowLeft01Icon,
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
  Calendar03Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { cursosService, type CursoAbierto } from "@/services/cursos.service"
import { PagoPreAprobacionSection, type PagoPreAprobacionRef } from "./PagoPreAprobacionSection"
import { Section, SubCategory, InfoItem, EF } from "./AprobacionHelpers"
import { getFieldValue, fixImageUrl, validarImagen, calcularEdad } from "./AprobacionUtils"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { RejectModal } from "@/components/RejectModal"
import { ImageZoom } from "./ImageZoom"
import { toast } from "sonner"
import axios from "axios"

type TabId = "estudiante" | "curso" | "pago" | "documento"

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "estudiante", label: "Estudiante", icon: UserIcon },
  { id: "curso", label: "Curso", icon: BookOpenIcon },
  { id: "pago", label: "Pago", icon: PaymentIcon },
  { id: "documento", label: "Copia de cédula", icon: Image01Icon },
]

export function AprobacionSolicitudPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const navState = location.state as { nombre?: string; apellido?: string; cursoNombre?: string } | undefined
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("estudiante")

  const [editField, setEditField] = useState<string | null>(null)
  const [editVal, setEditVal] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

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
  const [montoModulo1Valido, setMontoModulo1Valido] = useState(false)
  const [, setTotalPrecioModulos] = useState(-1)
  const [actionLoading, setActionLoading] = useState(false)

  const [confirmReject, setConfirmReject] = useState(false)

  const fetchDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const detalle = await cursosService.getSolicitudInscripcionById(id)
      setSelected(detalle)
    } catch {
      toast.error("Error al cargar detalle")
    } finally {
      setLoading(false)
    }
  }, [id])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])
  /* eslint-enable react-hooks/set-state-in-effect */

  const loadCursosAbiertos = useCallback(async () => {
    try {
      const res = await cursosService.getCursos({ per_page: 100 }, 1)
      setCursosAbiertosList((res as any).data || [])
    } catch { /* silent */ }
  }, [])

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

  const solicitudRaw = selected

  const cursoInicio = selected?.curso?.fechas?.inicio?.split("T")[0] || "—"
  const cursoPrecio = selected?.curso?.precio_base || 0

  const startEdit = (field: string, value: string) => { setEditField(field); setEditVal(value) }
  const cancelEdit = () => { setEditField(null); setEditVal("") }

  const saveEdit = async () => {
    if (!id || !editField || editVal === "") return
    setSavingEdit(true)
    try {
      const data: any = {}
      data[editField] = editVal
      if (editField === "fecha_nacimiento") {
        data.edad = calcularEdad(editVal)
      }
      await cursosService.actualizarEstudiante(id, data)
      setSelected((prev: any) => {
        if (!prev) return prev
        const updated = { ...prev }
        if (updated.solicitante?.datos) {
          const datos = { ...updated.solicitante.datos }
          if (datos.perfil_estudiante) {
            datos.perfil_estudiante = { ...datos.perfil_estudiante, [editField]: editVal, ...(editField === "fecha_nacimiento" ? { edad: calcularEdad(editVal) } : {}) }
          } else {
            datos[editField] = editVal
          }
          updated.solicitante = { ...updated.solicitante, datos }
        }
        return updated
      })
      toast.success("Dato actualizado correctamente")
      setEditField(null); setEditVal("")
      fetchDetail()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al guardar cambio")
    } finally {
      setSavingEdit(false)
    }
  }

  const saveCursoEdit = async () => {
    if (!id || !editCursoField) return
    setSavingCursoEdit(true)
    try {
      await cursosService.actualizarCurso(id, { curso_abierto_id: editCursoVal })
      const selectedCurso = cursosAbiertosList.find((c: any) => c.id === editCursoVal)
      const cursoNombre = selectedCurso?.nombre_instancia || selectedCurso?.catalogo?.nombre || editCursoVal
      setSelected((prev: any) => {
        if (!prev) return prev
        return { ...prev, curso: { ...prev.curso, nombre: cursoNombre, id: editCursoVal } }
      })
      toast.success("Curso actualizado")
      setEditCursoField(null); setEditCursoVal("")
      fetchDetail()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al guardar curso")
    } finally {
      setSavingCursoEdit(false)
    }
  }

  const handleUploadCedula = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    const error = validarImagen(file, 2)
    if (error) { toast.error(error); return }
    setUploadingCedula(true)
    try {
      const form = new FormData()
      form.append("archivo", file)
      const token = localStorage.getItem("auth_token")
      const base = import.meta.env.VITE_API_URL
      const res = await axios.post(`${base}/academic/solicitudes-inscripcion/${id}/cedula`, form, {
        headers: { Accept: "application/json", Authorization: token ? `Bearer ${token}` : "" },
      })
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
      const form = new FormData()
      form.append("archivo", file)
      const token = localStorage.getItem("auth_token")
      const base = import.meta.env.VITE_API_URL
      const res = await axios.post(`${base}/academic/solicitudes-inscripcion/${id}/comprobante`, form, {
        headers: { Accept: "application/json", Authorization: token ? `Bearer ${token}` : "" },
      })
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

  const handleApprove = async (pagos: any[], metodoPago: string, inscripcion?: { total: number; cubierto: number }) => {
    if (!id) return
    setActionLoading(true)
    try {
      const payload: Record<string, unknown> = { pagos, metodo_pago: metodoPago }
      if (inscripcion && inscripcion.total > 0) {
        payload.precio_inscripcion = inscripcion.total
        payload.inscripcion_cubierta = inscripcion.cubierto
      }
      await cursosService.aprobarSolicitudInscripcion(id, payload)
      toast.success(inscripcion && inscripcion.total > 0
        ? "Matrícula aprobada. El cargo de inscripción queda pendiente de pago."
        : "Matrícula aprobada y pago registrado")
      navigate("/matriculas")
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al aprobar")
    } finally { setActionLoading(false) }
  }

  const handleReject = async (motivo: string) => {
    if (!id) return
    setActionLoading(true)
    try {
      await cursosService.rechazarSolicitudInscripcion(id, motivo)
      toast.success("Solicitud rechazada")
      navigate("/matriculas")
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al rechazar")
    } finally { setActionLoading(false) }
  }

  const AZUL = "oklch(0.55 0.15 240)"
  const VERDE = "oklch(0.55 0.15 160)"
  const PURPURA = "oklch(0.55 0.12 300)"
  const AMBAR = "oklch(0.65 0.15 75)"

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

  const estadoValor = solicitudRaw?.estado?.valor
  const yaProcesada = estadoValor === "matricula_creada" || estadoValor === "aprobado" || estadoValor === "rechazado" || estadoValor === "cancelado"

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[900px] mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/matriculas")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} style={{ color: COLORS.CHARCOAL }} />
            </button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>
                {selected.solicitante?.datos?.nombres || navState?.nombre || "—"} {selected.solicitante?.datos?.apellidos || navState?.apellido || ""}
              </h1>
              <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                {getCursoNombre() || navState?.cursoNombre || ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[900px] mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all"
                style={{
                  borderColor: activeTab === tab.id ? COLORS.ACCENT : "transparent",
                  color: activeTab === tab.id ? COLORS.ACCENT : COLORS.TEXT_MUTED,
                }}>
                <HugeiconsIcon icon={tab.icon} size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[900px] mx-auto w-full px-6 py-6">
        <div className="bg-white rounded-2xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="p-6">
            {activeTab === "estudiante" && (
              <Section title="Datos del Estudiante" icon={UserIcon}>
                <div className="space-y-3">
                  <SubCategory title="Información Personal" color={AZUL}>
                    <EF icon={UserIcon} label="Nombres" field="nombres" data={selected.solicitante?.datos}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
                    <EF icon={UserIcon} label="Apellidos" field="apellidos" data={selected.solicitante?.datos}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
                    <EF icon={SearchIcon} label="Cédula" field="cedula" data={selected.solicitante?.datos} bold
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
                    <EF icon={Calendar03Icon} label="Fecha Nacimiento" field="fecha_nacimiento" data={selected.solicitante?.datos}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} inputType="date" groupColor={AZUL} />
                    <InfoItem icon={Calendar03Icon} label="Edad" value={getFieldValue(selected.solicitante?.datos, "edad")} groupColor={AZUL} />
                    <EF icon={UserIcon} label="Ocupación" field="ocupacion" data={selected.solicitante?.datos}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
                    <EF icon={UserIcon} label="Estado Civil" field="estado_civil" data={selected.solicitante?.datos}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={AZUL} />
                  </SubCategory>
                  <SubCategory title="Contacto" color={VERDE}>
                    <EF icon={MailIcon} label="Correo" field="correo" data={selected.solicitante?.datos}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={VERDE} />
                    <EF icon={CallIcon} label="Teléfono" field="celular" data={selected.solicitante?.datos}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={VERDE} />
                  </SubCategory>
                  <SubCategory title="Ubicación" color={PURPURA}>
                    <EF icon={Location01Icon} label="Dirección" field="direccion" data={selected.solicitante?.datos}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={PURPURA} />
                    <EF icon={Location01Icon} label="Ciudad" field="ciudad" data={selected.solicitante?.datos}
                      editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} groupColor={PURPURA} />
                  </SubCategory>
                </div>
              </Section>
            )}

            {activeTab === "curso" && (
              <Section title="Curso" icon={BookOpenIcon}>
                <div className="p-4 rounded-xl space-y-2" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 6%, transparent)`, borderLeft: `3px solid ${(solicitudRaw as any)?.curso_abierto?.catalogo?.color || (solicitudRaw as any)?.curso?.color || COLORS.ACCENT}` }}>
                  <div className="grid grid-cols-2 gap-2">
                    {editCursoField === "curso" ? (
                      <div className="col-span-2 space-y-2.5">
                        <div className="flex items-center gap-2 text-sm">
                          <HugeiconsIcon icon={BookOpenIcon} size={14} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                          <span style={{ color: COLORS.TEXT_MUTED }}>Buscar y seleccionar curso:</span>
                        </div>
                        <input type="text" placeholder="Escribe el nombre del curso..."
                          value={searchCursoQuery} onChange={e => setSearchCursoQuery(e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded-lg outline-none bg-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500"
                          style={{ borderColor: COLORS.BORDER_SUBTLE }} disabled={savingCursoEdit} />
                        <div className="max-h-40 overflow-y-auto border rounded-lg divide-y bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          {filteredCursosAbiertos.length === 0 ? (
                            <div className="p-3 text-sm text-center text-gray-500">No se encontraron cursos</div>
                          ) : (
                            filteredCursosAbiertos.map((c: any) => {
                              const isSelected = editCursoVal === c.id
                              return (
                                <button key={c.id} type="button" onClick={() => setEditCursoVal(c.id)}
                                  className={cn("w-full text-left p-2.5 text-sm flex flex-col gap-0.5 hover:bg-gray-50 transition-colors", isSelected && "bg-blue-50/50 hover:bg-blue-50 font-semibold")}
                                  style={isSelected ? { borderLeft: `3px solid ${COLORS.ACCENT}` } : {}}>
                                  <div className="flex justify-between items-center gap-2">
                                    <span style={{ color: COLORS.CHARCOAL }}>{c.nombre || c.id}</span>
                                    {isSelected && <span className="text-xs text-blue-600 font-bold shrink-0">Seleccionado</span>}
                                  </div>
                                  <div className="flex gap-2 text-xs opacity-60">
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
                        <div className="flex items-center gap-2 text-sm group col-span-2">
                          <HugeiconsIcon icon={BookOpenIcon} size={14} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                          <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0 text-sm">Curso</span>
                          <span className="truncate text-sm" style={{ color: COLORS.CHARCOAL, fontWeight: 700 }}>{getCursoNombre()}</span>
                          <button onClick={() => { setEditCursoField("curso"); setEditCursoVal(selected.curso?.id || ""); setSearchCursoQuery(""); loadCursosAbiertos() }}
                            className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                            <HugeiconsIcon icon={Edit01Icon} size={14} />
                          </button>
                        </div>
                        <InfoItem icon={CalendarIcon} label="Inicio" value={cursoInicio} groupColor={COLORS.ACCENT} />
                        <InfoItem icon={PaymentIcon} label="Precio" value={`$${cursoPrecio || 0}`} bold groupColor={COLORS.ACCENT} />
                      </>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {activeTab === "pago" && (
              <Section title="Pago" icon={PaymentIcon}>
                <div className="space-y-5">
                  <SubCategory title="Datos del Comprobante" color={AMBAR}>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: COLORS.TEXT_MUTED }}>Tipo de pago</span>
                      {selected.pago?.tipo_pago && Number(selected.pago?.monto_solicitado) > 0 ? (
                        <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: "oklch(0.55 0.15 240 / 0.12)", color: "oklch(0.55 0.15 240)", boxShadow: "0 1px 2px oklch(0 0 0 / 0.06)" }}>
                          {(selected.pago.tipo_pago).toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: "oklch(0.5 0 0 / 0.08)", color: "oklch(0.5 0 0)" }}>
                          NO ESPECIFICADO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: COLORS.TEXT_MUTED }}>Comprobante</span>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: "oklch(0.55 0.15 240 / 0.12)", color: "oklch(0.55 0.15 240)", boxShadow: "0 1px 2px oklch(0 0 0 / 0.06)" }}>
                        {(selected.pago?.comprobante?.tipo || "—").toUpperCase()}
                      </span>
                    </div>
                    <InfoItem icon={CalendarIcon} label="Fecha" value={selected.pago?.comprobante?.fecha_pago_declarada?.split?.("T")?.[0] || "—"} groupColor={AMBAR} />
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: COLORS.TEXT_MUTED }}>Monto declarado</span>
                      {Number(selected.pago?.monto_solicitado) > 0 ? (
                        <span className="font-bold text-sm" style={{ color: COLORS.CHARCOAL }}>${Number(selected.pago.monto_solicitado).toLocaleString()}</span>
                      ) : (
                        <span className="italic text-sm opacity-50" style={{ color: COLORS.TEXT_MUTED }}>No especificado</span>
                      )}
                    </div>
                  </SubCategory>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input ref={comprobanteRef} type="file" accept="image/*" className="hidden" onChange={handleUploadComprobante} />
                      <button onClick={() => comprobanteRef.current?.click()} disabled={uploadingComprobante}
                        className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold hover:bg-white transition-colors"
                        style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT, opacity: uploadingComprobante ? 0.6 : 1 }}>
                        <HugeiconsIcon icon={Upload05Icon} size={16} />
                        {uploadingComprobante ? "Subiendo..." : selected.pago?.comprobante?.url ? "Cambiar comprobante" : "Subir comprobante"}
                      </button>
                      {selected.pago?.comprobante?.url && !selected.pago?.comprobante?.comprobante_purgado && (
                        <>
                          <button onClick={() => setExpandedComprobante(!expandedComprobante)}
                            className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold hover:bg-white transition-colors"
                            style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}>
                            <HugeiconsIcon icon={Image01Icon} size={16} />
                            {expandedComprobante ? "Ocultar" : "Ver"}
                          </button>
                          <button onClick={() => setDeleteArchivoModal({ type: "comprobante", label: "comprobante de pago" })} disabled={deletingComprobante}
                            className="p-3 rounded-xl border flex items-center justify-center gap-1 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                            style={{ borderColor: COLORS.BORDER_SUBTLE, color: "oklch(0.50 0.15 10)" }}>
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                    {expandedComprobante && selected.pago?.comprobante?.url && !selected.pago?.comprobante?.comprobante_purgado && (
                      <div className="rounded-xl border overflow-hidden bg-gray-50 cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <img src={fixImageUrl(selected.pago.comprobante.url)} alt="Comprobante"
                          className="w-full object-contain max-h-[400px]"
                          onError={() => setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, comprobante_purgado: true } } }))}
                          onClick={() => setExpandedImageUrl(fixImageUrl(selected.pago.comprobante.url))} />
                      </div>
                    )}
                    {selected.pago?.comprobante?.comprobante_purgado && (
                      <div className="p-3 rounded-xl border text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                          <HugeiconsIcon icon={Image01Icon} size={12} />
                          Comprobante eliminado del almacenamiento
                        </span>
                      </div>
                    )}
                  </div>

                  {!yaProcesada && selected?.curso?.id && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: AMBAR }}>
                        Asignar montos a módulos
                      </p>
                      <p className="text-xs mb-3" style={{ color: COLORS.TEXT_MUTED }}>
                        Distribuye el monto del comprobante entre los módulos del curso. El valor que ingreses en cada módulo será el monto registrado como pago.
                      </p>
                      <PagoPreAprobacionSection
                        ref={pagoRef}
                        cursoAbiertoId={selected.curso.id}
                        cursoNombre={getCursoNombre()}
                        metodoPagoInicial={selected.pago?.comprobante?.tipo || "efectivo"}
                        montoSolicitado={Number(selected.pago?.monto_solicitado) || 0}
                        onMontoModulo1Change={setMontoModulo1Valido}
                        onTotalPrecioChange={setTotalPrecioModulos}
                        onSubmit={(pagos, metodoPago) => handleApprove(pagos, metodoPago)}
                      />
                    </div>
                  )}

                  {(selected?.lineas_pago?.modulos?.length > 0 || selected?.lineas_pago?.inscripcion) && (
                    <div className="p-4 rounded-xl border space-y-2" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.97 0 0)" }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Resumen de pagos</span>
                        <span className="text-xs font-bold" style={{ color: COLORS.ACCENT }}>
                          {selected.lineas_pago.modulos_pagados}/{selected.lineas_pago.modulos_count} módulos pagados
                        </span>
                      </div>
                      {selected.lineas_pago.modulos.map((lp: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span style={{ color: COLORS.CHARCOAL }}>{lp.modulo_nombre}</span>
                          <div className="flex items-center gap-3">
                            <span className="opacity-50 text-sm">${lp.monto_ajustado.toLocaleString()}</span>
                            <span className="font-medium text-sm" style={{ color: lp.monto_abonado > 0 ? "oklch(0.55 0.15 150)" : "oklch(0.5 0.15 20)" }}>
                              ${lp.monto_abonado.toLocaleString()}
                            </span>
                            <span className={cn("text-[10px] font-bold uppercase px-1 py-0.5 rounded-full",
                              lp.estado === "pagado" ? "bg-green-100 text-green-700" :
                              lp.estado === "abonado" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            )}>{lp.estado === "pagado" ? "Pagado" : lp.estado === "abonado" ? "Parcial" : "Pendiente"}</span>
                          </div>
                        </div>
                      ))}
                      {selected.lineas_pago.inscripcion && (
                        <div className="flex items-center justify-between text-sm border-t pt-2 mt-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          <span style={{ color: COLORS.CHARCOAL }}>Inscripción / Matrícula</span>
                          <div className="flex items-center gap-3">
                            <span className="opacity-50 text-sm">${selected.lineas_pago.inscripcion.monto_ajustado.toLocaleString()}</span>
                            <span className="font-medium text-sm" style={{ color: selected.lineas_pago.inscripcion.monto_abonado > 0 ? "oklch(0.55 0.15 150)" : "oklch(0.5 0.15 20)" }}>
                              ${selected.lineas_pago.inscripcion.monto_abonado.toLocaleString()}
                            </span>
                            <span className={cn("text-[10px] font-bold uppercase px-1 py-0.5 rounded-full",
                              selected.lineas_pago.inscripcion.estado === "pagado" ? "bg-green-100 text-green-700" :
                              selected.lineas_pago.inscripcion.estado === "abonado" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            )}>{selected.lineas_pago.inscripcion.estado === "pagado" ? "Pagado" : selected.lineas_pago.inscripcion.estado === "abonado" ? "Parcial" : "Pendiente"}</span>
                          </div>
                        </div>
                      )}
                      <div className="border-t pt-2 mt-2 flex justify-between text-sm font-bold" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <span style={{ color: COLORS.CHARCOAL }}>Total abonado</span>
                        <span style={{ color: "oklch(0.55 0.15 150)" }}>
                          ${selected.lineas_pago.total_abonado.toLocaleString()} de ${selected.lineas_pago.total_esperado.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {activeTab === "documento" && (
              <Section title="Copia de Cédula" icon={Image01Icon}>
                <div className="p-4 rounded-xl" style={{ backgroundColor: `color-mix(in srgb, ${PURPURA} 6%, transparent)`, borderLeft: `3px solid ${PURPURA}` }}>
                  {selected.pago?.comprobante?.cedula_url && !selected.pago?.comprobante?.cedula_purgado ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium opacity-40">Imagen actual</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
                            className="flex items-center gap-1 text-xs font-semibold" style={{ color: COLORS.ACCENT }}>
                            <HugeiconsIcon icon={Edit01Icon} size={12} />Cambiar
                          </button>
                          <button onClick={() => setDeleteArchivoModal({ type: "cedula", label: "cédula de identidad" })} disabled={deletingCedula}
                            className="flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
                            style={{ color: "oklch(0.50 0.15 10)" }}>
                            {deletingCedula ? "..." : "✕ Eliminar"}
                          </button>
                        </div>
                      </div>
                      <img src={fixImageUrl(selected.pago.comprobante.cedula_url)} alt="Cédula"
                        className="w-full object-contain max-h-[400px] rounded-xl border cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        onError={() => setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, cedula_purgado: true } } }))}
                        onClick={() => setExpandedImageUrl(fixImageUrl(selected.pago.comprobante.cedula_url))} />
                    </div>
                  ) : selected.pago?.comprobante?.cedula_purgado ? (
                    <div className="p-5 rounded-xl border text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                        <HugeiconsIcon icon={Image01Icon} size={12} />
                        Cédula eliminada del almacenamiento
                      </span>
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl border border-dashed text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <p className="text-sm mb-3" style={{ color: COLORS.TEXT_MUTED }}>No se ha subido la foto de cédula</p>
                      <button type="button" onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all active:scale-[0.97]"
                        style={{ backgroundColor: COLORS.ACCENT, opacity: uploadingCedula ? 0.6 : 1 }}>
                        <HugeiconsIcon icon={Upload05Icon} size={14} className="inline mr-1.5" />
                        {uploadingCedula ? "Subiendo..." : "Subir foto de cédula"}
                      </button>
                    </div>
                  )}
                  <input ref={cedulaRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCedula} />
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t z-10" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[900px] mx-auto px-6 py-4">
          <div className="flex gap-3">
            <button onClick={() => setConfirmReject(true)}
              disabled={yaProcesada}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-red-50 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: "oklch(0.50 0.15 10 / 0.3)", color: "oklch(0.50 0.15 10)" }}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} className="inline mr-1.5" />Rechazar
            </button>
            <button onClick={() => pagoRef.current?.submit()}
              disabled={actionLoading || !montoModulo1Valido || yaProcesada}
              className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-60"
              style={{ backgroundColor: COLORS.ACCENT }}>
              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />Aprobar
            </button>
          </div>
        </div>
      </div>

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
    </div>
  )
}
