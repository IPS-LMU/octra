import {AudioFormat} from './audio-format';

// specification found on https://wiki.xiph.org/OggVorbis
// https://www.ietf.org/rfc/rfc3533.txt
// https://web.mit.edu/cfox/share/doc/libvorbis-1.0/vorbis-spec-ref.html
export class OggFormat extends AudioFormat {
  version: number;
  headerType: number;
  /**
   * A granule position is the time marker in Ogg files. It is an abstract value, whose meaning is determined by the codec.
   * It may, for example, be a count of the number of samples, the number of frames or a more complex scheme.
   */
  granulePosition: number;
  bitStreamLength: number;

  constructor() {
    super();
    this._extension = '.ogg';
  }

  public isValid(buffer: ArrayBuffer): boolean {
    const bufferPart = buffer.slice(0, 4);
    let test = String.fromCharCode.apply(undefined, new Uint8Array(bufferPart) as any);
    test = test.slice(0, 6);
    return (test === 'OggS');
  }

  protected setSampleRate(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(40, 42);
    const bufferView = new Uint16Array(bufferPart);
    this._sampleRate = bufferView[0];
  }

  protected setChannels(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(39, 40);
    const bufferView = new Uint8Array(bufferPart);
    this._channels = bufferView[1];
  }

  protected setBitsPerSample(buffer: ArrayBuffer) {
    const bufferPart = buffer.slice(48, 52);
    const bufferView = new Uint32Array(bufferPart);

    this._bitsPerSample = bufferView[0];
  }

  protected setByteRate() {
    this._byteRate = 0;
  }

  protected setDuration() {

  }

  override init(filename: string, buffer: ArrayBuffer) {
    super.init(filename, buffer);
    const test = OggVorbisPage.readFromBuffer(buffer);
    const t = '';
  }
}

enum OggVorbisHeaderType {
  'IDENTIFICATION' = 1,
  'COMMENT' = 3,
  'SETUP' = 5
}

class OggVorbisPage {
  capturePattern: string;
  version: number;
  headerType: number;
  granulePosition: number;
  bitstreamSerialNumber: number;
  pageSequenceNumber: number;
  checksum: number;
  pageSegments: number;

  segmentLengthTable: number[] = [];
  byteLength = 0;
  pointer = 0;

  identificationHeader?: {
    packetType: OggVorbisHeaderType;
    vorbis: string;
    vorbisVersion: number;
    audioChannels: number;
    audioSampleRate: number;
    bitrateMaximum: number;
    bitrateNominal: number;
    bitrateMinimum: number;
    blocksize0: number;
    blocksize1: number;
    framingFlag: number;
  }

  commentHeader?: {
    vorbis: string;
    framingBit: number;
    fields: {
      name: string;
      value: string;
    }[]
  }

