import { Search, Home, Map } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Card, Button } from '../components/ui'

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-fade-in-up text-center">
      <div className="relative mb-8">
        <h1 className="font-heading font-black text-9xl text-[var(--color-primary)] opacity-20 select-none">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <Map className="w-20 h-20 text-[var(--color-primary)] drop-shadow-lg" />
        </div>
      </div>
      
      <h2 className="font-heading font-bold text-3xl text-[var(--color-text)] mb-4">
        Looks like you're off the map!
      </h2>
      
      <p className="text-[var(--color-text-secondary)] max-w-md mx-auto mb-8">
        We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <NavLink to="/dashboard" className="flex-1">
          <Button variant="primary" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
            Go Home
          </Button>
        </NavLink>
        <NavLink to="/explore" className="flex-1">
          <Button variant="outline" className="w-full" leftIcon={<Search className="w-4 h-4" />}>
            Explore
          </Button>
        </NavLink>
      </div>
    </div>
  )
}
