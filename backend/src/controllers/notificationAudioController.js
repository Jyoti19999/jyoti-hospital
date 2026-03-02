const prisma = require('../utils/prisma');
const path = require('path');
const fs = require('fs').promises;

/**
 * Upload a new notification audio file
 * POST /api/admin/notification-audios
 */
const uploadAudio = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No audio file uploaded'
            });
        }

        const { type, description, isDefault } = req.body;

        // If this is set as default for a type, unset others
        if (isDefault === 'true' && type) {
            await prisma.notificationAudio.updateMany({
                where: { type, isDefault: true },
                data: { isDefault: false }
            });
        }

        const audio = await prisma.notificationAudio.create({
            data: {
                name: req.body.name || req.file.originalname,
                originalName: req.file.originalname,
                description,
                filename: req.file.filename,
                path: req.file.path.replace(/\\/g, '/'), // Normalize path separators
                mimeType: req.file.mimetype,
                size: req.file.size,
                type: type || 'custom',
                isDefault: isDefault === 'true',
                isActive: true
            }
        });

        res.status(201).json({
            success: true,
            audio
        });
    } catch (error) {
        console.error('Error uploading notification audio:', error);
        // Try to cleanup uploaded file if database record creation fails
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (e) {
                console.error('Error cleaning up file:', e);
            }
        }
        res.status(500).json({
            success: false,
            error: 'Failed to upload audio file'
        });
    }
};

/**
 * Get all notification audios
 * GET /api/admin/notification-audios
 */
const getAudios = async (req, res) => {
    try {
        const { type } = req.query;
        const where = { isActive: true };

        if (type) {
            where.type = type;
        }

        const audios = await prisma.notificationAudio.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            audios
        });
    } catch (error) {
        console.error('Error getting notification audios:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get notification audios'
        });
    }
};

/**
 * Set an audio file as default for a type
 * PUT /api/admin/notification-audios/:id/set-default
 */
const setAsDefault = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body;

        if (!type) {
            return res.status(400).json({
                success: false,
                error: 'Notification type is required'
            });
        }

        // Unset current default for this type
        await prisma.notificationAudio.updateMany({
            where: { type, isDefault: true },
            data: { isDefault: false }
        });

        // Set new default
        const audio = await prisma.notificationAudio.update({
            where: { id },
            data: {
                isDefault: true,
                type // Also update type to match
            }
        });

        res.json({
            success: true,
            audio
        });
    } catch (error) {
        console.error('Error setting default audio:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to set default audio'
        });
    }
};

/**
 * Delete an audio file
 * DELETE /api/admin/notification-audios/:id
 */
const deleteAudio = async (req, res) => {
    try {
        const { id } = req.params;

        const audio = await prisma.notificationAudio.findUnique({
            where: { id }
        });

        if (!audio) {
            return res.status(404).json({
                success: false,
                error: 'Audio file not found'
            });
        }

        // Soft delete
        await prisma.notificationAudio.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({
            success: true,
            message: 'Audio file deleted'
        });
    } catch (error) {
        console.error('Error deleting notification audio:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete audio file'
        });
    }
};

module.exports = {
    uploadAudio,
    getAudios,
    setAsDefault,
    deleteAudio
};
