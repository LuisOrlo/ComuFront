import { useState } from "react"
import { Dialog } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon, UserGroupIcon, AlertCircleIcon, Coins01Icon, CheckmarkCircle02Icon,
  Download04Icon, File02Icon, Cancel01Icon
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { estudiantesService } from "@/services/estudiantes.service"
import { toast } from "sonner"
import type { Segment } from "@/services/estudiantes.service"

type PaymentFilter = "todos" | "deudor" | "abonado" | "al_dia"
type ExportFormat = "csv" | "pdf" | "excel"

interface StudentFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  paymentFilter: PaymentFilter
  onPaymentFilterChange: (value: PaymentFilter) => void
  stats: { todos: number; deudor: number; abonado: number; al_dia: number }
  segments: Segment[]
  activeSegmentId: string | null
  onSegmentClick: (s: Segment | null) => void
  selectedIds?: string[]
}

const filters = [
  { id: "todos" as const, label: "Todos", icon: UserGroupIcon },
  { id: "deudor" as const, label: "Pendientes", icon: AlertCircleIcon },
  { id: "abonado" as const, label: "Abonos", icon: Coins01Icon },
  { id: "al_dia" as const, label: "Al dia", icon: CheckmarkCircle02Icon },
]

const indicatorColor: Record<string, string> = {
  todos: COLORS.CHARCOAL,
  deudor: "oklch(0.5 0.15 20)",
  abonado: "oklch(0.65 0.15 75)",
  al_dia: "oklch(0.55 0.15 150)",
}

const AVAILABLE_FIELDS = [
  { key: "nombres", label: "Nombres" },
  { key: "apellidos", label: "Apellidos" },
  { key: "cedula", label: "Cedula" },
  { key: "correo", label: "Correo" },
  { key: "celular", label: "Celular" },
  { key: "total_cursos", label: "Cursos" },
  { key: "estado_pago", label: "Estado Pago" },
  { key: "saldo_pendiente", label: "Saldo" },
]

export function StudentFilters({
  search,
  onSearchChange,
  paymentFilter,
  onPaymentFilterChange,
  stats,
  segments,
  activeSegmentId,
  onSegmentClick,
  selectedIds,
}: StudentFiltersProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>("csv")
  const [selectedFields, setSelectedFields] = useState<string[]>(["nombres", "apellidos", "cedula", "correo", "estado_pago", "saldo_pendiente"])
  const [exporting, setExporting] = useState(false)

  const toggleField = (key: string) => {
    setSelectedFields(prev => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key])
  }

  const handleQuickExport = async (fmt: ExportFormat) => {
    setExporting(true)
    try {
      const blob = await estudiantesService.exportStudents({
        formato: fmt,
        buscar: search || undefined,
        estado_pago: paymentFilter !== "todos" ? paymentFilter : undefined,
        ids: selectedIds?.length ? selectedIds : undefined,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `estudiantes.${fmt === 'excel' ? 'xlsx' : fmt}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Exportacion completada")
    } catch {
      toast.error("Error al exportar")
    } finally {
      setExporting(false)
    }
  }

  const handleCustomExport = async () => {
    if (selectedFields.length === 0) return
    setExporting(true)
    try {
      const blob = await estudiantesService.exportStudents({ formato: format, campos: selectedFields })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `estudiantes.${format === 'excel' ? 'xlsx' : format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Exportacion completada")
      setCustomOpen(false)
    } catch {
      toast.error("Error al exportar")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, cedula o correo..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 text-sm bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => handleQuickExport("excel")}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border text-[11px] font-bold text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50"
          >
            <HugeiconsIcon icon={File02Icon} size={13} />
            Excel
          </button>
          <button
            onClick={() => handleQuickExport("pdf")}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border text-[11px] font-bold text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50"
          >
            <HugeiconsIcon icon={Download04Icon} size={13} />
            PDF
          </button>
          <Dialog.Root open={customOpen} onOpenChange={setCustomOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white transition-all active:scale-[0.97] shadow-sm" style={{ backgroundColor: COLORS.ACCENT }}>
                Personalizado
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[2rem] w-full max-w-lg p-0 z-50 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-8 py-6 border-b bg-gray-50/50">
                  <div>
                    <Dialog.Title className="text-xl font-black text-gray-900">Exportar Estudiantes</Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-500 mt-1">Selecciona formato y campos a exportar.</Dialog.Description>
                  </div>
                  <Dialog.Close className="size-10 flex items-center justify-center rounded-2xl bg-white border shadow-sm hover:bg-red-50 hover:text-red-500 transition-all">
                    <HugeiconsIcon icon={Cancel01Icon} size={18} />
                  </Dialog.Close>
                </div>
                <div className="p-8 space-y-5">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-3 block">Formato</label>
                    <div className="flex gap-2">
                      {(["csv", "excel", "pdf"] as ExportFormat[]).map(fmt => (
                        <button key={fmt} onClick={() => setFormat(fmt)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${format === fmt ? 'text-white border-transparent shadow-sm' : 'text-gray-600 bg-white hover:bg-gray-50'}`}
                          style={format === fmt ? { backgroundColor: COLORS.ACCENT } : {}}
                        >
                          {fmt === 'excel' ? 'Excel' : fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-3 block">Campos</label>
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABLE_FIELDS.map(field => (
                        <label key={field.key} className="flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-gray-50 cursor-pointer transition-colors">
                          <input type="checkbox" checked={selectedFields.includes(field.key)} onChange={() => toggleField(field.key)} className="size-4 rounded border-gray-300" />
                          <span className="text-xs font-medium text-gray-700">{field.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Dialog.Close className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancelar</Dialog.Close>
                    <button onClick={handleCustomExport} disabled={selectedFields.length === 0 || exporting}
                      className="px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
                      style={{ backgroundColor: COLORS.ACCENT }}
                    >
                      {exporting ? "Exportando..." : "Exportar"}
                    </button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onPaymentFilterChange(f.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              paymentFilter === f.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <HugeiconsIcon icon={f.icon} size={14} style={{ color: paymentFilter === f.id ? indicatorColor[f.id] : undefined }} />
            <span className="hidden sm:inline">{f.label}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${paymentFilter === f.id ? 'bg-gray-100 text-gray-700' : 'text-gray-400'}`}>
              {stats[f.id]}
            </span>
            {paymentFilter === f.id && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: indicatorColor[f.id] }} />}
          </button>
        ))}
      </div>

      {segments.length > 0 && (
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Segmentos:</span>
          <div className="flex gap-1.5 overflow-x-auto">
            {segments.map((seg) => (
              <button
                key={seg.id}
                onClick={() => onSegmentClick(activeSegmentId === seg.id ? null : seg)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
                  activeSegmentId === seg.id ? 'text-white border-transparent shadow-sm' : 'text-gray-600 bg-white border-gray-200 hover:border-gray-300'
                }`}
                style={activeSegmentId === seg.id ? { backgroundColor: COLORS.ACCENT } : {}}
              >
                {seg.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
