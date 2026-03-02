const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const medicineTypes = [
  'Eye Drops',
  'Ointment',
  'Tablet',
  'Capsule',
  'Injection',
  'Gel',
  'Solution'
];

const genericMedicines = [
  'Timolol',
  'Latanoprost',
  'Brimonidine',
  'Dorzolamide',
  'Brinzolamide',
  'Travoprost',
  'Bimatoprost',
  'Tropicamide',
  'Phenylephrine',
  'Cyclopentolate',
  'Atropine',
  'Homatropine',
  'Prednisolone',
  'Dexamethasone',
  'Fluorometholone',
  'Loteprednol',
  'Moxifloxacin',
  'Gatifloxacin',
  'Ofloxacin',
  'Ciprofloxacin',
  'Tobramycin',
  'Gentamicin',
  'Chloramphenicol',
  'Ketorolac',
  'Diclofenac',
  'Nepafenac',
  'Carboxymethylcellulose',
  'Hypromellose',
  'Polyethylene Glycol',
  'Sodium Hyaluronate'
];

const drugGroups = [
  'Beta Blockers',
  'Prostaglandin Analogues',
  'Alpha Agonists',
  'Carbonic Anhydrase Inhibitors',
  'Mydriatics',
  'Cycloplegics',
  'Corticosteroids',
  'Antibiotics',
  'NSAIDs (Non-Steroidal Anti-Inflammatory)',
  'Artificial Tears',
  'Antiglaucoma Agents',
  'Antihistamines',
  'Mast Cell Stabilizers',
  'Decongestants',
  'Antiviral',
  'Antifungal'
];

const dosageSchedules = [
  'Once Daily (OD)',
  'Twice Daily (BD)',
  'Three Times Daily (TDS)',
  'Four Times Daily (QID)',
  'Every 2 Hours',
  'Every 4 Hours',
  'Every 6 Hours',
  'At Bedtime (HS)',
  'As Needed (PRN)',
  'Before Meals',
  'After Meals',
  'Morning Only',
  'Evening Only',
  'Twice Weekly',
  'Once Weekly'
];

