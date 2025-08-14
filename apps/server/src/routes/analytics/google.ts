import { Router, Request, Response } from 'express'
import { createAnalyticsService } from '../../services/google/analytics.js'
import { createSearchConsoleService } from '../../services/google/searchconsole.js'

const router: Router = Router()

// Lightweight request logger for this router
router.use((req, _res, next) => {
  const reqId = Math.random().toString(36).slice(2, 8)
  ;(req as any).reqId = reqId
  const { method, originalUrl } = req
  console.log(`[analytics] [${reqId}] ${method} ${originalUrl}`)
  next()
})

// Helper to surface meaningful Google API errors in dev
function getGoogleErrorDetails(error: unknown) {
  const anyErr = error as any
  // googleapis usually attaches errors like: err.errors[] or err.response.data.error
  const googleData = anyErr?.response?.data
  if (googleData?.error) {
    return googleData.error
  }
  if (anyErr?.message) {
    return anyErr.message
  }
  return 'Unknown error'
}

// Helper: convert relative date keywords to YYYY-MM-DD (GSC requires absolute dates)
function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function resolveDateParam(value: string | undefined, fallback: string): string {
  const now = new Date()
  const todayISO = toISODate(now)
  const mapping: Record<string, () => string> = {
    today: () => todayISO,
    '7daysAgo': () => {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return toISODate(d)
    },
    '30daysAgo': () => {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      return toISODate(d)
    },
    '90daysAgo': () => {
      const d = new Date(now)
      d.setDate(d.getDate() - 90)
      return toISODate(d)
    },
    '365daysAgo': () => {
      const d = new Date(now)
      d.setDate(d.getDate() - 365)
      return toISODate(d)
    },
  }
  if (!value) return fallback
  if (mapping[value]) return mapping[value]()
  // If looks like YYYY-MM-DD, pass through
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  // Fallback
  return fallback
}

// Middleware to extract tokens from headers
const extractTokens = (req: Request) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '')
  const refreshToken = req.headers['x-refresh-token'] as string
  
  if (!accessToken) {
    throw new Error('Access token is required')
  }
  
  return { accessToken, refreshToken }
}

// Google Analytics routes
router.get('/ga4/properties', async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = extractTokens(req)
    const analyticsService = createAnalyticsService(accessToken, refreshToken)
    
    const properties = await analyticsService.getProperties()
    
    res.json({
      success: true,
      data: properties
    })
  } catch (error) {
    const details = getGoogleErrorDetails(error)
    console.error(`[analytics][${(req as any).reqId}] GA4 properties error:`, details)
    const status = (details as any)?.code === 401 ? 401 : 500
    res.status(status).json({ success: false, error: 'Failed to fetch GA4 properties', details })
  }
})

router.get('/ga4/realtime/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params
    const { accessToken, refreshToken } = extractTokens(req)
    const analyticsService = createAnalyticsService(accessToken, refreshToken)
    
    const data = await analyticsService.getRealtimeReport(propertyId)
    
    res.json({
      success: true,
      data
    })
  } catch (error) {
    const details = getGoogleErrorDetails(error)
    console.error(`[analytics][${(req as any).reqId}] GA4 realtime error:`, details)
    const status = (details as any)?.code === 401 ? 401 : 500
    res.status(status).json({ success: false, error: 'Failed to fetch realtime data', details })
  }
})

router.get('/ga4/report/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params
    const { startDate = '30daysAgo', endDate = 'today' } = req.query
    const { accessToken, refreshToken } = extractTokens(req)
    const analyticsService = createAnalyticsService(accessToken, refreshToken)
    
    const data = await analyticsService.getReport(
      propertyId,
      startDate as string,
      endDate as string
    )
    
    res.json({
      success: true,
      data
    })
  } catch (error) {
    const details = getGoogleErrorDetails(error)
    console.error(`[analytics][${(req as any).reqId}] GA4 report error:`, details)
    const status = (details as any)?.code === 401 ? 401 : 500
    res.status(status).json({ success: false, error: 'Failed to fetch analytics report', details })
  }
})

router.get('/ga4/top-pages/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params
    const { startDate = '30daysAgo', endDate = 'today' } = req.query
    const { accessToken, refreshToken } = extractTokens(req)
    const analyticsService = createAnalyticsService(accessToken, refreshToken)
    
    const data = await analyticsService.getTopPages(
      propertyId,
      startDate as string,
      endDate as string
    )
    
    res.json({
      success: true,
      data
    })
  } catch (error) {
    const details = getGoogleErrorDetails(error)
    console.error(`[analytics][${(req as any).reqId}] GA4 top pages error:`, details)
    const status = (details as any)?.code === 401 ? 401 : 500
    res.status(status).json({ success: false, error: 'Failed to fetch top pages', details })
  }
})

