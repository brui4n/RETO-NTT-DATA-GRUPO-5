import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { getStaffUsers } from '../../utils/storage'
import styles from './AssignForm.module.css'

export default function AssignForm({ ticketId, onAssign, onCancel }) {
  const staffUsers = getStaffUsers()
  const [mode, setMode] = useState('select') // 'select' or 'manual'
  const [selectedStaff, setSelectedStaff] = useState('')
  const [manualData, setManualData] = useState({ name: '', email: '', puesto: '' })

  const handleSubmit = (e) => {
    e.preventDefault()

    let assignedTo
    if (mode === 'select') {
      const staff = staffUsers.find((s) => s.id === parseInt(selectedStaff))
      if (!staff) return
      assignedTo = { name: staff.name, email: staff.email, puesto: staff.puesto }
    } else {
      if (!manualData.name || !manualData.email || !manualData.puesto) return
      assignedTo = { ...manualData }
    }

    onAssign(ticketId, assignedTo)
  }

  const puestos = [
    'Soporte TI',
    'Administrador de Sistemas',
    'Líder de Proyecto',
    'Desarrollador Senior',
    'Analista de Seguridad',
    'Gerente',
  ]

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.modeSwitch}>
        <button
          type="button"
          className={`${styles.modeBtn} ${mode === 'select' ? styles.modeBtnActive : ''}`}
          onClick={() => setMode('select')}
        >
          Seleccionar del equipo
        </button>
        <button
          type="button"
          className={`${styles.modeBtn} ${mode === 'manual' ? styles.modeBtnActive : ''}`}
          onClick={() => setMode('manual')}
        >
          Ingresar manualmente
        </button>
      </div>

      {mode === 'select' ? (
        <div className={styles.staffList}>
          {staffUsers.map((staff) => (
            <label
              key={staff.id}
              className={`${styles.staffOption} ${
                selectedStaff === String(staff.id) ? styles.staffOptionSelected : ''
              }`}
            >
              <input
                type="radio"
                name="staff"
                value={staff.id}
                checked={selectedStaff === String(staff.id)}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className={styles.radioHidden}
              />
              <div className={styles.staffAvatar}>
                {staff.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.staffInfo}>
                <span className={styles.staffName}>{staff.name}</span>
                <span className={styles.staffRole}>{staff.puesto} — {staff.area}</span>
              </div>
              <div className={styles.radioCircle} />
            </label>
          ))}
        </div>
      ) : (
        <div className={styles.manualFields}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Nombre completo <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              placeholder="Nombre del personal"
              value={manualData.name}
              onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Email <span className={styles.required}>*</span>
            </label>
            <input
              type="email"
              className={styles.input}
              placeholder="email@nttdata.com"
              value={manualData.email}
              onChange={(e) => setManualData({ ...manualData, email: e.target.value })}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Puesto <span className={styles.required}>*</span>
            </label>
            <select
              className={styles.select}
              value={manualData.puesto}
              onChange={(e) => setManualData({ ...manualData, puesto: e.target.value })}
              required
            >
              <option value="">Seleccionar puesto...</option>
              {puestos.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={mode === 'select' ? !selectedStaff : !manualData.name || !manualData.email || !manualData.puesto}
        >
          <UserPlus size={18} />
          Asignar Personal
        </button>
        <button type="button" className={styles.btnCancel} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
