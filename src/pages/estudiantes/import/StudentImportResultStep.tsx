import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  UserGroupIcon,
  GraduationCapIcon,
  Coins01Icon,
} from "@hugeicons/core-free-icons"
import type { ImportExecutionResponse } from "@/services/student-import.service"

interface Props {
  result: ImportExecutionResponse
  onClose: () => void
}

const actionLabels: Record<string, string> = {
  CREATED_PROFILE_CREATED: "Estudiante nuevo creado",
  REUSED_PROFILE_CREATED: "Persona reutilizada + Perfil creado",
  CREATED: "Estudiante creado",
  REUSED: "Persona reutilizada",
  BLOCKED_FINANCE: "Bloqueado por conflicto contable",
  BLOCKED: "Bloqueado por validación",
  SKIPPED_BY_USER: "Omitida por decisión de usuario",
  ROW_NOT_CONFIRMED: "Fila no confirmada",
  IDENTITY_DECISION_REQUIRED: "Requiere decisión de identidad",
}

export function StudentImportResultStep({ result, onClose }: Props) {
  const value = (key: string) => Number(result.summary[key] ?? 0)
  const hasProblems = value("blocked") > 0 || value("failed") > 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Banner Hero Superior */}
      <div
        className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          hasProblems
            ? "bg-amber-50/60 border-amber-200"
            : "bg-[#dce9ff]/50 border-[#009668]/30"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              hasProblems
                ? "bg-[#ffdbca] text-[#783200]"
                : "bg-white text-[#009668] shadow-sm"
            }`}
          >
            <HugeiconsIcon
              icon={hasProblems ? AlertCircleIcon : CheckmarkCircle02Icon}
              size={32}
            />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0b1c30]">
              {hasProblems
                ? "Importación procesada con observaciones"
                : "¡Importación completada con éxito!"}
            </h2>
            <p className="text-xs sm:text-sm text-[#45464d] mt-1">
              Se procesaron {value("processed")} filas del archivo.{" "}
              {value("imported")} estudiantes fueron importados correctamente.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-center shrink-0"
        >
          Finalizar y ver estudiantes
        </button>
      </div>

      {/* Grid de 5 Métricas Principales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white border border-[#c6c6cd]/20 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#76777d]">
            Total Procesadas
          </span>
          <div className="text-2xl font-bold text-[#0b1c30] mt-1">
            {value("processed")}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#c6c6cd]/20 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#009668]">
            Importadas
          </span>
          <div className="text-2xl font-bold text-[#009668] mt-1">
            {value("imported")}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#c6c6cd]/20 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#783200]">
            Bloqueadas
          </span>
          <div className="text-2xl font-bold text-[#783200] mt-1">
            {value("blocked")}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#c6c6cd]/20 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#76777d]">
            Omitidas
          </span>
          <div className="text-2xl font-bold text-[#76777d] mt-1">
            {value("skipped")}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#c6c6cd]/20 shadow-sm text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#ba1a1a]">
            Fallidas
          </span>
          <div className="text-2xl font-bold text-[#ba1a1a] mt-1">
            {value("failed")}
          </div>
        </div>
      </div>

      {/* Tarjetas de Desglose por Área */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Estudiantes */}
        <div className="p-5 rounded-2xl bg-white border border-[#c6c6cd]/20 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-[#0b1c30]">
            <HugeiconsIcon icon={UserGroupIcon} size={18} className="text-[#fd761a]" />
            <h3 className="font-bold text-sm">Expedientes de Estudiantes</h3>
          </div>
          <div className="space-y-1.5 text-xs text-[#45464d]">
            <div className="flex justify-between py-1 border-b border-[#c6c6cd]/10">
              <span>Nuevos creados</span>
              <strong className="text-[#0b1c30]">{value("created_students")}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#c6c6cd]/10">
              <span>Personas reutilizadas</span>
              <strong className="text-[#0b1c30]">{value("reused_students")}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span>Perfiles académicos</span>
              <strong className="text-[#0b1c30]">{value("profiles_created")}</strong>
            </div>
          </div>
        </div>

        {/* Matrículas */}
        <div className="p-5 rounded-2xl bg-white border border-[#c6c6cd]/20 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-[#0b1c30]">
            <HugeiconsIcon icon={GraduationCapIcon} size={18} className="text-[#009668]" />
            <h3 className="font-bold text-sm">Matrículas en Cursos</h3>
          </div>
          <div className="space-y-1.5 text-xs text-[#45464d]">
            <div className="flex justify-between py-1 border-b border-[#c6c6cd]/10">
              <span>Matrículas creadas</span>
              <strong className="text-[#0b1c30]">{value("enrollments_created")}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#c6c6cd]/10">
              <span>Matrículas omitidas</span>
              <strong className="text-[#0b1c30]">{value("enrollments_skipped")}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span>Errores de cupo / fecha</span>
              <strong className="text-[#ba1a1a]">{value("enrollment_failed")}</strong>
            </div>
          </div>
        </div>

        {/* Finanzas */}
        <div className="p-5 rounded-2xl bg-white border border-[#c6c6cd]/20 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-[#0b1c30]">
            <HugeiconsIcon icon={Coins01Icon} size={18} className="text-[#783200]" />
            <h3 className="font-bold text-sm">Movimientos Contables</h3>
          </div>
          <div className="space-y-1.5 text-xs text-[#45464d]">
            <div className="flex justify-between py-1 border-b border-[#c6c6cd]/10">
              <span>Estudiantes con finanzas</span>
              <strong className="text-[#0b1c30]">{value("finance_created")}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#c6c6cd]/10">
              <span>Líneas de pago de módulos</span>
              <strong className="text-[#0b1c30]">{value("financial_lines_created")}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span>Transacciones de ingreso en caja</span>
              <strong className="text-[#009668]">{value("transactions_created")}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Detalle Fila por Fila */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#c6c6cd]/20 overflow-hidden">
        <div className="p-4 bg-[#eff4ff]/60 border-b border-[#c6c6cd]/20 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#45464d]">
            Detalle por Registro
          </h3>
          <span className="text-xs text-[#76777d]">
            {result.rows.length} registros analizados
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#eff4ff] text-[11px] font-bold uppercase tracking-wider text-[#45464d] border-b border-[#c6c6cd]/20 sticky top-0">
              <tr>
                <th className="py-2.5 px-4 w-16 text-center">Fila</th>
                <th className="py-2.5 px-4">Estado</th>
                <th className="py-2.5 px-4">Acción ejecutada</th>
                <th className="py-2.5 px-4">Detalle / Incidencias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5eeff]/60 text-[#0b1c30]">
              {result.rows.map((row) => {
                const errors = row.errors?.map((e) => e.message) || []
                const warnings = row.warnings?.map((w) => w.message) || []

                return (
                  <tr key={row.row_number} className="hover:bg-[#eff4ff]/30">
                    <td className="py-3 px-4 text-center font-bold text-[#76777d]">
                      {row.row_number}
                    </td>
                    <td className="py-3 px-4">
                      {row.status === "IMPORTED" && (
                        <span className="px-2 py-0.5 rounded-full bg-[#dce9ff] text-[#009668] text-[10px] font-bold uppercase">
                          Importada
                        </span>
                      )}
                      {row.status === "BLOCKED" && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-[#ba1a1a] text-[10px] font-bold uppercase">
                          Bloqueada
                        </span>
                      )}
                      {row.status === "SKIPPED" && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[#76777d] text-[10px] font-bold uppercase">
                          Omitida
                        </span>
                      )}
                      {row.status === "FAILED" && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-[#ba1a1a] text-[10px] font-bold uppercase">
                          Fallida
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-xs">
                      {actionLabels[row.action || ""] || row.action || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {errors.length > 0 && (
                        <div className="text-[#ba1a1a] font-semibold">{errors.join(" ")}</div>
                      )}
                      {warnings.length > 0 && (
                        <div className="text-[#9d4300]">{warnings.join(" ")}</div>
                      )}
                      {errors.length === 0 && warnings.length === 0 && (
                        <span className="text-[#009668]">Completado sin incidencias</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón inferior para salir */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-8 py-3 rounded-xl bg-[#0b1c30] text-white text-xs sm:text-sm font-bold shadow-sm hover:opacity-95 transition-opacity"
        >
          Finalizar y ver estudiantes
        </button>
      </div>
    </div>
  )
}
