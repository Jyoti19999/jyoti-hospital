// Example: Staff Registration Data Structure
// This shows how data will be sent from frontend to backend

// 1. DOCTOR REGISTRATION EXAMPLE
const doctorRegistrationData = {
  // Basic Information (common for all staff)
  firstName: "Dr. Rajesh",
  lastName: "Sharma",
  email: "rajesh.sharma@eyehospital.com",
  phone: "+91-9876543210",
  dateOfBirth: "1985-05-15",
  gender: "male",
  address: "123 Medical District, Mumbai, Maharashtra, 400001",
  emergencyContact: "Priya Sharma - +91-9876543211",
  
  // Employment Details
  staffType: "doctor",
  department: "ophthalmology",
  joiningDate: "2024-01-15",
  
  // Role-specific data (goes to doctorProfile JSON field)
  roleSpecificData: {
    medicalLicenseNumber: "MH12345",
    medicalCouncil: "Maharashtra Medical Council",
    mbbsDegree: "MBBS from Grant Medical College",
    specialtyDegree: "MS Ophthalmology from KEM Hospital",
    experienceYears: 12,
    consultationFee: 1500,
    subspecialty: ["retina", "glaucoma"],
    equipmentCertified: ["OCT", "Fundus Camera", "Phaco Machine"],
    fellowshipDetails: [
      {
        type: "Retina Fellowship",
        institution: "Sankara Nethralaya",
        year: 2018
      }
    ],
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    workingHours: {
      1: { start: "09:00", end: "17:00" },
      2: { start: "09:00", end: "17:00" },
      3: { start: "09:00", end: "17:00" },
      4: { start: "09:00", end: "17:00" },
      5: { start: "09:00", end: "17:00" }
    },
    maxPatientsPerDay: 25,
    surgicalCompetencies: {
      "cataract": "expert",
      "retinal": "intermediate",
      "glaucoma": "expert"
    }
  }
};

// 2. NURSE REGISTRATION EXAMPLE
const nurseRegistrationData = {
  firstName: "Sunita",
  lastName: "Patil",
  email: "sunita.patil@eyehospital.com",
  phone: "+91-9876543212",
  dateOfBirth: "1990-08-20",
  gender: "female",
  address: "456 Nursing Colony, Pune, Maharashtra, 411001",
  emergencyContact: "Amit Patil - +91-9876543213",
  
  staffType: "nurse",
  department: "ophthalmology",
  joiningDate: "2024-02-01",
  
  // Role-specific data (goes to nurseProfile JSON field)
  roleSpecificData: {
    nursingLicenseNumber: "NUR12345",
    nursingDegree: "BSc Nursing",
    shiftType: "day",
    maxPatientsAssigned: 8,
    wardAssigned: ["OPD", "OR"],
    ophthalmicTraining: true,
    injectionCertified: true,
    patientEducation: true,
    emergencyResponse: true,
    specialtyTraining: ["Ophthalmic Nursing", "OR Assistance"],
    equipmentHandling: ["Autorefractor", "NCT", "Visual Field"]
  }
};

// 3. TECHNICIAN REGISTRATION EXAMPLE
const technicianRegistrationData = {
  firstName: "Ravi",
  lastName: "Kumar",
  email: "ravi.kumar@eyehospital.com",
  phone: "+91-9876543214",
  dateOfBirth: "1992-12-10",
  gender: "male",
  address: "789 Tech Park, Bangalore, Karnataka, 560001",
  emergencyContact: "Meera Kumar - +91-9876543215",
  
  staffType: "technician",
  department: "ophthalmology",
  joiningDate: "2024-03-01",
  
  // Role-specific data (goes to technicianProfile JSON field)
  roleSpecificData: {
    technicianCertification: "Certified Ophthalmic Technician",
    specialization: "imaging",
    diagnosticEquipment: ["OCT", "Fundus Camera", "Perimeter", "Autorefractor"],
    maintenanceSkills: ["OCT Calibration", "Camera Maintenance"],
    reportGeneration: true,
    patientPreparation: true
  }
};

// 4. BACKEND PROCESSING EXAMPLE
// How the backend will process this data:

function processStaffRegistration(requestData) {
  const { staffType, roleSpecificData, ...basicData } = requestData;
  
  // Prepare data for database
  const staffData = {
    ...basicData,
    staffType,
    // Dynamically assign to appropriate profile field
    [`${staffType}Profile`]: roleSpecificData
  };
  
  // Example result for doctor:
  // {
  //   firstName: "Dr. Rajesh",
  //   lastName: "Sharma",
  //   staffType: "doctor",
  //   doctorProfile: { medicalLicenseNumber: "MH12345", ... },
  //   nurseProfile: null,
  //   technicianProfile: null,
  //   etc.
  // }
  
  return staffData;
}

// 5. VALIDATION SCHEMAS (for backend)
const validationSchemas = {
  doctor: {
    medicalLicenseNumber: { required: true, type: "string" },
    consultationFee: { required: true, type: "number", min: 0 },
    subspecialty: { required: true, type: "array" },
    experienceYears: { required: true, type: "number", min: 0 }
  },
  nurse: {
    nursingLicenseNumber: { required: true, type: "string" },
    shiftType: { required: true, enum: ["day", "night", "rotating"] },
    maxPatientsAssigned: { required: true, type: "number", min: 1, max: 20 }
  },
  technician: {
    technicianCertification: { required: true, type: "string" },
    diagnosticEquipment: { required: true, type: "array", minLength: 1 }
  }
};

module.exports = {
  doctorRegistrationData,
  nurseRegistrationData,
  technicianRegistrationData,
  processStaffRegistration,
  validationSchemas
};
