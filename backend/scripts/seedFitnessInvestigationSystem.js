const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Fitness Investigations Master Data
const fitnessInvestigations = [
  {
    investigationName: "CBC",
    investigationCode: "CBC001",
    category: "Blood Test",
    description: "Complete Blood Count - Comprehensive blood analysis",
    validityDays: 7,
    processingTime: "2-4 hours",
    fastingRequired: false,
    cost: 300.00,
    isOutsourced: false,
    normalRanges: {
      "hemoglobin": "12-15 g/dl (F), 13.5-17.5 g/dl (M)",
      "wbc": "4000-11000/cumm",
      "platelets": "150000-450000/cumm"
    },
    criticalValues: {
      "hemoglobin": "<8 g/dl",
      "wbc": "<2000 or >20000",
      "platelets": "<50000"
    },
    units: "g/dl, /cumm"
  },
  {
    investigationName: "HIV",
    investigationCode: "HIV001",
    category: "Blood Test",
    description: "Human Immunodeficiency Virus screening",
    validityDays: 90,
    processingTime: "Same day",
    fastingRequired: false,
    cost: 400.00,
    isOutsourced: false,
    normalRanges: {
      "result": "Non-Reactive"
    },
    criticalValues: {
      "result": "Reactive"
    }
  },
  {
    investigationName: "HBSAG",
    investigationCode: "HBSAG001",
    category: "Blood Test",
    description: "Hepatitis B Surface Antigen screening",
    validityDays: 90,
    processingTime: "Same day",
    fastingRequired: false,
    cost: 350.00,
    isOutsourced: false,
    normalRanges: {
      "result": "Non-Reactive"
    },
    criticalValues: {
      "result": "Reactive"
    }
  },
  {
    investigationName: "BSL",
    investigationCode: "BSL001",
    category: "Blood Test",
    description: "Blood Sugar Level - Random/Fasting",
    validityDays: 3,
    processingTime: "1-2 hours",
    fastingRequired: true,
    cost: 100.00,
    isOutsourced: false,
    normalRanges: {
      "fasting": "70-110 mg/dl",
      "random": "<140 mg/dl"
    },
    criticalValues: {
      "fasting": ">200 mg/dl",
      "random": ">300 mg/dl"
    },
    units: "mg/dl"
  },
  {
    investigationName: "Urine Routine",
    investigationCode: "URINE001",
    category: "Urine Test",
    description: "Complete urine analysis",
    validityDays: 7,
    processingTime: "1-2 hours",
    fastingRequired: false,
    cost: 150.00,
    isOutsourced: false,
    normalRanges: {
      "protein": "Nil to trace",
      "sugar": "Nil",
      "pus_cells": "0-5/hpf"
    },
    criticalValues: {
      "protein": "+++",
      "sugar": "+++",
      "pus_cells": ">20/hpf"
    }
  },
  {
    investigationName: "ECG",
    investigationCode: "ECG001",
    category: "Cardiac Test",
    description: "Electrocardiogram - Heart rhythm analysis",
    validityDays: 30,
    processingTime: "30 minutes",
    fastingRequired: false,
    cost: 200.00,
    isOutsourced: false,
    normalRanges: {
      "rhythm": "Sinus rhythm",
      "rate": "60-100 bpm",
      "axis": "Normal"
    },
    criticalValues: {
      "rhythm": "Atrial fibrillation, VT, VF",
      "rate": "<50 or >120 bpm",
      "st_changes": "ST elevation/depression >2mm"
    },
    units: "bpm, mV"
  },
  {
    investigationName: "Physician Fitness",
    investigationCode: "PHY001",
    category: "Clinical Assessment",
    description: "Physician fitness clearance for surgery",
    validityDays: 30,
    processingTime: "Same day",
    fastingRequired: false,
    cost: 500.00,
    isOutsourced: false,
    normalRanges: {
      "fitness": "Fit for surgery under local/general anesthesia"
    },
    criticalValues: {
      "fitness": "Not fit for surgery"
    }
  }
];

