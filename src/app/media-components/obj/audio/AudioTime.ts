/**
 * class initialized with samples which can output other units like seconds, miliseconds
 */

export interface SampleTimeValues {
  unix: number;
  seconds: number;
}

export class SampleUnit {
  get samples(): number {
    return this._samples;
  }

  get sampleRate(): number {
    return this._sampleRate;
  }

  set sampleRate(value: number) {
    this._sampleRate = value;
  }

  public get unix(): number {
    return Math.round((this._samples * 1000) / this._sampleRate);
  }

  public set unix(value: number) {
    this._samples = value * this._sampleRate / 1000;
  }

  public get seconds(): number {
    if (!(this._samples === null || this._samples === undefined)) {
      if (!(this._sampleRate === null || this._sampleRate === undefined)) {
        return this._samples / this._sampleRate;
      } else {
        throw new Error(`sampleRate is undefined`);
      }
    } else {
      throw new Error(`value is undefined`);
    }
  }

  private _samples: number;
  private _sampleRate: number;

  public static calculateSamples(seconds: number, sampleRate: number) {
    if (sampleRate < 16000 || seconds < 0) {
      throw new Error('invalid parameters for sample calculation');
    } else {
      return Math.round(seconds * sampleRate);
    }
  }

  public static fromSeconds(seconds: number, sampleRate: number): SampleUnit {
    return new SampleUnit(seconds * sampleRate, sampleRate);
  }

  public static fromMiliSeconds(miliseconds: number, sampleRate: number): SampleUnit {
    return new SampleUnit(miliseconds / 1000 * sampleRate, sampleRate);
  }

  constructor(sample: number, sampleRate: number) {
    this._samples = Math.round(sample);
    this._sampleRate = Math.round(sampleRate);
  }

  public clone(): SampleUnit {
    return new SampleUnit(this._samples, this._sampleRate);
  }

  public sub(sample2: SampleUnit): SampleUnit {
    if (this.hasEqualSampleRate(sample2)) {
      return new SampleUnit(this._samples - sample2._samples, this._sampleRate);
    }
    throw Error('can\'t sub Sample because the sample rates are different.');
  }

  public add(sample2: SampleUnit): SampleUnit {
    if (this.hasEqualSampleRate(sample2)) {
      return new SampleUnit(this._samples + sample2._samples, this._sampleRate);
    }
    throw Error('can\'t add Sample because the sample rates are different.');
  }

  public equals(sample: SampleUnit): boolean {
    return (this._samples === sample._samples && this._sampleRate === sample.sampleRate);
  }

  public hasEqualSampleRate(sample2: SampleUnit) {
    return this._sampleRate === sample2.sampleRate;
  }

  public toString(): string {
    return `Samples: ${this._samples}`;
  }
}
