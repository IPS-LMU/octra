export type IntArray = Uint8Array | Int16Array | Int32Array;

export interface SupportedAudioFormat {
  extension: string;
  maxFileSize: number;
  variableNumberOfSamples?: boolean;
  warning?: string;
  info?: string;
}

export abstract class AudioFormat {
  get mimeType(): string {
    return this._mimeType;
  }
  public formatConstructor!:
    | Uint8ArrayConstructor
    | Int16ArrayConstructor
    | Int32ArrayConstructor;

  get supportedFormats(): SupportedAudioFormat[] {
    return this._supportedFormats;
  }
  get decoder(): "web-audio" | "octra" {
    return this._decoder;
  }

  protected _filename!: string;

  get filename(): string {
    return this._filename;
  }

  protected _sampleRate!: number;

  get sampleRate(): number {
    return this._sampleRate;
  }

  protected _channels!: number;

  get channels(): number {
    return this._channels;
  }

  protected _byteRate!: number;

  get byteRate(): number {
    return this._byteRate;
  }

  protected _bitsPerSample!: number;

  get bitsPerSample(): number {
    return this._bitsPerSample;
  }

  protected _duration!: {
    samples: number;
    seconds: number;
  };

  get duration(): {
    samples: number;
    seconds: number;
  } {
    return this._duration;
  }

  protected _supportedFormats!: SupportedAudioFormat[];
  protected _mimeType!: string;
  protected _decoder: "web-audio" | "octra" = "web-audio";

  public async init(filename: string, mimeType: string, buffer: ArrayBuffer) {
    this._filename = filename;
    this._mimeType = mimeType;
    await this.readAudioInformation(buffer);
  }

  public abstract isValid(buffer: ArrayBuffer): boolean;
  protected abstract readAudioInformation(buffer: ArrayBuffer): Promise<void>;
}
