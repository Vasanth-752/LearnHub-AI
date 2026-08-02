import { useState, useEffect } from 'react'
import { BookOpen, Search, FolderOpen, Map, BarChart2, TrendingUp, Flame } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, Skeleton, RecapCard, PastRecapsModal } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'

const quickActions = [
  { path: '/explore', icon: Search, label: 'Explore Topics', description: 'Search any topic and get AI-generated content' },
  { path: '/vault', icon: FolderOpen, label: 'My Vault', description: 'View and manage your saved notes' },
  { path: '/pathways', icon: Map, label: 'My Pathways', description: 'Track progress on your learning roadmaps' },
  { path: '/dashboard', icon: BarChart2, label: 'Pulse Dashboard', description: 'View your learning statistics and streaks' },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [streak, setStreak] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [statsRes, streakRes] = await Promise.allSettled([
          api.get('/dashboard/stats'),
          api.get('/dashboard/streak'),
        ])
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data)
        if (streakRes.status === 'fulfilled') setStreak(streakRes.value.data.data)
      } catch (e) {
        // Non-fatal — dashboard degrades gracefully
      } finally {
        setLoadingStats(false)
      }
    }
    loadStats()
  }, [])

  const [recap, setRecap] = useState(null)
  const [loadingRecap, setLoadingRecap] = useState(true)
  const [isPastRecapsOpen, setIsPastRecapsOpen] = useState(false)

  useEffect(() => {
    async function loadRecap() {
      try {
        setLoadingRecap(true)
        const response = await api.get('/recap')
        const recaps = response.data.data
        if (recaps && recaps.length > 0) {
          const latest = recaps[0]
          const createdDate = new Date(latest.created_at)
          const now = new Date()
          const daysOld = (now - createdDate) / (1000 * 60 * 60 * 24)
          
          if (daysOld > 7) {
            // Generate a fresh one if > 7 days old
            const newRecapRes = await api.post('/recap/generate')
            setRecap(newRecapRes.data.data)
          } else {
            setRecap(latest)
          }
        } else {
          // No recaps at all, generate one
          const newRecapRes = await api.post('/recap/generate')
          setRecap(newRecapRes.data.data)
        }
      } catch (error) {
        console.error('Failed to load recap:', error)
      } finally {
        setLoadingRecap(false)
      }
    }
    loadRecap()
  }, [])

  const handleGenerateRecap = async () => {
    try {
      setLoadingRecap(true)
      const newRecapRes = await api.post('/recap/generate')
      setRecap(newRecapRes.data.data)
      toast.success('New recap generated!')
    } catch (error) {
      toast.error('Failed to generate recap')
      console.error(error)
    } finally {
      setLoadingRecap(false)
    }
  }

  const handleOpenPastRecaps = () => {
    setIsPastRecapsOpen(true)
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-[var(--color-text)]">
            Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Learner'}! 👋
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Ready to continue your learning journey?
          </p>
        </div>
        {/* Streak badge */}
        {streak && streak.current_streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-muted)] border border-[var(--color-primary)] rounded-xl">
            <Flame className="w-5 h-5 text-[var(--color-primary)]" />
            <div>
              <p className="font-bold text-[var(--color-primary)] leading-none">{streak.current_streak} day streak</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Best: {streak.longest_streak} days</p>
            </div>
          </div>
        )}
      </div>

      {/* Recap Section */}
      <section>
        <RecapCard
          recap={recap}
          loading={loadingRecap}
          onGenerate={handleGenerateRecap}
          onOpenPastRecaps={handleOpenPastRecaps}
        />
      </section>

      {/* Quick Actions Grid */}
      <section>
        <h2 className="font-heading font-semibold text-xl mb-4 text-[var(--color-text)]">
          Quick Actions
        </h2>
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <motion.div key={action.path} variants={item}>
                <NavLink
                  to={action.path}
                  className="group block h-full"
                >
                  <Card hover padding="lg" className="h-full">
                    <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-muted)] flex items-center justify-center text-[var(--color-primary)] mb-4 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-1">
                      {action.label}
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {action.description}
                    </p>
                  </Card>
                </NavLink>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* Live Stats */}
      <section>
        <h2 className="font-heading font-semibold text-xl mb-4 text-[var(--color-text)]">
          Your Learning Snapshot
        </h2>
        {loadingStats ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} padding="lg" className="text-center">
                <Skeleton variant="text" lines={2} />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            <Card padding="lg" className="text-center">
              <TrendingUp className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-2" />
              <p className="font-heading font-bold text-3xl text-[var(--color-text)]">
                {stats?.topics_explored ?? 0}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">Topics Explored</p>
            </Card>
            <Card padding="lg" className="text-center">
              <BookOpen className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-2" />
              <p className="font-heading font-bold text-3xl text-[var(--color-text)]">
                {stats?.notes_count ?? 0}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">Notes Saved</p>
            </Card>
            <Card padding="lg" className="text-center">
              <Map className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-2" />
              <p className="font-heading font-bold text-3xl text-[var(--color-text)]">
                {stats?.active_pathways ?? 0}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">Active Pathways</p>
            </Card>
          </div>
        )}
      </section>

      {/* Getting Started (only show when no data yet) */}
      {!loadingStats && stats?.topics_explored === 0 && (
        <section>
          <Card padding="lg">
            <h3 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-4">
              Getting Started
            </h3>
            <div className="space-y-3 text-[var(--color-text-secondary)]">
              <p>1. Go to <strong>Explore</strong> and search for any topic you want to learn</p>
              <p>2. Browse AI-generated notes, videos, certifications, and roadmaps</p>
              <p>3. Save content to your <strong>Vault</strong> or start a <strong>Pathway</strong></p>
              <p>4. Track your progress on the <strong>Pulse Dashboard</strong></p>
            </div>
            <NavLink to="/explore" className="inline-flex items-center gap-2 mt-4 text-[var(--color-primary)] font-medium hover:text-[var(--color-primary-hover)]">
              Start Exploring →
            </NavLink>
          </Card>
        </section>
      )}

      <PastRecapsModal 
        isOpen={isPastRecapsOpen} 
        onClose={() => setIsPastRecapsOpen(false)} 
      />
    </div>
  )
}