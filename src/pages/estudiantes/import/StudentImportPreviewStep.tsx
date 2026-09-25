import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Cancel01Icon,
  Coins01Icon,
  ArrowLeft01Icon,
  GraduationCapIcon,
} from "@hugeicons/core-free-icons"
import type { ImportPreviewRow } from "@/services/student-import.service"

interface Props {
  rows: ImportPreviewRow[]
  enrollment?: Record<string, unknown>
  finance?: Record<string, unknown>
  loading: boolean
  onBack: () => void
  onSubmit: (rows: ImportPreviewRow[], decisions: Record<number, Record<string, unknown>>) => void
}

export function StudentImportPreviewStep({
  rows,
  enrollment,
  finance,
  loading,
  onBack,
  onSubmit,
}: Props) {
  const [decisions, setDecisions] = useState<Record<number, Record<string, unknown>>>({})
  const [filter, setFilter] = useState<"all" | "ready" | "warning" | "blocked">("all")

  const setDecision = (row: ImportPreviewRow, value: string) => {
    const next = { ...decisions }
    if (value === "SKIP") {
      next[row.row_number] = { skip: true, identity_decision: "SKIP" }
    } else {
      next[row.row_number] = {
        ...(next[row.row_number] || {}),
        identity_decision: value,
        confirm_name_inference: Boolean(row.student.name_inference),
      }
    }
    setDecisions(next)
  }

  const toggleInference = (row: ImportPreviewRow, checked: boolean) => {
    setDecisions({
      ...decisions,
      [row.row_number]: {
        ...(decisions[row.row_number] || { identity_decision: "CREATE_NEW" }),
        confirm_name_inference: checked,
      },
    })
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

  const readyCount = useMemo(() => rows.filter((r) => r.status === "READY").length, [rows])
  const warningCount = useMemo(() => rows.filter((r) => r.status === "WARNING").length, [rows])
  const blockedCount = useMemo(() => rows.filter((r) => r.status === "BLOCKED").length, [rows])

  const totalFinancialPaid = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.finance?.paid || 0), 0),
    [rows]
  )

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filter === "ready") return row.status === "READY"
      if (filter === "warning") return row.status === "WARNING"
      if (filter === "blocked") return row.status === "BLOCKED"
      return true
    })
  }, [rows, filter])

  const selectable = rows.filter((row) => row.status !== "BLOCKED")

  const handleSubmit = () => {
    const formattedDecisions = Object.fromEntries(
      Object.entries(decisions).map(([key, value]) => {
        const identityDecision = typeof value.identity_decision === "string" ? value.identity_decision : ""
        return [
          key,
          identityDecision.startsWith("USE_EXISTING:")
            ? {
                ...value,
                identity_decision: "USE_EXISTING",
                selected_existing_persona_id: identityDecision.split(":")[1],
              }
            : value,
        ]
      })
    )
    onSubmit(rows, formattedDecisions)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Encabezado */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0b1c30]">
          Revisa antes de importar
        </h2>
        <p className="text-sm text-[#45464d] mt-1">
          Corrige o decide qué hacer con las filas que necesitan atención. Nada se guardará en la base de datos hasta que confirmes la importación.
        </p>
      </div>

      {/* Banner de Contexto de Matrícula */}
      {Boolean(enrollment?.enabled) && (
        <div className="p-4 rounded-2xl bg-[#eff4ff] border border-[#c6c6cd]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dce9ff] text-[#0b1c30] flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={GraduationCapIcon} size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#0b1c30]">
                  {String(enrollment?.curso_nombre || enrollment?.nombre_instancia || "Curso")}
                </span>
                {Boolean(enrollment?.historico) && (
                  <span className="px-2 py-0.5 rounded-full bg-[#ffdbca] text-[#783200] text-[10px] font-bold">
                    Histórico
                  </span>
                )}
              </div>
              <p className="text-xs text-[#45464d] mt-0.5">
                Fechas: {String(enrollment?.fecha_inicio || "—")} → {String(enrollment?.fecha_fin || "—")}
                {enrollment?.espacios_disponibles !== null && enrollment?.espacios_disponibles !== undefined
                  ? ` · Cupos disponibles: ${String(enrollment.espacios_disponibles)}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="text-xs text-[#009668] font-bold bg-white px-3 py-1.5 rounded-xl border border-[#c6c6cd]/20 self-start sm:self-center">
            {rows.filter((r) => r.enrollment?.status === "PENDING_STUDENT" || r.enrollment?.status === "ENROLLMENT_AVAILABLE").length} a matricular
          </div>
        </div>
      )}

      {/* Tarjetas KPI Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Listas */}
        <div className="p-4 rounded-xl bg-white border border-[#c6c6cd]/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#009668]">
              Listas para crearse
            </span>
            <div className="text-2xl font-bold text-[#009668] mt-0.5">
              {readyCount}
            </div>
            <span className="text-[11px] text-[#76777d]">Datos íntegros y válidos</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#dce9ff] text-[#009668] flex items-center justify-center">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
          </div>
        </div>

        {/* KPI 2: Requieren decisión */}
        <div className="p-4 rounded-xl bg-white border border-[#c6c6cd]/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#783200]">
              Requieren decisión
            </span>
            <div className="text-2xl font-bold text-[#783200] mt-0.5">
              {warningCount}
            </div>
            <span className="text-[11px] text-[#76777d]">Duplicados o nombres inferidos</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#ffdbca] text-[#783200] flex items-center justify-center">
            <HugeiconsIcon icon={AlertCircleIcon} size={20} />
          </div>
        </div>

        {/* KPI 3: Bloqueadas */}
        <div className="p-4 rounded-xl bg-white border border-[#c6c6cd]/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ba1a1a]">
              Filas bloqueadas
            </span>
            <div className="text-2xl font-bold text-[#ba1a1a] mt-0.5">
              {blockedCount}
            </div>
            <span className="text-[11px] text-[#76777d]">Cédula/email inválido o curso lleno</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-100 text-[#ba1a1a] flex items-center justify-center">
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </div>
        </div>

        {/* KPI 4: Finanzas */}
        <div className="p-4 rounded-xl bg-white border border-[#c6c6cd]/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0b1c30]">
              Abonos a caja
            </span>
            <div className="text-2xl font-bold text-[#0b1c30] mt-0.5">
              ${totalFinancialPaid.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-[#76777d]">
              {finance?.enabled ? "Impacto financiero activo" : "Sin módulo financiero"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#e5eeff] text-[#0b1c30] flex items-center justify-center">
            <HugeiconsIcon icon={Coins01Icon} size={20} />
          </div>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#c6c6cd]/20 overflow-hidden">
        {/* Barra de Filtros */}
        <div className="p-4 bg-[#eff4ff]/60 border-b border-[#c6c6cd]/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-[#0b1c30] mr-2">Filtrar:</span>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === "all"
                  ? "bg-white text-[#0b1c30] shadow-sm border border-[#c6c6cd]/30"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
            >
              Todas ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("ready")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === "ready"
                  ? "bg-white text-[#009668] shadow-sm border border-[#c6c6cd]/30"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
            >
              Listas ({readyCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("warning")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === "warning"
                  ? "bg-white text-[#783200] shadow-sm border border-[#c6c6cd]/30"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
            >
              Requieren decisión ({warningCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("blocked")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === "blocked"
                  ? "bg-white text-[#ba1a1a] shadow-sm border border-[#c6c6cd]/30"
                  : "text-[#45464d] hover:text-[#0b1c30]"
              }`}
            >
              Bloqueadas ({blockedCount})
            </button>
          </div>

          <div className="text-xs text-[#45464d]">
            Mostrando {filteredRows.length} de {rows.length} filas analizadas
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full text-left text-xs">
            <thead className="bg-[#eff4ff] text-[11px] font-bold uppercase tracking-wider text-[#45464d] border-b border-[#c6c6cd]/20">
              <tr>
                <th className="py-3 px-3 w-12 text-center">Fila</th>
                <th className="py-3 px-3">Estudiante</th>
                <th className="py-3 px-3">Identificación</th>
                <th className="py-3 px-3">Contacto</th>
                <th className="py-3 px-3">Ciudad</th>
                <th className="py-3 px-3">Matrícula</th>
                {Boolean(finance?.enabled) && (
                  <th className="py-3 px-3">Finanzas (Total / Abono / Saldo)</th>
                )}
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 w-56">Acción requerida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5eeff]/60 text-[#0b1c30]">
              {filteredRows.map((row) => {
                const decision = decisions[row.row_number]
                const isPossible = [
                  "POSSIBLE_DUPLICATE",
                  "EXISTING_PERSON_WITHOUT_STUDENT_PROFILE",
                ].includes(row.identity_resolution.status)

                const isBlocked = row.status === "BLOCKED"

                return (
                  <tr
                    key={row.row_number}
                    className={`transition-colors ${
                      isBlocked
                        ? "bg-red-50/50 hover:bg-red-50"
                        : row.status === "WARNING"
                        ? "bg-amber-50/30 hover:bg-amber-50/50"
                        : "hover:bg-[#eff4ff]/30"
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-[#76777d] font-bold">
                      {row.row_number}
                    </td>

                    {/* Estudiante / Nombres */}
                    <td className="py-3 px-3">
                      {row.student.name_inference ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              value={String(
                                (decision?.corrections as Record<string, unknown> | undefined)?.nombres ??
                                  row.student.nombres ??
                                  ""
                              )}
                              onChange={(e) => correctName(row, "nombres", e.target.value)}
                              placeholder="Nombres"
                              className="w-28 rounded-lg border border-[#c6c6cd]/50 px-2 py-1 text-xs font-semibold bg-white"
                            />
                            <input
                              value={String(
                                (decision?.corrections as Record<string, unknown> | undefined)?.apellidos ??
                                  row.student.apellidos ??
                                  ""
                              )}
                              onChange={(e) => correctName(row, "apellidos", e.target.value)}
                              placeholder="Apellidos"
                              className="w-28 rounded-lg border border-[#c6c6cd]/50 px-2 py-1 text-xs font-semibold bg-white"
                            />
                          </div>
                          <label className="flex items-center gap-1 text-[11px] text-[#9d4300] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(decision?.confirm_name_inference)}
                              onChange={(e) => toggleInference(row, e.target.checked)}
                              className="w-3.5 h-3.5 rounded text-[#fd761a] accent-[#fd761a]"
                            />
                            <span>Confirmar separación</span>
                          </label>
                        </div>
                      ) : (
                        <div className="font-bold text-[#0b1c30]">
                          {row.student.nombres} {row.student.apellidos}
                        </div>
                      )}
                    </td>

                    {/* Cédula */}
                    <td className="py-3 px-3 font-mono text-xs">
                      {row.student.cedula || <span className="text-[#c6c6cd] italic">— sin cédula —</span>}
                    </td>

                    {/* Contacto */}
                    <td className="py-3 px-3 text-[#45464d] text-xs">
                      <div className="truncate max-w-[180px]">{row.student.correo || "—"}</div>
                      <div className="text-[11px] text-[#76777d]">{row.student.celular || "—"}</div>
                    </td>

                    {/* Ciudad */}
                    <td className="py-3 px-3 text-xs">
                      <span>{row.student.ciudad || "—"}</span>
                      {row.city_resolution?.status === "TEXT_ONLY_CITY" && (
                        <span className="block text-[10px] text-[#9d4300] font-semibold">
                          Texto libre
                        </span>
                      )}
                    </td>

                    {/* Matrícula */}
                    <td className="py-3 px-3 text-xs">
                      {row.enrollment?.status === "PENDING_STUDENT" || row.enrollment?.status === "ENROLLMENT_AVAILABLE" ? (
                        <span className="inline-flex items-center gap-1 text-[#009668] font-bold">
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} /> Listo
                        </span>
                      ) : (
                        <span className="text-[#76777d]">
                          {row.enrollment?.status || (enrollment?.enabled ? "Inscribir" : "Sin matrícula")}
                        </span>
                      )}
                    </td>

                    {/* Finanzas */}
                    {Boolean(finance?.enabled) && (
                      <td className="py-3 px-3 text-xs">
                        <div className="font-semibold text-[#0b1c30]">
                          ${Number(row.finance?.total || 0).toFixed(2)} / ${Number(row.finance?.paid || 0).toFixed(2)} / ${Number(row.finance?.balance || 0).toFixed(2)}
                        </div>
                        {row.finance?.warnings?.map((w) => (
                          <span key={w.code} className="block text-[10px] text-[#9d4300]">
                            {w.message}
                          </span>
                        ))}
                      </td>
                    )}

                    {/* Estado */}
                    <td className="py-3 px-3">
                      {row.status === "READY" && (
                        <span className="px-2.5 py-1 rounded-full bg-[#dce9ff] text-[#009668] text-[10px] font-bold uppercase">
                          Válido
                        </span>
                      )}
                      {row.status === "WARNING" && (
                        <span className="px-2.5 py-1 rounded-full bg-[#ffdbca] text-[#783200] text-[10px] font-bold uppercase">
                          Atención
                        </span>
                      )}
                      {row.status === "BLOCKED" && (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-[#ba1a1a] text-[10px] font-bold uppercase">
                          Bloqueado
                        </span>
                      )}
                    </td>

                    {/* Acción / Decisión */}
                    <td className="py-3 px-3">
                      {isBlocked ? (
                        <div className="text-[11px] text-[#ba1a1a] font-semibold leading-tight">
                          {row.errors.map((e) => e.message).join(" ")}
                        </div>
                      ) : (
                        <select
                          value={
                            decision?.skip
                              ? "SKIP"
                              : typeof decision?.identity_decision === "string"
                              ? decision.identity_decision
                              : isPossible
                              ? ""
                              : "CREATE_NEW"
                          }
                          onChange={(e) => setDecision(row, e.target.value)}
                          className="w-full rounded-xl border border-[#c6c6cd]/50 px-2.5 py-1.5 text-xs font-semibold bg-white text-[#0b1c30] focus:outline-none focus:ring-1 focus:ring-[#fd761a]"
                        >
                          {isPossible && <option value="">Decidir acción...</option>}
                          <option value="CREATE_NEW">Crear nuevo estudiante</option>
                          {row.identity_resolution.candidates?.map((candidate) => (
                            <option
                              key={String(candidate.id)}
                              value={`USE_EXISTING:${String(candidate.id)}`}
                            >
                              Usar {String(candidate.nombres)} {String(candidate.apellidos)}
                            </option>
                          ))}
                          {row.identity_resolution.status ===
                            "EXISTING_PERSON_WITHOUT_STUDENT_PROFILE" &&
                            row.identity_resolution.persona_id && (
                              <option value={`USE_EXISTING:${row.identity_resolution.persona_id}`}>
                                Reutilizar Persona y crear perfil
                              </option>
                            )}
                          <option value="SKIP">Omitir esta fila</option>
                        </select>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de Impacto Operativo */}
      <div className="p-5 rounded-2xl bg-white border border-[#c6c6cd]/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#eff4ff] text-[#fd761a] flex items-center justify-center shrink-0 mt-0.5">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
          </div>
          <div className="text-xs">
            <strong className="font-bold text-sm text-[#0b1c30] block">
              Resumen de la operación programada:
            </strong>
            <span className="text-[#45464d] mt-1 block leading-relaxed">
              Se procesarán <strong>{selectable.length} estudiantes listos</strong>. Las filas bloqueadas se omitirán de forma segura sin interrumpir la creación del resto de registros.
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Navegación Inferior (Contenida dentro de la página para no tapar el menú lateral) */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-[#c6c6cd]/30 shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#c6c6cd]/40 bg-white text-[#0b1c30] text-xs font-bold shadow-xs hover:bg-[#eff4ff] hover:border-[#fd761a]/40 transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          <span>Volver a configuración</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            disabled={loading || selectable.length === 0}
            onClick={handleSubmit}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#fd761a] text-white text-xs sm:text-sm font-bold shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Procesando importación...</span>
              </>
            ) : (
              <span>Confirmar e importar {selectable.length} estudiantes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
