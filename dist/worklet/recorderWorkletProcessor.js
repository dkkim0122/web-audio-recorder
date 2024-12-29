const recorderWorkletProcessor = `
class RecorderWokletProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.bufferChunks = []
    this.port.onmessage = event => {
      if (event.data === 'flush') {
        this.flush()
      }
    }
  }

  process(inputs) {
    const input = inputs[0]
    if (input.length > 0) {
      const channelData = input[0] // only mono channel
      this.bufferChunks.push(new Float32Array(channelData))
    }
    return true
  }

  flush() {
    if (this.bufferChunks.length > 0) {
      const wavBuffer = this.encodeWAV(this.bufferChunks, sampleRate)
      this.port.postMessage({ wavBuffer }, [wavBuffer])
      this.bufferChunks = []
    }
  }

  encodeWAV(samples, sampleRate) {
    const WAV_HEADER_LENGTH = 44 // bytes
    const bufferLength = samples.length * samples[0].length * 2
    const buffer = new ArrayBuffer(WAV_HEADER_LENGTH + bufferLength)
    const view = new DataView(buffer)

    // pack WAV header
    this.writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + bufferLength, true)
    this.writeString(view, 8, 'WAVE')
    this.writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true) // SubChunk1Size
    view.setUint16(20, 1, true) // AudioFormat (PCM)
    view.setUint16(22, 1, true) // NumChannels
    view.setUint32(24, sampleRate, true) // SampleRate
    view.setUint32(28, sampleRate * 2, true) // ByteRate
    view.setUint16(32, 2, true) // BlockAlign
    view.setUint16(34, 16, true) // BitsPerSample
    this.writeString(view, 36, 'data')
    view.setUint32(40, bufferLength, true)

    // write audio data
    let offset = WAV_HEADER_LENGTH
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i]
      for (let j = 0; j < sample.length; j++) {
        const s = Math.max(-1, Math.min(1, sample[j]))
        view.setInt16(offset, s * 0x7fff, true)
        offset += 2 // 2bytes -> 16bits씩
      }
    }

    return buffer
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
}

registerProcessor('recorder-worklet-processor', RecorderWokletProcessor)
`;
const script = new Blob([recorderWorkletProcessor], {
    type: 'application/javascript',
});
const src = URL.createObjectURL(script);
export const RecorderWokletProcessorSrc = src;