// Surgery Types with Investigation Requirements
const surgeryTypesData = [
  {
    srNo: 1,
    nameOfSurgery: "Cataract surgery",
    investigations: ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    srNo: 2,
    nameOfSurgery: "Vitrectomy surgery",
    investigations: ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    srNo: 3,
    nameOfSurgery: "Pterygium surgery",
    investigations: ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    srNo: 4,
    nameOfSurgery: "RD (Retinal Detachment)",
    investigations: ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    srNo: 5,
    nameOfSurgery: "Ptosis surgery",
    investigations: ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    srNo: 6,
    nameOfSurgery: "Squint surgery",
    investigations: ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    srNo: 7,
    nameOfSurgery: "DCR (Dacryocystorhinostomy) surgery",
    investigations: ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    srNo: 8,
    nameOfSurgery: "DCT (Dacryocystectomy) surgery",
    investigations: ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    srNo: 9,
    nameOfSurgery: "SFIOL (Scleral Fixation of Intraocular Lens) surgery",
    investigations: ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    srNo: 10,
    nameOfSurgery: "Evisceration surgery",
    investigations: ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    srNo: 11,
    nameOfSurgery: "SOR (Silicone Oil Removal) surgery",
    investigations: ["CBC", "HIV", "HBSAG", "BSL", "Urine Routine", "ECG", "Physician Fitness"]
  },
  {
    srNo: 12,
    nameOfSurgery: "Lasik surgery",
    investigations: ["CBC", "BSL", "HIV", "HBSAG"]
  },
  {
    srNo: 13,
    nameOfSurgery: "C3R (Corneal Collagen Cross-Linking with Riboflavin) surgery",
    investigations: ["CBC", "BSL", "HIV", "HBSAG"]
  },
  {
    srNo: 14,
    nameOfSurgery: "Chalazion surgery",
    investigations: ["CBC", "BSL", "HIV", "HBSAG"]
  },
  {
    srNo: 15,
    nameOfSurgery: "Cyst removing surgery",
    investigations: ["CBC", "BSL", "HIV", "HBSAG"]
  },
  {
    srNo: 16,
    nameOfSurgery: "Trauma surgery",
    investigations: ["CBC", "BSL", "HIV", "HBSAG"]
  },
  {
    srNo: 17,
    nameOfSurgery: "Intravitreal Injection",
    investigations: ["CBC", "BSL", "HIV", "HBSAG"]
  },
  {
    srNo: 18,
    nameOfSurgery: "FFA",
    investigations: ["BSL"]
  }
];

