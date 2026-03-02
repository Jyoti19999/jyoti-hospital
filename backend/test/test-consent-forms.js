const consentFormService = require('../src/services/consentFormService');

/**
 * Test script for consent form generation
 * Usage: node test/test-consent-forms.js <admissionId>
 */

async function testConsentForms() {
  const admissionId = process.argv[2];
  
  if (!admissionId) {
    console.log('❌ Please provide an admission ID');
    console.log('Usage: node test/test-consent-forms.js <admissionId>');
    process.exit(1);
  }
  
  console.log('🧪 Testing Consent Form Generation');
  console.log('='.repeat(80));
  console.log(`Admission ID: ${admissionId}\n`);
  
  try {
    // Test 1: Fetch consent form data
    console.log('📋 Test 1: Fetching consent form data...');
    const consentData = await consentFormService.getConsentFormData(admissionId);
    console.log('✅ Consent form data fetched successfully\n');
    
    console.log('Patient Information:');
    console.log(`  Name: ${consentData.patientName}`);
    console.log(`  Number: ${consentData.patientNumber}`);
    console.log(`  Age: ${consentData.age}`);
    console.log(`  Gender: ${consentData.gender}`);
    console.log(`  Surgery: ${consentData.surgeryType}\n`);
    
    console.log('Ophthalmic Surgery Form Fields:');
    Object.entries(consentData.ophsureng).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');
    
    console.log('Anesthesia Consent Form Fields:');
    Object.entries(consentData.ansconeng).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');
    
    // Test 2: Generate pre-filled PDFs
    console.log('📄 Test 2: Generating pre-filled consent forms...');
    const result = await consentFormService.generateConsentForms(admissionId);
    
    if (result.success) {
      console.log('✅ Consent forms generated successfully\n');
      
      console.log('Generated Files:');
      console.log(`  Ophthalmic Surgery: ${result.files.ophsureng.filename}`);
      console.log(`    Path: ${result.files.ophsureng.path}`);
      console.log(`    URL: ${result.files.ophsureng.url}\n`);
      
      console.log(`  Anesthesia Consent: ${result.files.ansconeng.filename}`);
      console.log(`    Path: ${result.files.ansconeng.path}`);
      console.log(`    URL: ${result.files.ansconeng.url}\n`);
      
      console.log('='.repeat(80));
      console.log('✅ All tests passed successfully!');
      console.log('');
      console.log('Next Steps:');
      console.log('1. Open the generated PDFs from the paths above');
      console.log('2. Verify that all fields are filled correctly');
      console.log('3. Test signing the PDFs with a PDF editor or stylus');
      console.log('4. Test the frontend integration in the CheckinModal');
      
    } else {
      throw new Error(result.message || 'Failed to generate consent forms');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testConsentForms();
