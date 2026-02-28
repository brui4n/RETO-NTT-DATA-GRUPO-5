import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  Ticket, CircleDot, Loader2, CheckCircle2, AlertTriangle,
  Inbox
} from 'lucide-react'
import StatCard from '../../components/StatCard/StatCard'
import TicketCard from '../../components/TicketCard/TicketCard'
import TicketFilters from '../../components/TicketFilters/TicketFilters'
import TicketDetail from '../../components/TicketDetail/TicketDetail'
import AssignForm from '../../components/AssignForm/AssignForm'
import Modal from '../../components/Modal/Modal'
import { getTickets, updateTicket } from '../../utils/storage'
import styles from './AdminPage.module.css'

export default function AdminPage() {
  const [tickets, setTickets] = useState([])
  const [filters, setFilters] = useState({ priority: '', type: '', status: '', search: '' })
  const [detailModal, setDetailModal] = useState({ open: false, ticket: null })
  const [assignModal, setAssignModal] = useState({ open: false, ticketId: null })

  useEffect(() => {
    getTickets().then(setTickets)
  }, [])

  // Stats
  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in-progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    critical: tickets.filter((t) => t.priority === 'critical' && t.status !== 'closed' && t.status !== 'resolved').length,
  }), [tickets])

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    let result = [...tickets]

    if (filters.priority) result = result.filter((t) => t.priority === filters.priority)
    if (filters.type) result = result.filter((t) => t.type === filters.type)
    if (filters.status) result = result.filter((t) => t.status === filters.status)
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.user && t.user.name && t.user.name.toLowerCase().includes(q))
      )
    }

    return result
  }, [tickets, filters])

  // Handlers
  const handleView = async (ticketId) => {
    const ticket = tickets.find((t) => t.id === ticketId)
    if (ticket) setDetailModal({ open: true, ticket })
  }

  const handleAssignOpen = (ticketId) => {
    setAssignModal({ open: true, ticketId })
  }

  const handleAssign = async (ticketId, assignedTo) => {
    try {
      await updateTicket(ticketId, { assignedTo: assignedTo }) // Asignación
      const updated = await getTickets()
      setTickets(updated)
      setAssignModal({ open: false, ticketId: null })
      toast.success(`Ticket ${ticketId} asignado a ${assignedTo.name}`)
    } catch(e) {
      toast.error('Error asignando ticket al personal')
    }
  }

  const handleResolve = async (ticketId) => {
    try {
      await updateTicket(ticketId, { status: 'resolved' })
      const updated = await getTickets()
      setTickets(updated)
      toast.success(`Ticket ${ticketId} marcado como resuelto`)
    } catch(e) {
      toast.error('Error marcando ticket como resuelto')
    }
  }

  const handleClearFilters = () => {
    setFilters({ priority: '', type: '', status: '', search: '' })
  }

  return (
    <div className={styles.container}>
      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard
          icon={<Ticket size={26} />}
          number={stats.total}
          label="Total Tickets"
          color="blue"
        />
        <StatCard
          icon={<CircleDot size={26} />}
          number={stats.open}
          label="Abiertos"
          color="amber"
        />
        <StatCard
          icon={<Loader2 size={26} />}
          number={stats.inProgress}
          label="En Proceso"
          color="sky"
        />
        <StatCard
          icon={<CheckCircle2 size={26} />}
          number={stats.resolved}
          label="Resueltos"
          color="green"
        />
        {stats.critical > 0 && (
          <StatCard
            icon={<AlertTriangle size={26} />}
            number={stats.critical}
            label="Críticos Activos"
            color="red"
          />
        )}
      </div>

      {/* Filters */}
      <TicketFilters
        filters={filters}
        onChange={setFilters}
        onClear={handleClearFilters}
      />

      {/* Tickets list */}
      <div className={styles.listSection}>
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>Gestión de Tickets</h2>
          <span className={styles.listCount}>
            {filteredTickets.length} de {tickets.length} tickets
          </span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className={styles.empty}>
            <Inbox size={48} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No se encontraron tickets</p>
            <p className={styles.emptyText}>
              {tickets.length === 0
                ? 'Aún no hay tickets creados. ¡Crea el primero!'
                : 'Intenta ajustar los filtros para ver más resultados'}
            </p>
          </div>
        ) : (
          <div className={styles.ticketsList}>
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onView={handleView}
                onAssign={handleAssignOpen}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, ticket: null })}
        title={detailModal.ticket ? `Detalles — ${detailModal.ticket.id}` : ''}
        size="lg"
      >
        <TicketDetail ticket={detailModal.ticket} />
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={assignModal.open}
        onClose={() => setAssignModal({ open: false, ticketId: null })}
        title="Asignar Personal"
        size="md"
      >
        <AssignForm
          ticketId={assignModal.ticketId}
          onAssign={handleAssign}
          onCancel={() => setAssignModal({ open: false, ticketId: null })}
        />
      </Modal>
    </div>
  )
}
