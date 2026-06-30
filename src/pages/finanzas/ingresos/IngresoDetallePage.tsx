/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Money02Icon, Calendar02Icon, UserIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useParams, useNavigate } from "react-router"

const CHARCOAL = COLORS.CHARCOAL
const BORDER = COLORS.BORDER_SUBTLE

export function IngresoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [modalImg, setModalImg] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    financeService.getTransaccionDetalle(id)
      .then(res => setData(res.datos || res.data || res))
      .catch(() => toast.error("Error al cargar detalle"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="px-8 py-6"><p className="text-sm opacity-40">Cargando...</p></div>
  if (!data) return <div className="px-8 py-6"><p className="text-sm opacity-40">No encontrado</p></div>

  return (
    <div className="px-8 py-6">
      <button onClick={() => navigate("/finanzas/ingresos")} className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 mb-6" style={{ color: CHARCOAL }}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Volver a Ingresos
      </button>
      <div className="max-w-2xl space-y-4">
        <div className="rounded-2xl border bg-white p-6 flex items-center gap-4" style={{ borderColor: BORDER }}>
          <div className="size-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "oklch(0.55 0.15 150 / 0.12)" }}>
            <HugeiconsIcon icon={Money02Icon} size={24} style={{ color: "oklch(0.55 0.15 150)" }} />
          </div>
          <div>
            <p className="text-3xl font-black" style={{ color: "oklch(0.55 0.15 150)" }}>${Number(data.monto || 0).toLocaleString()}</p>
            <p className="text-sm font-bold capitalize" style={{ color: CHARCOAL }}>{data.metodo_pago}</p>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-6 space-y-3" style={{ borderColor: BORDER }}>
          <Row icon={Calendar02Icon} label="Fecha" value={data.fecha_pago ? new Date(data.fecha_pago).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) : "—"} />
          <Row icon={UserIcon} label="Estudiante" value={data.estudiante_nombre || "—"} />
          <Row icon={UserIcon} label="Concepto" value={data.curso_nombre || data.concepto || "—"} />
          <Row icon={Money02Icon} label="Método" value={data.metodo_pago || "—"} />
        </div>
        {data.comprobante_url && (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: BORDER }}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-3">Comprobante</p>
            <img src={data.comprobante_url} alt="Comprobante" className="max-h-[300px] rounded-xl cursor-pointer" onClick={() => setModalImg(data.comprobante_url)} />
          </div>
        )}
      </div>
      {modalImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setModalImg(null)}>
          <img src={modalImg} alt="Comprobante" className="max-w-[90vw] max-h-[90vh] rounded-xl" />
        </div>
      )}
    </div>
  )
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <HugeiconsIcon icon={Icon} size={16} className="mt-0.5 opacity-40" />
      <div>
        <p className="text-[10px] font-bold uppercase opacity-40">{label}</p>
        <p className="text-sm font-bold" style={{ color: CHARCOAL }}>{value}</p>
      </div>
    </div>
  )
}