// Surgery Packages with accurate pricing
const surgeryPackages = [
  { packageName: "AC Paracentesis", packageCost: 5500, category: "EMERGENCY" },
  { packageName: "Acid and Alkali Burns OPD Management", packageCost: 2500, category: "EMERGENCY" },
  { packageName: "Anterior Chamber Wash", packageCost: 26000, category: "EMERGENCY" },
  { packageName: "Automated Perimetry", packageCost: 5000, category: "GLAUCOMA" },
  { packageName: "Barrage Laser Unilateral one sitting", packageCost: 7500, category: "RETINAL" },
  { packageName: "Blepharoplasty", packageCost: 7500, category: "OCULOPLASTIC" },
  { packageName: "Buckle Removal", packageCost: 45000, category: "RETINAL" },
  { packageName: "Chalazion", packageCost: 7400, category: "OCULOPLASTIC" },
  { packageName: "Clinical Fundus Photograph", packageCost: 2500, category: "RETINAL" },
  { packageName: "Corneal Collagen Cross Linking", packageCost: 42000, category: "CORNEAL" },
  { packageName: "Corneal Foreign Body Removal (Unilateral) OPD Management", packageCost: 1200, category: "CORNEAL" },
  { packageName: "Corneal Pachymetry", packageCost: 1700, category: "CORNEAL" },
  { packageName: "Corneal Suture Removal under LA", packageCost: 18500, category: "CORNEAL" },
  { packageName: "Corneal Suturing with Anterior Chamber Reconstruction With Iris Prolapse Repair", packageCost: 20000, category: "CORNEAL" },
  { packageName: "Corneal Topography", packageCost: 6500, category: "CORNEAL" },
  { packageName: "Cryoretinopexy", packageCost: 55000, category: "RETINAL" },
  { packageName: "Cyclocryotherapy", packageCost: 38000, category: "GLAUCOMA" },
  { packageName: "Dacryocysto Rhinostomy (Conventional DCR)", packageCost: 32000, category: "OCULOPLASTIC" },
  { packageName: "Dacryocystectomy (DCT)", packageCost: 25000, category: "OCULOPLASTIC" },
  { packageName: "DALK", packageCost: 75000, category: "CORNEAL" },
  { packageName: "DSAEK", packageCost: 95000, category: "CORNEAL" },
  { packageName: "Ectropion / Entropion Correction (Unilateral)", packageCost: 38000, category: "OCULOPLASTIC" },
  { packageName: "Endonasal Dacryocysto Rhinostomy (Endonsal DCR)", packageCost: 38000, category: "OCULOPLASTIC" },
  { packageName: "Enucleation / Evisceration", packageCost: 38000, category: "OCULOPLASTIC" },
  { packageName: "Enucleation With Prosthesis Implant", packageCost: 65000, category: "OCULOPLASTIC" },
  { packageName: "Evisceration with implant", packageCost: 65000, category: "OCULOPLASTIC" },
  { packageName: "Excimer lase (LASIK) Refractive Surgery Bilateral", packageCost: 95000, category: "CORNEAL" },
  { packageName: "Excimer lase (LASIK) Refractive Surgery Unilateral", packageCost: 53000, category: "CORNEAL" },
  { packageName: "Exenteration", packageCost: 78000, category: "OCULOPLASTIC" },
  { packageName: "Eyelid lid tumour excision", packageCost: 25000, category: "OCULOPLASTIC" },
  { packageName: "Eyelid reconstruction", packageCost: 48000, category: "OCULOPLASTIC" },
  { packageName: "Focal Laser (Unilateral) Single Sitting", packageCost: 9500, category: "RETINAL" },
  { packageName: "Fundus Fluorescein Angiography", packageCost: 8000, category: "RETINAL" },
  { packageName: "Goniotomy", packageCost: 48000, category: "GLAUCOMA" },
  { packageName: "I & D Lid Abscess Drainage", packageCost: 24000, category: "OCULOPLASTIC" },
  { packageName: "Intraocular Foreign Body Removal With Vitrectomy", packageCost: 86500, category: "EMERGENCY" },
  { packageName: "IOL Dialing", packageCost: 32500, category: "CATARACT" },
  { packageName: "IRIS Prolapse Repair", packageCost: 42000, category: "EMERGENCY" },
  { packageName: "Kerato Prosthesis", packageCost: 10500, category: "CORNEAL" },
  { packageName: "Laser Iridectomy", packageCost: 7500, category: "GLAUCOMA" },
  { packageName: "Lensectomy + anterior vitrectomy + secondary IOL (excluding IOL charges)", packageCost: 55000, category: "CATARACT" },
  { packageName: "Lid Tear Suturing", packageCost: 45500, category: "EMERGENCY" },
  { packageName: "Limbal Dermoid Removal", packageCost: 39000, category: "OCULOPLASTIC" },
  { packageName: "Limbal Stem Cell Grafting", packageCost: 65500, category: "CORNEAL" },
  { packageName: "Macular Hole Surgery", packageCost: 92000, category: "RETINAL" },
  { packageName: "ND Yag Laser Posterior Capsulectomy (Unilateral)", packageCost: 5400, category: "CATARACT" },
  { packageName: "OCT (Optical Coherence Tomography)", packageCost: 7800, category: "RETINAL" },
  { packageName: "Ocular Examination under GA", packageCost: 17000, category: "EMERGENCY" },
  { packageName: "Optical Biometry / A Scan", packageCost: 2550, category: "CATARACT" },
  { packageName: "Orbitotomy", packageCost: 78000, category: "OCULOPLASTIC" },
  { packageName: "Ortho–Optic Exercises per session", packageCost: 700, category: "OCULOPLASTIC" },
  { packageName: "Orthoptic Checkup", packageCost: 1500, category: "OCULOPLASTIC" },
  { packageName: "Penetrating keratoplasty", packageCost: 85000, category: "CORNEAL" },
  { packageName: "Perforating Cornea – Scleral Injury Reconstruction with Vitrectomy", packageCost: 110000, category: "EMERGENCY" },
  { packageName: "Preoperative LASIK Assessment", packageCost: 9200, category: "CORNEAL" },
  { packageName: "Primary Corneal Tear Repair", packageCost: 65000, category: "EMERGENCY" },
  { packageName: "Primary Globe Rupture Repair", packageCost: 45000, category: "EMERGENCY" },
  { packageName: "Primary Lid Tear Repair", packageCost: 16000, category: "EMERGENCY" },
  { packageName: "Probing under GA", packageCost: 15000, category: "OCULOPLASTIC" },
  { packageName: "PRP Laser For Retinopathy Unilateral Single Sitting", packageCost: 5500, category: "RETINAL" },
  { packageName: "Pterygium Excision With Sutured Conjunctival Grafting Unilateral", packageCost: 26000, category: "OCULOPLASTIC" },
  { packageName: "Pterygium Excision With Sutureless Conjunctival Grafting With Fibrin Sealant Unilateral", packageCost: 44500, category: "OCULOPLASTIC" },
  { packageName: "Ptosis correction Unilateral", packageCost: 96500, category: "OCULOPLASTIC" },
  { packageName: "Retinal Detachment Surgery With Vitrectomy With Silicon Oil", packageCost: 120000, category: "RETINAL" },
  { packageName: "Scleral Buckle with 3 Port Pars Plana Vitrectomy With Silicon Oil", packageCost: 120000, category: "RETINAL" },
  { packageName: "Scleral buckle WITH Cryotherapy", packageCost: 48000, category: "RETINAL" },
  { packageName: "Secondary IOL Implant (Excluding IOL Charges)", packageCost: 46500, category: "CATARACT" },
  { packageName: "Silicone Oil Removal With Endolaser", packageCost: 84000, category: "RETINAL" },
  { packageName: "SIRION Cataract Surgery With PMMA IOL Implant", packageCost: 27200, category: "CATARACT" },
  { packageName: "Small Tumor of Lid / Cyst Excision", packageCost: 20000, category: "OCULOPLASTIC" },
  { packageName: "Squint Correction", packageCost: 58500, category: "OCULOPLASTIC" },
  { packageName: "Surgical Iridectomy", packageCost: 34000, category: "GLAUCOMA" },
  { packageName: "Surgical Posterior Capsulectomy", packageCost: 40000, category: "CATARACT" },
  { packageName: "Trabeculectomy", packageCost: 53500, category: "GLAUCOMA" },
  { packageName: "Tractional Retinal Detachment Surgery With Silicon Oil WITH Endolaser", packageCost: 92000, category: "RETINAL" },
  { packageName: "Traumatic Conjunctival Tear Repair", packageCost: 15000, category: "EMERGENCY" },
  { packageName: "Vitrectomy", packageCost: 58000, category: "RETINAL" },
  { packageName: "Vitrectomy With Epiretinal Membrane Peeling", packageCost: 84000, category: "RETINAL" },
  { packageName: "Vitrectomy With Silicon Oil", packageCost: 84000, category: "RETINAL" }
];

