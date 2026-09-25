import { useEffect, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Coins01Icon,
  AlertCircleIcon,
  Cancel01Icon,
  AddCircleIcon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { studentImportService, type ImportModule } from "@/services/student-import.service"

interface Props {
  headers: string[]
  courseId: string
  loading: boolean
  onBack: () => void
  onSubmit: (finance: Record<string, unknown>) => void
}

interface Group {
  external_group_key: string
  external_group_name: string
  total_column: string
  paid_column: string
  balance_column: string
  modulo_id: string
}

const methods = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia bancaria" },
  { value: "deposito", label: "Depósito bancario" },
  { value: "tarjeta", label: "Tarjeta de crédito/débito" },
  { value: "otro", label: "Otro método" },
]

export function StudentImportFinanceStep({
  headers,
  courseId,
  loading,
  onBack,
  onSubmit,
}: Props) {
  const [modules, setModules] = useState<ImportModule[]>([])
  const [groups, setGroups] = useState<Group[]>([
    {
      external_group_key: "module_1",
      external_group_name: "MÓDULO I",
      total_column: "",
      paid_column: "",
      balance_column: "",
      modulo_id: "",
    },
  ])
  const [date, setDate] = useState("")
  const [method, setMethod] = useState("")
  const [confirmImpact, setConfirmImpact] = useState(false)
  const [confirmPrice, setConfirmPrice] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    studentImportService
      .getCourseModules(courseId)
      .then(setModules)
      .catch(() => setError("No se pudieron cargar los módulos del curso."))
  }, [courseId])

  const hasDuplicateColumns = useMemo(
    () =>
      groups.some((group) => {
        const columns = [group.total_column, group.paid_column, group.balance_column].filter(Boolean)
        return new Set(columns).size !== columns.length
      }),
    [groups]
  )

  const valid = useMemo(
    () =>
      groups.length > 0 &&
      !hasDuplicateColumns &&
      groups.every(
        (group) =>
          group.external_group_name &&
          group.total_column &&
          group.paid_column &&
          group.balance_column &&
          group.modulo_id
      ) &&
      Boolean(date) &&
      Boolean(method) &&
      confirmImpact,
    [groups, date, method, confirmImpact, hasDuplicateColumns]
  )

  const updateGroup = (index: number, field: keyof Group, value: string) => {
    setGroups((current) =>
      current.map((group, itemIndex) =>
        itemIndex === index ? { ...group, [field]: value } : group
      )
    )
  }

  const addGroup = () => {
    const nextNum = groups.length + 1
    setGroups((current) => [
      ...current,
      {
        external_group_key: `module_${nextNum}`,
        external_group_name: `MÓDULO ${nextNum}`,
        total_column: "",
        paid_column: "",
        balance_column: "",
        modulo_id: "",
      },
    ])
  }

  const removeGroup = (index: number) => {
    setGroups((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0b1c30]">
          Configuración financiera
        </h2>
        <p className="text-sm text-[#45464d] mt-1">
          Asocia cada grupo de columnas (TOTAL, ABONO, SALDO) de tu Excel con un módulo académico real del curso.
        </p>
      </div>

      {/* Banner de Impacto Contable Real */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
        <HugeiconsIcon icon={AlertCircleIcon} size={20} className="shrink-0 text-[#9d4300] mt-0.5" />
        <div className="text-xs">
          <strong className="block font-bold">Impacto contable real en caja:</strong>
          <span className="mt-0.5 block leading-relaxed">
            Los valores reconocidos como abonos históricos se registrarán como transacciones de ingreso reales en el balance contable y afectarán caja, cuentas por cobrar y reportes financieros.
          </span>
        </div>
      </div>

      {/* Tarjeta de Grupos de Módulos */}
      <div className="bg-white rounded-2xl p-6 border border-[#c6c6cd]/20 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Coins01Icon} size={18} className="text-[#fd761a]" />
            <h3 className="font-bold text-sm text-[#0b1c30]">Mapeo de Módulos Financieros</h3>
          </div>
          <button
            type="button"
            onClick={addGroup}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c6c6cd]/30 text-xs font-bold text-[#0b1c30] hover:bg-[#eff4ff] transition-colors"
          >
            <HugeiconsIcon icon={AddCircleIcon} size={14} />
            <span>Agregar módulo</span>
          </button>
        </div>

        <div className="space-y-3">
          {groups.map((group, index) => (
            <div
              key={group.external_group_key}
              className="p-4 rounded-xl bg-[#eff4ff]/40 border border-[#c6c6cd]/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-center"
            >
              <div className="lg:col-span-1">
                <label className="text-[10px] font-bold uppercase text-[#76777d] block mb-1">
                  Etiqueta
                </label>
                <input
                  value={group.external_group_name}
                  onChange={(e) => updateGroup(index, "external_group_name", e.target.value)}
                  placeholder="Módulo 1"
                  className="w-full rounded-lg border border-[#c6c6cd]/40 px-2.5 py-1.5 text-xs font-semibold bg-white text-[#0b1c30] focus:outline-none focus:ring-1 focus:ring-[#fd761a]"
                />
              </div>

              {(["total_column", "paid_column", "balance_column"] as const).map((field) => (
                <div key={field} className="lg:col-span-1">
                  <label className="text-[10px] font-bold uppercase text-[#76777d] block mb-1 truncate">
                    {field === "total_column" ? "Col. TOTAL" : field === "paid_column" ? "Col. ABONO" : "Col. SALDO"}
                  </label>
                  <select
                    value={group[field]}
                    onChange={(e) => updateGroup(index, field, e.target.value)}
                    className="w-full rounded-lg border border-[#c6c6cd]/40 px-2 py-1.5 text-xs font-semibold bg-white text-[#0b1c30] focus:outline-none focus:ring-1 focus:ring-[#fd761a]"
                  >
                    <option value="">Seleccionar col...</option>
                    {headers.map((header) => (
                      <option key={`${field}-${header}`} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="lg:col-span-1">
                <label className="text-[10px] font-bold uppercase text-[#76777d] block mb-1 truncate">
                  Módulo Real
                </label>
                <select
                  value={group.modulo_id}
                  onChange={(e) => updateGroup(index, "modulo_id", e.target.value)}
                  className="w-full rounded-lg border border-[#c6c6cd]/40 px-2 py-1.5 text-xs font-semibold bg-white text-[#0b1c30] focus:outline-none focus:ring-1 focus:ring-[#fd761a]"
                >
                  <option value="">Asignar a módulo...</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.numero_orden ? `${m.numero_orden}. ` : ""}
                      {m.nombre_modulo || m.id} (${m.precio_base ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeGroup(index)}
                  disabled={groups.length === 1}
                  className="p-1.5 rounded-lg text-[#76777d] hover:text-[#ba1a1a] hover:bg-white disabled:opacity-30 transition-colors"
                  title="Eliminar grupo"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {hasDuplicateColumns && (
          <p className="text-xs text-[#ba1a1a] font-semibold">
            TOTAL, ABONO y SALDO deben estar asignados a columnas diferentes en cada módulo.
          </p>
        )}
      </div>

      {/* Parámetros de Transacción */}
      <div className="bg-white rounded-2xl p-6 border border-[#c6c6cd]/20 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[#0b1c30]">Datos del Pago Histórico</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#45464d] block mb-1.5">
              Fecha histórica de pago *
            </label>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-[#c6c6cd]/40 px-3.5 py-2.5 text-xs sm:text-sm font-semibold bg-white text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#fd761a]/20"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#45464d] block mb-1.5">
              Método de pago utilizado *
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-xl border border-[#c6c6cd]/40 px-3.5 py-2.5 text-xs sm:text-sm font-semibold bg-white text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#fd761a]/20"
            >
              <option value="">Seleccionar método...</option>
              {methods.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-[#76777d]">
          Los abonos de cada módulo se registrarán en el sistema como transacciones de ingreso individuales vinculadas a la matrícula.
        </p>

        {/* Checkboxes de Confirmación Obligatorios */}
        <div className="space-y-2.5 pt-2 border-t border-[#c6c6cd]/20">
          <label className="flex items-start gap-3 cursor-pointer text-xs text-[#0b1c30] font-medium">
            <input
              type="checkbox"
              checked={confirmImpact}
              onChange={(e) => setConfirmImpact(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#c6c6cd] text-[#fd761a] focus:ring-0 accent-[#fd761a]"
            />
            <span>
              Confirmo que los pagos afectarán caja y reportes financieros reales de la academia. *
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer text-xs text-[#0b1c30] font-medium">
            <input
              type="checkbox"
              checked={confirmPrice}
              onChange={(e) => setConfirmPrice(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#c6c6cd] text-[#fd761a] focus:ring-0 accent-[#fd761a]"
            />
            <span>
              Confirmo que pueden existir diferencias entre el precio del catálogo actual y el valor histórico registrado en el archivo.
            </span>
          </label>
        </div>

        {error && <p className="text-xs text-[#ba1a1a] font-semibold">{error}</p>}
      </div>

      {/* Botones de navegación inferior */}
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
          disabled={!valid || loading}
          onClick={() =>
            onSubmit({
              enabled: true,
              confirm_real_financial_impact: true,
              groups,
              payment_options: {
                fecha_pago_default: date,
                metodo_pago: method,
                confirm_price_differences: confirmPrice,
              },
            })
          }
          className="px-6 py-2.5 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generando previsualización...</span>
            </>
          ) : (
            <span>Generar previsualización financiera</span>
          )}
        </button>
      </div>
    </div>
  )
}
