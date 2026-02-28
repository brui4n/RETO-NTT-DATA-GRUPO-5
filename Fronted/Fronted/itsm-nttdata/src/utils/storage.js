/**
 * Storage module for ITSM tickets and users
 * Uses localStorage for persistence
 */

const TICKETS_KEY = 'itsm_tickets'
const USERS_KEY = 'itsm_users'
const COUNTER_KEY = 'itsm_ticket_counter'

// ==================== TICKETS ====================

export function getTickets() {
  try {
    const data = localStorage.getItem(TICKETS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveTickets(tickets) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets))
}

export function addTicket(ticket) {
  const tickets = getTickets()
  tickets.unshift(ticket)
  saveTickets(tickets)
  return tickets
}

export function updateTicket(ticketId, updates) {
  const tickets = getTickets()
  const index = tickets.findIndex((t) => t.id === ticketId)
  if (index !== -1) {
    tickets[index] = { ...tickets[index], ...updates, updatedAt: new Date().toISOString() }
    saveTickets(tickets)
  }
  return tickets
}

export function getTicketById(ticketId) {
  const tickets = getTickets()
  return tickets.find((t) => t.id === ticketId) || null
}

// ==================== TICKET COUNTER ====================

export function getNextTicketId() {
  const current = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10)
  const next = current + 1
  localStorage.setItem(COUNTER_KEY, String(next))
  return `INC-${String(next).padStart(6, '0')}`
}

export function getCurrentCounter() {
  return parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10)
}

// ==================== USERS (staff) ====================

export function getStaffUsers() {
  try {
    const data = localStorage.getItem(USERS_KEY)
    return data ? JSON.parse(data) : getDefaultStaff()
  } catch {
    return getDefaultStaff()
  }
}

export function saveStaffUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function getDefaultStaff() {
  const staff = [
    {
      id: 1,
      name: 'Admin Sistema',
      email: 'admin@nttdata.com',
      puesto: 'Administrador de Sistemas',
      area: 'Tecnología',
      role: 'admin',
    },
    {
      id: 2,
      name: 'Juan Pérez',
      email: 'juan@nttdata.com',
      puesto: 'Soporte TI',
      area: 'Soporte',
      role: 'staff',
    },
    {
      id: 5,
      name: 'Ana Martínez',
      email: 'ana@nttdata.com',
      puesto: 'Líder de Proyecto',
      area: 'Operaciones',
      role: 'staff',
    },
  ]
  saveStaffUsers(staff)
  return staff
}

// ==================== SEED DATA ====================

