const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');

// Get all staff types
router.get('/', async (req, res) => {
  try {
    const staffTypes = await prisma.staffType.findMany({
      orderBy: { type: 'asc' }
    });
    res.json(staffTypes);
  } catch (error) {
    console.error('Error fetching staff types:', error);
    res.status(500).json({ message: 'Failed to fetch staff types' });
  }
});

// Create new staff type
router.post('/', async (req, res) => {
  try {
    const { type } = req.body;

    if (!type || !type.trim()) {
      return res.status(400).json({ message: 'Staff type is required' });
    }

    const staffType = await prisma.staffType.create({
      data: {
        type: type.trim().toLowerCase()
      }
    });

    res.status(201).json(staffType);
  } catch (error) {
    console.error('Error creating staff type:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Staff type already exists' });
    }
    
    res.status(500).json({ message: 'Failed to create staff type' });
  }
});

// Delete staff type
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.staffType.delete({
      where: { id }
    });

    res.json({ message: 'Staff type deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff type:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Staff type not found' });
    }
    
    res.status(500).json({ message: 'Failed to delete staff type' });
  }
});

module.exports = router;
