import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router"

const SUB_TABS = [
  { label: "Cursos", path: "/finanzas/pagos/cuentas/cursos" },
  { label: "Talleres", path: "/finanzas/pagos/cuentas/talleres" },
  { label: "Servicios", path: "/finanzas/pagos/cuentas/servicios" },
]

export function CuentasCobrarLayout() {
  const location = useLocation()
  const navigate = useNavigate()

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
            <button
              onClick={() => navigate("/finanzas/pagos/resumen")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-black/5"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={13} />
              Volver a Resumen
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
