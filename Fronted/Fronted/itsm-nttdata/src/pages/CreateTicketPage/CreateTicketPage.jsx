import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Send, Sparkles, User, Mail, Briefcase, Building2, FileText, AlignLeft } from 'lucide-react'
import { classifyTicket, generateAIResponse, getTypeLabel, getPriorityLabel } from '../../utils/aiClassification'
import { addTicket, getNextTicketId } from '../../utils/storage'
import styles from './CreateTicketPage.module.css'

export default function CreateTicketPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    puesto: '',
    area: '',
    title: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const areas = [
    'Tecnología',
    'Finanzas',
    'Operaciones',
    'Marketing',
    'Recursos Humanos',
    'Legal',
    'Ventas',
    'Soporte',
    'Administración',
  ]

  const puestos = [
    'Analista Junior',
    'Analista Senior',
    'Desarrollador',
    'Desarrollador Senior',
    'Soporte TI',
    'Administrador de Sistemas',
    'Líder de Proyecto',
    'Gerente',
    'Director',
    'Coordinador',
  ]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)

    // Simulate a brief AI processing delay for UX
    setTimeout(() => {
      const classification = classifyTicket(formData.description)
      const aiResponse = generateAIResponse(classification.type, classification.priority)
      const ticketId = getNextTicketId()

      const ticket = {
        id: ticketId,
        user: {
          name: formData.name,
          email: formData.email,
          puesto: formData.puesto,
          area: formData.area,
        },
        title: formData.title,
        description: formData.description,
        type: classification.type,
        priority: classification.priority,
        status: 'open',
        assignedTo: null,
        aiResponse,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [
          {
            action: 'Ticket creado',
            timestamp: new Date().toISOString(),
            user: formData.name,
          },
          {
            action: `Clasificado como ${classification.type.toUpperCase()} - ${classification.priority.toUpperCase()} por IA`,
            timestamp: new Date().toISOString(),
            user: 'Sistema IA',
          },
        ],
      }

      addTicket(ticket)
      setSubmitting(false)
      setResult({ ticket, classification, aiResponse })

      toast.success(`Ticket ${ticketId} creado exitosamente`)
    }, 800)
  }

  const handleReset = () => {
    setFormData({ name: '', email: '', puesto: '', area: '', title: '', description: '' })
    setResult(null)
  }

  if (result) {
    return (
      <div className={styles.container}>
        <div className={`${styles.card} ${styles.successCard}`}>
          <div className={styles.successHeader}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Ticket Creado Exitosamente</h2>
            <p className={styles.successSubtitle}>
              Tu ticket <strong>{result.ticket.id}</strong> ha sido registrado y clasificado por nuestra IA
            </p>
          </div>

          <div className={styles.resultGrid}>
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>ID del Ticket</span>
              <span className={styles.resultValue}>{result.ticket.id}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>Tipo (IA)</span>
              <span className={styles.resultValue}>{getTypeLabel(result.classification.type)}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>Prioridad (IA)</span>
              <span className={styles.resultValue}>{getPriorityLabel(result.classification.priority)}</span>
            </div>
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>Estado</span>
              <span className={styles.resultValue}>Abierto</span>
            </div>
          </div>

          <div className={styles.aiResultBox}>
            <div className={styles.aiResultHeader}>
              <Sparkles size={18} />
              <span>Respuesta de IA</span>
            </div>
            <p className={styles.aiResultText}>{result.aiResponse}</p>
          </div>

          <div className={styles.successActions}>
            <button className={styles.btnPrimary} onClick={handleReset}>
              Crear otro ticket
            </button>
            <button className={styles.btnSecondary} onClick={() => navigate('/admin')}>
              Ver gestión de tickets
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Crear Nuevo Ticket</h2>
            <p className={styles.cardSubtitle}>
              Completa el formulario y nuestra IA clasificará automáticamente tu solicitud
            </p>
          </div>
          <div className={styles.aiChip}>
            <Sparkles size={16} />
            Clasificación IA
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* User information */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              <User size={18} />
              Información del Solicitante
            </legend>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="name">
                  Nombre completo <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <User size={18} className={styles.inputIcon} />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={styles.input}
                    placeholder="Tu nombre completo"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="email">
                  Email <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <Mail size={18} className={styles.inputIcon} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={styles.input}
                    placeholder="tu.email@nttdata.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="puesto">
                  Puesto / Cargo <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <Briefcase size={18} className={styles.inputIcon} />
                  <select
                    id="puesto"
                    name="puesto"
                    className={styles.select}
                    value={formData.puesto}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar puesto...</option>
                    {puestos.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="area">
                  Área / Departamento <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <Building2 size={18} className={styles.inputIcon} />
                  <select
                    id="area"
                    name="area"
                    className={styles.select}
                    value={formData.area}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar área...</option>
                    {areas.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Ticket information */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              <FileText size={18} />
              Detalles del Ticket
            </legend>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="title">
                Título / Asunto <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrap}>
                <FileText size={18} className={styles.inputIcon} />
                <input
                  id="title"
                  name="title"
                  type="text"
                  className={styles.input}
                  placeholder="Describe brevemente el problema o solicitud"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="description">
                Descripción detallada <span className={styles.required}>*</span>
              </label>
              <div className={styles.textareaWrap}>
                <AlignLeft size={18} className={styles.textareaIcon} />
                <textarea
                  id="description"
                  name="description"
                  className={styles.textarea}
                  placeholder="Describe en detalle tu problema o solicitud. Incluye información como: desde cuándo ocurre, a cuántos usuarios afecta, qué sistemas están involucrados, etc."
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  required
                />
              </div>
              <span className={styles.hint}>
                💡 Mientras más detalle proporciones, mejor será la clasificación automática de la IA
              </span>
            </div>
          </fieldset>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className={styles.spinner} />
                  Procesando con IA...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Enviar Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
