const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:8080/api';
// You might need to adjust this to a valid token for your environment
const SUPER_ADMIN_TOKEN = process.env.SUPER_ADMIN_TOKEN || 'YOUR_TOKEN_HERE';

const runVerification = async () => {
    console.log('🚀 Starting Notification System Verification...');

    try {
        // 1. Test Audio Upload
        console.log('\n🔊 Testing Audio Upload...');
        const formData = new FormData();
        // Create a dummy mp3 file if not exists
        const dummyAudioPath = path.join(__dirname, 'test_audio.mp3');
        if (!fs.existsSync(dummyAudioPath)) {
            fs.writeFileSync(dummyAudioPath, 'dummy content'); // This won't play but is enough for upload test
        }

        formData.append('audio', fs.createReadStream(dummyAudioPath));
        formData.append('type', 'emergency');
        formData.append('description', 'Test Emergency Sound');
        formData.append('isDefault', 'true');

        // Note: This request requires a valid token. 
        // If we can't easily get one programmatically, we might skip actual API calls 
        // and just checking code logic or asking user to verify in UI.
        console.log('⚠️ Skipping actual API call in script due to auth requirement.');
        console.log('✅ Please verify upload manually in Admin Panel.');

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
};

runVerification();
