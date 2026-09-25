import { COLORS } from "@/lib/constants"
import { NavLink, Outlet, useLocation } from "react-router"

const SUB_TABS = [
  { label: "Cursos", path: "/finanzas/pagos/cuentas/cursos" },
  { label: "Cursos personalizados", path: "/finanzas/pagos/cuentas/cursos-personalizados" },
  { label: "Talleres", path: "/finanzas/pagos/cuentas/talleres" },
  { label: "Servicios", path: "/finanzas/pagos/cuentas/servicios" },
]

export function CuentasCobrarLayout() {
  const location = useLocation()

  const isSubPage = !SUB_TABS.some(tab => location.pathname === tab.path)

  return (
    <div className="flex flex-col h-full">
      {!isSubPage && (
        <div className="px-8 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {SUB_TABS.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className="px-5 py-2 rounded-lg text-xs font-bold transition-all"
                  style={({ isActive }) => ({
                    color: isActive ? "#fff" : COLORS.CHARCOAL,
                    backgroundColor: isActive ? COLORS.ACCENT : "oklch(0.95 0 0)",
                    opacity: isActive ? 1 : 0.6,
                  })}
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
