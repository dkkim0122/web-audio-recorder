import { RecorderWokletProcessorSrc } from './worklet/recorderWorkletProcessor.js'
import {
  AudioRecorder,
  AudioRecorderOptions,
  AudioRecorderStates,
} from './types'

function createAudioRecorder(): AudioRecorder {
  const state: AudioRecorderStates = {
    mediaStream: null,
    isRecording: false,
    volume: 0,
  }

  let audioContext: AudioContext
  let inputNode: MediaStreamAudioSourceNode
  let analyzerNode: AnalyserNode
  let audioWorkletNode: AudioWorkletNode
  let flushInterval: ReturnType<typeof setInterval>
  let handleStopCallback: ((blob: Blob) => void) | null

  const stopMediaStream = (): void => {
    if (state.mediaStream != null) {
      state.mediaStream?.getTracks().forEach((track) => {
        track.stop()
      })
    }
  }

  const closeAudioContext = (): void => {
    if (audioContext != null) {
      audioContext.close().catch(() => {})
    }
  }

  const requestMicPermission = async (
    contraints?: MediaStreamConstraints
  ): Promise<void> => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        contraints ?? { audio: true }
      )
      state.mediaStream = mediaStream
    } catch (err) {
      window.alert('You do not have permission for microphone access.')
    }
  }

  const startRecording = async ({
    timeSlice, // ms
    sampleRate = 44000, // hz
    enableAnalyzeVolume = true,
    onDataAvailable,
  }: AudioRecorderOptions): Promise<void> => {
    if (!state.mediaStream) {
      throw new Error('startRecording: no media stream exists!')
    }
    audioContext = new AudioContext({ sampleRate })

    inputNode = audioContext.createMediaStreamSource(state.mediaStream)

    // analyze volume from 0~1
    analyzerNode = audioContext.createAnalyser()
    analyzerNode.fftSize = 256

    if (audioContext.state !== 'running') {
      await audioContext.resume() // for safari
    }

    const analyzeVolume = (): void => {
      const arr = new Uint8Array(analyzerNode.frequencyBinCount)
      analyzerNode.getByteFrequencyData(arr) // amplitude of each frequency bin from 0 to 255
      const average = arr.reduce((a, b) => a + b) / arr.length
      state.volume = Math.round(average) / 100

      if (audioContext?.state === 'running') {
        requestAnimationFrame(analyzeVolume)
      }
    }

    // pcm -> wav encode
    await audioContext.audioWorklet.addModule(RecorderWokletProcessorSrc)
    audioWorkletNode = new AudioWorkletNode(
      audioContext,
      'recorder-worklet-processor'
    )
    audioWorkletNode.port.onmessage = (event: MessageEvent) => {
      const { data } = event
      if (data.wavBuffer != null) {
        const wavBuffer = data.wavBuffer as ArrayBuffer
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' })

        if (timeSlice !== undefined && onDataAvailable) {
          onDataAvailable(wavBlob)
          return
        }

        if (handleStopCallback) {
          handleStopCallback(wavBlob)
          handleStopCallback = null
        }
      }
    }

    if (timeSlice !== undefined) {
      flushInterval = setInterval(() => {
        audioWorkletNode.port.postMessage('flush')
      }, timeSlice)
    }

    inputNode.connect(analyzerNode)
    analyzerNode.connect(audioWorkletNode)

    if (enableAnalyzeVolume) {
      analyzeVolume()
    }

    state.isRecording = true
  }

  const stopRecording = (cb?: (blob: Blob) => void): void => {
    if (!state.isRecording) return

    handleStopCallback = cb ?? null

    audioWorkletNode.port.postMessage('flush')
    clearInterval(flushInterval)

    inputNode.disconnect(analyzerNode)
    analyzerNode.disconnect(audioWorkletNode)

    closeAudioContext()
    state.isRecording = false
    state.volume = 0
  }

  const destroyMediaStream = (): void => {
    stopMediaStream()
    closeAudioContext()
    state.mediaStream = null
  }

  const getState = () => ({ ...state })

  return {
    requestMicPermission,
    startRecording,
    stopRecording,
    destroyMediaStream,
    getState,
  }
}

export { createAudioRecorder }
export type {
  AudioRecorderOptions,
  AudioRecorderStates,
  AudioRecorder,
} from './types'
