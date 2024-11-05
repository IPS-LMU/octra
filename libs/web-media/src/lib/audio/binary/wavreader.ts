/**
 * @author Klaus Jänsch
 * Original: https://github.com/IPS-LMU/WebSpeechRecorderNg/blob/master/projects/speechrecorderng/src/lib/audio/impl/wavreader.ts
 * Extracted: 2024-11-04
 */

import { WavFileFormat } from './wavformat';
import { PCMAudioFormat } from './format';
import { BinaryByteReader } from './BinaryReader';

export class WavReader {
  private br: BinaryByteReader;
  private format: PCMAudioFormat | null = null;
  private totalLength: number = 0;
  private dataChunkLength: number | null = null;

  constructor(data: ArrayBuffer) {
    this.br = new BinaryByteReader(data);
  }

  private readHeader() {
    const rh = this.br.readAscii(4);
    if (rh !== WavFileFormat.RIFF_KEY) {
      const errMsg = 'Expected RIFF header, not: ' + rh;
      throw new Error(errMsg);
    }
    const cl = this.br.readUint32LE();
    if (this.br.pos + cl !== this.br.length()) {
      throw new Error(
        'Wrong chunksize in RIFF header: ' +
          cl +
          ' (expected: ' +
          (this.br.length() - this.br.pos) +
          ' )'
      );
    }
    this.totalLength = cl;

    const rt = this.br.readAscii(4);
    if (rt !== WavFileFormat.WAV_KEY) {
      const errMsg = 'Expected ' + WavFileFormat.WAV_KEY + ' not: ' + rt;
      throw new Error(errMsg);
    }
  }

  readFormat(): PCMAudioFormat | null {
    this.br.pos = 0;
    this.readHeader();
    const s = this.navigateToChunk('fmt ');
    if (!s) {
      let errMsg = 'WAV file does not contain a fmt chunk';
      throw new Error(errMsg);
    }
    this.format = this.parseFmtChunk();
    return this.format;
  }

  private _frameLength(): number | null {
    let fl: number | null = null;
    if (this.format && this.dataChunkLength != null) {
      fl =
        this.dataChunkLength /
        this.format.channelCount /
        this.format.sampleSize;
    }
    return fl;
  }

  frameLength(): number | null {
    let fl: number | null = this._frameLength();
    if (fl === null) {
      this.readFormat();
      this.dataChunkLength = this.navigateToChunk('data');
      fl = this._frameLength();
    }
    return fl;
  }

  // Not tested yet!!!
  read(): AudioBuffer | null {
    this.br.pos = 0;
    let ab: AudioBuffer | null = null;
    this.readHeader();
    let s = this.navigateToChunk('fmt ');
    if (!s) {
      let errMsg = 'WAV file does not contain a fmt chunk';
      throw new Error(errMsg);
    }
    this.format = this.parseFmtChunk();
    this.dataChunkLength = this.navigateToChunk('data');
    let chsArr = this.readData();
    let sr = this.format?.sampleRate;
    let nChs = this.format?.channelCount;
    if (sr && chsArr && nChs && nChs > 0 && nChs == chsArr?.length) {
      ab = new AudioBuffer({
        length: chsArr[0].length,
        numberOfChannels: this.format?.channelCount,
        sampleRate: sr,
      });
      for (let ch = 0; ch < nChs; ch++) {
        ab.copyToChannel(chsArr[ch], ch);
      }
    }
    return ab;
  }

  private navigateToChunk(chunkString: string): number {
    // position after RIFF header
    // TODO assumes no other chunks except 'data'
    this.br.pos = 12;
    let chkStr = null;
    let chkLen = -1;
    while (!this.br.eof()) {
      chkStr = this.br.readAscii(4);
      chkLen = this.br.readUint32LE();
      if (chunkString === chkStr) {
        return chkLen;
      }
      this.br.pos += chkLen;
    }
    return chkLen;
  }

  private parseFmtChunk(): PCMAudioFormat | null {
    let pcmAf: PCMAudioFormat | null = null;
    const fmt = this.br.readUint16LE();
    if (
      fmt === WavFileFormat.PCM ||
      fmt == WavFileFormat.WAVE_FORMAT_IEEE_FLOAT
    ) {
      const channels = this.br.readUint16LE();
      const sampleRate = this.br.readUint32LE();

      // skip bandwidth
      this.br.skip(4);

      // frame size
      const frameSize = this.br.readUint16LE();

      // sample size in bits (PCM format only)
      const sampleSizeInBits = this.br.readUint16LE();

      pcmAf = new PCMAudioFormat(
        sampleRate,
        channels,
        frameSize / channels,
        sampleSizeInBits,
        fmt === WavFileFormat.WAVE_FORMAT_IEEE_FLOAT
      );
    }
    return pcmAf;
  }

  private readData(): Array<Float32Array> | null {
    let chsArr = null;
    if (this.format) {
      chsArr = new Array<Float32Array>(this.format.channelCount);
      const sampleCount =
        this.totalLength / this.format.channelCount / this.format.sampleSize;
      for (let ch = 0; ch < this.format.channelCount; ch++) {
        chsArr[ch] = new Float32Array(sampleCount);
      }
      if (this.format.encodingFloat) {
        // Not tested yet!
        for (let i = 0; i < this.totalLength / 4; i++) {
          for (let ch = 0; ch < this.format.channelCount; ch++) {
            chsArr[ch][i] = this.br.readFloat32();
          }
        }
      } else {
        if (this.format.sampleSize == 2) {
          for (let i = 0; i < this.totalLength / 2; i++) {
            for (let ch = 0; ch < this.format.channelCount; ch++) {
              const s16Ampl = this.br.readInt16LE();
              chsArr[ch][i] = s16Ampl / 32768;
            }
          }
        }
      }
    }
    return chsArr;
  }
}




