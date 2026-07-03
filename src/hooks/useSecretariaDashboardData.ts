import { useState, useEffect } from "react"
import { secretariaService, type DashboardDataCompleto } from "@/services/secretaria.service"
import { toast } from "sonner"

export function useSecretariaDashboardData() {
  const [data, setData] = useState<DashboardDataCompleto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await secretariaService.getDashboardCompleto()
        if (!cancelled) setData(result)
      } catch {
        if (!cancelled) toast.error("Error al cargar datos del dashboard")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
