// Updated deleteStaff function with proper cascade deletion
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const staff = await prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        staffType: true,
        isActive: true,
        employmentStatus: true
      }
    });

    if (!staff) {
      return res.status(404).json({
        error: 'Staff member not found',
        message: 'No staff member found with the provided ID'
      });
    }

    // Check if staff is active and force delete is not specified
    if (staff.isActive && force !== 'true') {
      return res.status(400).json({
        error: 'Cannot delete active staff',
        message: 'Staff member is currently active. Please deactivate first or use force=true query parameter',
        suggestion: 'Use PATCH /staff/:id/deactivate to deactivate first, or add ?force=true to force delete'
      });
    }

    // Delete all related records in a transaction
    await prisma.$transaction(async (tx) => {
      console.log(`🔍 Starting deletion for staff: ${staff.firstName} ${staff.lastName}`);

      // 1. Delete appointments where staff is the doctor
      console.log('🔍 Deleting appointments...');
      const appointments = await tx.appointment.findMany({
        where: { doctorId: id },
        select: { id: true, patientVisitId: true }
      });

      for (const appointment of appointments) {
        if (appointment.patientVisitId) {
          // Delete related patient visit records
          await tx.patientQueue.deleteMany({
            where: { patientVisitId: appointment.patientVisitId }
          });
          
          await tx.diagnosis.deleteMany({
            where: { visitId: appointment.patientVisitId }
          });
          
          await tx.ophthalmologistExamination.deleteMany({
            where: { patientVisitId: appointment.patientVisitId }
          });
          
          await tx.optometristExamination.deleteMany({
            where: { patientVisitId: a