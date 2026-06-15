/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios"

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
    "Content-Type": "multipart/form-data",
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
    }
  },

  getToken(): string | null {
    return localStorage.getItem("auth_token")
  },
}

export default api
