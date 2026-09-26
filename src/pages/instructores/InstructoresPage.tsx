import { useEffect, useState, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Power,
  GraduationCap,
  Mail,
  Phone,
  LayoutGrid,
  List,
  CheckCircle2,
  Users,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"
import { COLORS } from "@/lib/constants"
import { instructoresService } from "@/services/instructores.service"
import { ciudadesService, type Ciudad } from "@/services/ciudades.service"
import { CiudadBadge } from "@/components/cursos/CiudadBadge"
import type { Persona } from "@/services/personas.service"
import { PersonaFormModal } from "@/pages/personas/PersonaFormModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"

type StatusFilter = "all" | "active" | "inactive"
type ViewMode = "table" | "grid"

export function InstructoresPage() {
  const navigate = useNavigate()

  // Data states
  const [rows, setRows] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [ciudades, setCiudades] = useState<Ciudad[]>([])

  // Filter states
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("active")
  const [ciudadId, setCiudadId] = useState<number | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  // Pagination states
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  })

  // Modals
  const [modal, setModal] = useState<string | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Persona | null>(null)
  const [toggling, setToggling] = useState(false)

  // Load cities once
  useEffect(() => {
    void ciudadesService
      .getCiudadesTodas()
      .then(setCiudades)
      .catch(() => {})
  }, [])

  // Load instructors
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await instructoresService.getInstructores({
        buscar: search.trim() || undefined,
        ciudad_id: ciudadId === "all" ? undefined : ciudadId,
        activos: status === "all" ? undefined : status === "active",
        page,
      })
      setRows(r.data)
      if (r.meta) {
        setMeta(r.meta)
      }
    } catch {
      toast.error("No se pudo cargar la lista de instructores")
    } finally {
      setLoading(false)
    }
  }, [search, ciudadId, status, page])

  // Reload when filters change
  useEffect(() => {
    setPage(1)
  }, [search, status, ciudadId])

  useEffect(() => {
    void load()
  }, [load])

  // Handle status toggle (active/inactive)
  const handleConfirmToggle = async () => {
    if (!confirmToggle) return
    setToggling(true)
    try {
      const nextState = !confirmToggle.es_activo
      await instructoresService.setActivo(confirmToggle.id, nextState)
      toast.success(
        nextState
          ? `Instructor ${confirmToggle.nombres} reactivado`
          : `Instructor ${confirmToggle.nombres} desactivado`
      )
      setConfirmToggle(null)
      void load()
    } catch {
      toast.error("No se pudo actualizar el estado del instructor")
    } finally {
      setToggling(false)
    }
  }

  // Summary Metrics from current rows & meta
  const metrics = useMemo(() => {
    const total = meta.total || rows.length
    const activeInRows = rows.filter((r) => r.es_activo).length
    const inactiveInRows = rows.filter((r) => !r.es_activo).length

    return {
      total,
      activeInRows,
      inactiveInRows,
    }
  }, [rows, meta.total])

  const getCiudadNombre = (ciudad?: unknown): string => {
    if (!ciudad) return ""
    if (typeof ciudad === "string") return ciudad
    if (typeof ciudad === "object" && ciudad !== null && "nombre" in ciudad) {
      const val = (ciudad as { nombre?: unknown }).nombre
      return typeof val === "string" ? val : ""
    }
    return ""
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f8f9ff] text-[#0b1c30]">
      {/* Header */}
      <header
        className="shrink-0 border-b bg-white px-4 py-5 sm:px-6 lg:px-8"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="flex size-10 items-center justify-center rounded-xl text-white shadow-xs"
                style={{ background: "linear-gradient(135deg, #fd761a 0%, #e05e07 100%)" }}
              >
                <GraduationCap size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Instructores
                </h1>
                <p className="text-xs text-gray-500">
                  Gestión del equipo docente, especialidades y carga académica
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center justify-center size-9 rounded-xl border bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
              title="Actualizar listado"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-[#fd761a]" : ""} />
            </button>

            <button
              onClick={() => setModal("new")}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98]"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Nuevo Instructor
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {/* Card 1: Total */}
          <div
            className="flex items-center gap-3.5 rounded-2xl border bg-white p-4 shadow-xs"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Total Registrados
              </span>
              <span className="text-xl font-bold text-gray-900">{meta.total}</span>
            </div>
          </div>

          {/* Card 2: Activos */}
          <div
            className="flex items-center gap-3.5 rounded-2xl border bg-white p-4 shadow-xs"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Instructores Activos
              </span>
              <span className="text-xl font-bold text-emerald-600">{metrics.activeInRows}</span>
            </div>
          </div>

          {/* Card 3: Inactivos */}
          <div
            className="flex items-center gap-3.5 rounded-2xl border bg-white p-4 shadow-xs"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
              <Power size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Instructores Inactivos
              </span>
              <span className="text-xl font-bold text-gray-600">{metrics.inactiveInRows}</span>
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div
          className="flex flex-col gap-3 rounded-2xl border bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar instructor por nombre, apellido o cédula..."
              className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-9 text-xs transition focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a] focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 rounded-md p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Right: Filters & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* City Selector */}
            <div className="relative">
              <select
                value={ciudadId}
                onChange={(e) =>
                  setCiudadId(e.target.value === "all" ? "all" : Number(e.target.value))
                }
                className="rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-gray-700 transition hover:bg-gray-50 focus:border-[#fd761a] focus:outline-none"
              >
                <option value="all">Todas las ciudades</option>
                {ciudades.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Pills */}
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50/70 p-1">
              {[
                { key: "active" as const, label: "Activos" },
                { key: "inactive" as const, label: "Inactivos" },
                { key: "all" as const, label: "Todos" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatus(s.key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    status === s.key
                      ? "bg-white text-gray-900 shadow-2xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="hidden items-center rounded-xl border border-gray-200 bg-gray-50/70 p-1 sm:inline-flex">
              <button
                onClick={() => setViewMode("table")}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-400 hover:text-gray-700"
                }`}
                title="Vista en tabla"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === "grid"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-400 hover:text-gray-700"
                }`}
                title="Vista en cuadrícula"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section (Table or Grid) */}
        {loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border bg-white p-12 text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="size-9 animate-spin rounded-full border-3 border-gray-200 border-t-[#fd761a]" />
            <p className="mt-3 text-xs font-medium text-gray-500">Cargando instructores...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-12 text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 mb-3 shadow-xs">
              <GraduationCap size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-800">No se encontraron instructores</h3>
            <p className="mt-1 text-xs text-gray-500 max-w-sm">
              {search || status !== "all" || ciudadId !== "all"
                ? "No existen resultados con los filtros actuales. Intenta limpiar los criterios de búsqueda."
                : "Aún no hay instructores registrados en la plataforma."}
            </p>
            <div className="mt-4 flex gap-2">
              {(search || status !== "all" || ciudadId !== "all") && (
                <button
                  onClick={() => {
                    setSearch("")
                    setStatus("all")
                    setCiudadId("all")
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Limpiar filtros
                </button>
              )}
              <button
                onClick={() => setModal("new")}
                className="rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                Agregar Instructor
              </button>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* ==================== GRID / CARD VIEW ==================== */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((p) => {
              const initials = `${p.nombres?.[0] || ""}${p.apellidos?.[0] || ""}`.toUpperCase()
              const ciudadNombre = getCiudadNombre(p.ciudad)

              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white shadow-xs"
                          style={{ background: "linear-gradient(135deg, #fd761a 0%, #e05e07 100%)" }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3
                            onClick={() => navigate(`/instructores/${p.id}`)}
                            className="cursor-pointer truncate font-bold text-gray-900 text-sm hover:text-[#fd761a] transition-colors"
                          >
                            {p.nombres} {p.apellidos}
                          </h3>
                          <span className="text-[11px] font-mono text-gray-400 block">
                            {p.cedula ? `CI: ${p.cedula}` : "Sin cédula"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          p.es_activo
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${p.es_activo ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {p.es_activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    {/* Specialty Pill */}
                    <div className="mt-3.5">
                      <span className="inline-block rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800 border border-orange-200 max-w-full truncate">
                        {p.perfilInstructor?.especialidad || "Especialidad no especificada"}
                      </span>
                    </div>

                    {/* Contact items */}
                    <div className="mt-3.5 space-y-1.5 text-xs text-gray-500">
                      {p.correo && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail size={13} className="text-gray-400 shrink-0" />
                          <span className="truncate">{p.correo}</span>
                        </div>
                      )}
                      {p.celular && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={13} className="text-gray-400 shrink-0" />
                          <span>{p.celular}</span>
                        </div>
                      )}
                      {ciudadNombre && (
                        <div className="pt-1">
                          <CiudadBadge ciudad={ciudadNombre} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom / Stats & Actions */}
                  <div className="mt-5 pt-3.5 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className="mb-3.5 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Carga académica:</span>
                      <span className="font-semibold text-gray-800">
                        {p.cursos_actuales_count || 0} cursos · {p.talleres_actuales_count || 0} talleres
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/instructores/${p.id}`)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 active:scale-[0.98]"
                      >
                        <Eye size={13} />
                        Ver Detalle
                        <ArrowRight size={12} className="text-gray-400" />
                      </button>

                      <button
                        onClick={() => setModal(p.id)}
                        title="Editar instructor"
                        className="inline-flex items-center justify-center size-8.5 rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => setConfirmToggle(p)}
                        title={p.es_activo ? "Desactivar instructor" : "Reactivar instructor"}
                        className={`inline-flex items-center justify-center size-8.5 rounded-xl border transition ${
                          p.es_activo
                            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ==================== TABLE VIEW ==================== */
          <div
            className="overflow-hidden rounded-2xl border bg-white shadow-xs"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className="border-b bg-[#fafbfc] text-gray-500 uppercase tracking-wider"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  <tr>
                    <th className="p-4">Instructor</th>
                    <th className="p-4">Cédula</th>
                    <th className="p-4">Contacto</th>
                    <th className="p-4">Ciudad</th>
                    <th className="p-4">Especialidad</th>
                    <th className="p-4">Actividad Actual</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y text-gray-700"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  {rows.map((p) => {
                    const initials = `${p.nombres?.[0] || ""}${p.apellidos?.[0] || ""}`.toUpperCase()
                    const ciudadNombre = getCiudadNombre(p.ciudad)

                    return (
                      <tr
                        key={p.id}
                        className="transition hover:bg-orange-50/20"
                      >
                        {/* Instructor */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-2xs"
                              style={{ background: "linear-gradient(135deg, #fd761a 0%, #e05e07 100%)" }}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <button
                                onClick={() => navigate(`/instructores/${p.id}`)}
                                className="font-bold text-gray-900 hover:text-[#fd761a] transition-colors text-left"
                              >
                                {p.nombres} {p.apellidos}
                              </button>
                              {p.cuentaSistema?.username && (
                                <span className="block text-[11px] text-gray-400">
                                  @{p.cuentaSistema.username}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Cédula */}
                        <td className="p-4 font-mono font-medium text-gray-700">
                          {p.cedula || "—"}
                        </td>

                        {/* Contacto */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <div className="text-gray-900">{p.correo || "—"}</div>
                            {p.celular && (
                              <div className="text-[11px] text-gray-400 flex items-center gap-1">
                                <Phone size={10} />
                                {p.celular}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Ciudad */}
                        <td className="p-4">
                          {ciudadNombre ? (
                            <CiudadBadge ciudad={ciudadNombre} />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Especialidad */}
                        <td className="p-4">
                          <span className="inline-block rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-800 border border-orange-200 max-w-[200px] truncate">
                            {p.perfilInstructor?.especialidad || "Sin especificar"}
                          </span>
                        </td>

                        {/* Actividad actual */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
                              {p.cursos_actuales_count || 0} cursos
                            </span>
                            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200">
                              {p.talleres_actuales_count || 0} talleres
                            </span>
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              p.es_activo
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${p.es_activo ? "bg-emerald-500" : "bg-gray-400"}`} />
                            {p.es_activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/instructores/${p.id}`)}
                              title="Ver detalle del instructor"
                              className="rounded-lg p-1.5 text-gray-500 transition hover:bg-orange-50 hover:text-[#fd761a]"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => setModal(p.id)}
                              title="Editar instructor"
                              className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => setConfirmToggle(p)}
                              title={p.es_activo ? "Desactivar" : "Reactivar"}
                              className={`rounded-lg p-1.5 transition ${
                                p.es_activo
                                  ? "text-gray-400 hover:bg-amber-50 hover:text-amber-700"
                                  : "text-gray-400 hover:bg-emerald-50 hover:text-emerald-700"
                              }`}
                            >
                              <Power size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Footer */}
        {meta.total > 0 && (
          <div
            className="flex flex-col gap-3 rounded-2xl border bg-white px-4 py-3 shadow-xs sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <div>
              Mostrando{" "}
              <b>
                {(meta.current_page - 1) * meta.per_page + 1} -{" "}
                {Math.min(meta.current_page * meta.per_page, meta.total)}
              </b>{" "}
              de <b>{meta.total}</b> instructores
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Anterior
              </button>

              <span className="px-2 font-bold text-gray-900">
                Pág. {meta.current_page} de {meta.last_page || 1}
              </span>

              <button
                disabled={page >= meta.last_page || loading}
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
              >
                Siguiente
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal for Active/Inactive toggle */}
      <ConfirmationModal
        isOpen={Boolean(confirmToggle)}
        title={confirmToggle?.es_activo ? "Desactivar Instructor" : "Reactivar Instructor"}
        message={
          confirmToggle?.es_activo
            ? `¿Estás seguro de desactivar a "${confirmToggle?.nombres} ${confirmToggle?.apellidos}"? El instructor no podrá ser asignado a nuevos cursos mientras esté inactivo.`
            : `¿Deseas reactivar al instructor "${confirmToggle?.nombres} ${confirmToggle?.apellidos}"? Podrá volver a ser asignado a cursos y talleres.`
        }
        confirmText={confirmToggle?.es_activo ? "Desactivar" : "Reactivar"}
        cancelText="Cancelar"
        isDangerous={confirmToggle?.es_activo}
        isLoading={toggling}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmToggle(null)}
      />

      {/* Persona Form Modal for Create & Edit */}
      {modal && (
        <PersonaFormModal
          editingId={modal === "new" ? null : modal}
          instructorOnly
          onClose={() => setModal(null)}
          onSuccess={() => void load()}
        />
      )}
    </div>
  )
}
