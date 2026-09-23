/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router"
import { FileDown, Plus, AlertTriangle } from "lucide-react"
import { jsPDF } from "jspdf"
import { toast } from "sonner"
import { financeService } from "@/services/finance.service"
import { EgresosKPIs } from "./components/EgresosKPIs"
import { EgresosGraficos } from "./components/EgresosGraficos"
import { EgresosFiltros } from "./components/EgresosFiltros"
import { EgresosTabla } from "./components/EgresosTabla"

export function EgresosPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [totales, setTotales] = useState<any>({})
  const [grafico, setGrafico] = useState<any[]>([])
  const [graficoCategorias, setGraficoCategorias] = useState<any[]>([])
  const [graficoProveedores, setGraficoProveedores] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [filtros, setFiltros] = useState({
    categoria: "",
    search: "",
    fecha_desde: "",
    fecha_hasta: "",
  })
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { per_page: 25, page }
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
      setLastPage(res.last_page || 1)
    } catch {
      toast.error("Error al cargar egresos")
    } finally {
      setLoading(false)
    }
  }, [filtros, page])

  useEffect(() => {
    financeService.getEgresoCategorias().then((r) => setCategorias(r.data || []))
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [filtros])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await financeService.deleteEgreso(deleteId)
      toast.success("Egreso eliminado correctamente")
      setDeleteId(null)
      load()
    } catch {
      toast.error("Error al eliminar el egreso")
    } finally {
      setDeleting(false)
    }
  }

  const handleExportPDF = () => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    let y = 20
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("REPORTE DE EGRESOS", 105, y, { align: "center" })
    y += 8
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text(
      `Total: $${(totales.total || 0).toLocaleString()} | Personal: $${(totales.personal || 0).toLocaleString()} | Servicios: $${(totales.servicios || 0).toLocaleString()}`,
      105,
      y,
      { align: "center" }
    )
    y += 10
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.text("#", 14, y)
    pdf.text("Fecha", 22, y)
    pdf.text("Descripción", 44, y)
    pdf.text("Categoría", 110, y)
    pdf.text("Proveedor", 138, y)
    pdf.text("Monto", 180, y)
    y += 4
    pdf.line(14, y, 195, y)
    y += 3
    pdf.setFont("helvetica", "normal")
    data.forEach((item, i) => {
      if (y > 270) {
        pdf.addPage()
        y = 20
      }
      pdf.text(`${i + 1}`, 14, y)
      pdf.text(item.fecha_pago, 22, y)
      pdf.text((item.descripcion || "—").substring(0, 35), 44, y)
      pdf.text((item.categoria_nombre || "—").substring(0, 16), 110, y)
      pdf.text((item.proveedor_beneficiario || "—").substring(0, 16), 138, y)
      pdf.text(`$${Number(item.monto || 0).toLocaleString()}`, 180, y, { align: "right" })
      y += 5
    })
    y += 5
    pdf.line(14, y, 195, y)
    pdf.text(`Total: $${(totales.total || 0).toLocaleString()}`, 195, y + 6, { align: "right" })
    pdf.save("reporte-egresos.pdf")
    toast.success("Reporte PDF descargado")
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Encabezado Principal de Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Egresos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Monitoreo analítico y registro de gastos operativos, personal y servicios.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <button
              type="button"
              onClick={handleExportPDF}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-xs flex items-center gap-2 text-xs font-semibold cursor-pointer group active:scale-95"
              title="Descargar reporte en formato PDF"
            >
              <FileDown
                size={16}
                className="text-slate-500 group-hover:text-[#fd761a] transition-colors"
              />
              <span>Exportar PDF</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/finanzas/egresos/nuevo")}
              className="h-10 px-4 rounded-xl bg-[#fd761a] hover:opacity-95 active:scale-95 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Registrar egreso</span>
            </button>
          </div>
        </div>

        {/* 1. Métricas Resumen Bento KPIs */}
        <EgresosKPIs totales={totales} />

        {/* 2. Sección Analítica con Gráficos */}
        <EgresosGraficos
          grafico={grafico}
          graficoCategorias={graficoCategorias}
          graficoProveedores={graficoProveedores}
        />

        {/* 3. Panel de Filtros y Búsqueda */}
        <EgresosFiltros
          filtros={filtros}
          categorias={categorias}
          onChange={setFiltros}
        />

        {/* 4. Tabla Detallada de Egresos con Paginación */}
        <EgresosTabla
          data={data}
          loading={loading}
          page={page}
          lastPage={lastPage}
          onPageChange={setPage}
          onDelete={(id) => setDeleteId(id)}
        />
      </div>

      {/* Modal de confirmación para eliminar */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">¿Eliminar egreso?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esta acción no se puede deshacer y ajustará el balance contable.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
