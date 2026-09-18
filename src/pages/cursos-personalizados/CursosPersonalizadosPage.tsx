import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Monitor,
  Plus,
  RotateCcw,
  Search,
  Users,
  X,
} from "lucide-react"
import { COLORS } from "@/lib/constants"
import { personasService } from "@/services/personas.service"
import { cursosPersonalizadosService } from "@/services/cursosPersonalizados.service"
import { usePermission } from "@/hooks/usePermission"

const DIAS_LABEL: Record<number, string> = {
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
  7: "Dom",
  0: "Dom",
}

const money = (val: number) => "$" + Number(val || 0).toFixed(2) + " USD"

function formatRangoFechas(inicio?: string, fin?: string) {
  if (!inicio) return "Sin fecha"
  try {
    const fIni = new Date(inicio)
    const diaIni = fIni.toLocaleDateString("es-EC", { day: "2-digit", month: "short" })
    if (!fin) return diaIni
    const fFin = new Date(fin)
    const diaFin = fFin.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })
    return `${diaIni} – ${diaFin}`
  } catch {
    return `${inicio?.slice(0, 10)} – ${fin?.slice(0, 10)}`
  }
}

function getIniciales(nombres?: string, apellidos?: string) {
  const n = (nombres || "").trim()[0] || ""
  const a = (apellidos || "").trim()[0] || ""
  return (n + a).toUpperCase() || "—"
}

