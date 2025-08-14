import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/AuthProvider'
import { ArrowRight, BarChart2, Lock, Zap } from 'lucide-react'

export function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const features = [
    { title: 'Plug-and-play', desc: 'Connect GA4 and GSC in one click and see metrics immediately.', icon: <Zap className="h-5 w-5 text-primary" /> },
    { title: 'Actionable charts', desc: 'Trends, top pages, and SEO metrics out of the box.', icon: <BarChart2 className="h-5 w-5 text-primary" /> },
    { title: 'Secure by design', desc: 'RLS and best practices for production readiness.', icon: <Lock className="h-5 w-5 text-primary" /> },
  ]

  return (
    <div className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 space-y-16 py-16 sm:py-24">
        <section className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Understand your traffic <span className="text-primary">in minutes</span></h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Slingshot connects Google Analytics 4 and Search Console to give you clear, actionable insights.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Go to Dashboard
                </button>
                <Link to="/setup" className="w-full sm:w-auto rounded-md border px-6 py-3 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center gap-2">
                  Connect Google <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/signup" className="w-full sm:w-auto rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Get started
                </Link>
                <Link to="/login" className="w-full sm:w-auto rounded-md border px-6 py-3 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="py-8">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-muted-foreground">{f.desc}</p>
                <div className="absolute inset-0 rounded-xl ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group-hover:bg-accent/50 opacity-0 transition-opacity group-hover:opacity-10" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}


