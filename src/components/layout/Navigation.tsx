import { Link, useLocation } from "react-router"
import { useRef, useEffect, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  LayoutDashboard,
  VideoIcon,
  GraduationCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  MoneyIcon,
  Invoice02Icon,
  CalendarIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  CertificateIcon,
  UserCheckIcon,
  SettingsIcon,
  BellIcon,
  Menu09Icon,
  AiFolderIcon,
  AiLearningIcon,
  BookmarkIcon,
  Logout03Icon,
  SchoolIcon,
  Microphone,
  RadioIcon,
  UserIcon,
  CoinsDollarIcon,
  BanknoteArrowDownIcon,
  BarChartIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from "@hugeicons/core-free-icons"
import { useAuth } from "@/context/AuthContext"
import { COLORS } from "@/lib/constants"

import { NotificationDropdown } from "@/components/notifications/NotificationDropdown"
import "overlayscrollbars/overlayscrollbars.css"
import { useOverlayScrollbars } from "overlayscrollbars-react"

const ACCENT = COLORS.ACCENT
const ACTIVE_NEON = ACCENT

interface NavItemData {
  icon: IconSvgElement
  label: string
  path: string
  badge?: string
}

interface SidebarProps {
  collapsed: boolean
  onClose?: () => void
  onToggleClick?: () => void
}

function NavItem({
  icon,
  label,
  path,
  badge,
  collapsed,
  onClose,
}: NavItemData & {
  collapsed: boolean
  onClose?: () => void
}) {
  const location = useLocation()
  const isActive = path === "/"
    ? location.pathname === path
    : location.pathname === path || location.pathname.startsWith(`${path}/`)

  return (
    <li>
      <Link
        to={path}
        onClick={onClose}
        title={collapsed ? label : undefined}
        aria-current={isActive ? "page" : undefined}
        className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium select-none"
        style={{
          backgroundColor: isActive ? `color-mix(in srgb, ${ACCENT} 18%, transparent)` : "transparent",
          color: isActive ? ACTIVE_NEON : "rgba(255,255,255,0.55)",
          boxShadow: isActive ? `inset 0 0 0 1px color-mix(in srgb, ${ACCENT} 65%, transparent), 0 0 14px color-mix(in srgb, ${ACCENT} 28%, transparent)` : "none",
          transition: "background-color 180ms ease-out, color 180ms ease-out, box-shadow 180ms ease-out",
        }}
        onMouseEnter={(event) => {
          if (isActive) return
          event.currentTarget.style.backgroundColor = `color-mix(in srgb, ${ACCENT} 12%, transparent)`
          event.currentTarget.style.color = ACCENT
          event.currentTarget.style.boxShadow = `inset 0 0 0 1px color-mix(in srgb, ${ACCENT} 30%, transparent)`
        }}
        onMouseLeave={(event) => {
          if (isActive) return
          event.currentTarget.style.backgroundColor = "transparent"
          event.currentTarget.style.color = "rgba(255,255,255,0.55)"
          event.currentTarget.style.boxShadow = "none"
        }}
      >
        <HugeiconsIcon
          icon={icon}
          size={18}
          className="relative shrink-0 transition-transform duration-200 ease-out group-hover:scale-110"
          style={{ color: isActive ? ACTIVE_NEON : "currentColor", filter: isActive ? `drop-shadow(0 0 5px color-mix(in srgb, ${ACCENT} 75%, transparent))` : undefined }}
        />
        {!collapsed && (
          <>
            <span className="flex-1 truncate relative">{label}</span>
            {badge && (
              <span
                className="relative shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `color-mix(in srgb, ${ACCENT} 20%, transparent)`,
                  color: ACCENT,
                }}
              >
                {badge}
              </span>
            )}
          </>
        )}
      </Link>
    </li>
  )
}

