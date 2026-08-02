import { Link } from 'react-router-dom'
import { BookOpen, ArrowRight, Sparkles, Brain, Zap, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui'

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Learning',
    description: 'Generate personalized study notes, roadmaps, and resource recommendations for any topic.',
  },
  {
    icon: Brain,
    title: 'Smart Content Curation',
    description: 'Get relevant YouTube tutorials, certification suggestions, and structured learning paths.',
  },
  {
    icon: Zap,
    title: 'Track Your Progress',
    description: 'Save notes, follow roadmaps, build streaks, and visualize your learning journey.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl w-full text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-sm font-medium mb-8">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span>LearnHub AI — Your AI Learning Companion</span>
          </div>

          <h1 className="font-heading font-bold text-5xl md:text-6xl lg:text-7xl text-[var(--color-text)] mb-6 leading-tight">
            Learn anything, <span className="text-[var(--color-primary)]">faster</span> with AI
          </h1>

          <p className="text-xl text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
            Search any topic and get instant AI-generated study notes, video tutorials,
            certification recommendations, and personalized learning roadmaps.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" asChild>
              <Link to="/register">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/explore">Explore Demo</Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
              Private & secure
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading font-semibold text-3xl text-center mb-12 text-[var(--color-text)]">
            Everything you need to learn effectively
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="group p-6 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-border-hover)] transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-muted)] flex items-center justify-center text-[var(--color-primary)] mb-4 group-hover:scale-105 transition-transform">
                  <feature.icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-2 text-[var(--color-text)]">
                  {feature.title}
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4 text-[var(--color-text)]">
            Ready to start learning?
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Join thousands of learners using AI to accelerate their growth.
          </p>
          <Button size="lg" asChild>
            <Link to="/register">Create Free Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto text-center text-sm text-[var(--color-text-muted)]">
          <p>LearnHub AI — Built with care for curious minds</p>
        </div>
      </footer>
    </div>
  )
}