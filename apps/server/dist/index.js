import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import googleAuthRoutes from './routes/auth/google.js';
import googleAnalyticsRoutes from './routes/analytics/google.js';
dotenv.config();
const app = express();
const PORT = process.env.SERVER_PORT || 3000;
// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// API routes
app.use('/auth', googleAuthRoutes);
app.use('/api/analytics/google', googleAnalyticsRoutes);
app.use('/api/brands', (_req, res) => res.json({ message: 'Brand routes - coming soon' }));
app.use('/api/chat', (_req, res) => res.json({ message: 'Chat routes - coming soon' }));
// 404 handler
app.use('*', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Error handler
app.use((error, _req, res, _next) => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Slingshot API ready`);
});
export default app;
