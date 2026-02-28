import styles from './Badge.module.css'

const variantMap = {
  // Priority
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
  // Type
  incident: 'incident',
  request: 'request',
  problem: 'problem',
  // Status
  open: 'open',
  'in-progress': 'inProgress',
  resolved: 'resolved',
  closed: 'closed',
}

export default function Badge({ variant, children }) {
  const cssClass = variantMap[variant] || 'default'
  return (
    <span className={`${styles.badge} ${styles[cssClass]}`}>
      {children}
    </span>
  )
}
