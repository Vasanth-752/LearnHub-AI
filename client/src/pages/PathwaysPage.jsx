import { useState, useEffect } from 'react'
import { Loader2, Map, CheckCircle, Circle, Trash2, ChevronRight } from 'lucide-react'
import { Button, Card, Badge, Skeleton, EmptyState, ConfirmModal } from '../components/ui'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function PathwaysPage() {
  const [roadmaps, setRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewingRoadmap, setViewingRoadmap] = useState(null)
  const [deletingRoadmap, setDeletingRoadmap] = useState(null)

  useEffect(() => {
    fetchRoadmaps()
  }, [])

  const fetchRoadmaps = async () => {
    try {
      const response = await api.get('/roadmaps')
      setRoadmaps(response.data.data || [])
    } catch (error) {
      toast.error('Failed to load roadmaps')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMilestone = async (roadmapId, milestoneId, completed) => {
    // Optimistically update local state for instant UI feedback
    const updatedMilestones = (milestones) =>
      milestones.map(m => m.id === milestoneId ? { ...m, completed: !completed } : m)

    setRoadmaps(roadmaps.map(rm => {
      if (rm.id !== roadmapId) return rm
      const newMilestones = updatedMilestones(rm.milestones)
      return {
        ...rm,
        milestones: newMilestones,
        progress: calculateProgress(newMilestones),
      }
    }))

    // Also update the modal view if it's open
    if (viewingRoadmap?.id === roadmapId) {
      setViewingRoadmap(prev => {
        const newMilestones = updatedMilestones(prev.milestones)
        return { ...prev, milestones: newMilestones, progress: calculateProgress(newMilestones) }
      })
    }

    try {
      await api.patch(`/roadmaps/${roadmapId}/milestones/${milestoneId}`, { completed: !completed })
    } catch (error) {
      toast.error('Failed to update milestone')
      // Revert optimistic update on failure
      setRoadmaps(roadmaps.map(rm => {
        if (rm.id !== roadmapId) return rm
        return {
          ...rm,
          milestones: rm.milestones.map(m => m.id === milestoneId ? { ...m, completed } : m),
          progress: calculateProgress(rm.milestones),
        }
      }))
      if (viewingRoadmap?.id === roadmapId) {
        setViewingRoadmap(prev => ({
          ...prev,
          milestones: prev.milestones.map(m => m.id === milestoneId ? { ...m, completed } : m),
        }))
      }
    }
  }

  const handleDelete = async () => {
    if (!deletingRoadmap) return
    try {
      await api.delete(`/roadmaps/${deletingRoadmap.id}`)
      setRoadmaps(roadmaps.filter(r => r.id !== deletingRoadmap.id))
      toast.success('Roadmap deleted')
    } catch (error) {
      toast.error('Failed to delete roadmap')
    } finally {
      setDeletingRoadmap(null)
    }
  }

  const calculateProgress = (milestones) => {
    if (!milestones.length) return 0
    const completed = milestones.filter(m => m.completed).length
    return Math.round((completed / milestones.length) * 100)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <Skeleton variant="rectangular" width="30%" height="48px" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} padding="lg">
              <Skeleton variant="text" lines={3} />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-[var(--color-text)]">Pathways</h1>
        <p className="text-[var(--color-text-secondary)]">Your saved learning roadmaps and progress</p>
      </div>

      {/* Roadmaps Grid */}
      {roadmaps.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roadmaps.map(roadmap => (
            <RoadmapCard
              key={roadmap.id}
              roadmap={roadmap}
              onView={setViewingRoadmap}
              onDelete={setDeletingRoadmap}
              progress={calculateProgress(roadmap.milestones)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Map}
          title="No roadmaps yet"
          description="Search topics in Explore and save a learning pathway to get started."
          actionLabel="Go Explore"
          actionIcon={<Map className="w-4 h-4" />}
          onAction={() => window.location.href = '/explore'}
        />
      )}

      {/* Roadmap Viewer Modal */}
      {viewingRoadmap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)]" onClick={() => setViewingRoadmap(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <div>
                <h2 className="font-heading font-semibold text-lg text-[var(--color-text)]">{viewingRoadmap.topic}</h2>
                <p className="text-sm text-[var(--color-text-secondary)] capitalize">{viewingRoadmap.tier} tier</p>
              </div>
              <button onClick={() => setViewingRoadmap(null)} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]" aria-label="Close">
                <ChevronRight className="w-5 h-5 rotate-90" />
              </button>
            </div>
            <div className="p-4 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--color-text-secondary)]">Progress</span>
                <span className="font-semibold text-[var(--color-text)]">{calculateProgress(viewingRoadmap.milestones)}%</span>
              </div>
              <div className="h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${calculateProgress(viewingRoadmap.milestones)}%` }}
                />
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
              {viewingRoadmap.milestones.map((milestone, i) => (
                <div
                  key={milestone.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    milestone.completed
                      ? 'bg-[var(--color-primary-muted)]'
                      : 'hover:bg-[var(--color-elevated)]'
                  }`}
                >
                  <button
                    onClick={() => handleToggleMilestone(viewingRoadmap.id, milestone.id, milestone.completed)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      milestone.completed
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
                    }`}
                    aria-label={milestone.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {milestone.completed && <CheckCircle className="w-4 h-4 text-[var(--color-bg)]" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${milestone.completed ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}>
                      {milestone.title}
                    </p>
                    {milestone.description && (
                      <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{milestone.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-primary)] font-medium flex-shrink-0">
                    {milestone.completed ? 'Done' : 'Step ' + (i + 1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingRoadmap}
        onClose={() => setDeletingRoadmap(null)}
        title="Delete Roadmap"
        description="Are you sure you want to delete this roadmap? All progress will be lost."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  )
}

function RoadmapCard({ roadmap, onView, onDelete, progress }) {
  const tierColors = {
    sprint: 'var(--color-success)',
    stride: 'var(--color-primary)',
    marathon: 'var(--color-secondary)',
  }

  const tierColor = tierColors[roadmap.tier?.toLowerCase()] || 'var(--color-primary)'

  return (
    <Card hover padding="lg" className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading font-semibold text-lg text-[var(--color-text)]">{roadmap.topic}</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">{roadmap.milestones.length} milestones</p>
        </div>
        <Badge variant="neutral" style={{ backgroundColor: `${tierColor}20`, color: tierColor, borderColor: `${tierColor}40` }}>
          {roadmap.tier}
        </Badge>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-[var(--color-text-secondary)]">Progress</span>
          <span className="font-semibold text-[var(--color-text)]">{progress}%</span>
        </div>
        <div className="h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, backgroundColor: tierColor }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
        <span className="text-sm text-[var(--color-text-muted)]">
          Updated {new Date(roadmap.updated_at).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onView(roadmap)}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(roadmap)} className="text-[var(--color-danger)]">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}