const prisma = require('../utils/prisma');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

/**
 * Fetch data required for consent forms from database
 */
const getConsentFormData = async (admissionId) => {
  try {
    // Fetch admission details with all related data
    const admission = await prisma.ipdAdmission.findUnique({
      where: { id: admissionId },
      include: {
        patient: true,
        surgeon: true,
        anesthesiologist: true,
        surgeryTypeDetail: true,
        lens: true,
        patientVisit: {
          include: {
            diagnoses: true
          }
        }
      }
    });

    if (!admission) {
      throw new Error('Admission not found');
    }

    // Calculate age from date of birth
    const calculateAge = (dob) => {
      if (!dob) return null;
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    // Get patient address
    const getAddress = (addressJson) => {
      if (!addressJson) return '';
      if (typeof addressJson === 'string') {
        try {
          addressJson = JSON.parse(addressJson);
        } catch (e) {
          return addressJson;
        }
      }
      const parts = [
        addressJson.street,
        addressJson.city,
        addressJson.state,
        addressJson.postalCode
      ].filter(Boolean);
      return parts.join(', ');
    };

    // Craft treatment description based on surgery type and lens
    const craftTreatment = () => {
      const surgeryName = admission.surgeryTypeDetail?.name || 'Eye Surgery';
      const lensInfo = admission.lens 
        ? ` with ${admission.lens.lensName} (${admission.lens.lensType})` 
        : '';
      return `${surgeryName}${lensInfo}`;
    };

    // Craft surgical process explanation
    const craftSurgicalProcess = () => {
      const surgeryType = admission.surgeryTypeDetail?.name || 'Eye Surgery';
      const description = admission.surgeryTypeDetail?.description || '';
      
      if (surgeryType.toLowerCase().includes('cataract')) {
        return `The surgical procedure involves removing the cloudy natural lens and replacing it with an artificial intraocular lens (IOL). The procedure is performed under ${admission.requiresAnesthesia ? 'anesthesia' : 'local anesthetic drops'}.`;
      }
      
      return description || `Surgical procedure for ${surgeryType} will be performed as per standard protocols.`;
    };

    // Get suffering from (diagnosis)
    const getSufferingFrom = () => {
      if (admission.patientVisit?.diagnoses && admission.patientVisit.diagnoses.length > 0) {
        return admission.patientVisit.diagnoses
          .map(d => d.diagnosisName || d.condition)
          .filter(Boolean)
          .join(', ');
      }
      return admission.surgeryTypeDetail?.name || 'Eye condition requiring surgery';
    };

    // Get consequences and risks
    const getConsequencesAndRisks = () => {
      const surgeryType = admission.surgeryTypeDetail?.name || '';
      
      if (surgeryType.toLowerCase().includes('cataract')) {
        return {
          consequences: 'Without surgery, the cataract will continue to worsen, leading to progressive vision loss and potential blindness.',
          risks: 'Infection, bleeding, inflammation, retinal detachment, corneal edema, posterior capsule rupture, IOL dislocation, and rare complications.'
        };
      }
      
      return {
        consequences: 'Delay in treatment may lead to worsening of the condition and potential vision impairment.',
        risks: 'Infection, bleeding, inflammation, and other surgical complications as discussed.'
      };
    };

    const { consequences, risks } = getConsequencesAndRisks();
    const today = new Date();
    const currentTime = today.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const todayDate = today.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Prepare data for both PDFs
    const consentData = {
      // Common fields
      patientName: `${admission.patient.firstName} ${admission.patient.lastName}`,
      patientNumber: admission.patient.patientNumber?.toString() || admission.patient.mrn || '',
      age: calculateAge(admission.patient.dateOfBirth)?.toString() || '',
      gender: admission.patient.gender || '',
      address: getAddress(admission.patient.address),
      ophthalmologistName: admission.surgeon 
        ? `Dr. ${admission.surgeon.firstName} ${admission.surgeon.lastName}` 
        : '',
      todayDate: todayDate,
      currentTime: currentTime,
      
      // Ophthalmic Surgery Consent Form (ophsureng_annotated.pdf)
      ophsureng: {
        pname: `${admission.patient.firstName} ${admission.patient.lastName}`,
        page: calculateAge(admission.patient.dateOfBirth)?.toString() || '',
        sex: admission.patient.gender || '',
        prn: admission.patient.patientNumber?.toString() || admission.patient.mrn || '',
        sufferingfrom: getSufferingFrom(),
        treatment: craftTreatment(),
        surgicalprocessexplained: craftSurgicalProcess(),
        ophname: admission.surgeon 
          ? `Dr. ${admission.surgeon.firstName} ${admission.surgeon.lastName}` 
          : '',
        date: todayDate,
        date1: todayDate,
        date2: todayDate,
        date3: todayDate
      },
      
      // Anesthesia Consent Form (ansconeng_annotated.pdf)
      ansconeng: {
        ipdnum: admission.admissionNumber,
        pnum: admission.patient.patientNumber?.toString() || admission.patient.mrn || '',
        pname: `${admission.patient.firstName} ${admission.patient.lastName}`,
        pname2: `${admission.patient.firstName} ${admission.patient.lastName}`,
        age: calculateAge(admission.patient.dateOfBirth)?.toString() || '',
        age2: calculateAge(admission.patient.dateOfBirth)?.toString() || '',
        sex: admission.patient.gender || '',
        address: getAddress(admission.patient.address),
        ophname: admission.surgeon 
          ? `Dr. ${admission.surgeon.firstName} ${admission.surgeon.lastName}` 
          : '',
        ophname2: admission.surgeon 
          ? `Dr. ${admission.surgeon.firstName} ${admission.surgeon.lastName}` 
          : '',
        anename: admission.anesthesiologist 
          ? `Dr. ${admission.anesthesiologist.firstName} ${admission.anesthesiologist.lastName}` 
          : '',
        consequences: consequences,
        risks: risks,
        lang: 'English', // Default language
        signumber: admission.admissionNumber,
        witnessname: '', // To be filled by staff
        todaydate: todayDate,
        curtime: currentTime
      },
      
      // Metadata
      admissionId: admission.id,
      admissionNumber: admission.admissionNumber,
      surgeryType: admission.surgeryTypeDetail?.name || 'Eye Surgery'
    };

    return consentData;
    
  } catch (error) {
    console.error('Error fetching consent form data:', error);
    throw error;
  }
};

/**
 * Fill PDF form fields with data
 */
const fillPdfForm = async (templatePath, fieldData) => {
  try {
    // Read the PDF template
    const pdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get the form
    const form = pdfDoc.getForm();
    
    // Fill each field
    Object.entries(fieldData).forEach(([fieldName, fieldValue]) => {
      try {
        const field = form.getTextField(fieldName);
        if (field && fieldValue) {
          field.setText(fieldValue.toString());
        }
      } catch (error) {
        // Field doesn't exist or is not a text field, skip it
        console.warn(`Could not fill field "${fieldName}":`, error.message);
      }
    });
    
    // Flatten the form to make filled fields non-editable
    // This converts form fields to regular text, preventing editing
    form.flatten();
    
    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    
    return filledPdfBytes;
    
  } catch (error) {
    console.error('Error filling PDF form:', error);
    throw error;
  }
};

/**
 * Generate pre-filled consent forms
 */
const generateConsentForms = async (admissionId) => {
  try {
    console.log('🔍 Step 1: Fetching consent form data for admission:', admissionId);
    
    // Get consent form data
    const consentData = await getConsentFormData(admissionId);
    
    console.log('✅ Step 1 Complete: Data fetched successfully');
    console.log('📋 Patient:', consentData.patientName);
    
    // Paths
    const templatesDir = path.join(__dirname, '..', '..', 'pdf_templates');
    const tempDir = path.join(__dirname, '..', '..', 'uploads', 'consent-forms', 'temp');
    
    console.log('📁 Templates directory:', templatesDir);
    console.log('📁 Temp directory:', tempDir);
    
    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });
    
    console.log('✅ Step 2: Temp directory created/verified');
    
    // Generate unique filenames
    const timestamp = Date.now();
    const ophsurengFilename = `ophsureng_${admissionId}_${timestamp}.pdf`;
    const ansconengFilename = `ansconeng_${admissionId}_${timestamp}.pdf`;
    
    console.log('🔍 Step 3: Filling Ophthalmic Surgery PDF...');
    
    // Fill and save both PDFs
    const ophsurengPdf = await fillPdfForm(
      path.join(templatesDir, 'ophsureng_annotated.pdf'),
      consentData.ophsureng
    );
    
    console.log('✅ Step 3 Complete: Ophthalmic Surgery PDF filled');
    console.log('🔍 Step 4: Filling Anesthesia Consent PDF...');
    
    const ansconengPdf = await fillPdfForm(
      path.join(templatesDir, 'ansconeng_annotated.pdf'),
      consentData.ansconeng
    );
    
    console.log('✅ Step 4 Complete: Anesthesia Consent PDF filled');
    console.log('🔍 Step 5: Saving PDFs to temp directory...');
    
    // Save temporarily
    const ophsurengPath = path.join(tempDir, ophsurengFilename);
    const ansconengPath = path.join(tempDir, ansconengFilename);
    
    await fs.writeFile(ophsurengPath, ophsurengPdf);
    await fs.writeFile(ansconengPath, ansconengPdf);
    
    console.log('✅ Step 5 Complete: PDFs saved successfully');
    console.log('📄 Ophthalmic Surgery PDF:', ophsurengPath);
    console.log('📄 Anesthesia Consent PDF:', ansconengPath);
    
    return {
      success: true,
      message: 'Consent forms generated successfully',
      files: {
        ophsureng: {
          filename: ophsurengFilename,
          path: ophsurengPath,
          url: `/api/v1/consent-forms/preview/${admissionId}/ophsureng/${ophsurengFilename}`
        },
        ansconeng: {
          filename: ansconengFilename,
          path: ansconengPath,
          url: `/api/v1/consent-forms/preview/${admissionId}/ansconeng/${ansconengFilename}`
        }
      },
      data: consentData
    };
    
  } catch (error) {
    console.error('❌ Error generating consent forms:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
};

/**
 * Save signed consent form
 */
const saveSignedConsentForm = async (admissionId, formType, signedPdfBuffer) => {
  try {
    console.log(`📝 Saving signed consent form for admission: ${admissionId}, formType: ${formType}`);
    
    // Create permanent storage directory
    const permanentDir = path.join(__dirname, '..', '..', 'uploads', 'consent-forms', admissionId);
    await fs.mkdir(permanentDir, { recursive: true });
    
    // Generate filename
    const timestamp = Date.now();
    const filename = `${formType}_signed_${timestamp}.pdf`;
    const filePath = path.join(permanentDir, filename);
    
    // Save the signed PDF
    await fs.writeFile(filePath, signedPdfBuffer);
    console.log(`💾 Signed PDF saved to: ${filePath}`);
    
    // Create relative path for database storage
    const relativePath = `uploads/consent-forms/${admissionId}/${filename}`;
    
    // Update IPD admission record with consent form path
    const admission = await prisma.ipdAdmission.findUnique({
      where: { id: admissionId },
      select: { consentFormsPaths: true }
    });
    
    if (admission) {
      // Add new path if not already present
      const currentPaths = admission.consentFormsPaths || [];
      console.log(`📋 Current consent form paths:`, currentPaths);
      
      if (!currentPaths.includes(relativePath)) {
        await prisma.ipdAdmission.update({
          where: { id: admissionId },
          data: {
            consentFormsPaths: {
              push: relativePath
            }
          }
        });
        console.log(`✅ Added consent form path to database: ${relativePath}`);
      } else {
        console.log(`ℹ️ Path already exists in database: ${relativePath}`);
      }
    } else {
      console.warn(`⚠️ Admission not found: ${admissionId}`);
    }
    
    return {
      success: true,
      message: 'Signed consent form saved successfully',
      file: {
        filename: filename,
        path: filePath,
        relativePath: relativePath,
        formType: formType,
        savedAt: new Date()
      }
    };
    
  } catch (error) {
    console.error('❌ Error saving signed consent form:', error);
    throw error;
  }
};

/**
 * Clean up temporary files
 */
const cleanupTempFiles = async (admissionId) => {
  try {
    const tempDir = path.join(__dirname, '..', '..', 'uploads', 'consent-forms', 'temp');
    const files = await fs.readdir(tempDir);
    
    // Delete files for this admission
    const filesToDelete = files.filter(f => f.includes(admissionId));
    
    for (const file of filesToDelete) {
      await fs.unlink(path.join(tempDir, file));
    }
    
    return {
      success: true,
      deletedFiles: filesToDelete.length
    };
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
    // Don't throw error for cleanup failures
    return { success: false, error: error.message };
  }
};

module.exports = {
  getConsentFormData,
  generateConsentForms,
  fillPdfForm,
  saveSignedConsentForm,
  cleanupTempFiles
};
