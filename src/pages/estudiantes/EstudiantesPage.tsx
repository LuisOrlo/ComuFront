import { useState, useEffect, useCallback } from "react"
import { Link, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalIcon, BarChartIcon, LayersIcon, AddCircleIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { TodosTab } from "./tabs/TodosTab"
import { CursosTab } from "./tabs/CursosTab"
import { TalleresTab } from "./tabs/TalleresTab"
import { CiudadesTab } from "./tabs/CiudadesTab"
import { estudiantesService } from "@/services/estudiantes.service"

type Tab = "todos" | "cursos" | "talleres" | "ciudades"

export function EstudiantesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get("tab") as Tab | null
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl && ["todos", "cursos", "talleres", "ciudades"].includes(tabFromUrl) ? tabFromUrl : "todos")
  const [actionsOpen, setActionsOpen] = useState(false)
  const [tabCounts, setTabCounts] = useState({ todos: 0, cursos: 0, talleres: 0, ciudades: 0 })

  const loadCounts = useCallback(async () => {
    try {
      const stats = await estudiantesService.getStudentStats()
      setTabCounts({
        todos: stats.total_estudiantes,
        cursos: stats.cursos_count,
        talleres: stats.talleres_count,
        ciudades: stats.ciudades_count,
      })
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCounts()
  }, [loadCounts])

  const tabs: { id: Tab; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "cursos", label: "Cursos" },
    { id: "talleres", label: "Talleres" },
    { id: "ciudades", label: "Ciudades" },
  ]

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: COLORS.CHARCOAL }}>Estudiantes</h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/estudiantes/nuevo"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 active:scale-[0.97] select-none"
                style={{
                  backgroundColor: COLORS.ACCENT,
                  boxShadow: `0 0 15px ${COLORS.ACCENT}25`,
                }}
              >
                <HugeiconsIcon icon={AddCircleIcon} size={18} />
                Nuevo Estudiante
              </Link>
              <div className="relative">
                <button
                  onClick={() => setActionsOpen(!actionsOpen)}
                  className="inline-flex size-10 items-center justify-center rounded-lg border bg-white text-gray-500 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-gray-900"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={18} />
                </button>
                {actionsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActionsOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border bg-white p-1.5 shadow-xl" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <Link
                        to="/estudiantes/estadisticas"
                        onClick={() => setActionsOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-orange-50 hover:text-gray-900"
                      >
                        <span className="flex size-7 items-center justify-center rounded-lg bg-orange-50" style={{ color: COLORS.ACCENT }}>
                          <HugeiconsIcon icon={BarChartIcon} size={15} />
                        </span>
                        Estadisticas
                      </Link>
                      <Link
                        to="/estudiantes/segmentos"
                        onClick={() => setActionsOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-orange-50 hover:text-gray-900"
                      >
                        <span className="flex size-7 items-center justify-center rounded-lg bg-orange-50" style={{ color: COLORS.ACCENT }}>
                          <HugeiconsIcon icon={LayersIcon} size={15} />
                        </span>
                        Gestionar Segmentos
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="flex items-center gap-1 rounded-xl border bg-white p-1 shadow-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchParams({ tab: tab.id }) }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "text-white shadow-sm"
                    : "hover:bg-gray-50"
                }`}
                style={activeTab === tab.id ? { backgroundColor: COLORS.ACCENT } : { color: COLORS.TEXT_MUTED }}
              >
                {tab.label}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-100"
                }`} style={activeTab !== tab.id ? { color: COLORS.TEXT_MUTED } : undefined}>
                  {tabCounts[tab.id]}
                </span>
                {activeTab === tab.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            ))}
          </div>

          <div>
            {activeTab === "todos" && <TodosTab />}
            {activeTab === "cursos" && <CursosTab />}
            {activeTab === "talleres" && <TalleresTab />}
            {activeTab === "ciudades" && <CiudadesTab />}
          </div>
        </div>
      </main>
    </div>
  )
}
