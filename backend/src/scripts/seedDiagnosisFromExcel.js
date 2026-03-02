const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

// AI-based category detection function
function categorizeDisease(icdCode, diseaseTitle) {
    const titleLower = diseaseTitle.toLowerCase();
    const codeLower = icdCode.toLowerCase();

    // Retinal Disorders
    if (
        titleLower.includes('retina') ||
        titleLower.includes('macula') ||
        titleLower.includes('retinopathy') ||
        titleLower.includes('macular degeneration') ||
        titleLower.includes('diabetic retinopathy') ||
        titleLower.includes('retinal detachment') ||
        titleLower.includes('retinal vein') ||
        titleLower.includes('retinal artery') ||
        titleLower.includes('choroid') ||
        codeLower.startsWith('9b7')
    ) {
        return 'Retinal Disorders';
    }

    // Glaucoma
    if (
        titleLower.includes('glaucoma') ||
        titleLower.includes('intraocular pressure') ||
        titleLower.includes('optic disc') ||
        codeLower.startsWith('9c6')
    ) {
        return 'Glaucoma';
    }

    // Lens Disorders (Cataract)
    if (
        titleLower.includes('cataract') ||
        titleLower.includes('lens') ||
        titleLower.includes('aphakia') ||
        titleLower.includes('pseudophakia') ||
        codeLower.startsWith('9b1')
    ) {
        return 'Lens Disorders';
    }

    // Corneal Disorders
    if (
        titleLower.includes('cornea') ||
        titleLower.includes('keratitis') ||
        titleLower.includes('keratoconus') ||
        titleLower.includes('corneal ulcer') ||
        titleLower.includes('corneal dystrophy') ||
        titleLower.includes('corneal opacity') ||
        codeLower.startsWith('9a7')
    ) {
        return 'Corneal Disorders';
    }

    // Conjunctival Disorders
    if (
        titleLower.includes('conjunctiva') ||
        titleLower.includes('conjunctivitis') ||
        titleLower.includes('pterygium') ||
        titleLower.includes('pinguecula') ||
        codeLower.startsWith('9a6')
    ) {
        return 'Conjunctival Disorders';
    }

    // Orbital and Eyelid Disorders
    if (
        titleLower.includes('eyelid') ||
        titleLower.includes('orbit') ||
        titleLower.includes('blepharitis') ||
        titleLower.includes('chalazion') ||
        titleLower.includes('ptosis') ||
        titleLower.includes('entropion') ||
        titleLower.includes('ectropion') ||
        titleLower.includes('lacrimal') ||
        titleLower.includes('tear') ||
        codeLower.startsWith('9a0') ||
        codeLower.startsWith('9a1') ||
        codeLower.startsWith('9a2')
    ) {
        return 'Orbital and Eyelid Disorders';
    }

    // Optic Nerve Disorders
    if (
        titleLower.includes('optic nerve') ||
        titleLower.includes('optic neuritis') ||
        titleLower.includes('papilledema') ||
        titleLower.includes('optic atrophy') ||
        titleLower.includes('optic neuropathy') ||
        codeLower.startsWith('9c7')
    ) {
        return 'Optic Nerve Disorders';
    }

    // Refractive Errors
    if (
        titleLower.includes('refract') ||
        titleLower.includes('myopia') ||
        titleLower.includes('hyperopia') ||
        titleLower.includes('hypermetropia') ||
        titleLower.includes('astigmatism') ||
        titleLower.includes('presbyopia') ||
        titleLower.includes('anisometropia') ||
        codeLower.startsWith('9d0')
    ) {
        return 'Refractive Errors';
    }

    // Motility Disorders (Strabismus)
    if (
        titleLower.includes('strabismus') ||
        titleLower.includes('diplopia') ||
        titleLower.includes('nystagmus') ||
        titleLower.includes('esotropia') ||
        titleLower.includes('exotropia') ||
        titleLower.includes('eye movement') ||
        titleLower.includes('ocular motility') ||
        codeLower.startsWith('9c2')
    ) {
        return 'Motility Disorders';
    }

    // Uveal Disorders
    if (
        titleLower.includes('uvea') ||
        titleLower.includes('uveitis') ||
        titleLower.includes('iritis') ||
        titleLower.includes('iridocyclitis') ||
        titleLower.includes('choroiditis') ||
        codeLower.startsWith('9b0')
    ) {
        return 'Uveal Disorders';
    }

    // Visual Pathway Disorders
    if (
        titleLower.includes('visual pathway') ||
        titleLower.includes('visual cortex') ||
        titleLower.includes('visual field') ||
        titleLower.includes('hemianopia') ||
        titleLower.includes('scotoma') ||
        codeLower.startsWith('9c8')
    ) {
        return 'Visual Pathway Disorders';
    }

    // Vitreous Disorders
    if (
        titleLower.includes('vitreous') ||
        titleLower.includes('floaters') ||
        titleLower.includes('vitreous hemorrhage') ||
        codeLower.startsWith('9b6')
    ) {
        return 'Vitreous Disorders';
    }

    // Inflammatory Disorders
    if (
        titleLower.includes('inflammation') ||
        titleLower.includes('inflammatory') ||
        titleLower.includes('infection') ||
        titleLower.includes('endophthalmitis') ||
        titleLower.includes('panophthalmitis')
    ) {
        return 'Inflammatory Disorders';
    }

    // Trauma and Injury
    if (
        titleLower.includes('trauma') ||
        titleLower.includes('injury') ||
        titleLower.includes('foreign body') ||
        titleLower.includes('burn') ||
        titleLower.includes('contusion') ||
        titleLower.includes('laceration')
    ) {
        return 'Trauma and Injury';
    }

    // Congenital Disorders
    if (
        titleLower.includes('congenital') ||
        titleLower.includes('developmental') ||
        titleLower.includes('birth') ||
        codeLower.startsWith('la')
    ) {
        return 'Congenital Disorders';
    }

    // Neoplasms (Tumors)
    if (
        titleLower.includes('tumor') ||
        titleLower.includes('neoplasm') ||
        titleLower.includes('cancer') ||
        titleLower.includes('carcinoma') ||
        titleLower.includes('melanoma') ||
        titleLower.includes('retinoblastoma') ||
        codeLower.startsWith('2')
    ) {
        return 'Neoplasms';
    }

    // Systemic Diseases Affecting Eyes
    if (
        titleLower.includes('diabetes') ||
        titleLower.includes('hypertension') ||
        titleLower.includes('thyroid') ||
        titleLower.includes('systemic')
    ) {
        return 'Systemic Diseases Affecting Eyes';
    }

    // Default category
    return 'Other Eye Disorders';
}

