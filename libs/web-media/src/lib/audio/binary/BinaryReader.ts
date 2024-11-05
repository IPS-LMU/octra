/**
 * @Author Klaus Jänsch
 * Original: https://github.com/IPS-LMU/WebSpeechRecorderNg/blob/master/projects/speechrecorderng/src/lib/io/BinaryReader.ts
 * Extracted: 2024-11-04
 **/

export class BinaryByteReader {
    buf: Uint8Array;
    sbuf: Int8Array;
    private _pos: number;

    constructor(buf: ArrayBuffer) {
        this.buf = new Uint8Array(buf);
        this.sbuf = new Int8Array(buf);
        this._pos = 0;
    }

    get pos(): number {
        return this._pos;
    }

    set pos(pos: number) {
        this._pos = pos;
    }

    length(): number {
        return this.buf.byteLength;
    }

    eof(): boolean {
        return (this._pos >= this.buf.byteLength);
    }

    skip(byteCound: number) {
        this.pos += 4;
    }

    readAscii(size: number): String {
        let i;
        let txt = '';
        for (i = 0; i < size; i++) {
            txt += String.fromCharCode(this.buf[this._pos++]);
        }
        return txt;
    }

    readInt8(): number {
        return (this.buf[this._pos++]);
    }

    readInt16BE(): number {
        const b0 = this.sbuf[this._pos++];
        const b1 = this.buf[this._pos++];
        const val = (b0 << 8) | b1;
        return val;
    }

    readInt16LE(): number {
        const b0 = this.buf[this._pos++];
        const b1 = this.sbuf[this._pos++];
        const val = (b1 << 8) | b0;
        return val;
    }

    readUint16LE(): number {
        const seg = new Uint8Array(2);
        let i: number;
        for (i = 0; i < 2; i++) {
            seg[i] = this.buf[this._pos++];
        }
        let val = 0;
        val |= seg[1] << 8;
        val |= seg[0];
        return val;
    }

    readInt32BE(): number {
        const seg = new Uint8Array(4);
        let i: number;
        for (i = 0; i < 4; i++) {
            seg[i] = this.buf[this._pos++];
        }
        const val = seg[0] << 24 | seg[1] << 16 | seg[2] << 8 | seg[3];
        return val;
    }

    readUint32LE(): number {
        // this dircet data view does not work with nodejs: all avlues are zero
        // var seg=new Uint8Array(this.buf,this._pos,4);
        // ... copy value by value
        const seg = new Uint8Array(4);
        let i: number;
        for (i = 0; i < 4; i++) {
            seg[i] = this.buf[this._pos++];
        }
        // console.log("len:", seg.length, " ", seg.byteLength, " ", seg[0], " ", seg[1], " ", seg[2], " ", seg[3]);
        let val = 0;
        val |= seg[3] << 24;
        val |= seg[2] << 16;
        val |= seg[1] << 8;
        val |= seg[0];
        // var val = < 24(seg[3] <) | (seg[2] << 16) | (seg[1] << 8) | seg[0];
        // this._pos=this._pos+4;
        return val;
    }

    readFloat32(): number {
        const seg = new Float32Array(1);
        let i: number;
        for (i = 0; i < 4; i++) {
            seg[i] = this.buf[this._pos++];
        }
        return seg[0];
    }


}
