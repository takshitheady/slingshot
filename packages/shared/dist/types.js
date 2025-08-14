import { z } from 'zod';
// Brand schemas
export const brandSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    domain: z.string().url().or(z.string().min(1)),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    created_by: z.string().uuid()
});
export const createBrandSchema = z.object({
    name: z.string().min(1, 'Brand name is required'),
    domain: z.string().min(1, 'Domain is required')
});
// Google integration schemas
export const googleIntegrationSchema = z.object({
    id: z.string().uuid(),
    brand_id: z.string().uuid(),
    integration_type: z.enum(['GA4', 'GSC']),
    property_id: z.string().optional(),
    status: z.string().default('pending'),
    last_sync: z.string().datetime().optional(),
    created_at: z.string().datetime()
});
// Analytics data schemas
export const analyticsSnapshotSchema = z.object({
    id: z.string().uuid(),
    brand_id: z.string().uuid(),
    source: z.enum(['GA4', 'GSC']),
    metric_type: z.string(),
    data: z.record(z.any()),
    date_from: z.string().date(),
    date_to: z.string().date(),
    created_at: z.string().datetime()
});
// Chat schemas
export const chatSessionSchema = z.object({
    id: z.string().uuid(),
    brand_id: z.string().uuid(),
    user_id: z.string().uuid(),
    title: z.string().optional(),
    created_at: z.string().datetime()
});
export const chatMessageSchema = z.object({
    id: z.string().uuid(),
    session_id: z.string().uuid(),
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    metadata: z.record(z.any()).optional(),
    created_at: z.string().datetime()
});
// Dashboard schemas
export const dashboardConfigSchema = z.object({
    id: z.string().uuid(),
    brand_id: z.string().uuid(),
    name: z.string(),
    config: z.record(z.any()),
    is_default: z.boolean().default(false),
    created_at: z.string().datetime()
});
// API response schemas
export const apiResponseSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
    message: z.string().optional()
});
