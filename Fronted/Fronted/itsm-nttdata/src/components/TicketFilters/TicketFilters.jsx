import { Search, Filter, X } from 'lucide-react'
import styles from './TicketFilters.module.css'

export default function TicketFilters({ filters, onChange, onClear }) {
  const hasFilters = filters.priority || filters.type || filters.status || filters.search

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Filter size={18} />
          <h3 className={styles.title}>Filtros</h3>
        </div>
        {hasFilters && (
          <button className={styles.clearBtn} onClick={onClear}>
            <X size={14} />
            Limpiar filtros
          </button>
        )}
      </div>

      <div className={styles.searchWrap}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar por título, descripción o ID..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <label className={styles.label}>Prioridad</label>
          <select
            className={styles.select}
            value={filters.priority || ''}
            onChange={(e) => onChange({ ...filters, priority: e.target.value })}
          >
            <option value="">Todas</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Tipo</label>
          <select
            className={styles.select}
            value={filters.type || ''}
            onChange={(e) => onChange({ ...filters, type: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="incident">Incidente</option>
            <option value="request">Solicitud</option>
            <option value="problem">Problema</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Estado</label>
          <select
            className={styles.select}
            value={filters.status || ''}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="open">Abierto</option>
            <option value="in-progress">En Proceso</option>
            <option value="resolved">Resuelto</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>
      </div>
    </div>
  )
}
