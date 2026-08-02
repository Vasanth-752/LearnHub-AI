import { useState, useEffect } from 'react'
import { Search, FileText, Pin, PinOff, Trash2, X, Star } from 'lucide-react'
import { Button, Input, Card, Badge, Skeleton, EmptyState, ConfirmModal } from '../components/ui'
import ReactMarkdown from 'react-markdown'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function VaultPage() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewingNote, setViewingNote] = useState(null)
  const [deletingNote, setDeletingNote] = useState(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const response = await api.get('/notes')
      setNotes(response.data.data || [])
    } catch (error) {
      toast.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  const handlePin = async (note) => {
    try {
      await api.patch(`/notes/${note.id}/pin`, { pinned: !note.pinned })
      setNotes(notes.map(n => n.id === note.id ? { ...n, pinned: !note.pinned } : n))
      toast.success(note.pinned ? 'Note unpinned' : 'Note pinned')
    } catch (error) {
      toast.error('Failed to update note')
    }
  }

  const handleDelete = async () => {
    if (!deletingNote) return
    try {
      await api.delete(`/notes/${deletingNote.id}`)
      setNotes(notes.filter(n => n.id !== deletingNote.id))
      toast.success('Note deleted')
    } catch (error) {
      toast.error('Failed to delete note')
    } finally {
      setDeletingNote(null)
    }
  }

  const handleBookmarkNote = async (note) => {
    try {
      await api.post('/bookmarks', {
        type: 'notes',
        title: note.topic,
        metadata: { note_id: note.id },
      })
      toast.success('Note bookmarked ✓')
    } catch (error) {
      toast.error('Failed to bookmark note')
    }
  }

  const filteredNotes = notes.filter(note =>
    note.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pinnedNotes = filteredNotes.filter(n => n.pinned)
  const unpinnedNotes = filteredNotes.filter(n => !n.pinned)

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <Skeleton variant="rectangular" width="30%" height="48px" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} padding="md">
              <Skeleton variant="text" lines={2} />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-[var(--color-text)]">Vault</h1>
          <p className="text-[var(--color-text-secondary)]">Your saved notes and study materials</p>
        </div>
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
          className="w-full sm:w-80"
        />
      </div>

      {/* Notes List */}
      {(pinnedNotes.length > 0 || unpinnedNotes.length > 0) ? (
        <div className="space-y-4">
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                <Pin className="w-4 h-4 text-[var(--color-primary)]" />
                Pinned ({pinnedNotes.length})
              </h3>
              <div className="space-y-3">
                {pinnedNotes.map(note => (
                  <NoteCard key={note.id} note={note} onView={setViewingNote} onPin={handlePin} onDelete={setDeletingNote} onBookmark={handleBookmarkNote} />
                ))}
              </div>
            </div>
          )}
          {unpinnedNotes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Notes ({unpinnedNotes.length})
              </h3>
              <div className="space-y-3">
                {unpinnedNotes.map(note => (
                  <NoteCard key={note.id} note={note} onView={setViewingNote} onPin={handlePin} onDelete={setDeletingNote} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No notes yet"
          description="Search topics in Explore and save the generated notes to your Vault."
          actionLabel="Go Explore"
          actionIcon={<Search className="w-4 h-4" />}
          onAction={() => window.location.href = '/explore'}
        />
      )}

      {/* Note Viewer Modal */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)]" onClick={() => setViewingNote(null)}>
          <div className="w-full max-w-3xl max-h-[85vh] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="font-heading font-semibold text-lg text-[var(--color-text)] truncate">{viewingNote.topic}</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Saved {new Date(viewingNote.created_at).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setViewingNote(null)} className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] prose prose-invert max-w-none">
              <ReactMarkdown>{viewingNote.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingNote}
        onClose={() => setDeletingNote(null)}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  )
}

function NoteCard({ note, onView, onPin, onDelete, onBookmark }) {
  return (
    <Card hover padding="md" className="group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0" onClick={() => onView(note)}>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-[var(--color-text)] truncate">{note.topic}</h4>
            {note.pinned && <Pin className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">{note.content}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Saved {new Date(note.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={() => onBookmark(note)} aria-label="Bookmark note">
            <Star className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onPin(note)} aria-label={note.pinned ? 'Unpin' : 'Pin'}>
            {note.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(note)} aria-label="Delete">
            <Trash2 className="w-4 h-4 text-[var(--color-danger)]" />
          </Button>
        </div>
      </div>
    </Card>
  )
}