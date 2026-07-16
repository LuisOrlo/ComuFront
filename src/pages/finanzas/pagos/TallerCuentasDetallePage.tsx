/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useRef, Fragment } from "react"
import { usePermission } from "@/hooks/usePermission"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  UserIcon,
  Calendar02Icon,
  Money02Icon,
  Download01Icon,
  CheckmarkCircle04Icon,
  MapsLocation01Icon,
  GroupIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useParams, useNavigate } from "react-router"
import html2canvas from "html2canvas-pro"
import { jsPDF } from "jspdf"

export function TallerCuentasDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = usePermission()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [exportando, setExportando] = useState(false)
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null)
  const tablaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const res = await financeService.getTallerFinanciero(id)
        setData(res.datos || res.data || res)
      } catch {
        toast.error("Error al cargar datos financieros del taller")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const taller: any = useMemo(() => data?.taller || data || {}, [data])
  const participantes: any[] = useMemo(() => data?.participantes || [], [data])
  const totales: any = useMemo(() => data?.totales || {}, [data])

  const getNombre = (p: any) => {
    return p.estudiante_nombre || `${p.nombres || ""} ${p.apellidos || ""}`.trim() || "—"
  }

  const getCedula = (p: any) => p.cedula || "—"
  const getTelefono = (p: any) => p.telefono || "—"

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
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 8
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text(taller.nombre || "Taller", pageWidth / 2, margin + 8, { align: "center" })
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
      pdf.save(`cuentas-${taller.nombre || "taller"}.pdf`)
      toast.success("PDF exportado")
    } catch { toast.error("Error al exportar PDF") }
    finally { setExportando(false) }
  }

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium opacity-40" style={{ color: COLORS.CHARCOAL }}>
            Cargando datos del taller...
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
            Taller no encontrado
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-6">

      <button
        onClick={() => navigate("/finanzas/pagos/cuentas/talleres")}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all mb-4"
        style={{ color: COLORS.CHARCOAL }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver a Talleres
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
              {taller.nombre || "Taller"}
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
            <InfoBadge icon={UserIcon} label="Instructor" value={taller.instructor_nombre || taller.instructor || "—"} />
            <InfoBadge icon={Calendar02Icon} label="Fecha" value={taller.fecha ? new Date(taller.fecha).toLocaleDateString("es-ES") : "—"} />
            <InfoBadge icon={Money02Icon} label="Precio" value={`$${Number(taller.precio || 0).toLocaleString()}`} />
            <InfoBadge icon={MapsLocation01Icon} label="Modalidad" value={taller.modalidad || "—"} />
            <InfoBadge icon={GroupIcon} label="Inscritos" value={`${totales.inscritos || 0} / ${taller.capacidad || "∞"}`} />
          </div>
        </div>

        <div
          className="rounded-2xl border bg-white overflow-hidden"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="p-6 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <h3 className="text-base font-black" style={{ color: COLORS.CHARCOAL }}>
              Participantes ({participantes.length})
            </h3>
          </div>

          <div className="overflow-x-auto" ref={tablaRef}>
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.97 0 0)" }}>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 sticky left-0 z-10" style={{ color: COLORS.CHARCOAL, backgroundColor: "oklch(0.97 0 0)" }}>Nombre</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Cédula</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Teléfono</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-right" style={{ color: COLORS.CHARCOAL }}>Abonado</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-right" style={{ color: COLORS.CHARCOAL }}>Saldo</th>
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {participantes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center opacity-40 text-sm" style={{ color: COLORS.CHARCOAL }}>
                      No hay participantes registrados
                    </td>
                  </tr>
                ) : (
                  participantes.map((p: any, idx: number) => {
                    const nombre = getNombre(p)
                    const pagadoCompleto = Number(p.saldo_pendiente || 0) <= 0
                    const abonoM = Number(p.monto_abonado || 0)
                    const saldoM = Number(p.saldo_pendiente || 0)
                    const tallerId = id
                    const participanteId = p.id || p.participante_id

                    const isExpanded = expandedParticipant === (p.id || p.participante_id)

                    return (
                      <Fragment key={p.id || idx}>
                      <tr
                        className="transition-colors"
                        style={{ backgroundColor: idx % 2 === 0 ? "transparent" : "oklch(0.97 0 0 / 0.5)" }}
                      >
                        <td className="px-4 py-3 sticky left-0 z-10" style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "oklch(0.97 0 0 / 0.5)" }}>
                          <p className="text-xs font-bold truncate max-w-[200px]" style={{ color: COLORS.CHARCOAL }}>{nombre}</p>
                        </td>
                        <td className="px-3 py-3 text-xs opacity-60" style={{ color: COLORS.CHARCOAL }}>{getCedula(p)}</td>
                        <td className="px-3 py-3 text-xs opacity-60" style={{ color: COLORS.CHARCOAL }}>{getTelefono(p)}</td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-xs font-bold text-green-600">${abonoM.toLocaleString()}</span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className={cn("text-xs font-bold", saldoM > 0 ? "text-red-600" : "text-green-600")}>
                            ${saldoM.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            {pagadoCompleto ? (
                              <span className="inline-flex gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-100 text-green-700 whitespace-nowrap">
                                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                                Pagado
                              </span>
                            ) : isAdmin ? (
                              <button
                                onClick={() => navigate(`/finanzas/pagos/cuentas/talleres/${tallerId}/participante/${participanteId}`)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
                                style={{ backgroundColor: COLORS.ACCENT }}
                              >
                                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                                Registrar cobro
                              </button>
                            ) : null}
                            {p.motivo_ajuste && (
                              <button
                                onClick={() => setExpandedParticipant(isExpanded ? null : (p.id || p.participante_id))}
                                className="size-6 rounded flex items-center justify-center text-[10px] font-bold hover:bg-gray-100 transition-colors"
                                style={{ color: COLORS.TEXT_MUTED }}
                                title="Ver ajustes"
                              >
                                {isExpanded ? "▲" : "▼"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && p.motivo_ajuste && (
                        <tr style={{ backgroundColor: "oklch(0.64 0.2 150 / 0.06)" }}>
                          <td colSpan={6} className="px-5 py-3">
                            <div className="flex items-center gap-2 text-[11px]" style={{ color: COLORS.CHARCOAL }}>
                              <span className="font-bold">Ajuste:</span>
                              {Number(p.precio_taller || 0) > 0 && Number(p.precio_taller) !== Number(p.monto_total || 0) && (
                                <span className="line-through opacity-40">${Number(p.precio_taller).toLocaleString()}</span>
                              )}
                              <span className="text-green-700 font-bold">→ ${Number(p.monto_total || taller.precio || 0).toLocaleString()}</span>
                              <span className="opacity-50 italic">— {p.motivo_ajuste}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    )
                  })
                )}
              </tbody>
              {participantes.length > 0 && (
                <tfoot>
                  <tr style={{ backgroundColor: COLORS.CHARCOAL }}>
                    <td className="px-4 py-3 sticky left-0 z-10" style={{ backgroundColor: COLORS.CHARCOAL }}>
                      <span className="text-xs font-black text-white">Totales</span>
                    </td>
                    <td className="px-3 py-3" colSpan={2}></td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs font-bold text-green-300">
                        ${(totales.recaudado || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs font-bold text-red-300">
                        ${((totales.esperado || 0) - (totales.recaudado || 0)).toLocaleString()}
                      </span>
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
