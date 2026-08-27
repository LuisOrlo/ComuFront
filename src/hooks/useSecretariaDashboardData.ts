import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { secretariaService, type DashboardDataCompleto } from "@/services/secretaria.service"
import { toast } from "sonner"

export function useSecretariaDashboardData() {
  const { data, isLoading, isError } = useQuery<DashboardDataCompleto>({
    queryKey: ["secretaria", "dashboard"],
    queryFn: secretariaService.getDashboardCompleto,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (isError) toast.error("Error al cargar datos del dashboard")
  }, [isError])

  return { data: data ?? null, loading: isLoading }
}