async function seedFitnessInvestigationSystem() {
  try {
    console.log('🌱 Starting to seed fitness investigation system...\n');

    // 1. Seed Fitness Investigations
    console.log('1️⃣ Seeding Fitness Investigations...');
    const createdInvestigations = [];
    
    for (const investigation of fitnessInvestigations) {
      const existing = await prisma.fitnessInvestigation.findUnique({
        where: { investigationName: investigation.investigationName }
      });
      
      if (!existing) {
        const created = await prisma.fitnessInvestigation.create({
          data: investigation
        });
        createdInvestigations.push(created);
        console.log(`   ✅ Created: ${investigation.investigationName}`);
      } else {
        createdInvestigations.push(existing);
        console.log(`   ⏭️  Exists: ${investigation.investigationName}`);
      }
    }
    console.log(`   📊 Total investigations: ${createdInvestigations.length}\n`);

    // 2. Seed Surgery Types
    console.log('2️⃣ Seeding Surgery Types...');
    const createdSurgeryTypes = [];
    
    for (const surgeryData of surgeryTypesData) {
      const existing = await prisma.surgeryType.findUnique({
        where: { name: surgeryData.nameOfSurgery }
      });
      
      if (!existing) {
        // Determine category based on surgery name
        let category = "CATARACT"; // default
        const surgeryName = surgeryData.nameOfSurgery.toLowerCase();
        
        if (surgeryName.includes('vitrectomy') || surgeryName.includes('retinal') || surgeryName.includes('rd ')) {
          category = "RETINAL";
        } else if (surgeryName.includes('ptosis') || surgeryName.includes('squint') || surgeryName.includes('dcr') || surgeryName.includes('dct') || surgeryName.includes('evisceration')) {
          category = "OCULOPLASTIC";
        } else if (surgeryName.includes('lasik') || surgeryName.includes('c3r') || surgeryName.includes('corneal')) {
          category = "CORNEAL";
        } else if (surgeryName.includes('glaucoma')) {
          category = "GLAUCOMA";
        } else if (surgeryData.nameOfSurgery.includes('trauma') || surgeryData.nameOfSurgery.includes('injection')) {
          category = "EMERGENCY";
        }
        
        const created = await prisma.surgeryType.create({
          data: {
            name: surgeryData.nameOfSurgery,
            code: `SUR${String(surgeryData.srNo).padStart(3, '0')}`,
            category: category,
            description: `${surgeryData.nameOfSurgery} - Requires ${surgeryData.investigations.length} pre-operative investigations`,
            averageDuration: surgeryData.nameOfSurgery.includes('Injection') ? 15 : surgeryData.nameOfSurgery.includes('Laser') ? 30 : 60,
            complexityLevel: surgeryData.investigations.length > 4 ? "High" : "Medium",
            isOutpatient: !surgeryData.nameOfSurgery.toLowerCase().includes('vitrectomy'),
            requiresAdmission: surgeryData.nameOfSurgery.toLowerCase().includes('vitrectomy') || surgeryData.nameOfSurgery.toLowerCase().includes('retinal detachment'),
            isActive: true
          }
        });
        createdSurgeryTypes.push(created);
        console.log(`   ✅ Created: ${surgeryData.nameOfSurgery} (${category})`);
      } else {
        createdSurgeryTypes.push(existing);
        console.log(`   ⏭️  Exists: ${surgeryData.nameOfSurgery}`);
      }
    }
    console.log(`   📊 Total surgery types: ${createdSurgeryTypes.length}\n`);

    // 3. Link Surgery Types with Investigations
    console.log('3️⃣ Linking Surgery Types with Required Investigations...');
    
    for (const surgeryData of surgeryTypesData) {
      const surgeryType = createdSurgeryTypes.find(st => st.name === surgeryData.nameOfSurgery);
      
      if (surgeryType) {
        for (let i = 0; i < surgeryData.investigations.length; i++) {
          const investigationName = surgeryData.investigations[i];
          const investigation = createdInvestigations.find(inv => inv.investigationName === investigationName);
          
          if (investigation) {
            const existing = await prisma.surgeryTypeFitnessInvestigation.findUnique({
              where: {
                surgeryTypeId_investigationId: {
                  surgeryTypeId: surgeryType.id,
                  investigationId: investigation.id
                }
              }
            });
            
            if (!existing) {
              // Set age requirements for specific investigations
              let minAge = null;
              let maxAge = null;
              let requirementType = "MANDATORY";
              
              if (investigationName === "ECG") {
                minAge = 40; // ECG mandatory for patients above 40
                requirementType = "AGE_SPECIFIC";
              } else if (investigationName === "Physician Fitness") {
                minAge = 50; // Physician fitness mandatory for elderly
                requirementType = "AGE_SPECIFIC";
              }
              
              await prisma.surgeryTypeFitnessInvestigation.create({
                data: {
                  surgeryTypeId: surgeryType.id,
                  investigationId: investigation.id,
                  requirementType: requirementType,
                  priority: i + 1,
                  minAge: minAge,
                  maxAge: maxAge,
                  minDaysBeforeSurgery: 1,
                  maxDaysBeforeSurgery: investigation.validityDays,
                  isActive: true
                }
              });
              
              console.log(`   🔗 Linked: ${surgeryType.name} → ${investigationName}`);
            }
          }
        }
      }
    }
    console.log(`   ✅ Surgery-Investigation links completed\n`);

    // 4. Seed Surgery Packages
    console.log('4️⃣ Seeding Surgery Packages...');
    let packageCount = 0;
    
    for (const packageData of surgeryPackages) {
      const existing = await prisma.surgeryPackage.findUnique({
        where: { packageName: packageData.packageName }
      });
      
      if (!existing) {
        // Try to link to surgery type if there's a match
        let surgeryTypeId = null;
        const matchingSurgery = createdSurgeryTypes.find(st => 
          packageData.packageName.toLowerCase().includes(st.name.toLowerCase().split(' ')[0]) ||
          st.name.toLowerCase().includes(packageData.packageName.toLowerCase().split(' ')[0])
        );
        
        if (matchingSurgery) {
          surgeryTypeId = matchingSurgery.id;
        }
        
        await prisma.surgeryPackage.create({
          data: {
            packageName: packageData.packageName,
            packageCode: `PKG${String(packageCount + 1).padStart(3, '0')}`,
            description: `${packageData.packageName} - Complete package including all necessary procedures and follow-up`,
            surgeryTypeId: surgeryTypeId,
            surgeryCategory: packageData.category,
            packageCost: packageData.packageCost,
            lensUpgradeCost: 0,
            discountEligible: true,
            followUpVisits: 3,
            emergencySupport: packageData.category === "EMERGENCY",
            isActive: true,
            isRecommended: packageData.packageCost > 50000,
            priority: packageData.packageCost > 100000 ? 1 : packageData.packageCost > 50000 ? 2 : 3,
            includedServices: [
              "Pre-operative consultation",
              "Surgery procedure", 
              "Post-operative care",
              "Follow-up visits"
            ],
            excludedServices: [
              "Additional medications",
              "Complications management",
              "Extended hospitalization"
            ]
          }
        });
        
        packageCount++;
        console.log(`   ✅ Created: ${packageData.packageName} - ₹${packageData.packageCost}${surgeryTypeId ? ` (linked to surgery)` : ` (standalone)`}`);
      } else {
        console.log(`   ⏭️  Exists: ${packageData.packageName}`);
        packageCount++;
      }
    }
    console.log(`   📊 Total packages: ${packageCount}\n`);

    // 5. Generate Summary Report
    console.log('📋 SEEDING SUMMARY REPORT');
    console.log('========================');
    
    const investigationsCount = await prisma.fitnessInvestigation.count();
    const surgeryTypesCount = await prisma.surgeryType.count();
    const linksCount = await prisma.surgeryTypeFitnessInvestigation.count();
    const packagesCount = await prisma.surgeryPackage.count();
    
    console.log(`✅ Fitness Investigations: ${investigationsCount}`);
    console.log(`✅ Surgery Types: ${surgeryTypesCount}`);
    console.log(`✅ Surgery-Investigation Links: ${linksCount}`);
    console.log(`✅ Surgery Packages: ${packagesCount}`);
    console.log(`\n🎉 Fitness Investigation System seeded successfully!`);
    
    // Show sample data
    console.log('\n📊 SAMPLE DATA PREVIEW:');
    console.log('=====================');
    
    const sampleSurgery = await prisma.surgeryType.findFirst({
      include: {
        fitnessInvestigations: {
          include: {
            investigation: true
          }
        },
        packages: true
      }
    });
    
    if (sampleSurgery) {
      console.log(`\n🔬 Sample Surgery: ${sampleSurgery.name}`);
      console.log(`   Required Investigations (${sampleSurgery.fitnessInvestigations.length}):`);
      sampleSurgery.fitnessInvestigations.forEach((link, index) => {
        console.log(`   ${index + 1}. ${link.investigation.investigationName} (${link.requirementType})`);
      });
      
      if (sampleSurgery.packages.length > 0) {
        console.log(`   Available Packages (${sampleSurgery.packages.length}):`);
        sampleSurgery.packages.forEach((pkg, index) => {
          console.log(`   ${index + 1}. ${pkg.packageName} - ₹${pkg.packageCost}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error seeding fitness investigation system:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedFitnessInvestigationSystem()
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedFitnessInvestigationSystem };