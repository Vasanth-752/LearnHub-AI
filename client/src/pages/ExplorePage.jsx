import { useState } from 'react'
import { Search, FileText, PlayCircle, Award, Map, ExternalLink, BookmarkPlus, Save, Check, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button, Input, Card, Badge, Skeleton, Tabs, TabList, Tab, TabPanel } from '../components/ui'
import ReactMarkdown from 'react-markdown'
import api from '../services/api'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'videos', label: 'Videos', icon: PlayCircle },
  { id: 'certs', label: 'Certifications', icon: Award },
  { id: 'pathway', label: 'Roadmap', icon: Map },
]

const TIERS = [
  { id: 'sprint', label: 'Sprint', description: '1–2 weeks' },
  { id: 'stride', label: 'Stride', description: '1–2 months' },
  { id: 'marathon', label: 'Marathon', description: '3–6 months' },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('notes')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  // Save states
  const [savingNote, setSavingNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [savingPathway, setSavingPathway] = useState(false)
  const [selectedTier, setSelectedTier] = useState('sprint')
  const [savedTiers, setSavedTiers] = useState(new Set())

  // Bookmark states — Set of bookmarked item IDs (video.id or cert.name)
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set())
  const [bookmarkingItems, setBookmarkingItems] = useState(new Set())

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    // Reset save states on new search
    setNoteSaved(false)
    setSavedTiers(new Set())
    setBookmarkedItems(new Set())

    try {
      const response = await api.get('/explore', { params: { q: query.trim() } })
      setResults(response.data.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNote = async () => {
    if (!results?.notes || savingNote || noteSaved) return
    setSavingNote(true)
    try {
      await api.post('/notes', {
        topic: query,
        content: results.notes,
      })
      setNoteSaved(true)
      toast.success('Note saved to Vault ✓')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleSavePathway = async () => {
    if (!results?.pathway || savingPathway || savedTiers.has(selectedTier)) return
    const tierMilestones = results.pathway[selectedTier]
    if (!tierMilestones?.length) {
      toast.error('No milestones found for this tier')
      return
    }

    setSavingPathway(true)
    try {
      await api.post('/roadmaps', {
        topic: query,
        tier: selectedTier,
        milestones: tierMilestones,
      })
      setSavedTiers(prev => new Set([...prev, selectedTier]))
      toast.success(`${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} pathway saved ✓`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save pathway')
    } finally {
      setSavingPathway(false)
    }
  }

  // bookmarkIdMap maps clientKey → server bookmark UUID (needed for deletion)
  const [bookmarkIdMap, setBookmarkIdMap] = useState({})

  const handleBookmark = async ({ clientKey, type, title, url, channel, provider, metadata }) => {
    if (bookmarkingItems.has(clientKey)) return

    setBookmarkingItems(prev => new Set([...prev, clientKey]))
    try {
      if (bookmarkedItems.has(clientKey)) {
        // Remove bookmark
        const bookmarkId = bookmarkIdMap[clientKey]
        if (bookmarkId) {
          await api.delete(`/bookmarks/${bookmarkId}`)
        }
        setBookmarkedItems(prev => { const next = new Set(prev); next.delete(clientKey); return next })
        setBookmarkIdMap(prev => { const next = { ...prev }; delete next[clientKey]; return next })
        toast.success('Bookmark removed')
      } else {
        // Add bookmark
        const res = await api.post('/bookmarks', { type, title, url, channel, provider, metadata })
        setBookmarkedItems(prev => new Set([...prev, clientKey]))
        setBookmarkIdMap(prev => ({ ...prev, [clientKey]: res.data.data.id }))
        toast.success('Bookmark added ✓')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update bookmark')
    } finally {
      setBookmarkingItems(prev => { const next = new Set(prev); next.delete(clientKey); return next })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex gap-4">
          <Skeleton variant="rectangular" width="60%" height="48px" />
          <Skeleton variant="rectangular" width="120px" height="48px" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} padding="lg">
              <Skeleton variant="text" lines={3} />
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton variant="rectangular" height="200px" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="flex-1 relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any topic... (e.g., Machine Learning, React, Python)"
            leftIcon={<Search className="w-5 h-5" />}
            error={error}
            disabled={loading}
          />
        </div>
        <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!query.trim() || loading}>
          Search
        </Button>
      </form>

      {error && (
        <div className="p-4 bg-[rgba(163,81,57,0.12)] border border-[rgba(163,81,57,0.3)] rounded-lg text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* Results Tabs */}
      {results && (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabList className="w-full">
            {TABS.map((tab) => (
              <Tab key={tab.id} value={tab.id} className="flex-1">
                <tab.icon className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Tab>
            ))}
          </TabList>

          {/* ── Notes Tab ─────────────────────────────────────────────────── */}
          <TabPanel value="notes" className="mt-6">
            {results.notes ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    AI-generated study notes for <strong className="text-[var(--color-text)]">{query}</strong>
                  </p>
                  <Button
                    variant={noteSaved ? 'outline' : 'primary'}
                    size="sm"
                    onClick={handleSaveNote}
                    loading={savingNote}
                    disabled={noteSaved}
                    leftIcon={noteSaved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                  >
                    {noteSaved ? 'Saved to Vault' : 'Save to Vault'}
                  </Button>
                </div>
                <div className="prose prose-invert max-w-none p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                  <ReactMarkdown>{results.notes}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <p className="text-[var(--color-text-secondary)]">No notes generated</p>
            )}
          </TabPanel>

          {/* ── Videos Tab ────────────────────────────────────────────────── */}
          <TabPanel value="videos" className="mt-6">
            {results.videos?.length ? (
              <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-4">
                {results.videos.map((video) => (
                  <motion.div key={video.id} variants={item}>
                    <Card hover padding="md">
                      <div className="aspect-video bg-[var(--color-bg)] rounded mb-3 relative overflow-hidden">
                        {video.thumbnail && (
                          <img
                            src={video.thumbnail}
                            alt=""
                            className="w-full h-full rounded object-cover"
                          />
                        )}
                      </div>
                      <h4 className="font-medium text-[var(--color-text)] mb-1 line-clamp-2">{video.title}</h4>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-3">{video.channel}</p>
                      <div className="flex items-center justify-between">
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
                        >
                          Watch <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleBookmark({
                            clientKey: video.id,
                            type: 'videos',
                            title: video.title,
                            url: video.url,
                            channel: video.channel,
                            metadata: { thumbnail: video.thumbnail },
                          })}
                          disabled={bookmarkingItems.has(video.id)}
                          className="p-1 rounded-md transition-colors hover:bg-[var(--color-elevated)]"
                          aria-label={bookmarkedItems.has(video.id) ? 'Remove bookmark' : 'Bookmark video'}
                        >
                          <Star
                            className="w-4 h-4"
                            style={{
                              fill: bookmarkedItems.has(video.id) ? 'var(--color-primary)' : 'none',
                              color: bookmarkedItems.has(video.id) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            }}
                          />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="text-[var(--color-text-secondary)]">No videos found</p>
            )}
          </TabPanel>

          {/* ── Certifications Tab ────────────────────────────────────────── */}
          <TabPanel value="certs" className="mt-6">
            {results.certifications?.length ? (
              <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-4">
                {results.certifications.map((cert) => (
                  <motion.div key={cert.name} variants={item}>
                    <Card hover padding="md">
                      <h4 className="font-medium text-[var(--color-text)] mb-1">{cert.name}</h4>
                      <p className="text-xs font-medium text-[var(--color-primary)] mb-2">{cert.provider}</p>
                      {cert.description && (
                        <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">{cert.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant={cert.cost === 'Free' ? 'success' : 'neutral'}>{cert.cost}</Badge>
                        <Badge variant="neutral">{cert.difficulty}</Badge>
                        {cert.duration && <Badge variant="neutral">{cert.duration}</Badge>}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {cert.url ? (
                          <a
                            href={cert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
                          >
                            View Details <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-sm text-[var(--color-text-muted)]">No URL available</span>
                        )}
                        <button
                          onClick={() => handleBookmark({
                            clientKey: cert.name,
                            type: 'certs',
                            title: cert.name,
                            url: cert.url,
                            channel: cert.provider,
                            metadata: {
                              difficulty: cert.difficulty,
                              cost: cert.cost,
                              description: cert.description
                            },
                          })}
                          disabled={bookmarkingItems.has(cert.name)}
                          className="p-1 rounded-md transition-colors hover:bg-[var(--color-elevated)]"
                          aria-label={bookmarkedItems.has(cert.name) ? 'Remove bookmark' : 'Bookmark certification'}
                        >
                          <Star
                            className="w-4 h-4"
                            style={{
                              fill: bookmarkedItems.has(cert.name) ? 'var(--color-primary)' : 'none',
                              color: bookmarkedItems.has(cert.name) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            }}
                          />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="text-[var(--color-text-secondary)]">No certifications found</p>
            )}
          </TabPanel>

          {/* ── Pathway Tab ───────────────────────────────────────────────── */}
          <TabPanel value="pathway" className="mt-6">
            {results.pathway ? (
              <div className="space-y-4">
                {/* Tier selector + Save button */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--color-text)] mb-2">Save a tier as your Pathway:</p>
                    <div className="flex gap-2 flex-wrap">
                      {TIERS.map(tier => (
                        <button
                          key={tier.id}
                          onClick={() => setSelectedTier(tier.id)}
                          className="flex flex-col items-start px-3 py-2 rounded-lg border transition-all duration-200 text-left"
                          style={{
                            background: selectedTier === tier.id ? 'var(--color-primary-muted)' : 'var(--color-bg)',
                            borderColor: selectedTier === tier.id ? 'var(--color-primary)' : 'var(--color-border)',
                            color: selectedTier === tier.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                          }}
                        >
                          <span className="text-sm font-medium capitalize">{tier.label}</span>
                          <span className="text-xs opacity-70">{tier.description}</span>
                          {savedTiers.has(tier.id) && (
                            <span className="text-xs mt-0.5 text-[var(--color-success)] flex items-center gap-1">
                              <Check className="w-3 h-3" /> Saved
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant={savedTiers.has(selectedTier) ? 'outline' : 'primary'}
                    size="md"
                    onClick={handleSavePathway}
                    loading={savingPathway}
                    disabled={savedTiers.has(selectedTier)}
                    leftIcon={savedTiers.has(selectedTier) ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  >
                    {savedTiers.has(selectedTier) ? 'Saved' : 'Save Pathway'}
                  </Button>
                </div>

                {/* Roadmap tiers display */}
                {Object.entries(results.pathway).map(([tier, milestones]) => (
                  <Card key={tier} padding="md">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-heading font-semibold text-[var(--color-text)] capitalize">{tier}</h4>
                      <Badge variant="primary">{milestones.length} steps</Badge>
                    </div>
                    <ol className="space-y-2">
                      {milestones.map((milestone, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
                          <span className="w-6 h-6 rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary)] flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span>{milestone}</span>
                        </li>
                      ))}
                    </ol>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-[var(--color-text-secondary)]">No roadmap generated</p>
            )}
          </TabPanel>
        </Tabs>
      )}

      {/* Empty State */}
      {!loading && !results && !error && (
        <div className="text-center py-16">
          <Search className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
          <h3 className="font-heading font-semibold text-xl text-[var(--color-text)] mb-2">
            Start exploring
          </h3>
          <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
            Search any topic and get AI-generated study notes, video tutorials, certifications, and learning roadmaps instantly.
          </p>
        </div>
      )}
    </div>
  )
}