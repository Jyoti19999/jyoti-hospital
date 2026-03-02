const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Comprehensive list of surgical equipment for eye surgery
const surgicalEquipment = [
  // Personal Protective Equipment
  { name: 'Sterile Surgical Gloves (Size 6.5)', category: 'Consumables', manufacturer: 'Ansell', unitCost: 45.00, stock: 500, reorderLevel: 50 },
  { name: 'Sterile Surgical Gloves (Size 7)', category: 'Consumables', manufacturer: 'Ansell', unitCost: 45.00, stock: 600, reorderLevel: 50 },
  { name: 'Sterile Surgical Gloves (Size 7.5)', category: 'Consumables', manufacturer: 'Ansell', unitCost: 45.00, stock: 500, reorderLevel: 50 },
  { name: 'Sterile Surgical Gloves (Size 8)', category: 'Consumables', manufacturer: 'Ansell', unitCost: 45.00, stock: 400, reorderLevel: 50 },
  { name: 'Disposable Surgical Masks', category: 'Consumables', manufacturer: '3M', unitCost: 8.00, stock: 1000, reorderLevel: 100 },
  { name: 'N95 Respirator Masks', category: 'Consumables', manufacturer: '3M', unitCost: 25.00, stock: 200, reorderLevel: 25 },
  { name: 'Surgical Caps/Bouffant Caps', category: 'Consumables', manufacturer: 'Medline', unitCost: 5.00, stock: 1000, reorderLevel: 100 },
  { name: 'Disposable Surgical Gowns', category: 'Consumables', manufacturer: 'Halyard', unitCost: 120.00, stock: 200, reorderLevel: 20 },
  { name: 'Sterile Surgical Aprons', category: 'Consumables', manufacturer: 'Halyard', unitCost: 85.00, stock: 150, reorderLevel: 15 },
  { name: 'Protective Eye Shields', category: 'Consumables', manufacturer: 'Cardinal Health', unitCost: 15.00, stock: 100, reorderLevel: 10 },

  // Draping and Coverage
  { name: 'Sterile Eye Drapes', category: 'Consumables', manufacturer: '3M', unitCost: 75.00, stock: 300, reorderLevel: 30 },
  { name: 'Adhesive Incise Drapes', category: 'Consumables', manufacturer: '3M', unitCost: 65.00, stock: 200, reorderLevel: 20 },
  { name: 'Universal Surgical Drapes', category: 'Consumables', manufacturer: 'Medtronic', unitCost: 45.00, stock: 250, reorderLevel: 25 },
  { name: 'Fenestrated Eye Drapes', category: 'Consumables', manufacturer: 'Medtronic', unitCost: 85.00, stock: 150, reorderLevel: 15 },
  { name: 'Table Covers (Sterile)', category: 'Consumables', manufacturer: 'Halyard', unitCost: 35.00, stock: 100, reorderLevel: 10 },

  // Cleaning and Disinfection
  { name: 'Povidone Iodine 5% Solution', category: 'Consumables', manufacturer: 'Cipla', unitCost: 125.00, stock: 50, reorderLevel: 5 },
  { name: 'Chlorhexidine Gluconate 2%', category: 'Consumables', manufacturer: 'BD', unitCost: 150.00, stock: 30, reorderLevel: 3 },
  { name: 'Sterile Saline Solution (500ml)', category: 'Consumables', manufacturer: 'Baxter', unitCost: 65.00, stock: 200, reorderLevel: 20 },
  { name: 'Balanced Salt Solution (BSS)', category: 'Consumables', manufacturer: 'Alcon', unitCost: 185.00, stock: 100, reorderLevel: 10 },
  { name: 'Alcohol Swabs (70%)', category: 'Consumables', manufacturer: 'BD', unitCost: 2.50, stock: 2000, reorderLevel: 200 },
  { name: 'Antiseptic Wipes', category: 'Consumables', manufacturer: 'Johnson & Johnson', unitCost: 3.00, stock: 1500, reorderLevel: 150 },

  // Surgical Instruments
  { name: 'Microsurgical Forceps (Straight)', category: 'Surgical Instruments', manufacturer: 'Alcon', unitCost: 2500.00, stock: 20, reorderLevel: 2 },
  { name: 'Microsurgical Forceps (Curved)', category: 'Surgical Instruments', manufacturer: 'Alcon', unitCost: 2500.00, stock: 15, reorderLevel: 2 },
  { name: 'Capsulorhexis Forceps', category: 'Surgical Instruments', manufacturer: 'Alcon', unitCost: 3500.00, stock: 10, reorderLevel: 1 },
  { name: 'IOL Insertion Forceps', category: 'Surgical Instruments', manufacturer: 'Abbott', unitCost: 2800.00, stock: 8, reorderLevel: 1 },
  { name: 'Micro Scissors (Straight)', category: 'Surgical Instruments', manufacturer: 'Alcon', unitCost: 2200.00, stock: 12, reorderLevel: 2 },
  { name: 'Micro Scissors (Curved)', category: 'Surgical Instruments', manufacturer: 'Alcon', unitCost: 2200.00, stock: 8, reorderLevel: 1 },
  { name: 'Phaco Chopper', category: 'Surgical Instruments', manufacturer: 'Abbott', unitCost: 1800.00, stock: 15, reorderLevel: 2 },
  { name: 'Second Phaco Chopper', category: 'Surgical Instruments', manufacturer: 'Abbott', unitCost: 1800.00, stock: 10, reorderLevel: 1 },
  { name: 'Nucleus Manipulator', category: 'Surgical Instruments', manufacturer: 'Alcon', unitCost: 1500.00, stock: 12, reorderLevel: 2 },
  { name: 'IOL Manipulator', category: 'Surgical Instruments', manufacturer: 'Abbott', unitCost: 1600.00, stock: 8, reorderLevel: 1 },

  // Cannulas and Needles
  { name: 'Phaco Tip (Straight)', category: 'Consumables', manufacturer: 'Alcon', unitCost: 850.00, stock: 50, reorderLevel: 5 },
  { name: 'Phaco Tip (Bent)', category: 'Consumables', manufacturer: 'Alcon', unitCost: 850.00, stock: 30, reorderLevel: 3 },
  { name: 'I/A Cannula (Straight)', category: 'Consumables', manufacturer: 'Alcon', unitCost: 450.00, stock: 60, reorderLevel: 6 },
  { name: 'I/A Cannula (Curved)', category: 'Consumables', manufacturer: 'Alcon', unitCost: 450.00, stock: 40, reorderLevel: 4 },
  { name: 'Hydrodissection Cannula', category: 'Consumables', manufacturer: 'Abbott', unitCost: 380.00, stock: 35, reorderLevel: 4 },
  { name: 'Subretinal Injection Cannula', category: 'Consumables', manufacturer: 'Alcon', unitCost: 650.00, stock: 20, reorderLevel: 2 },
  { name: '27G Needles', category: 'Consumables', manufacturer: 'BD', unitCost: 12.00, stock: 500, reorderLevel: 50 },
  { name: '30G Needles', category: 'Consumables', manufacturer: 'BD', unitCost: 15.00, stock: 300, reorderLevel: 30 },

  // Sutures and Threads
  { name: '10-0 Nylon Sutures', category: 'Consumables', manufacturer: 'Ethicon', unitCost: 185.00, stock: 100, reorderLevel: 10 },
  { name: '9-0 Nylon Sutures', category: 'Consumables', manufacturer: 'Ethicon', unitCost: 165.00, stock: 80, reorderLevel: 8 },
  { name: '8-0 Silk Sutures', category: 'Consumables', manufacturer: 'Ethicon', unitCost: 145.00, stock: 60, reorderLevel: 6 },
  { name: '6-0 Vicryl Sutures', category: 'Consumables', manufacturer: 'Ethicon', unitCost: 125.00, stock: 70, reorderLevel: 7 },
  { name: 'Suture Removal Kit', category: 'Surgical Instruments', manufacturer: 'Ethicon', unitCost: 450.00, stock: 25, reorderLevel: 3 },

  // Viscoelastics and Medications
  { name: 'Hyaluronic Acid (Viscoelastic)', category: 'Consumables', manufacturer: 'Abbott', unitCost: 2500.00, stock: 40, reorderLevel: 4 },
  { name: 'Sodium Hyaluronate', category: 'Consumables', manufacturer: 'Alcon', unitCost: 2200.00, stock: 30, reorderLevel: 3 },
  { name: 'Chondroitin Sulfate', category: 'Consumables', manufacturer: 'Abbott', unitCost: 1800.00, stock: 25, reorderLevel: 3 },
  { name: 'Trypan Blue Dye', category: 'Consumables', manufacturer: 'Alcon', unitCost: 850.00, stock: 35, reorderLevel: 4 },
  { name: 'Intracameral Antibiotics', category: 'Consumables', manufacturer: 'Novartis', unitCost: 450.00, stock: 50, reorderLevel: 5 },

  // Bandages and Dressings
  { name: 'Eye Patches (Sterile)', category: 'Consumables', manufacturer: '3M', unitCost: 8.00, stock: 500, reorderLevel: 50 },
  { name: 'Pressure Eye Bandages', category: 'Consumables', manufacturer: '3M', unitCost: 25.00, stock: 200, reorderLevel: 20 },
  { name: 'Adhesive Tape (Hypoallergenic)', category: 'Consumables', manufacturer: '3M', unitCost: 35.00, stock: 100, reorderLevel: 10 },
  { name: 'Gauze Pads (Sterile)', category: 'Consumables', manufacturer: 'Johnson & Johnson', unitCost: 5.00, stock: 1000, reorderLevel: 100 },
  { name: 'Cotton Balls (Sterile)', category: 'Consumables', manufacturer: 'Johnson & Johnson', unitCost: 3.00, stock: 800, reorderLevel: 80 },

  // Irrigation and Aspiration
  { name: 'Irrigation Solution (BSS)', category: 'Consumables', manufacturer: 'Alcon', unitCost: 195.00, stock: 150, reorderLevel: 15 },
  { name: 'Aspiration Tubing', category: 'Consumables', manufacturer: 'Alcon', unitCost: 85.00, stock: 200, reorderLevel: 20 },
  { name: 'Irrigation Tubing', category: 'Consumables', manufacturer: 'Alcon', unitCost: 75.00, stock: 180, reorderLevel: 18 },
  { name: 'Cassette for Phaco Machine', category: 'Consumables', manufacturer: 'Abbott', unitCost: 450.00, stock: 60, reorderLevel: 6 },

  // Specialized Cataract Surgery Items
  { name: 'Keratome (2.2mm)', category: 'Surgical Instruments', manufacturer: 'Alcon', unitCost: 1200.00, stock: 15, reorderLevel: 2 },
  { name: 'Keratome (2.75mm)', category: 'Surgical Instruments', manufacturer: 'Alcon', unitCost: 1200.00, stock: 12, reorderLevel: 1 },
  { name: 'Side Port Knife', category: 'Surgical Instruments', manufacturer: 'Abbott', unitCost: 950.00, stock: 20, reorderLevel: 2 },
  { name: 'Capsulotomy Knife', category: 'Surgical Instruments', manufacturer: 'Alcon', unitCost: 850.00, stock: 18, reorderLevel: 2 },
  { name: 'IOL Injector System', category: 'Devices', manufacturer: 'Abbott', unitCost: 15000.00, stock: 5, reorderLevel: 1 },
  { name: 'IOL Cartridge', category: 'Consumables', manufacturer: 'Abbott', unitCost: 650.00, stock: 100, reorderLevel: 10 },

  // Retinal Surgery Specific
  { name: 'Vitrectomy Probe (25G)', category: 'Consumables', manufacturer: 'Alcon', unitCost: 1200.00, stock: 30, reorderLevel: 3 },
  { name: 'Light Pipe (25G)', category: 'Surgical Instruments', manufacturer: 'Alcon', unitCost: 2500.00, stock: 8, reorderLevel: 1 },
  { name: 'Silicone Oil', category: 'Consumables', manufacturer: 'Alcon', unitCost: 3500.00, stock: 15, reorderLevel: 2 },
  { name: 'Heavy Water (D2O)', category: 'Consumables', manufacturer: 'Fluoron', unitCost: 8500.00, stock: 5, reorderLevel: 1 },
  { name: 'Perfluorocarbon Liquid', category: 'Consumables', manufacturer: 'Alcon', unitCost: 12000.00, stock: 3, reorderLevel: 1 },

  // Glaucoma Surgery Items
  { name: 'Trabeculectomy Kit', category: 'Surgical Instruments', manufacturer: 'Abbott', unitCost: 3500.00, stock: 10, reorderLevel: 1 },
  { name: 'Glaucoma Drainage Device', category: 'Devices', manufacturer: 'Abbott', unitCost: 25000.00, stock: 8, reorderLevel: 1 },
  { name: 'Mitomycin-C', category: 'Consumables', manufacturer: 'Cipla', unitCost: 1500.00, stock: 20, reorderLevel: 2 },

  // Emergency and Backup Items
  { name: 'Emergency IOL (Backup)', category: 'Devices', manufacturer: 'Alcon', unitCost: 5500.00, stock: 10, reorderLevel: 2 },
  { name: 'Emergency Suture Kit', category: 'Surgical Instruments', manufacturer: 'Ethicon', unitCost: 850.00, stock: 15, reorderLevel: 2 },
  { name: 'Hemostatic Agents', category: 'Consumables', manufacturer: 'Ethicon', unitCost: 650.00, stock: 25, reorderLevel: 3 },

  // Cleaning and Maintenance
  { name: 'Instrument Cleaning Solution', category: 'Consumables', manufacturer: 'Medline', unitCost: 125.00, stock: 50, reorderLevel: 5 },
  { name: 'Ultrasonic Cleaning Detergent', category: 'Consumables', manufacturer: 'Medline', unitCost: 185.00, stock: 30, reorderLevel: 3 },
  { name: 'Sterilization Indicators', category: 'Consumables', manufacturer: '3M', unitCost: 15.00, stock: 200, reorderLevel: 20 },
  { name: 'Autoclave Pouches', category: 'Consumables', manufacturer: '3M', unitCost: 5.00, stock: 1000, reorderLevel: 100 },

  // Anesthesia Related
  { name: 'Topical Anesthetic Drops', category: 'Consumables', manufacturer: 'Alcon', unitCost: 85.00, stock: 100, reorderLevel: 10 },
  { name: 'Intracameral Lidocaine', category: 'Consumables', manufacturer: 'Abbott', unitCost: 65.00, stock: 80, reorderLevel: 8 },
  { name: 'Anesthetic Gel', category: 'Consumables', manufacturer: 'Bausch & Lomb', unitCost: 45.00, stock: 60, reorderLevel: 6 },

  // Documentation and Marking
  { name: 'Surgical Markers (Sterile)', category: 'Consumables', manufacturer: 'Viscot', unitCost: 25.00, stock: 100, reorderLevel: 10 },
  { name: 'Axis Reference Markers', category: 'Surgical Instruments', manufacturer: 'Abbott', unitCost: 450.00, stock: 12, reorderLevel: 1 },
  { name: 'Corneal Markers', category: 'Surgical Instruments', manufacturer: 'Alcon', unitCost: 650.00, stock: 8, reorderLevel: 1 },

  // Additional Support Items
  { name: 'Operating Microscope Drapes', category: 'Consumables', manufacturer: '3M', unitCost: 85.00, stock: 100, reorderLevel: 10 },
  { name: 'Instrument Trays (Sterile)', category: 'Surgical Instruments', manufacturer: 'Medline', unitCost: 350.00, stock: 25, reorderLevel: 3 },
  { name: 'Surgical Positioning Aids', category: 'Devices', manufacturer: 'Medline', unitCost: 1500.00, stock: 8, reorderLevel: 1 },

  // Quality Control Items
  { name: 'IOL Power Calculation Cards', category: 'Consumables', manufacturer: 'Abbott', unitCost: 15.00, stock: 200, reorderLevel: 20 },
  { name: 'Surgical Checklists', category: 'Consumables', manufacturer: 'Custom', unitCost: 5.00, stock: 500, reorderLevel: 50 },
  { name: 'Patient Identification Bands', category: 'Consumables', manufacturer: 'Medline', unitCost: 3.00, stock: 1000, reorderLevel: 100 }
];

