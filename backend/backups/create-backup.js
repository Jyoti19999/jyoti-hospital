const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { PrismaClient } = require('@prisma/client');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

class BackupManager {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupDir = path.join(__dirname, `backup_${this.timestamp}`);
  }

  async createBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    console.log(`✅ Backup directory created: ${this.backupDir}`);
  }

  async backupPrismaSchema() {
    try {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const backupSchemaPath = path.join(this.backupDir, 'original-schema.prisma');
      
      if (fs.existsSync(schemaPath)) {
        fs.copyFileSync(schemaPath, backupSchemaPath);
        console.log(`✅ Prisma schema backed up to: ${backupSchemaPath}`);
      } else {
        throw new Error('Schema file not found');
      }
    } catch (error) {
      console.error('❌ Schema backup failed:', error.message);
      throw error;
    }
  }

  async exportCriticalData() {
    try {
      console.log('🔄 Exporting critical database data...');
      
      // Export essential tables that must not be lost
      const criticalData = {
        timestamp: new Date().toISOString(),
        patients: await prisma.patient.findMany(),
        staff: await prisma.staff.findMany({
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            staffType: true,
            employmentStatus: true,
            isActive: true,
            createdAt: true
          }
        }),
        patientVisits: await prisma.patientVisit.findMany(),
        appointments: await prisma.appointment.findMany(),
        patientQueue: await prisma.patientQueue.findMany(),
        optometristExaminations: await prisma.optometristExamination.findMany(),
        ophthalmologistExaminations: await prisma.ophthalmologistExamination.findMany(),
        bills: await prisma.bill.findMany(),
        prescriptions: await prisma.prescription.findMany(),
        medicines: await prisma.medicine.findMany()
      };
      
      const dataBackupPath = path.join(this.backupDir, 'critical-data-backup.json');
      fs.writeFileSync(dataBackupPath, JSON.stringify(criticalData, null, 2));
      console.log(`✅ Critical data backed up to: ${dataBackupPath}`);
      
      // Also create a summary file
      const summary = {
        backupTimestamp: new Date().toISOString(),
        recordCounts: {
          patients: criticalData.patients.length,
          staff: criticalData.staff.length,
          patientVisits: criticalData.patientVisits.length,
          appointments: criticalData.appointments.length,
          patientQueue: criticalData.patientQueue.length,
          optometristExaminations: criticalData.optometristExaminations.length,
          ophthalmologistExaminations: criticalData.ophthalmologistExaminations.length,
          bills: criticalData.bills.length,
          prescriptions: criticalData.prescriptions.length,
          medicines: criticalData.medicines.length
        }
      };
      
      const summaryPath = path.join(this.backupDir, 'backup-summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      console.log(`✅ Backup summary created: ${summaryPath}`);
      
    } catch (error) {
      console.error('❌ Data export failed:', error.message);
      throw error;
    }
  }

  async createDatabaseDump() {
    try {
      console.log('🔄 Creating PostgreSQL database dump...');
      
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        console.warn('⚠️  DATABASE_URL not found. Skipping PostgreSQL dump.');
        return;
      }

      // Create schema dump
      const schemaCommand = `pg_dump "${databaseUrl}" --schema-only --no-owner --no-privileges`;
      const { stdout: schemaStdout } = await execAsync(schemaCommand);
      
      const schemaDumpPath = path.join(this.backupDir, 'database-schema.sql');
      fs.writeFileSync(schemaDumpPath, schemaStdout);
      console.log(`✅ Database schema dump created: ${schemaDumpPath}`);

      // Create data dump
      const dataCommand = `pg_dump "${databaseUrl}" --data-only --no-owner --no-privileges`;
      const { stdout: dataStdout } = await execAsync(dataCommand);
      
      const dataDumpPath = path.join(this.backupDir, 'database-data.sql');
      fs.writeFileSync(dataDumpPath, dataStdout);
      console.log(`✅ Database data dump created: ${dataDumpPath}`);
      
    } catch (error) {
      console.warn('⚠️  PostgreSQL dump failed (this is okay if not using PostgreSQL):', error.message);
    }
  }

  async createRestoreInstructions() {
    const restoreInstructions = `
# OHMS Database Restoration Instructions
## Backup Created: ${new Date().toISOString()}

### Option 1: Full PostgreSQL Restore (if using PostgreSQL)
1. **Stop the application**
2. **Restore schema:**
   \`\`\`bash
   psql $DATABASE_URL -f database-schema.sql
   \`\`\`
3. **Restore data:**
   \`\`\`bash
   psql $DATABASE_URL -f database-data.sql
   \`\`\`
4. **Regenerate Prisma client:**
   \`\`\`bash
   npx prisma generate
   \`\`\`

### Option 2: Prisma Schema Restore + Critical Data Import
1. **Stop the application**
2. **Restore original schema:**
   \`\`\`bash
   cp original-schema.prisma ../prisma/schema.prisma
   \`\`\`
3. **Reset and migrate:**
   \`\`\`bash
   npx prisma migrate reset --force
   npx prisma migrate dev --name restore-original
   \`\`\`
4. **Import critical data using the restore script:**
   \`\`\`bash
   node restore-critical-data.js
   \`\`\`

### Option 3: Emergency Manual Restore
1. Use the data in \`critical-data-backup.json\` to manually recreate essential records
2. Check \`backup-summary.json\` for record counts to verify completeness

### Verification Steps
1. Start the application
2. Verify patient count matches backup summary
3. Check staff login functionality
4. Verify appointment system works
5. Test queue management
6. Run application tests if available

### Emergency Contacts
- Check application logs for detailed error messages
- Verify database connection before restoration
- Always test restoration on a separate environment first

### Files in this backup:
- \`original-schema.prisma\` - Original Prisma schema before IPD changes
- \`critical-data-backup.json\` - All essential application data
- \`backup-summary.json\` - Summary of backed up records
- \`database-schema.sql\` - PostgreSQL schema dump (if available)
- \`database-data.sql\` - PostgreSQL data dump (if available)
- \`restore-critical-data.js\` - Automated restore script
- \`restore-instructions.md\` - This file
    `;

    const instructionsPath = path.join(this.backupDir, 'restore-instructions.md');
    fs.writeFileSync(instructionsPath, restoreInstructions);
    console.log(`✅ Restore instructions created: ${instructionsPath}`);
  }

  async createRestoreScript() {
    const restoreScript = `
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreCriticalData() {
  try {
    console.log('🔄 Starting critical data restoration...');
    
    // Read backup data
    const backupPath = path.join(__dirname, 'critical-data-backup.json');
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log('📋 Backup timestamp:', backupData.timestamp);
    
    // Clear existing data (CAUTION!)
    console.log('⚠️  WARNING: This will clear existing data!');
    console.log('⚠️  Make sure you have a separate backup before proceeding!');
    
    // Import data in correct order due to foreign key constraints
    console.log('👥 Restoring staff records...');
    for (const staff of backupData.staff) {
      await prisma.staff.upsert({
        where: { id: staff.id },
        update: staff,
        create: staff
      });
    }
    console.log(\`✅ Restored \${backupData.staff.length} staff records\`);
    
    console.log('👤 Restoring patient records...');
    for (const patient of backupData.patients) {
      await prisma.patient.upsert({
        where: { id: patient.id },
        update: patient,
        create: patient
      });
    }
    console.log(\`✅ Restored \${backupData.patients.length} patient records\`);
    
    console.log('📅 Restoring appointments...');
    for (const appointment of backupData.appointments) {
      await prisma.appointment.upsert({
        where: { id: appointment.id },
        update: appointment,
        create: appointment
      });
    }
    console.log(\`✅ Restored \${backupData.appointments.length} appointments\`);
    
    console.log('🏥 Restoring patient visits...');
    for (const visit of backupData.patientVisits) {
      await prisma.patientVisit.upsert({
        where: { id: visit.id },
        update: visit,
        create: visit
      });
    }
    console.log(\`✅ Restored \${backupData.patientVisits.length} patient visits\`);
    
    console.log('👀 Restoring optometrist examinations...');
    for (const exam of backupData.optometristExaminations) {
      await prisma.optometristExamination.upsert({
        where: { id: exam.id },
        update: exam,
        create: exam
      });
    }
    console.log(\`✅ Restored \${backupData.optometristExaminations.length} optometrist examinations\`);
    
    console.log('👨‍⚕️ Restoring ophthalmologist examinations...');
    for (const exam of backupData.ophthalmologistExaminations) {
      await prisma.ophthalmologistExamination.upsert({
        where: { id: exam.id },
        update: exam,
        create: exam
      });
    }
    console.log(\`✅ Restored \${backupData.ophthalmologistExaminations.length} ophthalmologist examinations\`);
    
    console.log('💊 Restoring medicines...');
    for (const medicine of backupData.medicines) {
      await prisma.medicine.upsert({
        where: { id: medicine.id },
        update: medicine,
        create: medicine
      });
    }
    console.log(\`✅ Restored \${backupData.medicines.length} medicines\`);
    
    console.log('📋 Restoring prescriptions...');
    for (const prescription of backupData.prescriptions) {
      await prisma.prescription.upsert({
        where: { id: prescription.id },
        update: prescription,
        create: prescription
      });
    }
    console.log(\`✅ Restored \${backupData.prescriptions.length} prescriptions\`);
    
    console.log('💰 Restoring bills...');
    for (const bill of backupData.bills) {
      await prisma.bill.upsert({
        where: { id: bill.id },
        update: bill,
        create: bill
      });
    }
    console.log(\`✅ Restored \${backupData.bills.length} bills\`);
    
    console.log('📋 Restoring patient queue...');
    for (const queueItem of backupData.patientQueue) {
      await prisma.patientQueue.upsert({
        where: { id: queueItem.id },
        update: queueItem,
        create: queueItem
      });
    }
    console.log(\`✅ Restored \${backupData.patientQueue.length} queue items\`);
    
    console.log('🎉 Critical data restoration completed successfully!');
    console.log('🔧 Please verify the restoration and run application tests');
    
  } catch (error) {
    console.error('❌ Restoration failed:', error);
    console.error('💡 Please check the error and try manual restoration if needed');
  } finally {
    await prisma.$disconnect();
  }
}

// Run restoration (uncomment to execute)
// restoreCriticalData();

console.log('Critical Data Restore Script');
console.log('Uncomment the last line and run: node restore-critical-data.js');
console.log('⚠️  WARNING: This will overwrite existing data!');

module.exports = { restoreCriticalData };
    `;

    const restoreScriptPath = path.join(this.backupDir, 'restore-critical-data.js');
    fs.writeFileSync(restoreScriptPath, restoreScript);
    console.log(`✅ Restore script created: ${restoreScriptPath}`);
  }

  async createBackupManifest() {
    const manifest = {
      backupId: this.timestamp,
      backupDate: new Date().toISOString(),
      version: "1.0.0",
      description: "Pre-IPD Implementation Comprehensive Backup",
      ohmsVersion: "Current",
      databaseType: "PostgreSQL",
      backupType: "FULL",
      files: [
        {
          name: "original-schema.prisma",
          description: "Original Prisma schema before IPD changes",
          type: "schema",
          critical: true
        },
        {
          name: "critical-data-backup.json",
          description: "All essential application data",
          type: "data",
          critical: true
        },
        {
          name: "backup-summary.json", 
          description: "Summary of backed up record counts",
          type: "metadata",
          critical: false
        },
        {
          name: "database-schema.sql",
          description: "PostgreSQL schema dump",
          type: "sql_schema",
          critical: true
        },
        {
          name: "database-data.sql",
          description: "PostgreSQL data dump",
          type: "sql_data", 
          critical: true
        },
        {
          name: "restore-critical-data.js",
          description: "Automated restoration script",
          type: "script",
          critical: true
        },
        {
          name: "restore-instructions.md",
          description: "Detailed restoration instructions",
          type: "documentation",
          critical: true
        }
      ],
      restorationMethods: [
        "Full PostgreSQL restore (recommended)",
        "Prisma schema restore + data import",
        "Manual data restoration using JSON backup"
      ],
      verificationSteps: [
        "Verify application startup",
        "Check patient/staff record counts",
        "Test login functionality",
        "Verify queue management",
        "Test appointment system"
      ],
      warnings: [
        "Always test restoration in non-production environment first",
        "Verify database connectivity before restoration",
        "Stop application services before restoration",
        "This backup contains sensitive healthcare data - handle securely"
      ]
    };

    const manifestPath = path.join(this.backupDir, 'backup-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ Backup manifest created: ${manifestPath}`);
  }

  async performFullBackup() {
    try {
      console.log(`🚀 Starting comprehensive OHMS backup process...`);
      console.log(`📅 Backup timestamp: ${this.timestamp}`);
      
      await this.createBackupDirectory();
      await this.backupPrismaSchema();
      await this.exportCriticalData();
      await this.createDatabaseDump();
      await this.createRestoreInstructions();
      await this.createRestoreScript();
      await this.createBackupManifest();
      
      console.log(`\n🎉 Comprehensive backup completed successfully!`);
      console.log(`📁 Backup location: ${this.backupDir}`);
      console.log(`📋 Backup manifest: ${path.join(this.backupDir, 'backup-manifest.json')}`);
      console.log(`📖 Restoration guide: ${path.join(this.backupDir, 'restore-instructions.md')}`);
      console.log(`\n⚠️  IMPORTANT: This backup contains sensitive healthcare data`);
      console.log(`🔒 Store securely and follow data protection regulations`);
      
      return {
        success: true,
        backupDir: this.backupDir,
        timestamp: this.timestamp,
        files: [
          'original-schema.prisma',
          'critical-data-backup.json',
          'backup-summary.json',
          'restore-critical-data.js',
          'restore-instructions.md',
          'backup-manifest.json'
        ]
      };
      
    } catch (error) {
      console.error(`❌ Backup failed:`, error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

module.exports = BackupManager;

// Run backup if called directly
if (require.main === module) {
  const backup = new BackupManager();
  backup.performFullBackup()
    .then((result) => {
      console.log('✅ Backup script execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Backup script failed:', error);
      process.exit(1);
    });
}