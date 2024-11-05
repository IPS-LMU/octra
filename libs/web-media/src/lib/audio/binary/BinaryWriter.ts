/**
 * @Author Klaus Jänsch
 * Original: https://github.com/IPS-LMU/WebSpeechRecorderNg/blob/master/projects/speechrecorderng/src/lib/io/BinaryWriter.ts
 * Extracted: 2024-11-04
 **/

export class BinaryByteWriter {
    static DEFAULT_SIZE_INC = 1024;
    buf: ArrayBuffer;
    private _pos: number;

    constructor() {
        const size = BinaryByteWriter.DEFAULT_SIZE_INC;
        this.buf = new ArrayBuffer(size);
        this._pos = 0;
    }

    get pos(): number {
        return this._pos;
    }

    ensureCapacity(numBytes: number) {

        while (this._pos + numBytes >= this.buf.byteLength) {
            // buffer increment
            let inc = BinaryByteWriter.DEFAULT_SIZE_INC;
            if (inc < numBytes) {
                inc = numBytes;
            }
            const newSize = this.buf.byteLength + inc;

            const arrOld = new Uint8Array(this.buf, 0, this._pos);
            const arrNew = new Uint8Array(newSize);
            arrNew.set(arrOld);
            this.buf = arrNew.buffer;
        }
    }

    writeUint8(val: number): void {
        this.ensureCapacity(1);
        const valView = new DataView(this.buf, this._pos, 1);
        valView.setUint8(0, val);
        this._pos++;
    }

    writeUint16(val: number, le: boolean): void {
        this.ensureCapacity(2);
        const valView = new DataView(this.buf, this._pos, 2);
        valView.setUint16(0, val, le);
        this._pos += 2;

    }

    writeInt16(val: number, le: boolean): void {
        this.ensureCapacity(2);
        const valView = new DataView(this.buf, this._pos, 2);
        valView.setInt16(0, val, le);
        this._pos += 2;
    }


    writeUint32(val: number, le: boolean): void {
        this.ensureCapacity(4);
        const valView = new DataView(this.buf, this._pos, 4);
        valView.setUint32(0, val, le);
        this._pos += 4;
    }

    writeInt32(val: number, le: boolean): void {
        this.ensureCapacity(4);
        const valView = new DataView(this.buf, this._pos, 4);
        valView.setInt32(0, val, le);
        this._pos += 4;
    }

    writeFloat(val: number) {
        this.ensureCapacity(4);
        const valView = new DataView(this.buf, this._pos, 4);
        valView.setFloat32(0, val, true);
        this._pos += 4;
    }

    finish(): Uint8Array {
        const finalArr = new Uint8Array(this._pos);
        const dv = new DataView(this.buf, 0, this._pos);
        for (let i = 0; i < this._pos; i++) {
            finalArr[i] = dv.getUint8(i);
        }
        return finalArr;
    }

    writeAscii(text: string): void {
        let i;
        for (i = 0; i < text.length; i++) {
            const asciiCode = text.charCodeAt(i);
            if (asciiCode < 0 || asciiCode > 255) {
                throw new Error('Not an ASCII character at char ' + i + ' in ' + text);
            }
            this.writeUint8(asciiCode);
        }
    }

}

