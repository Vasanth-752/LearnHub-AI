import { useState, useEffect } from 'react'
import { Loader2, BookOpen, Map, TrendingUp, Target, Flame, Calendar } from 'lucide-react'
import { Card, Badge, Skeleton } from '../components/ui'
import api from '../services/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

export default function PulsePage() {
  const [stats, setStats] = useState(null)
  const [streakData, setStreakData] = useState(null)
  const [progressData, setProgressData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, streakRes, progressRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/dashboard/streak'),
        api.get('/dashboard/progress'),
      ])

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data)
      if (streakRes.status === 'fulfilled') setStreakData(streakRes.value.data.data)
      if (progressRes.status === 'fulfilled') setProgressData(progressRes.value.data.data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const COLORS = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-success)', '#8b5cf6']

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} padding="lg">
              <Skeleton variant="text" lines={2} />
            </Card>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Card padding="lg"><Skeleton variant="rectangular" height="300px" /></Card>
          <Card padding="lg" className="lg:col-span-2"><Skeleton variant="rectangular" height="300px" /></Card>
        </div>
        <Card padding="lg"><Skeleton variant="rectangular" height="200px" /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-[var(--color-text)]">Pulse</h1>
        <p className="text-[var(--color-text-secondary)]">Your learning statistics and progress overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Notes Collected"
          value={stats?.notes_count || 0}
          iconColor="var(--color-primary)"
        />
        <StatCard
          icon={Map}
          label="Active Pathways"
          value={stats?.active_pathways || 0}
          iconColor="var(--color-secondary)"
        />
        <StatCard
          icon={Target}
          label="Topics Explored"
          value={stats?.topics_explored || 0}
          iconColor="var(--color-success)"
        />
        <StatCard
          icon={TrendingUp}
          label="Completion Rate"
          value={`${stats?.completion_rate || 0}%`}
          iconColor="var(--color-primary)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Streak Calendar */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-lg text-[var(--color-text)]">
              <Flame className="w-5 h-5 inline mr-2 text-[var(--color-primary)]" />
              Streak Calendar
            </h3>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="font-semibold text-[var(--color-text)]">{streakData?.current_streak || 0} days</span>
            </div>
          </div>
          <StreakCalendar data={streakData} />
        </Card>

        {/* Progress Chart */}
        <Card padding="lg" className="lg:col-span-2">
          <h3 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-4">
            Roadmap Progress
          </h3>
          <div className="h-64">
            {progressData?.roadmaps?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData.roadmaps} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <YAxis dataKey="topic" type="category" tick={{ fill: 'var(--color-text)', fontSize: 12 }} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="progress" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--color-text-secondary)]">
                No roadmap progress data yet. Save a pathway to see your progress here.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <Card padding="lg">
        <h3 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-4">
          <Calendar className="w-5 h-5 inline mr-2 text-[var(--color-primary)]" />
          Activity Heatmap (Last 90 Days)
        </h3>
        <ActivityHeatmap data={streakData} />
      </Card>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, iconColor }) {
  return (
    <Card padding="lg" className="text-center">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${iconColor}20` }}>
        <Icon className="w-6 h-6" style={{ color: iconColor }} />
      </div>
      <p className="font-heading font-bold text-3xl text-[var(--color-text)]">{value}</p>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">{label}</p>
    </Card>
  )
}

function StreakCalendar({ data }) {
  if (!data?.calendar || !data.calendar.length) {
    return (
      <div className="h-32 flex items-center justify-center text-[var(--color-text-secondary)]">
        No streak data available yet. Start learning to build your streak!
      </div>
    )
  }

  // Create weeks array aligned by day of week (Sunday = 0, Saturday = 6)
  const weeks = []
  let currentWeek = new Array(7).fill(null)
  
  data.calendar.forEach((day, index) => {
    const dayOfWeek = new Date(day.date).getDay()
    currentWeek[dayOfWeek] = day
    
    // If it's Saturday or the last item, push the week and start a new one
    if (dayOfWeek === 6 || index === data.calendar.length - 1) {
      weeks.push(currentWeek)
      currentWeek = new Array(7).fill(null)
    }
  })

  // We only show days that exist in the week
  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="flex flex-col gap-1 min-w-[32px]">
          {week.map((day, dayIndex) => (
            day ? (
              <div
                key={dayIndex}
                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                  day.active
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                }`}
                title={`${day.date}: ${day.active ? 'Active' : 'Inactive'}`}
              >
                {new Date(day.date).getDate()}
              </div>
            ) : (
              <div key={dayIndex} className="w-8 h-8 rounded bg-transparent" />
            )
          ))}
        </div>
      ))}
    </div>
  )
}

function ActivityHeatmap({ data }) {
  if (!data?.heatmap || !data.heatmap.length) {
    return (
      <div className="h-32 flex items-center justify-center text-[var(--color-text-secondary)]">
        No activity data available for the last 90 days.
      </div>
    )
  }

  // Align dates by day of the week (Sun-Sat)
  const weeks = []
  let currentWeek = new Array(7).fill(null)
  
  data.heatmap.forEach((day, index) => {
    // Note: getDay() returns 0 for Sunday, 6 for Saturday (local time, assuming date string parses correctly)
    // To ensure correct UTC parsing if date is "YYYY-MM-DD", use UTC getUTCDay() or append "T12:00:00Z"
    const dayOfWeek = new Date(day.date + 'T12:00:00Z').getUTCDay()
    currentWeek[dayOfWeek] = day
    
    if (dayOfWeek === 6 || index === data.heatmap.length - 1) {
      weeks.push(currentWeek)
      currentWeek = new Array(7).fill(null)
    }
  })

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const maxWeeks = weeks.length

  const getIntensityColor = (count) => {
    if (count === 0) return 'var(--color-border)'
    if (count <= 2) return 'rgba(255, 177, 98, 0.3)'
    if (count <= 4) return 'rgba(255, 177, 98, 0.5)'
    if (count <= 6) return 'rgba(255, 177, 98, 0.7)'
    return 'var(--color-primary)'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth: `${maxWeeks * 14}px` }}>
        <thead>
          <tr>
            <th className="w-10 text-left text-xs text-[var(--color-text-muted)] font-normal">Day</th>
            {weeks.map((_, w) => (
              <th key={w} className="w-[12px] text-center text-xs text-[var(--color-text-muted)] font-normal">
                W{w + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {daysOfWeek.map((day, dayIndex) => (
            <tr key={dayIndex}>
              <td className="w-10 text-left text-xs text-[var(--color-text-muted)] font-normal">{day}</td>
              {weeks.map((week, weekIndex) => (
                <td key={weekIndex} className="w-[12px] h-[12px] text-center">
                  {week[dayIndex] ? (
                    <div
                      className="w-8 h-8 rounded mx-auto"
                      style={{ backgroundColor: getIntensityColor(week[dayIndex].count) }}
                      title={`${week[dayIndex].date}: ${week[dayIndex].count} activities`}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded mx-auto bg-transparent" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}