// src/routes/staffRoutes.js
const express = require('express');
const router = express.Router();
const { 
  loginStaff,
  logoutStaff,
  getStaffProfile, 
  updateStaffProfile,
  registerPatientByStaff,
  changeStaffPassword,
  uploadProfilePhoto,
  getTodayAppointments,
  getTodayAppointmentPatients,
  getDashboardStatistics,
  getAllPatients,
  bookInstantAppointmentByStaff
} = require('../controllers/staffController');
const { 
  authenticateToken, 
  requireStaff,
  requireDoctor,
  requireAdminOrStaff,
  requireNurse,
  requireClinicalStaff 
} = require('../middleware/auth');

const { uploadStaffFiles, handleUploadError } = require('../middleware/upload');

// Public routes (no authentication required)
router.post('/login', loginStaff);
router.post('/logout', logoutStaff);

// Staff-only routes (require staff authentication)
router.get('/profile', authenticateToken, requireStaff, getStaffProfile);
router.put('/profile', authenticateToken, requireStaff, updateStaffProfile);
router.put('/change-password', authenticateToken, requireStaff, changeStaffPassword);

// Profile photo upload route
router.post('/upload-profile-photo', 
  authenticateToken, 
  requireStaff, 
  uploadStaffFiles, 
  handleUploadError, 
  uploadProfilePhoto
);

// Ref: src/rotes/staffRoutes.js
router.post('/register-by-staff', authenticateToken, requireAdminOrStaff, registerPatientByStaff);

// Check for existing patients by phone number (for registration)
router.get('/check-existing-patients-by-phone', authenticateToken, requireAdminOrStaff, require('../controllers/staffController').getPatientsByPhone);

// Register patient with custom appointment time
router.post('/register-with-appointment-time', authenticateToken, requireAdminOrStaff, require('../controllers/staffController').registerPatientWithAppointmentTime);

// Get today's appointments for check-in
router.get('/today-appointments', authenticateToken, requireStaff, getTodayAppointments);

// Get patient IDs who have appointments today (for Quick Appointment Booking)
router.get('/today-appointment-patients', authenticateToken, requireStaff, getTodayAppointmentPatients);

// Get daily appointments (new endpoint accessible by all staff)
router.get('/daily-appointments', authenticateToken, requireStaff, require('../controllers/staffController').getDailyAppointments);

// Get all future appointments (for scheduled appointments view)
router.get('/all-appointments', authenticateToken, requireStaff, require('../controllers/staffController').getAllFutureAppointments);

// Get appointments by date with slot-wise counts
router.get('/appointments-by-date', authenticateToken, requireStaff, require('../controllers/staffController').getAppointmentsByDate);

// Reschedule appointment
router.post('/reschedule-appointment', authenticateToken, requireStaff, require('../controllers/staffController').rescheduleAppointment);

// Cancel appointment
router.post('/cancel-appointment', authenticateToken, requireStaff, require('../controllers/staffController').cancelAppointment);

router.get('/patient/:patientId', authenticateToken, requireStaff, require('../controllers/staffController').getPatientById);

// Get patient appointments by patient ID (for staff to view appointment history)
router.get('/patient/:patientId/appointments', authenticateToken, requireStaff, require('../controllers/staffController').getPatientAppointmentsByStaff);

// Get weekly patient arrivals for dashboard chart
router.get('/weekly-patient-arrivals', authenticateToken, requireStaff, require('../controllers/staffController').getWeeklyPatientArrivals);

// Get dashboard statistics (today's registrations and appointments)
router.get('/dashboard-statistics', authenticateToken, requireStaff, getDashboardStatistics);

// Get all patients for appointment booking
router.get('/all-patients', authenticateToken, requireStaff, getAllPatients);

// Book instant appointment by staff
router.post('/book-instant-appointment', authenticateToken, requireStaff, bookInstantAppointmentByStaff);

