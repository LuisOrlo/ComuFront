import { useState, useEffect, Fragment, useMemo } from "react"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Money01Icon, UserGroupIcon, Download01Icon } from "@hugeicons/core-free-icons"
import { ChevronDown, ChevronRight } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import type { MatriculaDetallada, Curso } from "@/services/cursos.service"
import { toast } from "sonner"
import { generarReportePagosCursoPDF } from "@/lib/generarPagosPDF"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

interface Props {
  cursoId: string
  cursoNombre?: string
  curso?: Curso | null
  matriculas?: MatriculaDetallada[]
}

interface ModulePayData {
  modulo_id: string
  nombre_modulo: string
  numero_orden: number
  precio: number
  abonado: number
  saldo: number
  estado: string
  es_ajustado: boolean
}

interface EstudianteFinanciero {
  matricula_id: string
  nombre: string
  cedula: string
  telefono: string
  ciudad: string
  modulos: Record<string, ModulePayData>
  total_pagado: number
  total_esperado: number
  inscripcion?: {
    monto_ajustado: number
    monto_abonado: number
    saldo_pendiente: number
  }
}

interface ModuloInfo {
  id: string
  nombre: string
  numero_orden: number
  precio_base: number
}

interface PagoHistorial {
  id: string
  monto: number
  metodo_pago?: string
  fecha_pago?: string
  estado_verificacion?: string
  modulo_nombre?: string
  referencia_pago?: string
}

interface PagoHistorialAgrupado {
  id: string
  monto: number
  metodo_pago: string
  fecha_pago?: string
  estado_verificacion?: string
  asignaciones: Array<{ concepto: string; monto: number }>
  count: number
}

function agruparHistorialPagos(pagos: PagoHistorial[]): PagoHistorialAgrupado[] {
  const grupos = new Map<string, PagoHistorialAgrupado>()
  pagos.forEach((pago) => {
    const referenciaBase = pago.referencia_pago?.replace(/-insc$/, "")
    const key = referenciaBase || `transaccion-${pago.id}`
    const concepto = pago.modulo_nombre || "Pago"
    const monto = Number(pago.monto) || 0
    const grupo = grupos.get(key)
    if (grupo) {
      grupo.monto = Math.round((grupo.monto + monto) * 100) / 100
      grupo.count += 1
      const asignacion = grupo.asignaciones.find((item) => item.concepto === concepto)
      if (asignacion) asignacion.monto = Math.round((asignacion.monto + monto) * 100) / 100
      else grupo.asignaciones.push({ concepto, monto })
    } else {
      grupos.set(key, {
        id: key,
        monto,
        metodo_pago: pago.metodo_pago || "Método no especificado",
        fecha_pago: pago.fecha_pago,
        estado_verificacion: pago.estado_verificacion,
        asignaciones: [{ concepto, monto }],
        count: 1,
      })
    }
  })
  return [...grupos.values()]
}

