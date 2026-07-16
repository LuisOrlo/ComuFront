/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import axios from "axios"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle04Icon,
  Cancel01Icon,
  SearchIcon,
  FilterIcon,
  Calendar03Icon,
  Delete01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { RejectModal } from "@/components/RejectModal"
import { cursosService, type CatalogoCurso, type CursoAbierto } from "@/services/cursos.service"
import { tallerService } from "@/services/taller.service"
import type { PagoPreAprobacionRef } from "./PagoPreAprobacionSection"
import { SolicitudCursoDetail } from "./SolicitudCursoDetail"
import { TallerInscripcionCard } from "./TallerInscripcionCard"
import { ImageZoom } from "./ImageZoom"
import { calcularEdad, validarImagen } from "./AprobacionUtils"
import { toast } from "sonner"

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

  const silentRefreshTalleres = useCallback(async () => {
    try {
      const res = await tallerService.listarInscripcionesPendientes({ per_page: 200 })
      setTallerInscripciones((res as any).data || [])
    } catch { /* silent */ }
  }, [])

  const saveTallerEdit = async () => {
    if (!tallerEditId || !editTallerField || editTallerVal === "") return
    setSavingTallerEdit(true)
    try {
      const data: any = { [editTallerField]: editTallerVal }
      if (editTallerField === "fecha_nacimiento") {
        data.edad = calcularEdad(editTallerVal)
      }
      await tallerService.actualizarInscripcion(tallerEditId, data)
      setEditTallerField(null); setEditTallerVal(""); setTallerEditId(null)
      const res = await tallerService.listarInscripcionesPendientes({ per_page: 200 })
      setTallerInscripciones((res as any).data || [])
      toast.success("Dato actualizado correctamente")
    } catch { toast.error("Error al actualizar") }
    finally { setSavingTallerEdit(false) }
  }

  const startTallerEdit = (field: string, value: string, insId: string) => {
    setEditTallerField(field); setEditTallerVal(value); setTallerEditId(insId)
  }

  const cancelTallerEdit = () => {
    setEditTallerField(null); setEditTallerVal(""); setTallerEditId(null)
  }

  const [confirmAction, setConfirmAction] = useState<{ type: "aprobar" | "rechazar"; id: string; origen?: string; paymentMonto?: number; paymentTipo?: string; paymentMetodo?: string; precioAjustado?: number; paymentMotivo?: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [expandedComprobante, setExpandedComprobante] = useState(false)
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null)
  const [uploadingCedula, setUploadingCedula] = useState(false)
  const cedulaRef = useRef<HTMLInputElement>(null)
  const [refreshing, setRefreshing] = useState(false)
  const pagoRef = useRef<PagoPreAprobacionRef>(null)
  const [montoModulo1Valido, setMontoModulo1Valido] = useState(false)
  const [totalPrecioModulos, setTotalPrecioModulos] = useState(-1)

  const [editPagoField, setEditPagoField] = useState<string | null>(null)
  const [editPagoVal, setEditPagoVal] = useState("")
  const [savingPagoEdit, setSavingPagoEdit] = useState(false)

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

  const [uploadingComprobante, setUploadingComprobante] = useState(false)
  const [deletingComprobante, setDeletingComprobante] = useState(false)
  const [deletingCedula, setDeletingCedula] = useState(false)
  const [deleteArchivoModal, setDeleteArchivoModal] = useState<{ type: "comprobante" | "cedula"; label: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string; origen: "curso" | "taller" } | null>(null)
  const [deletingRejected, setDeletingRejected] = useState(false)
  const comprobanteRef = useRef<HTMLInputElement>(null)

  const [filtroFechaDesde, setFiltroFechaDesde] = useState("")
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("")
  const [filtroCursoId, setFiltroCursoId] = useState("")
  const [catalogosFiltro, setCatalogosFiltro] = useState<CatalogoCurso[]>([])

  const VENTANA_DIAS = 5
  const [ventanaActual, setVentanaActual] = useState(1)
  const [tallerVentanaActual, setTallerVentanaActual] = useState(1)

  const [editField, setEditField] = useState<string | null>(null)
  const [editVal, setEditVal] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  const cargarSolicitudes = async (fechaDesde?: string, fechaHasta?: string) => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { per_page: 200 }
      if (fechaDesde) params.fecha_desde = fechaDesde
      if (fechaHasta) params.fecha_hasta = fechaHasta
      const res = await cursosService.getSolicitudesInscripcion(params)
      setSolicitudes(((res as Record<string, unknown>).data as Record<string, unknown>[]) || [])
    } catch { toast.error("Error al cargar solicitudes") }
    finally { setLoading(false) }
  }

  const cargarTallerInscripciones = async (fechaDesde?: string, fechaHasta?: string) => {
    setLoadingTalleres(true)
    try {
      const params: Record<string, unknown> = { per_page: 200 }
      if (fechaDesde) params.fecha_desde = fechaDesde
      if (fechaHasta) params.fecha_hasta = fechaHasta
      const res = await tallerService.listarInscripcionesPendientes(params)
      setTallerInscripciones((res as any).data || [])
    } catch { setTallerInscripciones([]) }
    finally { setLoadingTalleres(false) }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    cargarSolicitudes()
    cargarTallerInscripciones()
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (mainTab === "talleres") {
      setTallerVentanaActual(1)
      cargarTallerInscripciones()
    } else {
      setVentanaActual(1)
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
    setTotalPrecioModulos(-1)
    setMontoModulo1Valido(false)
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
      if (editField === "fecha_nacimiento") {
        data.edad = calcularEdad(editVal)
      }
      await cursosService.actualizarEstudiante(selectedId, data)
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
    const error = validarImagen(file, 2)
    if (error) { toast.error(error); return }
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
    const error = validarImagen(file, 5)
    if (error) { toast.error(error); return }
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

  const handleDeleteComprobante = async () => {
    setDeleteArchivoModal(null)
    if (!selectedId) return
    setDeletingComprobante(true)
    try {
      await cursosService.deleteArchivoSolicitud(selectedId, "archivo_comprobante_url")
      toast.success("Comprobante eliminado")
      setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, url: null, comprobante_purgado: true } } }))
    } catch { toast.error("Error al eliminar comprobante") }
    finally { setDeletingComprobante(false) }
  }

  const handleDeleteCedula = async () => {
    setDeleteArchivoModal(null)
    if (!selectedId) return
    setDeletingCedula(true)
    try {
      await cursosService.deleteArchivoSolicitud(selectedId, "archivo_cedula_url")
      toast.success("Cédula eliminada")
      setSelected((prev: any) => ({ ...prev, pago: { ...prev.pago, comprobante: { ...prev.pago?.comprobante, cedula_url: null, cedula_purgado: true } } }))
    } catch { toast.error("Error al eliminar cédula") }
    finally { setDeletingCedula(false) }
  }

  const handleApproveWithPayment = async (pagos: any[], metodoPago: string) => {
    if (!selectedId) return
    setActionLoading(true)
    try {
      await cursosService.aprobarSolicitudInscripcion(selectedId, {
        pagos,
        metodo_pago: metodoPago,
      })
      toast.success("Matrícula aprobada y pago registrado")
      setSelectedId(null); setSelected(null)
      cargarSolicitudes()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al aprobar")
    } finally { setActionLoading(false) }
  }

  const handleApproveTaller = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    try {
      await tallerService.verificarPago(confirmAction.id, {
        precio_ajustado: confirmAction.precioAjustado,
        monto_pagado: confirmAction.paymentMonto ?? 0,
        tipo_pago: confirmAction.paymentTipo,
        metodo_pago: confirmAction.paymentMetodo,
        fecha_pago: new Date().toISOString().split("T")[0],
        motivo_ajuste: confirmAction.paymentMotivo,
      })
      toast.success("Inscripción a taller aprobada correctamente")
      setConfirmAction(null)
      cargarTallerInscripciones()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al aprobar taller")
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

  const handleDeleteRejected = async () => {
    if (!deleteTarget) return
    setDeletingRejected(true)
    try {
      if (deleteTarget.origen === "taller") {
        await tallerService.eliminarInscripcion(deleteTarget.id)
        toast.success("Inscripción eliminada correctamente")
        cargarTallerInscripciones()
      } else {
        await cursosService.eliminarSolicitud(deleteTarget.id)
        toast.success("Solicitud eliminada correctamente")
        if (selectedId === deleteTarget.id) { setSelectedId(null); setSelected(null) }
        cargarSolicitudes()
      }
      setDeleteTarget(null)
    } catch {
      toast.error("Error al eliminar el registro")
    } finally {
      setDeletingRejected(false)
    }
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

  const ventanasAgrupadas = useMemo(() => {
    if (!solicitudesAgrupadas) return null
    const ventanas: { days: any[]; index: number }[] = []
    for (let i = 0; i < solicitudesAgrupadas.length; i += VENTANA_DIAS) {
      ventanas.push({
        days: solicitudesAgrupadas.slice(i, i + VENTANA_DIAS),
        index: Math.floor(i / VENTANA_DIAS) + 1,
      })
    }
    return ventanas
  }, [solicitudesAgrupadas])

  const totalVentanas = ventanasAgrupadas?.length || 0
  const ventanaActualDays = ventanasAgrupadas?.[ventanaActual - 1]?.days || []

  const tallerVentanasAgrupadas = useMemo(() => {
    if (!tallerAgrupadas) return null
    const ventanas: { days: any[]; index: number }[] = []
    for (let i = 0; i < tallerAgrupadas.length; i += VENTANA_DIAS) {
      ventanas.push({
        days: tallerAgrupadas.slice(i, i + VENTANA_DIAS),
        index: Math.floor(i / VENTANA_DIAS) + 1,
      })
    }
    return ventanas
  }, [tallerAgrupadas])

  const tallerTotalVentanas = tallerVentanasAgrupadas?.length || 0
  const tallerVentanaActualDays = tallerVentanasAgrupadas?.[tallerVentanaActual - 1]?.days || []

  const totalPendientes = useMemo(() => {
    const cursos = solicitudes.filter(s => s.estado === "pendiente_validacion").length
    const talleres = tallerInscripciones.filter(ins => ins.estado === "activo" && !ins.pago_verificado).length
    return cursos + talleres
  }, [solicitudes, tallerInscripciones])

  const detailProps = {
    loadingDetail, refreshing,
    editField, editVal, savingEdit,
    startEdit, setEditVal, saveEdit, cancelEdit,
    editPagoField, editPagoVal, savingPagoEdit,
    setEditPagoField, setEditPagoVal, savePagoEdit,
    editCursoField, editCursoVal, savingCursoEdit,
    setEditCursoField, setEditCursoVal,
    searchCursoQuery, setSearchCursoQuery,
    filteredCursosAbiertos, saveCursoEdit, loadCursosAbiertos,
    getCursoNombre,
    expandedComprobante, setExpandedComprobante, setExpandedImageUrl,
    uploadingCedula, uploadingComprobante, deletingComprobante, deletingCedula,
    cedulaRef, comprobanteRef,
    handleUploadCedula, handleUploadComprobante, setDeleteArchivoModal, setSelected,
    pagoRef, montoModulo1Valido, setMontoModulo1Valido, handleApproveWithPayment,
    actionLoading, setConfirmAction,
    totalPrecioModulos, setTotalPrecioModulos,
  }

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
                ) : tallerVentanaActualDays.length === 0 ? (
                  <div className="p-16 text-center bg-white rounded-2xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>No hay inscripciones a talleres {statusFilter === "aprobados" ? "verificadas" : statusFilter === "rechazados" ? "rechazadas" : "pendientes"}</p>
                  </div>
                ) : tallerVentanaActualDays.map(grupo => (
                  <div key={grupo.dateKey}>
                    <div className="flex items-center gap-2 mb-3">
                      <HugeiconsIcon icon={Calendar03Icon} size={14} style={{ color: COLORS.TEXT_MUTED }} />
                      <h3 className="text-sm font-bold capitalize" style={{ color: COLORS.CHARCOAL }}>{grupo.label}</h3>
                      <span className="text-[10px] font-medium opacity-40">{grupo.items.length} inscripción{grupo.items.length !== 1 ? "es" : ""}</span>
                    </div>
                    <div className="space-y-3">
                       {grupo.items.map((ins: any) => (
                          <div key={ins.id} className="flex items-start gap-2">
                            <div className="flex-1">
                              <TallerInscripcionCard ins={ins}
                               isExpanded={tallerSelectedId === ins.id}
                               puedeVerificar={statusFilter === "pendientes"}
                               editTallerField={editTallerField} editTallerVal={editTallerVal}
                               savingTallerEdit={savingTallerEdit}
                               onToggle={() => setTallerSelectedId(tallerSelectedId === ins.id ? null : ins.id)}
                               onEdit={(f, v) => startTallerEdit(f, v, ins.id)}
                               onChange={setEditTallerVal} onSave={saveTallerEdit}
                               onCancel={cancelTallerEdit}
                                 onApprove={(monto, tipoPago, metodo, precioAjustado, motivoAjuste) => setConfirmAction({ type: "aprobar", id: ins.id, origen: "taller", paymentMonto: monto, paymentTipo: tipoPago, paymentMetodo: metodo, precioAjustado, paymentMotivo: motivoAjuste })}
                                onReject={() => setConfirmAction({ type: "rechazar", id: ins.id, origen: "taller" })}
                                onExpandImage={setExpandedImageUrl}
                                onAfterMutate={silentRefreshTalleres}
                              />
                            </div>
                            {statusFilter === "rechazados" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: ins.id, nombre: `${ins.nombres || "—"} ${ins.apellidos || ""}`, origen: "taller" }) }}
                                className="p-2 rounded-lg hover:bg-red-50 transition-colors shrink-0 mt-1"
                                title="Eliminar inscripción rechazada"
                              >
                                <HugeiconsIcon icon={Delete01Icon} size={15} style={{ color: "#ef4444" }} />
                              </button>
                            )}
                          </div>
                      ))}
                    </div>
                  </div>
                 ))}
              {tallerTotalVentanas > 1 && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <button onClick={() => setTallerVentanaActual(p => Math.max(1, p - 1))}
                    disabled={tallerVentanaActual <= 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-30"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
                    ◀ Anterior
                  </button>
                  <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>
                    Ventana {tallerVentanaActual} de {tallerTotalVentanas}
                  </span>
                  <button onClick={() => setTallerVentanaActual(p => Math.min(tallerTotalVentanas, p + 1))}
                    disabled={tallerVentanaActual >= tallerTotalVentanas}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-30"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
                    Siguiente ▶
                  </button>
                </div>
              )}
             </div>
           ) : loading ? (
              <div className="p-20 text-center" style={{ color: COLORS.TEXT_MUTED }}>Cargando...</div>
           ) : solicitudesFiltradas.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>No hay solicitudes</p>
            </div>
             ) : statusFilter !== "rechazados" && solicitudesAgrupadas ? (
            <div className="space-y-6">
              {ventanaActualDays.map(grupo => (
                <div key={grupo.dateKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <HugeiconsIcon icon={Calendar03Icon} size={14} style={{ color: COLORS.TEXT_MUTED }} />
                    <h3 className="text-sm font-bold capitalize" style={{ color: COLORS.CHARCOAL }}>{grupo.label}</h3>
                    <span className="text-[10px] font-medium opacity-40">{grupo.items.length} solicitud{grupo.items.length !== 1 ? "es" : ""}</span>
                  </div>
                  <div className="space-y-3">
                     {grupo.items.map((s: any) => {
                       const isSelected = selectedId === s.id
                      return (
                        <div key={s.id} className="bg-white rounded-xl overflow-hidden transition-all border"
                          style={{
                            borderTopColor: isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                            borderRightColor: isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                            borderBottomColor: isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                            borderLeft: s.curso_abierto?.catalogo?.color ? `3px solid ${s.curso_abierto.catalogo.color}` : undefined,
                            borderLeftColor: s.curso_abierto?.catalogo?.color ? s.curso_abierto.catalogo.color : (isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE),
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
                            </div>
                            <HugeiconsIcon icon={isSelected ? Cancel01Icon : CheckmarkCircle04Icon} size={18}
                              style={{ color: isSelected ? COLORS.TEXT_MUTED : COLORS.ACCENT }} />
                          </button>
                          {isSelected && selected && (
                            <SolicitudCursoDetail
                              selected={selected}
                              solicitudRaw={s}
                              showLineasPago
                              cursoInicio={selected.curso?.fechas?.inicio?.split("T")[0] || "—"}
                              cursoPrecio={selected.curso?.precio_base || 0}
                              {...detailProps}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {totalVentanas > 1 && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <button onClick={() => setVentanaActual(p => Math.max(1, p - 1))}
                    disabled={ventanaActual <= 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-30"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
                    ◀ Anterior
                  </button>
                  <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>
                    Ventana {ventanaActual} de {totalVentanas}
                  </span>
                  <button onClick={() => setVentanaActual(p => Math.min(totalVentanas, p + 1))}
                    disabled={ventanaActual >= totalVentanas}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-30"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
                    Siguiente ▶
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {solicitudesFiltradas.map(s => {
                const isSelected = selectedId === s.id
                return (
                    <div key={s.id} className="bg-white rounded-xl overflow-hidden transition-all border"
                      style={{
                        borderTopColor: isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                        borderRightColor: isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                        borderBottomColor: isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                        borderLeft: s.curso_abierto?.catalogo?.color ? `3px solid ${s.curso_abierto.catalogo.color}` : undefined,
                        borderLeftColor: s.curso_abierto?.catalogo?.color ? s.curso_abierto.catalogo.color : (isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE),
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
                        </div>
                      <HugeiconsIcon icon={isSelected ? Cancel01Icon : CheckmarkCircle04Icon} size={18}
                        style={{ color: isSelected ? COLORS.TEXT_MUTED : COLORS.ACCENT }} />
                    </button>
                    {statusFilter === "rechazados" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: s.id, nombre: `${s.estudiante?.nombres || s.participante_externo?.nombres || "—"} ${s.estudiante?.apellidos || s.participante_externo?.apellidos || ""}`, origen: "curso" }) }}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                        title="Eliminar solicitud rechazada"
                      >
                        <HugeiconsIcon icon={Delete01Icon} size={15} style={{ color: "#ef4444" }} />
                      </button>
                    )}

                     {isSelected && (
                       <SolicitudCursoDetail
                         selected={selected}
                         solicitudRaw={s}
                         showLineasPago={false}
                         cursoInicio={selected.curso?.fechas?.inicio?.split("T")[0] || "—"}
                         cursoPrecio={selected.curso?.precio_base || 0}
                         {...detailProps}
                       />
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
        isOpen={confirmAction?.type === "aprobar" && confirmAction?.origen === "taller" && !!confirmAction}
        title="Aprobar Inscripción a Taller"
        message="Se aprobará la inscripción del participante en el taller."
        confirmText="Aprobar"
        cancelText="Cancelar"
        isLoading={actionLoading}
        icon="info"
        onConfirm={handleApproveTaller}
        onCancel={() => setConfirmAction(null)}
      />

      <RejectModal
        isOpen={confirmAction?.type === "rechazar" && !!confirmAction}
        isLoading={actionLoading}
        onConfirm={handleReject}
        onCancel={() => setConfirmAction(null)}
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

      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Eliminar solicitud rechazada"
        message={`¿Eliminar definitivamente "${deleteTarget?.nombre}"? Se borrará el registro y sus archivos asociados (comprobante, cédula). Esta acción es irreversible.`}
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
