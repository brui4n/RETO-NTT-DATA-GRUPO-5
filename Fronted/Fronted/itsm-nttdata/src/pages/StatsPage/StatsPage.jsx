import { useState, useEffect, useMemo } from 'react'
import {
  Ticket, CircleDot, Loader2, CheckCircle2, AlertTriangle,
  BarChart3, PieChartIcon
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import StatCard from '../../components/StatCard/StatCard'
import { getTickets } from '../../utils/storage'
import styles from './StatsPage.module.css'

export default function StatsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTickets().then((data) => {
      setTickets(data)
      setLoading(false)
    })
  }, [])

  // Stats
  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in-progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    critical: tickets.filter((t) => t.priority === 'critical' && t.status !== 'closed' && t.status !== 'resolved').length,
  }), [tickets])

  // Chart Data Preparation
  const priorityData = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 }
    tickets.forEach((t) => { if (counts[t.priority] !== undefined) counts[t.priority]++ })
    return [
      { name: 'Crítico', value: counts.critical, color: '#DC2626' },
      { name: 'Alta', value: counts.high, color: '#F59E0B' },
      { name: 'Media', value: counts.medium, color: '#3B82F6' },
      { name: 'Baja', value: counts.low, color: '#10B981' },
    ].filter(d => d.value > 0)
  }, [tickets])

  const typeData = useMemo(() => {
    const counts = { incident: 0, request: 0, problem: 0 }
    tickets.forEach((t) => { if (counts[t.type] !== undefined) counts[t.type]++ })
    return [
      { name: 'Incidentes', value: counts.incident, fill: '#EF4444' },
      { name: 'Solicitudes', value: counts.request, fill: '#3B82F6' },
      { name: 'Problemas', value: counts.problem, fill: '#8B5CF6' },
    ].filter(d => d.value > 0)
  }, [tickets])

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
        <p>Cargando estadísticas...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Panel de Estadísticas</h2>
        <p className={styles.subtitle}>Métricas y distribución de los tickets del sistema</p>
      </div>

      {/* Stats Cards */}
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

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <PieChartIcon size={18} />
            Distribución por Tipo
          </h3>
          <div className={styles.chartWrapper}>
            {tickets.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>Sin datos suficientes</div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <BarChart3 size={18} />
            Tickets por Prioridad
          </h3>
          <div className={styles.chartWrapper}>
            {tickets.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: '#F1F5F9'}} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>Sin datos suficientes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
