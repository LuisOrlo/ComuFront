import { useState, useMemo, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AddCircleIcon,
  UserGroupIcon,
  GraduationCapIcon,
  BookOpenIcon,
  Download04Icon,
  AlertCircleIcon,
  Clock04Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { TodosTab } from "./tabs/TodosTab"
import { CursosTab } from "./tabs/CursosTab"
import { TalleresTab } from "./tabs/TalleresTab"
import { estudiantesService } from "@/services/estudiantes.service"

type Tab = "todos" | "cursos" | "talleres"

export function EstudiantesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get("tab") as Tab | null
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl && ["todos", "cursos", "talleres"].includes(tabFromUrl) ? tabFromUrl : "todos")
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    if (tabFromUrl && ["todos", "cursos", "talleres"].includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl, activeTab])

  const { data: statsData } = useQuery({
    queryKey: ["estudiantes", "stats"],
    queryFn: estudiantesService.getStudentStats,
    staleTime: 5 * 60 * 1000,
  })

  const tabCounts = useMemo(
    () => ({
      todos: statsData?.total_estudiantes ?? 0,
      cursos: statsData?.cursos_count ?? 0,
      talleres: statsData?.talleres_count ?? 0,
    }),
    [statsData]
  )

  const tabs: { id: Tab; label: string; icon: IconSvgElement }[] = [
    { id: "todos", label: "Por estudiante", icon: UserGroupIcon },
    { id: "cursos", label: "Por curso", icon: GraduationCapIcon },
    { id: "talleres", label: "Por taller", icon: BookOpenIcon },
  ]

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden bg-[#f8f9ff]">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* PAGE INTRO & PRIMARY ACTIONS */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
            <div className="flex flex-col gap-1">
              
              <h1 className="text-2xl sm:text-[30px] font-bold tracking-tight text-[#0b1c30]">
                Estudiantes
              </h1>
             
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeTab === "todos" && (
                <button
                  type="button"
                  onClick={() => setExportOpen(true)}
                  className="h-10 px-4 rounded-lg bg-white text-[#0b1c30] text-xs font-semibold shadow-sm hover:bg-[#e5eeff] transition-all flex items-center gap-2 cursor-pointer border border-[#c6c6cd]/30"
                >
                  <HugeiconsIcon icon={Download04Icon} size={18} />
                  <span>Exportar datos</span>
                </button>
              )}
              <Link
                to="/estudiantes/nuevo"
                title="Solo registrar estudiante, sin curso, matrícula ni pago"
                className="h-10 px-4 sm:px-5 rounded-lg bg-[#fd761a] text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer shadow-[0_2px_8px_rgba(253,118,26,0.25)] select-none"
              >
                <HugeiconsIcon icon={AddCircleIcon} size={18} />
                <span>Nuevo estudiante</span>
              </Link>
              <Link
                to="/estudiantes/nuevo/inscribir"
                title="Registrar estudiante y continuar con curso, oferta y pago"
                className="h-10 px-4 sm:px-5 rounded-lg bg-white text-[#0b1c30] text-xs font-semibold shadow-sm hover:bg-[#e5eeff] transition-all flex items-center gap-2 cursor-pointer border border-[#c6c6cd]/30 select-none"
              >
                
                <span>Nueva matrícula</span>
              </Link>
            </div>
          </header>

          {/* COMPACT SUMMARY METRICS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total estudiantes */}
            <div className="p-4 rounded-xl bg-white shadow-sm flex items-center justify-between gap-3 border border-[#c6c6cd]/15">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
                  Total estudiantes
                </span>
                <span className="text-2xl font-bold tracking-tight text-[#0b1c30] mt-0.5">
                  {tabCounts.todos}
                </span>
                <span className="text-xs text-[#45464d] mt-0.5">
                  Personas registradas
                </span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#0b1c30]">
                <HugeiconsIcon icon={UserGroupIcon} size={22} />
              </div>
            </div>

            {/* Card 2: Cursos */}
            <div className="p-4 rounded-xl bg-white shadow-sm flex items-center justify-between gap-3 border border-[#c6c6cd]/15">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
                  Cursos
                </span>
                <span className="text-2xl font-bold tracking-tight text-[#0b1c30] mt-0.5">
                  {tabCounts.cursos}
                </span>
                <span className="text-xs text-[#45464d] mt-0.5">
                  Cursos disponibles
                </span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#0b1c30]">
                <HugeiconsIcon icon={GraduationCapIcon} size={22} />
              </div>
            </div>

            {/* Card 3: Talleres */}
            <div className="p-4 rounded-xl bg-white shadow-sm flex items-center justify-between gap-3 border border-[#c6c6cd]/15">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
                  Talleres
                </span>
                <span className="text-2xl font-bold tracking-tight text-[#0b1c30] mt-0.5">
                  {tabCounts.talleres}
                </span>
                <span className="text-xs text-[#45464d] mt-0.5">
                  Talleres disponibles
                </span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#0b1c30]">
                <HugeiconsIcon icon={BookOpenIcon} size={22} />
              </div>
            </div>

            {/* Card 4: Pagos pendientes */}
            <div className="p-4 rounded-xl bg-white shadow-sm flex items-center justify-between gap-3 border border-[#c6c6cd]/15">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
                  Estudiantes con pagos pendientes
                </span>
                <span className="text-2xl font-bold tracking-tight text-[#9d4300] mt-0.5">
                  {statsData?.pagos_pendientes_count ?? 0}
                </span>
                <span className="text-xs text-[#9d4300] font-medium mt-0.5 flex items-center gap-1">
                  <HugeiconsIcon icon={Clock04Icon} size={14} />
                  Requieren seguimiento
                </span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-[#ffdbca] flex items-center justify-center text-[#783200]">
                <HugeiconsIcon icon={AlertCircleIcon} size={22} />
              </div>
            </div>
          </div>

          {/* PERSPECTIVE SELECTOR BAR (MAIN 3-WAY SEGMENTED TABS) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="inline-flex p-1 rounded-xl bg-[#eff4ff] shadow-sm self-start" role="tablist">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id)
                      setSearchParams({ tab: tab.id })
                    }}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-[#0b1c30] shadow-sm"
                        : "text-[#45464d] hover:text-[#0b1c30]"
                    }`}
                  >
                    <HugeiconsIcon
                      icon={tab.icon}
                      size={16}
                      className={isActive ? "text-[#9d4300]" : "text-[#45464d]"}
                    />
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        isActive
                          ? "bg-[#e5eeff] text-[#0b1c30]"
                          : "bg-[#dce9ff] text-[#45464d]"
                      }`}
                    >
                      {tabCounts[tab.id]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* TAB CONTENT */}
          <div>
            {activeTab === "todos" && (
              <TodosTab
                exportOpen={exportOpen}
                onExportOpenChange={setExportOpen}
              />
            )}
            {activeTab === "cursos" && <CursosTab />}
            {activeTab === "talleres" && <TalleresTab />}
          </div>
        </div>
      </main>
    </div>
  )
}
