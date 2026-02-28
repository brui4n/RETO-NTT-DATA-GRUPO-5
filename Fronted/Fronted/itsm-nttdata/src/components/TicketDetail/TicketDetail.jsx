import ReactMarkdown from 'react-markdown'
import Badge from '../Badge/Badge'
import { getTypeLabel, getPriorityLabel, getStatusLabel } from '../../utils/aiClassification'
import { formatDate } from '../../utils/formatDate'
import { User, Mail, Briefcase, Building2, Bot, Clock, FileText, AlertCircle } from 'lucide-react'
import styles from './TicketDetail.module.css'

export default function TicketDetail({ ticket }) {
  if (!ticket) return null

  return (
    <div className={styles.container}>
      {/* Ticket Info */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <FileText size={18} />
          Información del Ticket
        </h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.label}>ID</span>
            <span className={styles.value}>{ticket.id}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Título</span>
            <span className={styles.value}>{ticket.title}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Tipo</span>
            <Badge variant={ticket.type}>{getTypeLabel(ticket.type)}</Badge>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Prioridad</span>
            <Badge variant={ticket.priority}>{getPriorityLabel(ticket.priority)}</Badge>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Estado</span>
            <Badge variant={ticket.status}>{getStatusLabel(ticket.status)}</Badge>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Creado</span>
            <span className={styles.value}>{formatDate(ticket.createdAt)}</span>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <AlertCircle size={18} />
          Descripción Completa
        </h3>
        <p className={styles.descriptionText}>{ticket.description}</p>
      </section>

      {/* User info */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <User size={18} />
          Datos del Usuario Creador
        </h3>
        <div className={styles.userGrid}>
            {/* User Details */}
          <div className={styles.userItem}>
            <User size={16} className={styles.userIcon} />
            <div>
              <span className={styles.userLabel}>Nombre</span>
              <span className={styles.userValue}>{ticket.user.name}</span>
            </div>
          </div>
          <div className={styles.userItem}>
            <Mail size={16} className={styles.userIcon} />
            <div>
              <span className={styles.userLabel}>Email</span>
              <span className={styles.userValue}>{ticket.user.email}</span>
            </div>
          </div>
          <div className={styles.userItem}>
            <Briefcase size={16} className={styles.userIcon} />
            <div>
              <span className={styles.userLabel}>Puesto</span>
              <span className={styles.userValue}>{ticket.user.puesto}</span>
            </div>
          </div>
          <div className={styles.userItem}>
            <Building2 size={16} className={styles.userIcon} />
            <div>
              <span className={styles.userLabel}>Área</span>
              <span className={styles.userValue}>{ticket.user.area}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Assigned info */}
      {ticket.assignedTo ? (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Briefcase size={18} />
            Personal Asignado
          </h3>
          <div className={styles.userGrid}>
            <div className={styles.userItem}>
              <User size={16} className={styles.userIcon} />
              <div>
                <span className={styles.userLabel}>Nombre</span>
                <span className={styles.userValue}>{ticket.assignedTo.name}</span>
              </div>
            </div>
            <div className={styles.userItem}>
              <Mail size={16} className={styles.userIcon} />
              <div>
                <span className={styles.userLabel}>Email</span>
                <span className={styles.userValue}>{ticket.assignedTo.email}</span>
              </div>
            </div>
            <div className={styles.userItem}>
              <Briefcase size={16} className={styles.userIcon} />
              <div>
                <span className={styles.userLabel}>Puesto</span>
                <span className={styles.userValue}>{ticket.assignedTo.puesto}</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className={styles.noAssigned}>
          <AlertCircle size={16} />
          Este ticket aún no tiene personal asignado
        </div>
      )}

      {/* AI Response */}
      <section className={styles.aiSection}>
        <h3 className={styles.aiTitle}>
          <Bot size={18} />
          Análisis de IA
        </h3>
        <div className={styles.aiText}>
          <ReactMarkdown>{ticket.aiResponse}</ReactMarkdown>
        </div>
      </section>

      {/* History */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Clock size={18} />
          Historial de Actividad
        </h3>
        <div className={styles.timeline}>
          {ticket.history.map((entry, i) => (
            <div key={i} className={styles.timelineItem}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineContent}>
                <span className={styles.timelineAction}>{entry.action}</span>
                <div className={styles.timelineMeta}>
                  <span>{entry.user}</span>
                  <span className={styles.timelineDate}>{formatDate(entry.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
