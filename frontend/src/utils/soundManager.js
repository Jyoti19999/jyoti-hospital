/**
 * Sound Manager Utility
 * Handles notification sound playback using Web Audio API
 */

// Audio context (created on user interaction to comply with autoplay policies)
let audioContext = null;

// Preloaded audio buffers
const audioBuffers = {};

// Sound configuration
const SOUND_CONFIG = {
    default: {
        frequency: 520,
        duration: 0.25,
        type: 'sine',
        volume: 0.5,
        repeat: 10 // ~3 seconds total duration
    },
    subtle: {
        frequency: 520,
        duration: 0.1,
        type: 'sine',
        volume: 0.2
    },
    urgent: {
        frequency: 880,
        duration: 0.25,
        type: 'square',
        volume: 0.5,
        repeat: 2
    },
    critical: {
        frequency: 1000,
        duration: 0.3,
        type: 'square',
        volume: 0.6,
        repeat: 3
    }
};

/**
 * Initialize the audio context (must be called after user interaction)
 */
export const initAudioContext = () => {
    if (audioContext) return audioContext;

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('🔊 Audio context initialized');
        return audioContext;
    } catch (error) {
        console.warn('⚠️ Web Audio API not supported:', error);
        return null;
    }
};

/**
 * Resume audio context if suspended (required for autoplay policies)
 */
export const resumeAudioContext = async () => {
    if (!audioContext) {
        initAudioContext();
    }

    if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    return audioContext;
};

/**
 * Play a notification sound using Web Audio API
 */
export const playNotificationSound = async (soundType = 'default') => {
    try {
        const ctx = await resumeAudioContext();
        if (!ctx) return false;

        const config = SOUND_CONFIG[soundType] || SOUND_CONFIG.default;
        const repeatCount = config.repeat || 1;

        for (let i = 0; i < repeatCount; i++) {
            await playTone(ctx, config, i * (config.duration + 0.05) * 1000);
        }

        return true;
    } catch (error) {
        console.error('Error playing notification sound:', error);
        return false;
    }
};

/**
 * Play a single tone
 */
const playTone = (ctx, config, delay = 0) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = config.type;
            oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

            // Fade in and out for smoother sound
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(config.volume, ctx.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + config.duration);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + config.duration);

            oscillator.onended = resolve;
        }, delay);
    });
};

/**
 * Play a priority-based sound
 */
export const playPrioritySound = async (priority) => {
    const soundTypeMap = {
        low: 'subtle',
        normal: 'default',
        high: 'urgent',
        critical: 'critical'
    };

    const soundType = soundTypeMap[priority] || 'default';
    return playNotificationSound(soundType);
};

/**
 * Play a custom sound file (via URL or ID)
 */
export const playCustomSound = (soundName) => {
    // If soundName is a URL/path (contains slash), play it directly
    if (soundName && (soundName.includes('/') || soundName.includes('\\'))) {
        const audio = new Audio(soundName);
        audio.play().catch(e => console.error("Error playing custom sound URL:", e));
        return;
    }

    // Otherwise treat as a predefined custom sound ID
    console.log(`Playing custom sound ID: ${soundName}`);
    // For now, fallback to default if ID not recognized
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(e => console.error("Error playing custom sound:", e));
};

/**
 * Play a sound from a direct URL
 */
export const playSoundFromUrl = (url) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(e => console.error("Error playing sound from URL:", e));
};

/**
 * Test sound playback (useful for settings)
 */
export const testSound = async (soundType = 'default') => {
    return playNotificationSound(soundType);
};

/**
 * Check if Web Audio API is supported
 */
export const isAudioSupported = () => {
    return !!(window.AudioContext || window.webkitAudioContext);
};

/**
 * Get available sound types
 */
export const getSoundTypes = () => {
    return Object.keys(SOUND_CONFIG).map(key => ({
        value: key,
        label: key.charAt(0).toUpperCase() + key.slice(1)
    }));
};

export default {
    initAudioContext,
    resumeAudioContext,
    playNotificationSound,
    playPrioritySound,
    playCustomSound,
    playSoundFromUrl,
    testSound,
    isAudioSupported,
    getSoundTypes
};
