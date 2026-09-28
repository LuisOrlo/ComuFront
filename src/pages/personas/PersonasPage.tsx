import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import {
  Plus,
  Trash2,
  Search,
  X,
  Eye,
  Edit3,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  User,
  RefreshCw,
  Briefcase,
  GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { personasService, type Persona } from "@/services/personas.service"
import { toast } from "sonner"
import { PersonaFormModal } from "./PersonaFormModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"

const TIPO_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string; avatar: string }
> = {
  instructor: {
    label: "Instructor",
    badge: "bg-blue-50 text-blue-700 border-blue-200/60",
    dot: "bg-blue-500",
    avatar: "bg-blue-50 text-blue-700 border-blue-200",
  },
  staff: {
    label: "Staff",
    badge: "bg-amber-50 text-amber-700 border-amber-200/60",
    dot: "bg-amber-500",
    avatar: "bg-amber-50 text-amber-700 border-amber-200",
  },
  secretaria: {
    label: "Secretaría",
    badge: "bg-purple-50 text-purple-700 border-purple-200/60",
    dot: "bg-purple-500",
    avatar: "bg-purple-50 text-purple-700 border-purple-200",
  },
  admin: {
    label: "Administrador",
    badge: "bg-rose-50 text-rose-700 border-rose-200/60",
    dot: "bg-rose-500",
    avatar: "bg-rose-50 text-rose-700 border-rose-200",
  },
}

