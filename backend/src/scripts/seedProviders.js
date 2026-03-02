const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const insuranceProviders = [
  {
    providerName: 'Star Health and Allied Insurance',
    providerCode: 'STAR001',
    contactPerson: 'Anand Roy',
    phoneNumber: '044-28288800',
    email: 'customercare@starhealth.in',
    address: 'No.1, New Tank Street, Valluvar Kottam High Road',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600034',
    panNumber: 'AAACS6896E',
    gstNumber: '33AAACS6896E1ZX',
    websiteUrl: 'https://www.starhealth.in',
    claimEmailId: 'claims@starhealth.in',
    claimPhoneNumber: '044-69009900',
    supportEmail: 'support@starhealth.in',
    supportPhone: '1800-425-2255',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 15,
    networkHospital: true,
    preferredProvider: true,
    creditLimit: 5000000.00,
    outstandingAmount: 0,
    notes: 'Largest standalone health insurance provider in India. Excellent cashless network.',
    isActive: true
  },
  {
    providerName: 'ICICI Lombard General Insurance',
    providerCode: 'ICICI001',
    contactPerson: 'Rajesh Kumar',
    phoneNumber: '022-61961600',
    email: 'customersupport@iciclombard.com',
    address: 'ICICI Lombard House, 414, Veer Savarkar Marg, Prabhadevi',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400025',
    panNumber: 'AAACI0433E',
    gstNumber: '27AAACI0433E1ZD',
    websiteUrl: 'https://www.iciclombard.com',
    claimEmailId: 'claims@iciclombard.com',
    claimPhoneNumber: '022-61961900',
    supportEmail: 'health@iciclombard.com',
    supportPhone: '1800-2666',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 12,
    networkHospital: true,
    preferredProvider: true,
    creditLimit: 8000000.00,
    outstandingAmount: 0,
    notes: 'One of the largest private sector general insurance companies. Quick claim processing.',
    isActive: true
  },
  {
    providerName: 'HDFC ERGO General Insurance',
    providerCode: 'HDFC001',
    contactPerson: 'Priya Sharma',
    phoneNumber: '022-66526666',
    email: 'customerservice@hdfcergo.com',
    address: '1st Floor, HDFC House, 165-166, Backbay Reclamation',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400020',
    panNumber: 'AABCH6238P',
    gstNumber: '27AABCH6238P1ZK',
    websiteUrl: 'https://www.hdfcergo.com',
    claimEmailId: 'healthclaims@hdfcergo.com',
    claimPhoneNumber: '022-66366000',
    supportEmail: 'support@hdfcergo.com',
    supportPhone: '1800-2700-700',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 10,
    networkHospital: true,
    preferredProvider: true,
    creditLimit: 7500000.00,
    outstandingAmount: 0,
    notes: 'Joint venture between HDFC and ERGO. Digital-first approach to claims.',
    isActive: true
  },
  {
    providerName: 'Care Health Insurance',
    providerCode: 'CARE001',
    contactPerson: 'Amit Verma',
    phoneNumber: '020-30306161',
    email: 'customercare@careinsurance.com',
    address: '5th Floor, 19 Charms Industrial Estate, Mehra Industrial Estate',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400013',
    panNumber: 'AAFCR5711B',
    gstNumber: '27AAFCR5711B1ZN',
    websiteUrl: 'https://www.careinsurance.com',
    claimEmailId: 'claims@careinsurance.com',
    claimPhoneNumber: '020-30306262',
    supportEmail: 'support@careinsurance.com',
    supportPhone: '1800-102-4477',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 14,
    networkHospital: true,
    preferredProvider: false,
    creditLimit: 6000000.00,
    outstandingAmount: 0,
    notes: 'Formerly Religare Health Insurance. Focus on innovative health products.',
    isActive: true
  },
  {
    providerName: 'Religare Health Insurance',
    providerCode: 'RELI001',
    contactPerson: 'Suresh Menon',
    phoneNumber: '011-30515050',
    email: 'care@religarehealth.com',
    address: 'Religare Health Insurance House, Plot No. 13, Sector 32',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122001',
    panNumber: 'AACCR6542M',
    gstNumber: '06AACCR6542M1ZF',
    websiteUrl: 'https://www.religarehealth.com',
    claimEmailId: 'healthclaims@religare.com',
    claimPhoneNumber: '011-30515151',
    supportEmail: 'support@religarehealth.com',
    supportPhone: '1800-103-0022',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 18,
    networkHospital: false,
    preferredProvider: false,
    creditLimit: 4000000.00,
    outstandingAmount: 0,
    notes: 'Specialized health insurance provider with comprehensive coverage.',
    isActive: true
  },
  {
    providerName: 'Bajaj Allianz General Insurance',
    providerCode: 'BAJAJ001',
    contactPerson: 'Deepak Singh',
    phoneNumber: '020-30305858',
    email: 'bagichelp@bajajallianz.co.in',
    address: 'GE Plaza, Airport Road, Yerawada',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411006',
    panNumber: 'AAACB1240L',
    gstNumber: '27AAACB1240L1ZY',
    websiteUrl: 'https://www.bajajallianz.com',
    claimEmailId: 'healthclaims@bajajallianz.co.in',
    claimPhoneNumber: '020-30305959',
    supportEmail: 'customercare@bajajallianz.co.in',
    supportPhone: '1800-209-0144',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 11,
    networkHospital: true,
    preferredProvider: true,
    creditLimit: 9000000.00,
    outstandingAmount: 0,
    notes: 'Joint venture between Bajaj Finserv and Allianz. Wide network coverage.',
    isActive: true
  },
  {
    providerName: 'New India Assurance',
    providerCode: 'NIA001',
    contactPerson: 'Venkatesh Iyer',
    phoneNumber: '022-22041000',
    email: 'contactus@newindia.co.in',
    address: '87, MG Road, Fort',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    panNumber: 'AAACN3326K',
    gstNumber: '27AAACN3326K1ZW',
    websiteUrl: 'https://www.newindia.co.in',
    claimEmailId: 'claims@newindia.co.in',
    claimPhoneNumber: '022-22042000',
    supportEmail: 'support@newindia.co.in',
    supportPhone: '1800-209-1415',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 20,
    networkHospital: true,
    preferredProvider: false,
    creditLimit: 5500000.00,
    outstandingAmount: 0,
    notes: 'Government-owned insurance company. Established nationwide presence.',
    isActive: true
  },
  {
    providerName: 'Oriental Insurance',
    providerCode: 'OIC001',
    contactPerson: 'Lakshmi Narayan',
    phoneNumber: '011-23232640',
    email: 'info@orientalinsurance.nic.in',
    address: 'Oriental House, A-25/27, Asaf Ali Road',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110002',
    panNumber: 'AAACO1385Q',
    gstNumber: '07AAACO1385Q1ZV',
    websiteUrl: 'https://www.orientalinsurance.org.in',
    claimEmailId: 'claims@orientalinsurance.nic.in',
    claimPhoneNumber: '011-23232700',
    supportEmail: 'customercare@orientalinsurance.nic.in',
    supportPhone: '1800-118-485',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 22,
    networkHospital: false,
    preferredProvider: false,
    creditLimit: 4500000.00,
    outstandingAmount: 0,
    notes: 'Public sector general insurance company. Reliable claim settlement.',
    isActive: true
  },
  {
    providerName: 'United India Insurance',
    providerCode: 'UII001',
    contactPerson: 'Ramesh Babu',
    phoneNumber: '044-28524991',
    email: 'uiichennai@uiic.co.in',
    address: '24, Whites Road',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600014',
    panNumber: 'AAACU0635Q',
    gstNumber: '33AAACU0635Q1ZT',
    websiteUrl: 'https://www.uiic.co.in',
    claimEmailId: 'claims@uiic.co.in',
    claimPhoneNumber: '044-28525806',
    supportEmail: 'support@uiic.co.in',
    supportPhone: '1800-425-4330',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 19,
    networkHospital: true,
    preferredProvider: false,
    creditLimit: 5000000.00,
    outstandingAmount: 0,
    notes: 'Government insurance company with pan-India operations.',
    isActive: true
  },
  {
    providerName: 'National Insurance Company',
    providerCode: 'NIC001',
    contactPerson: 'Arun Joshi',
    phoneNumber: '033-22348200',
    email: 'nicl@nic.co.in',
    address: '3, Middleton Street',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700071',
    panNumber: 'AAACN2706R',
    gstNumber: '19AAACN2706R1ZS',
    websiteUrl: 'https://www.nationalinsurance.nic.co.in',
    claimEmailId: 'healthclaims@nic.co.in',
    claimPhoneNumber: '033-22348300',
    supportEmail: 'customercare@nic.co.in',
    supportPhone: '1800-103-0031',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 21,
    networkHospital: true,
    preferredProvider: false,
    creditLimit: 4800000.00,
    outstandingAmount: 0,
    notes: 'Public sector insurance company with extensive network.',
    isActive: true
  },
  {
    providerName: 'Aditya Birla Health Insurance',
    providerCode: 'ABHI001',
    contactPerson: 'Mayank Bathwal',
    phoneNumber: '022-43568900',
    email: 'customer.support@adityabirlacapital.com',
    address: 'One World Centre, 19th Floor, Tower 2A, Jupiter Mill Compound',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400013',
    panNumber: 'AABCA6176M',
    gstNumber: '27AABCA6176M1ZU',
    websiteUrl: 'https://www.adityabirlahealth.com',
    claimEmailId: 'claims@adityabirlahealth.com',
    claimPhoneNumber: '022-43569000',
    supportEmail: 'care@adityabirlahealth.com',
    supportPhone: '1800-270-7000',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 13,
    networkHospital: true,
    preferredProvider: false,
    creditLimit: 6500000.00,
    outstandingAmount: 0,
    notes: 'Part of Aditya Birla Group. Focus on wellness and preventive care.',
    isActive: true
  },
  {
    providerName: 'Tata AIG General Insurance',
    providerCode: 'TATA001',
    contactPerson: 'Sanjay Datta',
    phoneNumber: '022-66939800',
    email: 'customer.service@tataaig.com',
    address: 'Peninsula Business Park, Tower A, 15th Floor, Ganpatrao Kadam Marg',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400013',
    panNumber: 'AABCT3803M',
    gstNumber: '27AABCT3803M1ZR',
    websiteUrl: 'https://www.tataaig.com',
    claimEmailId: 'healthclaims@tataaig.com',
    claimPhoneNumber: '022-66939900',
    supportEmail: 'support@tataaig.com',
    supportPhone: '1800-266-7780',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 16,
    networkHospital: true,
    preferredProvider: false,
    creditLimit: 7000000.00,
    outstandingAmount: 0,
    notes: 'Joint venture between Tata Group and AIG. Strong customer service.',
    isActive: true
  },
  {
    providerName: 'Royal Sundaram General Insurance',
    providerCode: 'RSGI001',
    contactPerson: 'Krishnan Ramachandran',
    phoneNumber: '044-28338000',
    email: 'customercare@royalsundaram.in',
    address: 'Shiv House, 6 Haddows Road, Nungambakkam',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600006',
    panNumber: 'AABCR5654D',
    gstNumber: '33AABCR5654D1ZQ',
    websiteUrl: 'https://www.royalsundaram.in',
    claimEmailId: 'claims@royalsundaram.in',
    claimPhoneNumber: '044-28339000',
    supportEmail: 'support@royalsundaram.in',
    supportPhone: '1800-568-9999',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 17,
    networkHospital: false,
    preferredProvider: false,
    creditLimit: 5200000.00,
    outstandingAmount: 0,
    notes: 'Alliance between Royal Bank of Canada and Sundaram Finance. Customer-centric approach.',
    isActive: true
  },
  {
    providerName: 'SBI General Insurance',
    providerCode: 'SBI001',
    contactPerson: 'Prakash Chandra Kandpal',
    phoneNumber: '022-26571818',
    email: 'care@sbigeneral.in',
    address: 'Fulcrum, 9th Floor, A & B Wing, Sahar Road, Andheri (East)',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400099',
    panNumber: 'AABCS9846Q',
    gstNumber: '27AABCS9846Q1ZP',
    websiteUrl: 'https://www.sbigeneral.in',
    claimEmailId: 'healthclaims@sbigeneral.in',
    claimPhoneNumber: '022-26572000',
    supportEmail: 'customercare@sbigeneral.in',
    supportPhone: '1800-123-2310',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 14,
    networkHospital: true,
    preferredProvider: false,
    creditLimit: 6800000.00,
    outstandingAmount: 0,
    notes: 'Subsidiary of State Bank of India. Extensive branch network support.',
    isActive: true
  },
  {
    providerName: 'Max Bupa Health Insurance',
    providerCode: 'MAX001',
    contactPerson: 'Ashish Mehrotra',
    phoneNumber: '011-26923293',
    email: 'customer.relations@maxbupa.com',
    address: '3rd Floor, International Trade Tower, Nehru Place',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110019',
    panNumber: 'AAHCM9217J',
    gstNumber: '07AAHCM9217J1ZO',
    websiteUrl: 'https://www.maxbupa.com',
    claimEmailId: 'claims@maxbupa.com',
    claimPhoneNumber: '011-30921000',
    supportEmail: 'support@maxbupa.com',
    supportPhone: '1800-102-4488',
    cashlessSupported: true,
    reimbursementSupported: true,
    averageSettlementDays: 12,
    networkHospital: true,
    preferredProvider: true,
    creditLimit: 7200000.00,
    outstandingAmount: 0,
    notes: 'Joint venture between Max India and Bupa. Excellent claim settlement ratio.',
    isActive: true
  }
];

async function seedInsuranceProviders() {
  console.log('🌱 Starting insurance provider seeding...');
  
  try {
    // Check if providers already exist
    const existingCount = await prisma.insuranceProvider.count();
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing insurance providers.`);
      console.log('Do you want to continue? This will skip duplicates.');
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const provider of insuranceProviders) {
      try {
        // Check if provider already exists
        const existing = await prisma.insuranceProvider.findUnique({
          where: { providerName: provider.providerName }
        });

        if (existing) {
          console.log(`⏭️  Skipped: ${provider.providerName} (already exists)`);
          skippedCount++;
          continue;
        }

        // Create new provider
        await prisma.insuranceProvider.create({
          data: provider
        });

        console.log(`✅ Created: ${provider.providerName}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating ${provider.providerName}:`, error.message);
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Created: ${createdCount} providers`);
    console.log(`   ⏭️  Skipped: ${skippedCount} providers`);
    console.log(`   📈 Total in DB: ${await prisma.insuranceProvider.count()} providers`);
    console.log('\n🎉 Insurance provider seeding completed!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedInsuranceProviders()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
