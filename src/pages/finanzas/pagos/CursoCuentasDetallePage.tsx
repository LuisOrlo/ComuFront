/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, Fragment } from "react"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  UserIcon,
  Calendar02Icon,
  MapsLocation01Icon,
  Clock01Icon,
  Download01Icon,
  CheckmarkCircle04Icon,
  LibraryIcon,
  Image01Icon,
  Cancel01Icon,
  EyeIcon,
} from "@hugeicons/core-free-icons"
import { cn, getStorageUrl } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useParams, useNavigate, useLocation } from "react-router"
import { generarCuentaCursoPDF } from "@/lib/generarPagosCuentaPDF"
import { Skeleton } from "@/components/ui/skeleton"
import { ZoomIn, ZoomOut } from "lucide-react"

interface PagoHistorial {
  id: string
  monto: number
  metodo_pago?: string
  fecha_pago?: string
  estado_verificacion?: string
  modulo_nombre?: string
  referencia_pago?: string
  grupo_pago_id?: string
  comprobante_url?: string | null
}

interface PagoHistorialAgrupado {
  id: string
  monto: number
  metodo_pago: string
  desglose_metodos?: Array<{ metodo: string; monto: number }>
  fecha_pago?: string
  estado_verificacion?: string
  comprobante_url?: string | null
  comprobantes: string[]
  asignaciones: Array<{ concepto: string; monto: number }>
  count: number
}

function agruparHistorialPagos(pagos: PagoHistorial[]): PagoHistorialAgrupado[] {
  const grupos = new Map<string, PagoHistorialAgrupado>()
  pagos.forEach((pago) => {
    const key = pago.grupo_pago_id || (pago.referencia_pago?.replace(/-insc$/, "")) || `transaccion-${pago.id}`
    const concepto = pago.modulo_nombre || "Pago"
    const monto = Number(pago.monto) || 0
    const mNombre = pago.metodo_pago || "efectivo"
    const grupo = grupos.get(key)
    if (grupo) {
      grupo.monto = Math.round((grupo.monto + monto) * 100) / 100
      grupo.count += 1
      if (!grupo.comprobante_url && pago.comprobante_url) {
        grupo.comprobante_url = pago.comprobante_url
      }
      if (pago.comprobante_url && !grupo.comprobantes.includes(pago.comprobante_url)) {
        grupo.comprobantes.push(pago.comprobante_url)
      }
      const asignacion = grupo.asignaciones.find((item) => item.concepto === concepto)
      if (asignacion) asignacion.monto = Math.round((asignacion.monto + monto) * 100) / 100
      else grupo.asignaciones.push({ concepto, monto })

      const metodoItem = grupo.desglose_metodos?.find((item) => item.metodo.toLowerCase() === mNombre.toLowerCase())
      if (metodoItem) {
        metodoItem.monto = Math.round((metodoItem.monto + monto) * 100) / 100
      } else {
        grupo.desglose_metodos?.push({ metodo: mNombre, monto })
      }

      if (grupo.desglose_metodos && grupo.desglose_metodos.length > 1) {
        grupo.metodo_pago = grupo.desglose_metodos
          .map((dm) => `${dm.metodo.toUpperCase()}: $${dm.monto.toFixed(2)}`)
          .join(" · ")
      }
    } else {
      grupos.set(key, {
        id: key,
        monto,
        metodo_pago: mNombre.toUpperCase(),
        desglose_metodos: [{ metodo: mNombre, monto }],
        fecha_pago: pago.fecha_pago,
        estado_verificacion: pago.estado_verificacion,
        comprobante_url: pago.comprobante_url,
        comprobantes: pago.comprobante_url ? [pago.comprobante_url] : [],
        asignaciones: [{ concepto, monto }],
        count: 1,
      })
    }
  })
  return [...grupos.values()]
}

export function CursoCuentasDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin } = usePermission()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [selectedModulo, setSelectedModulo] = useState<string>("todos")
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [historiales, setHistoriales] = useState<Record<string, PagoHistorial[]>>({})
  const [historialLoading, setHistorialLoading] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)
  const [modalComprobantes, setModalComprobantes] = useState<{
    open: boolean
    titulo: string
    comprobantes: string[]
    activeIdx: number
  } | null>(null)

  // Estados de control para Zoom fluido y arrastre Pan/Drag del comprobante
  const [zoomScale, setZoomScale] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const resetTransform = () => {
    setZoomScale(1)
    setPanPosition({ x: 0, y: 0 })
  }

  const handleZoom = (delta: number) => {
    setZoomScale((prev) => {
      const next = Math.min(Math.max(0.5, prev + delta), 4)
      if (next === 1) setPanPosition({ x: 0, y: 0 })
      return next
    })
  }

  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.2 : -0.2
    handleZoom(delta)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const res = await financeService.getCursoFinanciero(id)
        setData(res.datos || res.data || res)
      } catch {
        toast.error("Error al cargar los datos financieros del curso")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const curso: any = useMemo(() => data?.curso || data || {}, [data])
  const estudiantes: any[] = useMemo(() => data?.estudiantes || data?.participantes || [], [data])
  const modulos: any[] = useMemo(() => data?.modulos || curso?.modulos || [], [data, curso])

  const toArray = (val: any): any[] => {
    if (!val) return []
    if (Array.isArray(val)) return val
    if (typeof val === "object") return Object.values(val)
    return []
  }

  const filteredEstudiantes = useMemo(() => {
    if (selectedModulo === "todos") return estudiantes
    return estudiantes.filter((e: any) => {
      const modulosEst = toArray(e.modulos || e.lineas_pago_modulo)
      return modulosEst.some((m: any) => m.modulo_id == selectedModulo || m.id == selectedModulo)
    })
  }, [estudiantes, selectedModulo])

  const getNombreEstudiante = (e: any) => {
    if (e.nombre && e.nombre !== "—") return e.nombre
    if (e.estudiante) return `${e.estudiante.nombres || ""} ${e.estudiante.apellidos || ""}`.trim()
    if (e.nombres) return `${e.nombres || ""} ${e.apellidos || ""}`.trim()
    return "—"
  }

  const getCedula = (e: any) => {
    if (e.estudiante?.cedula) return e.estudiante.cedula
    return e.cedula || "—"
  }

  const getTelefono = (e: any) => {
    if (e.estudiante?.telefono) return e.estudiante.telefono
    return e.telefono || "—"
  }

  const getCiudad = (e: any) => {
    if (e.estudiante?.ciudad?.nombre) return e.estudiante.ciudad.nombre
    return e.ciudad || "—"
  }

  const getTotalPagado = (e: any) => {
    const mods = toArray(e.modulos || e.lineas_pago_modulo)
    return mods.reduce((sum: number, m: any) => sum + Number(m.abonado ?? m.monto_abonado ?? 0), 0)
  }

  const totalRecaudado = Number(
    data?.totales?.recaudado_real ?? estudiantes.reduce((sum, e) => sum + getTotalPagado(e), 0)
  )

  const totalEsperadoCalculado = estudiantes.reduce((sum, e) => {
    const mods = toArray(e.modulos || e.lineas_pago_modulo)
    return (
      sum +
      mods.reduce(
        (s: number, m: any) => s + Number(m.precio ?? m.monto_ajustado ?? m.monto_original ?? 0),
        0
      ) +
      Number(e.inscripcion?.monto_ajustado ?? 0)
    )
  }, 0)
  const totalEsperado = Number(data?.totales?.esperado_catalogo ?? totalEsperadoCalculado)
  const totalSaldo = Math.max(0, totalEsperado - totalRecaudado)
  const pctRecaudado = totalEsperado > 0 ? (totalRecaudado / totalEsperado) * 100 : 0

  const getTotalEsperadoEstudiante = (e: any) => {
    if (e.total_esperado !== undefined && e.total_esperado !== null) {
      return Number(e.total_esperado)
    }
    const mods = toArray(e.modulos || e.lineas_pago_modulo)
    const sumaMods = mods.reduce(
      (s: number, m: any) => s + Number(m.precio ?? m.monto_ajustado ?? m.monto_original ?? 0),
      0
    )
    return (
      sumaMods +
      Number(e.inscripcion?.monto_ajustado ?? 0)
    )
  }

  const getStudentAdjustments = (e: any) => {
    const mods = toArray(e.modulos || e.lineas_pago_modulo)
    return modulos
      .map((m: any) => {
        const lm = mods.find((x: any) => (x.modulo_id || x.id) == m.id)
        if (!lm || !lm.motivo_ajuste) return null
        const totalM = Number(lm.precio ?? lm.monto_ajustado ?? lm.monto_original ?? 0)
        const original = Number(lm.monto_original ?? 0)
        return {
          nombre_modulo: m.nombre || `Módulo ${m.orden || m.id}`,
          precio_original: original,
          precio_ajustado: totalM,
          motivo: lm.motivo_ajuste,
        }
      })
      .filter(Boolean)
  }

  const handleExportPDF = () => {
    setExportando(true)
    try {
      generarCuentaCursoPDF(data)
      toast.success("PDF exportado correctamente")
    } catch {
      toast.error("Error al exportar el PDF")
    } finally {
      setExportando(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <Skeleton className="h-8 w-36 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h3 className="text-base font-bold text-slate-800">Curso no encontrado</h3>
        <p className="text-xs text-slate-500 mt-1">No se encontró información financiera para este curso.</p>
      </div>
    )
  }

  const isPersonalizado = location.pathname.includes("cursos-personalizados")

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Botón Volver */}
      <div>
        <button
          type="button"
          onClick={() =>
            navigate(
              isPersonalizado
                ? "/finanzas/pagos/cuentas/cursos-personalizados"
                : "/finanzas/pagos/cuentas/cursos"
            )
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white shadow-2xs transition-all active:scale-[0.98]"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
          <span>Volver a {isPersonalizado ? "Cursos personalizados" : "Cursos"}</span>
        </button>
      </div>

      {/* Tarjeta de Encabezado del Curso */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fd761a] shrink-0 shadow-2xs">
              <HugeiconsIcon icon={LibraryIcon} size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                {curso.nombre_instancia || curso.nombre || "Curso"}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>{estudiantes.length} estudiante{estudiantes.length !== 1 ? "s" : ""}</span>
                <span>•</span>
                <span>{modulos.length} módulo{modulos.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exportando}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold text-[#fd761a] bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <HugeiconsIcon icon={Download01Icon} size={15} />
            <span>{exportando ? "Exportando..." : "Exportar PDF"}</span>
          </button>
        </div>

        {/* Metadatos en Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
          <InfoItem icon={UserIcon} label="Instructor" value={curso.instructor || "—"} />
          <InfoItem
            icon={Calendar02Icon}
            label="Fecha Inicio"
            value={curso.fecha_inicio ? new Date(curso.fecha_inicio).toLocaleDateString("es-ES") : "—"}
          />
          <InfoItem
            icon={Calendar02Icon}
            label="Fecha Fin"
            value={curso.fecha_fin ? new Date(curso.fecha_fin).toLocaleDateString("es-ES") : "—"}
          />
          <InfoItem icon={MapsLocation01Icon} label="Ciudad / Sede" value={curso.ciudad || "—"} />
          <InfoItem icon={Clock01Icon} label="Horario" value={curso.horario || "—"} />
        </div>

        {/* Progreso de Recaudación Compacto */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-semibold">Estado de Cobro del Curso</span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-700 font-bold">Cobrado: ${totalRecaudado.toLocaleString()}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-800 font-bold">Total: ${totalEsperado.toLocaleString()}</span>
              {totalSaldo > 0 && (
                <>
                  <span className="text-slate-400">/</span>
                  <span className="text-rose-600 font-bold">Saldo: ${totalSaldo.toLocaleString()}</span>
                </>
              )}
              <span className="font-extrabold text-[#fd761a]">({Math.round(pctRecaudado)}%)</span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                pctRecaudado >= 80 ? "bg-emerald-500" : pctRecaudado >= 40 ? "bg-amber-500" : "bg-[#fd761a]"
              )}
              style={{ width: `${Math.min(pctRecaudado, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Estudiantes */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Header de la Tabla */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-3 bg-white">
          <h3 className="text-sm font-bold text-slate-900">
            Lista de Estudiantes y Pagos por Módulo
          </h3>

          {modulos.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filtrar por:</span>
              <select
                value={selectedModulo}
                onChange={(e) => setSelectedModulo(e.target.value)}
                className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 outline-none focus:border-[#fd761a] transition-colors cursor-pointer"
              >
                <option value="todos">Todos los módulos</option>
                {modulos.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre || `Módulo ${m.orden || m.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-3 py-3">Cédula</th>
                <th className="px-3 py-3">Teléfono</th>
                <th className="px-3 py-3">Ciudad</th>
                {selectedModulo === "todos" && modulos.length > 0 ? (
                  modulos.map((m: any) => (
                    <th key={m.id} className="px-3 py-3 text-center border-l border-slate-200/60">
                      <div className="truncate max-w-[130px] mx-auto text-slate-800">{m.nombre || `M${m.orden}`}</div>
                      <div className="grid grid-cols-3 text-[9px] text-center font-semibold text-slate-400 mt-1">
                        <span>Total</span>
                        <span>Abono</span>
                        <span>Saldo</span>
                      </div>
                    </th>
                  ))
                ) : selectedModulo !== "todos" ? (
                  <>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3 text-right">Abono</th>
                    <th className="px-3 py-3 text-right">Saldo</th>
                  </>
                ) : null}
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEstudiantes.length === 0 ? (
                <tr>
                  <td colSpan={20} className="p-12 text-center text-slate-400">
                    No hay estudiantes registrados en este curso.
                  </td>
                </tr>
              ) : (
                filteredEstudiantes.map((e: any, idx: number) => {
                  const modsEst = toArray(e.modulos || e.lineas_pago_modulo)
                  const inscripcion = e.inscripcion || null
                  const isExpanded = expandedStudent === e.matricula_id
                  const ajustes = isExpanded ? getStudentAdjustments(e) : []
                  const colSpan =
                    5 + (selectedModulo === "todos" ? (modulos.length > 0 ? modulos.length : 0) : 3) + 1

                  return (
                    <Fragment key={e.id || idx}>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 truncate max-w-[200px]">
                            {getNombreEstudiante(e)}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{getCedula(e)}</td>
                        <td className="px-3 py-3 text-slate-600">{getTelefono(e)}</td>
                        <td className="px-3 py-3 text-slate-600">{getCiudad(e)}</td>

                        {selectedModulo === "todos" && modulos.length > 0 ? (
                          <>
                            {modulos.map((m: any) => {
                              const lm = modsEst.find((x: any) => (x.modulo_id || x.id) == m.id)
                              const totalM = lm ? Number(lm.precio ?? lm.monto_ajustado ?? lm.monto_original ?? 0) : 0
                              const abonoM = lm ? Number(lm.abonado ?? lm.monto_abonado ?? 0) : 0
                              const saldoM = lm ? Number(lm.saldo ?? lm.saldo_pendiente ?? Math.max(0, totalM - abonoM)) : 0
                              return (
                                <td key={m.id} className="px-2 py-3 text-center border-l border-slate-100">
                                  {lm ? (
                                    <div className="grid grid-cols-3 text-[11px] text-center font-medium">
                                      <span className="text-slate-800">${totalM.toLocaleString()}</span>
                                      <span className="text-emerald-600 font-bold">${abonoM.toLocaleString()}</span>
                                      <span className={cn("font-bold", saldoM > 0 ? "text-rose-600" : "text-emerald-600")}>
                                        ${saldoM.toLocaleString()}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                              )
                            })}
                          </>
                        ) : selectedModulo !== "todos" ? (
                          (() => {
                            const lm = modsEst.find((x: any) => (x.modulo_id || x.id) == selectedModulo)
                            const totalM = lm ? Number(lm.precio ?? lm.monto_ajustado ?? lm.monto_original ?? 0) : 0
                            const abonoM = lm ? Number(lm.abonado ?? lm.monto_abonado ?? 0) : 0
                            const saldoM = lm ? Number(lm.saldo ?? lm.saldo_pendiente ?? Math.max(0, totalM - abonoM)) : 0
                            return (
                              <>
                                <td className="px-3 py-3 text-right font-semibold text-slate-800">${totalM.toLocaleString()}</td>
                                <td className="px-3 py-3 text-right font-bold text-emerald-600">${abonoM.toLocaleString()}</td>
                                <td className={cn("px-3 py-3 text-right font-bold", saldoM > 0 ? "text-rose-600" : "text-emerald-600")}>
                                  ${saldoM.toLocaleString()}
                                </td>
                              </>
                            )
                          })()
                        ) : null}

                        {/* Columna Acciones */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAdmin && (() => {
                              const totalEsp = Number(e.total_esperado ?? 0)
                              const totalPag = Number(e.total_pagado ?? 0)
                              const saldoPendiente = Math.max(0, totalEsp - totalPag)
                              const isAlDia = totalEsp > 0 && saldoPendiente <= 0.01

                              return isAlDia ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/finanzas/pagos/cursos/${id}/estudiante/${e.matricula_id}/pago`)
                                  }
                                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-300 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                                  title="El estudiante ya está al día. Clic para ver historial de pagos"
                                >
                                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={13} className="text-emerald-700" />
                                  <span>Ver pagos</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/finanzas/pagos/cursos/${id}/estudiante/${e.matricula_id}/pago`)
                                  }
                                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold text-white bg-[#fd761a] hover:bg-[#e06513] shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                                >
                                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={13} />
                                  <span>Registrar cobro</span>
                                </button>
                              )
                            })()}

                            <button
                              type="button"
                              onClick={() => {
                                const next = isExpanded ? null : e.matricula_id
                                setExpandedStudent(next)
                                if (next && !historiales[next] && id) {
                                  setHistorialLoading(next)
                                  financeService.getEstudianteFinancieroCurso(id, next)
                                    .then((res) => {
                                      const d = res.datos || res.data || res
                                      setHistoriales(prev => ({ ...prev, [next]: d.historial || [] }))
                                    })
                                    .catch(() => toast.error("No se pudo cargar el historial de pagos"))
                                    .finally(() => setHistorialLoading(null))
                                }
                              }}
                              className={cn(
                                "size-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors cursor-pointer",
                                isExpanded
                                  ? "bg-slate-200 text-slate-800 border-slate-300"
                                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                              )}
                              title={isExpanded ? "Ocultar detalles" : "Ver detalles y liquidaciones"}
                            >
                              {isExpanded ? "▲" : "▼"}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Fila expandida con detalles de ajustes, matrícula y pagos registrados */}
                      {isExpanded && (() => {
                        const totalEstIndividual = getTotalEsperadoEstudiante(e)
                        const pagadoEstIndividual = Number(e.total_pagado ?? (getTotalPagado(e) + Number(e.inscripcion?.monto_abonado ?? 0)))
                        const saldoEstIndividual = Math.max(0, totalEstIndividual - pagadoEstIndividual)

                        return (
                          <tr className="bg-orange-50/20">
                            <td colSpan={colSpan} className="px-6 py-4 border-t border-slate-100">
                              <div className="space-y-3 bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
                                {/* Resumen global del estudiante */}
                                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50/90 border border-slate-200/70 rounded-lg text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Total a pagar estudiante:</span>
                                    <span className="text-sm font-bold text-slate-900">${totalEstIndividual.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Total abonado:</span>
                                    <span className="text-sm font-bold text-emerald-600">${pagadoEstIndividual.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Saldo pendiente:</span>
                                    <span className={cn("text-sm font-bold", saldoEstIndividual > 0 ? "text-rose-600" : "text-emerald-600")}>
                                      ${saldoEstIndividual.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>

                                {/* Ajustes de precio si existen */}
                              {ajustes.length > 0 && (
                                <div className="space-y-1 pb-3 border-b border-slate-100">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ajustes de precio aplicados</p>
                                  {ajustes.map((a: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                                      <span className="font-semibold text-slate-800">{a.nombre_modulo}:</span>
                                      {a.precio_original > 0 && a.precio_original !== a.precio_ajustado && (
                                        <span className="line-through text-slate-400">
                                          ${a.precio_original.toLocaleString()}
                                        </span>
                                      )}
                                      <span className="text-emerald-700 font-bold">
                                        → ${a.precio_ajustado.toLocaleString()}
                                      </span>
                                      <span className="text-slate-500 italic">({a.motivo})</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Inscripción si existe */}
                              {inscripcion && (
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                                  <span className="font-bold text-slate-800">Inscripción / Matrícula:</span>
                                  <div className="flex items-center gap-4">
                                    <span>Total: ${inscripcion.monto_ajustado.toLocaleString()}</span>
                                    <span className="text-emerald-600 font-semibold">
                                      Abonado: ${inscripcion.monto_abonado.toLocaleString()}
                                    </span>
                                    <span
                                      className={cn(
                                        "font-bold",
                                        (inscripcion.saldo_pendiente ?? 0) > 0 ? "text-rose-600" : "text-emerald-600"
                                      )}
                                    >
                                      Saldo: ${(inscripcion.saldo_pendiente ?? 0).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Historial de Pagos / Liquidaciones */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pagos y liquidaciones registrados</p>
                                </div>
                                {historialLoading === e.matricula_id ? (
                                  <p className="text-xs text-slate-400 py-2">Cargando liquidaciones del estudiante...</p>
                                ) : (historiales[e.matricula_id] || []).length === 0 ? (
                                  <p className="text-xs text-slate-400 py-1">No hay pagos registrados para este estudiante.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {agruparHistorialPagos(historiales[e.matricula_id]).map((pago) => (
                                      <div key={pago.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg bg-slate-50 p-3 border border-slate-200/70">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-800">Liquidación registrada</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              {pago.estado_verificacion || "Aprobado"}
                                            </span>
                                          </div>
                                          <p className="text-xs text-slate-600 mt-1 font-medium">
                                            {pago.asignaciones.map((a) => `${a.concepto}: $${a.monto.toFixed(2)}`).join(" · ")}
                                          </p>
                                          <p className="text-[11px] text-slate-400 mt-0.5">
                                            {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString("es-EC") : "—"} ·{" "}
                                            <span className="font-semibold text-slate-600">{pago.metodo_pago}</span>
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                          {pago.comprobantes && pago.comprobantes.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                resetTransform()
                                                setModalComprobantes({
                                                  open: true,
                                                  titulo: `Comprobante de Liquidación · $${pago.monto.toFixed(2)}`,
                                                  comprobantes: pago.comprobantes,
                                                  activeIdx: 0,
                                                })
                                              }}
                                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100/80 text-[11px] font-bold text-[#fd761a] transition-all cursor-pointer shadow-2xs"
                                            >
                                              <HugeiconsIcon icon={EyeIcon} size={13} />
                                              <span>
                                                {pago.comprobantes.length > 1
                                                  ? `Ver comprobantes (${pago.comprobantes.length})`
                                                  : "Ver comprobante"}
                                              </span>
                                            </button>
                                          )}
                                          <strong className="text-base font-black text-emerald-600 tabular-nums">
                                            ${pago.monto.toFixed(2)}
                                          </strong>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                        )
                      })()}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal para Visualizar Comprobantes (Soporta 1 o Múltiples) */}
      {modalComprobantes?.open && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setModalComprobantes(null)}
        >
          <div
            className="relative flex flex-col max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-[#fd761a]">
                  <HugeiconsIcon icon={Image01Icon} size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{modalComprobantes.titulo}</h4>
                  <p className="text-[11px] text-slate-500">
                    {modalComprobantes.comprobantes.length > 1
                      ? `Comprobante ${modalComprobantes.activeIdx + 1} de ${modalComprobantes.comprobantes.length}`
                      : "Inspección de comprobante de pago"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={getStorageUrl(modalComprobantes.comprobantes[modalComprobantes.activeIdx])}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-1"
                  title="Abrir imagen original"
                >
                  <HugeiconsIcon icon={Download01Icon} size={13} />
                  <span>Descargar</span>
                </a>
                <button
                  type="button"
                  onClick={() => setModalComprobantes(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>
            </div>

            {/* Pestañas si hay más de 1 comprobante */}
            {modalComprobantes.comprobantes.length > 1 && (
              <div className="flex items-center gap-2 px-5 py-2 bg-slate-100/70 border-b border-slate-200/80 overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                  Comprobantes:
                </span>
                {modalComprobantes.comprobantes.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      resetTransform()
                      setModalComprobantes((prev) => (prev ? { ...prev, activeIdx: idx } : null))
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      modalComprobantes.activeIdx === idx
                        ? "bg-[#fd761a] text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>Comprobante #{idx + 1}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Barra de Controles de Zoom Flotante/Superior */}
            <div className="flex items-center justify-between px-5 py-2 bg-slate-50 border-b border-slate-100 text-xs text-slate-600">
              <span className="text-[11px] text-slate-400">
                Usa la rueda del ratón o los botones para hacer zoom. Arrastra con el cursor para moverte libremente.
              </span>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleZoom(0.25)}
                  title="Acercar (+)"
                  className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleZoom(-0.25)}
                  title="Alejar (-)"
                  className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={resetTransform}
                  title="Restablecer tamaño y posición"
                  className="px-2 py-0.5 hover:bg-slate-100 rounded text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  {Math.round(zoomScale * 100)}%
                </button>
              </div>
            </div>

            {/* Canvas Interactivo con Pan / Drag fluido (Sin scrollbars) */}
            <div
              className={`p-4 flex items-center justify-center bg-slate-900/90 h-[68vh] overflow-hidden relative select-none ${
                isDragging ? "cursor-grabbing" : zoomScale > 1 ? "cursor-grab" : "cursor-default"
              }`}
              onWheel={handleWheelZoom}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                style={{
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
                className="max-w-full max-h-full flex items-center justify-center will-change-transform pointer-events-none"
              >
                <img
                  src={getStorageUrl(modalComprobantes.comprobantes[modalComprobantes.activeIdx])}
                  alt="Comprobante de liquidación"
                  className="max-h-[62vh] w-auto max-w-[85vw] object-contain rounded-lg shadow-2xl bg-white select-none pointer-events-auto"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="size-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
        <HugeiconsIcon icon={Icon} size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-xs font-semibold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  )
}
