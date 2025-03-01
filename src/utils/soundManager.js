/**
 * Sound management utility for notifications
 */

class SoundManager {
    constructor() {
        this.enabled = true;
        this.permissionGranted = false;
        this.userInteracted = false;
        this.currentSound = null;
    }

    /**
     * Initialize the sound manager and try to get permission
     * @returns {Promise<boolean>} - A promise that resolves to true if initialization succeeded
     */
    initialize() {
        try {
            // Add event listeners for user interaction to enable sound
            document.addEventListener('click', this.handleUserInteraction);
            document.addEventListener('keydown', this.handleUserInteraction);
            return Promise.resolve(true);
        } catch (err) {
            console.error("Error initializing sound:", err);
            this.enabled = false;
            return Promise.resolve(false);
        }
    }

    /**
     * Clean up event listeners
     */
    cleanup() {
        document.removeEventListener('click', this.handleUserInteraction);
        document.removeEventListener('keydown', this.handleUserInteraction);
        this.stopCurrentSound();
    }

    /**
     * Handle user interaction to silently get sound permission
     */
    handleUserInteraction = () => {
        if (this.permissionGranted) return; // Already have permission

        this.userInteracted = true;

        // Create a silent audio context to get permission
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            // Set the gain to 0 (completely silent)
            gainNode.gain.value = 0;

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Start and immediately stop
            oscillator.start(0);
            oscillator.stop(0.001);

            // If we get here, we have permission
            this.permissionGranted = true;
        } catch (err) {
            console.warn(`Silent permission check failed: ${err.message}`);
        }
    };

    /**
     * Toggle sound on/off
     * @returns {boolean} - The new state (true if enabled, false if disabled)
     */
    toggleSound() {
        this.enabled = !this.enabled;

        // Stop any playing sound when disabled
        if (!this.enabled) {
            this.stopCurrentSound();
        }

        return this.enabled;
    }

    /**
     * Stop the currently playing sound
     */
    stopCurrentSound() {
        if (this.currentSound) {
            try {
                this.currentSound.pause();
                this.currentSound.currentTime = 0;
            } catch (err) {
                console.warn(`Error stopping sound: ${err.message}`);
            }
            this.currentSound = null;
        }
    }

    /**
     * Play a notification sound
     * @param {string} soundUrl - The URL of the sound file to play
     * @returns {Promise<boolean>} - A promise that resolves to true if played successfully
     */
    playNotification(soundUrl = '/sounds/message.mp3') {
        // Only play if sound is enabled and permission is granted
        if (!this.enabled || (!this.permissionGranted && !this.userInteracted)) {
            return Promise.resolve(false);
        }

        try {
            // Stop any currently playing sound
            this.stopCurrentSound();

            // Create fresh Audio instance and store reference
            const notificationSound = new Audio(soundUrl);
            notificationSound.volume = 0.5;
            this.currentSound = notificationSound;

            const playPromise = notificationSound.play();

            if (playPromise) {
                return playPromise
                    .then(() => {
                        // Mark permission as granted since it worked
                        this.permissionGranted = true;
                        return true;
                    })
                    .catch(err => {
                        console.warn(`Sound failed to play: ${err.message}`);
                        if (err.name === "NotAllowedError") {
                            this.permissionGranted = false;
                        }
                        return false;
                    });
            }

            return Promise.resolve(true);
        } catch (err) {
            console.warn(`Error playing notification sound: ${err.message}`);
            return Promise.resolve(false);
        }
    }

    /**
     * Get the current sound state
     * @returns {Object} - The current sound state
     */
    getState() {
        return {
            enabled: this.enabled,
            permissionGranted: this.permissionGranted,
            userInteracted: this.userInteracted
        };
    }
}

// Export a singleton instance
const soundManager = new SoundManager();
export default soundManager;