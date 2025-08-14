import { Router } from 'express';
import { createAnalyticsService } from '../../services/google/analytics.js';
import { createSearchConsoleService } from '../../services/google/searchconsole.js';
const router = Router();
// Middleware to extract tokens from headers
const extractTokens = (req) => {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const refreshToken = req.headers['x-refresh-token'];
    if (!accessToken) {
        throw new Error('Access token is required');
    }
    return { accessToken, refreshToken };
};
// Google Analytics routes
router.get('/ga4/properties', async (req, res) => {
    try {
        const { accessToken, refreshToken } = extractTokens(req);
        const analyticsService = createAnalyticsService(accessToken, refreshToken);
        const properties = await analyticsService.getProperties();
        res.json({
            success: true,
            data: properties
        });
    }
    catch (error) {
        console.error('GA4 properties error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch GA4 properties'
        });
    }
});
router.get('/ga4/realtime/:propertyId', async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { accessToken, refreshToken } = extractTokens(req);
        const analyticsService = createAnalyticsService(accessToken, refreshToken);
        const data = await analyticsService.getRealtimeReport(propertyId);
        res.json({
            success: true,
            data
        });
    }
    catch (error) {
        console.error('GA4 realtime error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch realtime data'
        });
    }
});
router.get('/ga4/report/:propertyId', async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { startDate = '30daysAgo', endDate = 'today' } = req.query;
        const { accessToken, refreshToken } = extractTokens(req);
        const analyticsService = createAnalyticsService(accessToken, refreshToken);
        const data = await analyticsService.getReport(propertyId, startDate, endDate);
        res.json({
            success: true,
            data
        });
    }
    catch (error) {
        console.error('GA4 report error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics report'
        });
    }
});
router.get('/ga4/top-pages/:propertyId', async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { startDate = '30daysAgo', endDate = 'today' } = req.query;
        const { accessToken, refreshToken } = extractTokens(req);
        const analyticsService = createAnalyticsService(accessToken, refreshToken);
        const data = await analyticsService.getTopPages(propertyId, startDate, endDate);
        res.json({
            success: true,
            data
        });
    }
    catch (error) {
        console.error('GA4 top pages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top pages'
        });
    }
});
// Google Search Console routes
router.get('/gsc/sites', async (req, res) => {
    try {
        const { accessToken, refreshToken } = extractTokens(req);
        const searchConsoleService = createSearchConsoleService(accessToken, refreshToken);
        const sites = await searchConsoleService.getSites();
        res.json({
            success: true,
            data: sites
        });
    }
    catch (error) {
        console.error('GSC sites error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Search Console sites'
        });
    }
});
router.get('/gsc/search-analytics', async (req, res) => {
    try {
        const { siteUrl, startDate = '2023-01-01', endDate = '2023-12-31' } = req.query;
        if (!siteUrl) {
            return res.status(400).json({
                success: false,
                error: 'Site URL is required'
            });
        }
        const { accessToken, refreshToken } = extractTokens(req);
        const searchConsoleService = createSearchConsoleService(accessToken, refreshToken);
        const data = await searchConsoleService.getSearchAnalytics(siteUrl, startDate, endDate);
        res.json({
            success: true,
            data
        });
    }
    catch (error) {
        console.error('GSC search analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch search analytics'
        });
    }
});
router.get('/gsc/top-queries', async (req, res) => {
    try {
        const { siteUrl, startDate = '2023-01-01', endDate = '2023-12-31' } = req.query;
        if (!siteUrl) {
            return res.status(400).json({
                success: false,
                error: 'Site URL is required'
            });
        }
        const { accessToken, refreshToken } = extractTokens(req);
        const searchConsoleService = createSearchConsoleService(accessToken, refreshToken);
        const data = await searchConsoleService.getTopQueries(siteUrl, startDate, endDate);
        res.json({
            success: true,
            data
        });
    }
    catch (error) {
        console.error('GSC top queries error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top queries'
        });
    }
});
export default router;
