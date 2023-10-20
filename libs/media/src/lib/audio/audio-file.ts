export interface IAudioFile {
  name: string;
  size: number;
  duration: number;
  sampleRate: number;
  url?: string;
  type: string;
}

export class OAudiofile implements IAudioFile {
  name!: string;
  // need type attribute
  arraybuffer?: ArrayBuffer;
  size!: number;
  duration!: number;
  sampleRate!: number;
  url?: string;
  type!: string;
}
