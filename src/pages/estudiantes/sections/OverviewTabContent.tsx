import React from "react"
import type { AcademicProfile, FinancialProfile } from "@/services/estudiantes.service"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Award01Icon,
  CalendarCheckIn01Icon,
  Book02Icon,
  CheckmarkBadge01Icon,
  Money01Icon,
} from "@hugeicons/core-free-icons"

interface OverviewTabContentProps {
  academicData: AcademicProfile | null
  financialData: FinancialProfile | null
  academicLoading: boolean
  financialLoading: boolean
  onSwitchToAcademic?: () => void
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—"
  try {
    const clean = dateStr.split("T")[0]
    const [y, m, d] = clean.split("-")
    if (y && m && d) {
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
      return new Intl.DateTimeFormat("es-EC", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date)
    }
    return dateStr
  } catch {
    return dateStr
  }
}

export const OverviewTabContent: React.FC<OverviewTabContentProps> = ({
  academicData,
  financialData,
  academicLoading,
  financialLoading,
  onSwitchToAcademic,
}) => {
  const matriculas = academicData?.matriculas ?? []
  const promedioGeneral = matriculas.length
    ? (matriculas.reduce((acc, m) => acc + (m.promedio || 0), 0) / matriculas.length).toFixed(1)
    : null

  const asistenciaGeneral = matriculas.length
    ? Math.round(matriculas.reduce((acc, m) => acc + m.porcentaje_asistencia, 0) / matriculas.length)
    : null

  const cursosActivos = matriculas.filter((m) => m.estado === "activo").length
  const cursosCompletados = matriculas.filter((m) => m.estado === "completado").length
  const resumen = financialData?.resumen
  const totalAdeudado = resumen?.total_adeudado ?? 0
  const porcentajePagado = resumen?.porcentaje_pagado ?? (totalAdeudado === 0 ? 100 : 0)
  const totalCuentas = (resumen?.cuentas_pagadas ?? 0) + (resumen?.cuentas_abonadas ?? 0) + (resumen?.cuentas_pendientes ?? 0)

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 5-Card Academic Metrics Strip (de code.html líneas 369-425) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Metric 1: Promedio General */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              Promedio General
            </span>
            <HugeiconsIcon icon={Award01Icon} size={18} className="text-[#fd761a]" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-900 leading-tight">
              {academicLoading ? "—" : promedioGeneral || "0.0"}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {promedioGeneral ? "Promedio ponderado" : "Sin calificaciones aún"}
            </span>
          </div>
        </div>

        {/* Metric 2: Asistencia Global */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              Asistencia Global
            </span>
            <HugeiconsIcon
              icon={CalendarCheckIn01Icon}
              size={18}
              className={
                asistenciaGeneral !== null && asistenciaGeneral >= 70
                  ? "text-emerald-600"
                  : "text-amber-600"
              }
            />
          </div>
          <div className="mt-2.5">
            <div
              className={`text-2xl font-black leading-tight ${
                asistenciaGeneral !== null && asistenciaGeneral >= 70
                  ? "text-emerald-700"
                  : "text-amber-600"
              }`}
            >
              {academicLoading ? "—" : `${asistenciaGeneral ?? 0}%`}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {asistenciaGeneral !== null ? "Asistencia calculada" : "Sin registros"}
            </span>
          </div>
        </div>

        {/* Metric 3: Cursos Activos */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              Cursos Activos
            </span>
            <HugeiconsIcon icon={Book02Icon} size={18} className="text-[#fd761a]" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-900 leading-tight">
              {academicLoading ? "—" : cursosActivos}
            </div>
            <span className="text-xs text-emerald-700 font-semibold">En curso regular</span>
          </div>
        </div>

        {/* Metric 4: Completados */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              Completados
            </span>
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={18} className="text-slate-400" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-900 leading-tight">
              {academicLoading ? "—" : cursosCompletados}
            </div>
            <span className="text-xs text-slate-400 font-medium">Histórico finalizado</span>
          </div>
        </div>

        {/* Metric 5: Saldo Pendiente */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              Saldo Pendiente
            </span>
            <HugeiconsIcon
              icon={Money01Icon}
              size={18}
              className={totalAdeudado > 0 ? "text-rose-600" : "text-emerald-600"}
            />
          </div>
          <div className="mt-2.5">
            <div
              className={`text-2xl font-black leading-tight ${
                totalAdeudado > 0 ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {financialLoading ? "—" : `$${totalAdeudado.toFixed(2)}`}
            </div>
            <span
              className={`text-xs font-semibold ${
                totalAdeudado > 0 ? "text-rose-700" : "text-emerald-700"
              }`}
            >
              {totalAdeudado === 0 ? "Totalmente al día" : "Saldo exigible"}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Summary Banner with Progress Bar (de code.html líneas 426-465) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Resumen de Liquidación Económica
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Estado de pagos y obligaciones vinculadas al estudiante
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
              porcentajePagado >= 100
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {porcentajePagado >= 100
              ? "100% Pagado (Completado)"
              : `${porcentajePagado}% Pagado`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Costo Total
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              ${(resumen?.total_general ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Pagado
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
              ${(resumen?.total_pagado ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Adeudado
            </span>
            <span
              className={`text-xl sm:text-2xl font-black mt-1 ${
                totalAdeudado > 0 ? "text-rose-600" : "text-slate-400"
              }`}
            >
              ${totalAdeudado.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Estado Actual
            </span>
            <span
              className={`text-xl sm:text-2xl font-black mt-1 ${
                totalAdeudado === 0 ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {totalAdeudado === 0 ? "Solvente" : "Pendiente"}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col gap-1.5 mt-2">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                porcentajePagado >= 100 ? "bg-emerald-500" : "bg-[#fd761a]"
              }`}
              style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>
              Cuentas liquidadas: {resumen?.cuentas_pagadas ?? 0} de {totalCuentas || 1}
            </span>
            <span
              className={
                totalAdeudado === 0
                  ? "font-semibold text-emerald-700"
                  : "font-semibold text-rose-700"
              }
            >
              {totalAdeudado === 0 ? "Sin saldos pendientes exigibles" : "Saldo pendiente por liquidar"}
            </span>
          </div>
        </div>
      </div>

      {/* Cursos en Curso y Recientes Table (de code.html líneas 466-512) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Cursos en Curso y Recientes</h3>
          {onSwitchToAcademic && (
            <button
              type="button"
              onClick={onSwitchToAcademic}
              className="text-[#fd761a] hover:underline text-xs font-semibold cursor-pointer"
            >
              Ver detalle completo
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l-xl">Curso</th>
                <th className="py-3 px-4">Modalidad</th>
                <th className="py-3 px-4">Fecha Inicio</th>
                <th className="py-3 px-4">Asistencia</th>
                <th className="py-3 px-4 rounded-r-xl text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matriculas.length > 0 ? (
                matriculas.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {m.curso}
                      <span className="block text-xs font-normal text-slate-400 font-mono">
                        ID: #{m.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        Presencial
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      {formatDate(m.fecha_inscripcion)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.porcentaje_asistencia >= 70 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(m.porcentaje_asistencia, 100)}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            m.porcentaje_asistencia >= 70
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }`}
                        >
                          {m.porcentaje_asistencia}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        Activo
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No hay cursos registrados para este estudiante.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
