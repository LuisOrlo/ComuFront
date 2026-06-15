import { Link, useLocation } from "react-router"
import { useRef, useEffect, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  LayoutDashboard,
  VideoIcon,
  GraduationCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  MoneyIcon,
  CalendarIcon,
  CertificateIcon,
  UserCheckIcon,
  SettingsIcon,
  BellIcon,
  SearchIcon,
  Menu09Icon,
  ArrowLeftIcon,
  ArrowRightIcon,
  AiFolderIcon,
  AiLearningIcon,
  ClockIcon,
  BookmarkIcon,
  Logout03Icon,
  SchoolIcon,
  Microphone,
  UserIcon
} from "@hugeicons/core-free-icons"
import { useAuth } from "@/context/AuthContext"
import { COLORS } from "@/lib/constants"
import "overlayscrollbars/overlayscrollbars.css"
import { useOverlayScrollbars } from "overlayscrollbars-react"

const ACCENT = COLORS.ACCENT

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
  const isActive = location.pathname === path

  return (
    <li>
      <Link
        to={path}
        onClick={onClose}
        title={collapsed ? label : undefined}
        className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium select-none"
        style={{
          backgroundColor: isActive ? `color-mix(in srgb, ${ACCENT} 18%, transparent)` : "transparent",
          color: isActive ? ACCENT : "rgba(255,255,255,0.55)",
          transition: "background-color 180ms ease-out, color 180ms ease-out",
        }}
      >
        <span
          className="absolute inset-0 rounded-lg"
          style={{
            backgroundColor: isActive ? "transparent" : "rgba(255,255,255,0)",
            transition: "background-color 180ms ease-out",
          }}
        />
        <span className="absolute inset-0 rounded-lg group-hover:bg-white/[0.06] transition-colors duration-150" />
        <HugeiconsIcon
          icon={icon}
          size={18}
          className="relative shrink-0 transition-transform duration-200 ease-out group-hover:scale-110"
          style={{ color: isActive ? ACCENT : "currentColor" }}
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

export function Sidebar({ collapsed, onClose }: SidebarProps) {
  const { logout, user } = useAuth()
  const navRef = useRef<HTMLDivElement>(null)
  const [initialize] = useOverlayScrollbars({
    options: {
      scrollbars: { autoHide: "scroll", autoHideDelay: 600 },
      overflow: { x: "hidden", y: "scroll" },
    },
  })

  useEffect(() => {
    if (navRef.current) {
      initialize({ target: navRef.current })
    }
  }, [initialize])

  const roles = user?.roles || []
  const isAdmin = roles.includes("Administrador")
  const isInstructor = roles.includes("Instructor")
  const isSecretaria = roles.includes("Secretaria")

  const menuGroups = useMemo(() => {
    const groups: { label: string; items: NavItemData[] }[] = [
      {
        label: "Principal",
        items: [
          { icon: LayoutDashboard, label: "Dashboard", path: "/" },
        ],
      },
    ]

    if (isInstructor) {
      groups.push({
        label: "Portal Instructor",
        items: [
          { icon: BookOpenIcon, label: "Mis Cursos", path: "/instructor/cursos" },
          { icon: UserGroupIcon, label: "Mis Estudiantes", path: "/instructor/estudiantes" },
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
            { icon: UserIcon, label: "Estudiantes", path: "/secretaria/estudiantes" },
            { icon: GraduationCapIcon, label: "Cursos", path: "/secretaria/cursos" },
            { icon: BookOpenIcon, label: "Talleres", path: "/secretaria/talleres" },
            { icon: CertificateIcon, label: "Certificados", path: "/secretaria/certificados" },
          ],
        },
        {
          label: "Cobranzas",
          items: [
            { icon: MoneyIcon, label: "Pagos y abonos", path: "/secretaria/pagos" },
          ],
        },
        {
          label: "Servicios",
          items: [
            { icon: Microphone, label: "Podcast", path: "/secretaria/podcast" },
            { icon: VideoIcon, label: "Edición de Video", path: "/secretaria/edicion-video" },
            { icon: AiFolderIcon, label: "Alquiler de Equipos", path: "/secretaria/alquileres" },
          ],
        },
        {
          label: "Operaciones",
          items: [
            { icon: CalendarIcon, label: "Asistencia", path: "/secretaria/asistencia" },
            { icon: UserCheckIcon, label: "Solicitudes", path: "/secretaria/solicitudes" },
          ],
        },
      )
    }

    if (isAdmin) {
      groups.push(
        {
          label: "Académico",
          items: [
            { icon: GraduationCapIcon, label: "Cursos", path: "/cursos" },
            { icon: AiFolderIcon, label: "Catálogos", path: "/catalogos" },
            { icon: BookOpenIcon, label: "Talleres", path: "/talleres" },
            { icon: UserIcon, label: "Estudiantes", path: "/estudiantes" },
            { icon: AiLearningIcon, label: "Matriculas", path: "/matriculas", badge: "12" },
            { icon: CertificateIcon, label: "Certificados", path: "/certificados" },
          ],
        },
        {
          label: "Gestión",
          items: [
            { icon: UserCheckIcon, label: "Personal", path: "/personas" },
            { icon: CalendarIcon, label: "Asistencia", path: "/asistencia" },
            { icon: SettingsIcon, label: "Cuentas", path: "/cuentas" },
            { icon: BookmarkIcon, label: "Ciudades", path: "/ciudades" },
          ],
        },
        {
          label: "Finanzas",
          items: [
            { icon: MoneyIcon, label: "Pagos y cobros", path: "/finanzas/pagos", badge: "3" },
            
          ],
        },
        {
          label: "Operaciones",
          items: [
            { icon: CalendarIcon, label: "Agenda", path: "/agenda" },
            { icon: ClockIcon, label: "Horarios", path: "/horarios" },
            { icon: BookmarkIcon, label: "Asesorías", path: "/asesorias" },
          ],
        },
        {
          label: "Servicios",
          items: [
            { icon: SchoolIcon, label: "Alquiler de Aulas", path: "/servicios/aulas" },
            { icon: AiFolderIcon, label: "Alquiler de Equipos", path: "/servicios/equipos" },
            { icon: Microphone, label: "Reservas de Podcast", path: "/servicios/podcast" },
            { icon: VideoIcon, label: "Edición de Video", path: "/servicios/edicion-video" },
          ],
        },
        {
          label: "Sistema",
          items: [
            { icon: SettingsIcon, label: "Configuración", path: "/configuracion" },
          ],
        }
      )
    }

    return groups
  }, [isAdmin, isInstructor, isSecretaria])

  return (
    <aside
      className="relative flex flex-col h-full select-none"
      style={{
        backgroundColor: COLORS.CHARCOAL,
        width: collapsed ? "72px" : "260px",
        transition: "width 280ms cubic-bezier(0.77, 0, 0.175, 1)",
      }}
    >
      <div
        className="flex items-center justify-center h-14 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <img
          src="/Logo.png"
          alt="Comunikate Academy"
          className="h-12 w-auto object-contain"
        />
      </div>

      <div ref={navRef} className="flex-1 px-3 py-5">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            {!collapsed ? (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">
                {group.label}
              </p>
            ) : (
              <div
                className="w-8 h-px mx-auto mb-2.5"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              />
            )}
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
          </div>
        ))}
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
  onToggleClick,
  collapsed,
}: {
  onMenuClick: () => void
  onToggleClick: () => void
  collapsed: boolean
}) {
  const { user } = useAuth()
  const roleLabel = user?.roles?.[0] || "Usuario"

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

        <button
          onClick={onToggleClick}
          className="hidden lg:flex items-center justify-center size-8 rounded-lg select-none"
          style={{
            backgroundColor: COLORS.CHARCOAL,
            color: "rgba(255,255,255,0.6)",
            transition: "background-color 180ms ease-out, color 180ms ease-out, transform 120ms ease-out",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = ACCENT
            e.currentTarget.style.color = "white"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.CHARCOAL
            e.currentTarget.style.color = "rgba(255,255,255,0.6)"
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.93)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <HugeiconsIcon
            icon={collapsed ? ArrowRightIcon : ArrowLeftIcon}
            size={16}
            className="transition-transform duration-200 ease-out"
          />
        </button>
      </div>

      <div className="flex-1 max-w-sm mx-4 hidden md:block">
        <div className="relative">
          <HugeiconsIcon
            icon={SearchIcon}
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[--muted-foreground]"
          />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border bg-transparent outline-none"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              transition: "border-color 180ms ease-out, box-shadow 180ms ease-out",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = ACCENT
              e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}20`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
              e.currentTarget.style.boxShadow = "none"
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center justify-center size-9 rounded-lg text-[--muted-foreground] md:hidden select-none"
          style={{ transition: "background-color 150ms ease-out" }}
        >
          <HugeiconsIcon icon={SearchIcon} size={18} />
        </button>

        <button
          className="relative flex items-center justify-center size-9 rounded-lg text-[--muted-foreground] select-none"
          style={{ transition: "background-color 150ms ease-out" }}
        >
          <HugeiconsIcon icon={BellIcon} size={18} />
          <span
            className="absolute size-2 rounded-full"
            style={{
              backgroundColor: ACCENT,
              top: "6px",
              right: "6px",
            }}
          />
        </button>

        <div className="flex items-center gap-2.5 pl-2 ml-1 border-l" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div
            className="flex items-center justify-center size-8 rounded-full shrink-0 text-xs font-semibold"
            style={{ backgroundColor: ACCENT, color: "white" }}
          >
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
              {user?.username || "Usuario"}
            </p>
            <p className="text-[11px] text-[--muted-foreground]">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