export function CursosPersonalizadosPage() {
  const navigate = useNavigate()
  const { isAdmin } = usePermission()
  const [search, setSearch] = useState("")
  const [modalidad, setModalidad] = useState("")
  const [docente, setDocente] = useState("")
  const [fecha, setFecha] = useState("")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const query = useQuery({
    queryKey: ["cursos-personalizados", search, modalidad, docente, fecha, page, perPage],
    queryFn: () =>
      cursosPersonalizadosService.listar({
        search: search || undefined,
        modalidad: modalidad || undefined,
        docente_id: docente || undefined,
        fecha_inicio: fecha || undefined,
        page,
        per_page: perPage,
      }),
  })

  const teachers = useQuery({
    queryKey: ["instructores", "personalizados"],
    queryFn: () => personasService.buscarInstructores("", 100),
    staleTime: 300000,
  })

  const cursos = query.data?.data || []
  const meta = query.data?.meta || { total: 0, per_page: perPage, current_page: page, last_page: 1 }

  // KPI calculations based on loaded items
  const totalCursos = meta.total || cursos.length
  const totalPresenciales = cursos.filter((c) => c.modalidad === "presencial").length
  const totalVirtuales = cursos.filter((c) => c.modalidad === "virtual").length
  const totalMatriculados = cursos.reduce((acc, c) => acc + (c.matriculados || 0), 0)

  const hasActiveFilters = Boolean(search || modalidad || docente || fecha)

  const clearFilters = () => {
    setSearch("")
    setModalidad("")
    setDocente("")
    setFecha("")
    setPage(1)
  }

  const selectedTeacherName = teachers.data?.find((t) => t.id === docente)
    ? `${teachers.data.find((t) => t.id === docente)?.nombres} ${teachers.data.find((t) => t.id === docente)?.apellidos}`
    : ""

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. Context Eyebrow & Page Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Cursos personalizados
          </h1>
          
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/cursos-personalizados/nuevo")}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-[0.99]"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              <Plus size={18} />
              Nuevo curso
            </button>
          </div>
        )}
      </div>

      {/* 2. Summary KPI Strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Cursos</span>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-800">{totalCursos}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <BookOpen size={20} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Presenciales</span>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-800">{totalPresenciales}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Building2 size={20} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Virtuales</span>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-800">{totalVirtuales}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Monitor size={20} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Matriculados</span>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-800">{totalMatriculados}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar & Active Chips */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input with clear button */}
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={modalidad}
              onChange={(e) => {
                setModalidad(e.target.value)
                setPage(1)
              }}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Modalidad: Todas</option>
              <option value="presencial">Modalidad: Presencial</option>
              <option value="virtual">Modalidad: Virtual</option>
            </select>

            <select
              value={docente}
              onChange={(e) => {
                setDocente(e.target.value)
                setPage(1)
              }}
              className="h-10 max-w-[200px] truncate rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Docente: Todos</option>
              {(teachers.data || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombres} {t.apellidos}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value)
                setPage(1)
              }}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
              title="Filtrar por fecha de inicio"
            />
          </div>
        </div>

        {/* Active Filters Strip */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold uppercase tracking-wider text-slate-400 mr-1">Filtros activos:</span>
              {search && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                  Búsqueda: {search}
                  <button onClick={() => setSearch("")} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              )}
              {modalidad && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                  Modalidad: {modalidad === "presencial" ? "Presencial" : "Virtual"}
                  <button onClick={() => setModalidad("")} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedTeacherName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                  Docente: {selectedTeacherName}
                  <button onClick={() => setDocente("")} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              )}
              {fecha && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                  Fecha: {fecha}
                  <button onClick={() => setFecha("")} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="ml-2 inline-flex items-center gap-1 font-semibold text-orange-600 hover:underline"
              >
                <RotateCcw size={12} /> Limpiar filtros
              </button>
            </div>
            <div className="text-slate-400">
              Mostrando <span className="font-semibold text-slate-700">{cursos.length}</span> de{" "}
              <span className="font-semibold text-slate-700">{meta.total}</span> cursos
            </div>
          </div>
        )}
      </div>

      {/* 4. Primary Data Table (Table-based design adhering to excluded columns) */}
      <div className="w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none">
                <th scope="col" className="py-3.5 pl-6 pr-4">
                  Curso
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Modalidad / Sede
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Docente
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Fechas y Horario
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Ocupación
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Precio
                </th>
                <th scope="col" className="py-3.5 pl-4 pr-6 text-right">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {query.isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                      <span>Cargando cursos personalizados...</span>
                    </div>
                  </td>
                </tr>
              ) : query.isError ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-red-500">
                    Error al cargar los cursos. Por favor intente nuevamente.
                  </td>
                </tr>
              ) : cursos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <GraduationCap size={40} className="text-slate-300" />
                      <p className="font-semibold text-slate-700">No se encontraron cursos personalizados</p>
                      <p className="text-xs text-slate-400">
                        {hasActiveFilters
                          ? "Intenta modificar o limpiar los filtros seleccionados."
                          : "Aún no se han registrado cursos personalizados en el sistema."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-xs font-semibold text-orange-600 hover:underline"
                        >
                          Limpiar todos los filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                cursos.map((curso) => {
                  const progress = curso.capacidad
                    ? Math.min(100, Math.round((curso.matriculados / curso.capacidad) * 100))
                    : 0
                  const initials = curso.docente
                    ? getIniciales(curso.docente.nombres, curso.docente.apellidos)
                    : "—"
                  const teacherFullName = curso.docente
                    ? `${curso.docente.nombres} ${curso.docente.apellidos}`
                    : "Sin asignar"
                  const diasStr =
                    curso.dias_semana && curso.dias_semana.length > 0
                      ? `(${curso.dias_semana.map((d) => DIAS_LABEL[d] || d).join(", ")})`
                      : ""

                  return (
                    <tr
                      key={curso.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      {/* Curso */}
                      <td className="py-4 pl-6 pr-4 max-w-xs">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 line-clamp-1">
                            {curso.nombre}
                          </span>
                          <span className="text-xs text-slate-400 line-clamp-1">
                            {curso.descripcion || "Sin descripción adicional."}
                          </span>
                        </div>
                      </td>

                      {/* Modalidad / Sede */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              curso.modalidad === "presencial"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-purple-50 text-purple-700"
                            }`}
                          >
                            {curso.modalidad === "presencial" ? (
                              <Building2 size={13} className="text-blue-600" />
                            ) : (
                              <Monitor size={13} className="text-purple-600" />
                            )}
                            {curso.modalidad === "presencial" ? "Presencial" : "Virtual"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {curso.modalidad === "presencial"
                              ? curso.ciudad || "Sede por definir"
                              : "Campus Virtual"}
                          </span>
                        </div>
                      </td>

                      {/* Docente */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-800">
                              {teacherFullName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {curso.docente ? "Docente titular" : "Pendiente"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Fechas y Horario */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col text-xs">
                          <div className="flex items-center gap-1 text-slate-800 font-medium">
                            <Calendar size={13} className="text-slate-400" />
                            {formatRangoFechas(curso.fecha_inicio, curso.fecha_fin)}
                          </div>
                          {(curso.hora_inicio || diasStr) && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                              <Clock size={12} className="text-slate-400" />
                              <span>
                                {curso.hora_inicio?.slice(0, 5)}
                                {curso.hora_fin ? ` – ${curso.hora_fin.slice(0, 5)}` : ""}{" "}
                                {diasStr}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Ocupación (incluye progreso, matriculados / capacidad y cupos libres) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 min-w-[130px]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">
                              {curso.matriculados} / {curso.capacidad}
                            </span>
                            <span
                              className={`text-[11px] font-medium ${
                                curso.cupos_disponibles > 0 ? "text-emerald-600" : "text-amber-600"
                              }`}
                            >
                              {curso.cupos_disponibles > 0
                                ? `${curso.cupos_disponibles} libre${curso.cupos_disponibles !== 1 ? "s" : ""}`
                                : "Lleno"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: progress >= 100 ? "#e11d48" : COLORS.ACCENT,
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500">{progress}%</span>
                          </div>
                        </div>
                      </td>

                      {/* Precio */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="text-xs font-bold text-slate-900 tabular-nums">
                          {money(curso.precio_total)}
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/cursos-personalizados/${curso.id}`)
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 hover:text-orange-700"
                        >
                          Ver detalle
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Table Footer / Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/40 p-4 select-none sm:flex-row">
          {/* Left: Rows per page & record info */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>Filas por página:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-orange-500"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <span className="hidden sm:inline">
              Mostrando {cursos.length > 0 ? (page - 1) * perPage + 1 : 0}–
              {Math.min(page * perPage, meta.total)} de {meta.total} cursos personalizados
            </span>
          </div>

          {/* Right: Pagination Navigation */}
          {meta.last_page > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 font-medium text-slate-600 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === meta.last_page || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1]
                    const showEllipsis = prev && p - prev > 1
                    return (
                      <div key={p} className="flex items-center">
                        {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                        <button
                          onClick={() => setPage(p)}
                          className={`h-8 w-8 rounded-lg text-xs font-bold transition shadow-xs ${
                            page === p
                              ? "text-white"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                          style={page === p ? { backgroundColor: COLORS.ACCENT } : undefined}
                        >
                          {p}
                        </button>
                      </div>
                    )
                  })}
              </div>

              <button
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 font-medium text-slate-600 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
