/**
 * Script to populate packageBreakdown JSON field for all SurgeryPackage records.
 * 
 * Each breakdown sums exactly to the packageCost.
 * Format: [{ name: string, unit: number, rate: number, amount: number }]
 * 
 * Usage: node scripts/populatePackageBreakdown.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Standard breakdown template with percentage allocations (must sum to 100%)
const BREAKDOWN_TEMPLATE = [
  { name: 'IPD CHARGES',                    pct: 1.8 },
  { name: 'NURSING CHARGES',                pct: 0.3 },
  { name: 'PROFESSIONAL FEES ANAESTHESIA',  pct: 2.3 },
  { name: 'PROFESSIONAL FEES SURGEON',      pct: 23.0 },
  { name: 'O. T. CHARGES',                  pct: 18.5 },
  { name: 'INTRA OCULAR LENS',              pct: 46.0 },
  { name: 'OPTICAL BIOMETRY CHARGES',       pct: 2.3 },
  { name: 'OCT CHARGES',                    pct: 2.3 },
  { name: 'MEDICINE CHARGES',               pct: 3.5 },
  // total = 100%
];

function generateBreakdown(packageCost) {
  let remaining = packageCost;
  const items = [];

  for (let i = 0; i < BREAKDOWN_TEMPLATE.length; i++) {
    const tmpl = BREAKDOWN_TEMPLATE[i];
    let amount;

    if (i === BREAKDOWN_TEMPLATE.length - 1) {
      // Last item gets the remainder so total matches exactly
      amount = remaining;
    } else {
      amount = Math.round((tmpl.pct / 100) * packageCost);
    }

    remaining -= amount;

    items.push({
      name: tmpl.name,
      unit: 1,
      rate: amount,
      amount: amount
    });
  }

  return items;
}

async function main() {
  try {
    const packages = await prisma.surgeryPackage.findMany({
      orderBy: { packageName: 'asc' }
    });

    console.log(`Found ${packages.length} surgery packages\n`);

    let updated = 0;
    let skipped = 0;

    for (const pkg of packages) {
      // Skip if already has breakdown
      if (pkg.packageBreakdown && Array.isArray(pkg.packageBreakdown) && pkg.packageBreakdown.length > 0) {
        console.log(`⏭️  SKIP "${pkg.packageName}" (already has breakdown)`);
        skipped++;
        continue;
      }

      const breakdown = generateBreakdown(pkg.packageCost);
      const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

      await prisma.surgeryPackage.update({
        where: { id: pkg.id },
        data: { packageBreakdown: breakdown }
      });

      console.log(`✅ "${pkg.packageName}" — ₹${pkg.packageCost} → ${breakdown.length} items (total: ₹${total})`);
      updated++;
    }

    console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
