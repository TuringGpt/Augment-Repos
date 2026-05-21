/**
 * Sound utility functions for playing notification sounds
 */

/**
 * Play a notification sound
 * Uses the Web Audio API to generate a simple notification tone
 * Gracefully handles errors if audio playback is blocked by browser
 */
export const playNotificationSound = (): void => {
  try {
    // Create AudioContext
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Create oscillator for the notification sound
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Configure sound parameters
    oscillator.type = 'sine' // Smooth sine wave
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // 800 Hz frequency
    
    // Create a short beep with fade out
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime) // Initial volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2) // Fade out
    
    // Start and stop the sound
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2) // 200ms duration
    
    // Clean up after sound finishes
    oscillator.onended = () => {
      oscillator.disconnect()
      gainNode.disconnect()
      audioContext.close().catch((error) => {
        console.debug('Failed to close audio context:', error)
      })
    }
  } catch (error) {
    // Silently fail if audio playback is not available or blocked
    // This prevents errors in environments where audio is disabled
    console.debug('Notification sound could not be played:', error)
  }
}

/**
 * Play a notification sound conditionally based on user preferences
 * @param enabled - Whether notification sounds are enabled
 */
export const playNotificationSoundIfEnabled = (enabled: boolean): void => {
  if (enabled) {
    playNotificationSound()
  }
}