async function seedDiagnosisFromExcel() {
    try {
        console.log('🌱 Starting diagnosis seeding from Excel...');

        // Read Excel file
        const excelPath = path.join(__dirname, '../../../data/main.xlsx');
        console.log('📂 Reading Excel file from:', excelPath);

        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 Found ${data.length} rows in Excel file`);

        const results = {
            imported: 0,
            updated: 0,
            skipped: 0,
            errors: []
        };

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            // Get ID and Disease columns (adjust column names if needed)
            const icdCode = row.ID || row.id || row.Code || row.code;
            const diseaseTitle = row.Disease || row.disease || row.Title || row.title;

            if (!icdCode || !diseaseTitle) {
                console.warn(`⚠️ Row ${i + 1}: Missing ID or Disease - skipping`);
                results.skipped++;
                continue;
            }

            try {
                // Generate category using AI logic
                const category = categorizeDisease(icdCode, diseaseTitle);

                console.log(`Processing ${i + 1}/${data.length}: ${icdCode} - ${diseaseTitle} [${category}]`);

                // Create foundation ID
                const foundationId = `http://id.who.int/icd/entity/${icdCode.replace(/\./g, '')}`;

                // Check if already exists
                const existing = await prisma.icd11Code.findUnique({
                    where: { foundationId }
                });

                let icd11Code;
                if (existing) {
                    // Update existing
                    icd11Code = await prisma.icd11Code.update({
                        where: { foundationId },
                        data: {
                            code: icdCode,
                            title: { '@value': diseaseTitle },
                            ophthalmologyCategory: category,
                            isEyeRelated: true,
                            isActive: true,
                            chapter: '09'
                        }
                    });
                    results.updated++;
                    console.log(`  ✅ Updated: ${icdCode}`);
                } else {
                    // Create new
                    icd11Code = await prisma.icd11Code.create({
                        data: {
                            foundationId,
                            code: icdCode,
                            title: { '@value': diseaseTitle },
                            definition: null,
                            chapter: '09',
                            isEyeRelated: true,
                            ophthalmologyCategory: category,
                            inclusionTerms: null,
                            exclusionTerms: null,
                            isActive: true
                        }
                    });
                    results.imported++;
                    console.log(`  ✅ Created: ${icdCode}`);
                }

                // Create or update corresponding disease entry
                const existingDisease = await prisma.disease.findFirst({
                    where: { icd11CodeId: icd11Code.id }
                });

                if (!existingDisease) {
                    await prisma.disease.create({
                        data: {
                            icd11CodeId: icd11Code.id,
                            diseaseName: { '@value': diseaseTitle },
                            commonNames: null,
                            ophthalmologyCategory: category,
                            affectedStructure: null,
                            eyeAffected: 'Both',
                            symptoms: null,
                            signs: null,
                            diagnosticCriteria: null,
                            treatmentProtocols: null,
                            surgicalOptions: null,
                            prognosis: null,
                            visualImpactLevel: 'Unknown',
                            urgencyLevel: 'Routine',
                            isChronic: false,
                            requiresSurgery: false,
                            affectsVision: true
                        }
                    });
                }

            } catch (error) {
                console.error(`  ❌ Error processing row ${i + 1}:`, error.message);
                results.errors.push({
                    row: i + 1,
                    icdCode,
                    diseaseTitle,
                    error: error.message
                });
            }
        }

        console.log('\n✅ Seeding completed!');
        console.log('📊 Results:');
        console.log(`   - Imported: ${results.imported}`);
        console.log(`   - Updated: ${results.updated}`);
        console.log(`   - Skipped: ${results.skipped}`);
        console.log(`   - Errors: ${results.errors.length}`);

        if (results.errors.length > 0) {
            console.log('\n❌ Errors:');
            results.errors.forEach(err => {
                console.log(`   Row ${err.row}: ${err.icdCode} - ${err.error}`);
            });
        }

        // Show category distribution
        const categoryCounts = await prisma.icd11Code.groupBy({
            by: ['ophthalmologyCategory'],
            where: { isEyeRelated: true, isActive: true },
            _count: true
        });

        console.log('\n📈 Category Distribution:');
        categoryCounts.forEach(cat => {
            console.log(`   ${cat.ophthalmologyCategory}: ${cat._count}`);
        });

        return results;

    } catch (error) {
        console.error('❌ Fatal error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding
if (require.main === module) {
    seedDiagnosisFromExcel()
        .then(() => {
            console.log('\n🎉 Seeding process completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Seeding process failed:', error);
            process.exit(1);
        });
}

module.exports = seedDiagnosisFromExcel;
