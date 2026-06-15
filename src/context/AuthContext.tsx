/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { authService, type LoginResponse } from "@/services/auth.service"

interface AuthContextType {
  user: LoginResponse["datos"]["usuario"] | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<LoginResponse["datos"]["usuario"] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const recoverSession = async () => {
      const token = authService.getToken()
      if (token) {
        try {
          const response = await authService.getProfile()
          setUser(response.datos)
        } catch {
          authService.logout()
          setUser(null)
        }
      }
      setIsLoading(false)
    }
    recoverSession()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login(username, password)
      setUser(response.datos.usuario)
      toast.success("¡Bienvenido!", {
        description: `Has iniciado sesión como ${response.datos.usuario.username}`,
      })
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error("Error de autenticación", {
          description: err.message,
        })
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as { response?: { data?: { mensaje?: string } } }
        toast.error("Error de autenticación", {
          description: axiosError.response?.data?.mensaje || "Credenciales incorrectas",
        })
      } else {
        toast.error("Error de conexión", {
          description: "No se pudo conectar con el servidor",
        })
      }
      throw err
    }
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    toast.info("Sesión cerrada", {
      description: "Has cerrado sesión correctamente",
    })
    navigate("/login")
  }

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium animate-pulse">Iniciando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
