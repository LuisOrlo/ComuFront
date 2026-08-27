import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { AddCircleIcon, UserGroupIcon, GraduationCapIcon, BookOpenIcon } from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { COLORS } from "@/lib/constants"
import { TodosTab } from "./tabs/TodosTab"
import { CursosTab } from "./tabs/CursosTab"
import { TalleresTab } from "./tabs/TalleresTab"
import { estudiantesService } from "@/services/estudiantes.service"

type Tab = "todos" | "cursos" | "talleres"

export function EstudiantesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get("tab") as Tab | null
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl && ["todos", "cursos", "talleres"].includes(tabFromUrl) ? tabFromUrl : "todos")

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
            </div>
          </header>

          <div className="flex gap-1 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchParams({ tab: tab.id }) }}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all"
                style={{
                  borderColor: activeTab === tab.id ? COLORS.ACCENT : "transparent",
                  color: activeTab === tab.id ? COLORS.CHARCOAL : COLORS.TEXT_MUTED,
                }}
              >
                <HugeiconsIcon icon={tab.icon} size={14} />
                {tab.label}
                <span className="text-xs opacity-50">({tabCounts[tab.id]})</span>
              </button>
            ))}
          </div>

          <div>
            {activeTab === "todos" && <TodosTab />}
            {activeTab === "cursos" && <CursosTab />}
            {activeTab === "talleres" && <TalleresTab />}
          </div>
        </div>
      </main>
    </div>
  )
}
