import { Router, Request, Response } from 'express'
import { supabase } from '../services/supabase.js'

const router: Router = Router()

// Lightweight request logger for this router
router.use((req, _res, next) => {
  const reqId = Math.random().toString(36).slice(2, 8)
  ;(req as any).reqId = reqId
  const { method, originalUrl } = req
  console.log(`[brands] [${reqId}] ${method} ${originalUrl}`)
  next()
})

// Create a brand
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, domain, created_by } = req.body || {}
    if (!name || !domain) {
      return res.status(400).json({ success: false, error: 'name and domain are required' })
    }

    const { data, error } = await supabase
      .from('brands')
      .insert({ name, domain, created_by: created_by ?? null })
      .select()
      .single()

    if (error) {
      console.error(`[brands][${(req as any).reqId}] create error:`, error)
      return res.status(500).json({ success: false, error: 'Failed to create brand', details: error.message })
    }

    return res.json({ success: true, data })
  } catch (error) {
    console.error(`[brands][${(req as any).reqId}] create error:`, error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// List integrations for a brand
router.get('/:brandId/integrations', async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params
    const { data, error } = await supabase
      .from('google_integrations')
      .select('*')
      .eq('brand_id', brandId)

    if (error) {
      console.error(`[brands][${(req as any).reqId}] list integrations error:`, error)
      return res.status(500).json({ success: false, error: 'Failed to list integrations', details: error.message })
    }

    return res.json({ success: true, data })
  } catch (error) {
    console.error(`[brands][${(req as any).reqId}] list integrations error:`, error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Create or update a Google integration for a brand
router.post('/:brandId/integrations/google', async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params
    const { integration_type, property_id, refresh_token, credentials } = req.body || {}

    if (!integration_type || (integration_type !== 'GA4' && integration_type !== 'GSC')) {
      return res.status(400).json({ success: false, error: "integration_type must be 'GA4' or 'GSC'" })
    }

    const payload: any = {
      brand_id: brandId,
      integration_type,
      status: 'connected',
    }
    if (property_id) payload.property_id = property_id
    if (refresh_token) payload.refresh_token = refresh_token
    if (credentials) payload.credentials = credentials

    const { data, error } = await supabase
      .from('google_integrations')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error(`[brands][${(req as any).reqId}] upsert integration error:`, error)
      return res.status(500).json({ success: false, error: 'Failed to save Google integration', details: error.message })
    }

    return res.json({ success: true, data })
  } catch (error) {
    console.error(`[brands][${(req as any).reqId}] upsert integration error:`, error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router


