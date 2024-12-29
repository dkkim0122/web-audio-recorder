export interface AudioRecorderStates {
    mediaStream: MediaStream | null;
    isRecording: boolean;
    /**
     * volume of audio being recorded(0 to 1)
     */
    volume: number;
}
export interface AudioRecorderOptions {
    /**
     * An indicator of how many digital signals an analog voice signal will be split into per second
     * @default 44100(Hz)
    */
    sampleRate?: number;
    /**
      * Display the volume of voice recorded as a value between 0 and 1
      * @default true
    */
    enableAnalyzeVolume?: boolean;
    /**
     * Convert the audio being recorded to a wav file by cutting it off at certain intervals
     * @remarks
     * - `number`: Delivers recorded wav files at specified intervals (ms) through `onDataAvailable` callback
    */
    timeSlice?: number;
    /**
     * Callback function that receives recorded voice blob data at a certain `timeSlice` as an argument
     * @param {Blob} data - Blob data in mimeType audio/wav
     * @remarks called only if `timeSlice` is set
    */
    onDataAvailable?: (data: Blob) => void;
}
export interface AudioRecorderReturn {
    requestMicPermission: () => Promise<void>;
    startRecording: (opt: AudioRecorderOptions) => Promise<void>;
    /**
     * stop audio record
     * @param cb - A callback function that receives recorded wav audio chunk data as an argument.  Used when not in `timeSlice` mode
     */
    stopRecording: (cb?: (data: Blob) => void) => void;
    destroyMediaStream: () => void;
    getState: () => AudioRecorderStates;
}
