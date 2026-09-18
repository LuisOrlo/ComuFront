import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  Download04Icon,
  BookOpenIcon,
  Search01Icon,
  Clock04Icon,
  Coins01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  UserIcon,
  MapsLocation01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { CiudadBadge, ModalidadBadge, EstadoBadge } from "../components/Badges"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { tallerService, type InscripcionTaller, type Taller } from "@/services/taller.service"
import { estudiantesService, type Estudiante } from "@/services/estudiantes.service"
import { toast } from "sonner"
import { StudentExportDialog } from "../components/StudentExportDialog"
import { generarListadoEstudiantesPDF, type EstudiantePDF } from "@/lib/generarEstudiantesPDF"
import { PaginationControls } from "@/components/table/PaginationControls"

export interface TallerParticipantRow {
  id: string
  estudianteId?: string
  nombres: string
  apellidos: string
  cedula?: string
  correo?: string
  telefono?: string
  ciudad?: string
  ocupacion?: string
  fecha_inscripcion?: string
  estado_pago?: string
  saldo_pendiente?: number
}

function FinancialCell({ estado_pago, saldo_pendiente }: { estado_pago?: string; saldo_pendiente?: number }) {
  if (estado_pago === "al_dia") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#dce9ff] text-[#009668] text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#009668]"></span>
        Al día
      </span>
    )
  }
  if (estado_pago === "deudor" || estado_pago === "pendiente") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdbca] text-[#783200] text-xs font-semibold">
        <HugeiconsIcon icon={Clock04Icon} size={13} />
        Pendiente {saldo_pendiente ? `($${saldo_pendiente.toLocaleString()})` : ""}
      </span>
    )
  }
  if (estado_pago === "abonado") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold">
        <HugeiconsIcon icon={Coins01Icon} size={13} className="text-[#9d4300]" />
        Abonado {saldo_pendiente ? `(Saldo $${saldo_pendiente.toLocaleString()})` : ""}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#45464d] text-xs font-medium">
      Sin actividad
    </span>
  )
}

