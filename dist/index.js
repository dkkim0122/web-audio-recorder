import { RecorderWokletProcessorSrc } from './worklet/recorderWorkletProcessor.js';
function createAudioRecorder() {
    const state = {
        mediaStream: null,
        isRecording: false,
        volume: 0,
    };
    let audioContext;
    let inputNode;
    let analyzerNode;
    let audioWorkletNode;
    let flushInterval;
    let handleStopCallback;
    const stopMediaStream = () => {
        if (state.mediaStream != null) {
            state.mediaStream?.getTracks().forEach((track) => {
                track.stop();
            });
        }
    };
    const closeAudioContext = () => {
        if (audioContext != null) {
            audioContext.close().catch(() => { });
        }
    };
    const requestMicPermission = async (contraints) => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia(contraints ?? { audio: true });
            state.mediaStream = mediaStream;
        }
        catch (err) {
            window.alert('You do not have permission for microphone access.');
        }
    };
    const startRecording = async ({ timeSlice, // ms
    sampleRate = 44000, // hz
    enableAnalyzeVolume = true, onDataAvailable, }) => {
        if (!state.mediaStream) {
            throw new Error('startRecording: no media stream exists!');
        }
        audioContext = new AudioContext({ sampleRate });
        inputNode = audioContext.createMediaStreamSource(state.mediaStream);
        // analyze volume from 0~1
        analyzerNode = audioContext.createAnalyser();
        analyzerNode.fftSize = 256;
        if (audioContext.state !== 'running') {
            await audioContext.resume(); // for safari
        }
        const analyzeVolume = () => {
            const arr = new Uint8Array(analyzerNode.frequencyBinCount);
            analyzerNode.getByteFrequencyData(arr); // amplitude of each frequency bin from 0 to 255
            const average = arr.reduce((a, b) => a + b) / arr.length;
            state.volume = Math.round(average) / 100;
            if (audioContext?.state === 'running') {
                requestAnimationFrame(analyzeVolume);
            }
        };
        // pcm -> wav encode
        await audioContext.audioWorklet.addModule(RecorderWokletProcessorSrc);
        audioWorkletNode = new AudioWorkletNode(audioContext, 'recorder-worklet-processor');
        audioWorkletNode.port.onmessage = (event) => {
            const { data } = event;
            if (data.wavBuffer != null) {
                const wavBuffer = data.wavBuffer;
                const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                if (timeSlice !== undefined && onDataAvailable) {
                    onDataAvailable(wavBlob);
                    return;
                }
                if (handleStopCallback) {
                    handleStopCallback(wavBlob);
                    handleStopCallback = null;
                }
            }
        };
        if (timeSlice !== undefined) {
            flushInterval = setInterval(() => {
                audioWorkletNode.port.postMessage('flush');
            }, timeSlice);
        }
        inputNode.connect(analyzerNode);
        analyzerNode.connect(audioWorkletNode);
        if (enableAnalyzeVolume) {
            analyzeVolume();
        }
        state.isRecording = true;
    };
    const stopRecording = (cb) => {
        if (!state.isRecording)
            return;
        handleStopCallback = cb ?? null;
        audioWorkletNode.port.postMessage('flush');
        clearInterval(flushInterval);
        inputNode.disconnect(analyzerNode);
        analyzerNode.disconnect(audioWorkletNode);
        closeAudioContext();
        state.isRecording = false;
        state.volume = 0;
    };
    const destroyMediaStream = () => {
        stopMediaStream();
        closeAudioContext();
        state.mediaStream = null;
    };
    const getState = () => ({ ...state });
    return {
        requestMicPermission,
        startRecording,
        stopRecording,
        destroyMediaStream,
        getState,
    };
}
export { createAudioRecorder };
