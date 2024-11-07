import { AudioFormat } from './audio-format';
import { MpegParser, parseBlob } from 'music-metadata-remastered';

export class MusicMetadataFormat extends AudioFormat {
  protected override _decoder: 'web-audio' | 'octra' = 'web-audio';

  constructor() {
    super();
    this._supportedFormats = [
      {
        extension: '.flac',
        maxFileSize: 300000000, // 300 MB,
        info: 'The duration in samples is going to be estimated and may differ with the used application.',
      },
      {
        extension: '.ogg',
        maxFileSize: 300000000, // 300 MB
      },
      {
        extension: '.mp3',
        maxFileSize: 300000000, // 300 MB,
        info: 'The duration in samples is going to be estimated and may differ with the used application.',
      },
      {
        extension: '.m4a',
        maxFileSize: 300000000, // 300 MB,
        info: 'The duration in samples is going to be estimated and may differ with the used application.',
      },
    ];
  }

  public isValid(buffer: ArrayBuffer): boolean {
    return true;
  }

  override async readAudioInformation(buffer: ArrayBuffer) {
    const parsed = await parseBlob(
      new File([buffer], this._filename, { type: this._mimeType }),
      MpegParser
    );
    const format = parsed.format;

    if (
      !format.sampleRate ||
      !format.numberOfSamples ||
      !format.numberOfChannels
    ) {
      throw new Error(
        "Can't read one of the following audio information: sampleRate, numberOfSamples, numberOfChannels."
      );
    } else {
      this._sampleRate = format.sampleRate;
      this._duration = {
        samples: format.numberOfSamples,
        seconds: format.duration!,
      };
      this._channels = format.numberOfChannels;
    }
  }
}