// Surgery package equipment mapping (equipment that each surgery type commonly uses)
const surgeryPackageEquipmentMapping = {
  'CATARACT': [
    'Sterile Surgical Gloves (Size 7)', 'Disposable Surgical Masks', 'Surgical Caps/Bouffant Caps', 
    'Disposable Surgical Gowns', 'Sterile Eye Drapes', 'Povidone Iodine 5% Solution', 
    'Sterile Saline Solution (500ml)', 'Phaco Tip (Straight)', 'I/A Cannula (Straight)', 
    'IOL Injector System', 'IOL Cartridge', 'Hyaluronic Acid (Viscoelastic)', 
    '10-0 Nylon Sutures', 'Eye Patches (Sterile)', 'Keratome (2.2mm)', 
    'Side Port Knife', 'Topical Anesthetic Drops', 'Cassette for Phaco Machine',
    'Balanced Salt Solution (BSS)', 'Intracameral Antibiotics'
  ],
  'GLAUCOMA': [
    'Sterile Surgical Gloves (Size 7)', 'Disposable Surgical Masks', 'Surgical Caps/Bouffant Caps',
    'Disposable Surgical Gowns', 'Sterile Eye Drapes', 'Povidone Iodine 5% Solution',
    'Sterile Saline Solution (500ml)', 'Trabeculectomy Kit', 'Microsurgical Forceps (Straight)',
    'Micro Scissors (Straight)', '10-0 Nylon Sutures', '9-0 Nylon Sutures',
    'Mitomycin-C', 'Eye Patches (Sterile)', 'Topical Anesthetic Drops',
    'Glaucoma Drainage Device', 'Hemostatic Agents'
  ],
  'RETINAL': [
    'Sterile Surgical Gloves (Size 7)', 'Disposable Surgical Masks', 'Surgical Caps/Bouffant Caps',
    'Disposable Surgical Gowns', 'Sterile Eye Drapes', 'Povidone Iodine 5% Solution',
    'Vitrectomy Probe (25G)', 'Light Pipe (25G)', 'Silicone Oil', 'Heavy Water (D2O)',
    'Perfluorocarbon Liquid', 'Microsurgical Forceps (Curved)', 'Micro Scissors (Curved)',
    '10-0 Nylon Sutures', 'Eye Patches (Sterile)', 'Topical Anesthetic Drops',
    'Subretinal Injection Cannula', '27G Needles', '30G Needles'
  ],
  'CORNEAL': [
    'Sterile Surgical Gloves (Size 7)', 'Disposable Surgical Masks', 'Surgical Caps/Bouffant Caps',
    'Disposable Surgical Gowns', 'Sterile Eye Drapes', 'Povidone Iodine 5% Solution',
    'Microsurgical Forceps (Straight)', 'Micro Scissors (Straight)', '10-0 Nylon Sutures',
    '9-0 Nylon Sutures', 'Corneal Markers', 'Topical Anesthetic Drops',
    'Eye Patches (Sterile)', 'Balanced Salt Solution (BSS)', 'Trypan Blue Dye'
  ],
  'OCULOPLASTIC': [
    'Sterile Surgical Gloves (Size 7)', 'Disposable Surgical Masks', 'Surgical Caps/Bouffant Caps',
    'Disposable Surgical Gowns', 'Universal Surgical Drapes', 'Povidone Iodine 5% Solution',
    'Microsurgical Forceps (Straight)', 'Micro Scissors (Straight)', '6-0 Vicryl Sutures',
    '8-0 Silk Sutures', 'Gauze Pads (Sterile)', 'Pressure Eye Bandages',
    'Topical Anesthetic Drops', 'Hemostatic Agents'
  ],
  'EMERGENCY': [
    'Sterile Surgical Gloves (Size 7)', 'Disposable Surgical Masks', 'Surgical Caps/Bouffant Caps',
    'Disposable Surgical Gowns', 'Sterile Eye Drapes', 'Povidone Iodine 5% Solution',
    'Emergency IOL (Backup)', 'Emergency Suture Kit', 'Sterile Saline Solution (500ml)',
    'Eye Patches (Sterile)', 'Topical Anesthetic Drops', 'Hemostatic Agents',
    'Intracameral Antibiotics', 'Gauze Pads (Sterile)'
  ]
};

