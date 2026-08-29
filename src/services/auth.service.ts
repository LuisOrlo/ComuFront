/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios"
import { toast } from "sonner"

const commonHeaders = {
  Accept: "application/json",
  "ngrok-skip-browser-warning": "69420",
}

/*
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const apiMultipart = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: "application/json",
  },
})

apiMultipart.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

*/

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    ...commonHeaders,
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const apiMultipart = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    ...commonHeaders,
  },
})

apiMultipart.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let sessionExpiredHandled = false

function handleUnauthorized(): void {
  const token = localStorage.getItem("auth_token")
  if (!token || sessionExpiredHandled) return

  sessionExpiredHandled = true
  localStorage.removeItem("auth_token")
  localStorage.removeItem("user_persona_id")

  toast.error("Sesión expirada", {
    description: "Tu sesión ha expirado o no es válida. Inicia sesión nuevamente.",
  })
  window.location.href = "/login"
}

const unauthorizedInterceptor = (error: unknown) => {
  const axiosError = error as { response?: { status?: number }; config?: { url?: string } }
  const status = axiosError.response?.status
  const url = axiosError.config?.url || ""
  const isPublicRegistration = window.location.pathname === "/matricula/nueva"

  if (
    status === 401 &&
    !url.includes("/auth/iniciar-sesion") &&
    !url.includes("/auth/cerrar-sesion") &&
    !isPublicRegistration
  ) {
    handleUnauthorized()
  }
  return Promise.reject(error)
}

api.interceptors.response.use((response) => response, unauthorizedInterceptor)
apiMultipart.interceptors.response.use((response) => response, unauthorizedInterceptor)

export interface LoginResponse {
  mensaje: string
  datos: {
    token: string
    usuario: {
      id: string
      username: string
      email?: string
      persona: Record<string, any> | null
      roles: string[]
    }
  }
}

interface LoginErrorResponse {
  success: false
  mensaje: string
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse | LoginErrorResponse>(
      "/auth/iniciar-sesion",
      { username, password }
    )
    const data = response.data
    if (!("datos" in data) || !data.datos) {
      throw new Error(data.mensaje || "Credenciales incorrectas")
    }
    localStorage.setItem("auth_token", data.datos.token)
    localStorage.setItem("user_persona_id", data.datos.usuario.persona?.id ?? "")
    return data as LoginResponse
  },

  async getProfile() {
    const response = await api.get("/perfil")
    return response.data
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/cerrar-sesion")
    } finally {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_persona_id")
    }
  },

  getToken(): string | null {
    return localStorage.getItem("auth_token")
  },
}

export default api