const commonEyeMedicines = [
  {
    code: 'TIM001',
    name: 'Timolol 0.5% Eye Drops',
    type: 'Eye Drops',
    generic: 'Timolol',
    drugGroup: 'Beta Blockers',
    dosageSchedule: 'Twice Daily (BD)',
    dosage: '1 drop',
    information: 'Used for glaucoma treatment. Reduces intraocular pressure.'
  },
  {
    code: 'LAT001',
    name: 'Latanoprost 0.005% Eye Drops',
    type: 'Eye Drops',
    generic: 'Latanoprost',
    drugGroup: 'Prostaglandin Analogues',
    dosageSchedule: 'Once Daily (OD)',
    dosage: '1 drop',
    information: 'First-line treatment for glaucoma. Apply at bedtime.'
  },
  {
    code: 'BRIM001',
    name: 'Brimonidine 0.2% Eye Drops',
    type: 'Eye Drops',
    generic: 'Brimonidine',
    drugGroup: 'Alpha Agonists',
    dosageSchedule: 'Twice Daily (BD)',
    dosage: '1 drop',
    information: 'Reduces IOP by decreasing aqueous humor production.'
  },
  {
    code: 'DORZ001',
    name: 'Dorzolamide 2% Eye Drops',
    type: 'Eye Drops',
    generic: 'Dorzolamide',
    drugGroup: 'Carbonic Anhydrase Inhibitors',
    dosageSchedule: 'Three Times Daily (TDS)',
    dosage: '1 drop',
    information: 'Reduces IOP. Can be used as adjunct therapy.'
  },
  {
    code: 'TROP001',
    name: 'Tropicamide 1% Eye Drops',
    type: 'Eye Drops',
    generic: 'Tropicamide',
    drugGroup: 'Mydriatics',
    dosageSchedule: 'As Needed (PRN)',
    dosage: '1 drop',
    information: 'Short-acting mydriatic for fundus examination.'
  },
  {
    code: 'PHEN001',
    name: 'Phenylephrine 2.5% Eye Drops',
    type: 'Eye Drops',
    generic: 'Phenylephrine',
    drugGroup: 'Mydriatics',
    dosageSchedule: 'As Needed (PRN)',
    dosage: '1 drop',
    information: 'Mydriatic agent for pupil dilation.'
  },
  {
    code: 'CYCLO001',
    name: 'Cyclopentolate 1% Eye Drops',
    type: 'Eye Drops',
    generic: 'Cyclopentolate',
    drugGroup: 'Cycloplegics',
    dosageSchedule: 'As Needed (PRN)',
    dosage: '1 drop',
    information: 'Cycloplegic refraction and pupil dilation.'
  },
  {
    code: 'PRED001',
    name: 'Prednisolone 1% Eye Drops',
    type: 'Eye Drops',
    generic: 'Prednisolone',
    drugGroup: 'Corticosteroids',
    dosageSchedule: 'Four Times Daily (QID)',
    dosage: '1 drop',
    information: 'Anti-inflammatory. Monitor IOP during use.'
  },
  {
    code: 'DEX001',
    name: 'Dexamethasone 0.1% Eye Drops',
    type: 'Eye Drops',
    generic: 'Dexamethasone',
    drugGroup: 'Corticosteroids',
    dosageSchedule: 'Four Times Daily (QID)',
    dosage: '1 drop',
    information: 'Potent corticosteroid for inflammation.'
  },
  {
    code: 'MOXI001',
    name: 'Moxifloxacin 0.5% Eye Drops',
    type: 'Eye Drops',
    generic: 'Moxifloxacin',
    drugGroup: 'Antibiotics',
    dosageSchedule: 'Four Times Daily (QID)',
    dosage: '1 drop',
    information: 'Broad-spectrum antibiotic for bacterial infections.'
  },
  {
    code: 'GATI001',
    name: 'Gatifloxacin 0.3% Eye Drops',
    type: 'Eye Drops',
    generic: 'Gatifloxacin',
    drugGroup: 'Antibiotics',
    dosageSchedule: 'Four Times Daily (QID)',
    dosage: '1 drop',
    information: 'Fluoroquinolone antibiotic for eye infections.'
  },
  {
    code: 'OFLO001',
    name: 'Ofloxacin 0.3% Eye Drops',
    type: 'Eye Drops',
    generic: 'Ofloxacin',
    drugGroup: 'Antibiotics',
    dosageSchedule: 'Four Times Daily (QID)',
    dosage: '1 drop',
    information: 'Antibiotic for conjunctivitis and corneal ulcers.'
  },
  {
    code: 'TOBRA001',
    name: 'Tobramycin 0.3% Eye Drops',
    type: 'Eye Drops',
    generic: 'Tobramycin',
    drugGroup: 'Antibiotics',
    dosageSchedule: 'Four Times Daily (QID)',
    dosage: '1 drop',
    information: 'Aminoglycoside antibiotic for bacterial infections.'
  },
  {
    code: 'KETO001',
    name: 'Ketorolac 0.5% Eye Drops',
    type: 'Eye Drops',
    generic: 'Ketorolac',
    drugGroup: 'NSAIDs (Non-Steroidal Anti-Inflammatory)',
    dosageSchedule: 'Four Times Daily (QID)',
    dosage: '1 drop',
    information: 'NSAID for pain and inflammation post-surgery.'
  },
  {
    code: 'DICLO001',
    name: 'Diclofenac 0.1% Eye Drops',
    type: 'Eye Drops',
    generic: 'Diclofenac',
    drugGroup: 'NSAIDs (Non-Steroidal Anti-Inflammatory)',
    dosageSchedule: 'Four Times Daily (QID)',
    dosage: '1 drop',
    information: 'NSAID for post-operative inflammation.'
  },
  {
    code: 'CMC001',
    name: 'Carboxymethylcellulose 0.5% Eye Drops',
    type: 'Eye Drops',
    generic: 'Carboxymethylcellulose',
    drugGroup: 'Artificial Tears',
    dosageSchedule: 'As Needed (PRN)',
    dosage: '1-2 drops',
    information: 'Lubricant for dry eye syndrome.'
  },
  {
    code: 'HYPR001',
    name: 'Hypromellose 0.3% Eye Drops',
    type: 'Eye Drops',
    generic: 'Hypromellose',
    drugGroup: 'Artificial Tears',
    dosageSchedule: 'As Needed (PRN)',
    dosage: '1-2 drops',
    information: 'Artificial tears for dry eyes.'
  },
  {
    code: 'ATRO001',
    name: 'Atropine 1% Eye Drops',
    type: 'Eye Drops',
    generic: 'Atropine',
    drugGroup: 'Cycloplegics',
    dosageSchedule: 'Once Daily (OD)',
    dosage: '1 drop',
    information: 'Long-acting cycloplegic. Used for uveitis and amblyopia.'
  },
  {
    code: 'CHLOR001',
    name: 'Chloramphenicol 0.5% Eye Drops',
    type: 'Eye Drops',
    generic: 'Chloramphenicol',
    drugGroup: 'Antibiotics',
    dosageSchedule: 'Four Times Daily (QID)',
    dosage: '1 drop',
    information: 'Broad-spectrum antibiotic for bacterial conjunctivitis.'
  },
  {
    code: 'CHLOR002',
    name: 'Chloramphenicol 1% Eye Ointment',
    type: 'Ointment',
    generic: 'Chloramphenicol',
    drugGroup: 'Antibiotics',
    dosageSchedule: 'At Bedtime (HS)',
    dosage: 'Apply thin layer',
    information: 'Antibiotic ointment for nighttime use.'
  }
];

