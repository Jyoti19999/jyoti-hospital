const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MedicineMasterController {
    // ============ Medicine Type CRUD ============
    async createMedicineType(req, res) {
        try {
            const { name } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Medicine type name is required'
                });
            }

            const medicineType = await prisma.medicineType.create({
                data: { name: name.trim() }
            });

            res.status(201).json({
                success: true,
                message: 'Medicine type created successfully',
                data: medicineType
            });
        } catch (error) {
            console.error('Error creating medicine type:', error);
            if (error.code === 'P2002') {
                return res.status(400).json({
                    success: false,
                    message: 'Medicine type already exists'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to create medicine type'
            });
        }
    }

    async getMedicineTypes(req, res) {
        try {
            const medicineTypes = await prisma.medicineType.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' }
            });

            res.json({
                success: true,
                data: medicineTypes
            });
        } catch (error) {
            console.error('Error fetching medicine types:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch medicine types'
            });
        }
    }

    // ============ Generic Medicine CRUD ============
    async createGenericMedicine(req, res) {
        try {
            const { name } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Generic medicine name is required'
                });
            }

            const genericMedicine = await prisma.genericMedicine.create({
                data: { name: name.trim() }
            });

            res.status(201).json({
                success: true,
                message: 'Generic medicine created successfully',
                data: genericMedicine
            });
        } catch (error) {
            console.error('Error creating generic medicine:', error);
            if (error.code === 'P2002') {
                return res.status(400).json({
                    success: false,
                    message: 'Generic medicine already exists'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to create generic medicine'
            });
        }
    }

    async getGenericMedicines(req, res) {
        try {
            const genericMedicines = await prisma.genericMedicine.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' }
            });

            res.json({
                success: true,
                data: genericMedicines
            });
        } catch (error) {
            console.error('Error fetching generic medicines:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch generic medicines'
            });
        }
    }

    // ============ Drug Group CRUD ============
    async createDrugGroup(req, res) {
        try {
            const { name } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Drug group name is required'
                });
            }

            const drugGroup = await prisma.drugGroup.create({
                data: { name: name.trim() }
            });

            res.status(201).json({
                success: true,
                message: 'Drug group created successfully',
                data: drugGroup
            });
        } catch (error) {
            console.error('Error creating drug group:', error);
            if (error.code === 'P2002') {
                return res.status(400).json({
                    success: false,
                    message: 'Drug group already exists'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to create drug group'
            });
        }
    }

    async getDrugGroups(req, res) {
        try {
            const drugGroups = await prisma.drugGroup.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' }
            });

            res.json({
                success: true,
                data: drugGroups
            });
        } catch (error) {
            console.error('Error fetching drug groups:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch drug groups'
            });
        }
    }

    // ============ Dosage Schedule CRUD ============
    async createDosageSchedule(req, res) {
        try {
            const { name } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Dosage schedule name is required'
                });
            }

            const dosageSchedule = await prisma.dosageSchedule.create({
                data: { name: name.trim() }
            });

            res.status(201).json({
                success: true,
                message: 'Dosage schedule created successfully',
                data: dosageSchedule
            });
        } catch (error) {
            console.error('Error creating dosage schedule:', error);
            if (error.code === 'P2002') {
                return res.status(400).json({
                    success: false,
                    message: 'Dosage schedule already exists'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to create dosage schedule'
            });
        }
    }

    async getDosageSchedules(req, res) {
        try {
            const dosageSchedules = await prisma.dosageSchedule.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' }
            });

            res.json({
                success: true,
                data: dosageSchedules
            });
        } catch (error) {
            console.error('Error fetching dosage schedules:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dosage schedules'
            });
        }
    }

    // ============ Medicine CRUD ============
    async createMedicine(req, res) {
        try {
            const {
                code,
                name,
                typeId,
                genericMedicineId,
                drugGroupId,
                dosageScheduleId,
                dosage,
                information
            } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Medicine name is required'
                });
            }

            const medicine = await prisma.medicine.create({
                data: {
                    code: code?.trim() || null,
                    name: name.trim(),
                    typeId: typeId || null,
                    genericMedicineId: genericMedicineId || null,
                    drugGroupId: drugGroupId || null,
                    dosageScheduleId: dosageScheduleId || null,
                    dosage: dosage?.trim() || null,
                    information: information?.trim() || null
                },
                include: {
                    type: true,
                    genericMedicine: true,
                    drugGroup: true,
                    dosageSchedule: true
                }
            });

            res.status(201).json({
                success: true,
                message: 'Medicine created successfully',
                data: medicine
            });
        } catch (error) {
            console.error('Error creating medicine:', error);
            if (error.code === 'P2002') {
                return res.status(400).json({
                    success: false,
                    message: 'Medicine code already exists'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to create medicine'
            });
        }
    }

    async getMedicines(req, res) {
        try {
            const { search, page = 1, limit = 50 } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const where = {
                isActive: true,
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { code: { contains: search, mode: 'insensitive' } }
                    ]
                })
            };

            const [medicines, total] = await Promise.all([
                prisma.medicine.findMany({
                    where,
                    include: {
                        type: true,
                        genericMedicine: true,
                        drugGroup: true,
                        dosageSchedule: true
                    },
                    orderBy: { name: 'asc' },
                    skip,
                    take: parseInt(limit)
                }),
                prisma.medicine.count({ where })
            ]);

            res.json({
                success: true,
                data: medicines,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Error fetching medicines:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch medicines'
            });
        }
    }

    async updateMedicine(req, res) {
        try {
            const { id } = req.params;
            const {
                code,
                name,
                typeId,
                genericMedicineId,
                drugGroupId,
                dosageScheduleId,
                dosage,
                information
            } = req.body;

            const medicine = await prisma.medicine.update({
                where: { id },
                data: {
                    code: code?.trim() || null,
                    name: name?.trim(),
                    typeId: typeId || null,
                    genericMedicineId: genericMedicineId || null,
                    drugGroupId: drugGroupId || null,
                    dosageScheduleId: dosageScheduleId || null,
                    dosage: dosage?.trim() || null,
                    information: information?.trim() || null
                },
                include: {
                    type: true,
                    genericMedicine: true,
                    drugGroup: true,
                    dosageSchedule: true
                }
            });

            res.json({
                success: true,
                message: 'Medicine updated successfully',
                data: medicine
            });
        } catch (error) {
            console.error('Error updating medicine:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update medicine'
            });
        }
    }

    async deleteMedicine(req, res) {
        try {
            const { id } = req.params;

            await prisma.medicine.update({
                where: { id },
                data: { isActive: false }
            });

            res.json({
                success: true,
                message: 'Medicine deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting medicine:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete medicine'
            });
        }
    }

    // ============ Search for Autocomplete ============
    async searchMedicines(req, res) {
        try {
            const { q = '', limit = 10 } = req.query;

            if (!q || q.length < 2) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            const medicines = await prisma.medicine.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { code: { contains: q, mode: 'insensitive' } }
                    ]
                },
                include: {
                    type: true,
                    genericMedicine: true,
                    drugGroup: true,
                    dosageSchedule: true
                },
                take: parseInt(limit),
                orderBy: { name: 'asc' }
            });

            res.json({
                success: true,
                data: medicines
            });
        } catch (error) {
            console.error('Error searching medicines:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search medicines'
            });
        }
    }
}

module.exports = new MedicineMasterController();
