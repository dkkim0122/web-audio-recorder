# web-audio-recorder-wav

## Overview
- A library that handles voice recording and microphone input processing using the Web Audio API.
- After obtaining microphone permissions, it controls audio through the audio stream and Web Audio API.
- Modes:
  - Basic mode: Process the entire recording session's audio data as a single WAV type Blob file.
  - Time-Slice mode: Process audio data as WAV type Blob files at specified time intervals.

## Core Features
- Microphone permission management and status monitoring
- Audio stream creation and control
- Real-time volume level analysis
- Audio processing using AudioWorklet (PCM -> WAV)

## Installation
```bash
npm i web-audio-recorder-wav
# or
yarn add web-audio-recorder-wav
```

## Usage
### Basic Recording
```typescript
import { createAudioRecorder } from 'audio-recorder';

const recorder = createAudioRecorder();

// Request microphone permission
await recorder.requestMicPermission();

// Start recording
await recorder.startRecording({
  sampleRate: 44000,
  enableAnalyzeVolume: true,
});

// Stop recording and get result
recorder.stopRecording((blob) => {
  const audioUrl = URL.createObjectURL(blob);
  // Use the blob or URL as needed
});
```

### Time-Slice Recording
```ts
await recorder.startRecording({
  timeSlice: 1000, // Create chunks every 1 second
  onDataAvailable: (blob) => {
    // Callback called for each chunk
    console.log('New chunk available:', blob);
  }
});
```

### Volume Monitoring
```ts
import { createAudioRecorder } from 'audio-recorder';

const recorder = createAudioRecorder();

// Request microphone permission first
await recorder.requestMicPermission();

// Start recording with volume analysis enabled
await recorder.startRecording({
  enableAnalyzeVolume: true,
});

// Monitor volume in real-time
const checkVolume = () => {
  const state = recorder.getState();
  console.log('Current volume:', state.volume); // 0 to 1
};

// Start volume monitoring
checkVolume();

// Later: Stop recording
recorder.stopRecording();
```

## Additional Information
### NPM Package
- [https://www.npmjs.com/package/web-audio-recorder-wav](https://www.npmjs.com/package/web-audio-recorder-wav)
