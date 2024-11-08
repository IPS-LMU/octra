/**
 * @author Klaus Jänsch
 * Original: https://github.com/IPS-LMU/WebSpeechRecorderNg/blob/master/projects/speechrecorderng/src/lib/audio/impl/wavwriter.ts
 * Original: WorkerHelper: https://github.com/IPS-LMU/WebSpeechRecorderNg/blob/master/projects/speechrecorderng/src/lib/utils/utils.ts
 * Extracted: 2024-11-04
 */

import { WavFileFormat } from './wavformat';
import { BinaryByteWriter } from './BinaryWriter';
import { TsWorker, TsWorkerJob } from '@octra/utilities';

export enum SampleSize {
  INT16 = 16,
  INT32 = 32,
}

export class WavWriter {
  static readonly DEFAULT_SAMPLE_SIZE: SampleSize = SampleSize.INT16;
  private readonly sampleSizeInBytes: number =
    WavWriter.DEFAULT_SAMPLE_SIZE.valueOf() / 8;
  private encodingFloat: boolean = false;
  private sampleSize = WavWriter.DEFAULT_SAMPLE_SIZE;
  private sampleSizeInBits = this.sampleSize.valueOf();
  private bw: BinaryByteWriter;
  private worker?: TsWorker;

  constructor(encodingFloat?: boolean, sampleSize?: SampleSize) {
    //console.debug("WavWriter: "+encodingFloat+", "+sampleSize);
    if (encodingFloat !== undefined && encodingFloat !== null) {
      this.encodingFloat = encodingFloat;
      if (encodingFloat) {
        this.sampleSize = SampleSize.INT32;
      } else {
        if (sampleSize) {
          this.sampleSize = sampleSize;
        }
      }
    } else if (sampleSize) {
      this.sampleSize = sampleSize;
    }
    this.sampleSizeInBits = this.sampleSize.valueOf();
    this.sampleSizeInBytes = Math.round(this.sampleSizeInBits / 8);

    this.bw = new BinaryByteWriter();
  }

