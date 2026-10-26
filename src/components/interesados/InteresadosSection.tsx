import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  Search,
  MessageCircle,
  Eye,
  Edit2,
  Trash2,
  X,
  Upload,
  Loader2,
  ExternalLink,
  FileText,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { Link } from "react-router"
import {
  interesadosService,
  type Interesado,
  type InteresadosKPIs,
  type GuardarInteresadoPayload,
} from "@/services/interesados.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"

interface InteresadosSectionProps {
  tipo: "curso" | "taller" | "personalizado"
  entidadId: string
  entidadNombre?: string
}

export function InteresadosSection({
  tipo,
  entidadId,
  entidadNombre,
}: InteresadosSectionProps) {
  const [interesados, setInteresados] = useState<Interesado[]>([])
  const [kpis, setKpis] = useState<InteresadosKPIs>({
    total_interesados: 0,
    solicitudes_pendientes: 0,
    matriculados: 0,
    solo_interesados: 0,
    total_anticipos: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("todos")

  // Modal Crear / Editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editingInteresado, setEditingInteresado] = useState<Interesado | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)

  // Form Fields
  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [telefono, setTelefono] = useState("")
  const [cedula, setCedula] = useState("")
  const [correo, setCorreo] = useState("")
  const [registrarAnticipo, setRegistrarAnticipo] = useState(false)
  const [montoPago, setMontoPago] = useState("")
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobanteLocalPreview, setComprobanteLocalPreview] = useState<string | null>(null)
  const [comprobanteUrl, setComprobanteUrl] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Modal Ver Comprobante
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  // Modal Confirmar Eliminar
  const [itemToDelete, setItemToDelete] = useState<Interesado | null>(null)
  const [deleting, setDeleting] = useState(false)

  const cargarDatos = useCallback(async () => {
    if (!entidadId) return
    setLoading(true)
    try {
      const resp =
        tipo === "taller"
          ? await interesadosService.getInteresadosTaller(entidadId)
          : await interesadosService.getInteresadosCurso(entidadId)
      setInteresados(resp?.interesados || [])
      setKpis(
        resp?.kpis || {
          total_interesados: 0,
          solicitudes_pendientes: 0,
          matriculados: 0,
          solo_interesados: 0,
          total_anticipos: 0,
        }
      )
    } catch (error) {
      console.error("Error al cargar interesados:", error)
      toast.error("No se pudo cargar la lista de interesados")
    } finally {
      setLoading(false)
    }
  }, [tipo, entidadId])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const abrirModalCrear = () => {
    setEditingInteresado(null)
    setNombres("")
    setApellidos("")
    setTelefono("")
    setCedula("")
    setCorreo("")
    setRegistrarAnticipo(false)
    setMontoPago("")
    setComprobanteFile(null)
    setComprobanteLocalPreview(null)
    setComprobanteUrl("")
    setObservaciones("")
    if (fileInputRef.current) fileInputRef.current.value = ""
    setModalOpen(true)
  }

  const abrirModalEditar = (item: Interesado) => {
    setEditingInteresado(item)
    setNombres(item.nombres || "")
    setApellidos(item.apellidos || "")
    setTelefono(item.telefono || "")
    setCedula(item.cedula || "")
    setCorreo(item.correo || "")
    const tieneAnticipo = Number(item.monto_pago_anticipo) > 0 || Boolean(item.comprobante_url)
    setRegistrarAnticipo(tieneAnticipo)
    setMontoPago(item.monto_pago_anticipo ? String(item.monto_pago_anticipo) : "")
    setComprobanteFile(null)
    setComprobanteLocalPreview(null)
    setComprobanteUrl(item.comprobante_url || "")
    setObservaciones(item.observaciones || "")
    if (fileInputRef.current) fileInputRef.current.value = ""
    setModalOpen(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo y tamaño (máx 5MB)
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Seleccione una imagen o un archivo PDF válido")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo no debe exceder 5 MB")
      return
    }

    setComprobanteFile(file)
    if (file.type.startsWith("image/")) {
      setComprobanteLocalPreview(URL.createObjectURL(file))
    } else {
      setComprobanteLocalPreview(null)
    }
    toast.info("Comprobante cargado. Se guardará al registrar el interesado.")
  }

  const handleQuitarComprobante = () => {
    setComprobanteFile(null)
    setComprobanteLocalPreview(null)
    setComprobanteUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    toast.success("Comprobante quitado")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombres.trim() || !apellidos.trim()) {
      toast.error("Los nombres y apellidos son requeridos")
      return
    }
    if (!telefono.trim()) {
      toast.error("El número de teléfono es requerido")
      return
    }
    if (telefono.trim().length < 9) {
      toast.error("El número de teléfono debe tener al menos 9 o 10 dígitos")
      return
    }
    if (cedula.trim() && cedula.trim().length !== 10) {
      toast.error("La cédula debe tener exactamente 10 dígitos")
      return
    }

    setFormSubmitting(true)
    try {
      let finalComprobanteUrl: string | null = null

      if (registrarAnticipo) {
        if (comprobanteFile) {
          setUploadingReceipt(true)
          finalComprobanteUrl = await interesadosService.uploadComprobante(comprobanteFile)
          setUploadingReceipt(false)
        } else if (comprobanteUrl) {
          finalComprobanteUrl = comprobanteUrl
        }
      }

      const payload: GuardarInteresadoPayload = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim(),
        cedula: cedula.trim() || undefined,
        correo: correo.trim() || undefined,
        monto_pago_anticipo: registrarAnticipo && montoPago ? parseFloat(montoPago) : 0,
        comprobante_url: finalComprobanteUrl,
        observaciones: observaciones.trim() || undefined,
      }

      if (editingInteresado) {
        await interesadosService.actualizarInteresado(editingInteresado.id, payload)
        toast.success("Interesado actualizado correctamente")
      } else {
        if (tipo === "taller") {
          await interesadosService.crearInteresadoTaller(entidadId, payload)
        } else {
          await interesadosService.crearInteresadoCurso(entidadId, payload)
        }
        toast.success("Interesado registrado exitosamente")
      }
      setModalOpen(false)
      cargarDatos()
    } catch (error: unknown) {
      setUploadingReceipt(false)
      let msg = "Error al guardar el interesado"
      if (typeof error === "object" && error !== null && "response" in error) {
        const errObj = error as { response?: { data?: { message?: string } } }
        if (errObj.response?.data?.message) {
          msg = errObj.response.data.message
        }
      }
      toast.error(msg)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      await interesadosService.eliminarInteresado(itemToDelete.id)
      toast.success("Registro eliminado exitosamente")
      setItemToDelete(null)
      cargarDatos()
    } catch {
      toast.error("Error al eliminar el registro")
    } finally {
      setDeleting(false)
    }
  }

  // Filtrado de lista
  const filteredInteresados = useMemo(() => {
    return interesados.filter((item) => {
      // Filtro de texto
      const search = searchTerm.toLowerCase().trim()
      const matchText =
        !search ||
        item.nombres.toLowerCase().includes(search) ||
        item.apellidos.toLowerCase().includes(search) ||
        item.telefono.includes(search) ||
        (item.cedula && item.cedula.includes(search)) ||
        (item.correo && item.correo.toLowerCase().includes(search))

      // Filtro de estado
      const matchEstado =
        estadoFilter === "todos" || item.estado_embudo === estadoFilter

      return matchText && matchEstado
    })
  }, [interesados, searchTerm, estadoFilter])

  return (
    <div className="space-y-6">
      {/* Encabezado descriptivo */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Lista de Interesados {entidadNombre ? `· ${entidadNombre}` : ""}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro aislado para captar clientes potenciales y registrar anticipos informativos.
          </p>
        </div>

        <button
          onClick={abrirModalCrear}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <UserPlus size={15} />
          Registrar Interesado
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Interesados */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Prospectos
            </span>
            <div className="size-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">
              {kpis.total_interesados}
            </span>
            <span className="text-[11px] text-slate-400">registrados</span>
          </div>
        </div>

        {/* Solo Interesados */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              En Seguimiento
            </span>
            <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageCircle size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-700">
              {kpis.solo_interesados}
            </span>
            <span className="text-[11px] text-blue-500">sin solicitud aún</span>
          </div>
        </div>

        {/* Solicitudes Pendientes */}
        <div className="bg-white rounded-xl border border-amber-200/80 bg-amber-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Solicitud Enviada
            </span>
            <div className="size-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-800">
              {kpis.solicitudes_pendientes}
            </span>
            <span className="text-[11px] text-amber-600">por aprobar</span>
          </div>
        </div>

        {/* Ya Matriculados */}
        <div className="bg-white rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Matriculados
            </span>
            <div className="size-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">
              {kpis.matriculados}
            </span>
            <span className="text-[11px] text-emerald-600">oficialmente</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, cédula, teléfono o email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Estado:</span>
          {(
            [
              { id: "todos", label: "Todos" },
              { id: "solo_interesado", label: "Solo Interesados" },
              { id: "solicitud_pendiente", label: "Solicitud Enviada" },
              { id: "matriculado", label: "Matriculados" },
            ] as const
          ).map((filtro) => (
            <button
              key={filtro.id}
              onClick={() => setEstadoFilter(filtro.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                estadoFilter === filtro.id
                  ? "bg-orange-500 text-white shadow-xs font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {filtro.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Interesados */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 size={28} className="animate-spin text-orange-500" />
            <span className="text-xs">Cargando lista de interesados...</span>
          </div>
        ) : filteredInteresados.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Users size={36} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No hay interesados registrados</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || estadoFilter !== "todos"
                ? "No se encontraron resultados con los filtros actuales."
                : "Agrega clientes potenciales para realizar seguimiento comercial y registrar anticipos."}
            </p>
            {(!searchTerm && estadoFilter === "todos") && (
              <button
                onClick={abrirModalCrear}
                className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-all cursor-pointer"
              >
                <UserPlus size={14} /> Registrar primer interesado
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Interesado</th>
                  <th className="py-3 px-4">Teléfono / WhatsApp</th>
                  <th className="py-3 px-4">Cédula</th>
                  <th className="py-3 px-4">Estado en Proceso</th>
                  <th className="py-3 px-4">Anticipo / Pago</th>
                  <th className="py-3 px-4">Observaciones</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInteresados.map((item) => {
                  const cleanPhone = item.telefono.replace(/[^0-9]/g, "")
                  const waNumber = cleanPhone.startsWith("0")
                    ? `593${cleanPhone.slice(1)}`
                    : cleanPhone

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Interesado */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {item.nombres} {item.apellidos}
                        </div>
                        {item.correo ? (
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {item.correo}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Sin correo</span>
                        )}
                      </td>

                      {/* Teléfono / WhatsApp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700 font-medium">
                            {item.telefono}
                          </span>
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="size-6 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                            title="Abrir chat de WhatsApp"
                          >
                            <MessageCircle size={13} />
                          </a>
                        </div>
                      </td>

                      {/* Cédula */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.cedula ? (
                          <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {item.cedula}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No registrada</span>
                        )}
                      </td>

                      {/* Estado en Proceso / Funnel */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.estado_embudo === "matriculado" ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                              <span>Matriculado</span>
                              {item.estado_info?.codigo_matricula && (
                                <span className="text-[10px] font-mono text-emerald-600 ml-0.5">
                                  #{item.estado_info.codigo_matricula}
                                </span>
                              )}
                            </div>
                            {!item.es_mismo_curso && item.curso_registrado && (
                              <div className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1 pl-1">
                                <span className="opacity-60">Curso:</span> {item.curso_registrado}
                              </div>
                            )}
                          </div>
                        ) : item.estado_embudo === "solicitud_pendiente" ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={13} className="text-amber-600 shrink-0" />
                              <span>Solicitud enviada</span>
                              <Link
                                to={
                                  item.estado_info?.solicitud_id
                                    ? (tipo === "taller"
                                        ? `/matriculas/aprobacion/taller/${item.estado_info.solicitud_id}`
                                        : `/matriculas/aprobacion/solicitud/${item.estado_info.solicitud_id}`)
                                    : "/matriculas"
                                }
                                className="text-[10px] underline ml-1 hover:text-amber-900 inline-flex items-center"
                                title="Ir a revisar y validar la solicitud"
                              >
                                Revisar <ExternalLink size={9} className="ml-0.5" />
                              </Link>
                            </div>
                            {!item.es_mismo_curso && item.curso_registrado && (
                              <div className="text-[10px] font-semibold text-amber-800 flex items-center gap-1 pl-1">
                                <span className="opacity-60">Curso:</span> {item.curso_registrado}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="size-1.5 rounded-full bg-slate-400" />
                            <span>Solo interesado</span>
                          </div>
                        )}
                      </td>

                      {/* Anticipo / Comprobante */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {Number(item.monto_pago_anticipo) > 0 ? (
                            <span className="font-bold text-slate-800 bg-emerald-50/70 border border-emerald-200/60 px-2 py-0.5 rounded text-[11px]">
                              ${Number(item.monto_pago_anticipo).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Sin anticipo</span>
                          )}

                          {item.comprobante_url && (
                            <button
                              onClick={() => setPreviewImageUrl(item.comprobante_url!)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded transition-colors cursor-pointer"
                              title="Ver foto del comprobante"
                            >
                              <Eye size={12} />
                              Comprobante
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Observaciones */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {item.observaciones ? (
                          <p className="text-[11px] text-slate-600 truncate" title={item.observaciones}>
                            {item.observaciones}
                          </p>
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => abrirModalEditar(item)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Editar interesado"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar interesado"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Crear / Editar Interesado */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {editingInteresado ? "Editar Interesado" : "Registrar Nuevo Interesado"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Información de seguimiento comercial para este curso o taller.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="size-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={nombres}
                    onChange={(e) =>
                      setNombres(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, ""))
                    }
                    placeholder="Ej. Juan Andrés"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Solo letras, sin números</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={apellidos}
                    onChange={(e) =>
                      setApellidos(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, ""))
                    }
                    placeholder="Ej. Pérez Gómez"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Solo letras, sin números</p>
                </div>
              </div>

              {/* Teléfono y Cédula */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    value={telefono}
                    onChange={(e) =>
                      setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="Ej. 0991234567"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Solo números (máximo 10 dígitos)
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cédula / Identificación <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={cedula}
                    onChange={(e) =>
                      setCedula(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="Ej. 1801234567"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Solo números (10 dígitos)
                  </p>
                </div>
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                />
              </div>

              {/* Sección Anticipo / Pago Opcional (Toggle interactivo) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer transition-colors select-none">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={registrarAnticipo}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setRegistrarAnticipo(checked)
                        if (!checked) {
                          setMontoPago("")
                          setComprobanteFile(null)
                          setComprobanteLocalPreview(null)
                          setComprobanteUrl("")
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }
                      }}
                      className="size-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        ¿Registrar anticipo o comprobante de pago?
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Opcional e informativo para seguimiento comercial.
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                      registrarAnticipo
                        ? "bg-orange-100 text-orange-700 border border-orange-200"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {registrarAnticipo ? "Activado" : "No"}
                  </span>
                </label>

                {/* Campos visibles SOLO si se activó el checkbox */}
                {registrarAnticipo && (
                  <div className="mt-3 p-3.5 bg-orange-50/40 rounded-xl border border-orange-200/70 space-y-3">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Datos del Anticipo / Comprobante
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Monto de Anticipo ($)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={montoPago}
                            onChange={(e) => setMontoPago(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Foto / Comprobante
                        </label>

                        {/* Input de archivo oculto */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />

                        {comprobanteFile || comprobanteUrl ? (
                          <div className="flex items-center justify-between p-2 rounded-lg border border-emerald-200 bg-emerald-50/60 text-slate-700">
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                              <span className="text-xs font-medium truncate text-emerald-900">
                                {comprobanteFile ? comprobanteFile.name : "Comprobante cargado"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const urlToShow = comprobanteLocalPreview || comprobanteUrl
                                  if (urlToShow) setPreviewImageUrl(urlToShow)
                                }}
                                className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                                title="Ver comprobante"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                                title="Cambiar imagen"
                              >
                                <RefreshCw size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={handleQuitarComprobante}
                                className="p-1.5 rounded-md hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                title="Eliminar comprobante"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-orange-400 bg-white hover:bg-orange-50/50 text-slate-600 text-xs font-medium cursor-pointer transition-colors"
                          >
                            <Upload size={13} className="text-slate-400" />
                            <span>Seleccionar comprobante</span>
                          </button>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">
                          No se subirá al servidor hasta presionar Registrar / Guardar.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones / Notas de Seguimiento
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre disponibilidad de horario, acuerdos previos, preguntas..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 resize-none"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || uploadingReceipt}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {(formSubmitting || uploadingReceipt) && <Loader2 size={13} className="animate-spin" />}
                  {uploadingReceipt
                    ? "Subiendo comprobante..."
                    : formSubmitting
                    ? "Guardando..."
                    : editingInteresado
                    ? "Guardar Cambios"
                    : "Registrar Interesado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Visor de Comprobante */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText size={14} className="text-orange-500" />
                Comprobante de Anticipo
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-600 hover:underline inline-flex items-center gap-1 mr-2"
                >
                  Abrir en pestaña nueva <ExternalLink size={11} />
                </a>
                <button
                  onClick={() => setPreviewImageUrl(null)}
                  className="size-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-900/5 min-h-[300px]">
              {previewImageUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewImageUrl}
                  className="w-full h-[500px] rounded-lg border border-slate-200"
                  title="Comprobante PDF"
                />
              ) : (
                <img
                  src={previewImageUrl}
                  alt="Comprobante de pago"
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Eliminación */}
      <ConfirmationModal
        isOpen={!!itemToDelete}
        title="Eliminar Interesado"
        message={`¿Estás seguro de que deseas eliminar a ${itemToDelete?.nombres} ${itemToDelete?.apellidos} de la lista de interesados? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
        icon="trash"
      />
    </div>
  )
}
