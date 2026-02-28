/**
 * AI Classification Engine for ITSM Tickets
 * Classifies tickets by type and priority based on description keywords
 */

const classificationRules = {
  keywords: {
    incident: [
      'error', 'caído', 'caida', 'no funciona', 'problema', 'falla', 'crash',
      'down', 'bloqueado', 'roto', 'inaccesible', 'lento', 'colgado',
      'no responde', 'pantalla azul', 'virus', 'malware', 'hackeado',
      'no carga', 'interrumpido', 'desconectado', 'no disponible'
    ],
    request: [
      'necesito', 'solicito', 'requiero', 'acceso', 'permiso', 'nuevo',
      'instalación', 'instalar', 'crear', 'configurar', 'actualizar',
      'cambiar contraseña', 'alta de usuario', 'licencia', 'software',
      'equipo nuevo', 'cuenta', 'habilitar', 'desbloquear'
    ],
    problem: [
      'recurrente', 'repetido', 'siempre', 'constante', 'patrón',
      'múltiples veces', 'otra vez', 'frecuente', 'intermitente',
      'periódicamente', 'cada vez', 'todos los días', 'semanal',
      'persistente', 'crónico'
    ],
  },
  urgency: {
    critical: [
      'producción', 'crítico', 'urgente', 'inmediato', 'todos',
      'sistema completo', 'empresa', 'masivo', 'generalizado',
      'pérdida de datos', 'seguridad', 'brecha', 'total'
    ],
    high: [
      'importante', 'prioridad', 'múltiples usuarios', 'departamento',
      'equipo', 'afecta a varios', 'proyecto', 'deadline', 'fecha límite'
    ],
    medium: [
      'normal', 'cuando sea posible', 'algunos usuarios', 'grupo',
      'moderado', 'parcial'
    ],
    low: [
      'bajo', 'menor', 'cosmético', 'sugerencia', 'mejora', 'opcional',
      'no urgente', 'cuando puedas', 'sin prisa'
    ],
  },
}

/**
 * Classify a ticket based on its description
 * @param {string} description - The ticket description
 * @returns {{ type: string, priority: string }}
 */
export function classifyTicket(description) {
  const desc = description.toLowerCase()

  // Type classification
  const typeScore = { incident: 0, request: 0, problem: 0 }

  for (const [type, keywords] of Object.entries(classificationRules.keywords)) {
    keywords.forEach((keyword) => {
      if (desc.includes(keyword)) typeScore[type]++
    })
  }

  const maxType = Object.keys(typeScore).reduce((a, b) =>
    typeScore[a] > typeScore[b] ? a : b
  )
  const type = typeScore[maxType] > 0 ? maxType : 'incident'

  // Priority classification
  let priority = 'medium'
  for (const [p, keywords] of Object.entries(classificationRules.urgency)) {
    if (keywords.some((keyword) => desc.includes(keyword))) {
      priority = p
      break
    }
  }

  return { type, priority }
}

/**
 * Generate an AI response based on ticket classification
 * @param {string} type - Ticket type
 * @param {string} priority - Ticket priority
 * @returns {string}
 */
export function generateAIResponse(type, priority) {
  const responses = {
    incident: {
      critical:
        '🔴 Incidente crítico detectado. Escalado automáticamente a nivel 3. Se ha notificado al equipo de infraestructura. ETA estimada de resolución: 2 horas.',
      high: '🟠 Incidente de alta prioridad registrado. Asignado a equipo especializado para atención inmediata. ETA: 4 horas.',
      medium:
        '🟡 Incidente registrado correctamente. Se asignará al personal disponible según turno actual. ETA: 8 horas laborables.',
      low: '🟢 Incidente de baja prioridad catalogado. Se atenderá en el próximo ciclo de soporte disponible.',
    },
    request: {
      critical:
        '🔴 Solicitud urgente recibida. Se ha iniciado proceso de aprobación expedita con escalamiento automático.',
      high: '🟠 Solicitud de alta prioridad en proceso. Pendiente de aprobación del supervisor directo. ETA: 24 horas.',
      medium:
        '🟡 Solicitud registrada correctamente. En proceso de evaluación y aprobación. ETA: 2-3 días laborables.',
      low: '🟢 Requerimiento registrado. Se procesará en cola estándar de solicitudes. ETA: 5 días laborables.',
    },
    problem: {
      critical:
        '🔴 Problema recurrente crítico identificado. Se ha iniciado análisis de causa raíz (RCA) con prioridad máxima.',
      high: '🟠 Patrón de problema detectado. Análisis preventivo iniciado por equipo senior. Monitoreo activo habilitado.',
      medium:
        '🟡 Problema catalogado para monitoreo activo. Se realizará análisis de tendencia en próximo ciclo de revisión.',
      low: '🟢 Problema registrado para análisis de tendencias. Se incluirá en el próximo reporte mensual de problemas.',
    },
  }

  return responses[type]?.[priority] || '🟡 Ticket registrado. En proceso de análisis.'
}

/**
 * Get the type label in Spanish
 * @param {string} type
 * @returns {string}
 */
export function getTypeLabel(type) {
  const labels = {
    incident: 'Incidente',
    request: 'Solicitud',
    problem: 'Problema',
  }
  return labels[type] || type
}

/**
 * Get the priority label in Spanish
 * @param {string} priority
 * @returns {string}
 */
export function getPriorityLabel(priority) {
  const labels = {
    critical: 'Crítica',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  }
  return labels[priority] || priority
}

/**
 * Get the status label in Spanish
 * @param {string} status
 * @returns {string}
 */
export function getStatusLabel(status) {
  const labels = {
    open: 'Abierto',
    'in-progress': 'En Proceso',
    resolved: 'Resuelto',
    closed: 'Cerrado',
  }
  return labels[status] || status
}
