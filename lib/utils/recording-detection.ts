export interface RecordingDetectionOptions {
  onDetected?: () => void
  onStopped?: () => void
}

let isRecording = false
let monitoringActive = false

export function initRecordingDetection(options: RecordingDetectionOptions = {}) {
  if (monitoringActive) return () => {}

  monitoringActive = true

  const detectScreenRecording = async () => {
    try {
      // Check for screen capture devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const screenShareDevices = devices.filter((device) => device.label.toLowerCase().includes("screen"))

      const wasRecording = isRecording
      isRecording = screenShareDevices.length > 0

      if (isRecording && !wasRecording) {
        console.log("[v0] Screen recording detected")
        options.onDetected?.()
      } else if (!isRecording && wasRecording) {
        console.log("[v0] Screen recording stopped")
        options.onStopped?.()
      }
    } catch (error) {
      console.error("[v0] Error detecting screen recording:", error)
    }
  }

  const handleDeviceChange = () => {
    detectScreenRecording()
  }

  // Initial check
  detectScreenRecording()

  // Listen for device changes
  navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange)

  return () => {
    navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange)
    monitoringActive = false
  }
}

export function isScreenRecordingActive(): boolean {
  return isRecording
}
