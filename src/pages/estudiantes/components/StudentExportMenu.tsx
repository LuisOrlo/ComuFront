import { useState } from "react"
import { Dialog } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download04Icon, File02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { estudiantesService } from "@/services/estudiantes.service"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"

type ExportFormat = "csv" | "pdf" | "excel"

const AVAILABLE_FIELDS = [
  { key: "nombres", label: "Nombres" },
  { key: "apellidos", label: "Apellidos" },
  { key: "cedula", label: "Cedula" },
  { key: "correo", label: "Correo" },
  { key: "celular", label: "Celular" },
  { key: "tipo_estudiante", label: "Tipo" },
  { key: "total_cursos", label: "Cursos" },
  { key: "estado_pago", label: "Estado Pago" },
  { key: "saldo_pendiente", label: "Saldo Pendiente" },
]

export function StudentExportMenu() {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>("csv")
  const [selectedFields, setSelectedFields] = useState<string[]>(["nombres", "apellidos", "cedula", "correo", "estado_pago", "saldo_pendiente"])
  const [exporting, setExporting] = useState(false)

  const toggleField = (key: string) => {
    setSelectedFields(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    )
  }

  const handleQuickExport = async (fmt: ExportFormat) => {
    setExporting(true)
    try {
      const blob = await estudiantesService.exportStudents({
        formato: fmt,
        campos: ["nombres", "apellidos", "cedula", "correo", "celular", "tipo_estudiante", "total_cursos", "estado_pago", "saldo_pendiente"],
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
      const blob = await estudiantesService.exportStudents({
        formato: format,
        campos: selectedFields,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `estudiantes.${format === 'excel' ? 'xlsx' : format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Exportacion completada")
      setOpen(false)
    } catch {
      toast.error("Error al exportar")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleQuickExport("csv")}
        disabled={exporting}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <HugeiconsIcon icon={Download04Icon} size={14} />
        CSV
      </button>
      <button
        onClick={() => handleQuickExport("excel")}
        disabled={exporting}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <HugeiconsIcon icon={File02Icon} size={14} />
        Excel
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.97] shadow-sm"
            style={{ backgroundColor: COLORS.ACCENT }}
          >
            Exportar Personalizado
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[2rem] w-full max-w-lg p-0 z-50 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 py-6 border-b bg-gray-50/50">
              <div>
                <Dialog.Title className="text-xl font-black text-gray-900">Exportacion Personalizada</Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 mt-1">Selecciona los campos y formato de exportacion.</Dialog.Description>
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
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        format === fmt ? 'text-white border-transparent shadow-sm' : 'text-gray-600 bg-white hover:bg-gray-50'
                      }`}
                      style={format === fmt ? { backgroundColor: COLORS.ACCENT } : {}}
                    >
                      {fmt === 'excel' ? 'Excel' : fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-3 block">Campos a Exportar</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_FIELDS.map(field => (
                    <label key={field.key} className="flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.key)}
                        onChange={() => toggleField(field.key)}
                        className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Dialog.Close className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                  Cancelar
                </Dialog.Close>
                <button
                  onClick={handleCustomExport}
                  disabled={selectedFields.length === 0 || exporting}
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
  )
}
