/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CalendarIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { CiudadBadge, ModalidadBadge } from "../../../estudiantes/components/Badges"

interface TallerTallerTabProps {
  selected: any
}

export function TallerTallerTab({ selected }: TallerTallerTabProps) {
  const taller = selected.taller
  const precio = Number(taller?.precio || 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Información del taller
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Detalles lectivos, instructor asignado y arancel oficial
          </p>
        </div>
      </div>

      {/* Taller Banner Card */}
      <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200/80 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-orange-100 text-orange-800 uppercase tracking-wider">
                Taller Práctico Intensivo
              </span>
              <ModalidadBadge modalidad={taller?.modalidad} />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
              {taller?.nombre || "Taller formativo"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Programa de especialización rápida avalado por la academia
            </p>
          </div>

          <div className="text-left md:text-right bg-white p-4 rounded-xl border border-slate-200 shadow-xs shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Precio del Taller
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              ${precio.toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <HugeiconsIcon icon={CalendarIcon} size={15} />
              <span className="text-xs font-bold uppercase tracking-wider">Fecha Inicio</span>
            </div>
            <span className="font-bold text-slate-900 text-sm block">
              {taller?.fecha ? new Date(taller.fecha).toLocaleDateString("es-EC") : "—"}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <HugeiconsIcon icon={CalendarIcon} size={15} />
              <span className="text-xs font-bold uppercase tracking-wider">Fecha Fin</span>
            </div>
            <span className="font-bold text-slate-900 text-sm block">
              {taller?.fecha_fin ? new Date(taller.fecha_fin).toLocaleDateString("es-EC") : "Mismo día"}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <HugeiconsIcon icon={UserIcon} size={15} />
              <span className="text-xs font-bold uppercase tracking-wider">Instructor</span>
            </div>
            <span className="font-bold text-slate-900 text-sm block truncate">
              {taller?.instructor ? `${taller.instructor.nombres} ${taller.instructor.apellidos}` : "Por designar"}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Sede / Ciudad
            </span>
            <CiudadBadge ciudad={taller?.ciudad?.nombre} />
          </div>
        </div>
      </div>
    </div>
  )
}
