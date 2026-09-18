import { useState, useEffect, useMemo } from "react"
import { Dialog } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  Download04Icon,
  Tick01Icon,
  Clock04Icon,
} from "@hugeicons/core-free-icons"
import { estudiantesService } from "@/services/estudiantes.service"
import { toast } from "sonner"

type Contexto = "curso" | "taller" | "ciudad" | "todos"

const CAMPOS_POR_CONTEXTO: Record<Contexto, { key: string; label: string; desc?: string }[]> = {
  todos: [
    { key: "nombres", label: "Nombres", desc: "Primer y segundo nombre" },
    { key: "apellidos", label: "Apellidos", desc: "Apellidos completos" },
    { key: "cedula", label: "Identificación / Cédula", desc: "Documento de identidad" },
    { key: "correo", label: "Correo electrónico", desc: "Email principal de contacto" },
    { key: "telefono", label: "Teléfono / Celular", desc: "Número móvil registrado" },
    { key: "ciudad", label: "Ciudad / Sede", desc: "Ubicación o sede física" },
    { key: "direccion", label: "Dirección", desc: "Lugar de residencia" },
    { key: "ocupacion", label: "Ocupación", desc: "Actividad o profesión" },
    { key: "estado_financiero", label: "Estado financiero", desc: "Al día, pendiente o abonado" },
    { key: "saldo", label: "Saldo pendiente", desc: "Monto pendiente por pagar" },
    { key: "total_cursos", label: "Total de cursos", desc: "Cantidad de cursos inscritos" },
  ],
  curso: [
    { key: "nombres", label: "Nombres", desc: "Primer y segundo nombre" },
    { key: "apellidos", label: "Apellidos", desc: "Apellidos completos" },
    { key: "cedula", label: "Identificación / Cédula", desc: "Documento de identidad" },
    { key: "correo", label: "Correo electrónico", desc: "Email registrado" },
    { key: "telefono", label: "Teléfono / Celular", desc: "Número de contacto" },
    { key: "ciudad", label: "Ciudad / Sede", desc: "Sede del estudiante" },
    { key: "estado_financiero", label: "Estado de cuenta", desc: "Al día, pendiente o abonado" },
    { key: "saldo", label: "Saldo pendiente", desc: "Monto adeudado" },
    { key: "fecha_inscripcion", label: "Fecha de matrícula", desc: "Día en que se inscribió" },
  ],
  taller: [
    { key: "nombres", label: "Nombres", desc: "Primer y segundo nombre" },
    { key: "apellidos", label: "Apellidos", desc: "Apellidos completos" },
    { key: "cedula", label: "Identificación / Cédula", desc: "Documento de identidad" },
    { key: "correo", label: "Correo electrónico", desc: "Email registrado" },
    { key: "telefono", label: "Teléfono / Celular", desc: "Número de contacto" },
    { key: "ciudad", label: "Ciudad / Sede", desc: "Sede del participante" },
    { key: "ocupacion", label: "Ocupación", desc: "Profesión o actividad" },
    { key: "estado_financiero", label: "Estado financiero", desc: "Al día o pendiente" },
    { key: "fecha_inscripcion", label: "Fecha de inscripción", desc: "Día del registro al taller" },
  ],
  ciudad: [
    { key: "nombres", label: "Nombres", desc: "Primer y segundo nombre" },
    { key: "apellidos", label: "Apellidos", desc: "Apellidos completos" },
    { key: "cedula", label: "Identificación / Cédula", desc: "Documento de identidad" },
    { key: "correo", label: "Correo electrónico", desc: "Email registrado" },
    { key: "telefono", label: "Teléfono / Celular", desc: "Número de contacto" },
    { key: "ciudad", label: "Ciudad", desc: "Sede asignada" },
    { key: "estado_financiero", label: "Estado financiero", desc: "Al día o con saldo" },
    { key: "saldo", label: "Saldo pendiente", desc: "Monto adeudado" },
    { key: "total_cursos", label: "Total cursos", desc: "Inscripciones totales" },
  ],
}

interface StudentExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds?: string[]
  extraFilters?: Record<string, string | number | undefined>
  title?: string
  description?: string
  contexto?: Contexto
  onExport?: (selectedFields: string[]) => Promise<void>
}

