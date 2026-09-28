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
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useParams, useNavigate, useLocation } from "react-router"
import { generarCuentaCursoPDF } from "@/lib/generarPagosCuentaPDF"
import { Skeleton } from "@/components/ui/skeleton"

export function CursoCuentasDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin } = usePermission()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [selectedModulo, setSelectedModulo] = useState<string>("todos")
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)

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
    return mods.reduce((sum: number, m: any) => sum + Number(m.abonado || m.monto_abonado || 0), 0)
  }

  const totalRecaudado = Number(
    data?.totales?.recaudado_real ?? estudiantes.reduce((sum, e) => sum + getTotalPagado(e), 0)
  )

  const totalEsperadoCalculado = estudiantes.reduce((sum, e) => {
    const mods = toArray(e.modulos || e.lineas_pago_modulo)
    return (
      sum +
      mods.reduce(
        (s: number, m: any) => s + Number(m.precio || m.monto_ajustado || m.monto_original || 0),
        0
      ) +
      Number(e.inscripcion?.monto_ajustado || 0)
    )
  }, 0)
  const totalEsperado = Number(data?.totales?.esperado_catalogo ?? totalEsperadoCalculado)
  const totalSaldo = Math.max(0, totalEsperado - totalRecaudado)
  const pctRecaudado = totalEsperado > 0 ? (totalRecaudado / totalEsperado) * 100 : 0

  const getStudentAdjustments = (e: any) => {
    const mods = toArray(e.modulos || e.lineas_pago_modulo)
    return modulos
      .map((m: any) => {
        const lm = mods.find((x: any) => (x.modulo_id || x.id) == m.id)
        if (!lm || !lm.motivo_ajuste) return null
        const totalM = Number(lm.precio || lm.monto_ajustado || lm.monto_original || 0)
        const original = Number(lm.monto_original || 0)
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
                              const totalM = lm ? Number(lm.precio || lm.monto_ajustado || lm.monto_original || 0) : 0
                              const abonoM = lm ? Number(lm.abonado || lm.monto_abonado || 0) : 0
                              const saldoM = lm ? Number(lm.saldo || lm.saldo_pendiente || 0) : 0
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
                            const totalM = lm ? Number(lm.precio || lm.monto_ajustado || lm.monto_original || 0) : 0
                            const abonoM = lm ? Number(lm.abonado || lm.monto_abonado || 0) : 0
                            const saldoM = lm ? Number(lm.saldo || lm.saldo_pendiente || 0) : 0
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
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/finanzas/pagos/cursos/${id}/estudiante/${e.matricula_id}/pago`)
                                }
                                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold text-white bg-[#fd761a] hover:bg-[#e06513] shadow-2xs transition-all active:scale-[0.98]"
                              >
                                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={13} />
                                <span>Registrar cobro</span>
                              </button>
                            )}

                            {(modsEst.some((lm: any) => lm.motivo_ajuste) || inscripcion) && (
                              <button
                                type="button"
                                onClick={() => setExpandedStudent(isExpanded ? null : e.matricula_id)}
                                className={cn(
                                  "size-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors",
                                  isExpanded
                                    ? "bg-slate-200 text-slate-800 border-slate-300"
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                )}
                                title={isExpanded ? "Ocultar ajustes" : "Ver detalles y ajustes"}
                              >
                                {isExpanded ? "▲" : "▼"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Fila expandida con detalles de ajustes o matrícula */}
                      {isExpanded && (ajustes.length > 0 || inscripcion) && (
                        <tr className="bg-orange-50/30">
                          <td colSpan={colSpan} className="px-6 py-3 border-t border-slate-100">
                            <div className="space-y-1.5 text-xs text-slate-700">
                              {ajustes.length > 0 &&
                                ajustes.map((a: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2">
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

                              {inscripcion && (
                                <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60 text-xs">
                                  <span className="font-bold text-slate-800">Inscripción / Matrícula:</span>
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
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
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
