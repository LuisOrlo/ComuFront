export interface Metricas {
  balance: number
  ingresos: number
  egresos: number
  margen_neto: number
  vs_anio_anterior: number | null | string
  estudiantes_matriculados: number
  tasa_retencion: number
  tasa_abandono: number
}

export interface MesFinanciero {
  mes: string
  ingresos: number
  egresos: number
}

export interface DistribucionCategoria {
  name: string
  value: number
  porcentaje: number
}

export interface MetodoPagoItem {
  name: string
  value: number
}

export interface DiaSemanaItem {
  dia: string
  value: number
}

export interface CatalogosTopItem {
  id: string
  nombre: string
  ofertas: number
  estudiantes: number
  ocupacion_pct: number
  aprobacion_pct: number
  ingreso: number
}

export interface CiudadesTopItem {
  id: string
  nombre: string
  ingresos: number
  estudiantes: number
}

export interface ModalidadComparativa {
  presencial: {
    ingresos: number
    egresos: number
    estudiantes: number
    cursos: number
  }
  virtual: {
    ingresos: number
    egresos: number
    estudiantes: number
    cursos: number
  }
}

export interface CobranzaCatalogo {
  nombre: string
  al_dia: number
  deben: number
}

export interface Cobranza {
  total_estudiantes: number
  deben_al_menos_un_pago: number
  deben_todos_los_pagos: number
  distribucion_por_catalogo: CobranzaCatalogo[]
}

export interface ActividadServiciosItem {
  tipo: string
  ingresos: number
  cantidad: number
}

export interface TopEstudiante {
  id: string
  nombre: string
  total: number
}

export interface EstadisticasResponse {
  periodo: { desde: string; hasta: string }
  metricas: Metricas
  ingresos_vs_egresos: MesFinanciero[]
  distribucion_categorias: DistribucionCategoria[]
  metodo_pago: MetodoPagoItem[]
  dias_semana: DiaSemanaItem[]
  catalogos_top: CatalogosTopItem[]
  ciudades_top: CiudadesTopItem[]
  modalidad: ModalidadComparativa
  cobranza: Cobranza
  actividad_servicios: ActividadServiciosItem[]
  top_estudiantes: TopEstudiante[]
  insight_text: string
}

export interface CatalogoDetalleResponse {
  catalogo: CatalogosTopItem
  periodo: { desde: string; hasta: string }
  evolucion_mensual: MesFinanciero[]
  ofertas: {
    id: string
    nombre_instancia: string
    semestre: string
    estudiantes: number
    ocupacion_pct: number
    aprobacion_pct: number
    ingreso: number
  }[]
  retencion: number
}

export interface EstudianteDetalleResponse {
  estudiante: {
    id: string
    nombre: string
    cedula: string
  }
  periodo: { desde: string; hasta: string }
  resumen: {
    total_ingresos: number
    total_cursos: number
    promedio_por_curso: number
  }
  historial_cursos: {
    id: string
    curso: string
    fecha_inscripcion: string
    estado: string
    monto_pagado: number
    monto_total: number
  }[]
  historial_pagos: {
    fecha: string
    monto: number
    metodo: string
    referencia: string
  }[]
}
