import { useEffect, useMemo, useState } from "react"
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

const methods = ["efectivo", "transferencia", "deposito", "tarjeta", "otro"]

export function StudentImportFinanceStep({ headers, courseId, loading, onBack, onSubmit }: Props) {
  const [modules, setModules] = useState<ImportModule[]>([])
  const [groups, setGroups] = useState<Group[]>([{ external_group_key: "module_1", external_group_name: "MÓDULO I", total_column: "", paid_column: "", balance_column: "", modulo_id: "" }])
  const [date, setDate] = useState("")
  const [method, setMethod] = useState("")
  const [confirmImpact, setConfirmImpact] = useState(false)
  const [confirmPrice, setConfirmPrice] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    studentImportService.getCourseModules(courseId).then(setModules).catch(() => setError("No se pudieron cargar los módulos del curso."))
  }, [courseId])

  const hasDuplicateColumns = useMemo(() => groups.some((group) => {
    const columns = [group.total_column, group.paid_column, group.balance_column].filter(Boolean)
    return new Set(columns).size !== columns.length
  }), [groups])
  const valid = useMemo(() => groups.length > 0 && !hasDuplicateColumns && groups.every((group) => group.external_group_name && group.total_column && group.paid_column && group.balance_column && group.modulo_id) && Boolean(date) && Boolean(method) && confirmImpact, [groups, date, method, confirmImpact, hasDuplicateColumns])
  const updateGroup = (index: number, field: keyof Group, value: string) => setGroups((current) => current.map((group, itemIndex) => itemIndex === index ? { ...group, [field]: value } : group))

  return <div className="space-y-5">
    <div><h3 className="font-semibold text-gray-900">Configuración financiera</h3><p className="mt-1 text-sm text-gray-500">Asocia cada grupo TOTAL / ABONO / SALDO del Excel con un módulo real del curso.</p></div>
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><strong>Impacto contable real:</strong> los pagos históricos se registrarán como movimientos financieros y afectarán caja, cuentas por cobrar y reportes históricos.</div>
    <div className="space-y-4 rounded-xl border p-4">
      {groups.map((group, index) => <div key={group.external_group_key} className="grid gap-3 rounded-lg bg-gray-50 p-3 md:grid-cols-6">
        <input value={group.external_group_name} onChange={(event) => updateGroup(index, "external_group_name", event.target.value)} placeholder="Grupo Excel" className="rounded border-gray-200 text-sm" />
        {(["total_column", "paid_column", "balance_column"] as const).map((field) => <select key={field} value={group[field]} onChange={(event) => updateGroup(index, field, event.target.value)} className="rounded border-gray-200 text-sm"><option value="">{field === "total_column" ? "Columna TOTAL" : field === "paid_column" ? "Columna ABONO" : "Columna SALDO"}</option>{headers.map((header) => <option key={`${field}-${header}`} value={header}>{header}</option>)}</select>)}
        <select value={group.modulo_id} onChange={(event) => updateGroup(index, "modulo_id", event.target.value)} className="rounded border-gray-200 text-sm"><option value="">Módulo real</option>{modules.map((module) => <option key={module.id} value={module.id}>{module.numero_orden ? `${module.numero_orden}. ` : ""}{module.nombre_modulo || module.id} · ${module.precio_base ?? 0}</option>)}</select>
        <button type="button" onClick={() => setGroups((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={groups.length === 1} className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 disabled:opacity-40">Quitar grupo</button>
      </div>)}
      <button type="button" onClick={() => setGroups((current) => [...current, { external_group_key: `module_${current.length + 1}`, external_group_name: `MÓDULO ${current.length + 1}`, total_column: "", paid_column: "", balance_column: "", modulo_id: "" }])} className="rounded border px-3 py-2 text-sm">Agregar grupo</button>
    </div>
    <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-3">
      <label className="text-sm text-gray-700">Fecha histórica<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 block w-full rounded border-gray-200" /></label>
      <label className="text-sm text-gray-700">Método de pago<select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-1 block w-full rounded border-gray-200"><option value="">Seleccionar</option>{methods.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <p className="self-end text-xs text-gray-500">Los abonos de cada módulo se registrarán como una única transacción histórica consolidada.</p>
    </div>
      <label className="flex gap-2 text-sm text-gray-700"><input type="checkbox" checked={confirmImpact} onChange={(event) => setConfirmImpact(event.target.checked)} />Confirmo que los pagos afectarán caja y reportes financieros reales.</label>
    {hasDuplicateColumns && <p className="text-sm text-red-700">TOTAL, ABONO y SALDO deben estar mapeados a columnas diferentes para cada módulo.</p>}
    <label className="flex gap-2 text-sm text-gray-700"><input type="checkbox" checked={confirmPrice} onChange={(event) => setConfirmPrice(event.target.checked)} />Confirmo que pueden existir diferencias entre el precio actual y el valor histórico del Excel.</label>
    {error && <p className="text-sm text-red-700">{error}</p>}
    <div className="flex justify-between"><button type="button" onClick={onBack} className="rounded-lg border px-4 py-2 text-sm text-gray-700">Atrás</button><button type="button" disabled={!valid || loading} onClick={() => onSubmit({ enabled: true, confirm_real_financial_impact: true, groups, payment_options: { fecha_pago_default: date, metodo_pago: method, confirm_price_differences: confirmPrice } })} className="rounded-lg bg-[#0b1c30] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Generando preview..." : "Generar preview financiero"}</button></div>
  </div>
}
