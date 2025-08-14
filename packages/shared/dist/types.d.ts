import { z } from 'zod';
export declare const brandSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    domain: z.ZodUnion<[z.ZodString, z.ZodString]>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
    created_by: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    domain: string;
    created_at: string;
    updated_at: string;
    created_by: string;
}, {
    id: string;
    name: string;
    domain: string;
    created_at: string;
    updated_at: string;
    created_by: string;
}>;
export declare const createBrandSchema: z.ZodObject<{
    name: z.ZodString;
    domain: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    domain: string;
}, {
    name: string;
    domain: string;
}>;
export declare const googleIntegrationSchema: z.ZodObject<{
    id: z.ZodString;
    brand_id: z.ZodString;
    integration_type: z.ZodEnum<["GA4", "GSC"]>;
    property_id: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodString>;
    last_sync: z.ZodOptional<z.ZodString>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: string;
    created_at: string;
    brand_id: string;
    integration_type: "GA4" | "GSC";
    property_id?: string | undefined;
    last_sync?: string | undefined;
}, {
    id: string;
    created_at: string;
    brand_id: string;
    integration_type: "GA4" | "GSC";
    status?: string | undefined;
    property_id?: string | undefined;
    last_sync?: string | undefined;
}>;
export declare const analyticsSnapshotSchema: z.ZodObject<{
    id: z.ZodString;
    brand_id: z.ZodString;
    source: z.ZodEnum<["GA4", "GSC"]>;
    metric_type: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
    date_from: z.ZodString;
    date_to: z.ZodString;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    brand_id: string;
    source: "GA4" | "GSC";
    metric_type: string;
    data: Record<string, any>;
    date_from: string;
    date_to: string;
}, {
    id: string;
    created_at: string;
    brand_id: string;
    source: "GA4" | "GSC";
    metric_type: string;
    data: Record<string, any>;
    date_from: string;
    date_to: string;
}>;
export declare const chatSessionSchema: z.ZodObject<{
    id: z.ZodString;
    brand_id: z.ZodString;
    user_id: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    brand_id: string;
    user_id: string;
    title?: string | undefined;
}, {
    id: string;
    created_at: string;
    brand_id: string;
    user_id: string;
    title?: string | undefined;
}>;
export declare const chatMessageSchema: z.ZodObject<{
    id: z.ZodString;
    session_id: z.ZodString;
    role: z.ZodEnum<["user", "assistant"]>;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    session_id: string;
    role: "user" | "assistant";
    content: string;
    metadata?: Record<string, any> | undefined;
}, {
    id: string;
    created_at: string;
    session_id: string;
    role: "user" | "assistant";
    content: string;
    metadata?: Record<string, any> | undefined;
}>;
export declare const dashboardConfigSchema: z.ZodObject<{
    id: z.ZodString;
    brand_id: z.ZodString;
    name: z.ZodString;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
    is_default: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    created_at: string;
    brand_id: string;
    config: Record<string, any>;
    is_default: boolean;
}, {
    id: string;
    name: string;
    created_at: string;
    brand_id: string;
    config: Record<string, any>;
    is_default?: boolean | undefined;
}>;
export declare const apiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    message?: string | undefined;
    data?: any;
    error?: string | undefined;
}, {
    success: boolean;
    message?: string | undefined;
    data?: any;
    error?: string | undefined;
}>;
export type Brand = z.infer<typeof brandSchema>;
export type CreateBrand = z.infer<typeof createBrandSchema>;
export type GoogleIntegration = z.infer<typeof googleIntegrationSchema>;
export type AnalyticsSnapshot = z.infer<typeof analyticsSnapshotSchema>;
export type ChatSession = z.infer<typeof chatSessionSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;
export type ApiResponse<T = any> = z.infer<typeof apiResponseSchema> & {
    data?: T;
};
