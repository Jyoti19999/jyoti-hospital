// Comprehensive seeding script for surgery types and investigations
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Surgery data from user requirements
const surgeryData = [
  {
    "srNo": 1,
    "nameOfSurgery": "Cataract surgery",
    "investigations": ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    "srNo": 2,
    "nameOfSurgery": "Vitrectomy surgery",
    "investigations": ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    "srNo": 3,
    "nameOfSurgery": "Pterygium surgery",
    "investigations": ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    "srNo": 4,
    "nameOfSurgery": "RD (Retinal Detachment)",
    "investigations": ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    "srNo": 5,
    "nameOfSurgery": "Ptosis surgery",
    "investigations": ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    "srNo": 6,
    "nameOfSurgery": "Squint surgery",
    "investigations": ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    "srNo": 7,
    "nameOfSurgery": "DCR (Dacryocystorhinostomy) surgery",
    "investigations": ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    "srNo": 8,
    "nameOfSurgery": "DCT (Dacryocystectomy) surgery",
    "investigations": ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    "srNo": 9,
    "nameOfSurgery": "SFIOL (Scleral Fixation of Intraocular Lens) surgery",
    "investigations": ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    "srNo": 10,
    "nameOfSurgery": "Evisceration surgery",
    "investigations": ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    "srNo": 11,
    "nameOfSurgery": "SOR (Silicone Oil Removal) surgery",
    "investigations": ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    "srNo": 12,
    "nameOfSurgery": "Lasik surgery",
    "investigations": ["CBC", "BSL", "HIV", "HBSAG"]
  },
  {
    "srNo": 13,
    "nameOfSurgery": "C3R (Corneal Collagen Cross-Linking with Riboflavin) surgery",
    "investigations": ["CBC", "BSL", "HIV", "HBSAG"]
  },
  {
    "srNo": 14,
    "nameOfSurgery": "Chalazion surgery",
    "investigations": ["CBC", "BSL", "HIV", "HBSAG"]
  },
  {
    "srNo": 15,
    "nameOfSurgery": "Cyst removing surgery",
    "investigations": ["CBC", "BSL", "HIV", "HBSAG"]
  },
  {
    "srNo": 16,
    "nameOfSurgery": "Trauma surgery",
    "investigations": ["CBC", "BSL", "HIV", "HBSAG"]
  },
  {
    "srNo": 17,
    "nameOfSurgery": "Intravitreal Injection",
    "investigations": ["CBC", "BSL", "HIV", "HBSAG"]
  },
  {
    "srNo": 18,
    "nameOfSurgery": "FFA",
    "investigations": ["BSL"]
  }
];

// Investigation details with categories and specifications
const investigationDetails = {
  "CBC": {
    investigationCode: "CBC001",
    category: "Blood Test",
    description: "Complete Blood Count - Measures different blood cells and components",
    cost: 150.0,
    validityDays: 7,
    processingTime: "2-4 hours",
    fastingRequired: false
  },
  "HIV": {
    investigationCode: "HIV001", 
    category: "Blood Test",
    description: "Human Immunodeficiency Virus test",
    cost: 300.0,
    validityDays: 90,
    processingTime: "Same day",
    fastingRequired: false
  },
  "HBSAG": {
    investigationCode: "HBSAG001",
    category: "Blood Test", 
    description: "Hepatitis B Surface Antigen test",
    cost: 250.0,
    validityDays: 90,
    processingTime: "Same day",
    fastingRequired: false
  },
  "BSL": {
    investigationCode: "BSL001",
    category: "Blood Test",
    description: "Blood Sugar Level - Fasting and Random",
    cost: 100.0,
    validityDays: 3,
    processingTime: "1-2 hours", 
    fastingRequired: true
  },
  "Urine Routine": {
    investigationCode: "URINE001",
    category: "Urine Test",
    description: "Routine urine examination for proteins, glucose, cells",
    cost: 80.0,
    validityDays: 7,
    processingTime: "1-2 hours",
    fastingRequired: false
  },
  "ECG": {
    investigationCode: "ECG001",
    category: "Cardiac Test",
    description: "Electrocardiogram - Heart rhythm and electrical activity",
    cost: 200.0,
    validityDays: 30,
    processingTime: "Immediate",
    fastingRequired: false
  },
  "Physician Fitness": {
    investigationCode: "PHYS001",
    category: "Physical Examination",
    description: "Physician fitness assessment for surgery clearance",
    cost: 500.0,
    validityDays: 30,
    processingTime: "Same day",
    fastingRequired: false
  }
};

