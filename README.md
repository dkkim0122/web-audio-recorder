# useAudio
## 개요
- Web Audio API를 사용하여 음성 녹음 및 마이크 입력 처리를 담당하는 Vue3 컴포저블입니다. 
- 마이크 권한을 획득 후 해당 오디오 스트림과 Web Audio API를 통해 오디오를 제어합니다.
- 모드
  - timeSlice 모드: 일정 time slice 마다 음성 데이터를 WAV 타입의 Blob 파일로 받아 처리할 수 있습니다.
  - 청크 모드: 녹음 시작 ~ 끝 동안 녹음된 음성 데이터를 한번에 WAV 파입의 Blob 파일로 받아 처리할 수 있습니다.

## 기능
- 마이크 권한 관리 및 상태 확인
- 오디오 스트림 생성 및 제어
- 실시간 볼륨 레벨 분석
- AudioWorklet을 이용한 오디오 처리(PCM -> WAV)

## 상세
### 옵션
```ts
interface UseAudioOptions {
  sampleRate?: number                    // 음성 해상도
  enableAnalyzeVolume?: boolean          // 볼륨 분석 활성화 여부 (기본값: true)
  timeSlice?: number                     // 일정 시간마다 음성을 끊어
  onDataAvailable: (data: Blob) => void  // timeSlice로 지정된 시간 간격마다의 오디오 데이터 수신 콜백
}
```

### 반환값
```ts
interface UseAudioReturn {
  volume: Ref<number>                    // 현재 볼륨 레벨 (0 ~ 1)
  isMicPermission: Ref<boolean>          // 마이크 권한 상태
  isBrowserSupportWorklet: Ref<boolean>  // AudioWorklet 지원 여부
  audioStream: Ref<MediaStream | null>   // 현재 오디오 스트림
  audioInputs: ComputedRef<MediaDeviceInfo[]>  // 사용 가능한 오디오 입력 장치
  audioOutputs: ComputedRef<MediaDeviceInfo[]> // 사용 가능한 오디오 출력 장치
  createAudioStream: () => Promise<void>  // 오디오 스트림 생성
  destroyAudioStream: () => void         // 오디오 스트림 제거
  startRecording: () => Promise<void>    // 녹음 시작
  stopRecording: () => Promise<void>     // 녹음 중지
}
```

## 사용법
### timeSlice 모드
```ts
<template>
  <div>
    <button @click="handleStart">녹음 시작</button>
    <button @click="handleStop">녹음 중지</button>
    <div>볼륨 레벨: {{ volume }}</div>
  </div>
</template>

<script setup lang="ts">
import { useAudio } from './composables/useAudio'

const {
  volume,
  startRecording,
  stopRecording
} = useAudio({
  timeSlice: 100, // ms. (필수)
  onDataAvailable: (blob) => {
    // 녹음된 오디오 처리. (필수)
  }
})

const handleStart = async () => {
  try {
    await startRecording()
  } catch (error) {
    console.error('녹음 시작 실패:', error)
  }
}

const handleStop = async () => {
  await stopRecording()
}
</script>
```

### 청크 모드
```ts
<template>
  <div>
    <button @click="handleStart">녹음 시작</button>
    <button @click="handleStop">녹음 중지</button>
    <div>볼륨 레벨: {{ volume }}</div>
  </div>
</template>

<script setup lang="ts">
import { useAudio } from './composables/useAudio'

const {
  volume,
  startRecording,
  stopRecording
} = useAudio()

const handleStart = async () => {
  try {
    await startRecording()
  } catch (error) {
    console.error('녹음 시작 실패:', error)
  }
}

const handleStop = async () => {
  await stopRecording((blob: Blob) => {
    // 녹음된 오디오 처리
  })
}
</script>
```
