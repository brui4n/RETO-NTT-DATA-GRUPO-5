import { NavLink, useLocation } from 'react-router-dom'
import { PlusCircle, LayoutDashboard, Bot, BarChart3 } from 'lucide-react'
import styles from './Header.module.css'

export default function Header() {
  const location = useLocation()

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <Bot size={28} />
          </div>
          <div>
            <h1 className={styles.logoText}>NTT DATA</h1>
            <span className={styles.logoSubtext}>Sistema ITSM Inteligente</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
            }
          >
            <PlusCircle size={18} />
            <span>Crear Ticket</span>
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
            }
          >
            <LayoutDashboard size={18} />
            <span>Gestión de Tickets</span>
          </NavLink>
          <NavLink
            to="/stats"
            className={({ isActive }) =>
              `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
            }
          >
            <BarChart3 size={18} />
            <span>Estadísticas</span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