export function EstudiantesTallerDetallePage() {
  const { tallerId } = useParams<{ tallerId: string }>()
  const navigate = useNavigate()

  const [inscripciones, setInscripciones] = useState<InscripcionTaller[]>([])
  const [estudiantesMap, setEstudiantesMap] = useState<Map<string, Estudiante>>(new Map())
  const [loading, setLoading] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)
  const [tallerNombre, setTallerNombre] = useState("")
  const [taller, setTaller] = useState<Taller | null>(null)
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 })

  const loadData = useCallback(async () => {
    if (!tallerId) return
    setLoading(true)
    try {
      const [insRes, tallerRes, estResp] = await Promise.all([
        tallerService.listarInscripciones(tallerId),
        tallerService.obtener(tallerId).catch(() => null),
        estudiantesService.getEstudiantes({ per_page: 2000 }).catch(() => ({ datos: [] })),
      ])

      const allEstudiantes = estResp.datos || []
      const map = new Map<string, Estudiante>()
      for (const e of allEstudiantes) {
        if (e.cedula) map.set(e.cedula, e)
      }
      setEstudiantesMap(map)

      const data = insRes.data || insRes.datos || []
      setInscripciones(Array.isArray(data) ? data : [])
      if (tallerRes?.nombre) {
        setTallerNombre(tallerRes.nombre)
        setTaller(tallerRes)
      }
    } catch {
      toast.error("Error al cargar participantes del taller")
    } finally {
      setLoading(false)
    }
  }, [tallerId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const studentRows: TallerParticipantRow[] = useMemo(() => {
    const seenCedulas = new Set<string>()
    return inscripciones
      .filter((ins) => {
        if (!ins.cedula) return true
        if (seenCedulas.has(ins.cedula)) return false
        seenCedulas.add(ins.cedula)
        return true
      })
      .map((ins) => {
        const estudianteRecord = ins.cedula ? estudiantesMap.get(ins.cedula) : undefined
        const tallerEstadoPago = ins.pago_verificado
          ? "al_dia"
          : ins.monto_pagado && ins.monto_pagado > 0
          ? "pendiente"
          : "ninguno"

        return {
          id: ins.id,
          estudianteId: estudianteRecord?.id,
          nombres: ins.nombres,
          apellidos: ins.apellidos,
          cedula: ins.cedula,
          correo: ins.correo,
          telefono: ins.telefono,
          ciudad: ins.ciudad,
          ocupacion: ins.ocupacion,
          fecha_inscripcion: ins.fecha_inscripcion,
          estado_pago: estudianteRecord?.estado_pago || tallerEstadoPago,
          saldo_pendiente: estudianteRecord?.saldo_pendiente,
        }
      })
  }, [inscripciones, estudiantesMap])

  const filteredParticipants = useMemo(() => {
    if (!search.trim()) return studentRows
    const term = search.toLowerCase()
    return studentRows.filter(
      (s) =>
        s.nombres.toLowerCase().includes(term) ||
        s.apellidos.toLowerCase().includes(term) ||
        (s.cedula && s.cedula.toLowerCase().includes(term)) ||
        (s.correo && s.correo.toLowerCase().includes(term))
    )
  }, [studentRows, search])

  const alDiaCount = useMemo(() => {
    return studentRows.filter(
      (s) => s.estado_pago === "al_dia" || (!s.saldo_pendiente && s.estado_pago !== "deudor" && s.estado_pago !== "pendiente")
    ).length
  }, [studentRows])

  const pendientesCount = useMemo(() => {
    return studentRows.filter(
      (s) => s.estado_pago === "deudor" || s.estado_pago === "pendiente" || (s.saldo_pendiente && s.saldo_pendiente > 0)
    ).length
  }, [studentRows])

  const capacidad = taller?.capacidad_maxima || 0
  const inscritos = studentRows.length
  const ocupacion = capacidad > 0 ? Math.min(100, Math.round((inscritos / capacidad) * 100)) : 0
  const isHigh = ocupacion >= 90

  const handleExportPDF = async (selectedFields: string[]) => {
    const targetRows = search.trim() ? filteredParticipants : studentRows
    const estudiantesPDF: EstudiantePDF[] = targetRows.map((r: TallerParticipantRow) => ({
      nombres: r.nombres,
      apellidos: r.apellidos,
      cedula: r.cedula ?? "",
      correo: r.correo,
      telefono: r.telefono,
      ciudad: r.ciudad,
      ocupacion: r.ocupacion,
      saldo: r.saldo_pendiente,
      estado_financiero: r.estado_pago,
      fecha_inscripcion: r.fecha_inscripcion
        ? new Date(r.fecha_inscripcion).toLocaleDateString("es-EC")
        : undefined,
    }))

    await generarListadoEstudiantesPDF(
      "taller",
      {
        nombre: tallerNombre || "Taller",
        instructor: taller?.instructor ? `${taller.instructor.nombres} ${taller.instructor.apellidos}` : undefined,
        fecha: taller?.fecha ? new Date(taller.fecha).toLocaleDateString("es-EC") : undefined,
        total: targetRows.length,
      },
      estudiantesPDF,
      selectedFields
    )
  }

  const columns = useMemo<ColumnDef<TallerParticipantRow>[]>(
    () => [
      {
        id: "participante",
        accessorFn: (r) => `${r.nombres} ${r.apellidos}`,
        header: "Participante",
        cell: ({ row }) => {
          const e = row.original
          const initials = `${e.nombres.charAt(0)}${e.apellidos.charAt(0)}`
          return (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#ffdbca] text-[#783200] font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#0b1c30] truncate">
                  {e.nombres} {e.apellidos}
                </span>
                <span className="text-[11px] text-[#45464d] truncate">
                  {e.correo || "Sin correo registrado"}
                </span>
              </div>
            </div>
          )
        },
        enableSorting: true,
      },
      {
        id: "cedula",
        accessorFn: (r) => r.cedula,
        header: "Cédula / Identificación",
        cell: ({ getValue }) => {
          const cedula = getValue<string>()
          return (
            <span className="font-mono text-xs text-[#45464d] bg-[#f8f9ff] px-2.5 py-1 rounded-md border border-[#c6c6cd]/25 inline-block">
              {cedula || "—"}
            </span>
          )
        },
        enableSorting: true,
      },
      {
        id: "fecha_inscripcion",
        accessorFn: (r) => r.fecha_inscripcion,
        header: "Fecha de inscripción",
        cell: ({ getValue }) => {
          const val = getValue<string>()
          if (!val) return <span className="text-xs text-[#45464d]">—</span>
          try {
            const d = new Date(val.includes("T") ? val : val + "T00:00:00")
            return (
              <span className="text-xs text-[#45464d]">
                {d.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            )
          } catch {
            return <span className="text-xs text-[#45464d]">{val}</span>
          }
        },
        enableSorting: true,
      },
      {
        id: "estado_pago",
        accessorFn: (r) => r.estado_pago,
        header: "Estado de cuenta",
        cell: ({ row }) => (
          <FinancialCell
            estado_pago={row.original.estado_pago}
            saldo_pendiente={row.original.saldo_pendiente}
          />
        ),
        enableSorting: true,
      },
      {
        id: "gestion",
        header: () => <span className="block text-right">Gestión</span>,
        cell: ({ row }) => {
          const e = row.original
          return (
            <div className="text-right">
              {e.estudianteId ? (
                <Link
                  to={`/estudiantes/${e.estudianteId}/academico`}
                  className="text-xs text-[#9d4300] hover:text-[#783200] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Ver perfil</span>
                  <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <span className="text-xs text-[#45464d]">—</span>
              )}
            </div>
          )
        },
        enableSorting: false,
        size: 110,
      },
    ],
    []
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredParticipants,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetAll: false,
  })

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden bg-[#f8f9ff]">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* TALLER DRILL-DOWN HEADER BANNER */}
          <div className="p-6 rounded-xl bg-white shadow-sm flex flex-col gap-4 border border-[#c6c6cd]/15">
            {/* Breadcrumb + Return Button */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-[#45464d]">
                <Link
                  to="/estudiantes"
                  className="hover:underline text-[#9d4300] font-semibold transition-colors"
                >
                  Estudiantes
                </Link>
                <span className="text-[#c6c6cd]">/</span>
                <Link
                  to="/estudiantes?tab=talleres"
                  className="hover:underline text-[#9d4300] font-semibold transition-colors"
                >
                  Talleres
                </Link>
                <span className="text-[#c6c6cd]">/</span>
                <span className="text-[#0b1c30] font-bold truncate max-w-xs sm:max-w-md">
                  {tallerNombre || "Detalle de Taller"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/estudiantes?tab=talleres")}
                className="text-xs font-semibold text-[#45464d] hover:text-[#0b1c30] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
                <span>Regresar a lista</span>
              </button>
            </div>

            {/* Taller Information & Compact Metrics */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pt-1">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#ffdbca] flex items-center justify-center text-[#783200] shrink-0 shadow-sm mt-0.5">
                  <HugeiconsIcon icon={BookOpenIcon} size={26} />
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0b1c30]">
                      {tallerNombre || "Taller"}
                    </h2>
                    {taller && (
                      <EstadoBadge
                        estado={
                          taller.estado === "confirmado" || taller.estado === "en_progreso"
                            ? "Abierto"
                            : taller.estado
                        }
                      />
                    )}
                  </div>

                  {/* Separated Metadata Lines */}
                  <div className="flex flex-col gap-1.5 text-xs">
                    {/* Row 1: Docente */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#45464d] min-w-[70px] inline-flex items-center gap-1.5">
                        <HugeiconsIcon icon={UserIcon} size={14} className="text-[#9d4300]" />
                        Docente:
                      </span>
                      <span className="text-[#0b1c30] font-medium">
                        {taller?.instructor
                          ? `${taller.instructor.nombres} ${taller.instructor.apellidos}`
                          : "Docente invitado"}
                      </span>
                    </div>

                    {/* Row 2: Fecha y Horario */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#45464d] min-w-[70px] inline-flex items-center gap-1.5">
                        <HugeiconsIcon icon={Clock04Icon} size={14} className="text-[#9d4300]" />
                        Fecha:
                      </span>
                      <span className="text-[#0b1c30] font-medium font-mono text-xs">
                        {taller?.fecha ? (
                          <>
                            {new Date(taller.fecha).toLocaleDateString("es-EC")}
                            {taller.hora_inicio ? ` · ${taller.hora_inicio.substring(0, 5)} - ${taller.hora_fin?.substring(0, 5)}` : ""}
                          </>
                        ) : (
                          "Por definir"
                        )}
                      </span>
                    </div>

                    {/* Row 3: Sede y Modalidad */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#45464d] min-w-[70px] inline-flex items-center gap-1.5">
                        <HugeiconsIcon icon={MapsLocation01Icon} size={14} className="text-[#9d4300]" />
                        Ubicación:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <ModalidadBadge modalidad={taller?.modalidad} />
                        {taller?.ciudad?.nombre && <CiudadBadge ciudad={taller.ciudad.nombre} showIcon={false} />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact 2-way KPI Metrics Row (Pagos al día & Pendientes) */}
              <div className="flex items-center gap-6 bg-[#eff4ff] p-3.5 px-6 rounded-xl border border-[#c6c6cd]/25 self-start">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
                    Pagos al día
                  </span>
                  <span className="text-2xl font-bold text-[#009668]">
                    {alDiaCount}
                  </span>
                </div>
                <div className="h-9 w-px bg-[#c6c6cd]/40" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
                    Pendientes
                  </span>
                  <span className="text-2xl font-bold text-[#9d4300]">
                    {pendientesCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DEDICATED OCUPACIÓN CARD CON BARRA DE PROGRESO */}
          <div className="p-5 rounded-xl bg-white shadow-sm border border-[#c6c6cd]/15 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b1c30] flex items-center gap-2">
                  <HugeiconsIcon icon={UserGroupIcon} size={16} className="text-[#9d4300]" />
                  <span>Ocupación y Cupos del Taller</span>
                </h3>
                <p className="text-xs text-[#45464d] mt-1">
                  Capacidad asignada: <span className="font-semibold text-[#0b1c30]">{capacidad > 0 ? `${capacidad} cupos` : "Sin límite"}</span>
                  {capacidad > 0 && capacidad > inscritos && (
                    <span> · Quedan <span className="font-semibold text-[#009668]">{capacidad - inscritos} cupos disponibles</span></span>
                  )}
                  {capacidad > 0 && inscritos >= capacidad && (
                    <span> · <span className="font-semibold text-[#ba1a1a]">Cupos agotados</span></span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-[#0b1c30]">
                  {inscritos} {capacidad > 0 ? `/ ${capacidad} cupos` : "participantes inscritos"}
                </span>
                {capacidad > 0 && (
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isHigh ? "bg-[#ffdbca] text-[#783200]" : "bg-[#dce9ff] text-[#009668]"
                    }`}
                  >
                    {ocupacion}% ocupado
                  </span>
                )}
              </div>
            </div>

            {/* Visual Progress Bar */}
            {capacidad > 0 && (
              <div className="w-full h-3 rounded-full bg-[#e5eeff] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHigh ? "bg-[#fd761a]" : "bg-[#009668]"
                  }`}
                  style={{ width: `${ocupacion}%` }}
                />
              </div>
            )}
          </div>

          {/* DRILL-DOWN PARTICIPANTS LIST TABLE */}
          <div className="rounded-xl bg-white shadow-sm overflow-hidden border border-[#c6c6cd]/20">
            {/* Table Top Bar */}
            <div className="p-4 bg-[#eff4ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c6c6cd]/20">
              <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wide">
                Participantes inscritos en este taller ({studentRows.length})
              </span>
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Buscar participante..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPagination((p) => ({ ...p, pageIndex: 0 }))
                    }}
                    className="w-full h-8 pl-8 pr-3 text-xs rounded-lg outline-none bg-white text-[#0b1c30] placeholder:text-[#45464d] border border-[#c6c6cd]/30 focus:ring-2 focus:ring-[#fd761a] transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setExportOpen(true)}
                  className="h-8 px-3 rounded-lg bg-white text-[#0b1c30] text-xs font-semibold shadow-sm hover:bg-[#e5eeff] transition-all flex items-center gap-1.5 border border-[#c6c6cd]/30 cursor-pointer shrink-0"
                >
                  <HugeiconsIcon icon={Download04Icon} size={15} />
                  <span>Exportar PDF</span>
                </button>
              </div>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr
                      key={hg.id}
                      className="bg-[#eff4ff]/60 border-b border-[#c6c6cd]/25 text-[11px] font-bold uppercase tracking-wider text-[#45464d]"
                    >
                      {hg.headers.map((header) => {
                        const canSort = header.column.getCanSort()
                        const sorted = header.column.getIsSorted()
                        const isGestion = header.id === "gestion"
                        return (
                          <th
                            key={header.id}
                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                            className={`py-3.5 px-4 ${canSort ? "cursor-pointer select-none" : ""} ${
                              isGestion ? "text-right" : ""
                            }`}
                            style={{
                              width: header.getSize() !== 150 ? header.getSize() : undefined,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <div className={`flex items-center gap-1 ${isGestion ? "justify-end" : ""}`}>
                              <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                              {canSort && (
                                <span className="inline-flex flex-col leading-none ml-1">
                                  <HugeiconsIcon
                                    icon={ArrowUp01Icon}
                                    size={10}
                                    className={sorted === "asc" ? "text-[#fd761a]" : "opacity-40"}
                                  />
                                  <HugeiconsIcon
                                    icon={ArrowDown01Icon}
                                    size={10}
                                    className={sorted === "desc" ? "text-[#fd761a]" : "opacity-40"}
                                  />
                                </span>
                              )}
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-[#e5eeff]/60 text-xs text-[#0b1c30]">
                  {loading ? (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-12 text-center text-xs text-[#45464d]">
                        Cargando participantes inscritos...
                      </td>
                    </tr>
                  ) : table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-8 py-16 text-center">
                        <div className="w-14 h-14 bg-[#eff4ff] rounded-xl flex items-center justify-center mx-auto mb-3">
                          <HugeiconsIcon icon={Clock04Icon} size={22} className="text-[#45464d]/60" />
                        </div>
                        <h4 className="text-sm font-bold text-[#0b1c30]">No hay participantes registrados</h4>
                        <p className="text-xs text-[#45464d] mt-0.5">
                          {search ? "No coinciden con la búsqueda." : "No se registran inscripciones en este taller aún."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-[#eff4ff]/40 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-3.5 px-4">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {table.getRowModel().rows.length > 0 && (
              <div className="px-4 py-3 border-t border-[#c6c6cd]/20 bg-[#eff4ff]">
                <PaginationControls table={table} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Export Dialog */}
      <StudentExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        selectedIds={[]}
        contexto="taller"
        onExport={handleExportPDF}
        title="Exportar participantes del taller"
        description={`${studentRows.length} participante(s) inscrito(s).`}
      />
    </div>
  )
}
