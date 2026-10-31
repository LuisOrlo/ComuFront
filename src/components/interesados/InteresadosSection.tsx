import React, { useState, useEffect, useCallback, useMemo } from "react"
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
  Plus,
  ChevronLeft,
  ChevronRight,
  Tag,
  ZoomIn,
} from "lucide-react"
import { toast } from "sonner"
import { Link } from "react-router"
import {
  interesadosService,
  type Interesado,
  type InteresadosKPIs,
  type GuardarInteresadoPayload,
  type InteresadoPagoItem,
} from "@/services/interesados.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { ImageZoom } from "@/pages/matriculas/ImageZoom"

interface InteresadosSectionProps {
  tipo: "curso" | "taller" | "personalizado"
  entidadId: string
  entidadNombre?: string
  precioBase?: number
}

interface FormPagoItem {
  id: string
  monto: string
  metodo_pago: string
  fecha_pago: string
  comprobantesUrls: string[]
  nuevosArchivos: File[]
  nuevosPreviews: string[]
}

function crearPagoVacio(): FormPagoItem {
  return {
    id: crypto.randomUUID(),
    monto: "",
    metodo_pago: "transferencia",
    fecha_pago: new Date().toISOString().split("T")[0],
    comprobantesUrls: [],
    nuevosArchivos: [],
    nuevosPreviews: [],
  }
}

