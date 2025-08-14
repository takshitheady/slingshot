// Load environment variables first, before any other imports
import './env.js'

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import googleTokensRoutes from './routes/auth/tokens.js'
import googleAnalyticsRoutes from './routes/analytics/google.js'
import brandRoutes from './routes/brands.js'

const app: express.Application = express()
const envPort = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : undefined
const preferredPort = Number.isFinite(envPort) ? (envPort as number) : 3000

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API routes
app.use('/auth', googleTokensRoutes)
app.use('/api/analytics/google', googleAnalyticsRoutes)
app.use('/api/brands', brandRoutes)
app.use('/api/chat', (_req: Request, res: Response) => res.json({ message: 'Chat routes - coming soon' }))

// 404 handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', error)
  res.status(500).json({ error: 'Internal server error' })
})

function startServer(port: number, attemptsLeft: number) {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`)
    console.log(`📊 Slingshot API ready`)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      // Only auto-bump if user didn't explicitly set SERVER_PORT
      if (!envPort && attemptsLeft > 0) {
        const nextPort = port + 1
        console.warn(`Port ${port} in use, retrying on ${nextPort}...`)
        setTimeout(() => startServer(nextPort, attemptsLeft - 1), 300)
        return
      }
    }
    console.error('Failed to start server:', err)
    process.exit(1)
  })
}

// Try up to 10 ports when no explicit SERVER_PORT set
startServer(preferredPort, envPort ? 0 : 10)

export default app