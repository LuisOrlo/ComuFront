import type { ImportExecutionResponse } from "@/services/student-import.service"

const statusLabels: Record<string, string> = { IMPORTED: "Importada", BLOCKED: "Bloqueada", SKIPPED: "Omitida", FAILED: "Fallida" }
const actionLabels: Record<string, string> = {
  CREATED_PROFILE_CREATED: "Estudiante creado",
  BLOCKED_FINANCE: "Requiere corrección financiera",
  BLOCKED: "Requiere revisión",
  SKIPPED_BY_USER: "Omitida por el usuario",
  ROW_NOT_CONFIRMED: "Fila no confirmada",
  IDENTITY_DECISION_REQUIRED: "Requiere decisión de identidad",
}

function ImportMetric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "warning" | "danger" }) {
  const colors = { default: "border-gray-200 bg-gray-50 text-[#0b1c30]", success: "border-green-200 bg-green-50 text-green-800", warning: "border-orange-200 bg-orange-50 text-orange-800", danger: "border-red-200 bg-red-50 text-red-800" }
  return <div className={`rounded-xl border p-4 ${colors[tone]}`}><div className="text-xs font-medium uppercase tracking-wide opacity-75">{label}</div><div className="mt-1 text-2xl font-bold">{value}</div></div>
}

export function StudentImportResultStep({ result, onClose }: { result: ImportExecutionResponse; onClose: () => void }) {
  const value = (key: string) => Number(result.summary[key] ?? 0)
  const hasProblems = value("blocked") > 0 || value("failed") > 0
  const hasFinance = value("finance_created") > 0 || value("transactions_created") > 0

  return <div className="space-y-6">
    <div><h3 className="font-semibold text-gray-900">Importación procesada</h3><p className="mt-1 text-sm text-gray-500">{hasProblems ? "La importación terminó con filas que requieren revisión." : "Importación completada correctamente."}</p></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5"><ImportMetric label="Procesadas" value={value("processed")} /><ImportMetric label="Importadas" value={value("imported")} tone="success" /><ImportMetric label="Bloqueadas" value={value("blocked")} tone="warning" /><ImportMetric label="Omitidas" value={value("skipped")} /><ImportMetric label="Fallidas" value={value("failed")} tone="danger" /></div>
    {hasFinance && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><strong>Finanzas:</strong> {value("finance_created")} estudiante{value("finance_created") === 1 ? "" : "s"} con información financiera registrada y {value("transactions_created")} movimiento{value("transactions_created") === 1 ? "" : "s"} creado{value("transactions_created") === 1 ? "" : "s"}.</div>}
    <details className="group overflow-hidden rounded-xl border border-gray-200"><summary className="flex cursor-pointer list-none items-center justify-between bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 select-none"><span>Ver detalles técnicos</span><span className="text-xs text-gray-500 transition-transform group-open:rotate-180">⌄</span></summary><div className="grid gap-4 border-t p-4 text-sm md:grid-cols-2 lg:grid-cols-4">
      <div><h4 className="mb-2 font-semibold text-gray-800">Resultado</h4><dl className="space-y-1 text-gray-600"><div className="flex justify-between gap-3"><dt>Procesadas</dt><dd>{value("processed")}</dd></div><div className="flex justify-between gap-3"><dt>Importadas</dt><dd>{value("imported")}</dd></div><div className="flex justify-between gap-3"><dt>Bloqueadas</dt><dd>{value("blocked")}</dd></div><div className="flex justify-between gap-3"><dt>Omitidas</dt><dd>{value("skipped")}</dd></div><div className="flex justify-between gap-3"><dt>Fallidas</dt><dd>{value("failed")}</dd></div></dl></div>
      <div><h4 className="mb-2 font-semibold text-gray-800">Estudiantes</h4><dl className="space-y-1 text-gray-600"><div className="flex justify-between gap-3"><dt>Estudiantes creados</dt><dd>{value("created_students")}</dd></div><div className="flex justify-between gap-3"><dt>Estudiantes reutilizados</dt><dd>{value("reused_students")}</dd></div><div className="flex justify-between gap-3"><dt>Perfiles creados</dt><dd>{value("profiles_created")}</dd></div></dl></div>
      <div><h4 className="mb-2 font-semibold text-gray-800">Matrículas</h4><dl className="space-y-1 text-gray-600"><div className="flex justify-between gap-3"><dt>Matrículas creadas</dt><dd>{value("enrollments_created")}</dd></div><div className="flex justify-between gap-3"><dt>Matrículas omitidas</dt><dd>{value("enrollments_skipped")}</dd></div><div className="flex justify-between gap-3"><dt>Errores de matrícula</dt><dd>{value("enrollment_failed")}</dd></div></dl></div>
      <div><h4 className="mb-2 font-semibold text-gray-800">Finanzas</h4><dl className="space-y-1 text-gray-600"><div className="flex justify-between gap-3"><dt>Finanzas creadas</dt><dd>{value("finance_created")}</dd></div><div className="flex justify-between gap-3"><dt>Finanzas existentes</dt><dd>{value("finance_already_imported")}</dd></div><div className="flex justify-between gap-3"><dt>Errores financieros</dt><dd>{value("finance_failed")}</dd></div><div className="flex justify-between gap-3"><dt>Líneas financieras</dt><dd>{value("financial_lines_created")}</dd></div><div className="flex justify-between gap-3"><dt>Cuentas por cobrar</dt><dd>{value("accounts_created")}</dd></div><div className="flex justify-between gap-3"><dt>Transacciones</dt><dd>{value("transactions_created")}</dd></div></dl></div>
    </div></details>
    <div className="overflow-x-auto rounded-xl border"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Fila</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acción</th><th className="px-4 py-3">Detalle</th></tr></thead><tbody className="divide-y">{result.rows.map((row) => { const errors = row.errors?.map((error) => error.message) || []; const warnings = row.warnings?.map((warning) => warning.message) || []; return <tr key={row.row_number}><td className="px-4 py-3">{row.row_number}</td><td className="px-4 py-3">{statusLabels[row.status] || row.status}</td><td className="px-4 py-3">{actionLabels[row.action || ""] || row.action || "—"}</td><td className="space-y-1 px-4 py-3 text-xs">{errors.length > 0 && <div className="font-semibold text-red-700">{errors.join(" ")}</div>}{warnings.length > 0 && <div className="text-orange-700">{warnings.join(" ")}</div>}{errors.length === 0 && warnings.length === 0 && "—"}</td></tr> })}</tbody></table></div>
    <div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-lg bg-[#0b1c30] px-5 py-2 text-sm font-semibold text-white">Finalizar</button></div>
  </div>
}
