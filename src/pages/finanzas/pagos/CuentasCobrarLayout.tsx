import { NavLink, Outlet, useLocation } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LibraryIcon,
  UserGroupIcon,
  SchoolIcon,
  LayersIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

const SUB_TABS = [
  {
    label: "Cursos",
    path: "/finanzas/pagos/cuentas/cursos",
    icon: LibraryIcon,
  },
  {
    label: "Cursos personalizados",
    path: "/finanzas/pagos/cuentas/cursos-personalizados",
    icon: UserGroupIcon,
  },
  {
    label: "Talleres",
    path: "/finanzas/pagos/cuentas/talleres",
    icon: SchoolIcon,
  },
  {
    label: "Servicios",
    path: "/finanzas/pagos/cuentas/servicios",
    icon: LayersIcon,
  },
]

export function CuentasCobrarLayout() {
  const location = useLocation()

  const isSubPage = !SUB_TABS.some((tab) => location.pathname === tab.path)

  return (
    <div className="flex-1 flex flex-col">
      {!isSubPage && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SUB_TABS.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap active:scale-[0.98]",
                    isActive
                      ? "bg-[#fd761a] text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                <HugeiconsIcon icon={tab.icon} size={16} />
                <span>{tab.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