  /*
   *  Method used as worker code.
   */
  workerFunction = (
    encodingFloat: boolean,
    sampleSizeInBits: number,
    chs: number,
    frameLength: number,
    audioData: Float32Array,
    buf: ArrayBuffer,
    buffPos: number
  ) => {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const valView = new DataView(buf, buffPos);
      const sampleSizeInbytes = Math.round(sampleSizeInBits / 8);
      let bufPos = 0;
      const hDynIntRange = 1 << (sampleSizeInBits - 1);
      for (let s = 0; s < frameLength; s++) {
        // interleaved channel data

        for (let ch = 0; ch < chs; ch++) {
          const srcPos = ch * frameLength + s;
          const valFlt = audioData[srcPos];
          if (encodingFloat === true) {
            valView.setFloat32(bufPos, valFlt, true);
            bufPos += 4;
          } else {
            const valInt = Math.round(valFlt * hDynIntRange);
            if (sampleSizeInBits === 32) {
              valView.setInt32(bufPos, valInt, true);
            } else {
              valView.setInt16(bufPos, valInt, true);
            }
            bufPos += sampleSizeInbytes;
          }
        }
      }
      resolve(buf);
    });
  };

  writeFmtChunk(channelData: Float32Array[], sampleRate: number) {
    if (this.encodingFloat) {
      this.bw.writeUint16(WavFileFormat.WAVE_FORMAT_IEEE_FLOAT, true);
    } else {
      this.bw.writeUint16(WavFileFormat.PCM, true);
    }
    const frameSize = this.sampleSizeInBytes * channelData.length;
    this.bw.writeUint16(channelData.length, true);
    this.bw.writeUint32(sampleRate, true);
    // dwAvgBytesPerSec
    this.bw.writeUint32(frameSize * sampleRate, true);
    this.bw.writeUint16(frameSize, true);
    // sample size in bits (PCM format only)
    this.bw.writeUint16(this.sampleSizeInBits, true);
    if (this.encodingFloat) {
      this.bw.writeUint16(0, true);
    }
  }

  writeFactChunk(ch0: Float32Array) {
    let sampleLen = 0;
    if (ch0) {
      sampleLen = ch0.length;
    }
    this.bw.writeUint32(sampleLen, true);
  }

  writeDataChunk(channelData: Float32Array[]) {
    const dataLen = channelData[0].length;
    if (this.encodingFloat) {
      for (let s = 0; s < dataLen; s++) {
        // interleaved channel data
        for (let ch = 0; ch < channelData.length; ch++) {
          const chData = channelData[ch];
          const valFlt = chData[s];
          this.bw.writeFloat(valFlt);
        }
      }
    } else {
      const hDynIntRange = 1 << (this.sampleSizeInBits - 1);
      for (let s = 0; s < dataLen; s++) {
        // interleaved channel data
        for (let ch = 0; ch < channelData.length; ch++) {
          const chData = channelData[ch];
          const valFlt = chData[s];
          const valInt = Math.round(valFlt * hDynIntRange);
          if (this.sampleSize === SampleSize.INT16) {
            this.bw.writeInt16(valInt, true);
          } else if (this.sampleSize === SampleSize.INT32) {
            this.bw.writeInt32(valInt, true);
          }
        }
      }
    }
  }

  writeChunkHeader(name: string, chkLen: number) {
    this.bw.writeAscii(name);
    this.bw.writeUint32(chkLen, true);
  }

  async writeAsync(channelData: Float32Array[], sampleRate: number) {
    return new Promise<Uint8Array>((resolve) => {
      const numberOfChannels = channelData.length;
      const dataChkByteLen = this.writeHeader(channelData, sampleRate);
      if (!this.worker) {
        this.worker = new TsWorker();
      }

      const chs = numberOfChannels;
      const frameLength = channelData[0].length;
      const ad = new Float32Array(chs * frameLength);
      for (let ch = 0; ch < chs; ch++) {
        ad.set(channelData[ch], ch * frameLength);
      }
      // ensureCapacity blocks !!!
      this.bw.ensureCapacity(dataChkByteLen);
      const job = new TsWorkerJob<
        [
          encodingFloat: boolean,
          sampleSizeInBits: number,
          chs: number,
          frameLength: number,
          audioData: Float32Array,
          buf: ArrayBuffer,
          buffPos: number
        ],
        ArrayBuffer
      >(
        this.workerFunction,
        this.encodingFloat,
        this.sampleSizeInBits,
        chs,
        frameLength,
        ad,
        this.bw.buf,
        this.bw.pos
      );
      this.worker.addJob(job);
      this.worker.jobstatuschange.subscribe({
        next: (job) => {
          if (job.status === 'finished') {
            resolve(new Uint8Array(job.result));
          }
        },
      });
    });
  }

  write(channelData: Float32Array[], sampleRate: number): Uint8Array {
    this.writeHeader(channelData, sampleRate);
    this.writeDataChunk(channelData);
    return this.bw.finish();
  }

  writeHeader(channelData: Float32Array[], sampleRate: number): number {
    this.bw.writeAscii(WavFileFormat.RIFF_KEY);
    let dataChkByteLen = 0;
    //const dataChkByteLen=audioBuffer.getChannelData(0).length*WavWriter.DEFAULT_SAMPLE_SIZE_BYTES*audioBuffer.numberOfChannels;
    const abChs = channelData.length;
    if (abChs > 0) {
      const abCh0 = channelData[0];
      dataChkByteLen = abCh0.length * this.sampleSizeInBytes * abChs;
    }
    let headerCnts = 3; //Wave,fmt and data

    let fmtChunkSize = 16;
    let factChunkSize = 4;
    if (this.encodingFloat) {
      fmtChunkSize = 18;
      headerCnts++; // fact
    } // Float encoding requires fmt extension (with zero length)
    let wavChunkByteLen = (4 + 4) * headerCnts;

    wavChunkByteLen += fmtChunkSize;
    wavChunkByteLen += factChunkSize;
    wavChunkByteLen += dataChkByteLen;

    this.bw.writeUint32(wavChunkByteLen, true); // must be set to file length-8 later
    this.bw.writeAscii(WavFileFormat.WAV_KEY);

    this.writeChunkHeader('fmt ', fmtChunkSize);
    this.writeFmtChunk(channelData, sampleRate);
    if (this.encodingFloat) {
      console.debug("Write WAV header: Write 'fact' chunk.");
      this.writeChunkHeader('fact', 4);
      this.writeFactChunk(channelData[0]);
    }
    this.writeChunkHeader('data', dataChkByteLen);
    return dataChkByteLen;
  }
}
