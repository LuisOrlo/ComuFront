/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { AiFolderIcon, Money01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { HealthBar } from "./sections/HealthBar"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

const FK_A_TIPO: Record<string, string> = {
  reserva_podcast_id: "Podcast",
  reserva_aula_id: "Aula",
  alquiler_equipo_id: "Equipo",
  edicion_video_id: "Edición de Video",
  reserva_radio_id: "Radio",
  servicio_streaming_id: "Streaming",
  servicio_produccion_id: "Producción",
  clase_extra_id: "Clase Extra",
  asesoria_id: "Asesoría",
}

const SERVICIO_FKS = Object.keys(FK_A_TIPO)

function getServicioTipo(entry: any): string {
  for (const fk of SERVICIO_FKS) if (entry[fk]) return FK_A_TIPO[fk]
  return "Servicio"
}

function getServicioNombre(c: any): string {
  const tipo = getServicioTipo(c)
  const titulo = c.reserva_podcast?.titulo
    || c.reserva_aula?.aula?.nombre
    || c.alquiler_equipo?.equipo?.nombre
  if (titulo) return `${tipo} - ${titulo}`
  const paquete = c.reserva_podcast?.paquete?.nombre
  if (paquete) return `${tipo} - ${paquete}`
  return tipo
}

export function ServiciosCuentasPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [cuentas, setCuentas] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState("todos")
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
  }, [filter, search])

  useEffect(() => {
    Promise.all([
      financeService.getCuentas({ origen: "servicio", per_page: 50, ...(search ? { search } : {}) }),
      financeService.getResumen(),
    ])
      .then(([cuentasData, resumenData]) => {
        setCuentas(cuentasData.data ?? [])
        setStats(resumenData)
      })
      .catch(() => toast.error("Error al cargar cuentas de servicios"))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const grouped = useMemo(() => {
    const map: Record<string, { total: number; cobrado: number; saldo: number; personas: number; entries: any[] }> = {}

    cuentas.forEach((c: any) => {
      if (!c) return
      const name = getServicioNombre(c)
      if (!map[name]) map[name] = { total: 0, cobrado: 0, saldo: 0, personas: 0, entries: [] }
      const g = map[name]
      g.total += Number(c.monto_total || 0)
      g.cobrado += Number(c.monto_abonado || 0)
      g.saldo += Number(c.saldo_pendiente || 0)
      g.personas += 1
      g.entries.push(c)
    })

    if (Array.isArray(stats?.sin_cuenta?.servicios?.items)) {
      stats.sin_cuenta.servicios.items.forEach((item: any) => {
        const name = getServicioNombre(item)
        if (!map[name]) map[name] = { total: 0, cobrado: 0, saldo: 0, personas: 0, entries: [] }
        const g = map[name]
        g.total += Number(item.monto_total || 0)
        g.cobrado += Number(item.monto_abonado || 0)
        g.saldo += Number(item.saldo_pendiente || 0)
        g.personas += 1
        g.entries.push({ ...item, _sin_cuenta: true })
      })
    }

    return map
  }, [cuentas, stats])

  const filtered = useMemo(() => {
    const entries = Object.entries(grouped)
    if (filter === "todos") return entries
    return entries.filter(([, g]) => {
      const pct = g.total > 0 ? (g.cobrado / g.total) * 100 : 0
      if (filter === "pendiente") return pct < 50
      if (filter === "en_progreso") return pct >= 50 && pct < 100
      if (filter === "completado") return pct >= 100
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="space-y-3 w-full max-w-lg px-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black" style={{ color: CHARCOAL }}>
            Servicios
          </h2>
          <p className="text-xs opacity-40 mt-1">
            {searchFiltered.length} tipo{searchFiltered.length !== 1 ? "s" : ""} de servicio con cuentas por cobrar
          </p>
        </div>
        <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar servicio..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-48 pl-3 pr-8 py-2 rounded-xl border text-xs font-medium outline-none transition-all focus:w-64"
            style={{ borderColor: BORDER, color: CHARCOAL }}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); setSearch("") }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} style={{ color: MUTED }} />
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
                filter === f.key ? "text-white shadow-sm" : "hover:opacity-60"
              )}
              style={filter === f.key ? { backgroundColor: ACCENT } : { color: MUTED, backgroundColor: "oklch(0.95 0 0)" }}
            >
              {f.label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {searchFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-[1.5rem] flex items-center justify-center mb-4" style={{ backgroundColor: "oklch(0.95 0.01 45)" }}>
            <HugeiconsIcon icon={AiFolderIcon} size={28} style={{ color: COLORS.ACCENT }} />
          </div>
          <p className="text-sm font-bold" style={{ color: CHARCOAL }}>No hay servicios registrados</p>
          <p className="text-xs opacity-40 mt-1">Los servicios con pagos aparecerán aquí</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginatedGroups.map(([name, g]) => {
            const pct = g.total > 0 ? (g.cobrado / g.total) * 100 : 0
            return (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border bg-white p-5 space-y-3"
                style={{ borderColor: BORDER }}
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.95 0.01 45)" }}>
                    <HugeiconsIcon icon={AiFolderIcon} size={18} style={{ color: COLORS.ACCENT }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: CHARCOAL }}>{name}</p>
                    <p className="text-[10px] opacity-40">{g.personas} persona{g.personas !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                <HealthBar recaudado={g.cobrado} total={g.total} />

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={Money01Icon} size={12} className="opacity-40" />
                    <span className="font-medium" style={{ color: CHARCOAL }}>
                      Recaudado ${g.cobrado.toLocaleString()} de ${g.total.toLocaleString()}
                    </span>
                  </div>
                  <span className="font-bold" style={{ color: COLORS.ACCENT }}>{Math.round(pct)}%</span>
                </div>

                <button
                  onClick={() =>
                    navigate(`/finanzas/pagos/cuentas/servicios/${encodeURIComponent(name)}`, {
                      state: { entries: g.entries, name, total: g.total, cobrado: g.cobrado, saldo: g.saldo },
                    })
                  }
                  className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.98] text-white text-center"
                  style={{ backgroundColor: ACCENT }}
                >
                  Ver detalle
                </button>
              </motion.div>
            )
          })}
        </div>
        {totalClientPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t mt-6 px-2" style={{ borderColor: BORDER }}>
            <span className="text-xs opacity-40">
              Página {clientPage} de {totalClientPages} ({searchFiltered.length} servicios)
            </span>
            <div className="flex gap-2">
              <button
                disabled={clientPage <= 1}
                onClick={() => setClientPage(p => p - 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all"
                style={{ borderColor: BORDER }}
              >
                Anterior
              </button>
              <button
                disabled={clientPage >= totalClientPages}
                onClick={() => setClientPage(p => p + 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold border disabled:opacity-30 hover:bg-gray-50 transition-all"
                style={{ borderColor: BORDER }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  )
}