async function addEquipmentWithStockTransactions() {
  console.log('🚀 Starting equipment addition process...');
  
  try {
    // Step 1: Get all existing surgery packages
    console.log('📋 Fetching existing surgery packages...');
    const surgeryPackages = await prisma.surgeryPackage.findMany({
      select: {
        id: true,
        packageName: true,
        surgeryCategory: true
      }
    });
    
    console.log(`✅ Found ${surgeryPackages.length} surgery packages`);
    
    // Step 2: Add all equipment first
    console.log('🔧 Adding surgical equipment...');
    const addedEquipment = [];
    
    for (const [index, equipment] of surgicalEquipment.entries()) {
      try {
        // Generate unique code
        const equipmentCode = `EQ${String(index + 1).padStart(4, '0')}`;
        
        const newEquipment = await prisma.equipment.create({
          data: {
            name: equipment.name,
            code: equipmentCode,
            category: equipment.category,
            manufacturer: equipment.manufacturer,
            currentStock: equipment.stock,
            reorderLevel: equipment.reorderLevel,
            unitCost: equipment.unitCost,
            isActive: true,
            lastStockUpdate: new Date()
          }
        });
        
        addedEquipment.push(newEquipment);
        
        // Create initial stock transaction for the equipment
        await prisma.stockTransaction.create({
          data: {
            equipmentId: newEquipment.id,
            transactionType: 'IN',
            quantity: equipment.stock,
            reason: 'Initial stock addition',
            performedBy: 'system-script',
            transactionDate: new Date()
          }
        });
        
        console.log(`  ✓ Added: ${equipment.name} (${equipmentCode}) - Stock: ${equipment.stock}`);
        
      } catch (error) {
        console.error(`  ❌ Error adding ${equipment.name}: ${error.message}`);
      }
    }
    
    console.log(`✅ Successfully added ${addedEquipment.length} equipment items`);
    
    // Step 3: Link equipment to surgery packages based on category mapping
    console.log('🔗 Linking equipment to surgery packages...');
    let linkingCount = 0;
    
    for (const surgeryPackage of surgeryPackages) {
      try {
        const packageCategory = surgeryPackage.surgeryCategory;
        let equipmentToLink = [];
        
        // Determine which equipment to link based on surgery category
        if (packageCategory && surgeryPackageEquipmentMapping[packageCategory]) {
          // Use specific equipment for this surgery type
          equipmentToLink = addedEquipment.filter(eq => 
            surgeryPackageEquipmentMapping[packageCategory].includes(eq.name)
          );
        } else {
          // For packages without specific category, add common items based on name patterns
          equipmentToLink = addedEquipment.filter(eq => {
            const packageName = surgeryPackage.packageName.toLowerCase();
            const equipmentName = eq.name.toLowerCase();
            
            // Common items for all surgeries
            const commonItems = [
              'sterile surgical gloves', 'disposable surgical masks', 'surgical caps',
              'disposable surgical gowns', 'sterile eye drapes', 'povidone iodine',
              'eye patches', 'topical anesthetic drops'
            ];
            
            // Check if it's a common item
            const isCommon = commonItems.some(item => equipmentName.includes(item));
            
            // Category-specific matching
            const isCataractRelated = packageName.includes('cataract') && 
              (equipmentName.includes('phaco') || equipmentName.includes('iol') || equipmentName.includes('lens'));
            
            const isGlaucomaRelated = packageName.includes('glaucoma') && 
              (equipmentName.includes('trabeculectomy') || equipmentName.includes('glaucoma'));
            
            const isRetinalRelated = packageName.includes('retina') && 
              (equipmentName.includes('vitrectomy') || equipmentName.includes('silicone oil'));
            
            return isCommon || isCataractRelated || isGlaucomaRelated || isRetinalRelated;
          });
        }
        
        // Update equipment to link them to this surgery package
        if (equipmentToLink.length > 0) {
          for (const equipment of equipmentToLink) {
            await prisma.equipment.update({
              where: { id: equipment.id },
              data: { surgeryPackageId: surgeryPackage.id }
            });
            linkingCount++;
          }
          
          console.log(`  ✓ Linked ${equipmentToLink.length} items to "${surgeryPackage.packageName}"`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error linking equipment to ${surgeryPackage.packageName}: ${error.message}`);
      }
    }
    
    console.log(`✅ Successfully created ${linkingCount} equipment-package links`);
    
    // Step 4: Summary
    console.log('\n📊 SUMMARY:');
    console.log(`  • Equipment added: ${addedEquipment.length}`);
    console.log(`  • Stock transactions created: ${addedEquipment.length}`);
    console.log(`  • Package-equipment links: ${linkingCount}`);
    console.log(`  • Surgery packages processed: ${surgeryPackages.length}`);
    
    // Verification query
    const totalEquipment = await prisma.equipment.count();
    const totalLinked = await prisma.equipment.count({
      where: { surgeryPackageId: { not: null } }
    });
    
    console.log('\n✅ VERIFICATION:');
    console.log(`  • Total equipment in database: ${totalEquipment}`);
    console.log(`  • Equipment linked to packages: ${totalLinked}`);
    console.log(`  • Equipment without package: ${totalEquipment - totalLinked}`);
    
    console.log('\n🎉 Equipment addition completed successfully!');
    
  } catch (error) {
    console.error('💥 Fatal error during equipment addition:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the script
if (require.main === module) {
  addEquipmentWithStockTransactions()
    .then(() => {
      console.log('✨ Script execution completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💀 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addEquipmentWithStockTransactions };