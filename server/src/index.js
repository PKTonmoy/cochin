/**
 * PARAGON Coaching Center - Server Entry Point
 * Main Express application setup with all middleware and routes
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { initializeSocket } = require('./services/socketService');
const { initializeCronJobs } = require('./services/cronJobs');

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const receiptRoutes = require('./routes/receipts');
const testRoutes = require('./routes/tests');
const resultRoutes = require('./routes/results');
const uploadRoutes = require('./routes/uploads');
const siteContentRoutes = require('./routes/siteContent');
const dashboardRoutes = require('./routes/dashboard');
const attendanceRoutes = require('./routes/attendance');
const classRoutes = require('./routes/classes');
const notificationRoutes = require('./routes/notifications');
const scheduleTemplateRoutes = require('./routes/scheduleTemplates');
const cmsRoutes = require('./routes/cms');
const workflowRoutes = require('./routes/workflow');

// CMS Content routes
const settingsRoutes = require('./routes/settings');
const courseRoutes = require('./routes/courses');
const facultyRoutes = require('./routes/faculty');
const topperRoutes = require('./routes/toppers');
const testimonialRoutes = require('./routes/testimonials');
const mediaRoutes = require('./routes/media');
const smsRoutes = require('./routes/sms');

const app = express();

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.io
initializeSocket(server);

// Initialize cron jobs (only in production or if explicitly enabled)
if (process.env.NODE_ENV !== 'test') {
  initializeCronJobs();
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploaded content
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/receipts', express.static(path.join(__dirname, '../receipts')));

// Serve Frontend in Production
// Set static folder
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Catch-all route is moved to the end to avoid blocking API routes


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PARAGON API is running',
    timestamp: new Date().toISOString(),
    features: {
      socketio: true,
      notifications: true,
      cronJobs: process.env.NODE_ENV !== 'test'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/schedule-templates', scheduleTemplateRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/leads', require('./routes/leads'));

// CMS Content routes
app.use('/api/settings', settingsRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/toppers', topperRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/sms', smsRoutes);

// Serve Frontend in Production (Catch-all for SPA)
const clientBuildPath = path.join(__dirname, '../../client/dist');
const indexHtmlPath = path.join(clientBuildPath, 'index.html');
const fs = require('fs');

if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(indexHtmlPath);
  });
} else if (process.env.NODE_ENV === 'production') {
  console.warn('⚠️  Production mode detected but client build not found at:', clientBuildPath);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 PARAGON Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Socket.io enabled`);
    console.log(`⏰ Cron jobs initialized`);
  });
}

module.exports = app;
