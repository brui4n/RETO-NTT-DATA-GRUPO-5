import styles from './StatCard.module.css'

export default function StatCard({ icon, number, label, color = 'blue' }) {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.iconWrap}>
        {icon}
      </div>
      <div className={styles.content}>
        <div className={styles.number}>{number}</div>
        <div className={styles.label}>{label}</div>
      </div>
    </div>
  )
}
