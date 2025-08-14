import { Router } from 'express';
import { google } from 'googleapis';
const router = Router();
// Google OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
// Scopes for Google Analytics and Search Console
const SCOPES = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly'
];
// Start OAuth flow
router.get('/google', (_req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // Force consent screen to get refresh token
    });
    res.redirect(authUrl);
});
// Handle OAuth callback
router.get('/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Authorization code is required' });
        }
        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getAccessToken({
            code,
            codeVerifier: undefined
        });
        if (!tokens.access_token) {
            return res.status(400).json({ error: 'Failed to get access token' });
        }
        // Set credentials for future API calls
        oauth2Client.setCredentials(tokens);
        // In a real app, you'd save these tokens to your database associated with the user
        // For now, we'll send them back to the frontend
        // Redirect to frontend with success
        res.redirect(`${process.env.CLIENT_URL}/setup?auth=success&access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`);
    }
    catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/setup?auth=error`);
    }
});
// Get user's Google Analytics properties
router.get('/google/analytics/accounts', async (_req, res) => {
    try {
        // You'll need to pass the access token via header or query param in a real app
        const analytics = google.analyticsadmin({ version: 'v1alpha', auth: oauth2Client });
        const response = await analytics.accounts.list();
        const accounts = response.data.accounts || [];
        // Get properties for each account
        const propertiesPromises = accounts.map(async (account) => {
            if (!account.name)
                return { account, properties: [] };
            const propertiesResponse = await analytics.properties.list({
                filter: `parent:${account.name}`
            });
            return {
                account,
                properties: propertiesResponse.data.properties || []
            };
        });
        const accountsWithProperties = await Promise.all(propertiesPromises);
        res.json({
            success: true,
            data: accountsWithProperties
        });
    }
    catch (error) {
        console.error('Analytics accounts error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Analytics accounts'
        });
    }
});
// Get user's Search Console sites
router.get('/google/searchconsole/sites', async (_req, res) => {
    try {
        const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
        const response = await searchconsole.sites.list();
        const sites = response.data.siteEntry || [];
        res.json({
            success: true,
            data: sites
        });
    }
    catch (error) {
        console.error('Search Console sites error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Search Console sites'
        });
    }
});
export default router;
