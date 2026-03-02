/**
 * 🔍 COMPREHENSIVE LENS SEEDING - FINAL BATCH
 * Adding more real-world lenses to reach 50+ total records
 * Includes specialized and regional lenses
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const finalLensBatch = [
  // ============================================
  // MORE INTERNATIONAL BRANDS
  // ============================================

  // Menicon Soft S
  {
    lensName: "Menicon Soft S",
    lensCode: "MENI-SOFTS",
    manufacturer: "Menicon",
    model: "MS-30",
    lensType: "IOL",
    lensCategory: "MONOFOCAL",
    material: "Hydrophobic Acrylic",
    power: "+6.00D to +30.00D",
    diameter: "13.0mm",
    features: { aspheric: true, uvBlocking: true, foldable: true },
    benefits: { smoothInsertion: true, clearVision: true, biocompatible: true },
    suitableFor: { cataractSurgery: true, asianEyes: true, standardCare: true },
    contraindications: ["Active infection", "Severe inflammation"],
    lensoCost: 2200.00,
    patientCost: 12000.00,
    insuranceCoverage: 10000.00,
    isAvailable: true,
    stockQuantity: 25,
    reorderLevel: 5,
    fdaApproved: false,
    ceMarked: true,
    qualityCertification: { ce: "CE 0123", iso: "ISO 11979" },
    successRate: 96.1,
    complicationRate: 1.6
  },

  // Ophtec PC IOL
  {
    lensName: "PC IOL",
    lensCode: "OPHTEC-PC",
    manufacturer: "Ophtec",
    model: "PC-IOL-311",
    lensType: "IOL",
    lensCategory: "MONOFOCAL",
    material: "PMMA",
    power: "+5.00D to +30.00D",
    diameter: "13.0mm",
    features: { pmma: true, rigid: true, uvFilter: true, proven: true },
    benefits: { longTerm: true, stable: true, durable: true, costEffective: true },
    suitableFor: { cataractSurgery: true, largePupils: true, budgetCare: true },
    contraindications: ["Small incision preference", "Premium expectations"],
    lensoCost: 900.00,
    patientCost: 5000.00,
    insuranceCoverage: 4500.00,
    isAvailable: true,
    stockQuantity: 40,
    reorderLevel: 10,
    fdaApproved: false,
    ceMarked: true,
    qualityCertification: { ce: "CE 0123", iso: "ISO 11979" },
    successRate: 94.8,
    complicationRate: 2.2
  },

  // Teleon AdaptIOL
  {
    lensName: "AdaptIOL",
    lensCode: "TEL-ADAPT",
    manufacturer: "Teleon Surgical",
    model: "ADAPT-AO",
    lensType: "ACCOMMODATING_IOL",
    lensCategory: "ACCOMMODATING",
    material: "Hydrophobic Acrylic",
    power: "+16.00D to +25.00D",
    diameter: "11.5mm",
    features: { accommodating: true, adaptive: true, flexibleOptic: true },
    benefits: { accommodativeAmplitude: true, intermediateVision: true, functionalNear: true },
    suitableFor: { premiumCataract: true, accommodativeDemand: true, youngerPatients: true },
    contraindications: ["Zonular weakness", "Previous vitrectomy", "Unrealistic expectations"],
    lensoCost: 7200.00,
    patientCost: 38000.00,
    insuranceCoverage: 0.00,
    isAvailable: false,
    stockQuantity: 2,
    reorderLevel: 1,
    fdaApproved: false,
    ceMarked: true,
    qualityCertification: { ce: "CE 0123", iso: "ISO 11979" },
    successRate: 87.5,
    complicationRate: 5.8
  },

  // ============================================
  // MORE ALCON VARIANTS
  // ============================================

  // AcrySof MA30BA
  {
    lensName: "AcrySof MA30BA",
    lensCode: "ACRY-MA30",
    manufacturer: "Alcon",
    model: "MA30BA",
    lensType: "IOL",
    lensCategory: "MONOFOCAL",
    material: "Hydrophobic Acrylic",
    power: "+6.00D to +30.00D",
    diameter: "13.0mm",
    features: { biconvex: true, anterior: true, squareEdge: true },
    benefits: { pcoPrevention: true, sharpVision: true, proven: true },
    suitableFor: { cataractSurgery: true, pcoPrevention: true, standardCare: true },
    contraindications: ["Active infection", "Severe uveitis"],
    lensoCost: 2400.00,
    patientCost: 13000.00,
    insuranceCoverage: 11000.00,
    isAvailable: true,
    stockQuantity: 35,
    reorderLevel: 7,
    fdaApproved: true,
    ceMarked: true,
    qualityCertification: { iso: "ISO 11979", ce: "CE 0123" },
    successRate: 96.5,
    complicationRate: 1.5
  },

  // AcrySof SA30AL
  {
    lensName: "AcrySof SA30AL",
    lensCode: "ACRY-SA30",
    manufacturer: "Alcon",
    model: "SA30AL",
    lensType: "IOL",
    lensCategory: "MONOFOCAL",
    material: "Hydrophobic Acrylic",
    power: "+6.00D to +30.00D",
    diameter: "13.0mm",
    features: { singlePiece: true, modified: true, squareEdge: true },
    benefits: { easyInsertion: true, stablePosition: true, pcoPrevention: true },
    suitableFor: { cataractSurgery: true, routineCases: true, allAges: true },
    contraindications: ["Active infection", "Severe inflammation"],
    lensoCost: 2300.00,
    patientCost: 12500.00,
    insuranceCoverage: 10500.00,
    isAvailable: true,
    stockQuantity: 30,
    reorderLevel: 6,
    fdaApproved: true,
    ceMarked: true,
    qualityCertification: { iso: "ISO 11979", ce: "CE 0123" },
    successRate: 96.3,
    complicationRate: 1.6
  },

  // ============================================
  // MORE BAUSCH + LOMB VARIANTS
  // ============================================

  // Akreos Adapt AO
  {
    lensName: "Akreos Adapt AO",
    lensCode: "AKRE-ADAPT",
    manufacturer: "Bausch + Lomb",
    model: "AO60",
    lensType: "IOL",
    lensCategory: "MONOFOCAL",
    material: "Hydrophilic Acrylic",
    power: "+6.00D to +30.00D",
    diameter: "11.0mm",
    features: { hydrophilic: true, aberrationNeutral: true, openLoopHaptics: true },
    benefits: { microIncision: true, goodCentering: true, costEffective: true },
    suitableFor: { cataractSurgery: true, microIncision: true, standardCare: true },
    contraindications: ["Active inflammation", "Zonular dialysis"],
    lensoCost: 1900.00,
    patientCost: 10500.00,
    insuranceCoverage: 9000.00,
    isAvailable: true,
    stockQuantity: 40,
    reorderLevel: 8,
    fdaApproved: true,
    ceMarked: true,
    qualityCertification: { iso: "ISO 11979", ce: "CE 0086" },
    successRate: 95.7,
    complicationRate: 1.8
  },

  // Akreos MICS
  {
    lensName: "Akreos MICS",
    lensCode: "AKRE-MICS",
    manufacturer: "Bausch + Lomb",
    model: "MI60",
    lensType: "IOL",
    lensCategory: "MONOFOCAL",
    material: "Hydrophilic Acrylic",
    power: "+6.00D to +30.00D",
    diameter: "10.0mm",
    features: { mics: true, microIncision: true, hydrophilic: true },
    benefits: { smallIncision: true, fastHealing: true, goodVisualOutcomes: true },
    suitableFor: { microIncisionSurgery: true, fastRecovery: true, premiumTechnique: true },
    contraindications: ["Large pupils", "Zonular weakness"],
    lensoCost: 2500.00,
    patientCost: 14000.00,
    insuranceCoverage: 11500.00,
    isAvailable: true,
    stockQuantity: 20,
    reorderLevel: 4,
    fdaApproved: true,
    ceMarked: true,
    qualityCertification: { iso: "ISO 11979", ce: "CE 0086" },
    successRate: 96.0,
    complicationRate: 1.7
  },

  // ============================================
  // MORE SPECIALTY LENSES
  // ============================================

  // AMO Phacoflex SI30NB
  {
    lensName: "Phacoflex SI30NB",
    lensCode: "AMO-PHACO",
    manufacturer: "Johnson & Johnson Vision",
    model: "SI30NB",
    lensType: "IOL",
    lensCategory: "MONOFOCAL",
    material: "Silicone",
    power: "+6.00D to +30.00D",
    diameter: "13.0mm",
    features: { silicone: true, threePoint: true, biocompatible: true },
    benefits: { provenSafety: true, foldable: true, easyInsertion: true },
    suitableFor: { cataractSurgery: true, standardCare: true, costEffective: true },
    contraindications: ["Silicone oil planned", "Severe inflammation"],
    lensoCost: 1800.00,
    patientCost: 10000.00,
    insuranceCoverage: 8500.00,
    isAvailable: true,
    stockQuantity: 35,
    reorderLevel: 7,
    fdaApproved: true,
    ceMarked: true,
    qualityCertification: { iso: "ISO 11979", ce: "CE 0086" },
    successRate: 95.3,
    complicationRate: 1.9
  },

  // Lentis Mplus Comfort LS-313
  {
    lensName: "Lentis Mplus Comfort",
    lensCode: "LENT-MPLUS",
    manufacturer: "OCULENTIS",
    model: "LS-313 MF15",
    lensType: "MULTIFOCAL_IOL",
    lensCategory: "MULTIFOCAL",
    material: "Hydrophilic Acrylic",
    power: "+10.00D to +32.00D",
    diameter: "11.0mm",
    features: { sectorShaped: true, nearAdd: "+1.50D", rotationally: false },
    benefits: { microIncision: true, reducedHalos: true, goodIntermediate: true },
    suitableFor: { cataractSurgery: true, microIncision: true, computerWork: true },
    contraindications: ["Irregular pupils", "Macular disease"],
    lensoCost: 6800.00,
    patientCost: 36000.00,
    insuranceCoverage: 0.00,
    isAvailable: true,
    stockQuantity: 6,
    reorderLevel: 2,
    fdaApproved: false,
    ceMarked: true,
    qualityCertification: { ce: "CE 0123", iso: "ISO 11979" },
    successRate: 91.2,
    complicationRate: 3.8
  },

  // ============================================
  // ADDITIONAL PREMIUM LENSES
  // ============================================

  // Add 15 more diverse lenses...

  // Zeiss CT Lucia 602
  {
    lensName: "CT Lucia 602",
    lensCode: "ZEISS-LUC",
    manufacturer: "Carl Zeiss",
    model: "CT LUCIA 602",
    lensType: "IOL",
    lensCategory: "MONOFOCAL",
    material: "Hydrophobic Acrylic",
    power: "+6.00D to +30.00D",
    diameter: "13.0mm",
    features: { aberrationNeutral: true, uvFilter: true, biconvex: true },
    benefits: { excellentOptics: true, naturalVision: true, proven: true },
    suitableFor: { cataractSurgery: true, qualityVision: true, allPatients: true },
    contraindications: ["Active infection", "Severe inflammation"],
    lensoCost: 2800.00,
    patientCost: 15500.00,
    insuranceCoverage: 12500.00,
    isAvailable: true,
    stockQuantity: 25,
    reorderLevel: 5,
    fdaApproved: true,
    ceMarked: true,
    qualityCertification: { iso: "ISO 11979", ce: "CE 0123" },
    successRate: 96.7,
    complicationRate: 1.4
  }

  // Continue with more lenses...
];

// Additional lens models to reach target
const extraLenses = [
  // More models from different manufacturers
  {
    lensName: "iSert 255",
    lensCode: "HOYA-255",
    manufacturer: "HOYA",
    model: "PY-60MV",
    lensType: "IOL",
    lensCategory: "MONOFOCAL",
    material: "Hydrophobic Acrylic",
    power: "+6.00D to +30.00D",
    diameter: "13.2mm",
    features: { aspheric: true, microVolumetric: true },
    benefits: { preciseInjection: true, consistentPerformance: true },
    suitableFor: { cataractSurgery: true, preciseSurgery: true },
    contraindications: ["Active infection"],
    lensoCost: 2600.00,
    patientCost: 14000.00,
    insuranceCoverage: 11500.00,
    isAvailable: true,
    stockQuantity: 20,
    reorderLevel: 4,
    fdaApproved: true,
    ceMarked: true,
    qualityCertification: { iso: "ISO 11979", ce: "CE 0086" },
    successRate: 96.4,
    complicationRate: 1.5
  }

  // Add more lenses to reach 50+ total...
];

async function seedFinalLensBatch() {
  console.log('🚀 Starting final lens batch seeding...');
  
  try {
    const allFinalLenses = [...finalLensBatch, ...extraLenses];
    
    console.log(`👓 Creating ${allFinalLenses.length} final lens records...`);
    
    for (const lensInfo of allFinalLenses) {
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
          totalImplants: Math.floor(Math.random() * 800),
          successRate: lensInfo.successRate,
          complicationRate: lensInfo.complicationRate,
          createdBy: 'system_seed_final'
        }
      });
    }

    const totalLenses = await prisma.lens.count();
    console.log(`✅ Final total lenses in database: ${totalLenses}`);

    // Final statistics
    const finalStats = await prisma.lens.groupBy({
      by: ['manufacturer'],
      _count: { id: true },
      _avg: { patientCost: true }
    });

    console.log('\n📊 FINAL LENS STATISTICS:');
    finalStats.forEach(stat => {
      console.log(`   ${stat.manufacturer}: ${stat._count.id} lenses (Avg: ₹${stat._avg.patientCost?.toFixed(0)})`);
    });
    
    console.log('\n🎉 Final lens seeding completed successfully!');
    console.log(`🏆 Achievement: ${totalLenses} total lenses in database!`);
    
  } catch (error) {
    console.error('❌ Error during final lens seeding:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  seedFinalLensBatch()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

module.exports = { seedFinalLensBatch, finalLensBatch };