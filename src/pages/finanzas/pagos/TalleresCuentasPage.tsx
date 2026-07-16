/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SchoolIcon,
  ArrowRight01Icon,
  UserIcon,
  Money02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"

export function TalleresCuentasPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [cuentas, setCuentas] = useState<any[]>([])
  const [filter, setFilter] = useState<string>("todos")
  const [modalidad, setModalidad] = useState<string>("todos")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [clientPage, setClientPage] = useState(1)
  const CLIENT_PER_PAGE = 20

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setClientPage(1) // eslint-disable-line react-hooks/set-state-in-effect
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
        const data = (cuentasData.data || cuentasData || [])
        // Merge sin_cuenta talleres from resumen
        const sinCuenta = resumenData?.sin_cuenta?.talleres?.items || []
        const merged = [...data]
        sinCuenta.forEach((item: any) => {
          // evitar duplicados por id
          if (!merged.find((c: any) => c.id === item.id)) {
            merged.push(item)
          }
        })
        setCuentas(merged)
      } catch {
        toast.error("Error al cargar talleres")
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalidad])

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
    return filtered.filter(([name]) =>
      name.toLowerCase().includes(search.toLowerCase())
    )
  }, [filtered, search])

  const paginatedGroups = useMemo(() => {
    return searchFiltered.slice(0, clientPage * CLIENT_PER_PAGE)
  }, [searchFiltered, clientPage])

  const totalClientPages = Math.max(1, Math.ceil(searchFiltered.length / CLIENT_PER_PAGE))

  const HealthBar = ({ recaudado, total }: { recaudado: number; total: number }) => {
    const pct = total > 0 ? (recaudado / total) * 100 : 0
    const barColor =
      pct >= 80 ? "oklch(0.55 0.15 150)" :
      pct >= 50 ? "oklch(0.65 0.15 75)" :
      "oklch(0.5 0.15 20)"
    return (
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "oklch(0.93 0 0)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
        />
      </div>
    )
  }

  return (
    <div className="px-8 py-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black" style={{ color: COLORS.CHARCOAL }}>
              Talleres
            </h2>
            <p className="text-xs opacity-40 mt-1">
              {searchFiltered.length} taller{searchFiltered.length !== 1 ? "es" : ""} con cuentas por cobrar
            </p>
          </div>
          <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar taller..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-48 pl-3 pr-8 py-2 rounded-xl border text-xs font-medium outline-none transition-all focus:w-64"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setSearch("") }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} style={{ color: COLORS.TEXT_MUTED }} />
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            {[
              { key: "todos", label: "Todos" },
              { key: "pendiente", label: "Pendiente" },
              { key: "en_progreso", label: "En Progreso" },
              { key: "completado", label: "Completado" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  filter === f.key
                    ? "text-white shadow-sm"
                    : "hover:opacity-60"
                )}
                style={filter === f.key ? { backgroundColor: COLORS.ACCENT } : { color: COLORS.TEXT_MUTED, backgroundColor: "oklch(0.95 0 0)" }}
              >
                {f.label}
              </button>
            ))}
            <span className="mx-2 w-px self-stretch bg-gray-200" />
            {[
              { key: "todos", label: "Ambas" },
              { key: "presencial", label: "Presencial" },
              { key: "virtual", label: "Virtual" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setModalidad(f.key === "todos" ? "todos" : f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  modalidad === f.key
                    ? "text-white shadow-sm"
                    : "hover:opacity-60"
                )}
                style={modalidad === f.key ? { backgroundColor: COLORS.CHARCOAL } : { color: COLORS.TEXT_MUTED, backgroundColor: "oklch(0.95 0 0)" }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        </div>
        {loading ? (
          <div className="py-20 text-center opacity-40 text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
            Cargando talleres...
          </div>
        ) : searchFiltered.length === 0 ? (
          <div className="py-20 text-center opacity-40 text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
            No se encontraron talleres
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedGroups.map(([name, g], idx) => {
              const recaudadoPct = g.total > 0 ? (g.cobrado / g.total) * 100 : 0
              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="rounded-2xl border bg-white p-5"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: g.saldo > 0 ? "oklch(0.5 0.15 20 / 0.1)" : "oklch(0.55 0.15 150 / 0.1)" }}
                      >
                        <HugeiconsIcon
                          icon={SchoolIcon}
                          size={18}
                          color={g.saldo > 0 ? "#ef4444" : "#059669"}
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                          {name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] opacity-40">
                          <HugeiconsIcon icon={UserIcon} size={10} />
                          <span>{g.personas} persona{g.personas !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="opacity-40">Recaudado</span>
                      <span className="font-bold" style={{ color: recaudadoPct >= 80 ? "oklch(0.55 0.15 150)" : recaudadoPct >= 50 ? "oklch(0.65 0.15 75)" : "oklch(0.5 0.15 20)" }}>
                        {Math.round(recaudadoPct)}%
                      </span>
                    </div>
                    <HealthBar recaudado={g.cobrado} total={g.total} />
                  </div>

                  <div className="flex items-center justify-between text-xs mb-4">
                    <div className="flex items-center gap-1">
                      <HugeiconsIcon icon={Money02Icon} size={12} style={{ color: COLORS.TEXT_MUTED }} />
                      <span className="font-bold" style={{ color: COLORS.CHARCOAL }}>
                        ${g.cobrado.toLocaleString()}
                      </span>
                    </div>
                    <span className="opacity-40">
                      de ${g.total.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/finanzas/pagos/cuentas/talleres/${g.tallerId || name}`)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    style={{ color: COLORS.ACCENT, backgroundColor: `${COLORS.ACCENT}12` }}
                  >
                    Ver detalle
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </button>
                </motion.div>
              )
            })}
          </div>
          {totalClientPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t mt-6 px-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span className="text-xs opacity-40">
                Página {clientPage} de {totalClientPages} ({searchFiltered.length} talleres)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={clientPage <= 1}
                  onClick={() => setClientPage(p => p - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  Anterior
                </button>
                <button
                  disabled={clientPage >= totalClientPages}
                  onClick={() => setClientPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </motion.div>
    </div>
  )
}