export function seedSampleData() {
  const tickets = getTickets()
  if (tickets.length > 0) return // Don't overwrite existing data

  const sampleTickets = [
    {
      id: 'INC-000001',
      user: {
        name: 'María González',
        email: 'maria@nttdata.com',
        puesto: 'Analista Senior',
        area: 'Finanzas',
      },
      title: 'Sistema de correo caído en producción',
      description:
        'El sistema de correo electrónico está completamente caído afectando a todos los usuarios de la empresa desde las 9:00 AM. Urgente necesitamos solución inmediata.',
      type: 'incident',
      priority: 'critical',
      status: 'in-progress',
      assignedTo: {
        name: 'Juan Pérez',
        email: 'juan@nttdata.com',
        puesto: 'Soporte TI',
      },
      aiResponse:
        '🔴 Incidente crítico detectado. Escalado automáticamente a nivel 3. Se ha notificado al equipo de infraestructura. ETA estimada de resolución: 2 horas.',
      createdAt: '2026-02-28T09:15:00.000Z',
      updatedAt: '2026-02-28T09:30:00.000Z',
      history: [
        { action: 'Ticket creado', timestamp: '2026-02-28T09:15:00.000Z', user: 'María González' },
        { action: 'Clasificado como INCIDENT - CRITICAL por IA', timestamp: '2026-02-28T09:15:01.000Z', user: 'Sistema IA' },
        { action: 'Asignado a Juan Pérez', timestamp: '2026-02-28T09:20:00.000Z', user: 'Admin Sistema' },
        { action: 'Estado cambiado a EN PROCESO', timestamp: '2026-02-28T09:20:00.000Z', user: 'Sistema' },
      ],
    },
    {
      id: 'INC-000002',
      user: {
        name: 'Carlos Rodríguez',
        email: 'carlos@nttdata.com',
        puesto: 'Desarrollador',
        area: 'Tecnología',
      },
      title: 'Solicitud de acceso a base de datos',
      description:
        'Necesito acceso de lectura a la base de datos de producción para generar reportes mensuales del departamento.',
      type: 'request',
      priority: 'medium',
      status: 'open',
      assignedTo: null,
      aiResponse:
        '🟡 Solicitud registrada correctamente. En proceso de evaluación y aprobación. ETA: 2-3 días laborables.',
      createdAt: '2026-02-28T10:00:00.000Z',
      updatedAt: '2026-02-28T10:00:00.000Z',
      history: [
        { action: 'Ticket creado', timestamp: '2026-02-28T10:00:00.000Z', user: 'Carlos Rodríguez' },
        { action: 'Clasificado como REQUEST - MEDIUM por IA', timestamp: '2026-02-28T10:00:01.000Z', user: 'Sistema IA' },
      ],
    },
    {
      id: 'INC-000003',
      user: {
        name: 'Luis Torres',
        email: 'luis@nttdata.com',
        puesto: 'Analista Junior',
        area: 'Marketing',
      },
      title: 'Error en aplicación web del portal',
      description:
        'La aplicación web del portal de clientes muestra error 500 al intentar hacer login. Varios usuarios reportan el mismo problema. Es importante resolverlo.',
      type: 'incident',
      priority: 'high',
      status: 'in-progress',
      assignedTo: {
        name: 'Ana Martínez',
        email: 'ana@nttdata.com',
        puesto: 'Líder de Proyecto',
      },
      aiResponse:
        '🟠 Incidente de alta prioridad registrado. Asignado a equipo especializado para atención inmediata. ETA: 4 horas.',
      createdAt: '2026-02-28T10:30:00.000Z',
      updatedAt: '2026-02-28T11:00:00.000Z',
      history: [
        { action: 'Ticket creado', timestamp: '2026-02-28T10:30:00.000Z', user: 'Luis Torres' },
        { action: 'Clasificado como INCIDENT - HIGH por IA', timestamp: '2026-02-28T10:30:01.000Z', user: 'Sistema IA' },
        { action: 'Asignado a Ana Martínez', timestamp: '2026-02-28T11:00:00.000Z', user: 'Admin Sistema' },
        { action: 'Estado cambiado a EN PROCESO', timestamp: '2026-02-28T11:00:00.000Z', user: 'Sistema' },
      ],
    },
    {
      id: 'INC-000004',
      user: {
        name: 'María González',
        email: 'maria@nttdata.com',
        puesto: 'Analista Senior',
        area: 'Finanzas',
      },
      title: 'Instalación de software Adobe',
      description:
        'Requiero instalación de Adobe Creative Suite en mi equipo para trabajos de diseño. No es urgente.',
      type: 'request',
      priority: 'low',
      status: 'open',
      assignedTo: null,
      aiResponse: '🟢 Requerimiento registrado. Se procesará en cola estándar de solicitudes. ETA: 5 días laborables.',
      createdAt: '2026-02-28T11:30:00.000Z',
      updatedAt: '2026-02-28T11:30:00.000Z',
      history: [
        { action: 'Ticket creado', timestamp: '2026-02-28T11:30:00.000Z', user: 'María González' },
        { action: 'Clasificado como REQUEST - LOW por IA', timestamp: '2026-02-28T11:30:01.000Z', user: 'Sistema IA' },
      ],
    },
    {
      id: 'INC-000005',
      user: {
        name: 'Sofia Vargas',
        email: 'sofia@nttdata.com',
        puesto: 'Gerente',
        area: 'Recursos Humanos',
      },
      title: 'Problema recurrente con VPN',
      description:
        'La conexión VPN se desconecta constantemente cada 15 minutos. Este es un problema que se repite todos los días desde hace una semana.',
      type: 'problem',
      priority: 'medium',
      status: 'resolved',
      assignedTo: {
        name: 'Juan Pérez',
        email: 'juan@nttdata.com',
        puesto: 'Soporte TI',
      },
      aiResponse:
        '🟡 Problema catalogado para monitoreo activo. Se realizará análisis de tendencia en próximo ciclo de revisión.',
      createdAt: '2026-02-27T14:00:00.000Z',
      updatedAt: '2026-02-28T08:00:00.000Z',
      history: [
        { action: 'Ticket creado', timestamp: '2026-02-27T14:00:00.000Z', user: 'Sofia Vargas' },
        { action: 'Clasificado como PROBLEM - MEDIUM por IA', timestamp: '2026-02-27T14:00:01.000Z', user: 'Sistema IA' },
        { action: 'Asignado a Juan Pérez', timestamp: '2026-02-27T15:00:00.000Z', user: 'Admin Sistema' },
        { action: 'Estado cambiado a EN PROCESO', timestamp: '2026-02-27T15:00:00.000Z', user: 'Sistema' },
        { action: 'Marcado como resuelto', timestamp: '2026-02-28T08:00:00.000Z', user: 'Juan Pérez' },
      ],
    },
  ]

  saveTickets(sampleTickets)
  localStorage.setItem(COUNTER_KEY, '5')
}
