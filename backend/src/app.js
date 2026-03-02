// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
// const morgan = require('morgan');
require('dotenv').config();

const app = express();

// CORS configuration - MUST come before helmet
// Dynamic origin validation for production-grade security
const allowedPublicIP = 'http://45.119.47.81';

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (
      origin === allowedPublicIP ||
      origin.startsWith('http://192.168.0.') ||
      origin.startsWith('https://192.168.0.') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('https://localhost')
    ) {
      callback(null, true);
    } else {
      console.warn('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cookie',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly - removed wildcard route as CORS middleware already handles this

// 📄 Special route for PDFs - BEFORE helmet to avoid X-Frame-Options
app.get('/uploads/pdfs/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/pdfs', filename);

  // Set headers to allow iframe embedding
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Explicitly do NOT set X-Frame-Options

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ PDF Error:', err.message);
      res.status(404).json({ error: 'PDF not found', path: filename });
    } else {
      console.log('✅ PDF sent successfully');
    }
  });
});

// Helmet middleware - AFTER CORS and PDF route
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP for API
  frameguard: false // Disable X-Frame-Options to allow PDFs in iframes
}));

// Other middleware
// app.use(morgan('combined'));
app.use(cookieParser()); // Parse cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Additional middleware to set CORS headers manually (backup)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (origin) {
    if (
      origin === 'http://45.119.47.81' ||
      origin.startsWith('http://192.168.0.') ||
      origin.startsWith('https://192.168.0.') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('https://localhost')
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});

// 📁 Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  // Add security headers for uploaded files
  setHeaders: (res, filePath) => {
    // Set appropriate content type for images and PDFs
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline'); // Display in browser, not download

    }

    // Cache files for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Routes
const superAdminRoutes = require('./routes/superAdminRoutes');
const staffRoutes = require('./routes/staffRoutes');
const patientRoutes = require('./routes/patientRoutes');
const optometristRoutes = require('./routes/optometristRoutes');
const ophthalmologistRoutes = require('./routes/ophthalmologistRoutes');
const receptionist2Routes = require('./routes/receptionist2Routes');
const medicalReportsRoutes = require('./routes/medicalReportsRoutes');
const diagnosisMasterRoutes = require('./routes/diagnosisMasterRoutes');
const medicineMasterRoutes = require('./routes/medicineMasterRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const letterheadRoutes = require('./routes/letterheadRoutes');
const registerRoutes = require('./routes/registerRoutes');
const digitalRegisterRoutes = require('./routes/digitalRegisterRoutes');
const ipdRoutes = require('./routes/ipdRoutes');
const surgeryRoutes = require('./routes/surgeryRoutes');
const surgeryTypeRoutes = require('./routes/surgeryTypeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const staffTypeRoutes = require('./routes/staffTypeRoutes');
const fitnessInvestigationRoutes = require('./routes/fitnessInvestigationRoutes');
const eyeDropReasonRoutes = require('./routes/eyeDropReasonRoutes');
const lensRoutes = require('./routes/lensRoutes');
const lensStockRoutes = require('./routes/lensStock');
const equipmentRoutes = require('./routes/equipment');
const dashboardRoutes = require('./routes/dashboardRoutes');
const otAdminRoutes = require('./routes/otAdminRoutes');
const otRoomRoutes = require('./routes/otRoomRoutes');
const otEquipmentRoutes = require('./routes/otEquipmentRoutes');
const consentFormRoutes = require('./routes/consentFormRoutes');
const billingRoutes = require('./routes/billingRoutes');
const claimRoutes = require('./routes/claimRoutes');
const insuranceProviderRoutes = require('./routes/insuranceProviderRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const notificationAudioRoutes = require('./routes/notificationAudioRoutes');
const databaseViewerRoutes = require('./routes/databaseViewerRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const selfCheckinRoutes = require('./routes/selfCheckinRoutes');
const displayRoutes = require('./routes/displayRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const leaveRoutes = require('./routes/leaveRoutes');

// API v1 routes
app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/staff-types', staffTypeRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/optometrist', optometristRoutes);
app.use('/api/v1/ophthalmologist', ophthalmologistRoutes);
app.use('/api/v1/receptionist2', receptionist2Routes);
app.use('/api/v1/medical-reports', medicalReportsRoutes);
app.use('/api/v1/diagnosis-master', diagnosisMasterRoutes);
app.use('/api/v1/medicine-master', medicineMasterRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/registers', registerRoutes);
app.use('/api/v1/letterhead', letterheadRoutes);
app.use('/api/v1/digital-registers', digitalRegisterRoutes);
app.use('/api/v1/ipd', ipdRoutes);
app.use('/api/v1/surgery', surgeryRoutes);
app.use('/api/v1/surgery-types', surgeryTypeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/fitness-investigations', fitnessInvestigationRoutes);
app.use('/api/v1/eye-drop-reasons', eyeDropReasonRoutes);
app.use('/api/v1/lenses', lensRoutes);
app.use('/api/v1/lens-stock', lensStockRoutes);
app.use('/api/v1/equipment', equipmentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/ot-admin', otAdminRoutes);
app.use('/api/v1/ot-rooms', otRoomRoutes);
app.use('/api/v1/ot-equipment', otEquipmentRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/consent-forms', consentFormRoutes);
app.use('/api/v1/claims', claimRoutes);
app.use('/api/v1/insurance-providers', insuranceProviderRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin/notification-audios', notificationAudioRoutes);
app.use('/api/v1/database-viewer', databaseViewerRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/self-checkin', selfCheckinRoutes);
app.use('/api/v1/display', displayRoutes);
app.use('/api/v1/salary', salaryRoutes);
app.use('/api/v1/leave', leaveRoutes);

// Health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'OHMS backend server is running',
    timestamp: new Date().toISOString(),
    cors: {
      origin: req.headers.origin,
      allowedOrigins: [
        'Public IP: http://45.119.47.81',
        'LAN subnet: http://192.168.0.* (all devices)',
        'Localhost: http://localhost:* (development)'
      ]
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('OHMS Backend is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      origin: req.headers.origin
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    method: req.method
  });
});

const PORT = process.env.PORT || 3000;

// Create HTTP server for Socket.IO
const http = require('http');
const server = http.createServer(app);

// Initialize Socket.IO
const { initializeSocket } = require('./socket');
initializeSocket(server);

// Initialize Scheduled Tasks
const scheduledTasks = require('./services/scheduledTasks');

server.listen(PORT, () => {
  console.log(`OHMS backend server running on port ${PORT}`);
  console.log('🌐 Allowed CORS origins:');
  console.log('  ✅ Public IP: http://45.119.47.81');
  console.log('  ✅ LAN subnet: http://192.168.0.* (all devices on local network)');
  console.log('  ✅ Localhost: http://localhost:* (development)');

  // Start scheduled tasks
  scheduledTasks.initializeTasks();
  console.log('✅ Scheduled tasks initialized');
});

module.exports = app;