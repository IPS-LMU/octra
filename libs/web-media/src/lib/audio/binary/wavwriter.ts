/**
 * @author Klaus Jänsch
 * Original: https://github.com/IPS-LMU/WebSpeechRecorderNg/blob/master/projects/speechrecorderng/src/lib/audio/impl/wavwriter.ts
 * Original: WorkerHelper: https://github.com/IPS-LMU/WebSpeechRecorderNg/blob/master/projects/speechrecorderng/src/lib/utils/utils.ts
 * Extracted: 2024-11-04
 */

import { WavFileFormat } from './wavformat';
import { BinaryByteWriter } from './BinaryWriter';

declare function postMessage(message: any, transfer: Array<any>): void;

class WorkerHelper {
  static DEBUG = false;

  static buildWorkerBlobURL(workerFct: Function): string {
    if (!(workerFct instanceof Function)) {
      throw new Error('Parameter workerFct is not a function! (XSS attack?).');
    }
    let woFctNm = workerFct.name;
    if (WorkerHelper.DEBUG) {
      console.info('Worker method name: ' + woFctNm);
    }

    let woFctStr = workerFct.toString();
    if (WorkerHelper.DEBUG) {
      console.info('Worker method string:');
      console.info(woFctStr);
    }

    // Make sure code starts with "function()"

    // Chrome, Firefox: "[wofctNm](){...}", Safari: "function [wofctNm](){...}"
    // we need an anonymous function: "function() {...}"
    let piWoFctStr = woFctStr.replace(/^function +/, '');

    if (WorkerHelper.DEBUG) {
      console.info('Worker platform independent function string:');
      console.info(piWoFctStr);
    }

    // Convert to anonymous function
    let anonWoFctStr = piWoFctStr.replace(woFctNm + '()', 'function()');
    if (WorkerHelper.DEBUG) {
      console.info('Worker anonymous function string:');
      console.info(piWoFctStr);
    }
    // Self executing
    let ws = '(' + anonWoFctStr + ')();';
    if (WorkerHelper.DEBUG) {
      console.info('Worker self executing anonymous function string:');
      console.info(anonWoFctStr);
    }
    // Build the worker blob
    let wb = new Blob([ws], { type: 'text/javascript' });

    let workerBlobUrl = window.URL.createObjectURL(wb);
    return workerBlobUrl;
  }
}

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
  private workerURL: string | null = null;

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
  workerFunction() {
    self.onmessage = function (msg: MessageEvent) {
      const valView = new DataView(msg.data.buf, msg.data.bufPos);
      const sampleSizeInbytes = Math.round(msg.data.sampleSizeInBits / 8);
      let bufPos = 0;
      const hDynIntRange = 1 << (msg.data.sampleSizeInBits - 1);
      for (let s = 0; s < msg.data.frameLength; s++) {
        // interleaved channel data

        for (let ch = 0; ch < msg.data.chs; ch++) {
          const srcPos = ch * msg.data.frameLength + s;
          const valFlt = msg.data.audioData[srcPos];
          if (msg.data.encodingFloat === true) {
            valView.setFloat32(bufPos, valFlt, true);
            bufPos += 4;
          } else {
            const valInt = Math.round(valFlt * hDynIntRange);
            if (msg.data.sampleSizeInBits === 32) {
              valView.setInt32(bufPos, valInt, true);
            } else {
              valView.setInt16(bufPos, valInt, true);
            }
            bufPos += sampleSizeInbytes;
          }
        }
      }
      postMessage({ buf: msg.data.buf }, [msg.data.buf]);
      //self.close()
    };
  }

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

  writeAsync(
    channelData: Float32Array[],
    numberOfChannels: number,
    sampleRate: number,
    callback: (wavFileData: Uint8Array) => any
  ) {
    const dataChkByteLen = this.writeHeader(channelData, sampleRate);
    if (!this.workerURL) {
      this.workerURL = WorkerHelper.buildWorkerBlobURL(this.workerFunction);
    }
    const wo = new Worker(this.workerURL);

    const chs = numberOfChannels;
    const frameLength = channelData[0].length;
    const ad = new Float32Array(chs * frameLength);
    for (let ch = 0; ch < chs; ch++) {
      ad.set(channelData[ch], ch * frameLength);
    }
    // ensureCapacity blocks !!!
    this.bw.ensureCapacity(dataChkByteLen);
    wo.onmessage = (me) => {
      callback(me.data.buf);
      wo.terminate();
    };

    wo.postMessage(
      {
        encodingFloat: this.encodingFloat,
        sampleSizeInBits: this.sampleSizeInBits,
        chs: chs,
        frameLength: frameLength,
        audioData: ad,
        buf: this.bw.buf,
        bufPos: this.bw.pos,
      },
      [ad.buffer, this.bw.buf]
    );
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