async function seedMedicines() {
  try {
    console.log('🌱 Starting to seed common eye medicines...');

    // Seed Medicine Types
    console.log('📦 Seeding medicine types...');
    const typeMap = {};
    for (const typeName of medicineTypes) {
      const type = await prisma.medicineType.upsert({
        where: { name: typeName },
        update: {},
        create: { name: typeName }
      });
      typeMap[typeName] = type.id;
    }
    console.log(`✅ Seeded ${Object.keys(typeMap).length} medicine types`);

    // Seed Generic Medicines
    console.log('💊 Seeding generic medicines...');
    const genericMap = {};
    for (const genericName of genericMedicines) {
      const generic = await prisma.genericMedicine.upsert({
        where: { name: genericName },
        update: {},
        create: { name: genericName }
      });
      genericMap[genericName] = generic.id;
    }
    console.log(`✅ Seeded ${Object.keys(genericMap).length} generic medicines`);

    // Seed Drug Groups
    console.log('🏥 Seeding drug groups...');
    const drugGroupMap = {};
    for (const groupName of drugGroups) {
      const group = await prisma.drugGroup.upsert({
        where: { name: groupName },
        update: {},
        create: { name: groupName }
      });
      drugGroupMap[groupName] = group.id;
    }
    console.log(`✅ Seeded ${Object.keys(drugGroupMap).length} drug groups`);

    // Seed Dosage Schedules
    console.log('📅 Seeding dosage schedules...');
    const dosageMap = {};
    for (const scheduleName of dosageSchedules) {
      const schedule = await prisma.dosageSchedule.upsert({
        where: { name: scheduleName },
        update: {},
        create: { name: scheduleName }
      });
      dosageMap[scheduleName] = schedule.id;
    }
    console.log(`✅ Seeded ${Object.keys(dosageMap).length} dosage schedules`);

    // Seed Medicines
    console.log('💉 Seeding medicines...');
    let medicineCount = 0;
    for (const med of commonEyeMedicines) {
      await prisma.medicine.upsert({
        where: { code: med.code },
        update: {
          name: med.name,
          typeId: typeMap[med.type] || null,
          genericMedicineId: genericMap[med.generic] || null,
          drugGroupId: drugGroupMap[med.drugGroup] || null,
          dosageScheduleId: dosageMap[med.dosageSchedule] || null,
          dosage: med.dosage || null,
          information: med.information
        },
        create: {
          code: med.code,
          name: med.name,
          typeId: typeMap[med.type] || null,
          genericMedicineId: genericMap[med.generic] || null,
          drugGroupId: drugGroupMap[med.drugGroup] || null,
          dosageScheduleId: dosageMap[med.dosageSchedule] || null,
          dosage: med.dosage || null,
          information: med.information
        }
      });
      medicineCount++;
    }
    console.log(`✅ Seeded ${medicineCount} medicines`);

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Medicine Types: ${Object.keys(typeMap).length}`);
    console.log(`   - Generic Medicines: ${Object.keys(genericMap).length}`);
    console.log(`   - Drug Groups: ${Object.keys(drugGroupMap).length}`);
    console.log(`   - Dosage Schedules: ${Object.keys(dosageMap).length}`);
    console.log(`   - Medicines: ${medicineCount}`);

  } catch (error) {
    console.error('❌ Error seeding medicines:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedMedicines()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
