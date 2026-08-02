import { Target, BookOpen, Map, Flame, Sparkles, ArrowRight } from 'lucide-react'
import Card from './Card'
import Button from './Button'

export default function RecapCard({ recap, loading, onGenerate, onOpenPastRecaps }) {
  if (loading) {
    return (
      <Card padding="lg" className="animate-pulse bg-[var(--color-surface)] border-[var(--color-border)] mb-8">
        <div className="h-6 bg-[var(--color-bg)] rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="h-12 bg-[var(--color-bg)] rounded"></div>
          <div className="h-12 bg-[var(--color-bg)] rounded"></div>
          <div className="h-12 bg-[var(--color-bg)] rounded"></div>
          <div className="h-12 bg-[var(--color-bg)] rounded"></div>
        </div>
        <div className="h-20 bg-[var(--color-bg)] rounded mb-4"></div>
        <div className="h-20 bg-[var(--color-bg)] rounded"></div>
      </Card>
    )
  }

  if (!recap) {
    return (
      <Card padding="lg" className="mb-8 border-dashed border-2 border-[var(--color-border)] flex flex-col items-center text-center">
        <Sparkles className="w-10 h-10 text-[var(--color-primary)] mb-3" />
        <h3 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-2">
          Weekly Recap
        </h3>
        <p className="text-[var(--color-text-secondary)] mb-4 max-w-md">
          Generate an AI-powered summary of your learning activity from the past 7 days to get personalized insights and recommended next steps.
        </p>
        <div className="flex gap-3">
          <Button onClick={onGenerate} variant="primary" leftIcon={<Sparkles className="w-4 h-4" />}>
            Generate New Recap
          </Button>
          <Button onClick={onOpenPastRecaps} variant="outline">
            Past Recaps
          </Button>
        </div>
      </Card>
    )
  }

  // Calculate the date range string
  const start = new Date(recap.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const end = new Date(recap.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  const stats = recap.stats_snapshot || {}
  const suggestedSteps = recap.suggested_steps || []

  return (
    <Card padding="lg" className="mb-8 border-[var(--color-primary)] relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)] rounded-full blur-[100px] opacity-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h2 className="font-heading font-bold text-xl text-[var(--color-text)] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[var(--color-primary)]" />
            Your Week in Review ({start} – {end})
          </h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={onGenerate} variant="outline" leftIcon={<Sparkles className="w-4 h-4" />}>
              Regenerate
            </Button>
            <Button size="sm" onClick={onOpenPastRecaps} variant="outline">
              Past Recaps
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-3 bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-500">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-[var(--color-text)] leading-tight">{stats.topics_explored || 0}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Topics</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
            <div className="p-2 rounded bg-blue-500/10 text-blue-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-[var(--color-text)] leading-tight">{stats.notes_saved || 0}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Notes</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
            <div className="p-2 rounded bg-purple-500/10 text-purple-500">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-[var(--color-text)] leading-tight">{stats.milestones_completed || 0}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Milestones</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
            <div className="p-2 rounded bg-orange-500/10 text-orange-500">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-[var(--color-text)] leading-tight">{stats.streak || 0}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Day Streak</p>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-[var(--color-primary-muted)] border border-[var(--color-primary)] p-4 rounded-lg mb-6 text-[var(--color-text)] flex items-start gap-3">
          <span className="text-xl leading-none mt-0.5">💡</span>
          <p className="text-sm leading-relaxed">{recap.insight}</p>
        </div>

        {/* Suggested Next Steps */}
        {suggestedSteps.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
              Suggested Next Steps
            </h4>
            <div className="space-y-2">
              {suggestedSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 bg-[var(--color-bg)] p-3 rounded border border-[var(--color-border)]">
                  <ArrowRight className="w-4 h-4 text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[var(--color-text)]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
