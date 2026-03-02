const express = require('express');
const router = express.Router();
const notificationAudioController = require('../controllers/notificationAudioController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for audio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/notifications');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'notification-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
    } else {
        cb(new Error('Only audio files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// All routes require admin access
router.use(authenticateToken);
router.use(requireSuperAdmin);

router.post(
    '/',
    upload.single('audio'),
    notificationAudioController.uploadAudio
);

router.get('/', notificationAudioController.getAudios);
router.put('/:id/set-default', notificationAudioController.setAsDefault);
router.delete('/:id', notificationAudioController.deleteAudio);

module.exports = router;