  constructor(partial?: Partial<OggVorbisPage>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  readOnePage(buffer: ArrayBuffer, start: number) {
    this.pointer = start;
    this.readCapturePattern(buffer);
    this.readVersion(buffer);
    this.readHeaderType(buffer);
    this.setGranulePosition(buffer);
    this.setBitstreamSerialNumber(buffer);
    this.readPageSequenceNumber(buffer);
    this.readChecksum(buffer);
    this.readPageSegments(buffer);
    this.readSegmentTable(buffer);

    this.readIdentificationHeader(buffer);
    this.readCommentHeader(buffer);
    this.readSetupHeader(buffer);
  }

  readIdentificationHeader(buffer: ArrayBuffer) {
    const packetType = this.sliceInt(buffer, 1, 'uint8', true, false);

    if (packetType === OggVorbisHeaderType.IDENTIFICATION) {
      this.byteLength += 1;
      this.pointer += 1;
      this.identificationHeader = {
        packetType,
        vorbis: this.sliceString(buffer, 6),
        vorbisVersion: this.sliceInt(buffer, 4, 'uint32'),
        audioChannels: this.sliceInt(buffer, 1, 'uint8'),
        audioSampleRate: this.sliceInt(buffer, 4, 'uint32'),
        bitrateMaximum: this.sliceInt(buffer, 4, 'int32') + 1,
        bitrateNominal: this.sliceInt(buffer, 4, 'int32'),
        bitrateMinimum: this.sliceInt(buffer, 4, 'int32') + 1,
        blocksize0: -1,
        blocksize1: -1,
        framingFlag: -1
      }

      const blockSizes = this.sliceBits(buffer, 1, [4, 4], 'uint8');
      this.identificationHeader.blocksize0 = blockSizes[0];
      this.identificationHeader.blocksize1 = blockSizes[1];
      this.identificationHeader.framingFlag = this.sliceInt(buffer, 1, 'uint8')
    }
  }

  readCommentHeader(buffer: ArrayBuffer) {
    const packetType = this.sliceInt(buffer, 1, 'uint8', true, false);

    if (packetType === OggVorbisHeaderType.COMMENT) {
      this.byteLength += 1;
      this.pointer += 1;
      this.commentHeader = {
        vorbis: this.sliceString(buffer, 6),
        framingBit: -1,
        fields: []
      };

      const firstLength = this.sliceInt(buffer, 4, 'uint32');
      const vendor = this.sliceString(buffer, firstLength);
      const commentListLength = this.sliceInt(buffer, 4, 'uint32');

      for (let i = 0; i < commentListLength; i++) {
        const length = this.sliceInt(buffer, 4, 'uint32');
        const comment = this.sliceString(buffer, length);

        if (comment.indexOf('=') > -1) {
          const values = comment.split('=', 2);
          this.commentHeader.fields.push({
            name: values[0],
            value: values[1]
          });
        }

        this.commentHeader.framingBit = this.sliceInt(buffer, 1, 'uint8');

        if (this.commentHeader.framingBit !== 1) {
          throw new Error('Error reading comment header, framing bit is unset.')
        }
        const t = '';
      }

      const t = '';
    }
  }

  readSetupHeader(buffer: ArrayBuffer) {
    const packetType = this.sliceInt(buffer, 1, 'uint8', true, false);

    if (packetType === OggVorbisHeaderType.SETUP) {
      this.byteLength += 1;
      this.pointer += 1;
    }
  }

  private sliceBytes(buffer: ArrayBuffer, length: number, incrementPointer = true): DataView {
    const view = new DataView(buffer, this.pointer, length);
    if (incrementPointer) {
      this.byteLength += length;
      this.pointer += length;
    }
    return view;
  }

  private sliceInt(buffer: ArrayBuffer, length: number, type: 'uint8' | 'uint16' | 'uint32' | 'uint64' | 'int8'
    | 'int16' | 'int32' | 'int64', littleEndian = true, incrementPointer = true): number {
    const view = this.sliceBytes(buffer, length, incrementPointer);

    switch (type) {
      case 'int8':
        return view.getInt8(0);
      case 'uint8':
        return view.getUint8(0);
      case 'int16':
        return view.getInt16(0, littleEndian);
      case 'uint16':
        return view.getUint16(0, littleEndian);
      case 'int32':
        return view.getInt32(0, littleEndian);
      case 'uint32':
        return view.getUint32(0, littleEndian);
    }

    return undefined;
  }

  private sliceBits(buffer: ArrayBuffer, length: number, selectedBits: number[], type: 'uint8' | 'uint16' | 'uint32'
    | 'uint64' | 'int8' | 'int16' | 'int32' | 'int64'): number[] {
    const result: number[] = [];
    const number = this.sliceInt(buffer, length, type);
    let bitStr = Number(number).toString(2);
    const len = bitStr.length;
    for (let i = len; i < length * 8; i++) {
      bitStr = `0${bitStr}`;
    }

    for (const selectedBit of selectedBits) {
      const substr = bitStr.substring(0, selectedBit);
      bitStr = bitStr.substring(selectedBit);
      result.push(parseInt(substr, 2));
    }

    return result;
  }

  private sliceString(buffer: ArrayBuffer, length: number): string {
    const bufferPart = buffer.slice(this.pointer, this.pointer + length);
    const array = new Uint8Array(bufferPart);
    this.byteLength += length;
    this.pointer += length;
    return String.fromCharCode.apply(undefined, array);
  }

  private readCapturePattern(buffer: ArrayBuffer) {
    this.capturePattern = this.sliceString(buffer, 4)?.slice(0, 6);
  }

  private readVersion(buffer: ArrayBuffer) {
    this.version = this.sliceInt(buffer, 1, 'uint8');
  }

  private readHeaderType(buffer: ArrayBuffer) {
    this.headerType = this.sliceInt(buffer, 1, 'uint8');
  }

  private setGranulePosition(buffer: ArrayBuffer) {
    this.granulePosition = this.sliceInt(buffer, 8, 'uint32');
  }

  private setBitstreamSerialNumber(buffer: ArrayBuffer) {
    this.bitstreamSerialNumber = this.sliceInt(buffer, 4, 'uint32');
  }

  private readPageSequenceNumber(buffer: ArrayBuffer) {
    this.pageSequenceNumber = this.sliceInt(buffer, 4, 'uint32');
  }

  private readChecksum(buffer: ArrayBuffer) {
    this.checksum = this.sliceInt(buffer, 4, 'uint32');
  }

  private readPageSegments(buffer: ArrayBuffer) {
    this.pageSegments = this.sliceInt(buffer, 1, 'uint8');
  }

  private readSegmentTable(buffer: ArrayBuffer) {
    //length is equal to pageSegments
    for (let i = 0; i < this.pageSegments; i++) {
      this.segmentLengthTable.push(
        this.sliceInt(buffer, 1, 'uint8')
      );
    }
  }

  public static readFromBuffer(buffer: ArrayBuffer) {
    const result = new OggVorbisPage();
    result.readOnePage(buffer, 0);

    const result2 = new OggVorbisPage();
    result2.readOnePage(buffer, result.byteLength);


    return result;
  }
}
