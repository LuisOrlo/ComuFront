import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, AlertCircleIcon, Cancel01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons"

const fields: Array<[string, string]> = [
  ["IGNORE", "Ignorar columna"],
  ["student.full_name", "Nombre completo"],
  ["student.nombres", "Nombres *"],
  ["student.apellidos", "Apellidos *"],
  ["student.cedula", "Cédula (10 dígitos)"],
  ["student.correo", "Correo electrónico"],
  ["student.celular", "Celular (10 dígitos)"],
  ["student.ciudad", "Ciudad"],
]

interface Props {
  headers: string[]
  sampleRows?: Array<Record<string, unknown>>
  mapping: Record<string, string>
  loading: boolean
  onChange: (mapping: Record<string, string>) => void
  onBack: () => void
  onSubmit: () => void
}

export function StudentImportMappingStep({
  headers,
  sampleRows,
  mapping,
  loading,
  onChange,
  onBack,
  onSubmit,
}: Props) {
  const [filter, setFilter] = useState<"all" | "mapped" | "unmapped">("all")

  const totalHeaders = headers.length
  const mappedCount = useMemo(
    () => headers.filter((h) => mapping[h] && mapping[h] !== "IGNORE").length,
    [headers, mapping]
  )
  const unmappedCount = totalHeaders - mappedCount

  const hasNameMapping = useMemo(() => {
    const values = Object.values(mapping)
    const hasFullName = values.includes("student.full_name")
    const hasNames = values.includes("student.nombres") && values.includes("student.apellidos")
    return hasFullName || hasNames
  }, [mapping])

  const filteredHeaders = useMemo(() => {
    return headers.filter((h) => {
      const isMapped = mapping[h] && mapping[h] !== "IGNORE"
      if (filter === "mapped") return isMapped
      if (filter === "unmapped") return !isMapped
      return true
    })
  }, [headers, mapping, filter])

  return (
    <div className="space-y-6">
      {/* Encabezado del paso */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0b1c30]">
            Relaciona las columnas
          </h2>
          <p className="text-sm text-[#45464d] mt-1">
            Indica qué información representa cada columna de tu archivo. Si una columna no te interesa, déjala en <span className="font-semibold text-[#0b1c30]">Ignorar</span>.
          </p>
        </div>
      </div>

      {/* Tarjetas de métricas de mapeo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#c6c6cd]/20 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
              Columnas detectadas
            </span>
            <span className="text-2xl font-bold text-[#0b1c30] mt-0.5">
              {totalHeaders}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#0b1c30] flex items-center justify-center font-bold text-sm">
            {totalHeaders}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#c6c6cd]/20 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#009668]">
              Asignadas al sistema
            </span>
            <span className="text-2xl font-bold text-[#009668] mt-0.5">
              {mappedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#dce9ff] text-[#009668] flex items-center justify-center">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#c6c6cd]/20 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#783200]">
              Ignoradas / Sin asignar
            </span>
            <span className="text-2xl font-bold text-[#783200] mt-0.5">
              {unmappedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#ffdbca] text-[#783200] flex items-center justify-center">
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </div>
        </div>
      </div>

      {/* Alerta de validación de nombres */}
      {!hasNameMapping && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <HugeiconsIcon icon={AlertCircleIcon} size={18} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <span className="font-bold block">Falta asignar el nombre del estudiante:</span>
            <span>Debes relacionar la columna de <strong>Nombre completo</strong> o las columnas de <strong>Nombres</strong> y <strong>Apellidos</strong> para poder continuar.</span>
          </div>
        </div>
      )}

      {/* Contenedor de la tabla con barra de filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#c6c6cd]/20 overflow-hidden">
        <div className="p-4 bg-[#eff4ff]/60 border-b border-[#c6c6cd]/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#0b1c30] mr-2">Mostrar:</span>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === "all"
                  ? "bg-white text-[#0b1c30] shadow-sm border border-[#c6c6cd]/30"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
            >
              Todas ({totalHeaders})
            </button>
            <button
              type="button"
              onClick={() => setFilter("mapped")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === "mapped"
                  ? "bg-white text-[#009668] shadow-sm border border-[#c6c6cd]/30"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
            >
              Asignadas ({mappedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unmapped")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === "unmapped"
                  ? "bg-white text-[#783200] shadow-sm border border-[#c6c6cd]/30"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
            >
              Ignoradas ({unmappedCount})
            </button>
          </div>

          <div className="text-xs text-[#45464d]">
            Mostrando {filteredHeaders.length} de {totalHeaders} columnas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#eff4ff] text-[11px] font-bold uppercase tracking-wider text-[#45464d] border-b border-[#c6c6cd]/20">
              <tr>
                <th className="py-3 px-4">Columna en tu archivo</th>
                <th className="py-3 px-4">Dato de ejemplo (Fila 2)</th>
                <th className="py-3 px-4">Campo del sistema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5eeff]/60 text-[#0b1c30]">
              {filteredHeaders.map((header) => {
                const isAssigned = mapping[header] && mapping[header] !== "IGNORE"
                const sampleValue = sampleRows?.[0]?.[header]

                return (
                  <tr key={header} className="hover:bg-[#eff4ff]/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-sm text-[#0b1c30]">
                      <div className="flex items-center gap-2">
                        <span>{header}</span>
                        {isAssigned && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#009668]" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#45464d] font-mono text-xs max-w-xs truncate">
                      {sampleValue !== null && sampleValue !== undefined && String(sampleValue).trim() !== ""
                        ? String(sampleValue)
                        : <span className="text-[#c6c6cd] italic">— sin dato en fila 2 —</span>}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={mapping[header] || "IGNORE"}
                        onChange={(event) =>
                          onChange({ ...mapping, [header]: event.target.value })
                        }
                        className={`w-full max-w-xs rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#fd761a]/20 transition-all ${
                          isAssigned
                            ? "border-[#009668]/30 bg-emerald-50/30 text-[#0b1c30]"
                            : "border-[#c6c6cd]/50 bg-white text-[#76777d]"
                        }`}
                      >
                        {fields.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra de navegación inferior */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#c6c6cd]/30 bg-white text-[#0b1c30] text-xs font-bold shadow-sm hover:bg-[#eff4ff] transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          <span>Atrás</span>
        </button>

        <button
          type="button"
          disabled={loading || !hasNameMapping}
          onClick={onSubmit}
          className="px-6 py-2.5 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Validando mapeo...</span>
            </>
          ) : (
            <span>Continuar a opciones académicas</span>
          )}
        </button>
      </div>
    </div>
  )
}
