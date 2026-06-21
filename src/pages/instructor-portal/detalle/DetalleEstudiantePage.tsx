import { useState, useEffect } from "react"
import { useParams, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  UserIcon,
  MapPinIcon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { instructorService } from "@/services/instructor.service"
import { toast } from "sonner"

interface EstudiantePersonal {
  id: string
  nombres: string
  apellidos: string
  cedula?: string
  correo?: string
  celular?: string
  ciudad?: { nombre: string }
  perfil_estudiante?: {
    fecha_nacimiento?: string
    ocupacion?: string
    direccion?: string
    ciudad?: string
    estado_civil?: string
    edad?: number
  } | null
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border p-6 animate-pulse" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <div className="h-4 w-32 bg-gray-100 rounded-md mb-5" />
      <div className="grid grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
            <div className="h-5 w-28 bg-gray-100 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

const estadoCivilColor: Record<string, string> = {
  soltero: "#10b981",
  casado: "#3b82f6",
  divorciado: "#f59e0b",
  viudo: "#8b5cf6",
  "union libre": "#ec4899",
}

function Badge({ value }: { value: string }) {
  const color = estadoCivilColor[value.toLowerCase()] || COLORS.TEXT_MUTED
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {value}
    </span>
  )
}

function DataRow({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide uppercase" style={{ color: COLORS.TEXT_MUTED }}>
        {label}
      </p>
      <p
        className={`mt-0.5 font-semibold ${large ? "text-lg" : "text-sm"}`}
        style={{ color: COLORS.CHARCOAL }}
      >
        {value}
      </p>
    </div>
  )
}

export function DetalleEstudiantePage() {
  const { id } = useParams<{ id: string }>()
  const [estudiante, setEstudiante] = useState<EstudiantePersonal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || id === "undefined") return
    instructorService.getDetalleEstudiante(id)
      .then(setEstudiante)
      .catch(() => toast.error("Error al cargar datos del estudiante"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-8" />
        <div className="flex items-center gap-4 mb-8">
          <div className="size-12 rounded-full bg-gray-100 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <div className="bg-white rounded-2xl border p-6 animate-pulse" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="h-4 w-32 bg-gray-100 rounded-md mb-5" />
            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
                <div className="h-5 w-36 bg-gray-100 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!estudiante) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-20">
        <div
          className="size-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 8%, transparent)` }}
        >
          <HugeiconsIcon icon={UserIcon} size={24} style={{ color: COLORS.TEXT_MUTED }} />
        </div>
        <p className="text-sm font-medium mb-4" style={{ color: COLORS.CHARCOAL }}>
          Estudiante no encontrado
        </p>
        <Link
          to="/instructor/estudiantes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ color: COLORS.ACCENT }}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Volver a mis estudiantes
        </Link>
      </div>
    )
  }

  const perfil = estudiante.perfil_estudiante
  const fechaNac = perfil?.fecha_nacimiento?.split("-").reverse().join("/") || "—"
  const edad = perfil?.edad != null ? `${perfil.edad} años` : "—"
  const estadoCivil = perfil?.estado_civil || "—"

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        to="/instructor/estudiantes"
        className="inline-flex items-center gap-1.5 text-xs font-semibold mb-6 transition-opacity hover:opacity-70"
        style={{ color: COLORS.ACCENT }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
        Volver a mis estudiantes
      </Link>

      <header className="flex items-center gap-4 mb-8">
        <div
          className="size-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
          style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)`, color: COLORS.ACCENT }}
        >
          {estudiante.nombres.charAt(0)}{estudiante.apellidos.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.CHARCOAL }}>
            {estudiante.nombres} {estudiante.apellidos}
          </h1>
          {estudiante.correo && (
            <p className="text-sm mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
              {estudiante.correo}
            </p>
          )}
        </div>
      </header>

      <div className="grid gap-5">
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <h2 className="text-[11px] font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: COLORS.TEXT_MUTED }}>
            <HugeiconsIcon icon={UserIcon} size={14} />
            Informacion Personal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <DataRow label="Nombres" value={estudiante.nombres} />
            <DataRow label="Apellidos" value={estudiante.apellidos} />
            <DataRow label="Cedula" value={estudiante.cedula || "—"} />
            <DataRow label="Fecha de Nacimiento" value={fechaNac} />
            <DataRow label="Edad" value={edad} large />
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <h2 className="text-[11px] font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: COLORS.TEXT_MUTED }}>
            <HugeiconsIcon icon={MapPinIcon} size={14} />
            Contacto y Ubicacion
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <DataRow label="Correo" value={estudiante.correo || "—"} />
            <DataRow label="Celular" value={estudiante.celular || "—"} />
            <DataRow label="Ciudad" value={perfil?.ciudad || estudiante.ciudad?.nombre || "—"} />
            <DataRow label="Direccion" value={perfil?.direccion || "—"} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <h2 className="text-[11px] font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: COLORS.TEXT_MUTED }}>
            <HugeiconsIcon icon={Calendar03Icon} size={14} />
            Informacion Adicional
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <DataRow label="Ocupacion" value={perfil?.ocupacion || "—"} />
            <div>
              <p className="text-[11px] font-medium tracking-wide uppercase" style={{ color: COLORS.TEXT_MUTED }}>
                Estado Civil
              </p>
              <div className="mt-1.5">
                {estadoCivil === "—" ? (
                  <p className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>—</p>
                ) : (
                  <Badge value={estadoCivil} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
