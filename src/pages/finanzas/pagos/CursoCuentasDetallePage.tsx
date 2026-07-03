/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useRef } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  UserIcon,
  Calendar02Icon,
  MapsLocation01Icon,
  Clock01Icon,
  Download01Icon,
  CheckmarkCircle04Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useParams, useNavigate } from "react-router"
import html2canvas from "html2canvas-pro"
import { jsPDF } from "jspdf"

export function CursoCuentasDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [selectedModulo, setSelectedModulo] = useState<string>("todos")
  const [exportando, setExportando] = useState(false)
  const tablaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const res = await financeService.getCursoFinanciero(id)
        setData(res.datos || res.data || res)
      } catch {
        toast.error("Error al cargar datos financieros del curso")
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
    if (typeof val === 'object') return Object.values(val)
    return []
  }

  const filteredEstudiantes = useMemo(() => {
    if (selectedModulo === "todos") return estudiantes
    return estudiantes.filter((e: any) => {
      const modulosEst = toArray(e.modulos || e.lineas_pago_modulo)
      return modulosEst.some((m: any) => m.modulo_id == selectedModulo || m.id == selectedModulo)
    })
  }, [estudiantes, selectedModulo])

  const totalesPorModulo = useMemo(() => {
    if (selectedModulo !== "todos") return null
    const map: Record<string, { total: number; abono: number; saldo: number }> = {}
    modulos.forEach((m: any) => {
      map[m.id] = { total: 0, abono: 0, saldo: 0 }
    })
    estudiantes.forEach((e: any) => {
      const mods = toArray(e.modulos || e.lineas_pago_modulo)
      mods.forEach((lm: any) => {
        const mid = lm.modulo_id || lm.id
        if (map[mid]) {
          map[mid].total += Number(lm.precio || lm.monto_ajustado || lm.monto_original || 0)
          map[mid].abono += Number(lm.abonado || lm.monto_abonado || 0)
          map[mid].saldo += Number(lm.saldo || lm.saldo_pendiente || 0)
        }
      })
    })
    return map
  }, [estudiantes, modulos, selectedModulo])

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

  const handleExportPDF = async () => {
    if (!tablaRef.current) return
    setExportando(true)
    try {
      const el = tablaRef.current
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        onclone: (doc) => {
          const ths = doc.querySelectorAll("th:last-child, td:last-child")
          ths.forEach(c => ((c as HTMLElement).style.display = "none"))
        },
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 8
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text(curso.nombre_instancia || curso.nombre || "Curso", pageWidth / 2, margin + 8, { align: "center" })
      pdf.setFontSize(9)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, pageWidth / 2, margin + 15, { align: "center" })
      const imgY = margin + 20
      const availableWidth = pageWidth - margin * 2
      const availableHeight = pdf.internal.pageSize.getHeight() - imgY - margin
      const ratio = canvas.height / canvas.width
      let imgWidth = availableWidth
      let imgHeight = imgWidth * ratio
      if (imgHeight > availableHeight) { imgHeight = availableHeight; imgWidth = imgHeight / ratio }
      pdf.addImage(imgData, "PNG", margin, imgY, imgWidth, imgHeight)
      pdf.save(`cuentas-${curso.nombre_instancia || "curso"}.pdf`)
      toast.success("PDF exportado")
    } catch { toast.error("Error al exportar PDF") }
    finally { setExportando(false) }
  }

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium opacity-40" style={{ color: COLORS.CHARCOAL }}>
            Cargando datos del curso...
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium opacity-40" style={{ color: COLORS.CHARCOAL }}>
            Curso no encontrado
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-6">
      
      <button
        onClick={() => navigate("/finanzas/pagos/cuentas/cursos")}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all mb-4"
        style={{ color: COLORS.CHARCOAL }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver a Cursos
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div
          className="rounded-2xl border bg-white p-6"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black" style={{ color: COLORS.CHARCOAL }}>
              {curso.nombre_instancia || curso.nombre || "Curso"}
            </h2>
            <button
              onClick={handleExportPDF}
              disabled={exportando}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              style={{ color: COLORS.ACCENT, backgroundColor: `${COLORS.ACCENT}15` }}
            >
              <HugeiconsIcon icon={Download01Icon} size={14} />
              {exportando ? "Exportando..." : "Exportar PDF"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <InfoBadge icon={UserIcon} label="Instructor" value={curso.instructor || "—"} />
            <InfoBadge icon={Calendar02Icon} label="Inicio" value={curso.fecha_inicio ? new Date(curso.fecha_inicio).toLocaleDateString("es-ES") : "—"} />
            <InfoBadge icon={Calendar02Icon} label="Fin" value={curso.fecha_fin ? new Date(curso.fecha_fin).toLocaleDateString("es-ES") : "—"} />
            <InfoBadge icon={MapsLocation01Icon} label="Ciudad" value={curso.ciudad || "—"} />
            <InfoBadge icon={Clock01Icon} label="Horario" value={curso.horario || "—"} />
          </div>
        </div>

        <div
          className="rounded-2xl border bg-white overflow-hidden"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
              <div className="p-6 border-b flex items-center justify-between flex-wrap gap-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <h3 className="text-base font-black" style={{ color: COLORS.CHARCOAL }}>
                  Estudiantes ({estudiantes.length})
                </h3>
                {modulos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold opacity-40">Módulo:</span>
                    <select
                      value={selectedModulo}
                      onChange={(e) => setSelectedModulo(e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold outline-none"
                      style={{ backgroundColor: "oklch(0.95 0 0)", color: COLORS.CHARCOAL }}
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

          <div className="overflow-x-auto" ref={tablaRef}>
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.97 0 0)" }}>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 sticky left-0 z-10" style={{ color: COLORS.CHARCOAL, backgroundColor: "oklch(0.97 0 0)" }}>Nombre</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Cédula</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Tel</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Ciudad</th>
                  {selectedModulo === "todos" && modulos.length > 0 ? (
                    modulos.map((m: any) => (
                      <th key={m.id} className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>
                        <div className="text-center mb-1">{m.nombre || `M${m.orden}`}</div>
                        <div className="grid grid-cols-3 gap-1 text-[8px] text-center opacity-60">
                          <span>Total</span>
                          <span>Abono</span>
                          <span>Saldo</span>
                        </div>
                      </th>
                    ))
                  ) : selectedModulo !== "todos" ? (
                    <>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-right" style={{ color: COLORS.CHARCOAL }}>Total</th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-right" style={{ color: COLORS.CHARCOAL }}>Abono</th>
                      <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-right" style={{ color: COLORS.CHARCOAL }}>Saldo</th>
                    </>
                  ) : null}
                  {selectedModulo === "todos" && modulos.length > 0 && (
                    <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-right" style={{ color: COLORS.CHARCOAL }}>Total Pagado</th>
                  )}
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {filteredEstudiantes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center opacity-40 text-sm" style={{ color: COLORS.CHARCOAL }}>
                      No hay estudiantes registrados
                    </td>
                  </tr>
                ) : (
                  filteredEstudiantes.map((e: any, idx: number) => {
                    const modsEst = toArray(e.modulos || e.lineas_pago_modulo)
                    return (
                      <tr
                        key={e.id || idx}
                        className="transition-colors"
                        style={{ backgroundColor: idx % 2 === 0 ? "transparent" : "oklch(0.97 0 0 / 0.5)" }}
                      >
                        <td className="px-4 py-3 sticky left-0 z-10" style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "oklch(0.97 0 0 / 0.5)" }}>
                          <p className="text-xs font-bold truncate max-w-[200px]" style={{ color: COLORS.CHARCOAL }}>{getNombreEstudiante(e)}</p>
                        </td>
                        <td className="px-3 py-3 text-xs opacity-60" style={{ color: COLORS.CHARCOAL }}>{getCedula(e)}</td>
                        <td className="px-3 py-3 text-xs opacity-60" style={{ color: COLORS.CHARCOAL }}>{getTelefono(e)}</td>
                        <td className="px-3 py-3 text-xs opacity-60" style={{ color: COLORS.CHARCOAL }}>{getCiudad(e)}</td>
                        {selectedModulo === "todos" && modulos.length > 0 ? (
                          <>
                            {modulos.map((m: any) => {
                              const lm = modsEst.find((x: any) => (x.modulo_id || x.id) == m.id)
                              const totalM = lm ? Number(lm.precio || lm.monto_ajustado || lm.monto_original || 0) : 0
                              const abonoM = lm ? Number(lm.abonado || lm.monto_abonado || 0) : 0
                              const saldoM = lm ? Number(lm.saldo || lm.saldo_pendiente || 0) : 0
                              return (
                                <td key={m.id} className="px-3 py-3 text-center">
                                  {lm ? (
                                    <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
                                      <span className="font-bold" style={{ color: COLORS.CHARCOAL }}>${totalM.toLocaleString()}</span>
                                      <span className="text-green-600 font-bold">${abonoM.toLocaleString()}</span>
                                      <span className={cn("font-bold", saldoM > 0 ? "text-red-600" : "text-green-600")}>${saldoM.toLocaleString()}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] opacity-20">—</span>
                                  )}
                                </td>
                              )
                            })}
                            <td className="px-3 py-3 text-right">
                              <p className="text-xs font-black" style={{ color: COLORS.ACCENT }}>
                                ${getTotalPagado(e).toLocaleString()}
                              </p>
                            </td>
                          </>
                        ) : selectedModulo !== "todos" ? (
                          (() => {
                            const lm = modsEst.find((x: any) => (x.modulo_id || x.id) == selectedModulo)
                            const totalM = lm ? Number(lm.precio || lm.monto_ajustado || lm.monto_original || 0) : 0
                            const abonoM = lm ? Number(lm.abonado || lm.monto_abonado || 0) : 0
                            const saldoM = lm ? Number(lm.saldo || lm.saldo_pendiente || 0) : 0
                            return (
                              <>
                                <td className="px-3 py-3 text-right text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>${totalM.toLocaleString()}</td>
                                <td className="px-3 py-3 text-right text-xs font-bold text-green-600">${abonoM.toLocaleString()}</td>
                                <td className="px-3 py-3 text-right text-xs font-bold" style={{ color: saldoM > 0 ? "oklch(0.5 0.15 20)" : "oklch(0.55 0.15 150)" }}>${saldoM.toLocaleString()}</td>
                              </>
                            )
                          })()
                        ) : null}
                        <td className="px-3 py-3">
                          <button
                            onClick={() => navigate(`/finanzas/pagos/cursos/${id}/estudiante/${e.matricula_id}/pago`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
                            style={{ backgroundColor: COLORS.ACCENT }}
                          >
                            <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                            Registrar cobro
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              {selectedModulo === "todos" && modulos.length > 0 && filteredEstudiantes.length > 0 && (
                <tfoot>
                  <tr style={{ backgroundColor: COLORS.CHARCOAL }}>
                    <td className="px-4 py-3 sticky left-0 z-10" style={{ backgroundColor: COLORS.CHARCOAL }}>
                      <span className="text-xs font-black text-white">Totales</span>
                    </td>
                      <td className="px-3 py-3" colSpan={3}></td>
                      {modulos.map((m: any) => {
                        const t = totalesPorModulo?.[m.id]
                        return (
                          <td key={m.id} className="px-3 py-3 text-center">
                            {t ? (
                              <span className="text-[10px] font-bold text-white">${t.total.toLocaleString()}</span>
                            ) : (
                              <span className="text-[10px] text-white/20">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-3 py-3 text-right">
                        <p className="text-xs font-black text-white">
                          ${filteredEstudiantes.reduce((sum, e) => sum + getTotalPagado(e), 0).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-3 py-3"></td>
                    </tr>
                  </tfoot>
              )}
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function InfoBadge({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
      <HugeiconsIcon icon={Icon} size={14} style={{ color: COLORS.TEXT_MUTED }} />
      <div>
        <p className="text-[9px] font-bold uppercase opacity-40">{label}</p>
        <p className="text-xs font-bold">{value}</p>
      </div>
    </div>
  )
}
