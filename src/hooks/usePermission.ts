import { useAuth } from "@/context/AuthContext"

export function usePermission() {
  const { user } = useAuth()
  const roles: string[] = user?.roles ?? []

  return {
    isAdmin: roles.includes("Administrador"),
    isSecretaria: roles.includes("Secretaria"),
    isInstructor: roles.includes("Instructor"),
    roles,
  }
}