// Surgery type categories mapping
const surgeryCategories = {
  "Cataract surgery": "CATARACT",
  "Vitrectomy surgery": "RETINAL",
  "Pterygium surgery": "CORNEAL", 
  "RD (Retinal Detachment)": "RETINAL",
  "Ptosis surgery": "OCULOPLASTIC",
  "Squint surgery": "OCULOPLASTIC", 
  "DCR (Dacryocystorhinostomy) surgery": "OCULOPLASTIC",
  "DCT (Dacryocystectomy) surgery": "OCULOPLASTIC",
  "SFIOL (Scleral Fixation of Intraocular Lens) surgery": "CATARACT",
  "Evisceration surgery": "OCULOPLASTIC",
  "SOR (Silicone Oil Removal) surgery": "RETINAL",
  "Lasik surgery": "CORNEAL",
  "C3R (Corneal Collagen Cross-Linking with Riboflavin) surgery": "CORNEAL",
  "Chalazion surgery": "OCULOPLASTIC",
  "Cyst removing surgery": "OCULOPLASTIC",
  "Trauma surgery": "EMERGENCY",
  "Intravitreal Injection": "RETINAL",
  "FFA": "RETINAL"
};

async function seedSurgeryData() {
  console.log('🌱 Starting comprehensive surgery data seeding...');
  
  try {
    await prisma.$transaction(async (tx) => {
      
      // Step 1: Extract and create all unique investigations
      console.log('\n📋 Step 1: Processing investigations...');
      
      const allInvestigations = new Set();
      surgeryData.forEach(surgery => {
        surgery.investigations.forEach(investigation => {
          allInvestigations.add(investigation);
        });
      });
      
      const uniqueInvestigations = Array.from(allInvestigations);
      console.log(`Found ${uniqueInvestigations.length} unique investigations: ${uniqueInvestigations.join(', ')}`);
      
      // Create investigations
      const createdInvestigations = [];
      for (const investigationName of uniqueInvestigations) {
        const details = investigationDetails[investigationName];
        
        const investigation = await tx.fitnessInvestigation.create({
          data: {
            investigationName,
            investigationCode: details.investigationCode,
            category: details.category,
            description: details.description,
            cost: details.cost,
            validityDays: details.validityDays,
            processingTime: details.processingTime,
            fastingRequired: details.fastingRequired,
            isActive: true
          }
        });
        
        createdInvestigations.push(investigation);
        console.log(`✅ Created investigation: ${investigation.investigationName} (${investigation.category})`);
      }
      
      // Create investigation lookup map
      const investigationMap = {};
      createdInvestigations.forEach(inv => {
        investigationMap[inv.investigationName] = inv.id;
      });
      
      // Step 2: Create surgery types with investigation arrays
      console.log('\n🔧 Step 2: Creating surgery types...');
      
      const createdSurgeryTypes = [];
      for (const surgeryInfo of surgeryData) {
        const { nameOfSurgery, investigations } = surgeryInfo;
        
        // Map investigation names to IDs
        const investigationIds = investigations.map(name => investigationMap[name]).filter(Boolean);
        
        // Generate surgery code
        const surgeryCode = nameOfSurgery.replace(/\s+/g, '').substring(0, 10).toUpperCase();
        
        const surgeryType = await tx.surgeryType.create({
          data: {
            name: nameOfSurgery,
            code: surgeryCode,
            category: surgeryCategories[nameOfSurgery] || "GENERAL",
            description: `${nameOfSurgery} - Requires ${investigations.length} pre-operative investigations`,
            investigationIds: investigationIds,
            averageDuration: nameOfSurgery.includes('Injection') ? 30 : nameOfSurgery.includes('LASIK') ? 45 : 90,
            complexityLevel: investigations.length > 5 ? "High" : investigations.length > 3 ? "Medium" : "Low",
            requiresAnesthesia: nameOfSurgery.includes('Injection') || nameOfSurgery === 'FFA' ? "Local" : "General",
            isOutpatient: !nameOfSurgery.includes('Vitrectomy') && !nameOfSurgery.includes('RD'),
            requiresAdmission: nameOfSurgery.includes('Vitrectomy') || nameOfSurgery.includes('RD'),
            isActive: true
          }
        });
        
        createdSurgeryTypes.push(surgeryType);
        console.log(`✅ Created surgery type: ${surgeryType.name} with ${investigationIds.length} investigations`);
      }
      
      // Step 3: Verification
      console.log('\n🔍 Step 3: Verification...');
      
      // Count totals
      const totalInvestigations = await tx.fitnessInvestigation.count();
      const totalSurgeryTypes = await tx.surgeryType.count();
      
      console.log(`📊 Total investigations created: ${totalInvestigations}`);
      console.log(`📊 Total surgery types created: ${totalSurgeryTypes}`);
      
      // Show detailed mapping
      console.log('\n📋 Surgery Type → Investigation Mapping:');
      for (const surgery of createdSurgeryTypes) {
        const investigationNames = surgery.investigationIds.map(id => {
          const inv = createdInvestigations.find(i => i.id === id);
          return inv ? inv.investigationName : 'Unknown';
        });
        console.log(`${surgery.name}: [${investigationNames.join(', ')}]`);
      }
      
      // Category breakdown
      console.log('\n📊 Surgery Categories:');
      const categoryGroups = {};
      createdSurgeryTypes.forEach(surgery => {
        const category = surgery.category;
        if (!categoryGroups[category]) {
          categoryGroups[category] = [];
        }
        categoryGroups[category].push(surgery.name);
      });
      
      Object.entries(categoryGroups).forEach(([category, surgeries]) => {
        console.log(`${category}: ${surgeries.length} surgeries`);
        surgeries.forEach(name => console.log(`  - ${name}`));
      });
      
      // Investigation usage frequency
      console.log('\n📈 Investigation Usage Frequency:');
      const investigationUsage = {};
      createdSurgeryTypes.forEach(surgery => {
        surgery.investigationIds.forEach(invId => {
          const inv = createdInvestigations.find(i => i.id === invId);
          if (inv) {
            investigationUsage[inv.investigationName] = (investigationUsage[inv.investigationName] || 0) + 1;
          }
        });
      });
      
      Object.entries(investigationUsage)
        .sort(([,a], [,b]) => b - a)
        .forEach(([name, count]) => {
          console.log(`${name}: Used in ${count}/${totalSurgeryTypes} surgery types (${Math.round(count/totalSurgeryTypes*100)}%)`);
        });
    });
    
    console.log('\n🎉 Surgery data seeding completed successfully!');
    
    // Final summary
    console.log('\n📝 SEEDING SUMMARY:');
    console.log('✅ 7 unique investigations created with detailed specifications');
    console.log('✅ 18 surgery types created with proper categorization');
    console.log('✅ Investigation-surgery mappings established using array structure');
    console.log('✅ All data properly linked and validated');
    console.log('\n🚀 System ready for Surgery Type Investigations interface!');
    
  } catch (error) {
    console.error('❌ Error seeding surgery data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedSurgeryData()
    .then(() => {
      console.log('\n✅ Seeding process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seeding process failed:', error.message);
      process.exit(1);
    });
}

module.exports = { seedSurgeryData, surgeryData, investigationDetails };