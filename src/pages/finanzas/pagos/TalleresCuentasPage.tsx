/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SchoolIcon,
  ArrowRight01Icon,
  UserIcon,
  Search01Icon,
  Cancel01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { Skeleton } from "@/components/ui/skeleton"

export function TalleresCuentasPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [cuentas, setCuentas] = useState<any[]>([])
  const [filter, setFilter] = useState<string>("todos")
  const [modalidad, setModalidad] = useState<string>("todos")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [clientPage, setClientPage] = useState(1)
  const CLIENT_PER_PAGE = 18

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setClientPage(1)
  }, [filter, modalidad, search])

  useEffect(() => {
    const load = async () => {
      try {
        const params: any = { origen: "taller", per_page: 50 }
        if (modalidad !== "todos") params.modalidad = modalidad
        if (search) params.search = search
        const [resumenData, cuentasData] = await Promise.all([
          financeService.getResumen(),
          financeService.getCuentas(params),
        ])
        const data = cuentasData.data || cuentasData || []
        const sinCuenta = resumenData?.sin_cuenta?.talleres?.items || []
        const merged = [...data]
        sinCuenta.forEach((item: any) => {
          if (!merged.find((c: any) => c.id === item.id)) {
            merged.push(item)
          }
        })
        setCuentas(merged)
      } catch {
        toast.error("Error al cargar los talleres")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [modalidad, search])

  const grouped = useMemo(() => {
    const groups: Record<string, any> = {}
    cuentas.forEach((c) => {
      const name = c.inscripcion_taller?.taller?.nombre || c.taller_nombre || "Taller"
      if (!groups[name]) {
        groups[name] = {
          total: 0,
          cobrado: 0,
          saldo: 0,
          personas: 0,
          tallerId: c.inscripcion_taller?.taller?.id || c.taller_id || "",
          modalidad: c.inscripcion_taller?.taller?.modalidad || "",
        }
      }
      const g = groups[name]
      g.total += Number(c.monto_total || 0)
      g.cobrado += Number(c.monto_abonado || 0)
      g.saldo += Number(c.saldo_pendiente || 0)
      g.personas += 1
    })
    return Object.entries(groups)
  }, [cuentas])

  const filtered = useMemo(() => {
    return grouped.filter(([, g]) => {
      const pct = g.total > 0 ? (g.cobrado / g.total) * 100 : 0
      if (filter === "pendiente") return g.saldo > 0 && pct < 50
      if (filter === "en_progreso") return g.saldo > 0 && pct >= 50 && pct < 100
      if (filter === "completado") return g.saldo <= 0
      return true
    })
  }, [grouped, filter])

  const searchFiltered = useMemo(() => {
    if (!search) return filtered
    const q = search.toLowerCase().trim()
    return filtered.filter(([name]) => name.toLowerCase().includes(q))
  }, [filtered, search])

  const paginatedGroups = useMemo(() => {
    const start = (clientPage - 1) * CLIENT_PER_PAGE
    return searchFiltered.slice(start, start + CLIENT_PER_PAGE)
  }, [searchFiltered, clientPage])

  const totalClientPages = Math.max(1, Math.ceil(searchFiltered.length / CLIENT_PER_PAGE))

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalClientPages <= 5) {
      for (let i = 1; i <= totalClientPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (clientPage > 3) pages.push("...")
      const start = Math.max(2, clientPage - 1)
      const end = Math.min(totalClientPages - 1, clientPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (clientPage < totalClientPages - 2) pages.push("...")
      pages.push(totalClientPages)
    }
    return pages
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Título de la sección */}
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Cuentas de Talleres
            </h2>
            <p className="text-xs text-slate-500">
              {searchFiltered.length} taller{searchFiltered.length !== 1 ? "es" : ""} con registro de cuentas por cobrar
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Estado Tabs */}
            <div className="flex items-center p-0.5 bg-slate-100/80 rounded-xl border border-slate-200/60">
              {[
                { key: "todos", label: "Todos" },
                { key: "pendiente", label: "Pendiente" },
                { key: "en_progreso", label: "En progreso" },
                { key: "completado", label: "Completado" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                    filter === f.key
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Modalidad Selector */}
            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-[#fd761a] transition-colors cursor-pointer"
            >
              <option value="todos">Todas las modalidades</option>
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
            </select>

            {/* Input de Búsqueda */}
            <div className="relative flex-1 sm:w-60">
              <HugeiconsIcon
                icon={Search01Icon}
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar taller..."
                className="w-full h-9 pl-9 pr-8 text-xs rounded-xl border border-slate-200/90 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("")
                    setSearch("")
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Talleres */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : searchFiltered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fd761a] mx-auto mb-3">
            <HugeiconsIcon icon={SchoolIcon} size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            No se encontraron talleres
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No hay talleres que coincidan con los filtros seleccionados o con saldo registrado.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedGroups.map(([name, g]) => {
              const recaudadoPct = g.total > 0 ? (g.cobrado / g.total) * 100 : 0
              const isCompletado = g.saldo <= 0 && g.total > 0

              return (
                <div
                  key={name}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    {/* Header de la tarjeta */}
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "size-10 rounded-xl flex items-center justify-center shrink-0 border",
                          isCompletado
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : g.saldo > 0
                            ? "bg-orange-50 text-[#fd761a] border-orange-100"
                            : "bg-slate-50 text-slate-500 border-slate-100"
                        )}
                      >
                        <HugeiconsIcon icon={SchoolIcon} size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#fd761a] transition-colors truncate" title={name}>
                          {name}
                        </h3>
                        <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1 font-medium text-slate-500">
                            <HugeiconsIcon icon={UserIcon} size={12} />
                            {g.personas} participante{g.personas !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de Progreso Financiero */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px] font-semibold uppercase">
                          Recaudación
                        </span>
                        <span
                          className={cn(
                            "font-bold text-xs",
                            recaudadoPct >= 80
                              ? "text-emerald-600"
                              : recaudadoPct >= 40
                              ? "text-amber-600"
                              : "text-rose-600"
                          )}
                        >
                          {Math.round(recaudadoPct)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            recaudadoPct >= 80
                              ? "bg-emerald-500"
                              : recaudadoPct >= 40
                              ? "bg-amber-500"
                              : "bg-[#fd761a]"
                          )}
                          style={{ width: `${Math.min(recaudadoPct, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Datos Monetarios */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Cobrado</span>
                        <span className="font-bold text-slate-900 text-sm">
                          ${g.cobrado.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Pendiente</span>
                        <span className={cn("font-bold text-sm", g.saldo > 0 ? "text-rose-600" : "text-emerald-600")}>
                          ${g.saldo.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botón Acción */}
                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/finanzas/pagos/cuentas/talleres/${g.tallerId || name}`)
                      }
                      className="w-full h-9 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 text-slate-700 bg-slate-50 border border-slate-200/80 hover:bg-[#fd761a] hover:text-white hover:border-[#fd761a] shadow-2xs transition-all active:scale-[0.98]"
                    >
                      <span>Ver detalle de cuentas</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Paginación */}
          {totalClientPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500">
                Página <span className="font-semibold text-slate-800">{clientPage}</span> de{" "}
                <span className="font-semibold text-slate-800">{totalClientPages}</span> ({searchFiltered.length} talleres)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={clientPage <= 1}
                  onClick={() => setClientPage((p) => p - 1)}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, idx) =>
                    typeof page === "number" ? (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setClientPage(page)}
                        className={cn(
                          "size-8 rounded-lg text-xs font-semibold transition-all",
                          clientPage === page
                            ? "bg-[#fd761a] text-white shadow-2xs"
                            : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={idx} className="px-1 text-xs text-slate-400">
                        {page}
                      </span>
                    )
                  )}
                </div>

                <button
                  type="button"
                  disabled={clientPage >= totalClientPages}
                  onClick={() => setClientPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
                >
                  <span>Siguiente</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
