const fields = [
  ["IGNORE", "Ignorar"],
  ["student.full_name", "Nombre completo"],
  ["student.nombres", "Nombres"],
  ["student.apellidos", "Apellidos"],
  ["student.cedula", "Cédula"],
  ["student.correo", "Correo"],
  ["student.celular", "Celular"],
  ["student.ciudad", "Ciudad"],
]

interface Props {
  headers: string[]
  mapping: Record<string, string>
  loading: boolean
  onChange: (mapping: Record<string, string>) => void
  onBack: () => void
  onSubmit: () => void
}

export function StudentImportMappingStep({ headers, mapping, loading, onChange, onBack, onSubmit }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900">Confirma el mapeo de columnas</h3>
        <p className="mt-1 text-sm text-gray-500">Las sugerencias son automáticas; puedes cambiar o ignorar cualquier columna.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Columna Excel</th><th className="px-4 py-3">Campo del sistema</th></tr></thead>
          <tbody className="divide-y">
            {headers.map((header) => (
              <tr key={header}>
                <td className="px-4 py-3 font-medium text-gray-800">{header}</td>
                <td className="px-4 py-3">
                  <select value={mapping[header] || "IGNORE"} onChange={(event) => onChange({ ...mapping, [header]: event.target.value })} className="w-full rounded-lg border-gray-200 text-sm">
                    {fields.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="rounded-lg border px-4 py-2 text-sm text-gray-700">Atrás</button>
        <button type="button" disabled={loading} onClick={onSubmit} className="rounded-lg bg-[#0b1c30] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Validando..." : "Continuar"}</button>
      </div>
    </div>
  )
}
