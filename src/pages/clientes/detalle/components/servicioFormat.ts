export function formatReservaTitle(key: string, item: Record<string, unknown>): string {
  if (key === "radio") {
    const tarifa = item.tarifa as Record<string, unknown> | undefined
    return tarifa?.nombre ? String(tarifa.nombre) : "Reserva de Radio"
  }
  if (key === "aulas") {
    const aula = item.aula as Record<string, unknown> | undefined
    return aula?.nombre ? String(aula.nombre) : "Reserva de Aula"
  }
  if (key === "podcast") {
    const paquete = item.paquete as Record<string, unknown> | undefined
    return paquete?.nombre ? String(paquete.nombre) : "Reserva de Podcast"
  }
  if (key === "equipos") {
    const equipo = item.equipo as Record<string, unknown> | undefined
    return equipo?.nombre ? String(equipo.nombre) : "Alquiler de Equipo"
  }
  if (key === "edicion") {
    return String(item.titulo || "Trabajo de Edición")
  }
  return "Reserva"
}

export function formatReservaDate(key: string, item: Record<string, unknown>): string {
  if (key === "radio" || key === "aulas" || key === "podcast") {
    const fecha = item.fecha_reserva ? String(item.fecha_reserva) : ""
    const hora = item.hora_inicio ? String(item.hora_inicio).substring(0, 5) : ""
    const horaFin = item.hora_fin ? String(item.hora_fin).substring(0, 5) : ""
    return [fecha, hora && horaFin ? `${hora} - ${horaFin}` : hora].filter(Boolean).join(" · ")
  }
  if (key === "equipos") {
    const entrega = item.fecha_entrega ? new Date(String(item.fecha_entrega)).toLocaleDateString("es-ES") : ""
    const devolucion = item.fecha_devolucion_esperada ? new Date(String(item.fecha_devolucion_esperada)).toLocaleDateString("es-ES") : ""
    return [entrega, devolucion ? `Dev: ${devolucion}` : ""].filter(Boolean).join(" · ")
  }
  if (key === "edicion") {
    const recibo = item.fecha_recibo ? new Date(String(item.fecha_recibo)).toLocaleDateString("es-ES") : ""
    const limite = item.fecha_limite ? new Date(String(item.fecha_limite)).toLocaleDateString("es-ES") : ""
    return [recibo, limite ? `Límite: ${limite}` : ""].filter(Boolean).join(" · ")
  }
  return ""
}