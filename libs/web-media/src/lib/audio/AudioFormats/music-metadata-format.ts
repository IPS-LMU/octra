import { parseBlob } from 'music-metadata';
import { AudioFormat } from './audio-format';

export class MusicMetadataFormat extends AudioFormat {
  protected override _decoder: 'web-audio' | 'octra' = 'web-audio';

  constructor() {
    super();
    this._supportedFormats = [
      {
        extension: '.flac',
        maxFileSize: 100000000, // 300 MB,
        info: 'The duration in samples is going to be estimated and may differ with the used application.',
      },
      {
        extension: '.ogg',
        maxFileSize: 100000000, // 300 MB
      },
      {
        extension: '.mp3',
        maxFileSize: 100000000, // 300 MB,
        info: 'The duration in samples is going to be estimated and may differ with the used application.',
      },
      {
        extension: '.m4a',
        maxFileSize: 100000000, // 300 MB,
        info: 'The duration in samples is going to be estimated and may differ with the used application.',
      },
    ];
  }

  public isValid(buffer: ArrayBuffer): boolean {
    return true;
  }

  override async readAudioInformation(buffer: ArrayBuffer) {
    const parsed = await parseBlob(
      new File([buffer], this._filename, { type: this._mimeType })
    );
    const format = parsed.format;

    if (
      !format.sampleRate ||
      !(format.numberOfSamples || format.duration) ||
      !format.numberOfChannels
    ) {
      throw new Error(
        "Can't read one of the following audio information: sampleRate, numberOfSamples, numberOfChannels."
      );
    } else {
      const numberOfSamples =
        format.numberOfSamples ??
        Math.ceil(format.duration! * format.sampleRate);
      this._sampleRate = format.sampleRate;
      this._duration = {
        samples: numberOfSamples,
        seconds: format.duration!,
      };
      this._channels = format.numberOfChannels;
    }
  }
}
