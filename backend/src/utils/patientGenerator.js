// src/utils/patientGenerator.js
const prisma = require('./prisma');

/**
 * Generate unique patient number as a 6-digit integer
 * @returns {Promise<number>} Unique patient number
 */
async function generatePatientNumber() {
  let isUnique = false;
  let patientNumber = 0;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate random 6-digit number
    patientNumber = Math.floor(100000 + Math.random() * 900000);

    // Check if this patient number already exists
    const existingPatient = await prisma.patient.findUnique({
      where: { patientNumber },
      select: { id: true }
    });

    if (!existingPatient) {
      isUnique = true;
    }

    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique patient number after maximum attempts');
  }

  return patientNumber;
}

/**
 * Generate unique MRN (Medical Record Number) in format MRN followed by 8 digits
 * @returns {Promise<string>} Unique MRN
 */
async function generateMRN() {
  let isUnique = false;
  let mrn = '';
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate random 8-digit number
    const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
    mrn = `MRN${randomNumber}`;

    // Check if this MRN already exists
    const existingPatient = await prisma.patient.findUnique({
      where: { mrn },
      select: { id: true }
    });

    if (!existingPatient) {
      isUnique = true;
    }

    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique MRN after maximum attempts');
  }

  return mrn;
}

/**
 * Generate both patient number and MRN for a new patient
 * Sequential generation to reduce connection pool pressure
 * @returns {Promise<{patientNumber: number, mrn: string}>} Both unique identifiers
 */
async function generatePatientIdentifiers() {
  // Generate sequentially instead of parallel to reduce connection pool usage
  const patientNumber = await generatePatientNumber();
  const mrn = await generateMRN();

  return { patientNumber, mrn };
}

module.exports = {
  generatePatientNumber,
  generateMRN,
  generatePatientIdentifiers
};