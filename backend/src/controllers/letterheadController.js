const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all letterhead templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await prisma.letterheadTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching letterhead templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

// Get single template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await prisma.letterheadTemplate.findUnique({
      where: { id }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

// Create new letterhead template
exports.createTemplate = async (req, res) => {
  try {
    const { name, description, elements, pageSettings, isDefault } = req.body;
    
    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.letterheadTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }
    
    const template = await prisma.letterheadTemplate.create({
      data: {
        name,
        description,
        elements,
        pageSettings,
        isDefault: isDefault || false,
        createdBy: req.user?.id
      }
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

// Update letterhead template
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, elements, pageSettings, isDefault, isActive } = req.body;
    
    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.letterheadTemplate.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }
    
    const template = await prisma.letterheadTemplate.update({
      where: { id },
      data: {
        name,
        description,
        elements,
        pageSettings,
        isDefault,
        isActive
      }
    });
    
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

// Delete letterhead template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.letterheadTemplate.delete({
      where: { id }
    });
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

// Get default template
exports.getDefaultTemplate = async (req, res) => {
  try {
    const template = await prisma.letterheadTemplate.findFirst({
      where: { isDefault: true, isActive: true }
    });
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching default template:', error);
    res.status(500).json({ error: 'Failed to fetch default template' });
  }
};