// Patient check-in routes (staff access)
router.post('/patient/checkin', authenticateToken, requireStaff, require('../controllers/patientController').checkInPatient);
router.get('/patient/appointment/:tokenNumber', authenticateToken, requireStaff, require('../controllers/patientController').getAppointmentByToken);

// Queue management routes (staff only)
router.post('/queue/add-patient', authenticateToken, requireStaff, require('../controllers/staffController').addPatientToQueue);
router.get('/queue/checked-in-patients', authenticateToken, requireStaff, require('../controllers/staffController').getCheckedInPatients);
router.patch('/queue/update-priority/:queueEntryId', authenticateToken, requireStaff, require('../controllers/staffController').updateQueuePriority);
router.get('/queue/:queueFor/status', authenticateToken, requireStaff, require('../controllers/patientController').getQueueStatus);
// Doctor-specific queue data accessible to all staff
router.get('/queue/doctor-specific', authenticateToken, requireStaff, require('../controllers/receptionist2Controller').getDoctorSpecificQueues);

// Role-specific dashboard routes
router.get('/doctor/dashboard', authenticateToken, requireDoctor, (req, res) => {
  res.json({ 
    message: 'Doctor dashboard', 
    data: {
      user: req.user,
      features: ['Patient Management', 'Appointment Scheduling', 'Prescription Management', 'Medical Records']
    }
  });
});

router.get('/nurse/dashboard', authenticateToken, requireNurse, (req, res) => {
  res.json({ 
    message: 'Nurse dashboard', 
    data: {
      user: req.user,
      features: ['Patient Care', 'Medication Administration', 'Vital Signs', 'Patient Monitoring']
    }
  });
});

router.get('/technician/dashboard', authenticateToken, (req, res) => {
  if (req.user.staffType !== 'technician') {
    return res.status(403).json({ error: 'Access denied. Technician role required.' });
  }
  res.json({ 
    message: 'Technician dashboard', 
    data: {
      user: req.user,
      features: ['Equipment Management', 'Diagnostic Tests', 'Lab Reports', 'Maintenance']
    }
  });
});

router.get('/optometrist/dashboard', authenticateToken, (req, res) => {
  if (req.user.staffType !== 'optometrist') {
    return res.status(403).json({ error: 'Access denied. Optometrist role required.' });
  }
  res.json({ 
    message: 'Optometrist dashboard', 
    data: {
      user: req.user,
      features: ['Eye Examinations', 'Vision Testing', 'Prescription Management', 'Patient Records']
    }
  });
});

router.get('/receptionist/dashboard', authenticateToken, (req, res) => {
  if (req.user.staffType !== 'receptionist') {
    return res.status(403).json({ error: 'Access denied. Receptionist role required.' });
  }
  res.json({ 
    message: 'Receptionist dashboard', 
    data: {
      user: req.user,
      features: ['Appointment Booking', 'Patient Registration', 'Queue Management', 'Front Desk Operations']
    }
  });
});

router.get('/receptionist2/dashboard', authenticateToken, (req, res) => {
  if (req.user.staffType !== 'receptionist2') {
    return res.status(403).json({ error: 'Access denied. Receptionist2 role required.' });
  }
  res.json({ 
    message: 'Receptionist2 dashboard', 
    data: {
      user: req.user,
      features: ['View Optometrist Checked Patients', 'Patient Queue Status', 'Examination Details', 'Patient Search']
    }
  });
});

router.get('/admin/dashboard', authenticateToken, (req, res) => {
  if (req.user.staffType !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  res.json({ 
    message: 'Admin dashboard', 
    data: {
      user: req.user,
      features: ['User Management', 'System Administration', 'Reports', 'Configuration']
    }
  });
});

// Clinical staff routes (doctors, nurses, technicians)
router.get('/clinical/dashboard', authenticateToken, requireClinicalStaff, (req, res) => {
  res.json({ 
    message: 'Clinical staff dashboard', 
    data: {
      user: req.user,
      features: ['Patient Care', 'Medical Records', 'Clinical Workflows', 'Treatment Plans']
    }
  });
});

module.exports = router;