export function StudentExportDialog({
  open,
  onOpenChange,
  selectedIds,
  extraFilters,
  title = "Exportar Listado en PDF",
  description = "Configura los campos que deseas incluir en el documento oficial.",
  contexto = "todos",
  onExport,
}: StudentExportDialogProps) {
  const isLegacy = !onExport

  const camposDisponibles = useMemo(() => {
    return CAMPOS_POR_CONTEXTO[contexto] || CAMPOS_POR_CONTEXTO.todos
  }, [contexto])

  const [selectedFields, setSelectedFields] = useState<string[]>(() =>
    camposDisponibles.map((c) => c.key)
  )
  const [exporting, setExporting] = useState(false)

  // Synchronize default fields whenever the modal opens or the context changes
  useEffect(() => {
    if (open) {
      setSelectedFields(camposDisponibles.map((c) => c.key))
    }
  }, [open, camposDisponibles])

  const toggleField = (key: string) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    )
  }

  const selectAll = () => {
    setSelectedFields(camposDisponibles.map((c) => c.key))
  }

  const clearAll = () => {
    setSelectedFields([])
  }

  const handleExport = async () => {
    if (selectedFields.length === 0) return
    setExporting(true)
    try {
      if (onExport) {
        await onExport(selectedFields)
      } else if (isLegacy) {
        const blob = await estudiantesService.exportStudents({
          formato: "pdf",
          campos: selectedFields.map((field) => (field === "saldo" ? "saldo_pendiente" : field)),
          ids: selectedIds?.length ? selectedIds : undefined,
          ...extraFilters,
        } as {
          formato: "csv" | "pdf" | "excel"
          campos?: string[]
          ids?: string[]
          buscar?: string
          estado_pago?: string
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "estudiantes.pdf"
        a.click()
        URL.revokeObjectURL(url)
      }
      toast.success("Listado exportado correctamente")
      onOpenChange(false)
    } catch {
      toast.error("Ocurrió un error al generar el PDF")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#0b1c30]/40 backdrop-blur-sm z-50 transition-opacity animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[calc(100%-2rem)] max-w-xl p-0 z-50 shadow-2xl border border-[#c6c6cd]/30 max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header Banner */}
          <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-[#c6c6cd]/20 bg-[#f8f9ff]">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#ffdbca] flex items-center justify-center text-[#783200] shrink-0 shadow-sm">
                <HugeiconsIcon icon={Download04Icon} size={22} />
              </div>
              <div>
                <Dialog.Title className="text-base sm:text-lg font-bold text-[#0b1c30]">
                  {title}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-[#45464d] mt-0.5">
                  {description}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464d] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer shrink-0"
              aria-label="Cerrar ventana de exportación"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </Dialog.Close>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Format Tag Row */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#eff4ff] border border-[#c6c6cd]/25">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#ba1a1a] text-white font-bold text-[10px] tracking-wider uppercase">
                  PDF
                </span>
                <span className="text-xs font-semibold text-[#0b1c30]">
                  Formato de salida: Documento PDF formal
                </span>
              </div>
              <span className="text-[11px] text-[#45464d]">Orientación inteligente</span>
            </div>

            {/* Selection Toolbar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0b1c30]">
                  Campos a incluir en el reporte ({selectedFields.length}/{camposDisponibles.length})
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[#9d4300] hover:underline font-semibold cursor-pointer"
                  >
                    Seleccionar todos
                  </button>
                  <span className="text-[#c6c6cd]">·</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[#45464d] hover:text-[#0b1c30] hover:underline cursor-pointer"
                  >
                    Desmarcar todos
                  </button>
                </div>
              </div>

              {/* Grid of Selectable Field Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {camposDisponibles.map((field) => {
                  const isChecked = selectedFields.includes(field.key)
                  return (
                    <div
                      key={field.key}
                      onClick={() => toggleField(field.key)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? "bg-[#eff4ff] border-[#fd761a] shadow-xs"
                          : "bg-white border-[#c6c6cd]/30 hover:border-[#c6c6cd] hover:bg-[#f8f9ff]"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-all ${
                          isChecked
                            ? "bg-[#fd761a] border-[#fd761a] text-white"
                            : "border-[#c6c6cd] bg-white"
                        }`}
                      >
                        {isChecked && <HugeiconsIcon icon={Tick01Icon} size={11} />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-semibold truncate ${
                          isChecked ? "text-[#0b1c30]" : "text-[#45464d]"
                        }`}>
                          {field.label}
                        </span>
                        {field.desc && (
                          <span className="text-[11px] text-[#45464d] truncate">
                            {field.desc}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-[#c6c6cd]/20 bg-[#f8f9ff]">
            <span className="text-xs text-[#45464d]">
              {selectedFields.length === 0
                ? "Selecciona al menos un campo"
                : `${selectedFields.length} campo${selectedFields.length !== 1 ? "s" : ""} seleccionado${selectedFields.length !== 1 ? "s" : ""}`}
            </span>
            <div className="flex items-center gap-2">
              <Dialog.Close className="h-10 px-4 rounded-lg text-xs font-semibold text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors cursor-pointer">
                Cancelar
              </Dialog.Close>
              <button
                type="button"
                onClick={handleExport}
                disabled={selectedFields.length === 0 || exporting}
                className="h-10 px-5 rounded-lg bg-[#fd761a] text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(253,118,26,0.25)]"
              >
                {exporting ? (
                  <>
                    <HugeiconsIcon icon={Clock04Icon} size={16} className="animate-spin" />
                    <span>Generando PDF...</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Download04Icon} size={16} />
                    <span>Descargar PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