export function PersonasPage() {
  const navigate = useNavigate()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<string>("")
  const [modal, setModal] = useState<{ open: boolean; editingId: string | null }>({
    open: false,
    editingId: null,
  })
  const [detailPersona, setDetailPersona] = useState<Persona | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nombre: string } | null>(null)

  const cargarPersonas = async () => {
    setLoading(true)
    try {
      const response = await personasService.getPersonas({
        buscar: search || undefined,
        tipo: filtroTipo || undefined,
        per_page: 60,
      })
      setPersonas(response.data || [])
    } catch {
      toast.error("Error al cargar el directorio de personal")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPersonas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filtroTipo])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await personasService.eliminarPersona(deleteConfirm.id)
      toast.success("Persona eliminada correctamente")
      cargarPersonas()
    } catch {
      toast.error("Error al eliminar la persona")
    } finally {
      setDeleteConfirm(null)
    }
  }

  const openDetail = async (id: string) => {
    setLoadingDetail(true)
    try {
      const p = await personasService.getPersonaById(id)
      setDetailPersona(p)
    } catch {
      toast.error("Error al cargar los detalles del colaborador")
    } finally {
      setLoadingDetail(false)
    }
  }

  const fullName = (p: Persona) => `${p.nombres} ${p.apellidos}`

  const getInitials = (nombres?: string, apellidos?: string) => {
    const n = (nombres || "").trim()[0] || ""
    const a = (apellidos || "").trim()[0] || ""
    return (n + a).toUpperCase() || "P"
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Cabecera Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Personal y Colaboradores
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Directorio integral del equipo docente, administrativo y operativo de Comunikate.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <button
              type="button"
              onClick={cargarPersonas}
              disabled={loading}
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
              title="Recargar listado"
            >
              <RefreshCw size={14} className={cn(loading && "animate-spin text-[#fd761a]")} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              type="button"
              onClick={() => setModal({ open: true, editingId: null })}
              className="h-10 px-4 rounded-xl bg-[#fd761a] hover:bg-[#e06512] active:scale-95 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Registrar persona</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
          {/* Input de Búsqueda */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido, cédula o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 h-9 text-xs rounded-xl bg-slate-50/70 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/15 outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filtros por Rol */}
          <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl flex-wrap">
            {[
              { label: "Todos", value: "" },
              { label: "Instructores", value: "instructor" },
              { label: "Staff", value: "staff" },
              { label: "Secretaría", value: "secretaria" },
              { label: "Admin", value: "admin" },
            ].map(({ label, value }) => (
              <button
                key={value || "todos"}
                type="button"
                onClick={() => setFiltroTipo(value)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  filtroTipo === value
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Estado de Carga */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-2">
            <RefreshCw size={24} className="animate-spin text-[#fd761a]" />
            <p className="text-xs font-semibold">Cargando directorio de colaboradores...</p>
          </div>
        )}

        {/* Estado Vacío */}
        {!loading && personas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#fd761a] flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                No se encontraron personas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                No existen colaboradores con el criterio de búsqueda o filtro seleccionado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModal({ open: true, editingId: null })}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-xs hover:bg-[#e06512] transition-all cursor-pointer active:scale-95"
            >
              <Plus size={15} />
              <span>Registrar primera persona</span>
            </button>
          </div>
        )}

        {/* Cuadrícula de Tarjetas de Personal */}
        {!loading && personas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((p) => {
              const cfg = TIPO_CONFIG[p.tipo] || TIPO_CONFIG.instructor
              const tieneCuenta = Boolean(p.cuentaSistema)

              return (
                <article
                  key={p.id}
                  onClick={() => openDetail(p.id)}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Fila Superior: Badge Rol, Estado y Acciones Rápidas */}
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold border",
                          cfg.badge
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </span>

                      <div
                        className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openDetail(p.id)}
                          className="size-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                          title="Ver ficha completa"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setModal({ open: true, editingId: p.id })}
                          className="size-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                          title="Editar persona"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirm({ id: p.id, nombre: fullName(p) })
                          }
                          className="size-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Identificación y Avatar */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={cn(
                          "size-10 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 shadow-xs",
                          cfg.avatar
                        )}
                      >
                        {getInitials(p.nombres, p.apellidos)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#fd761a] transition-colors leading-tight truncate">
                          {fullName(p)}
                        </h3>
                        {p.cedula ? (
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                            CI: {p.cedula}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 mt-0.5">Sin cédula</p>
                        )}
                      </div>
                    </div>

                    {/* Datos de Contacto */}
                    <div className="space-y-1 text-xs text-slate-500 mb-3">
                      {p.correo && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{p.correo}</span>
                        </div>
                      )}
                      {p.celular && (
                        <div className="flex items-center gap-2 truncate">
                          <Phone size={12} className="text-slate-400 shrink-0" />
                          <span>{p.celular}</span>
                        </div>
                      )}
                      {p.ciudad && (
                        <div className="flex items-center gap-2 truncate">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{p.ciudad}</span>
                        </div>
                      )}
                    </div>

                    {/* Especialidad o Cargo */}
                    {p.perfilInstructor?.especialidad && (
                      <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-100 text-[#fd761a] text-[11px] font-semibold max-w-full truncate">
                        <GraduationCap size={13} className="shrink-0" />
                        <span className="truncate">{p.perfilInstructor.especialidad}</span>
                      </div>
                    )}
                    {p.perfilStaff?.cargo && (
                      <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 text-[11px] font-semibold max-w-full truncate">
                        <Briefcase size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{p.perfilStaff.cargo}</span>
                      </div>
                    )}
                  </div>

                  {/* Fila Inferior / Footer de la tarjeta */}
                  <div className="flex items-center justify-between text-[11px] pt-3 border-t border-slate-100 text-slate-500">
                    <span className="flex items-center gap-1.5">
                      {tieneCuenta ? (
                        <>
                          <ShieldCheck size={13} className="text-emerald-600" />
                          <span className="font-mono font-bold text-slate-800">
                            {p.cuentaSistema?.username}
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={13} className="text-slate-300" />
                          <span className="italic text-slate-400">Sin cuenta</span>
                        </>
                      )}
                    </span>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                        p.es_activo !== false
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1 rounded-full",
                          p.es_activo !== false ? "bg-emerald-500" : "bg-slate-400"
                        )}
                      />
                      {p.es_activo !== false ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </article>
              )
            })}

            {/* Tarjeta de Acción Rápida: Agregar Colaborador */}
            <button
              type="button"
              onClick={() => setModal({ open: true, editingId: null })}
              className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#fd761a] hover:bg-orange-50/20 flex flex-col items-center justify-center min-h-[220px] p-6 transition-all duration-200 group cursor-pointer"
            >
              <div className="size-11 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 group-hover:bg-[#fd761a] group-hover:text-white group-hover:border-[#fd761a] flex items-center justify-center transition-all mb-2.5 shadow-xs">
                <Plus size={22} />
              </div>
              <span className="text-xs font-bold text-slate-700 group-hover:text-[#fd761a] transition-colors">
                Registrar nuevo colaborador
              </span>
              <span className="text-[11px] text-slate-400 text-center mt-0.5">
                Instructor, staff administrativo o secretaría
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de Creación / Edición */}
      {modal.open && (
        <PersonaFormModal
          editingId={modal.editingId}
          onClose={() => setModal({ open: false, editingId: null })}
          onSuccess={cargarPersonas}
        />
      )}

      {/* Modal Detalle de Persona */}
      {detailPersona && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
          onClick={() => setDetailPersona(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Detalle */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 sticky top-0 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "size-10 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 shadow-xs",
                    (TIPO_CONFIG[detailPersona.tipo] || TIPO_CONFIG.instructor).avatar
                  )}
                >
                  {getInitials(detailPersona.nombres, detailPersona.apellidos)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                        (TIPO_CONFIG[detailPersona.tipo] || TIPO_CONFIG.instructor).badge
                      )}
                    >
                      {(TIPO_CONFIG[detailPersona.tipo] || TIPO_CONFIG.instructor).label}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold",
                        detailPersona.es_activo ? "text-emerald-700" : "text-slate-400"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          detailPersona.es_activo ? "bg-emerald-500" : "bg-slate-400"
                        )}
                      />
                      {detailPersona.es_activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 truncate">
                    {fullName(detailPersona)}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailPersona(null)}
                className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <DetailSection title="Datos Personales y Contacto">
                <DetailRow label="Cédula de Identidad" value={detailPersona.cedula} mono />
                <DetailRow label="Correo Electrónico" value={detailPersona.correo} />
                <DetailRow label="Teléfono / Celular" value={detailPersona.celular} />
                <DetailRow label="Ciudad / Sede" value={detailPersona.ciudad} />
              </DetailSection>

              <DetailSection title="Cuenta de Sistema y Accesos">
                {detailPersona.cuentaSistema ? (
                  <>
                    <DetailRow
                      label="Usuario de acceso"
                      value={detailPersona.cuentaSistema.username}
                      mono
                    />
                    <DetailRow
                      label="ID de cuenta"
                      value={detailPersona.cuentaSistema.id}
                      mono
                    />
                  </>
                ) : (
                  <p className="text-xs text-slate-400 italic py-1">
                    No cuenta con credenciales de acceso activas en el sistema.
                  </p>
                )}
              </DetailSection>

              {detailPersona.tipo === "instructor" && detailPersona.perfilInstructor && (
                <DetailSection title="Perfil Académico del Docente">
                  <DetailRow
                    label="Especialidad"
                    value={detailPersona.perfilInstructor.especialidad}
                  />
                  <DetailRow label="Biografía / Perfil" value={detailPersona.perfilInstructor.bio} />
                </DetailSection>
              )}

              {detailPersona.tipo !== "instructor" && detailPersona.perfilStaff && (
                <DetailSection title="Detalles del Cargo y Contratación">
                  <DetailRow label="Puesto / Cargo" value={detailPersona.perfilStaff.cargo} />
                  <DetailRow
                    label="Fecha de Ingreso"
                    value={
                      detailPersona.perfilStaff.fecha_ingreso
                        ? new Date(
                            detailPersona.perfilStaff.fecha_ingreso.split("T")[0] + "T00:00:00"
                          ).toLocaleDateString("es-EC", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "—"
                    }
                  />
                  {detailPersona.perfilStaff.es_pasante && (
                    <DetailRow label="Condición" value="Pasante institucional" />
                  )}
                </DetailSection>
              )}
            </div>

            {/* Footer de Acciones del Detalle */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDetailPersona(null)
                  navigate(`/personas/${detailPersona.id}/pagos`)
                }}
                className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                Ver nómina y pagos
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = detailPersona.id
                  setDetailPersona(null)
                  setModal({ open: true, editingId: id })
                }}
                className="h-9 px-4 rounded-xl bg-[#fd761a] hover:bg-[#e06512] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
              >
                Editar persona
              </button>
            </div>
          </div>
        </div>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="size-9 rounded-full border-2 border-[#fd761a] border-t-transparent animate-spin" />
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Persona"
        message={`¿Estás seguro de eliminar a "${deleteConfirm?.nombre}"? Esta acción removerá el registro de colaboradores.`}
        confirmText="Eliminar colaborador"
        cancelText="Cancelar"
        isDangerous
        icon="trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </h4>
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
        {children}
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value?: string | null
  mono?: boolean
}) {
  return (
    <div className="flex justify-between items-start text-xs gap-4">
      <span className="text-slate-500 font-medium shrink-0">{label}:</span>
      <span
        className={cn(
          "text-right font-semibold",
          value ? "text-slate-900" : "text-slate-400",
          mono && "font-mono text-[11px]"
        )}
      >
        {value || "—"}
      </span>
    </div>
  )
}

export default PersonasPage