export function InteresadosSection({
  tipo,
  entidadId,
  entidadNombre,
  precioBase,
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
  const [uploadingReceipts, setUploadingReceipts] = useState(false)

  // Form Fields Básicos
  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [telefono, setTelefono] = useState("")
  const [cedula, setCedula] = useState("")
  const [correo, setCorreo] = useState("")
  const [observaciones, setObservaciones] = useState("")

  // Descuento (SOLO por valor en $)
  const [aplicarDescuento, setAplicarDescuento] = useState(false)
  const [montoDescuento, setMontoDescuento] = useState("")
  const [motivoDescuento, setMotivoDescuento] = useState("")

  // Pagos / Anticipos (Multi-pago & Multi-imagen)
  const [registrarAnticipo, setRegistrarAnticipo] = useState(false)
  const [pagos, setPagos] = useState<FormPagoItem[]>([crearPagoVacio()])

  // Visor de Galería & Zoom
  const [galleryModal, setGalleryModal] = useState<{
    urls: string[]
    currentIndex: number
    titulo?: string
  } | null>(null)
  const [zoomUrl, setZoomUrl] = useState<string | null>(null)

  // Modal para ver desglose de múltiples pagos en la tabla
  const [desgloseItem, setDesgloseItem] = useState<Interesado | null>(null)

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

  // Abrir Modal Crear
  const abrirModalCrear = () => {
    setEditingInteresado(null)
    setNombres("")
    setApellidos("")
    setTelefono("")
    setCedula("")
    setCorreo("")
    setObservaciones("")

    // Reset Descuento
    setAplicarDescuento(false)
    setMontoDescuento("")
    setMotivoDescuento("")

    // Reset Pagos
    setRegistrarAnticipo(false)
    setPagos([crearPagoVacio()])

    setModalOpen(true)
  }

  // Abrir Modal Editar
  const abrirModalEditar = (item: Interesado) => {
    setEditingInteresado(item)
    setNombres(item.nombres || "")
    setApellidos(item.apellidos || "")
    setTelefono(item.telefono || "")
    setCedula(item.cedula || "")
    setCorreo(item.correo || "")
    setObservaciones(item.observaciones || "")

    // Descuento
    const tieneDescuento = Number(item.descuento) > 0
    setAplicarDescuento(tieneDescuento)
    setMontoDescuento(item.descuento ? String(item.descuento) : "")
    setMotivoDescuento(item.motivo_descuento || "")

    // Pagos
    const pagosExistentes: FormPagoItem[] =
      item.pagos && item.pagos.length > 0
        ? item.pagos.map((p, idx) => ({
            id: p.id || `pago-${idx + 1}`,
            monto: p.monto != null ? String(p.monto) : "",
            metodo_pago: p.metodo_pago || "transferencia",
            fecha_pago: p.fecha_pago || "",
            comprobantesUrls: Array.isArray(p.comprobantes)
              ? p.comprobantes
              : item.comprobante_url
              ? [item.comprobante_url]
              : [],
            nuevosArchivos: [],
            nuevosPreviews: [],
          }))
        : Number(item.monto_pago_anticipo) > 0 || item.comprobante_url
        ? [
            {
              id: "pago-1",
              monto: item.monto_pago_anticipo ? String(item.monto_pago_anticipo) : "",
              metodo_pago: "transferencia",
              fecha_pago: item.created_at ? item.created_at.split("T")[0] : "",
              comprobantesUrls: item.comprobante_url ? [item.comprobante_url] : [],
              nuevosArchivos: [],
              nuevosPreviews: [],
            },
          ]
        : []

    const tieneAnticipos = pagosExistentes.length > 0
    setRegistrarAnticipo(tieneAnticipos)
    setPagos(tieneAnticipos ? pagosExistentes : [crearPagoVacio()])

    setModalOpen(true)
  }

  // Manejadores de la lista de pagos
  const handleAddPago = () => {
    setPagos((prev) => [...prev, crearPagoVacio()])
  }

  const handleRemovePago = (pagoId: string) => {
    setPagos((prev) => {
      const filtered = prev.filter((p) => p.id !== pagoId)
      return filtered.length > 0 ? filtered : [crearPagoVacio()]
    })
  }

  const handlePagoChange = (
    pagoId: string,
    field: "monto" | "metodo_pago" | "fecha_pago",
    value: string
  ) => {
    setPagos((prev) =>
      prev.map((p) => (p.id === pagoId ? { ...p, [field]: value } : p))
    )
  }

  const handleFilesSelectedForPago = (pagoId: string, filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return

    const validFiles: File[] = []
    const previews: string[] = []

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i]
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        toast.error(`"${file.name}" no es una imagen o PDF válido`)
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" excede el límite de 5 MB`)
        continue
      }
      validFiles.push(file)
      if (file.type.startsWith("image/")) {
        previews.push(URL.createObjectURL(file))
      } else {
        previews.push("/pdf-icon.png")
      }
    }

    if (validFiles.length === 0) return

    setPagos((prev) =>
      prev.map((p) => {
        if (p.id !== pagoId) return p
        return {
          ...p,
          nuevosArchivos: [...p.nuevosArchivos, ...validFiles],
          nuevosPreviews: [...p.nuevosPreviews, ...previews],
        }
      })
    )
    toast.info(`${validFiles.length} archivo(s) agregado(s) a este pago`)
  }

  const handleRemoveComprobanteFromPago = (
    pagoId: string,
    tipoImg: "url" | "nuevo",
    index: number
  ) => {
    setPagos((prev) =>
      prev.map((p) => {
        if (p.id !== pagoId) return p
        if (tipoImg === "url") {
          const updatedUrls = [...p.comprobantesUrls]
          updatedUrls.splice(index, 1)
          return { ...p, comprobantesUrls: updatedUrls }
        } else {
          const updatedArchivos = [...p.nuevosArchivos]
          const updatedPreviews = [...p.nuevosPreviews]
          updatedArchivos.splice(index, 1)
          updatedPreviews.splice(index, 1)
          return { ...p, nuevosArchivos: updatedArchivos, nuevosPreviews: updatedPreviews }
        }
      })
    )
    toast.success("Comprobante removido")
  }

  // Cálculos reactivos de importes y saldos
  const descuentoNum = aplicarDescuento ? parseFloat(montoDescuento) || 0 : 0
  const totalAbonado = useMemo(() => {
    if (!registrarAnticipo) return 0
    return pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0)
  }, [registrarAnticipo, pagos])

  const precioFinalCalculado = useMemo(() => {
    if (precioBase === undefined) return undefined
    return Math.max(0, precioBase - descuentoNum)
  }, [precioBase, descuentoNum])

  const saldoRestante = useMemo(() => {
    if (precioFinalCalculado === undefined) return undefined
    return Math.max(0, precioFinalCalculado - totalAbonado)
  }, [precioFinalCalculado, totalAbonado])

  // Submit del Formulario
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
      // 1. Subida concurrente de todos los comprobantes nuevos de cada pago
      let pagosPayload: InteresadoPagoItem[] = []

      if (registrarAnticipo) {
        setUploadingReceipts(true)

        pagosPayload = await Promise.all(
          pagos.map(async (p, idx) => {
            const uploadedUrls: string[] = []

            for (const file of p.nuevosArchivos) {
              try {
                const url = await interesadosService.uploadComprobante(file)
                if (url) uploadedUrls.push(url)
              } catch (err) {
                console.error("Error subiendo comprobante:", err)
                toast.error(`Error al subir uno de los comprobantes del pago #${idx + 1}`)
              }
            }

            const allUrls = [...p.comprobantesUrls, ...uploadedUrls]

            return {
              id: p.id,
              monto: parseFloat(p.monto) || 0,
              metodo_pago: p.metodo_pago,
              fecha_pago: p.fecha_pago || undefined,
              comprobantes: allUrls,
            }
          })
        )

        // Filtrar pagos vacíos si solo había uno sin monto ni fotos
        pagosPayload = pagosPayload.filter(
          (p) => Number(p.monto) > 0 || (p.comprobantes && p.comprobantes.length > 0)
        )

        setUploadingReceipts(false)
      }

      // Primer comprobante general para retrocompatibilidad
      let primerComprobante: string | null = null
      for (const p of pagosPayload) {
        if (p.comprobantes && p.comprobantes.length > 0) {
          primerComprobante = p.comprobantes[0]
          break
        }
      }

      const payload: GuardarInteresadoPayload = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim(),
        cedula: cedula.trim() || undefined,
        correo: correo.trim() || undefined,
        descuento: descuentoNum > 0 ? descuentoNum : 0,
        motivo_descuento:
          aplicarDescuento && motivoDescuento.trim() ? motivoDescuento.trim() : undefined,
        precio_final: precioFinalCalculado,
        monto_pago_anticipo: registrarAnticipo ? totalAbonado : 0,
        comprobante_url: primerComprobante,
        pagos: registrarAnticipo ? pagosPayload : [],
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
      setUploadingReceipts(false)
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

  // Confirmar Eliminación
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

  // Filtrado y ordenamiento de lista (por apellidos)
  const filteredInteresados = useMemo(() => {
    const list = interesados.filter((item) => {
      const search = searchTerm.toLowerCase().trim()
      const matchText =
        !search ||
        item.nombres.toLowerCase().includes(search) ||
        item.apellidos.toLowerCase().includes(search) ||
        item.telefono.includes(search) ||
        (item.cedula && item.cedula.includes(search)) ||
        (item.correo && item.correo.toLowerCase().includes(search))

      const matchEstado =
        estadoFilter === "todos" || item.estado_embudo === estadoFilter

      return matchText && matchEstado
    })

    return [...list].sort((a, b) => {
      const apeA = (a.apellidos || "").trim()
      const apeB = (b.apellidos || "").trim()
      const compApe = apeA.localeCompare(apeB, "es", { sensitivity: "base" })
      if (compApe !== 0) return compApe
      const nomA = (a.nombres || "").trim()
      const nomB = (b.nombres || "").trim()
      return nomA.localeCompare(nomB, "es", { sensitivity: "base" })
    })
  }, [interesados, searchTerm, estadoFilter])

  // Obtener todas las fotos de un interesado para visualización en galería
  const getFotosInteresado = (item: Interesado): string[] => {
    const fotos: string[] = []
    if (item.pagos && item.pagos.length > 0) {
      item.pagos.forEach((p) => {
        if (Array.isArray(p.comprobantes)) {
          p.comprobantes.forEach((url) => {
            if (url && !fotos.includes(url)) fotos.push(url)
          })
        }
      })
    }
    if (item.comprobante_url && !fotos.includes(item.comprobante_url)) {
      fotos.push(item.comprobante_url)
    }
    return fotos
  }

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
            Registro aislado para captar clientes potenciales, registrar múltiples abonos informativos y descuentos.
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
                : "Agrega clientes potenciales para realizar seguimiento comercial y registrar acuerdos o anticipos."}
            </p>
            {!searchTerm && estadoFilter === "todos" && (
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
                  <th className="py-3 px-4">Acuerdo / Pagos</th>
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

                  const fotos = getFotosInteresado(item)
                  const numPagos = item.pagos?.length || (Number(item.monto_pago_anticipo) > 0 ? 1 : 0)

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Interesado */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {[item.apellidos, item.nombres].filter(Boolean).join(" ")}
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
                                    ? tipo === "taller"
                                      ? `/matriculas/aprobacion/taller/${item.estado_info.solicitud_id}`
                                      : `/matriculas/aprobacion/solicitud/${item.estado_info.solicitud_id}`
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

                      {/* Acuerdo / Pagos (Multi-pago y Descuento) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {Number(item.monto_pago_anticipo) > 0 ? (
                              <span className="font-bold text-slate-800 bg-emerald-50/80 border border-emerald-200 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                                <span>${Number(item.monto_pago_anticipo).toFixed(2)}</span>
                                {numPagos > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setDesgloseItem(item)}
                                    className="ml-0.5 px-1 py-0.2 rounded text-[10px] bg-emerald-200/60 text-emerald-800 hover:bg-emerald-300 transition-colors font-semibold cursor-pointer"
                                    title="Ver desglose de pagos"
                                  >
                                    {numPagos} pagos
                                  </button>
                                )}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Sin abonos</span>
                            )}

                            {/* Botón de Comprobantes */}
                            {fotos.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (fotos.length === 1) {
                                    setZoomUrl(fotos[0])
                                  } else {
                                    setGalleryModal({
                                      urls: fotos,
                                      currentIndex: 0,
                                      titulo: `Comprobantes de ${[item.nombres, item.apellidos].filter(Boolean).join(" ")}`,
                                    })
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                title="Ver comprobante(s) adjunto(s)"
                              >
                                <Eye size={12} />
                                <span>{fotos.length === 1 ? "Comprobante" : `Fotos (${fotos.length})`}</span>
                              </button>
                            )}
                          </div>

                          {/* Chip de Descuento si existe */}
                          {Number(item.descuento) > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 border border-purple-200/80 px-1.5 py-0.5 rounded-md w-fit">
                              <Tag size={11} className="text-purple-600 shrink-0" />
                              <span className="font-bold">-${Number(item.descuento).toFixed(2)}</span>
                              {item.motivo_descuento && (
                                <span className="text-purple-600 truncate max-w-[120px]" title={item.motivo_descuento}>
                                  ({item.motivo_descuento})
                                </span>
                              )}
                            </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {editingInteresado ? "Editar Interesado" : "Registrar Nuevo Interesado"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Registro comercial aislado para seguimiento de clientes potenciales.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="size-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Sección 1: Datos Personales */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  1. Datos del Interesado
                </span>

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
              </div>

              {/* Sección 2: Descuento Comercial (Opcional, Solo Valor $) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer transition-colors select-none">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={aplicarDescuento}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setAplicarDescuento(checked)
                        if (!checked) {
                          setMontoDescuento("")
                          setMotivoDescuento("")
                        }
                      }}
                      className="size-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Tag size={13} className="text-purple-600" />
                        ¿Aplicar descuento o beca acordada?
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Permite pactar un valor de rebaja en dólares ($) para este interesado.
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                      aplicarDescuento
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {aplicarDescuento ? "Descuento Activo" : "No"}
                  </span>
                </label>

                {aplicarDescuento && (
                  <div className="mt-2.5 p-3.5 bg-purple-50/50 rounded-xl border border-purple-200/80 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-purple-900 mb-1">
                          Valor del Descuento ($) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required={aplicarDescuento}
                            value={montoDescuento}
                            onChange={(e) => setMontoDescuento(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 font-bold font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-purple-900 mb-1">
                          Motivo / Razón del Descuento <span className="text-slate-400 font-normal">(opcional)</span>
                        </label>
                        <input
                          type="text"
                          value={motivoDescuento}
                          onChange={(e) => setMotivoDescuento(e.target.value)}
                          placeholder="Ej. Beca parcial, Pronto pago, Convenio"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Previsualización del cálculo si hay precioBase disponible */}
                    {precioBase !== undefined && (
                      <div className="p-2.5 bg-white rounded-lg border border-purple-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          Precio regular: <strong className="text-slate-800">${precioBase.toFixed(2)}</strong>
                        </span>
                        <span className="text-purple-600 font-semibold">
                          Rebaja: -${descuentoNum.toFixed(2)}
                        </span>
                        <span className="text-purple-900 font-extrabold bg-purple-100 px-2 py-0.5 rounded">
                          Precio final: ${precioFinalCalculado?.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sección 3: Pagos / Anticipos (Multi-pago & Multi-imagen) */}
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
                          setPagos([crearPagoVacio()])
                        }
                      }}
                      className="size-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        ¿Registrar pagos o anticipos recibidos?
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Permite tomar nota de uno o varios pagos con sus respectivos comprobantes.
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
                    {registrarAnticipo ? "Pagos Activos" : "No"}
                  </span>
                </label>

                {registrarAnticipo && (
                  <div className="mt-3 p-3.5 sm:p-4 bg-orange-50/40 rounded-xl border border-orange-200/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        Desglose de Pagos / Abonos
                      </span>
                      <button
                        type="button"
                        onClick={handleAddPago}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-orange-700 bg-white hover:bg-orange-100 border border-orange-300 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus size={13} />
                        <span>Añadir otro pago</span>
                      </button>
                    </div>

                    {/* Lista de Pagos */}
                    <div className="space-y-3">
                      {pagos.map((pago, index) => {
                        const fileInputId = `pago-file-${pago.id}`
                        const totalFotosPago = pago.comprobantesUrls.length + pago.nuevosPreviews.length

                        return (
                          <div
                            key={pago.id}
                            className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="size-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[11px] flex items-center justify-center">
                                  {index + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-800">
                                  Pago #{index + 1}
                                </span>
                                {parseFloat(pago.monto || "0") > 0 && (
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                                    ${parseFloat(pago.monto || "0").toFixed(2)}
                                  </span>
                                )}
                              </div>

                              {pagos.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePago(pago.id)}
                                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Quitar este pago"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>

                            {/* Fila: Monto, Método de Pago, Fecha */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  Monto ($) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                                    $
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={pago.monto}
                                    onChange={(e) => handlePagoChange(pago.id, "monto", e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-6 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 font-mono font-bold"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  Método de Pago
                                </label>
                                <select
                                  value={pago.metodo_pago}
                                  onChange={(e) => handlePagoChange(pago.id, "metodo_pago", e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                >
                                  <option value="transferencia">Transferencia bancaria</option>
                                  <option value="efectivo">Efectivo</option>
                                  <option value="deposito">Depósito bancario</option>
                                  <option value="tarjeta">Tarjeta débito/crédito</option>
                                  <option value="otro">Otro método</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  Fecha del Pago
                                </label>
                                <input
                                  type="date"
                                  value={pago.fecha_pago}
                                  onChange={(e) => handlePagoChange(pago.id, "fecha_pago", e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-slate-800"
                                />
                              </div>
                            </div>

                            {/* Gestión de Comprobantes Multi-imagen para este pago */}
                            <div className="pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                  <FileText size={12} className="text-orange-600" />
                                  <span>Comprobante(s) de este pago ({totalFotosPago})</span>
                                </span>

                                <input
                                  id={fileInputId}
                                  type="file"
                                  multiple
                                  accept="image/*,application/pdf"
                                  onChange={(e) => handleFilesSelectedForPago(pago.id, e.target.files)}
                                  className="hidden"
                                />

                                <label
                                  htmlFor={fileInputId}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-orange-700 hover:bg-orange-50 border border-dashed border-orange-300 cursor-pointer transition-colors"
                                >
                                  <Upload size={12} />
                                  <span>Adjuntar foto(s)</span>
                                </label>
                              </div>

                              {/* Grilla de Miniaturas */}
                              {totalFotosPago > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                  {/* Comprobantes existentes (URLs de backend) */}
                                  {pago.comprobantesUrls.map((url, uIdx) => (
                                    <div
                                      key={`url-${uIdx}`}
                                      className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-50 flex items-center justify-center shadow-2xs"
                                    >
                                      {url.toLowerCase().endsWith(".pdf") ? (
                                        <div className="flex flex-col items-center justify-center p-1 text-center">
                                          <FileText size={20} className="text-red-500" />
                                          <span className="text-[9px] text-slate-500 font-bold mt-0.5">PDF</span>
                                        </div>
                                      ) : (
                                        <img
                                          src={url}
                                          alt={`Comprobante ${uIdx + 1}`}
                                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => setZoomUrl(url)}
                                          title="Clic para ampliar"
                                        />
                                      )}

                                      {/* Acciones sobre la imagen */}
                                      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded p-0.5">
                                        <button
                                          type="button"
                                          onClick={() => setZoomUrl(url)}
                                          className="p-1 rounded text-white hover:text-orange-300"
                                          title="Ampliar con zoom"
                                        >
                                          <ZoomIn size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveComprobanteFromPago(pago.id, "url", uIdx)}
                                          className="p-1 rounded text-white hover:text-red-400"
                                          title="Quitar foto"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Nuevos archivos locales seleccionados */}
                                  {pago.nuevosPreviews.map((preview, nIdx) => (
                                    <div
                                      key={`nuevo-${nIdx}`}
                                      className="relative group rounded-lg overflow-hidden border-2 border-orange-300 aspect-square bg-slate-50 flex items-center justify-center shadow-2xs"
                                    >
                                      <img
                                        src={preview}
                                        alt={`Nuevo comprobante ${nIdx + 1}`}
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setZoomUrl(preview)}
                                        title="Clic para ampliar (pendiente de guardar)"
                                      />
                                      <span className="absolute bottom-0.5 left-0.5 text-[8px] font-bold bg-orange-600 text-white px-1 rounded">
                                        Nuevo
                                      </span>

                                      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded p-0.5">
                                        <button
                                          type="button"
                                          onClick={() => setZoomUrl(preview)}
                                          className="p-1 rounded text-white hover:text-orange-300"
                                          title="Ampliar con zoom"
                                        >
                                          <ZoomIn size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveComprobanteFromPago(pago.id, "nuevo", nIdx)}
                                          className="p-1 rounded text-white hover:text-red-400"
                                          title="Quitar foto"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-400 italic">
                                  Sin comprobante adjunto. Puedes seleccionar una o varias fotos.
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Resumen Balance del Interesado */}
                    <div className="p-3 bg-white rounded-xl border border-orange-200/90 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        {precioFinalCalculado !== undefined && (
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Total Acordado
                            </span>
                            <span className="font-extrabold text-slate-800 font-mono">
                              ${precioFinalCalculado.toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Total Abonado
                          </span>
                          <span className="font-black text-emerald-700 font-mono">
                            ${totalAbonado.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {saldoRestante !== undefined && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Saldo Restante
                          </span>
                          <span
                            className={`font-black font-mono px-2 py-0.5 rounded ${
                              saldoRestante <= 0
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            ${saldoRestante.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 4: Observaciones */}
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

              {/* Footer Modal */}
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
                  disabled={formSubmitting || uploadingReceipts}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {(formSubmitting || uploadingReceipts) && <Loader2 size={13} className="animate-spin" />}
                  {uploadingReceipts
                    ? "Subiendo comprobantes..."
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

      {/* MODAL: Desglose de Pagos de un Interesado */}
      {desgloseItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Desglose de Abonos · {[desgloseItem.nombres, desgloseItem.apellidos].filter(Boolean).join(" ")}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Total recaudado: <strong className="text-emerald-700">${Number(desgloseItem.monto_pago_anticipo).toFixed(2)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDesgloseItem(null)}
                className="size-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {desgloseItem.pagos && desgloseItem.pagos.length > 0 ? (
                desgloseItem.pagos.map((p, pIdx) => (
                  <div
                    key={p.id || pIdx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Pago #{pIdx + 1}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono text-[11px]">
                          ${Number(p.monto).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 capitalize">
                        Método: <strong className="text-slate-700">{p.metodo_pago || "Transferencia"}</strong>
                        {p.fecha_pago && (
                          <span className="ml-2 font-mono text-slate-400">· {p.fecha_pago}</span>
                        )}
                      </div>
                    </div>

                    {p.comprobantes && p.comprobantes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (p.comprobantes!.length === 1) {
                            setZoomUrl(p.comprobantes![0])
                          } else {
                            setGalleryModal({
                              urls: p.comprobantes!,
                              currentIndex: 0,
                              titulo: `Comprobantes de Pago #${pIdx + 1}`,
                            })
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-white hover:bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Eye size={12} />
                        <span>{p.comprobantes.length} foto(s)</span>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">
                  No hay desglose granular disponible para este interesado.
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setDesgloseItem(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Galería de Comprobantes (Múltiples Fotos) */}
      {galleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-orange-500" />
                <span className="text-xs font-bold text-slate-800">
                  {galleryModal.titulo || "Galería de Comprobantes"}
                </span>
                <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  Foto {galleryModal.currentIndex + 1} de {galleryModal.urls.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomUrl(galleryModal.urls[galleryModal.currentIndex])}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                  title="Abrir con lupa y zoom interactivo"
                >
                  <ZoomIn size={13} />
                  <span>Zoom</span>
                </button>
                <a
                  href={galleryModal.urls[galleryModal.currentIndex]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 transition-colors"
                  title="Abrir en pestaña nueva"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  type="button"
                  onClick={() => setGalleryModal(null)}
                  className="size-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Imagen Principal */}
            <div className="relative p-4 flex-1 overflow-hidden flex items-center justify-center bg-slate-900/5 min-h-[350px]">
              {galleryModal.urls[galleryModal.currentIndex]?.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={galleryModal.urls[galleryModal.currentIndex]}
                  className="w-full h-[500px] rounded-lg border border-slate-200"
                  title="Comprobante PDF"
                />
              ) : (
                <img
                  src={galleryModal.urls[galleryModal.currentIndex]}
                  alt={`Comprobante ${galleryModal.currentIndex + 1}`}
                  onClick={() => setZoomUrl(galleryModal.urls[galleryModal.currentIndex])}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm cursor-pointer hover:opacity-95"
                  title="Clic para zoom interactivo"
                />
              )}

              {/* Botones de Navegación Anterior / Siguiente */}
              {galleryModal.urls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryModal((prev) =>
                        prev
                          ? {
                              ...prev,
                              currentIndex:
                                prev.currentIndex === 0
                                  ? prev.urls.length - 1
                                  : prev.currentIndex - 1,
                            }
                          : null
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
                    title="Foto anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setGalleryModal((prev) =>
                        prev
                          ? {
                              ...prev,
                              currentIndex:
                                (prev.currentIndex + 1) % prev.urls.length,
                            }
                          : null
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
                    title="Foto siguiente"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Tira de Miniaturas Inferior */}
            {galleryModal.urls.length > 1 && (
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 overflow-x-auto">
                {galleryModal.urls.map((u, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setGalleryModal((prev) => (prev ? { ...prev, currentIndex: i } : null))
                    }
                    className={`size-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      i === galleryModal.currentIndex
                        ? "border-orange-500 ring-2 ring-orange-200"
                        : "border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={u} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visor con Zoom Interactivo (ImageZoom) */}
      {zoomUrl && (
        <ImageZoom url={zoomUrl} onClose={() => setZoomUrl(null)} />
      )}

      {/* MODAL: Confirmar Eliminación */}
      <ConfirmationModal
        isOpen={!!itemToDelete}
        title="Eliminar Interesado"
        message={`¿Estás seguro de que deseas eliminar a ${[itemToDelete?.apellidos, itemToDelete?.nombres].filter(Boolean).join(" ")} de la lista de interesados? Esta acción no se puede deshacer.`}
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
