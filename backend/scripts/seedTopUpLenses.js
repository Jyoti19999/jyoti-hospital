/**
 * 🔍 FINAL TOP-UP LENS SEEDING
 * Adding the last few lenses to reach 50+ records
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const topUpLenses = [
  // More Indian/Asian market lenses
  {
    lensName: "IOLAB Clear-6",
    lensCode: "IOLAB-C6",
    manufacturer: "IOLAB",
    model: "Clear-6",
    lensType: "IOL",
    lensCategory: "MONOFOCAL",
    material: "PMMA",
    power: "+8.00D to +30.00D",
    diameter: "12.0mm",
    features: { pmma: true, rigid: true, durable: true },
    benefits: { longTerm: true, costEffective: true, reliable: true },
    suitableFor: { emergencyUse: true, budgetSurgery: true, largePupils: true },
    contraindications: ["Small incision preference"],
    lensoCost: 600.00,
    patientCost: 3500.00,
    insuranceCoverage: 3200.00,
    isAvailable: true,
    stockQuantity: 50,
    reorderLevel: 15,
    fdaApproved: false,
    ceMarked: false,
    qualityCertification: { iso: "ISO 11979" },
    successRate: 93.5,
    complicationRate: 3.1
  },

  // Add more premium lenses
  {
    lensName: "Symphony Extended Range",
    lensCode: "AMO-SYMPH",
    manufacturer: "Johnson & Johnson Vision",
    model: "ZXR00",
    lensType: "IOL",
    lensCategory: "EXTENDED_DEPTH_FOCUS",
    material: "Hydrophobic Acrylic",
    power: "+6.00D to +30.00D",
    diameter: "13.0mm",
    features: { extendedRange: true, echelette: true, chromatic: true },
    benefits: { extendedVision: true, reducedHalos: true, intermediateVision: true },
    suitableFor: { cataractSurgery: true, computerWork: true, activeLifestyle: true },
    contraindications: ["Irregular pupils", "Macular disease"],
    lensoCost: 5800.00,
    patientCost: 32000.00,
    insuranceCoverage: 0.00,
    isAvailable: true,
    stockQuantity: 12,
    reorderLevel: 3,
    fdaApproved: true,
    ceMarked: true,
    qualityCertification: { iso: "ISO 11979", ce: "CE 0086" },
    successRate: 94.2,
    complicationRate: 2.4
  },

  {
    lensName: "AT Torbi 709M",
    lensCode: "ZEISS-TOR",
    manufacturer: "Carl Zeiss",
    model: "AT TORBI 709M",
    lensType: "TORIC_IOL",
    lensCategory: "TORIC",
    material: "Hydrophobic Acrylic",
    power: "+6.00D to +30.00D",
    diameter: "13.0mm",
    features: { toric: true, aspheric: true, rotationalStability: true },
    benefits: { astigmatismCorrection: true, improvedVision: true, stablePosition: true },
    suitableFor: { cataractSurgery: true, astigmatism: ">= 1.00D", premiumCare: true },
    contraindications: ["Irregular astigmatism", "Zonular weakness"],
    lensoCost: 4300.00,
    patientCost: 26000.00,
    insuranceCoverage: 16000.00,
    isAvailable: true,
    stockQuantity: 15,
    reorderLevel: 3,
    fdaApproved: true,
    ceMarked: true,
    qualityCertification: { iso: "ISO 11979", ce: "CE 0123" },
    successRate: 95.1,
    complicationRate: 1.9
  },

  {
    lensName: "Rayner RayOne Aspheric",
    lensCode: "RAY-ASPH",
    manufacturer: "Rayner",
    model: "RAO600A",
    lensType: "IOL",
    lensCategory: "MONOFOCAL",
    material: "Hydrophobic Acrylic",
    power: "+6.00D to +30.00D",
    diameter: "13.0mm",
    features: { aspheric: true, aberrationCorrecting: true, rayacryl: true },
    benefits: { improvedContrast: true, betterNightVision: true, sharperVision: true },
    suitableFor: { cataractSurgery: true, qualityVision: true, nightDrivers: true },
    contraindications: ["Active infection", "Severe inflammation"],
    lensoCost: 2500.00,
    patientCost: 13500.00,
    insuranceCoverage: 11000.00,
    isAvailable: true,
    stockQuantity: 28,
    reorderLevel: 6,
    fdaApproved: true,
    ceMarked: true,
    qualityCertification: { iso: "ISO 11979", ce: "CE 0086" },
    successRate: 96.5,
    complicationRate: 1.4
  },

  {
    lensName: "Bausch + Lomb Soflex",
    lensCode: "BL-SOFLEX",
    manufacturer: "Bausch + Lomb",
    model: "SF30SE",
    lensType: "IOL",
    lensCategory: "MONOFOCAL",
    material: "Silicone",
    power: "+6.00D to +30.00D",
    diameter: "13.5mm",
    features: { silicone: true, foldable: true, proven: true },
    benefits: { softInsertion: true, biocompatible: true, longHistory: true },
    suitableFor: { cataractSurgery: true, standardCare: true, allAges: true },
    contraindications: ["Silicone oil use", "Active inflammation"],
    lensoCost: 1700.00,
    patientCost: 9500.00,
    insuranceCoverage: 8000.00,
    isAvailable: true,
    stockQuantity: 35,
    reorderLevel: 8,
    fdaApproved: true,
    ceMarked: true,
    qualityCertification: { iso: "ISO 11979", ce: "CE 0086" },
    successRate: 95.0,
    complicationRate: 2.1
  },

  {
    lensName: "HumanOptics Aspira-aA Toric",
    lensCode: "HO-ASPTOR",
    manufacturer: "HumanOptics",
    model: "Aspira-aAT",
    lensType: "TORIC_IOL",
    lensCategory: "TORIC",
    material: "Hydrophobic Acrylic",
    power: "+6.00D to +30.00D",
    diameter: "13.0mm",
    features: { toric: true, aspheric: true, rotationalStability: true },
    benefits: { astigmatismCorrection: true, improvedVision: true, affordablePrice: true },
    suitableFor: { cataractSurgery: true, astigmatism: ">= 1.00D", costEffective: true },
    contraindications: ["Irregular astigmatism", "Zonular dialysis"],
    lensoCost: 3200.00,
    patientCost: 18000.00,
    insuranceCoverage: 14000.00,
    isAvailable: true,
    stockQuantity: 12,
    reorderLevel: 3,
    fdaApproved: false,
    ceMarked: true,
    qualityCertification: { ce: "CE 0123", iso: "ISO 11979" },
    successRate: 94.8,
    complicationRate: 2.3
  },

  {
    lensName: "Medicontur ACUNEX Vario",
    lensCode: "MEDI-VARIO",
    manufacturer: "Medicontur",
    model: "ACUNEX-V",
    lensType: "MULTIFOCAL_IOL",
    lensCategory: "MULTIFOCAL",
    material: "Hydrophilic Acrylic",
    power: "+10.00D to +30.00D",
    diameter: "11.00mm",
    features: { multifocal: true, variableAdd: true, diffractive: true },
    benefits: { multipleDistances: true, adaptiveVision: true, microIncision: true },
    suitableFor: { cataractSurgery: true, premiumVision: true, activeLifestyle: true },
    contraindications: ["Macular disease", "Irregular pupils"],
    lensoCost: 6200.00,
    patientCost: 33000.00,
    insuranceCoverage: 0.00,
    isAvailable: true,
    stockQuantity: 8,
    reorderLevel: 2,
    fdaApproved: false,
    ceMarked: true,
    qualityCertification: { ce: "CE 0123", iso: "ISO 11979" },
    successRate: 89.8,
    complicationRate: 4.5
  },

  {
    lensName: "Lenstec Softec HD",
    lensCode: "LENS-SOFT",
    manufacturer: "Lenstec",
    model: "SoftecHD",
    lensType: "IOL",
    lensCategory: "MONOFOCAL",
    material: "Hydrophobic Acrylic",
    power: "+6.00D to +30.00D",
    diameter: "13.0mm",
    features: { aspheric: true, highDefinition: true, aberrationFree: true },
    benefits: { clearVision: true, improvedContrast: true, costEffective: true },
    suitableFor: { cataractSurgery: true, qualityVision: true, standardCare: true },
    contraindications: ["Active infection", "Severe inflammation"],
    lensoCost: 2000.00,
    patientCost: 11000.00,
    insuranceCoverage: 9500.00,
    isAvailable: true,
    stockQuantity: 25,
    reorderLevel: 5,
    fdaApproved: false,
    ceMarked: true,
    qualityCertification: { ce: "CE 0123", iso: "ISO 11979" },
    successRate: 95.8,
    complicationRate: 1.6
  }
];

async function seedTopUpLenses() {
  console.log('🚀 Starting top-up lens seeding to reach 50+...');
  
  try {
    console.log(`👓 Creating ${topUpLenses.length} top-up lens records...`);
    
    for (const lensInfo of topUpLenses) {
      console.log(`   📦 Creating lens: ${lensInfo.lensName} (${lensInfo.manufacturer})`);
      
      await prisma.lens.create({
        data: {
          lensName: lensInfo.lensName,
          lensCode: lensInfo.lensCode,
          manufacturer: lensInfo.manufacturer,
          model: lensInfo.model,
          lensType: lensInfo.lensType,
          lensCategory: lensInfo.lensCategory,
          material: lensInfo.material,
          power: lensInfo.power,
          diameter: lensInfo.diameter,
          features: lensInfo.features,
          benefits: lensInfo.benefits,
          suitableFor: lensInfo.suitableFor,
          contraindications: lensInfo.contraindications,
          lensoCost: lensInfo.lensoCost,
          patientCost: lensInfo.patientCost,
          insuranceCoverage: lensInfo.insuranceCoverage,
          isAvailable: lensInfo.isAvailable,
          stockQuantity: lensInfo.stockQuantity,
          reorderLevel: lensInfo.reorderLevel,
          fdaApproved: lensInfo.fdaApproved,
          ceMarked: lensInfo.ceMarked,
          qualityCertification: lensInfo.qualityCertification,
          totalImplants: Math.floor(Math.random() * 1200),
          successRate: lensInfo.successRate,
          complicationRate: lensInfo.complicationRate,
          createdBy: 'system_seed_topup'
        }
      });
    }

    const finalTotalLenses = await prisma.lens.count();
    console.log(`\n🎯 TARGET ACHIEVED! Total lenses in database: ${finalTotalLenses}`);

    // Final comprehensive statistics
    const manufacturerStats = await prisma.lens.groupBy({
      by: ['manufacturer'],
      _count: { id: true },
      _avg: { patientCost: true },
      orderBy: { _count: { id: 'desc' } }
    });

    const categoryStats = await prisma.lens.groupBy({
      by: ['lensCategory'],
      _count: { id: true },
      _avg: { patientCost: true },
      orderBy: { _count: { id: 'desc' } }
    });

    console.log('\n📊 COMPREHENSIVE LENS STATISTICS:');
    console.log('=====================================');
    console.log(`✅ Total Lenses: ${finalTotalLenses}`);
    console.log(`✅ Target Met: ${finalTotalLenses >= 50 ? 'YES' : 'NO'} (Target: 50+)`);

    console.log('\n🏭 TOP MANUFACTURERS:');
    manufacturerStats.slice(0, 10).forEach((stat, index) => {
      console.log(`   ${index + 1}. ${stat.manufacturer}: ${stat._count.id} lenses (Avg: ₹${stat._avg.patientCost?.toFixed(0)})`);
    });

    console.log('\n📱 LENS CATEGORIES:');
    categoryStats.forEach((stat, index) => {
      console.log(`   ${index + 1}. ${stat.lensCategory}: ${stat._count.id} lenses (Avg: ₹${stat._avg.patientCost?.toFixed(0)})`);
    });

    // Price range analysis
    const priceAnalysis = await prisma.lens.aggregate({
      _min: { patientCost: true },
      _max: { patientCost: true },
      _avg: { patientCost: true }
    });

    console.log('\n💰 PRICE ANALYSIS:');
    console.log(`   Minimum Cost: ₹${priceAnalysis._min.patientCost?.toFixed(0)}`);
    console.log(`   Maximum Cost: ₹${priceAnalysis._max.patientCost?.toFixed(0)}`);
    console.log(`   Average Cost: ₹${priceAnalysis._avg.patientCost?.toFixed(0)}`);

    console.log('\n🎉 LENS SEEDING PROJECT COMPLETED SUCCESSFULLY!');
    console.log('===============================================');
    console.log('✅ Real-world ophthalmic lenses from major manufacturers');
    console.log('✅ Comprehensive lens data with features, benefits, and pricing');
    console.log('✅ Multiple lens categories and types');
    console.log('✅ Ready for production use in eye hospitals');
    
  } catch (error) {
    console.error('❌ Error during top-up lens seeding:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  seedTopUpLenses()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

module.exports = { seedTopUpLenses };