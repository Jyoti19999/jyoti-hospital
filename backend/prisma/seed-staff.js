const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedStaff() {
  try {
    console.log('🌱 Starting staff seeding...');

    // Delete existing staff only
    console.log('🗑️  Deleting existing staff...');
    await prisma.staff.deleteMany({});
    console.log('✅ Existing staff deleted');

    // Create Optometrist
    const optometrist = await prisma.staff.create({
      data: {
        employeeId: 'OPT001',
        firstName: 'Optometrist',
        lastName: 'User',
        email: 'snehapawar@gmail.com',
        phone: '+91-9876543210',
        staffType: 'optometrist',
        department: 'Optometry',
        employmentStatus: 'active',
        joiningDate: new Date('2024-01-01'),
        passwordHash: await bcrypt.hash('Test@123', 10),
        isActive: true,
        optometristProfile: {
          specialization: 'Refraction & Contact Lenses',
          yearsExperience: 8,
          certifications: ['BSc Optometry', 'Contact Lens Specialist'],
          equipmentCertified: ['Auto Refractometer', 'Tonometer', 'Slit Lamp']
        }
      }
    });

    // Create Receptionist 1
    const receptionist1 = await prisma.staff.create({
      data: {
        employeeId: 'REC001',
        firstName: 'Receptionist',
        lastName: 'One',
        email: 'admin@yogineerstech.in',
        phone: '+91-9876543211',
        staffType: 'receptionist',
        department: 'Reception',
        employmentStatus: 'active',
        joiningDate: new Date('2024-01-01'),
        passwordHash: await bcrypt.hash('Test@123', 10),
        isActive: true
      }
    });

    // Create Receptionist 2
    const receptionist2 = await prisma.staff.create({
      data: {
        employeeId: 'REC002',
        firstName: 'Receptionist',
        lastName: 'Two',
        email: 'tcchavan999@gmail.com',
        phone: '+91-9876543212',
        staffType: 'receptionist2',
        department: 'Reception',
        employmentStatus: 'active',
        joiningDate: new Date('2024-01-01'),
        passwordHash: await bcrypt.hash('Test@123', 10),
        isActive: true
      }
    });

    // Create Doctor
    const doctor = await prisma.staff.create({
      data: {
        employeeId: 'DOC001',
        firstName: 'Dr. Doctor',
        lastName: 'User',
        email: 'chavantanuj50@gmail.com',
        phone: '+91-9876543213',
        staffType: 'ophthalmologist',
        department: 'Ophthalmology',
        employmentStatus: 'active',
        joiningDate: new Date('2024-01-01'),
        passwordHash: await bcrypt.hash('Test@123', 10),
        isActive: true,
        doctorProfile: {
          specialization: 'General Ophthalmology',
          yearsExperience: 12,
          consultationFee: 1500,
          availableSlots: ['09:00-12:00', '14:00-17:00'],
          certifications: ['MS Ophthalmology']
        }
      }
    });

    // Create OT Admin
    const otAdmin = await prisma.staff.create({
      data: {
        employeeId: 'OTA001',
        firstName: 'OT Admin',
        lastName: 'User',
        email: 'ankushdiwakar8080@gmail.com',
        phone: '+91-9876543214',
        staffType: 'ot_admin',
        department: 'Operation Theatre',
        employmentStatus: 'active',
        joiningDate: new Date('2024-01-01'),
        passwordHash: await bcrypt.hash('Test@123', 10),
        isActive: true,
        otAdminProfile: {
          specialization: 'OT Management',
          yearsExperience: 10,
          certifications: ['OT Management Certificate', 'Hospital Administration'],
          responsibilities: ['OT Scheduling', 'Equipment Management', 'Staff Coordination']
        }
      }
    });

    // Create Anesthesiologist
    const anesthesiologist = await prisma.staff.create({
      data: {
        employeeId: 'ANE001',
        firstName: 'Anesthesiologist',
        lastName: 'User',
        email: 'ankushmu8080@gmail.com',
        phone: '+91-9876543215',
        staffType: 'anesthesiologist',
        department: 'Anesthesiology',
        employmentStatus: 'active',
        joiningDate: new Date('2024-01-01'),
        passwordHash: await bcrypt.hash('Test@123', 10),
        isActive: true,
        anesthesiologistProfile: {
          specialization: 'Ophthalmic Anesthesia',
          yearsExperience: 12,
          totalCases: 3200,
          complications: 0.1,
          certifications: ['MD Anesthesiology', 'Fellowship in Regional Anesthesia']
        }
      }
    });

    // Create Surgeon
    const surgeon = await prisma.staff.create({
      data: {
        employeeId: 'SUR001',
        firstName: 'Surgeon',
        lastName: 'User',
        email: 'work.ankush07@gmail.com',
        phone: '+91-9876543216',
        staffType: 'surgeon',
        department: 'Ophthalmology',
        employmentStatus: 'active',
        joiningDate: new Date('2024-01-01'),
        passwordHash: await bcrypt.hash('Test@123', 10),
        isActive: true,
        surgeonProfile: {
          specialization: 'Cataract & Anterior Segment',
          yearsExperience: 15,
          totalSurgeries: 2500,
          successRate: 99.2,
          certifications: ['MS Ophthalmology', 'Fellowship in Cataract Surgery']
        }
      }
    });

    // Create Sister (OT Nurse)
    const sister = await prisma.staff.create({
      data: {
        employeeId: 'SIS001',
        firstName: 'Sister',
        lastName: 'User',
        email: 'metacodehorizons@gmail.com',
        phone: '+91-9876543217',
        staffType: 'sister',
        department: 'OT Nursing',
        employmentStatus: 'active',
        joiningDate: new Date('2024-01-01'),
        passwordHash: await bcrypt.hash('Test@123', 10),
        isActive: true,
        sisterProfile: {
          specialization: 'OT Management',
          yearsExperience: 18,
          totalAssists: 5000,
          teamSize: 8,
          certifications: ['BSc Nursing', 'OT Specialist Certificate']
        }
      }
    });

    console.log('✅ Staff seeding completed successfully!');
    console.log('\n📋 Created Staff Members:');
    console.log(`1. Optometrist: ${optometrist.email}`);
    console.log(`2. Receptionist 1: ${receptionist1.email}`);
    console.log(`3. Receptionist 2: ${receptionist2.email}`);
    console.log(`4. Doctor: ${doctor.email}`);
    console.log(`5. OT Admin: ${otAdmin.email}`);
    console.log(`6. Anesthesiologist: ${anesthesiologist.email}`);
    console.log(`7. Surgeon: ${surgeon.email}`);
    console.log(`8. Sister: ${sister.email}`);
    console.log('\n🔑 All staff passwords: Test@123');
    console.log('🚀 You can now login with any of these accounts!');

  } catch (error) {
    console.error('❌ Error seeding staff:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedStaff()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });