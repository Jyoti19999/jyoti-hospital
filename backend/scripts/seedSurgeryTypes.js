// scripts/seedSurgeryTypes.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedSurgeryTypes() {
  console.log('🌱 Seeding surgery types, packages, and lenses...');

  try {
    // Create Surgery Types
    const surgeryTypes = [
      {
        name: 'Cataract Surgery (Phacoemulsification)',
        code: 'CAT001',
        category: 'CATARACT',
        description: 'Removal of clouded lens using ultrasonic energy',
        averageDuration: 30,
        complexityLevel: 'Medium',
        requiresAnesthesia: 'Local',
        isOutpatient: true,
        requiresAdmission: false,
        baseCost: 25000.00,
        requiredEquipment: ['Phaco machine', 'Microscope', 'IOL injector'],
        preOpRequirements: ['Biometry', 'IOL calculation', 'Dilated fundus examination'],
        postOpInstructions: ['Use prescribed eye drops', 'Avoid water contact for 1 week', 'No heavy lifting'],
        followUpSchedule: ['1 day', '1 week', '1 month', '3 months']
      },
      {
        name: 'LASIK Surgery',
        code: 'LAS001',
        category: 'CORNEAL',
        description: 'Laser-assisted in situ keratomileusis for vision correction',
        averageDuration: 20,
        complexityLevel: 'High',
        requiresAnesthesia: 'Topical',
        isOutpatient: true,
        requiresAdmission: false,
        baseCost: 45000.00,
        requiredEquipment: ['Excimer laser', 'Femtosecond laser', 'Wavefront analyzer'],
        preOpRequirements: ['Corneal topography', 'Wavefront analysis', 'Pachymetry'],
        postOpInstructions: ['Protective eye shields', 'Avoid rubbing eyes', 'Regular follow-ups'],
        followUpSchedule: ['1 day', '1 week', '1 month', '6 months']
      },
      {
        name: 'Glaucoma Trabeculectomy',
        code: 'GLA001',
        category: 'GLAUCOMA',
        description: 'Surgical creation of drainage opening to reduce intraocular pressure',
        averageDuration: 45,
        complexityLevel: 'High',
        requiresAnesthesia: 'Local',
        isOutpatient: false,
        requiresAdmission: true,
        baseCost: 35000.00,
        requiredEquipment: ['Microscope', 'Antimetabolites', 'Specialized instruments'],
        preOpRequirements: ['Visual field test', 'OCT', 'IOP measurement'],
        postOpInstructions: ['Strict medication compliance', 'Avoid strenuous activity', 'Regular IOP monitoring'],
        followUpSchedule: ['1 day', '1 week', '2 weeks', '1 month', '3 months']
      },
      {
        name: 'Retinal Detachment Surgery',
        code: 'RET001',
        category: 'RETINAL',
        description: 'Surgical repair of detached retina using various techniques',
        averageDuration: 90,
        complexityLevel: 'High',
        requiresAnesthesia: 'Local/General',
        isOutpatient: false,
        requiresAdmission: true,
        baseCost: 55000.00,
        requiredEquipment: ['Vitrectomy machine', 'Endolaser', 'Gas tamponade', 'Silicone oil'],
        preOpRequirements: ['Detailed fundus examination', 'B-scan ultrasound', 'OCT'],
        postOpInstructions: ['Positioning restrictions', 'No air travel if gas bubble', 'Regular monitoring'],
        followUpSchedule: ['1 day', '3 days', '1 week', '2 weeks', '1 month', '3 months']
      },
      {
        name: 'Ptosis Correction',
        code: 'OCU001',
        category: 'OCULOPLASTIC',
        description: 'Surgical correction of drooping upper eyelid',
        averageDuration: 60,
        complexityLevel: 'Medium',
        requiresAnesthesia: 'Local',
        isOutpatient: true,
        requiresAdmission: false,
        baseCost: 20000.00,
        requiredEquipment: ['Microsurgical instruments', 'Sutures'],
        preOpRequirements: ['Levator function assessment', 'Visual field test'],
        postOpInstructions: ['Cold compress', 'Antibiotic ointment', 'Avoid strain'],
        followUpSchedule: ['1 week', '2 weeks', '1 month', '3 months']
      }
    ];

    const createdSurgeryTypes = [];
    for (const surgeryType of surgeryTypes) {
      const created = await prisma.surgeryType.upsert({
        where: { name: surgeryType.name },
        update: surgeryType,
        create: surgeryType
      });
      createdSurgeryTypes.push(created);
      console.log(`✅ Created/Updated surgery type: ${created.name}`);
    }

    // Create Lenses
    const lenses = [
      {
        lensName: 'Acrysof IQ Monofocal IOL',
        lensCode: 'ACR001',
        manufacturer: 'Alcon',
        model: 'SN60WF',
        lensType: 'IOL',
        lensCategory: 'MONOFOCAL',
        material: 'Hydrophobic acrylic',
        power: '6.0D to 30.0D',
        diameter: '13.0mm',
        features: ['UV blocking', 'Blue light filtering', 'Aspheric design'],
        benefits: ['Excellent visual quality', 'Reduced glare', 'Good contrast sensitivity'],
        suitableFor: ['Standard cataract surgery', 'Patients wanting distance vision'],
        lensoCost: 2000.00,
        patientCost: 5000.00,
        fdaApproved: true,
        ceMarked: true
      },
      {
        lensName: 'Tecnis Multifocal IOL',
        lensCode: 'TEC001',
        manufacturer: 'Johnson & Johnson',
        model: 'ZMB00',
        lensType: 'MULTIFOCAL_IOL',
        lensCategory: 'MULTIFOCAL',
        material: 'Hydrophobic acrylic',
        power: '5.0D to 34.0D',
        diameter: '13.0mm',
        features: ['Diffractive multifocal', 'Aspheric design', 'UV protection'],
        benefits: ['Near and distance vision', 'Reduced dependence on glasses'],
        suitableFor: ['Patients wanting spectacle independence', 'Good candidates for presbyopia correction'],
        lensoCost: 15000.00,
        patientCost: 25000.00,
        fdaApproved: true,
        ceMarked: true
      },
      {
        lensName: 'Acrysof Toric IOL',
        lensCode: 'ACR002',
        manufacturer: 'Alcon',
        model: 'SN6AT',
        lensType: 'TORIC_IOL',
        lensCategory: 'TORIC',
        material: 'Hydrophobic acrylic',
        power: '6.0D to 30.0D',
        diameter: '13.0mm',
        features: ['Astigmatism correction', 'Stable positioning', 'Blue light filtering'],
        benefits: ['Corrects astigmatism', 'Improved visual quality', 'Reduced spectacle dependence'],
        suitableFor: ['Patients with corneal astigmatism', 'Cataract with astigmatism'],
        lensoCost: 8000.00,
        patientCost: 15000.00,
        fdaApproved: true,
        ceMarked: true
      },
      {
        lensName: 'Standard PMMA IOL',
        lensCode: 'STD001',
        manufacturer: 'Various',
        model: 'Standard',
        lensType: 'IOL',
        lensCategory: 'MONOFOCAL',
        material: 'PMMA',
        power: '5.0D to 30.0D',
        diameter: '12.5mm',
        features: ['Basic monofocal', 'Rigid design'],
        benefits: ['Cost effective', 'Proven technology'],
        suitableFor: ['Standard cataract surgery', 'Budget-conscious patients'],
        lensoCost: 500.00,
        patientCost: 1000.00,
        fdaApproved: true,
        ceMarked: true
      }
    ];

    const createdLenses = [];
    for (const lens of lenses) {
      const created = await prisma.lens.upsert({
        where: { lensCode: lens.lensCode },
        update: lens,
        create: lens
      });
      createdLenses.push(created);
      console.log(`✅ Created/Updated lens: ${created.lensName}`);
    }

    // Create Surgery Packages
    const cataractSurgeryType = createdSurgeryTypes.find(st => st.category === 'CATARACT');
    const lasikSurgeryType = createdSurgeryTypes.find(st => st.category === 'CORNEAL');
    
    if (cataractSurgeryType && lasikSurgeryType) {
      const packages = [
        {
          surgeryTypeId: cataractSurgeryType.id,
          packageName: 'Basic Cataract Package',
          packageCode: 'CAT-BASIC',
          description: 'Standard cataract surgery with monofocal lens',
          includedServices: ['Surgery', 'Standard IOL', 'Post-op medications', '3 follow-up visits'],
          excludedServices: ['Premium lenses', 'Additional tests'],
          defaultLensId: createdLenses.find(l => l.lensCode === 'STD001')?.id,
          packageCost: 25000.00,
          lensUpgradeCost: 0,
          warrantyPeriod: 12,
          followUpVisits: 3,
          isRecommended: true,
          priority: 1
        },
        {
          surgeryTypeId: cataractSurgeryType.id,
          packageName: 'Premium Cataract Package',
          packageCode: 'CAT-PREMIUM',
          description: 'Premium cataract surgery with advanced IOL options',
          includedServices: ['Surgery', 'Premium IOL', 'Advanced biometry', 'Post-op medications', '5 follow-up visits'],
          excludedServices: ['Multifocal lens upgrade'],
          defaultLensId: createdLenses.find(l => l.lensCode === 'ACR001')?.id,
          packageCost: 35000.00,
          lensUpgradeCost: 5000.00,
          warrantyPeriod: 24,
          followUpVisits: 5,
          isRecommended: false,
          priority: 2
        },
        {
          surgeryTypeId: cataractSurgeryType.id,
          packageName: 'Luxury Multifocal Package',
          packageCode: 'CAT-LUXURY',
          description: 'Premium cataract surgery with multifocal lens for spectacle independence',
          includedServices: ['Surgery', 'Multifocal IOL', 'Advanced biometry', 'Wavefront analysis', 'Post-op medications', '6 follow-up visits', 'Emergency support'],
          excludedServices: [],
          defaultLensId: createdLenses.find(l => l.lensCode === 'TEC001')?.id,
          packageCost: 55000.00,
          lensUpgradeCost: 0,
          warrantyPeriod: 36,
          followUpVisits: 6,
          emergencySupport: true,
          isRecommended: false,
          priority: 3
        },
        {
          surgeryTypeId: lasikSurgeryType.id,
          packageName: 'Standard LASIK Package',
          packageCode: 'LAS-STD',
          description: 'Standard LASIK surgery for vision correction',
          includedServices: ['Pre-op evaluation', 'LASIK surgery', 'Post-op medications', '4 follow-up visits'],
          excludedServices: ['Wavefront-guided treatment', 'Enhancement procedures'],
          packageCost: 45000.00,
          warrantyPeriod: 12,
          followUpVisits: 4,
          isRecommended: true,
          priority: 1
        }
      ];

      for (const packageData of packages) {
        const created = await prisma.surgeryPackage.upsert({
          where: { packageCode: packageData.packageCode },
          update: packageData,
          create: packageData
        });
        console.log(`✅ Created/Updated package: ${created.packageName}`);

        // Create lens package associations for cataract packages
        if (created.surgeryTypeId === cataractSurgeryType.id) {
          // Add alternative lens options
          const alternativeLenses = createdLenses.filter(lens => 
            lens.id !== created.defaultLensId && lens.lensCategory !== 'CUSTOM'
          );

          for (const lens of alternativeLenses) {
            let additionalCost = 0;
            let isUpgrade = false;

            // Calculate additional cost based on lens type
            if (lens.lensCode === 'ACR001') {
              additionalCost = lens.patientCost - (createdLenses.find(l => l.lensCode === 'STD001')?.patientCost || 0);
              isUpgrade = true;
            } else if (lens.lensCode === 'TEC001') {
              additionalCost = lens.patientCost - (created.defaultLens?.patientCost || 0);
              isUpgrade = true;
            } else if (lens.lensCode === 'ACR002') {
              additionalCost = lens.patientCost - (created.defaultLens?.patientCost || 0);
              isUpgrade = true;
            }

            await prisma.lensPackage.upsert({
              where: {
                packageId_lensId: {
                  packageId: created.id,
                  lensId: lens.id
                }
              },
              update: {
                additionalCost,
                isUpgrade,
                isAvailable: true
              },
              create: {
                packageId: created.id,
                lensId: lens.id,
                isDefault: lens.id === created.defaultLensId,
                additionalCost,
                isUpgrade,
                upgradeLevel: isUpgrade ? (additionalCost > 10000 ? 'Luxury' : 'Premium') : 'Basic',
                isAvailable: true
              }
            });
          }
        }
      }
    }

    // Create Surgery Fitness Requirements
    for (const surgeryType of createdSurgeryTypes) {
      const requirements = [
        {
          surgeryTypeId: surgeryType.id,
          requirementName: 'Complete Blood Count (CBC)',
          requirementType: 'MANDATORY',
          description: 'Basic blood test to check overall health',
          validityPeriod: 30,
          minimumGap: 7
        },
        {
          surgeryTypeId: surgeryType.id,
          requirementName: 'Blood Sugar (Random/Fasting)',
          requirementType: 'MANDATORY',
          description: 'Blood glucose level assessment',
          validityPeriod: 15,
          minimumGap: 3
        },
        {
          surgeryTypeId: surgeryType.id,
          requirementName: 'Blood Pressure Check',
          requirementType: 'MANDATORY',
          description: 'Blood pressure measurement',
          validityPeriod: 7,
          minimumGap: 1
        },
        {
          surgeryTypeId: surgeryType.id,
          requirementName: 'ECG (Electrocardiogram)',
          requirementType: 'AGE_SPECIFIC',
          description: 'Heart rhythm assessment for patients above 50 years',
          validityPeriod: 30,
          minimumGap: 7,
          minAge: 50
        },
        {
          surgeryTypeId: surgeryType.id,
          requirementName: 'Chest X-ray',
          requirementType: 'CONDITIONAL',
          description: 'Required for patients with respiratory conditions or above 60 years',
          validityPeriod: 60,
          minimumGap: 14,
          minAge: 60,
          specificConditions: ['Respiratory conditions', 'Smoking history', 'Chronic cough']
        }
      ];

      for (const req of requirements) {
        await prisma.surgeryFitnessRequirement.upsert({
          where: {
            surgeryTypeId_requirementName: {
              surgeryTypeId: req.surgeryTypeId,
              requirementName: req.requirementName
            }
          },
          update: req,
          create: req
        });
      }
    }

    console.log('🎉 Surgery types seeding completed successfully!');
    
    // Print summary
    console.log('\n📊 Summary:');
    console.log(`✅ Surgery Types: ${createdSurgeryTypes.length}`);
    console.log(`✅ Lenses: ${createdLenses.length}`);
    console.log(`✅ Surgery Packages: Created packages for each surgery type`);
    console.log(`✅ Fitness Requirements: Created requirements for each surgery type`);

  } catch (error) {
    console.error('❌ Error seeding surgery types:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedSurgeryTypes();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedSurgeryTypes };