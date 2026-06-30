/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download01Icon, AddCircleIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { jsPDF } from "jspdf"
import { EgresosKPIs } from "./components/EgresosKPIs"
import { EgresosGraficos } from "./components/EgresosGraficos"
import { EgresosFiltros } from "./components/EgresosFiltros"
import { EgresosTabla } from "./components/EgresosTabla"

const CHARCOAL = COLORS.CHARCOAL
const BORDER = COLORS.BORDER_SUBTLE

export function EgresosPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [totales, setTotales] = useState<any>({})
  const [grafico, setGrafico] = useState<any[]>([])
  const [graficoCategorias, setGraficoCategorias] = useState<any[]>([])
  const [graficoProveedores, setGraficoProveedores] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [sortCol, setSortCol] = useState("fecha_pago")
  const [sortDir, setSortDir] = useState("desc")
  const [filtros, setFiltros] = useState({ categoria: "", search: "", fecha_desde: "", fecha_hasta: "" })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params: any = { page: p, per_page: 25, order_by: sortCol, order_dir: sortDir }
      if (filtros.categoria) params.categoria = filtros.categoria
      if (filtros.search) params.search = filtros.search
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta
      const res = await financeService.getEgresos(params)
      setData(res.data || [])
      setTotales(res.totales || {})
      setGrafico(res.grafico || [])
      setGraficoCategorias(res.grafico_categorias || [])
      setGraficoProveedores(res.grafico_proveedores || [])
      setPage(res.current_page || 1)
      setLastPage(res.last_page || 1)
    } catch { toast.error("Error al cargar egresos") }
    finally { setLoading(false) }
  }, [filtros, sortCol, sortDir])

  useEffect(() => {
    financeService.getEgresoCategorias().then(r => setCategorias(r.data || []))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc")
    else { setSortCol(col); setSortDir("desc") }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try { await financeService.deleteEgreso(deleteId); toast.success("Egreso eliminado"); setDeleteId(null); load() }
    catch { toast.error("Error al eliminar") }
  }

  const handleExportPDF = () => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    let y = 20
    pdf.setFontSize(16); pdf.setFont("helvetica", "bold")
    pdf.text("REPORTE DE EGRESOS", 105, y, { align: "center" })
    y += 8; pdf.setFontSize(10); pdf.setFont("helvetica", "normal")
    pdf.text(`Total: $${(totales.total || 0).toLocaleString()} | Personal: $${(totales.personal || 0).toLocaleString()} | Servicios: $${(totales.servicios || 0).toLocaleString()}`, 105, y, { align: "center" })
    y += 10; pdf.setFontSize(9); pdf.setFont("helvetica", "bold")
    pdf.text("#", 14, y); pdf.text("Fecha", 22, y); pdf.text("Descripción", 44, y)
    pdf.text("Categoría", 110, y); pdf.text("Proveedor", 138, y); pdf.text("Monto", 180, y)
    y += 4; pdf.line(14, y, 195, y); y += 3; pdf.setFont("helvetica", "normal")
    data.forEach((item, i) => {
      if (y > 270) { pdf.addPage(); y = 20 }
      pdf.text(`${i + 1}`, 14, y); pdf.text(item.fecha_pago, 22, y)
      pdf.text((item.descripcion || "—").substring(0, 35), 44, y)
      pdf.text((item.categoria_nombre || "—").substring(0, 16), 110, y)
      pdf.text((item.proveedor_beneficiario || "—").substring(0, 16), 138, y)
      pdf.text(`$${Number(item.monto || 0).toLocaleString()}`, 180, y, { align: "right" })
      y += 5
    })
    y += 5; pdf.line(14, y, 195, y)
    pdf.text(`Total: $${(totales.total || 0).toLocaleString()}`, 195, y + 6, { align: "right" })
    pdf.save("reporte-egresos.pdf")
    toast.success("PDF exportado")
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-6 border-b bg-white/80 flex items-center justify-between" style={{ borderColor: BORDER }}>
        <h1 className="text-2xl font-bold tracking-tighter" style={{ color: CHARCOAL }}>Egresos</h1>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="px-4 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1"
            style={{ color: "#c0392b", backgroundColor: "#c0392b12" }}>
            <HugeiconsIcon icon={Download01Icon} size={14} /> Exportar PDF
          </button>
          <button onClick={() => navigate("/finanzas/egresos/nuevo")}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.97]"
            style={{ backgroundColor: "#c0392b" }}>
            <HugeiconsIcon icon={AddCircleIcon} size={18} /> Registrar egreso
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-auto px-8 py-6 space-y-5">
        <EgresosKPIs totales={totales} />
        <EgresosGraficos grafico={grafico} graficoCategorias={graficoCategorias} graficoProveedores={graficoProveedores} />
        <EgresosFiltros filtros={filtros} categorias={categorias} onChange={setFiltros} />
        <EgresosTabla data={data} loading={loading} page={page} lastPage={lastPage}
          onPageChange={(p) => load(p)} onSort={handleSort} sortCol={sortCol} sortDir={sortDir}
          onDelete={(id) => setDeleteId(id)} />
      </div>
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <p className="text-sm font-bold" style={{ color: CHARCOAL }}>¿Eliminar este egreso?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: "#c0392b" }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
