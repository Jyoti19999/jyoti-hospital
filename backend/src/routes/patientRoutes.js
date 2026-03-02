// src/routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const staffController = require('../controllers/staffController');
const { authenticateToken, requirePatient, requireAdminOrStaff } = require('../middleware/auth');

// Patient registration routes (public)
router.post('/send-otp', patientController.sendRegistrationOTP);
router.post('/verify-otp', patientController.verifyOTPAndRegister);
router.post('/resend-otp', patientController.resendRegistrationOTP);

// Patient authentication routes (public)
router.post('/login', patientController.loginPatient);
router.post('/logout', authenticateToken, requirePatient, patientController.logoutPatient);

// Patient OTP login routes (public)
router.post('/send-login-otp', patientController.sendLoginOTP);
router.post('/verify-login-otp', patientController.verifyLoginOTP);
router.post('/resend-login-otp', patientController.resendLoginOTP);

// Patient authenticated routes
router.get('/profile', authenticateToken, requirePatient, patientController.getPatientProfile);
router.put('/profile/personal-info', authenticateToken, requirePatient, patientController.updatePersonalInfo);
router.put('/profile/contact', authenticateToken, requirePatient, patientController.updateContactInfo);
router.put('/profile/medical-history', authenticateToken, requirePatient, patientController.updateMedicalHistory);
router.put('/profile/photo', authenticateToken, requirePatient, patientController.updateProfilePhoto);
router.get('/appointments', authenticateToken, requirePatient, patientController.getPatientAppointments);
router.get('/medical-records', authenticateToken, requirePatient, patientController.getPatientMedicalRecords);
router.get('/prescriptions', authenticateToken, requirePatient, patientController.getPatientPrescriptions);

// Patient referral system - register family members (patient only)
router.post('/register-family-member', authenticateToken, requirePatient, staffController.registerPatientByPatient);

// Family management routes (patient only)
router.get('/family-members', authenticateToken, requirePatient, patientController.getFamilyMembers);
router.get('/current-family-members', authenticateToken, requirePatient, patientController.getCurrentPatientFamilyMembers);
router.post('/switch-to-family/:familyMemberPatientId', authenticateToken, requirePatient, patientController.switchToFamilyMember);

// Appointment slots - fetch real-time slot availability (patient only)
router.get('/appointments-by-date', authenticateToken, requirePatient, staffController.getAppointmentsByDate);

// Appointment booking routes (patient only)
router.post('/book-appointment', authenticateToken, requirePatient, patientController.bookAppointment);
router.patch('/update-appointment-qr/:appointmentId', authenticateToken, requirePatient, patientController.updateAppointmentQR);

// Staff registration route (staff only) - test route first
router.post('/test-staff', authenticateToken, requireAdminOrStaff, (req, res) => {
  res.json({ success: true, message: 'Test route works' });
});

// router.post('/register-by-staff', authenticateToken, requireAdminOrStaff, patientController.registerPatientByStaff);

// Doctor information routes (accessible by both staff and patients)
router.get('/doctors/list', authenticateToken, patientController.getDoctorsList);

// Patient information routes (admin/staff only)
router.get('/:patientNumber', authenticateToken, requireAdminOrStaff, patientController.getPatientByNumber);
router.get('/statistics/overview', authenticateToken, requireAdminOrStaff, patientController.getPatientStatistics);

// Patient visit history route (admin/staff only)
router.get('/visit-history/:patientId', authenticateToken, requireAdminOrStaff, patientController.getPatientVisitHistory);

module.exports = router;