// Google Search Console routes
router.get('/gsc/sites', async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = extractTokens(req)
    const searchConsoleService = createSearchConsoleService(accessToken, refreshToken)
    
    const sites = await searchConsoleService.getSites()
    
    res.json({
      success: true,
      data: sites
    })
  } catch (error) {
    const details = getGoogleErrorDetails(error)
    console.error(`[analytics][${(req as any).reqId}] GSC sites error:`, details)
    const status = (details as any)?.code === 401 ? 401 : 500
    res.status(status).json({ success: false, error: 'Failed to fetch Search Console sites', details })
  }
})

router.get('/gsc/search-analytics', async (req: Request, res: Response) => {
  try {
    const { siteUrl: rawSiteUrl } = req.query
    const siteUrl = typeof rawSiteUrl === 'string' ? decodeURIComponent(rawSiteUrl) : undefined
    const startDate = resolveDateParam(req.query.startDate as string | undefined, resolveDateParam('30daysAgo', ''))
    const endDate = resolveDateParam(req.query.endDate as string | undefined, resolveDateParam('today', ''))
    
    if (!siteUrl) {
      return res.status(400).json({
        success: false,
        error: 'Site URL is required'
      })
    }
    
    const { accessToken, refreshToken } = extractTokens(req)
    const searchConsoleService = createSearchConsoleService(accessToken, refreshToken)
    
    const data = await searchConsoleService.getSearchAnalytics(
      siteUrl,
      startDate,
      endDate
    )
    
    res.json({
      success: true,
      data
    })
  } catch (error) {
    const details = getGoogleErrorDetails(error)
    console.error(`[analytics][${(req as any).reqId}] GSC search analytics error:`, details)
    const status = (details as any)?.code === 401 ? 401 : 500
    res.status(status).json({ success: false, error: 'Failed to fetch search analytics', details })
  }
})

router.get('/gsc/top-queries', async (req: Request, res: Response) => {
  try {
    const { siteUrl } = req.query
    const startDate = resolveDateParam(req.query.startDate as string | undefined, resolveDateParam('30daysAgo', ''))
    const endDate = resolveDateParam(req.query.endDate as string | undefined, resolveDateParam('today', ''))
    
    if (!siteUrl) {
      return res.status(400).json({
        success: false,
        error: 'Site URL is required'
      })
    }
    
    const { accessToken, refreshToken } = extractTokens(req)
    const searchConsoleService = createSearchConsoleService(accessToken, refreshToken)
    
    const data = await searchConsoleService.getTopQueries(
      siteUrl as string,
      startDate,
      endDate
    )
    
    res.json({
      success: true,
      data
    })
  } catch (error) {
    const details = getGoogleErrorDetails(error)
    console.error(`[analytics][${(req as any).reqId}] GSC top queries error:`, details)
    const status = (details as any)?.code === 401 ? 401 : 500
    res.status(status).json({ success: false, error: 'Failed to fetch top queries', details })
  }
})

router.get('/gsc/top-pages', async (req: Request, res: Response) => {
  try {
    const { siteUrl } = req.query
    const startDate = resolveDateParam(req.query.startDate as string | undefined, resolveDateParam('30daysAgo', ''))
    const endDate = resolveDateParam(req.query.endDate as string | undefined, resolveDateParam('today', ''))
    
    if (!siteUrl) {
      return res.status(400).json({
        success: false,
        error: 'Site URL is required'
      })
    }
    
    const { accessToken, refreshToken } = extractTokens(req)
    const searchConsoleService = createSearchConsoleService(accessToken, refreshToken)
    
    const data = await searchConsoleService.getTopPages(
      siteUrl as string,
      startDate,
      endDate
    )
    
    res.json({ success: true, data })
  } catch (error) {
    const details = getGoogleErrorDetails(error)
    console.error(`[analytics][${(req as any).reqId}] GSC top pages error:`, details)
    const status = (details as any)?.code === 401 ? 401 : 500
    res.status(status).json({ success: false, error: 'Failed to fetch top pages', details })
  }
})

router.get('/gsc/timeseries', async (req: Request, res: Response) => {
  try {
    const { siteUrl: rawSiteUrl } = req.query
    const siteUrl = typeof rawSiteUrl === 'string' ? decodeURIComponent(rawSiteUrl) : undefined
    const startDate = resolveDateParam(req.query.startDate as string | undefined, resolveDateParam('30daysAgo', ''))
    const endDate = resolveDateParam(req.query.endDate as string | undefined, resolveDateParam('today', ''))

    if (!siteUrl) {
      return res.status(400).json({ success: false, error: 'Site URL is required' })
    }

    const { accessToken, refreshToken } = extractTokens(req)
    const searchConsoleService = createSearchConsoleService(accessToken, refreshToken)

    const data = await searchConsoleService.getSearchAnalyticsByDate(siteUrl, startDate, endDate)
    res.json({ success: true, data })
  } catch (error) {
    const details = getGoogleErrorDetails(error)
    console.error(`[analytics][${(req as any).reqId}] GSC timeseries error:`, details)
    const status = (details as any)?.code === 401 ? 401 : 500
    res.status(status).json({ success: false, error: 'Failed to fetch search analytics timeseries', details })
  }
})

export default router