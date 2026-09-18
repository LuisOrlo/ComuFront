import { HugeiconsIcon } from "@hugeicons/react"
import {
  Mail01Icon,
  SmartPhone01Icon,
  MapPinIcon,
  CheckmarkCircle02Icon,
  GraduationCapIcon,
  AddCircleIcon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons"

interface ProfileHeaderProps {
  estudiante: {
    id: string
    nombre_completo: string
    cedula: string
    correo: string
    celular?: string
    ciudad?: string
    es_activo?: boolean
    cohorte?: string
  }
  totalCursos: number
  totalTalleres?: number
  estadoPago: string
  saldoPendiente: number
  onUpdate?: (fields: Record<string, string>) => void
  saving?: boolean
  onInscribir?: () => void
}

export function ProfileHeader({
  estudiante,
  totalCursos,
  estadoPago,
  onInscribir,
}: ProfileHeaderProps) {
  const initials =
    estudiante.nombre_completo
      .split(" ")
      .filter(Boolean)
      .map((n) => n.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase() || "EP"

  return (
    <div className="w-full bg-white rounded-2xl p-5 lg:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden border border-slate-100 mb-6">
      {/* Mancha decorativa suave superior derecha (de code.html) */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#fd761a]/5 blur-2xl pointer-events-none" />

      {/* Lado izquierdo: Avatar e información del estudiante */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 z-10 min-w-0">
        {/* Avatar Iniciales con badge verde de activo */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-inner select-none">
            {initials}
          </div>
          <span
            className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs"
            title="Estudiante activo"
          >
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
          </span>
        </div>

        {/* Nombres y Metadatos (sin edición aquí) */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              {estudiante.nombre_completo}
            </h1>
            {estudiante.cohorte && (
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold tracking-wide">
                {estudiante.cohorte}
              </span>
            )}
          </div>

          {/* Fila de metadatos formateados con iconos y puntos separadores */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-slate-500 text-xs pt-1">
            {estudiante.cedula && (
              <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                <HugeiconsIcon icon={UserAccountIcon} size={15} className="text-[#fd761a]" />
                <span>C.I. {estudiante.cedula}</span>
              </span>
            )}
            {estudiante.correo && (
              <>
                <span className="text-slate-300">•</span>
                <a
                  href={`mailto:${estudiante.correo}`}
                  className="inline-flex items-center gap-1 hover:text-[#fd761a] transition-colors"
                >
                  <HugeiconsIcon icon={Mail01Icon} size={14} />
                  <span>{estudiante.correo}</span>
                </a>
              </>
            )}
            {estudiante.celular && (
              <>
                <span className="text-slate-300">•</span>
                <a
                  href={`tel:${estudiante.celular}`}
                  className="inline-flex items-center gap-1 hover:text-[#fd761a] transition-colors"
                >
                  <HugeiconsIcon icon={SmartPhone01Icon} size={14} />
                  <span>{estudiante.celular}</span>
                </a>
              </>
            )}
            {estudiante.ciudad && (
              <>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <HugeiconsIcon icon={MapPinIcon} size={14} className="text-[#fd761a]" />
                  <span>{estudiante.ciudad}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lado derecho: Estado de inscripciones, estado de pago y acción */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 z-10 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
        <div className="flex items-center gap-3">
          {/* Contador de cursos */}
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Inscripciones
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold mt-0.5">
              <HugeiconsIcon icon={GraduationCapIcon} size={15} className="text-[#fd761a]" />
              <span>
                {totalCursos} {totalCursos === 1 ? "Curso activo" : "Cursos activos"}
              </span>
            </div>
          </div>

          {/* Badge de Estado de pago */}
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Estado de pago
            </span>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold mt-0.5 ${
                estadoPago === "al_dia"
                  ? "bg-emerald-50 text-emerald-800"
                  : estadoPago === "abonado"
                  ? "bg-amber-50 text-amber-800"
                  : estadoPago === "deudor"
                  ? "bg-rose-50 text-rose-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  estadoPago === "al_dia"
                    ? "bg-emerald-600"
                    : estadoPago === "abonado"
                    ? "bg-amber-600"
                    : estadoPago === "deudor"
                    ? "bg-rose-600"
                    : "bg-slate-400"
                }`}
              />
              <span>
                {estadoPago === "al_dia"
                  ? "Al día"
                  : estadoPago === "abonado"
                  ? "Abonado"
                  : estadoPago === "deudor"
                  ? "Saldo pendiente"
                  : "Sin cuentas"}
              </span>
            </div>
          </div>
        </div>

        {/* Botón Acción principal: Inscribir a curso/taller */}
        <button
          type="button"
          onClick={onInscribir}
          className="h-10 px-4 rounded-xl bg-[#fd761a] hover:bg-[#ea580c] active:scale-[0.99] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all shadow-xs w-full sm:w-auto cursor-pointer"
        >
          <HugeiconsIcon icon={AddCircleIcon} size={16} />
          <span>Inscribir a curso/taller</span>
        </button>
      </div>
    </div>
  )
}
