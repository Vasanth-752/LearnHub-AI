import { useState } from 'react'
import { User, Bell, Shield, Palette, LogOut, BookOpen } from 'lucide-react'
import { Button, Card, Input } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../hooks/useTheme'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // In a real app, this would call an API to update the profile
      toast.success('Profile saved (demo mode)')
    } catch (error) {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Signed out successfully')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <h1 className="font-heading font-bold text-2xl text-[var(--color-text)]">Settings</h1>

      {/* Profile Section */}
      <Card padding="lg">
        <h2 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-[var(--color-primary)]" />
          Profile
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            leftIcon={<User className="w-5 h-5" />}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            leftIcon={<BookOpen className="w-5 h-5" />}
            disabled
            hint="Email cannot be changed"
          />
          <Button type="submit" variant="primary" loading={saving}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Appearance Section */}
      <Card padding="lg">
        <h2 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-6 flex items-center gap-2">
          <Palette className="w-5 h-5 text-[var(--color-primary)]" />
          Appearance
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--color-text)]">Theme</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Choose your preferred color scheme</p>
            </div>
            <Button variant="outline" onClick={toggleTheme} className="gap-2">
              {theme === 'dark' ? (
                <>
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]" />
                  Dark
                </>
              ) : (
                <>
                  <span className="w-5 h-5 rounded-full bg-yellow-400" />
                  Light
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications Section */}
      <Card padding="lg">
        <h2 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[var(--color-primary)]" />
          Notifications
        </h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-[var(--color-text)]">Email notifications</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Receive updates about your learning progress</p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              defaultChecked
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-[var(--color-text)]">Weekly recap</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Get a summary of your learning activity</p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              defaultChecked
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-[var(--color-text)]">Streak reminders</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Don't break your learning streak</p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              defaultChecked
            />
          </label>
        </div>
      </Card>

      {/* Privacy & Security Section */}
      <Card padding="lg">
        <h2 className="font-heading font-semibold text-lg text-[var(--color-text)] mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--color-primary)]" />
          Privacy & Security
        </h2>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-3">
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3">
            Connected Accounts
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3">
            Data Export
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3 text-[var(--color-danger)]">
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card padding="lg" className="border-[rgba(163,81,57,0.3)]">
        <h2 className="font-heading font-semibold text-lg text-[var(--color-danger)] mb-4 flex items-center gap-2">
          <LogOut className="w-5 h-5" />
          Danger Zone
        </h2>
        <Button variant="danger" className="w-full" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </Card>

      {/* Version Info */}
      <div className="text-center text-xs text-[var(--color-text-muted)]">
        <p>LearnHub AI v0.1.0 (Foundation)</p>
        <p className="mt-1">Built with React 19, Vite, Express, Supabase, and Gemini AI</p>
      </div>
    </div>
  )
}