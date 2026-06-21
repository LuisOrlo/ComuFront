import { useState, useEffect, useCallback } from "react"
import { Link, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalIcon, BarChartIcon, LayersIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { TodosTab } from "./tabs/TodosTab"
import { CursosTab } from "./tabs/CursosTab"
import { TalleresTab } from "./tabs/TalleresTab"
import { CiudadesTab } from "./tabs/CiudadesTab"
import { estudiantesService } from "@/services/estudiantes.service"
import { cursosService } from "@/services/cursos.service"
import { tallerService } from "@/services/taller.service"

type Tab = "todos" | "cursos" | "talleres" | "ciudades"

export function EstudiantesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get("tab") as Tab | null
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl && ["todos", "cursos", "talleres", "ciudades"].includes(tabFromUrl) ? tabFromUrl : "todos")
  const [actionsOpen, setActionsOpen] = useState(false)
  const [tabCounts, setTabCounts] = useState({ todos: 0, cursos: 0, talleres: 0, ciudades: 0 })

  const loadCounts = useCallback(async () => {
    try {
      const [segments, stats, cursosRes, talleresRes, estudiantesRes] = await Promise.allSettled([
        estudiantesService.getSegments(),
        estudiantesService.getStudentStats(),
        cursosService.getCursos({ per_page: 500 }),
        tallerService.listar(),
        estudiantesService.getEstudiantes({ per_page: 1000 }),
      ])

      let todosCount = 0
      if (stats.status === "fulfilled") {
        todosCount = stats.value.total_estudiantes
      }

      let cursosCount = 0
      if (cursosRes.status === "fulfilled") {
        cursosCount = cursosRes.value.data?.length ?? 0
      }

      let talleresCount = 0
      if (talleresRes.status === "fulfilled") {
        const data = talleresRes.value.data || talleresRes.value.datos || []
        talleresCount = Array.isArray(data) ? data.length : 0
      }

      let ciudadesCount = 0
      if (estudiantesRes.status === "fulfilled") {
        const data = estudiantesRes.value.datos || []
        const ciudadesSet = new Set<string>()
        for (const e of data) {
          const ciudad = e.ciudad?.nombre?.trim() || e.perfil_estudiante?.ciudad?.trim()
          if (ciudad) ciudadesSet.add(ciudad)
        }
        ciudadesCount = ciudadesSet.size
      }

      void segments

      setTabCounts({ todos: todosCount, cursos: cursosCount, talleres: talleresCount, ciudades: ciudadesCount })
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
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-black">Estudiantes</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setActionsOpen(!actionsOpen)}
              className="inline-flex items-center justify-center size-10 rounded-xl border bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} size={18} />
            </button>
            {actionsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setActionsOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-2xl shadow-xl z-20 p-1.5 overflow-hidden">
                  <Link
                    to="/estudiantes/estadisticas"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <HugeiconsIcon icon={BarChartIcon} size={15} />
                    Estadisticas
                  </Link>
                  <Link
                    to="/estudiantes/segmentos"
                    onClick={() => setActionsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <HugeiconsIcon icon={LayersIcon} size={15} />
                    Gestionar Segmentos
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchParams({ tab: tab.id }) }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
              activeTab === tab.id ? "bg-gray-100 text-gray-700" : "text-gray-400"
            }`}>
              {tabCounts[tab.id]}
            </span>
            {activeTab === tab.id && (
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.ACCENT }} />
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
  )
}
