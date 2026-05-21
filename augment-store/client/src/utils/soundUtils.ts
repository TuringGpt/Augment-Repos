/**
 * Sound utility functions for playing notification sounds
 */

import type { NotificationSoundPreset } from '@constants/index'
import { NOTIFICATION_SOUND_PRESETS } from '@constants/index'

/**
 * Play a notification sound with specific parameters
 * Uses the Web Audio API to generate a notification tone
 * Gracefully handles errors if audio playback is blocked by browser
 *
 * @param preset - The sound preset to use (default, chime, beep, pop, bell, subtle)
 */
export const playNotificationSound = (preset: NotificationSoundPreset = 'default'): void => {
  try {
    // Get the sound configuration for the selected preset
    const soundConfig = NOTIFICATION_SOUND_PRESETS[preset]

    // Create AudioContext
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Create oscillator for the notification sound
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Configure sound parameters based on preset
    oscillator.type = soundConfig.type
    oscillator.frequency.setValueAtTime(soundConfig.frequency, audioContext.currentTime)

    // Create a short beep with fade out
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime) // Initial volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + soundConfig.duration) // Fade out

    // Start and stop the sound
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + soundConfig.duration)

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
 * @param preset - The sound preset to use
 */
export const playNotificationSoundIfEnabled = (
  enabled: boolean,
  preset: NotificationSoundPreset = 'default'
): void => {
  if (enabled) {
    playNotificationSound(preset)
  }
}
