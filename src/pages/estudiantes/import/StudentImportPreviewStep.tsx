import { useState } from "react"
import type { ImportPreviewRow } from "@/services/student-import.service"

interface Props {
  rows: ImportPreviewRow[]
  enrollment?: Record<string, unknown>
  finance?: Record<string, unknown>
  loading: boolean
  onBack: () => void
  onSubmit: (rows: ImportPreviewRow[], decisions: Record<number, Record<string, unknown>>) => void
}

export function StudentImportPreviewStep({ rows, enrollment, finance, loading, onBack, onSubmit }: Props) {
  const [decisions, setDecisions] = useState<Record<number, Record<string, unknown>>>({})

  const setDecision = (row: ImportPreviewRow, value: string) => {
    const next = { ...decisions }
    if (value === "SKIP") next[row.row_number] = { skip: true, identity_decision: "SKIP" }
    else next[row.row_number] = {
      ...(next[row.row_number] || {}),
      identity_decision: value,
      confirm_name_inference: Boolean(row.student.name_inference),
    }
    setDecisions(next)
  }

  const toggleInference = (row: ImportPreviewRow, checked: boolean) => {
    setDecisions({ ...decisions, [row.row_number]: { ...(decisions[row.row_number] || { identity_decision: "CREATE_NEW" }), confirm_name_inference: checked } })
  }

  const correctName = (row: ImportPreviewRow, field: "nombres" | "apellidos", value: string) => {
    setDecisions({
      ...decisions,
      [row.row_number]: {
        ...(decisions[row.row_number] || { identity_decision: "CREATE_NEW" }),
        corrections: {
          ...((decisions[row.row_number]?.corrections as Record<string, unknown> | undefined) || {}),
          [field]: value,
        },
        confirm_name_inference: false,
      },
    })
  }

  const selectable = rows.filter((row) => row.status !== "BLOCKED")

  return (
    <div className="space-y-5">
      <div><h3 className="font-semibold text-gray-900">Previsualización</h3><p className="mt-1 text-sm text-gray-500">Las filas bloqueadas deben corregirse u omitirse.</p></div>
      {Boolean(enrollment?.enabled) && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><strong>Curso seleccionado:</strong> {String(enrollment?.curso_nombre || enrollment?.nombre_instancia || "Curso")} · {String(enrollment?.fecha_inicio || "—")} → {String(enrollment?.fecha_fin || "—")} {Boolean(enrollment?.historico) && <span className="font-semibold">· Histórico</span>}<div className="mt-1">Estudiantes a matricular: {rows.filter((row) => row.enrollment?.status === "PENDING_STUDENT" || row.enrollment?.status === "ENROLLMENT_AVAILABLE").length} · Cupos disponibles: {enrollment?.espacios_disponibles == null ? "sin límite indicado" : String(enrollment.espacios_disponibles)}</div><p className="mt-2 font-medium">Los estudiantes serán matriculados en el curso seleccionado sin generar cargos ni movimientos financieros.</p></div>}
      {Boolean(finance?.enabled) && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><strong>Impacto financiero real:</strong> los movimientos aprobados afectarán caja y reportes históricos.<div className="mt-2 grid gap-2 md:grid-cols-4"><span>Estudiantes: {rows.filter((row) => row.finance?.enabled).length}</span><span>Módulos: {rows.reduce((sum, row) => sum + (row.finance?.financial_modules?.length || 0), 0)}</span><span>Total: ${rows.reduce((sum, row) => sum + Number(row.finance?.total || 0), 0).toFixed(2)}</span><span>Abonado: ${rows.reduce((sum, row) => sum + Number(row.finance?.paid || 0), 0).toFixed(2)}</span></div></div>}
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-[1450px] w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-3 py-3">Fila</th><th className="px-3 py-3">Nombres</th><th className="px-3 py-3">Apellidos</th><th className="px-3 py-3">Cédula</th><th className="px-3 py-3">Correo</th><th className="px-3 py-3">Ciudad</th><th className="px-3 py-3">Curso</th><th className="px-3 py-3">Estado matrícula</th>{Boolean(finance?.enabled) && <><th className="px-3 py-3">Finanzas</th><th className="px-3 py-3">Total / abono / saldo</th></>}<th className="px-3 py-3">Estado</th><th className="px-3 py-3">Acción</th></tr></thead>
          <tbody className="divide-y">
            {rows.map((row) => {
              const decision = decisions[row.row_number]
              const possible = ["POSSIBLE_DUPLICATE", "EXISTING_PERSON_WITHOUT_STUDENT_PROFILE"].includes(row.identity_resolution.status)
              return <tr key={row.row_number} className={row.status === "BLOCKED" ? "bg-red-50" : ""}>
                <td className="px-3 py-3">{row.row_number}</td>
                <td className="px-3 py-3">{row.student.name_inference ? <input value={String((decisions[row.row_number]?.corrections as Record<string, unknown> | undefined)?.nombres ?? row.student.nombres ?? "")} onChange={(event) => correctName(row, "nombres", event.target.value)} className="w-40 rounded border-gray-200 text-xs" /> : (row.student.nombres || "—")}{row.student.name_inference && <span className="ml-1 text-xs text-orange-600">inferido</span>}</td>
                <td className="px-3 py-3">{row.student.name_inference ? <input value={String((decisions[row.row_number]?.corrections as Record<string, unknown> | undefined)?.apellidos ?? row.student.apellidos ?? "")} onChange={(event) => correctName(row, "apellidos", event.target.value)} className="w-40 rounded border-gray-200 text-xs" /> : (row.student.apellidos || "—")}</td>
                <td className="px-3 py-3">{row.student.cedula || "—"}</td>
                <td className="px-3 py-3">{row.student.correo || "—"}</td>
                <td className="px-3 py-3">{row.student.ciudad || "—"}{row.city_resolution?.status === "TEXT_ONLY_CITY" && <span className="ml-1 text-xs text-orange-600">texto</span>}</td>
                <td className="px-3 py-3">{row.enrollment?.curso_nombre || (enrollment?.enabled ? String(enrollment?.nombre_instancia || "Curso") : "—")}</td>
                <td className="px-3 py-3 text-xs">{row.enrollment?.status === "PENDING_STUDENT" ? "Listo para matricular" : row.enrollment?.status === "CUSTOM_COURSE_NOT_SUPPORTED" ? "Personalizado no soportado" : row.enrollment?.status || "No aplica"}</td>
                {Boolean(finance?.enabled) && <><td className="px-3 py-3 text-xs">{row.finance?.status || "—"}{row.finance?.warnings?.map((warning) => <span key={warning.code} className="block text-orange-600">{warning.message}</span>)}</td><td className="px-3 py-3 text-xs">${Number(row.finance?.total || 0).toFixed(2)} / ${Number(row.finance?.paid || 0).toFixed(2)} / ${Number(row.finance?.balance || 0).toFixed(2)}</td></>}
                <td className="px-3 py-3 font-semibold">{row.status}</td>
                <td className="space-y-2 px-3 py-3">
                  {row.status === "BLOCKED" ? <span className="text-xs text-red-700">{row.errors.map((error) => error.message).join(" ")}</span> : <>
                    <select value={decision?.skip ? "SKIP" : (typeof decision?.identity_decision === "string" ? decision.identity_decision : (possible ? "" : "CREATE_NEW"))} onChange={(event) => setDecision(row, event.target.value)} className="rounded-lg border-gray-200 text-xs">
                      {possible && <option value="">Seleccionar acción</option>}
                      <option value="CREATE_NEW">Crear nuevo</option>
                      {row.identity_resolution.candidates?.map((candidate) => <option key={String(candidate.id)} value={`USE_EXISTING:${String(candidate.id)}`}>Usar {String(candidate.nombres)} {String(candidate.apellidos)}</option>)}
                      {row.identity_resolution.status === "EXISTING_PERSON_WITHOUT_STUDENT_PROFILE" && row.identity_resolution.persona_id && <option value={`USE_EXISTING:${row.identity_resolution.persona_id}`}>Usar Persona existente y crear perfil</option>}
                      <option value="SKIP">Omitir</option>
                    </select>
                    {row.student.name_inference && <label className="block text-xs text-gray-600"><input type="checkbox" checked={Boolean(decision?.confirm_name_inference)} onChange={(event) => toggleInference(row, event.target.checked)} className="mr-1" />Confirmar nombre inferido</label>}
                  </>}
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="rounded-lg border px-4 py-2 text-sm text-gray-700">Atrás</button>
        <button type="button" disabled={loading || selectable.length === 0} onClick={() => onSubmit(rows, Object.fromEntries(Object.entries(decisions).map(([key, value]) => {
          const identityDecision = typeof value.identity_decision === "string" ? value.identity_decision : ""
          return [key, identityDecision.startsWith("USE_EXISTING:") ? { ...value, identity_decision: "USE_EXISTING", selected_existing_persona_id: identityDecision.split(":")[1] } : value]
        })))} className="rounded-lg bg-[#0b1c30] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Importando..." : "Confirmar importación"}</button>
      </div>
    </div>
  )
}