export function CursoPagosSection({ cursoId, cursoNombre, curso, matriculas }: Props) {
  const [loading, setLoading] = useState(true)
  const [estudiantes, setEstudiantes] = useState<EstudianteFinanciero[]>([])
  const [modulos, setModulos] = useState<ModuloInfo[]>([])
  const [totales, setTotales] = useState({ estudiantes: 0, modulos: 0, esperado_catalogo: 0, recaudado_real: 0 })
  const [expandido, setExpandido] = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [historiales, setHistoriales] = useState<Record<string, PagoHistorial[]>>({})
  const [historialLoading, setHistorialLoading] = useState<string | null>(null)

  const studentIdMap = useMemo(() => {
    const map: Record<string, string> = {}
    if (matriculas) {
      matriculas.forEach(m => {
        if (m.estudiante?.id) map[m.id] = m.estudiante.id
      })
    }
    return map
  }, [matriculas])

  const load = async () => {
    if (!cursoId) return
    setLoading(true)
    try {
      const res = await financeService.getCursoFinanciero(cursoId)
      const data = res.datos || res.data || res
      setEstudiantes(data.estudiantes || [])
      setModulos(data.modulos || [])
      setTotales(data.totales || {})
    } catch {
      toast.error("Error al cargar datos financieros")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId])

  const handleDownloadPDF = async () => {
    if (!estudiantes || estudiantes.length === 0) {
      toast.error("No hay datos de estudiantes para generar el reporte")
      return
    }
    setGeneratingPDF(true)
    try {
      // Mapear estudiantes organizando apellidos y nombres separados si es posible
      const pdfEstudiantes = estudiantes.map(e => {
        const mat = matriculas?.find(m => m.id === e.matricula_id)
        const estData = mat?.estudiante || mat?.solicitud_inscripcion?.participante_externo
        const nombres = estData?.nombres || e.nombre.split(" ").slice(0, 2).join(" ")
        const apellidos = estData?.apellidos || e.nombre.split(" ").slice(2).join(" ") || ""
        const estDataTyped = estData as { ciudad?: { nombre?: string } | string } | undefined
        const matTyped = mat as { ciudad?: string } | undefined
        const ciudad = (estDataTyped?.ciudad && typeof estDataTyped.ciudad === "object"
          ? estDataTyped.ciudad.nombre 
          : (estDataTyped?.ciudad as string) || matTyped?.ciudad || e.ciudad || "—") as string

        return {
          nombres: nombres || e.nombre,
          apellidos: apellidos || "",
          ciudad,
          totalPagar: Number(e.total_esperado || 0),
          totalAbonado: Number(e.total_pagado || 0),
        }
      })

      const horarioStr = curso?.horaInicio && curso?.horaFin 
        ? `${curso.horaInicio} - ${curso.horaFin}` 
        : "—"

      await generarReportePagosCursoPDF({
        info: {
          nombre: cursoNombre || curso?.nombre || "Curso",
          ciudad: curso?.ciudad || pdfEstudiantes[0]?.ciudad || "—",
          instructor: curso?.instructor || "—",
          horario: horarioStr,
          fecha_inicio: curso?.fechaInicio || undefined,
          fecha_fin: curso?.fechaFin || undefined,
        },
        estudiantes: pdfEstudiantes,
      })
      toast.success("Reporte de pagos descargado correctamente")
    } catch (err) {
      console.error(err)
      toast.error("Error al generar el PDF de pagos")
    } finally {
      setGeneratingPDF(false)
    }
  }

  const recaudado = totales.recaudado_real ?? 0
  const esperado = totales.esperado_catalogo ?? 0
  const pct = esperado > 0 ? Math.round((recaudado / esperado) * 100) : 0

  const toggleExpand = (id: string) => {
    const abrir = expandido !== id
    setExpandido(abrir ? id : null)
    if (abrir && !historiales[id]) {
      setHistorialLoading(id)
      financeService.getEstudianteFinancieroCurso(cursoId, id)
        .then((res) => {
          const data = res.datos || res.data || res
          setHistoriales(prev => ({ ...prev, [id]: data.historial || [] }))
        })
        .catch(() => toast.error("No se pudo cargar el historial de pagos"))
        .finally(() => setHistorialLoading(null))
    }
  }

  const modulosOrdenados = [...modulos].sort((a, b) => (a.numero_orden ?? 999) - (b.numero_orden ?? 999))

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: ACCENT, borderRightColor: ACCENT }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: TEXT_MUTED }}>Total Recaudado</p>
          <p className="text-2xl font-bold tracking-tight">
            <span style={{ color: "oklch(0.45 0.12 140)" }}>
              ${Number(recaudado).toFixed(2)}
            </span>
            {esperado > 0 && (
              <>
                <span style={{ color: TEXT_MUTED }}> / </span>
                <span style={{ color: "oklch(0.58 0.18 250)" }}>
                  ${Number(esperado).toFixed(2)}
                </span>
              </>
            )}
          </p>
          {esperado > 0 && (
            <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${Math.min(pct, 100)}%`,
                backgroundColor: pct >= 100 ? "oklch(0.45 0.12 140)" : pct >= 50 ? "oklch(0.55 0.12 90)" : "oklch(0.5 0.15 25)",
              }} />
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: TEXT_MUTED }}>Estudiantes Inscritos</p>
          <p className="text-2xl font-bold" style={{ color: CHARCOAL }}>
            <HugeiconsIcon icon={UserGroupIcon} size={20} className="inline mr-1.5" style={{ color: ACCENT }} />
            {estudiantes.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: TEXT_MUTED }}>Módulos Facturables</p>
          <p className="text-2xl font-bold" style={{ color: CHARCOAL }}>
            <HugeiconsIcon icon={Money01Icon} size={20} className="inline mr-1.5" style={{ color: ACCENT }} />
            {modulos.length}
          </p>
        </div>
      </div>

      {/* Student table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-5 border-b flex items-center justify-between gap-3" style={{ borderColor: BORDER }}>
          <div><p className="text-base font-semibold" style={{ color: CHARCOAL }}>Estado de cuenta por estudiante</p><p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>Desglose de pagos y saldos por módulo</p></div>
          <button
            onClick={handleDownloadPDF}
            disabled={generatingPDF || estudiantes.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white border border-emerald-600 transition-all duration-200 hover:bg-emerald-700 hover:border-emerald-700 hover:shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HugeiconsIcon icon={Download01Icon} size={14} />
            <span>{generatingPDF ? "Generando..." : "Descargar Reporte PDF"}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          {estudiantes.length === 0 ? (
            <div className="p-12 text-center text-sm" style={{ color: TEXT_MUTED }}>Sin estudiantes matriculados</div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-[#eff4ff]" style={{ borderColor: BORDER }}>
                  <th className="text-left font-semibold uppercase tracking-wider text-[11px] px-5 py-3.5 w-12" style={{ color: "#45464d" }}>#</th>
                  <th className="text-left font-semibold uppercase tracking-wider text-[11px] px-5 py-3.5" style={{ color: "#45464d" }}>Estudiante</th>
                  {modulosOrdenados.map(mod => (
                    <th key={mod.id} className="text-left font-semibold uppercase tracking-wider text-[11px] px-4 py-3.5 whitespace-nowrap" style={{ color: "#45464d" }}>
                      M{mod.numero_orden ?? ""} (${Number(mod.precio_base ?? 0).toFixed(2)})
                    </th>
                  ))}
                  <th className="text-left font-semibold uppercase tracking-wider text-[11px] px-4 py-3.5 whitespace-nowrap" style={{ color: "#45464d" }}>Matrícula (${Number(estudiantes[0]?.inscripcion?.monto_ajustado || 0).toFixed(2)})</th>
                  <th className="text-left font-semibold uppercase tracking-wider text-[11px] px-4 py-3.5 whitespace-nowrap" style={{ color: "#45464d" }}>Total Pagado</th>
                  <th className="text-left font-semibold uppercase tracking-wider text-[11px] px-4 py-3.5" style={{ color: "#45464d" }}>Deuda</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((est, idx) => {
                  const modData = est.modulos || {}
                  const deuda = Math.max(0, (est.total_esperado ?? 0) - (est.total_pagado ?? 0))
                  return (
                    <Fragment key={est.matricula_id}>
                      <tr
                        onClick={() => toggleExpand(est.matricula_id)}
                        className="border-b hover:bg-[#eff4ff] cursor-pointer transition-colors"
                        style={{ borderColor: BORDER }}>
                        <td className="px-5 py-4 text-xs" style={{ color: "#45464d" }}>#{idx + 1}</td>
                        <td className="px-5 py-4 font-semibold whitespace-nowrap" style={{ color: "#0b1c30" }}><span className="inline-flex items-center gap-2">{expandido === est.matricula_id ? <ChevronDown size={14} style={{ color: TEXT_MUTED }} /> : <ChevronRight size={14} style={{ color: TEXT_MUTED }} />}{est.nombre}</span></td>
                        {modulosOrdenados.map(mod => {
                          const md = modData[mod.id]
                          const abonado = md?.abonado ?? 0
                          const precioMod = md?.precio ?? mod.precio_base ?? 0
                          return (
                            <td key={mod.id} className="px-4 py-4 font-mono">
                              <span className="font-semibold" style={{ color: abonado >= precioMod && precioMod > 0 ? "#009668" : "#76777d" }}>
                                ${Number(abonado).toFixed(2)}
                              </span>
                            </td>
                          )
                        })}
                        <td className="px-4 py-4 font-mono" style={{ color: "#0b1c30" }}>
                          <span className="font-semibold" style={{ color: Number(est.inscripcion?.monto_abonado || 0) >= Number(est.inscripcion?.monto_ajustado || 0) && Number(est.inscripcion?.monto_ajustado || 0) > 0 ? "#009668" : "#76777d" }}>${Number(est.inscripcion?.monto_abonado || 0).toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-4 font-mono font-bold" style={{ color: "#0b1c30" }}>
                          ${Number(est.total_pagado ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ backgroundColor: deuda > 0 ? "#ffdad6" : "#d3e4fe", color: deuda > 0 ? "#93000a" : "#005236" }}>${deuda.toFixed(2)} {deuda > 0 ? "Deuda" : "(Al día)"}</span>
                        </td>
                      </tr>
                      {expandido === est.matricula_id && (
                        <tr key={`${est.matricula_id}-detalle`}>
                          <td colSpan={modulos.length + 5} className="bg-[#eff4ff] px-6 py-4">
                            <div className="space-y-3 bg-white rounded-xl p-5 shadow-sm">
                              <div className="flex items-center justify-between"><p className="text-sm font-semibold" style={{ color: CHARCOAL }}>Historial de transacciones · {est.nombre}</p><span className="text-[11px] text-[#45464d]">Desglose por módulo y pagos recibidos</span></div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_MUTED }}>Desglose por Módulo</p>
                              <div className="grid gap-2">
                                {modulosOrdenados.map(mod => {
                                  const md = modData[mod.id]
                                  const precio = md?.precio ?? mod.precio_base ?? 0
                                  const abonado = md?.abonado ?? 0
                                  const saldo = md?.saldo ?? Math.max(0, precio - abonado)
                                  const estadoMod = md?.estado ?? "pendiente"
                                    return (
                                      <div key={mod.id} className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg border" style={{ borderColor: BORDER }}>
                                        <div className="flex items-center gap-3">
                                          <span className="font-semibold text-sm" style={{ color: CHARCOAL }}>
                                            M{mod.numero_orden ?? ""}: {mod.nombre}
                                          </span>
                                          {saldo > 0 && studentIdMap[est.matricula_id] && (
                                            <Link
                                              to={`/estudiantes/${studentIdMap[est.matricula_id]}/academico/registrar-pago/${est.matricula_id}?curso=${encodeURIComponent(cursoNombre || "")}&nombre=${encodeURIComponent(est.nombre)}&cedula=${encodeURIComponent(est.cedula)}&volver=${encodeURIComponent(`/cursos/${cursoId}`)}`}
                                              className="text-[10px] font-bold px-2 py-0.5 rounded-md transition-all hover:opacity-80"
                                              style={{ color: "white", backgroundColor: ACCENT }}
                                            >
                                              Pagar
                                            </Link>
                                          )}
                                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase"
                                           style={{
                                             backgroundColor: estadoMod === "pagado" ? "#d1fae5" : estadoMod === "pendiente" ? "#fef3c7" : "#fee2e2",
                                             color: estadoMod === "pagado" ? "#065f46" : estadoMod === "pendiente" ? "#92400e" : "#991b1b",
                                           }}>
                                           {estadoMod}
                                         </span>
                                       </div>
                                       <div className="flex items-center gap-4 text-sm">
                                         <span style={{ color: TEXT_MUTED }}>
                                           Precio: <strong style={{ color: CHARCOAL }}>${precio.toFixed(2)}</strong>
                                         </span>
                                        <span style={{ color: "oklch(0.45 0.12 140)" }}>Abonado: <strong>${Number(abonado).toFixed(2)}</strong></span>
                                        <span style={{ color: saldo > 0 ? "oklch(0.5 0.15 25)" : "oklch(0.45 0.12 140)" }}>
                                          Saldo: <strong>${Number(saldo).toFixed(2)}</strong>
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                              {est.inscripcion && (
                                <div className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg border mt-2" style={{ borderColor: BORDER }}>
                                  <span className="font-semibold text-sm" style={{ color: CHARCOAL }}>Inscripción / Matrícula</span>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span style={{ color: CHARCOAL }}>Precio: <strong>${est.inscripcion.monto_ajustado.toFixed(2)}</strong></span>
                                    <span style={{ color: "oklch(0.45 0.12 140)" }}>Abonado: <strong>${est.inscripcion.monto_abonado.toFixed(2)}</strong></span>
                                    <span style={{ color: est.inscripcion.saldo_pendiente > 0 ? "oklch(0.5 0.15 25)" : "oklch(0.45 0.12 140)" }}>
                                      Saldo: <strong>${est.inscripcion.saldo_pendiente.toFixed(2)}</strong>
                                    </span>
                                  </div>
                                </div>
                              )}
                              <div className="pt-3 border-t" style={{ borderColor: BORDER }}>
                                <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_MUTED }}>Pagos registrados</p>
                                {historialLoading === est.matricula_id ? <p className="text-xs py-2" style={{ color: TEXT_MUTED }}>Cargando historial…</p> : (historiales[est.matricula_id] || []).length === 0 ? <p className="text-xs py-2" style={{ color: TEXT_MUTED }}>No hay pagos registrados.</p> : <div className="space-y-2">{agruparHistorialPagos(historiales[est.matricula_id]).map((pago) => <div key={pago.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-[#eff4ff] px-4 py-3"><div className="min-w-0"><span className="text-sm font-semibold text-[#0b1c30]">Pago registrado</span><p className="text-xs text-[#45464d] mt-1">{pago.asignaciones.map((asignacion) => `${asignacion.concepto}: $${asignacion.monto.toFixed(2)}`).join(" · ")}</p><p className="text-[11px] text-[#76777d] mt-1">{pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString("es-EC") : "Fecha no disponible"} · {pago.metodo_pago.toLocaleUpperCase("es-EC")}</p></div><div className="flex items-center gap-2 shrink-0"><span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase" style={{ backgroundColor: pago.estado_verificacion === "aprobado" ? "#d3e4fe" : pago.estado_verificacion === "rechazado" ? "#ffdad6" : "#ffdbca", color: pago.estado_verificacion === "aprobado" ? "#005236" : pago.estado_verificacion === "rechazado" ? "#93000a" : "#5c2400" }}>{pago.estado_verificacion || "Registrado"}</span><strong className="text-base text-emerald-700">${pago.monto.toFixed(2)}</strong></div></div>)}</div>}
                              </div>
                              <div className="flex justify-end pt-2 border-t mt-2" style={{ borderColor: BORDER }}>
                                <span className="text-sm font-bold" style={{ color: CHARCOAL }}>
                                  Total Pagado: <span style={{ color: "oklch(0.45 0.12 140)" }}>${Number(est.total_pagado ?? 0).toFixed(2)}</span>
                                  <span className="mx-1" style={{ color: TEXT_MUTED }}>/</span>
                                  <span style={{ color: CHARCOAL }}>${Number(est.total_esperado ?? 0).toFixed(2)}</span>
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  )
}
