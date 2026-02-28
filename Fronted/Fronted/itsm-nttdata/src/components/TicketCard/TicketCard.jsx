import { Eye, UserPlus, CheckCircle, AlertTriangle, Clock, ArrowUpRight } from 'lucide-react'
import Badge from '../Badge/Badge'
import { getTypeLabel, getPriorityLabel, getStatusLabel } from '../../utils/aiClassification'
import { timeAgo } from '../../utils/formatDate'
import styles from './TicketCard.module.css'

export default function TicketCard({ ticket, onView, onAssign, onResolve }) {
  const isAssignable = !ticket.assignedTo && ticket.status === 'open'
  const isResolvable = ticket.status === 'in-progress'

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.ticketId}>{ticket.id}</span>
          <div className={styles.badges}>
            <Badge variant={ticket.priority}>{getPriorityLabel(ticket.priority)}</Badge>
            <Badge variant={ticket.type}>{getTypeLabel(ticket.type)}</Badge>
            <Badge variant={ticket.status}>{getStatusLabel(ticket.status)}</Badge>
          </div>
        </div>
        <span className={styles.time}>
          <Clock size={14} />
          {timeAgo(ticket.createdAt)}
        </span>
      </div>

      <h3 className={styles.title}>{ticket.title}</h3>
      <p className={styles.description}>{ticket.description}</p>

      {ticket.assignedTo && (
        <div className={styles.assignedInfo}>
          <UserPlus size={14} />
          <span>
            Asignado a <strong>{ticket.assignedTo.name}</strong> — {ticket.assignedTo.puesto}
          </span>
        </div>
      )}

      {ticket.aiResponse && (
        <div className={styles.aiHint}>
          <span className={styles.aiIcon}>IA</span>
          <span>{ticket.aiResponse}</span>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.meta}>
          <span>Creado por <strong>{ticket.user.name}</strong></span>
          <span className={styles.area}>{ticket.user.area}</span>
        </div>
        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnView}`} onClick={() => onView(ticket.id)} title="Ver detalles">
            <Eye size={16} />
            <span>Ver</span>
          </button>
          {isAssignable && (
            <button
              className={`${styles.btn} ${styles.btnAssign}`}
              onClick={() => onAssign(ticket.id)}
              title="Asignar personal"
            >
              <UserPlus size={16} />
              <span>Asignar</span>
            </button>
          )}
          {isResolvable && (
            <button
              className={`${styles.btn} ${styles.btnResolve}`}
              onClick={() => onResolve(ticket.id)}
              title="Marcar como resuelto"
            >
              <CheckCircle size={16} />
              <span>Resolver</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
