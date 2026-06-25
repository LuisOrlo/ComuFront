/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LibraryIcon,
  ArrowRight01Icon,
  UserIcon,
  Money02Icon,
  LayersIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"

export function CursosCuentasPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [cuentas, setCuentas] = useState<any[]>([])
  const [filter, setFilter] = useState<string>("todos")
  const [modalidad, setModalidad] = useState<string>("todos")

  useEffect(() => {
    const load = async () => {
      try {
        const params: any = { per_page: 200 }
        if (modalidad !== "todos") params.modalidad = modalidad
        const [resumenData, cuentasData] = await Promise.all([
          financeService.getResumen(),
          financeService.getCuentas(params),
        ])
        const data = cuentasData.data || cuentasData || []
        const sinCuenta = resumenData?.sin_cuenta?.cursos?.items || []
        const merged = [...data]
        sinCuenta.forEach((item: any) => {
          if (!merged.find((c: any) => c.id === item.id)) {
            merged.push(item)
          }
        })
        setCuentas(merged)
      } catch {
        toast.error("Error al cargar cursos")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [modalidad])

  const grouped = useMemo(() => {
    const groups: Record<string, any> = {}
    cuentas.forEach((c) => {
      if (c.inscripcion_taller || c.inscripcion_taller_id) return
      if (c.reserva_aula_id || c.reserva_podcast_id || c.alquiler_equipo_id
        || c.servicio_streaming_id || c.servicio_produccion_id || c.edicion_video_id
        || c.clase_extra_id || c.asesoria_id || c.reserva_radio_id) return
      if (c.tipo === "aula" || c.tipo === "podcast" || c.tipo === "equipo" || c.tipo === "streaming" || c.tipo === "produccion" || c.tipo === "edicion" || c.tipo === "radio" || c.tipo === "clase_extra" || c.tipo === "asesoria") return
      if (c.tipo === "taller" || c.tipo === "talleres") return

      const cursoId =
        c.matricula?.curso_abierto?.id ||
        c.solicitud_inscripcion?.curso_abierto?.id ||
        c.curso_abierto_id ||
        c.curso_id ||
        ""

      const curso =
        c.matricula?.curso_abierto ||
        c.solicitud_inscripcion?.curso_abierto ||
        null

      let name = curso?.nombre_instancia || ""

      if (!name && curso) {
        const partes: string[] = []
        if (curso.catalogo?.nombre) partes.push(curso.catalogo.nombre)
        if (curso.ciudad?.nombre) partes.push(curso.ciudad.nombre)
        if (curso.fecha_inicio) {
          const d = new Date(curso.fecha_inicio)
          const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
          partes.push(`${meses[d.getMonth()]} ${d.getFullYear()}`)
        }
        if (curso.modalidad) partes.push(curso.modalidad.charAt(0).toUpperCase() + curso.modalidad.slice(1))
        if (partes.length > 0) name = partes.join(' — ')
      }

      if (!name) name = c.curso_nombre || "Curso"

      if (!groups[name]) {
        groups[name] = {
          total: 0,
          cobrado: 0,
          saldo: 0,
          personas: 0,
          modulos: 0,
          cursoId,
          entries: [],
        }
      }
      const g = groups[name]
      g.total += Number(c.monto_total || 0)
      g.cobrado += Number(c.monto_abonado || 0)
      g.saldo += Number(c.saldo_pendiente || 0)
      g.personas += 1
      g.modulos = Math.max(g.modulos, c.matricula?.curso_abierto?.modulos?.length || 0)
      g.entries.push(c)
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
              Cursos
            </h2>
            <p className="text-xs opacity-40 mt-1">
              {filtered.length} curso{filtered.length !== 1 ? "s" : ""} con cuentas por cobrar
            </p>
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

        {loading ? (
          <div className="py-20 text-center opacity-40 text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
            Cargando cursos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center opacity-40 text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
            No se encontraron cursos
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(([name, g], idx) => {
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
                          icon={LibraryIcon}
                          size={18}
                          color={g.saldo > 0 ? "#ef4444" : "#059669"}
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                          {name}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] opacity-40 mt-0.5">
                          <span className="flex items-center gap-1">
                            <HugeiconsIcon icon={UserIcon} size={10} />
                            {g.personas} estudiante{g.personas !== 1 ? "s" : ""}
                          </span>
                          {g.modulos > 0 && (
                            <span className="flex items-center gap-1">
                              <HugeiconsIcon icon={LayersIcon} size={10} />
                              {g.modulos} módulo{g.modulos !== 1 ? "s" : ""}
                            </span>
                          )}
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
                    onClick={() => navigate(`/finanzas/pagos/cuentas/cursos/${g.cursoId || name}`)}
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
        )}
      </motion.div>
    </div>
  )
}