export function Sidebar({ collapsed, onClose, onToggleClick, pendientesCount }: SidebarProps & { pendientesCount?: number }) {
  const { logout, user } = useAuth()
  const location = useLocation()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "Académico": true })
  const navRef = useRef<HTMLDivElement>(null)
  const [initialize, getInstance] = useOverlayScrollbars({
    options: {
      scrollbars: { autoHide: "scroll", autoHideDelay: 600 },
      overflow: { x: "hidden", y: "scroll" },
    },
  })
  const osInstanceRef = useRef<ReturnType<typeof getInstance>>(null)

  useEffect(() => {
    if (navRef.current) {
      initialize({ target: navRef.current })
    }
    osInstanceRef.current = getInstance()
    return () => {
      osInstanceRef.current?.destroy()
      osInstanceRef.current = null
    }
  }, [initialize, getInstance])

  const roles = user?.roles || []
  const isAdmin = roles.includes("Administrador")
  const isInstructor = roles.includes("Instructor")
  const isSecretaria = roles.includes("Secretaria")

  const menuGroups = useMemo(() => {
    const groups: { label: string; items: NavItemData[] }[] = []

    if (!isSecretaria) {
      const dashboardPath = isAdmin ? "/" : isInstructor ? "/instructor" : "/"
      groups.push({
        label: "Principal",
        items: [
          { icon: LayoutDashboard, label: "Inicio", path: dashboardPath },
        ],
      })
    }

    if (isInstructor) {
      groups.push({
        label: "Portal Instructor",
        items: [
          { icon: BookOpenIcon, label: "Mis Cursos", path: "/instructor/cursos" },
          { icon: AiFolderIcon, label: "Mis Talleres", path: "/instructor/talleres" },
          { icon: CalendarIcon, label: "Mi Horario", path: "/instructor/horario" },
        ],
      })
    }

    if (isSecretaria) {
  groups.push(
    {
      label: "Principal",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/secretaria" },
      ],
    },
    {
      label: "Académico",
      items: [
        { icon: UserIcon, label: "Estudiantes", path: "/estudiantes" },
        { icon: AiLearningIcon, label: "Matrículas", path: "/matriculas", badge: pendientesCount != null && pendientesCount > 0 ? String(pendientesCount) : undefined },
        { icon: GraduationCapIcon, label: "Cursos", path: "/cursos" },
        { icon: AiLearningIcon, label: "Cursos personalizados", path: "/cursos-personalizados" },
        { icon: BookOpenIcon, label: "Talleres", path: "/talleres" },
        { icon: CertificateIcon, label: "Certificados", path: "/certificados" },
      ],
    },
    {
      label: "Servicios",
      items: [
        { icon: SchoolIcon, label: "Alquiler de Aulas", path: "/servicios/aulas" },
        { icon: AiFolderIcon, label: "Alquiler de Equipos", path: "/servicios/equipos" },
        { icon: Microphone, label: "Podcast", path: "/servicios/podcast" },
        { icon: VideoIcon, label: "Edición de Video", path: "/servicios/edicion-video" },
        { icon: RadioIcon, label: "Radio", path: "/servicios/radio" },
      ],
    },
    {
      label: "Operaciones",
      items: [
        { icon: CalendarDaysIcon, label: "Agenda", path: "/agenda" },
        { icon: ClipboardCheckIcon, label: "Tareas", path: "/tareas" },
        { icon: UserGroupIcon, label: "Clientes", path: "/clientes" },
      ],
    },
    {
      label: "Finanzas",
      items: [
        { icon: MoneyIcon, label: "Pagos y cobros", path: "/finanzas/pagos" },
        { icon: Invoice02Icon, label: "Movimientos", path: "/finanzas/movimientos" },
      ],
    },
    
  )
}

if (isAdmin) {
  groups.push(
    {
      label: "Académico",
      items: [
        { icon: UserIcon, label: "Estudiantes", path: "/estudiantes" },
        { icon: AiLearningIcon, label: "Matriculas", path: "/matriculas", badge: pendientesCount != null && pendientesCount > 0 ? String(pendientesCount) : undefined },
        { icon: GraduationCapIcon, label: "Cursos", path: "/cursos" },
        { icon: AiLearningIcon, label: "Cursos personalizados", path: "/cursos-personalizados" },
        { icon: BookOpenIcon, label: "Talleres", path: "/talleres" },
        { icon: CertificateIcon, label: "Certificados", path: "/certificados" },
        { icon: AiFolderIcon, label: "Categorías", path: "/catalogos" },
      ],
    },
    {
      label: "Servicios",
      items: [
        { icon: SchoolIcon, label: "Alquiler de Aulas", path: "/servicios/aulas" },
        { icon: AiFolderIcon, label: "Alquiler de Equipos", path: "/servicios/equipos" },
        { icon: Microphone, label: "Reservas de Podcast", path: "/servicios/podcast" },
        { icon: VideoIcon, label: "Edición de Video", path: "/servicios/edicion-video" },
        { icon: RadioIcon, label: "Alquiler de Radio", path: "/servicios/radio" },
      ],
    },
    {
      label: "Operaciones",
      items: [
        { icon: CalendarDaysIcon, label: "Agenda", path: "/agenda" },
        { icon: ClipboardCheckIcon, label: "Tareas", path: "/tareas" },
        { icon: UserGroupIcon, label: "Clientes", path: "/clientes" },
      ],
    },
    {
      label: "Finanzas",
      items: [
        { icon: MoneyIcon, label: "Pagos y cobros", path: "/finanzas/pagos" },
        { icon: Invoice02Icon, label: "Movimientos", path: "/finanzas/movimientos" },
        { icon: CoinsDollarIcon, label: "Ingresos", path: "/finanzas/ingresos" },
        { icon: BanknoteArrowDownIcon, label: "Egresos", path: "/finanzas/egresos" },
        { icon: BarChartIcon, label: "Estadísticas", path: "/finanzas/estadisticas" },
      ],
    },
    {
      label: "Gestión",
      items: [
        { icon: UserCheckIcon, label: "Personal", path: "/personas" },
        { icon: GraduationCapIcon, label: "Instructores", path: "/instructores" },
        { icon: SettingsIcon, label: "Cuentas", path: "/cuentas" },
        { icon: BookmarkIcon, label: "Ciudades", path: "/ciudades" },
      ],
    },
    
  )
}

    return groups
  }, [isAdmin, isInstructor, isSecretaria, pendientesCount])

  useEffect(() => {
    const activeGroupIndex = menuGroups.findIndex((group) =>
      group.items.some((item) => item.path === "/"
        ? location.pathname === item.path
        : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)),
    )
    if (activeGroupIndex >= 0) {
      const activeGroup = menuGroups[activeGroupIndex]
      setExpandedGroups((current) => ({ ...current, [`${activeGroup.label}-${activeGroupIndex}`]: true }))
    }
  }, [location.pathname, menuGroups])

  return (
    <aside
      className="relative flex flex-col h-full select-none"
      style={{
        backgroundColor: COLORS.CHARCOAL,
        width: collapsed ? "72px" : "260px",
        transition: "width 300ms cubic-bezier(0.2, 0, 0, 1)",
      }}
    >
      <div
        className="flex items-center justify-center h-14 border-b shrink-0 relative group"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <img
          src="/Logo.png"
          alt="Comunikate Academy"
          className="h-12 w-auto object-contain"
        />
        {onToggleClick && (
          <button
            onClick={onToggleClick}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center size-[34px] rounded-md select-none"
            style={{ transition: "background-color 180ms ease-out" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
            }}
          >
            <HugeiconsIcon
              icon={collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon}
              size={16}
              className="opacity-30 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200"
              style={{ color: COLORS.ACCENT }}
            />
          </button>
        )}
      </div>

      <div ref={navRef} className="flex-1 px-3 py-5">
        {menuGroups.map((group, index) => {
          const isAcademic = group.label === "Académico"
          const isExpanded = collapsed || Boolean(expandedGroups[`${group.label}-${index}`] ?? isAcademic)
          const isGroupActive = group.items.some((item) => item.path === "/"
            ? location.pathname === item.path
            : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))

          return (
            <div key={`${group.label}-${index}`} className="mb-5 last:mb-0">
              {!collapsed ? (
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-current={isGroupActive ? "location" : undefined}
                  onClick={() => setExpandedGroups((current) => ({ ...current, [`${group.label}-${index}`]: !isExpanded }))}
                  className="w-full flex items-center justify-between px-3 py-1 mb-1 rounded-md text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors"
                  style={{
                    color: isGroupActive ? ACCENT : "rgba(255,255,255,0.45)",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.color = ACCENT
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.color = isGroupActive ? ACCENT : "rgba(255,255,255,0.45)"
                  }}
                >
                  <span>{group.label}</span>
                  <span aria-hidden="true" className="text-sm leading-none transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>⌄</span>
                </button>
              ) : (
                <div
                  className="w-8 h-px mx-auto mb-2.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                />
              )}
              {isExpanded && (
                <ul className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <NavItem
                      key={item.path}
                      {...item}
                      collapsed={collapsed}
                      onClose={onClose}
                    />
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      <div
        className="p-3 border-t shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={logout}
          className="group flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm select-none"
          style={{
            color: "rgba(255,255,255,0.45)",
            transition: "color 180ms ease-out, background-color 180ms ease-out",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.9)"
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.45)"
            e.currentTarget.style.backgroundColor = "transparent"
          }}
        >
          <HugeiconsIcon
            icon={Logout03Icon}
            size={16}
            className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-110"
          />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}

export function TopBar({
  onMenuClick,
  pendientesCount,
  showNotifications,
  onNotificationToggle,
  bellRef,
}: {
  onMenuClick: () => void
  pendientesCount: number
  showNotifications: boolean
  onNotificationToggle: () => void
  bellRef: React.RefObject<HTMLButtonElement | null>
}) {
  const { user } = useAuth()
  const roles = user?.roles || []
  const isAdmin = roles.includes("Administrador")
  const isSecretaria = roles.includes("Secretaria")
  const roleLabel = user?.roles?.[0] || "Usuario"
  const userDisplayName = user?.persona
    ? `${user.persona.nombres || ""} ${user.persona.apellidos || ""}`.trim()
    : user?.username || "Usuario"
  const userInitial = user?.persona?.nombres?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || "U"

  return (
    <header
      className="flex items-center justify-between h-14 px-4 border-b bg-white shrink-0"
      style={{ borderColor: COLORS.BORDER_SUBTLE }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex items-center justify-center size-9 rounded-lg text-[--muted-foreground] lg:hidden select-none"
          style={{ transition: "background-color 150ms ease-out, transform 120ms ease-out" }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <HugeiconsIcon icon={Menu09Icon} size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {(isAdmin || isSecretaria) && (
        <div className="relative">
          <button
            ref={bellRef}
            onClick={onNotificationToggle}
            className="relative flex items-center justify-center size-9 rounded-lg text-[--muted-foreground] select-none"
            style={{ transition: "background-color 150ms ease-out" }}
          >
            <HugeiconsIcon icon={BellIcon} size={18} />
            {pendientesCount > 0 && (
              <span
                className="absolute flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white"
                style={{
                  backgroundColor: COLORS.ACCENT,
                  top: "2px",
                  right: "2px",
                }}
              >
                {pendientesCount > 99 ? "99+" : pendientesCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={showNotifications}
            onClose={onNotificationToggle}
            anchorRef={bellRef}
            pendientesCount={pendientesCount}
          />
        </div>
        )}

          <div className="flex items-center gap-2.5 pl-2 ml-1 border-l" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div
              className="flex items-center justify-center size-8 rounded-full shrink-0 text-xs font-semibold"
              style={{ backgroundColor: ACCENT, color: "white" }}
            >
              {userInitial}
            </div>
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
                {userDisplayName}
              </p>
              <p className="text-[11px] text-[--muted-foreground]">{roleLabel}</p>
            </div>
          </div>
      </div>
    </header>
  )
}
